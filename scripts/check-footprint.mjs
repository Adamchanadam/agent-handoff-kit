import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { collectFootprint, formatFootprintLine, runFootprintSupervised, DEFAULT_FOOTPRINT_BUDGET_MS, spawnFailureReason } from '../bin/footprint.mjs';
import { createQaTempTracker } from './qa-temp-cleanup.mjs';

const tracker = createQaTempTracker('footprint');
const temp = tracker.mkdtemp(path.join(process.env.AGENT_HANDOFF_KIT_QA_TMP || os.tmpdir(), 'ahk-footprint-test-'));
const root = path.join(temp, 'fixture');
fs.mkdirSync(root);
let failed = false;
async function test(name, fn) {
  try { const skip = await fn(); console.log(skip ? `SKIP ${name}: ${skip}` : `PASS ${name}`); }
  catch (error) { failed = true; console.log(`FAIL ${name}: ${error.message.replace(/\s+/g, ' ')}`); }
}
const stat = (type, ino = 1n, dev = 1n) => ({ dev, ino, isDirectory: () => type === 'dir', isFile: () => type === 'file', isSymbolicLink: () => type === 'link', size: 1n });
const dirent = (name, type) => ({ name, ...stat(type) });
const fakeRoot = path.resolve(root);
const lockPath = path.join(fakeRoot, 'dev', 'governance_migrations', '.upgrade.lock');
const missing = () => Object.assign(new Error('missing'), { code: 'ENOENT' });
const makeFake = (overrides = {}) => {
  const fake = { lstat: async p => stat(p === fakeRoot ? 'dir' : 'file'), realpath: async p => p, ...overrides };
  if (!fake.opendir) fake.opendir = async p => { const entries = await (fake.listing?.(p) ?? []); let i = 0; return { read: async () => entries[i++] ?? null, close: async () => {} }; };
  const lstat = fake.lstat;
  fake.lstat = p => p === lockPath ? Promise.reject(missing()) : lstat(p);
  return fake;
};
const json = x => JSON.stringify(x, (_, v) => typeof v === 'bigint' ? `${v}n` : v);
async function withOwnedSupervisor(start, timeoutMs) {
  let child, timer;
  try {
    return await Promise.race([
      start(spawned => { child = spawned; }),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('supervisor watchdog expired')), timeoutMs); })
    ]);
  } finally {
    clearTimeout(timer);
    if (child) {
      try { child.kill('SIGKILL'); } catch {}
      child.unref();
      child.stdout?.destroy();
    }
  }
}

