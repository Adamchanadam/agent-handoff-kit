import * as defaultFs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const DEFAULT_FOOTPRINT_BUDGET_MS = 4000;

// A host that forbids child processes (for example a sandbox) reports EPERM or EACCES.
export const spawnFailureReason = error => ['EPERM', 'EACCES'].includes(error?.code) ? 'spawn-denied' : 'spawn-failed';

export async function collectFootprint(root, options = {}) {
  const started = performance.now();
  const result = { status: 'complete', files: 0, bytes: 0n, linksSkipped: 0, otherFilesystems: 0, unreadable: 0, changed: 0, identityUnchecked: 0, abandonedInFlight: 0, elapsedMs: 0, top: [] };
  let active = 0, stopped = false, timedOut = false, limited = false, internal = false;
  let limitReason;
  const handles = new Set();
  let wake = () => {};
  let timer;
  const tops = new Map();
  try {
    const fs = options.fs ?? defaultFs;
    const budget = Number.isFinite(options.budgetMs) ? Math.max(0, options.budgetMs) : DEFAULT_FOOTPRINT_BUDGET_MS;
    const limit = Number.isFinite(options.maxInFlight) ? Math.max(1, Math.floor(options.maxInFlight)) : 32;
    const queueLimit = Number.isFinite(options.maxQueuedDirs) ? Math.max(0, Math.floor(options.maxQueuedDirs)) : 100000;
    const deadline = started + budget;
    const signal = () => { const fn = wake; wake = () => {}; fn(); };
    const closing = new Set();
    const close = dir => {
      if (closing.has(dir)) return;
      handles.add(dir); closing.add(dir); active++;
      let promise;
      try { promise = dir.close(); } catch { promise = Promise.reject(); }
      Promise.resolve(promise).catch(() => {}).finally(() => { handles.delete(dir); closing.delete(dir); active--; signal(); });
    };
    const finishDeadline = () => { if (!stopped) { timedOut = true; stopped = true; signal(); } };
    timer = setTimeout(finishDeadline, Math.max(0, deadline - performance.now()));
    const expired = () => { if (performance.now() >= deadline) finishDeadline(); return stopped; };
    // Synchronous throws indicate an invalid implementation, while promise rejections
    // are ordinary filesystem errors. Every call, including realpath, is bounded.
    const start = (method, args, done) => {
      if (expired()) return false;
      let promise;
      try { promise = fs[method](...args); } catch { internal = true; stopped = true; signal(); return false; }
      active++;
      Promise.resolve(promise).then(value => {
        if (!stopped && !expired()) done(null, value);
        else if (method === 'opendir') close(value);
      }, error => {
        if (!stopped && !expired()) done(error);
      }).catch(() => { if (!stopped) { internal = true; stopped = true; } }).finally(() => { active--; signal(); });
      return true;
    };
    const wait = () => new Promise(resolve => { wake = resolve; });
    const one = async (method, args) => {
      let settled = false, error, value;
      start(method, args, (e, v) => { error = e; value = v; settled = true; });
      while (!settled && !stopped) await wait();
      return { error, value };
    };
    const rootPath = path.resolve(root);
    const rootStat = await one('lstat', [rootPath, { bigint: true }]);
    if (!stopped) {
      if (rootStat.error) {
        if (rootStat.error.code === 'ENOENT') { result.status = 'skipped'; result.reason = 'root-missing'; }
        else { result.status = 'skipped'; result.reason = 'root-unreadable'; }
      } else if (rootStat.value.isSymbolicLink()) { result.status = 'skipped'; result.reason = 'root-link'; }
      else if (!rootStat.value.isDirectory()) { result.status = 'skipped'; result.reason = 'root-not-directory'; }
      else {
        const real = await one('realpath', [rootPath]);
        if (!stopped) {
          if (real.error) { result.status = 'skipped'; result.reason = real.error.code === 'ENOENT' ? 'root-missing' : 'root-unreadable'; }
          else {
            const norm = p => process.platform === 'win32' ? path.resolve(p).toLowerCase() : path.resolve(p);
            if (norm(real.value) !== norm(rootPath)) { result.status = 'skipped'; result.reason = 'root-alias'; }
            else {
              const lock = await one('lstat', [path.join(rootPath, 'dev', 'governance_migrations', '.upgrade.lock'), { bigint: true }]);
              if (stopped) { /* deadline or internal error */ }
              else if (!lock.error || lock.error.code !== 'ENOENT') {
                result.status = 'skipped';
                result.reason = lock.error ? 'upgrade-lock-unknown' : 'upgrade-lock';
              } else {
              const dirs = queueLimit ? [{ path: rootPath, top: null, dev: rootStat.value.dev, ino: rootStat.value.ino }] : [];
              if (!queueLimit) { limited = true; limitReason = 'queue-limit'; stopped = true; }
              const listings = [];
              const errorEntry = e => { if (e?.code === 'ENOENT') result.changed++; else result.unreadable++; };
              const stopLimit = reason => { limited = true; limitReason = reason; stopped = true; signal(); };
              const addDir = item => { if (dirs.length >= queueLimit) stopLimit('queue-limit'); else dirs.push(item); };
              // Each pending directory and listing occupies one slot; pending file stats use the rest.
              while (!stopped) {
                let progressed = false;
                while (!stopped && active < limit) {
                  if (expired()) break;
                  let ready;
                  for (let i = listings.length - 1; i >= 0; i--) if (!listings[i].busy) { ready = listings[i]; break; }
                  if (dirs.length && handles.size + listings.filter(x => x.opening).length < limit) {
                    const dir = dirs.pop();
                    const slot = { ...dir, opening: true, busy: true }; listings.push(slot);
                    // Path APIs retain a check-to-open window; this is neither race-free containment nor a consistent snapshot.
                    start('lstat', [dir.path, { bigint: true }], (error, stat) => {
                      if (error) { listings.splice(listings.indexOf(slot), 1); errorEntry(error); return; }
                      if (!stat.isDirectory() || stat.isSymbolicLink()) { listings.splice(listings.indexOf(slot), 1); result.changed++; return; }
                      if (dir.dev !== stat.dev) { listings.splice(listings.indexOf(slot), 1); result.changed++; return; }
                      if (dir.ino === 0n && stat.ino === 0n) result.identityUnchecked++;
                      else if (dir.ino !== stat.ino) { listings.splice(listings.indexOf(slot), 1); result.changed++; return; }
                      const open = () => start('opendir', [dir.path, { bufferSize: 256 }], (e, handle) => {
                        if (e) { listings.splice(listings.indexOf(slot), 1); errorEntry(e); return; }
                        handles.add(handle); slot.handle = handle; slot.opening = false; slot.busy = false;
                      });
                      if (dir.path === rootPath) open();
                      else start('realpath', [dir.path], (e, actual) => {
                        if (e) { listings.splice(listings.indexOf(slot), 1); errorEntry(e); return; }
                        const expected = path.join(real.value, path.relative(rootPath, dir.path));
                        if (norm(actual) !== norm(expected)) { listings.splice(listings.indexOf(slot), 1); result.changed++; return; }
                        open();
                      });
                    });
                    progressed = true;
                  } else if (ready) {
                    ready.busy = true;
                    // Wrap handle operations as injected calls for the same deadline and accounting.
                    let promise;
                    try { promise = ready.handle.read(); } catch { internal = true; stopped = true; signal(); break; }
                    active++;
                    Promise.resolve(promise).then(entry => {
                      if (stopped || expired()) return;
                      ready.busy = false;
                      if (!entry) { listings.splice(listings.indexOf(ready), 1); close(ready.handle); return; }
                      if (entry.isSymbolicLink()) { result.linksSkipped++; return; }
                      if (!entry.isDirectory() && !entry.isFile()) return;
                      const entryPath = path.join(ready.path, entry.name);
                      const top = ready.top ?? (entry.isFile() ? '(root files)' : entry.name);
                      if (!tops.has(top)) {
                        if (tops.size >= 10000) { stopLimit('top-limit'); return; }
                        tops.set(top, { name: top, bytes: 0n, files: 0 });
                      }
                      start('lstat', [entryPath, { bigint: true }], (error, stat) => {
                        if (error) return errorEntry(error);
                        if (entry.isDirectory()) {
                          if (!stat.isDirectory() || stat.isSymbolicLink()) { result.changed++; return; }
                          // A directory on another device is a mount (for example a volume or network share), not project data.
                          if (stat.dev !== rootStat.value.dev) { result.otherFilesystems++; return; }
                          addDir({ path: entryPath, top, dev: stat.dev, ino: stat.ino });
                        } else {
                          if (!stat.isFile() || stat.isSymbolicLink()) { result.changed++; return; }
                          const item = tops.get(top); item.bytes += stat.size; item.files++;
                          result.bytes += stat.size; result.files++;
                        }
                      });
                    }, error => {
                      if (!stopped && !expired()) { listings.splice(listings.indexOf(ready), 1); close(ready.handle); errorEntry(error); }
                    }).catch(() => { if (!stopped) { internal = true; stopped = true; signal(); } }).finally(() => { active--; signal(); });
                    progressed = true;
                  } else break;
                }
                if (stopped || (!active && !dirs.length && !listings.length)) break;
                if (!progressed || active) await wait();
              }
              for (const handle of handles) close(handle);
              }
            }
          }
        }
      }
    }
    if (internal) { stopped = true; return { status: 'unavailable', abandonedInFlight: active }; }
    if (timedOut) result.status = 'partial';
    else if (limited || result.unreadable || result.changed) result.status = 'incomplete';
    if (limited) result.reason = limitReason;
    result.abandonedInFlight = active;
    result.top = Array.from(tops.values()).filter(x => x.files > 0);
    result.elapsedMs = performance.now() - started;
    stopped = true;
    return result;
  } catch {
    stopped = true;
    return { status: 'unavailable', abandonedInFlight: active };
  } finally { stopped = true; clearTimeout(timer); }
}

