import { lstatSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Only the exact directories this tracker created with mkdtempSync are ever
// deleted: each root's filesystem identity is recorded at creation and must
// still match at cleanup, and a root is retired once removed or found absent.
// Absence at registration is not ownership. Cleanup also refuses the source
// root, the working directory, their ancestors, and paths inside the source.
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ownedNamePrefixes = Object.freeze(["ack-", "ahk-"]);

export function createQaTempTracker(label) {
  const paths = new Map(); // owned root -> identity recorded at creation

  function track(targetPath) {
    const resolved = path.resolve(targetPath);
    if (![...paths.keys()].some((root) => isSameOrInside(resolved, root))) {
      throw new Error(`${label}: refusing to track a path outside a tracker-created root: ${resolved}`);
    }
    return targetPath;
  }

  // Create and register a fresh directory in one step; the only way an
  // existing directory enters cleanup.
  function mkdtemp(prefixPath) {
    assertOwnedQaTempPath(path.resolve(`${prefixPath}x`), label);
    mkdirSync(path.dirname(prefixPath), { recursive: true });
    const created = path.resolve(mkdtempSync(prefixPath));
    assertOwnedQaTempPath(created, label);
    paths.set(created, directoryIdentity(created));
    return created;
  }

  // Returns an absent single-segment child of a fresh owned root.
  function ownedPath(baseDir, name) {
    if (typeof name !== "string" || name === "" || name === "." || name === ".." || /[\\/:]/.test(name) || path.isAbsolute(name)) {
      throw new Error(`${label}: ownedPath name must be a single path segment: ${JSON.stringify(name)}`);
    }
    const slug = name.replace(/^(ack-|ahk-)/, "").replace(/[^A-Za-z0-9-]/g, "-").slice(0, 24);
    const root = mkdtemp(path.join(baseDir, `ack-own-${slug}-`));
    const child = path.join(root, name);
    if (path.dirname(child) !== root) throw new Error(`${label}: ownedPath escaped its owned root: ${child}`);
    return child;
  }

  function cleanupOnSuccess() {
    if (keepQaTemp()) {
      reportRetained("AGENT_HANDOFF_KIT_KEEP_QA_TMP is set");
      return;
    }
    const removed = [];
    const refused = [];
    for (const [targetPath, identity] of [...paths].sort(([a], [b]) => b.length - a.length)) {
      assertOwnedQaTempPath(targetPath, label);
      const current = lstatOrNull(targetPath, { bigint: true });
      if (!current) {
        paths.delete(targetPath);
        continue;
      }
      if (!current.isDirectory() || current.isSymbolicLink() || identityOf(current) !== identity) {
        refused.push(targetPath);
        continue;
      }
      rmSync(targetPath, { recursive: true, force: true });
      paths.delete(targetPath);
      removed.push(targetPath);
    }
    if (removed.length > 0) console.log(`ok: ${label} temporary roots cleaned (${removed.length})`);
    if (refused.length > 0) {
      throw new Error(`${label}: refusing QA cleanup of replaced roots (identity changed since creation): ${refused.join(", ")}`);
    }
  }

  function reportRetained(reason) {
    const existing = [...paths.keys()].filter((targetPath) => pathExists(targetPath));
    if (existing.length === 0) return;
    console.error(`${label} temporary roots retained: ${reason}`);
    for (const targetPath of existing) console.error(`- ${targetPath}`);
  }

  return { track, mkdtemp, ownedPath, cleanupOnSuccess, reportRetained };
}

function assertOwnedQaTempPath(resolved, label) {
  const refusal = qaTempCleanupRefusal(resolved, { sourceRoot, cwd: process.cwd() });
  if (refusal) throw new Error(`${label}: refusing QA cleanup of ${refusal}: ${resolved}`);
}

// Pure decision used by the tracker; roots are injectable so each refusal
// branch can be exercised without touching a real directory.
export function qaTempCleanupRefusal(target, roots) {
  const resolved = path.resolve(target);
  const source = path.resolve(roots.sourceRoot);
  const cwd = path.resolve(roots.cwd);
  if (!ownedNamePrefixes.some((prefix) => path.basename(resolved).startsWith(prefix))) return "unowned-name";
  if (isSameOrInside(resolved, source)) return "source-root-or-inside";
  if (isSameOrInside(source, resolved)) return "source-root-ancestor";
  if (isSameOrInside(cwd, resolved)) return "working-directory-or-ancestor";
  return null;
}

function isSameOrInside(candidate, container) {
  const relative = path.relative(container, candidate);
  return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function keepQaTemp() {
  return ["1", "true", "yes"].includes(String(process.env.AGENT_HANDOFF_KIT_KEEP_QA_TMP ?? "").toLowerCase());
}

function directoryIdentity(targetPath) {
  return identityOf(lstatSync(targetPath, { bigint: true }));
}

function identityOf(stats) {
  return `${stats.dev}:${stats.ino}:${stats.birthtimeNs}`;
}

function lstatOrNull(targetPath, options) {
  try {
    return lstatSync(targetPath, options);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function pathExists(targetPath) {
  return lstatOrNull(targetPath) !== null;
}