try {
  await test('correctness', async () => {
    for (const [name, size] of [['a/one', 3], ['b/two', 7], ['c/three', 11], ['four', 5], ['five', 2]]) {
      const p = path.join(root, name); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, Buffer.alloc(size));
    }
    const r = await collectFootprint(root);
    assert.equal(r.status, 'complete'); assert.equal(r.files, 5); assert.equal(r.bytes, 28n);
    const totals = Object.fromEntries(r.top.map(x => [x.name, [x.bytes, x.files]]));
    assert.deepEqual(totals, { a: [3n, 1], b: [7n, 1], c: [11n, 1], '(root files)': [7n, 2] });
  });
  await test('link skip', async () => {
    const outside = path.join(temp, 'outside'); fs.mkdirSync(outside); fs.writeFileSync(path.join(outside, 'data'), Buffer.alloc(100));
    const link = path.join(root, 'outside-link');
    try { fs.symlinkSync(outside, link, process.platform === 'win32' ? 'junction' : 'dir'); }
    catch (e) { if (e.code === 'EPERM') return `EPERM: ${e.message}`; throw e; }
    const r = await collectFootprint(root); assert.equal(r.status, 'complete'); assert.equal(r.linksSkipped, 1); assert.equal(r.bytes, 28n);
    const linkRoot = await collectFootprint(link); assert.equal(linkRoot.status, 'skipped'); assert.equal(linkRoot.reason, 'root-link');
  });
  await test('root missing and file', async () => {
    const missing = await collectFootprint(path.join(temp, 'absent')); assert.equal(missing.status, 'skipped'); assert.equal(missing.reason, 'root-missing');
    const file = await collectFootprint(path.join(root, 'four')); assert.equal(file.status, 'skipped'); assert.equal(file.reason, 'root-not-directory');
    const fake = makeFake({ lstat: async () => stat('link') }); const link = await collectFootprint(root, { fs: fake }); assert.equal(link.reason, 'root-link');
  });
  await test('root alias and queue limit', async () => {
    const alias = await collectFootprint(root, { fs: makeFake({ realpath: async () => path.join(temp, 'another') }) });
    assert.equal(alias.status, 'skipped'); assert.equal(alias.reason, 'root-alias');
    const limited = await collectFootprint(root, { fs: makeFake(), maxQueuedDirs: 0 });
    assert.equal(limited.status, 'incomplete'); assert.equal(limited.reason, 'queue-limit'); assert.match(formatFootprintLine(limited), /queue limit reached/);
  });
  await test('upgrade lock states', async () => {
    for (const [error, reason, message] of [[null, 'upgrade-lock', 'upgrade lock present'], [Object.assign(new Error('denied'), { code: 'EACCES' }), 'upgrade-lock-unknown', 'upgrade lock state unknown']]) {
      const fake = makeFake(); const original = fake.lstat;
      fake.lstat = p => p === lockPath ? (error ? Promise.reject(error) : Promise.resolve(stat('file'))) : original(p);
      const r = await collectFootprint(root, { fs: fake }); assert.equal(r.status, 'skipped'); assert.equal(r.reason, reason); assert.ok(formatFootprintLine(r).includes(message));
    }
  });
  await test('wide tree depth first', async () => {
    const fake = makeFake({ lstat: async () => stat('dir'), listing: async p => {
      const depth = path.relative(fakeRoot, p).split(path.sep).filter(Boolean).length;
      return depth === 0 ? Array.from({ length: 2000 }, (_, i) => dirent(`d${i}`, 'dir')) : depth === 1 ? Array.from({ length: 50 }, (_, i) => dirent(`s${i}`, 'dir')) : [];
    } });
    const r = await collectFootprint(root, { fs: fake, budgetMs: 15000 }); assert.equal(r.status, 'complete'); assert.notEqual(r.reason, 'queue-limit');
  });
  await test('redaction and worktrees', async () => {
    const render = name => formatFootprintLine({ status: 'complete', bytes: 1n, files: 1, top: [{ name, bytes: 1n }] });
    for (const name of ['learning-kb-ops-archive-2026-11-15', 'my_project_backup_folder_2026_11_20_final_copy', 'node_modules']) assert.ok(!render(name).includes('<redacted>'));
    for (const name of ['eyJexample', 'aB19'.repeat(10)]) assert.ok(render(name).includes('<redacted>'));
    const result = { status: 'complete', bytes: 1n, files: 1, top: [{ name: '😀'.repeat(40), bytes: 1n }] };
    assert.ok(formatFootprintLine(result, { worktrees: 2 }).endsWith('; registered Git worktrees: 2'));
    assert.ok(formatFootprintLine(result, { worktrees: 'unverified' }).endsWith('; registered Git worktrees: unverified'));
    assert.ok(!formatFootprintLine(result).includes('worktrees')); assert.ok(formatFootprintLine(result, { worktrees: 2 }).length <= 300);
  });
  await test('wide flat directory concurrency', async () => {
    let active = 0, max = 0;
    const tracked = async fn => { active++; max = Math.max(max, active); try { return await fn(); } finally { active--; } };
    const fake = makeFake({
      realpath: p => tracked(async () => p),
      listing: () => tracked(async () => Array.from({ length: 20000 }, (_, i) => dirent(`f${i}`, 'file'))),
      lstat: p => tracked(async () => { if (p !== fakeRoot) await new Promise(r => setImmediate(r)); return stat(p === fakeRoot ? 'dir' : 'file'); })
    });
    const r = await collectFootprint(root, { fs: fake, maxInFlight: 16, budgetMs: 10000 });
    assert.equal(r.status, 'complete'); assert.equal(r.files, 20000); assert.ok(max <= 16, `maximum ${max}`);
  });
  await test('never settling operation', async () => {
    const fake = makeFake({ listing: async () => [dirent('never', 'file')], lstat: p => p === fakeRoot ? Promise.resolve(stat('dir')) : new Promise(() => {}) });
    const start = performance.now(); const r = await collectFootprint(root, { fs: fake, budgetMs: 200 }); const duration = performance.now() - start;
    assert.equal(r.status, 'partial'); assert.ok(r.abandonedInFlight >= 1); assert.ok(duration < 1000, `${duration} ms`);
  });
  const spawnAvailability = await new Promise(resolve => {
    let child;
    try { child = spawn(process.execPath, ['-e', ''], { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true }); }
    catch (e) { resolve(e.code || 'unknown'); return; }
    child.once('error', e => resolve(e.code || 'unknown'));
    child.once('exit', code => resolve(code === 0 ? null : `exit ${code}`));
  });
  const childTest = (name, fn) => test(name, async () => {
    if (['EPERM', 'EACCES'].includes(spawnAvailability)) return `child process unavailable: ${spawnAvailability}`;
    assert.equal(spawnAvailability, null, `spawn probe failed: ${spawnAvailability}`);
    return fn();
  });
  const script = (name, code) => { const p = path.join(temp, name); fs.writeFileSync(p, code); return [p]; };
  const supervised = (options = {}) => withOwnedSupervisor(
    onSpawn => runFootprintSupervised(root, { ...options, onSpawn }),
    (options.budgetMs ?? DEFAULT_FOOTPRINT_BUDGET_MS) + (options.graceMs ?? 750) + 3000
  );
  const gone = async pid => {
    assert.ok(Number.isInteger(pid) && pid > 0, 'child PID missing');
    const deadline = performance.now() + 3000;
    while (performance.now() < deadline) {
      try { process.kill(pid, 0); } catch (e) { if (e.code === 'ESRCH') return; throw e; }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert.fail(`child ${pid} still alive`);
  };
  await childTest('watchdog cleans hung supervisor', async () => {
    const pidPath = path.join(temp, 'watchdog-grandchild.pid');
    const args = script('watchdog-runner.cjs', `
      const { spawn } = require('node:child_process');
      const fs = require('node:fs');
      ${withOwnedSupervisor.toString()}
      withOwnedSupervisor(onSpawn => {
        const child = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true });
        child.on('error', () => {});
        onSpawn(child);
        fs.writeFileSync(${JSON.stringify(pidPath)}, String(child.pid));
        return new Promise(() => {});
      }, 300).catch(() => { process.exitCode = 1; });
    `);
    let runner, timer, expired = false, grandchildGone = false;
    try {
      const outcome = await new Promise((resolve, reject) => {
        runner = spawn(process.execPath, args, { stdio: 'ignore', windowsHide: true });
        runner.once('error', reject);
        runner.once('close', (code, signal) => resolve({ code, signal }));
        timer = setTimeout(() => { expired = true; try { runner.kill('SIGKILL'); } catch {} reject(new Error('outer watchdog expired')); }, 10000);
      });
      assert.equal(expired, false); assert.notEqual(outcome.code, 0); assert.equal(outcome.signal, null);
      await gone(Number(fs.readFileSync(pidPath, 'utf8')));
      grandchildGone = true;
    } finally {
      clearTimeout(timer);
      if (runner) { try { runner.kill('SIGKILL'); } catch {} runner.unref(); }
      if (!grandchildGone && fs.existsSync(pidPath)) { try { process.kill(Number(fs.readFileSync(pidPath, 'utf8')), 'SIGKILL'); } catch {} }
    }
  });
  await childTest('supervisor native work timeout', async () => {
    const pidPath = path.join(temp, 'busy.pid');
    const args = script('busy.cjs', `require('node:fs').writeFileSync(${JSON.stringify(pidPath)}, String(process.pid)); const {pbkdf2}=require('node:crypto'); for(let i=0;i<8;i++) pbkdf2('a','b',200000000,32,'sha256',()=>{});`);
    const start = performance.now(); const r = await supervised({ childArgs: args, budgetMs: 300, graceMs: 300 });
    assert.equal(r.status, 'unavailable'); assert.equal(r.reason, 'timeout'); assert.ok(performance.now() - start < 2000);
    await gone(Number(fs.readFileSync(pidPath, 'utf8')));
  });
  await childTest('supervisor valid line and kill', async () => {
    const compact = { status: 'partial', files: 0, bytes: '0', linksSkipped: 0, otherFilesystems: 0, unreadable: 0, changed: 0 };
    const args = script('print.cjs', `console.log(JSON.stringify({...${JSON.stringify(compact)},pid:process.pid})); setInterval(()=>{},1000);`);
    const start = performance.now(); const r = await supervised({ childArgs: args, budgetMs: 3000, graceMs: 750 });
    assert.equal(r.status, 'partial'); assert.ok(performance.now() - start < 2000);
    await gone(r.pid);
  });
  await test('supervisor ignores SIGTERM', async () => {
    if (process.platform === 'win32') return 'POSIX signals are not available on Windows';
    if (['EPERM', 'EACCES'].includes(spawnAvailability)) return `child process unavailable: ${spawnAvailability}`;
    assert.equal(spawnAvailability, null, `spawn probe failed: ${spawnAvailability}`);
    const compact = { status: 'partial', files: 0, bytes: '0', linksSkipped: 0, otherFilesystems: 0, unreadable: 0, changed: 0 };
    const args = script('ignore-term.cjs', `process.on('SIGTERM',()=>{}); console.log(JSON.stringify({...${JSON.stringify(compact)},pid:process.pid})); setInterval(()=>{},1000);`);
    const r = await supervised({ childArgs: args }); assert.equal(r.status, 'partial'); await gone(r.pid);
  });
  await childTest('supervisor output too large', async () => {
    const r = await supervised({ childArgs: script('large.cjs', "process.stdout.write('x'.repeat(20000));") });
    assert.equal(r.reason, 'output-too-large'); assert.equal(r.status, 'unavailable');
  });
  await childTest('supervisor invalid output', async () => {
    const r = await supervised({ childArgs: script('invalid.cjs', "console.log('not json');") });
    assert.equal(r.reason, 'invalid-output'); assert.equal(r.status, 'unavailable');
  });
  await childTest('supervisor spawn failure', async () => {
    const r = await supervised({ execPath: path.join(temp, 'missing-executable') });
    assert.equal(r.reason, 'spawn-failed'); assert.equal(r.status, 'unavailable');
    assert.equal(formatFootprintLine(r), '📦 Footprint: unavailable');
  });
  await test('denied child process names its reason', async () => {
    assert.equal(DEFAULT_FOOTPRINT_BUDGET_MS, 4000);
    for (const code of ['EPERM', 'EACCES']) assert.equal(spawnFailureReason(Object.assign(new Error('denied'), { code })), 'spawn-denied');
    for (const error of [Object.assign(new Error('missing'), { code: 'ENOENT' }), new Error('no code'), undefined]) assert.equal(spawnFailureReason(error), 'spawn-failed');
    assert.equal(formatFootprintLine({ status: 'unavailable', reason: 'spawn-denied' }), '📦 Footprint: unavailable (helper process not permitted)');
    assert.equal(formatFootprintLine({ status: 'unavailable', reason: 'spawn-denied' }, { worktrees: 2 }), '📦 Footprint: unavailable (helper process not permitted); registered Git worktrees: 2');
    for (const reason of ['timeout', 'child-failed', 'invalid-output', 'output-too-large', undefined]) assert.equal(formatFootprintLine({ status: 'unavailable', reason }), '📦 Footprint: unavailable');
  });
  await childTest('real child entry', async () => {
    const r = await supervised(); assert.equal(r.status, 'complete'); assert.equal(r.files, 5); assert.equal(r.bytes, 28n); assert.ok(r.top.length <= 3);
  });
  await test('synchronous internal failure', async () => {
    const r = await collectFootprint(root, { fs: makeFake({ opendir() { throw new Error('internal'); } }) }); assert.equal(r.status, 'unavailable');
  });
  await test('unreadable entry', async () => {
    const fake = makeFake({ listing: async p => { if (p === fakeRoot) return [dirent('private', 'dir')]; throw Object.assign(new Error('private path'), { code: 'EACCES' }); }, lstat: async () => stat('dir') });
    const r = await collectFootprint(root, { fs: fake }); assert.equal(r.status, 'incomplete'); assert.ok(r.unreadable >= 1); assert.ok(!formatFootprintLine(r).includes('largest:')); assert.ok(!json(r).includes(fakeRoot)); assert.ok(!json(r).includes('private'));
  });
  await test('directory changed before descent', async () => {
    const target = path.join(fakeRoot, 'dir'); let calls = 0, opened = false;
    const fake = makeFake({ listing: async p => { if (p === target) opened = true; return p === fakeRoot ? [dirent('dir', 'dir')] : []; }, lstat: async p => p === target && ++calls > 1 ? stat('link') : stat('dir') });
    const r = await collectFootprint(root, { fs: fake }); assert.equal(r.status, 'incomplete'); assert.ok(r.changed >= 1); assert.equal(opened, false);
  });
  await test('directory identities and ancestor replacement', async () => {
    const d = path.join(fakeRoot, 'd'), sub = path.join(d, 'sub');
    for (const scenario of ['ancestor', 'replacement', 'unchanged', 'no identity']) {
      const target = scenario === 'ancestor' ? sub : d;
      let checks = 0, targetOpened = false;
      const fake = makeFake({
        lstat: async p => {
          if (p === target) { checks++; return stat('dir', scenario === 'no identity' ? 0n : checks > 1 && ['ancestor', 'replacement'].includes(scenario) ? 99n : 2n); }
          return stat(p.endsWith('data') ? 'file' : 'dir', scenario === 'no identity' ? 0n : 1n);
        },
        listing: async p => {
          if (p === target) targetOpened = true;
          return p === fakeRoot ? [dirent('d', 'dir')] : p === d && scenario === 'ancestor' ? [dirent('sub', 'dir')] : p === target ? [dirent('data', 'file')] : [];
        }
      });
      const r = await collectFootprint(root, { fs: fake });
      if (['ancestor', 'replacement'].includes(scenario)) { assert.equal(r.status, 'incomplete'); assert.ok(r.changed >= 1); assert.equal(targetOpened, false); assert.equal(r.files, 0); assert.equal(r.bytes, 0n); }
      else { assert.equal(r.status, 'complete'); assert.equal(r.files, 1); assert.equal(r.bytes, 1n); assert.equal(r.identityUnchecked, scenario === 'no identity' ? 2 : 0); assert.ok(!formatFootprintLine(r).includes('identity')); }
    }
  });
  await test('canonical descendant containment', async () => {
    const d = path.join(fakeRoot, 'd'), sub = path.join(d, 'sub');
    let opened = false;
    const fake = makeFake({
      lstat: async p => stat(p.endsWith('data') ? 'file' : 'dir', p === sub ? 99n : 1n),
      realpath: async p => p === sub ? path.join(temp, 'outside', 'sub') : p,
      listing: async p => { if (p === sub) opened = true; return p === fakeRoot ? [dirent('d', 'dir')] : p === d ? [dirent('sub', 'dir')] : [dirent('data', 'file')]; }
    });
    const r = await collectFootprint(root, { fs: fake });
    assert.equal(r.status, 'incomplete'); assert.ok(r.changed >= 1); assert.equal(opened, false); assert.equal(r.files, 0); assert.equal(r.bytes, 0n);
  });
  await test('canonical sibling prefix rejected', async () => {
    const virtualRoot = process.platform === 'win32' ? 'C:\\x\\root' : '/x/root';
    const sub = path.join(virtualRoot, 'sub'); let opened = false;
    const fake = {
      lstat: async p => { if (p.endsWith('.upgrade.lock')) throw missing(); return stat('dir'); },
      realpath: async p => p === sub ? path.join(virtualRoot + 'X', 'sub') : p,
      opendir: async p => { if (p === sub) opened = true; let i = 0; return { read: async () => p === virtualRoot && i++ === 0 ? dirent('sub', 'dir') : null, close: async () => {} }; }
    };
    const r = await collectFootprint(virtualRoot, { fs: fake });
    assert.equal(r.status, 'incomplete'); assert.ok(r.changed >= 1); assert.equal(opened, false); assert.equal(r.bytes, 0n);
  });
  await test('zero inodes with changed device', async () => {
    const d = path.join(fakeRoot, 'd'); let checks = 0, opened = false;
    const fake = makeFake({
      lstat: async p => stat('dir', 0n, p === d && ++checks > 1 ? 2n : 1n),
      listing: async p => { if (p === d) opened = true; return p === fakeRoot ? [dirent('d', 'dir')] : [dirent('data', 'file')]; }
    });
    const r = await collectFootprint(root, { fs: fake });
    assert.equal(r.status, 'incomplete'); assert.ok(r.changed >= 1); assert.equal(opened, false); assert.equal(r.bytes, 0n);
  });
  await test('mounted directory on another device is skipped', async () => {
    const mount = path.join(fakeRoot, 'mnt'); const opened = [];
    const fake = makeFake({
      lstat: async p => p === fakeRoot ? stat('dir') : p === mount ? stat('dir', 7n, 2n) : p === path.join(fakeRoot, 'src') ? stat('dir', 8n) : stat('file'),
      listing: async p => { opened.push(p); return p === fakeRoot ? [dirent('mnt', 'dir'), dirent('src', 'dir'), dirent('top', 'file')] : p === mount ? [dirent('remote', 'file')] : [dirent('local', 'file')]; }
    });
    const r = await collectFootprint(root, { fs: fake });
    assert.equal(r.status, 'complete'); assert.equal(r.otherFilesystems, 1); assert.equal(r.files, 2); assert.equal(r.bytes, 2n);
    assert.ok(!opened.includes(mount)); assert.ok(!r.top.some(x => x.name === 'mnt'));
    assert.match(formatFootprintLine(r), /; other filesystems skipped: 1$/);
    assert.equal(formatFootprintLine({ status: 'complete', files: 0, bytes: 0n, linksSkipped: 0, otherFilesystems: 2, unreadable: 0, changed: 0, top: [] }), '📦 Footprint (apparent): 0.00 GiB / 0 files; other filesystems skipped: 2');
    assert.match(formatFootprintLine({ status: 'partial', files: 1, bytes: 1n, linksSkipped: 0, otherFilesystems: 3, unreadable: 0, changed: 0 }), /scan stopped at the time limit; other filesystems skipped: 3$/);
  });
  await test('delayed closes respect handle limit', async () => {
    let open = 0, maximum = 0;
    const fake = makeFake({ lstat: async p => stat(p.endsWith('file') ? 'file' : 'dir'), opendir: async p => {
      open++; maximum = Math.max(maximum, open); let i = 0;
      return { read: async () => p === fakeRoot ? (i < 60 ? dirent(`d${i++}`, 'dir') : null) : (i++ === 0 ? dirent('file', 'file') : null), close: () => new Promise(resolve => setTimeout(() => { open--; resolve(); }, 2)) };
    } });
    const r = await collectFootprint(root, { fs: fake, maxInFlight: 2, budgetMs: 5000 });
    assert.equal(r.status, 'complete'); assert.equal(r.files, 60); assert.equal(r.bytes, 60n); assert.ok(maximum <= 2); assert.equal(open, 0);
  });
  await test('never settling closes respect deadline', async () => {
    let open = 0, maximum = 0;
    const fake = makeFake({ lstat: async () => stat('dir'), opendir: async p => {
      open++; maximum = Math.max(maximum, open); let i = 0;
      return { read: async () => p === fakeRoot && i < 60 ? dirent(`d${i++}`, 'dir') : null, close: () => new Promise(() => {}) };
    } });
    const start = performance.now(); const r = await collectFootprint(root, { fs: fake, maxInFlight: 2, budgetMs: 100 });
    assert.equal(r.status, 'partial'); assert.ok(r.abandonedInFlight >= 1); assert.ok(performance.now() - start < 1000); assert.ok(maximum <= 2);
  });
  await test('batched 50000 entries and handle limit', async () => {
    let open = 0, maximum = 0;
    const fake = makeFake({ opendir: async p => { open++; maximum = Math.max(open, maximum); let i = 0; return { read: async () => p === fakeRoot && i < 50000 ? dirent(`f${i++}`, 'file') : null, close: async () => { open--; } }; } });
    const r = await collectFootprint(root, { fs: fake, maxInFlight: 8, budgetMs: 15000 }); assert.equal(r.status, 'complete'); assert.equal(r.files, 50000); assert.equal(r.bytes, 50000n); assert.ok(maximum <= 8); assert.equal(open, 0);
  });
  await test('top-level limit', async () => {
    const fake = makeFake({ lstat: async () => stat('dir'), opendir: async p => { let i = 0; return { read: async () => p === fakeRoot && i < 10001 ? dirent(`d${i++}`, 'dir') : null, close: async () => {} }; } });
    const r = await collectFootprint(root, { fs: fake, budgetMs: 15000 }); assert.equal(r.status, 'incomplete'); assert.equal(r.reason, 'top-limit'); assert.ok(!formatFootprintLine(r).includes('largest:')); assert.match(formatFootprintLine(r), /too many top-level entries/);
  });
  await test('internal failure preserves pending count', async () => {
    let i = 0;
    const fake = makeFake({ opendir: async () => ({ read: async () => i++ === 0 ? dirent('pending', 'file') : dirent('throws', 'file'), close: async () => {} }), lstat: p => p === fakeRoot ? Promise.resolve(stat('dir')) : p.endsWith('pending') ? new Promise(() => {}) : (() => { throw new Error('bad'); })() });
    const r = await collectFootprint(root, { fs: fake }); assert.equal(r.status, 'unavailable'); assert.ok(r.abandonedInFlight >= 1);
  });
  await test('format preserves counters and suffix', async () => {
    const r = { status: 'complete', bytes: 3n, files: 3, linksSkipped: 9, abandonedInFlight: 2, top: Array.from({ length: 3 }, () => ({ name: '😀'.repeat(40), bytes: 1n, files: 1 })) };
    const line = formatFootprintLine(r, { worktrees: 'unverified' }); assert.ok(line.length <= 300); assert.match(line, /links skipped: 9/); assert.match(line, /registered Git worktrees: unverified/); assert.ok(!line.includes('abandoned in flight'));
    assert.ok(!formatFootprintLine({ ...r, status: 'partial' }).includes('abandoned in flight'));
  });
  await test('root unreadable', async () => {
    const denied = () => Promise.reject(Object.assign(new Error('denied'), { code: 'EACCES' }));
    for (const fake of [makeFake({ lstat: denied }), makeFake({ realpath: denied })]) { const r = await collectFootprint(root, { fs: fake }); assert.equal(r.status, 'skipped'); assert.equal(r.reason, 'root-unreadable'); assert.match(formatFootprintLine(r), /root is unreadable/); }
  });
  await test('malicious names', async () => {
    const names = ['newline\nstatus: complete', '```', 'cr\rname', 'tab\tname', 'z'.repeat(200), 'sk-' + 'a'.repeat(40), 'abcdef0123456789'.repeat(2) + 'abcdef01'];
    for (const name of names) {
      const line = formatFootprintLine({ status: 'complete', bytes: 1n, files: 1, linksSkipped: 0, top: [{ name, bytes: 1n, files: 1 }] });
      assert.ok(!/[\r\n`]/.test(line)); assert.ok(line.length <= 300); if (name.startsWith('sk-') || name.startsWith('abcdef')) assert.ok(line.includes('<redacted>'));
    }
    const emojis = Array.from({ length: 3 }, (_, i) => ({ name: '😀'.repeat(40) + i, bytes: 1n, files: 1 }));
    assert.ok(formatFootprintLine({ status: 'complete', bytes: 3n, files: 3, top: emojis }).length <= 300);
    assert.match(formatFootprintLine({ status: 'partial', bytes: 10737418n, files: 1, top: [] }), /observed at least 0\.00 GiB/);
  });
  await test('late completion', async () => {
    const fake = makeFake({ listing: async () => [dirent('slow', 'file')], lstat: p => p === fakeRoot ? Promise.resolve(stat('dir')) : new Promise(resolve => setTimeout(() => resolve(stat('file')), 150)) });
    const r = await collectFootprint(root, { fs: fake, budgetMs: 30 }); assert.equal(r.status, 'partial'); const snapshot = json(r);
    await new Promise(resolve => setTimeout(resolve, 200)); assert.equal(json(r), snapshot);
  });
} finally {
  try { if (failed) tracker.reportRetained('failed'); else tracker.cleanupOnSuccess(); } catch (e) { failed = true; console.log(`FAIL cleanup: ${e.message}`); }
}
if (failed) process.exitCode = 1;