function safeName(value) {
  const name = String(value);
  if (/(?:[A-Fa-f0-9]{32,}|[A-Za-z0-9]{32,})/.test(name) || /^(?:sk-|ghp_|gho_|github_pat_|xox|AKIA|AIza|glpat-|npm_|eyJ)/i.test(name)) return '<redacted>';
  const clean = name.replace(/[\p{Cc}\p{Cf}`]/gu, '?').replace(/~{3,}/g, '?').replace(/\s+/gu, ' ').trim();
  return Array.from(clean).length > 40 ? Array.from(clean).slice(0, 39).join('') + '…' : clean;
}

export function formatFootprintLine(result, { worktrees } = {}) {
  try {
    const suffix = worktrees === 'unverified' || (Number.isInteger(worktrees) && worktrees >= 0) ? `; registered Git worktrees: ${worktrees}` : '';
    const bounded = line => line.length + suffix.length > 300 ? line.slice(0, 299 - suffix.length).replace(/[\uD800-\uDBFF]$/, '') + '…' + suffix : line + suffix;
    if (result.status === 'unavailable') return bounded(result.reason === 'spawn-denied' ? '📦 Footprint: unavailable (helper process not permitted)' : '📦 Footprint: unavailable');
    if (result.status === 'skipped') {
      const reasons = { 'root-unreadable': 'root is unreadable', 'root-link': 'root is a link', 'root-missing': 'root is missing', 'root-not-directory': 'root is not a directory', 'root-alias': 'root is an alias', 'upgrade-lock': 'upgrade lock present', 'upgrade-lock-unknown': 'upgrade lock state unknown' };
      return bounded(`📦 Footprint: skipped (${reasons[result.reason] ?? 'unknown reason'})`);
    }
    const gib = (bytes, floor) => {
      const scaled = BigInt(bytes) * 100n;
      const divisor = 1073741824n;
      const hundredths = floor ? scaled / divisor : (scaled + divisor / 2n) / divisor;
      return `${hundredths / 100n}.${String(hundredths % 100n).padStart(2, '0')}`;
    };
    const files = Number(result.files).toLocaleString('en-US');
    let line;
    if (result.status === 'complete') {
      const top = [...result.top].sort((a, b) => a.bytes === b.bytes ? String(a.name).localeCompare(String(b.name), 'en') : a.bytes > b.bytes ? -1 : 1).slice(0, 3);
      const completeLine = () => `📦 Footprint (apparent): ${gib(result.bytes, false)} GiB / ${files} files` + (top.length ? `; largest: ${top.map(x => `${safeName(x.name)} ${gib(x.bytes, false)} GiB`).join(', ')}` : '');
      line = completeLine();
      const counters = [['linksSkipped', 'links skipped'], ['otherFilesystems', 'other filesystems skipped'], ['unreadable', 'unreadable'], ['changed', 'changed']].filter(([key]) => result[key]).map(([key, label]) => `; ${label}: ${result[key]}`).join('');
      while (line.length + counters.length + suffix.length > 300 && top.length) { top.pop(); line = completeLine(); }
      line += counters;
    } else {
      const reason = result.status === 'partial' ? 'scan stopped at the time limit' : result.reason === 'top-limit' ? 'too many top-level entries' : result.reason === 'queue-limit' ? 'queue limit reached' : result.unreadable ? 'some entries unreadable' : 'entries changed during scan';
      line = `📦 Footprint (apparent): observed at least ${gib(result.bytes, true)} GiB / ${files} files; ${reason}`;
      for (const [key, label] of [['linksSkipped', 'links skipped'], ['otherFilesystems', 'other filesystems skipped'], ['unreadable', 'unreadable'], ['changed', 'changed']]) if (result[key]) line += `; ${label}: ${result[key]}`;
    }
    return bounded(line);
  } catch { return '📦 Footprint: unavailable'; }
}

const modulePath = fileURLToPath(import.meta.url);
const orderedTop = top => [...top].sort((a, b) => a.bytes === b.bytes ? String(a.name).localeCompare(String(b.name), 'en') : a.bytes > b.bytes ? -1 : 1).slice(0, 3);

export async function runFootprintSupervised(root, { budgetMs = DEFAULT_FOOTPRINT_BUDGET_MS, graceMs = 750, maxOutputBytes = 16384, execPath = process.execPath, childScript = modulePath, childArgs, onSpawn } = {}) {
  return new Promise(resolve => {
    let child, timer, settled = false, output = Buffer.alloc(0);
    const done = value => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      if (child) {
        child.removeListener('close', onExit);
        child.stdout?.removeListener('data', onData);
        child.stdout?.destroy();
        try { child.kill('SIGKILL'); } catch {}
        child.unref();
      }
      resolve(value);
    };
    const fail = reason => done({ status: 'unavailable', reason });
    const onExit = () => fail('child-failed');
    const onData = chunk => {
      output = Buffer.concat([output, chunk]);
      if (output.length > maxOutputBytes) return fail('output-too-large');
      const end = output.indexOf(10);
      if (end < 0) return;
      try {
        const value = JSON.parse(output.subarray(0, end).toString('utf8'));
        const count = x => Number.isSafeInteger(x) && x >= 0;
        const decimal = x => typeof x === 'string' && /^\d+$/.test(x);
        if (!value || typeof value !== 'object' || !['complete', 'partial', 'incomplete', 'skipped', 'unavailable'].includes(value.status) ||
            (value.reason !== undefined && typeof value.reason !== 'string') || !count(value.files) || !decimal(value.bytes) ||
            !count(value.linksSkipped) || !count(value.otherFilesystems) || !count(value.unreadable) || !count(value.changed) ||
            (value.status === 'complete' && (!Array.isArray(value.top) || value.top.length > 3 || !value.top.every(x => x && typeof x.name === 'string' && decimal(x.bytes) && count(x.files)))) ||
            (value.status !== 'complete' && value.top !== undefined)) return fail('invalid-output');
        value.bytes = BigInt(value.bytes);
        if (value.top) value.top = value.top.map(x => ({ ...x, bytes: BigInt(x.bytes) }));
        done(value);
      } catch { fail('invalid-output'); }
    };
    try {
      child = spawn(execPath, childArgs ?? [childScript, '--footprint-child', root, String(budgetMs)], { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true });
      child.on('error', error => fail(spawnFailureReason(error)));
      onSpawn?.(child);
      child.on('close', onExit);
      child.stdout.on('data', onData);
      child.stdout.on('error', () => fail('child-failed'));
      timer = setTimeout(() => fail('timeout'), Math.max(0, budgetMs + graceMs));
    } catch (error) { fail(spawnFailureReason(error)); }
  });
}

const direct = process.argv[1] && (process.platform === 'win32'
  ? path.resolve(process.argv[1]).toLowerCase() === path.resolve(modulePath).toLowerCase()
  : path.resolve(process.argv[1]) === path.resolve(modulePath));
if (direct && process.argv[2] === '--footprint-child') {
  const result = await collectFootprint(process.argv[3], { budgetMs: Number(process.argv[4]) });
  const compact = { status: result.status, ...(result.reason ? { reason: result.reason } : {}), files: result.files ?? 0, bytes: String(result.bytes ?? 0n), linksSkipped: result.linksSkipped ?? 0, otherFilesystems: result.otherFilesystems ?? 0, unreadable: result.unreadable ?? 0, changed: result.changed ?? 0 };
  if (result.status === 'complete') compact.top = orderedTop(result.top).map(x => ({ name: safeName(x.name), bytes: String(x.bytes), files: x.files }));
  process.stdout.write(JSON.stringify(compact) + '\n');
}
