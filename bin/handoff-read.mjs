// Read-only transport for a handoff. Returned ranges are not proof that an AI
// received, understood, or is authorized to act on the document.
import { constants, closeSync, fstatSync, lstatSync, openSync, readFileSync, realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

export function readHandoffChunk(selectedRoot, options = {}) {
  const offset = unsignedInteger(options.offset ?? "0", "offset");
  const maxChars = unsignedInteger(options.maxChars ?? "4000", "max-chars");
  if (maxChars < 64 || maxChars > 8192) throw new Error("max-chars must be between 64 and 8192");
  const expected = options.sha256;
  if (expected !== undefined && !/^[a-f0-9]{64}$/.test(expected)) throw new Error("sha256 must be a lowercase SHA-256 digest");
  if (offset > 0 && expected === undefined) throw new Error("continuation requires --sha256 from the first chunk");

  // Root aliases are supported (for example /tmp on macOS). Expose both paths
  // so the caller can verify the canonical root against the intended workspace.
  // Links below that root are rejected, not followed into another workspace.
  const requestedRoot = path.resolve(selectedRoot);
  const root = realpathSync(requestedRoot);
  assertSafeRoot(root);
  const target = path.join(root, "dev", "SESSION_HANDOFF.md");
  const before = lstatSync(target, { bigint: true });
  if (!before.isFile() || before.isSymbolicLink()) throw new Error("handoff must be a regular file, not a link");
  const descriptor = openSync(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  let bytes;
  try {
    const opened = fstatSync(descriptor, { bigint: true });
    if (!sameIdentity(before, opened)) throw new Error("handoff changed before reading; restart at offset 0");
    bytes = readFileSync(descriptor);
    const after = fstatSync(descriptor, { bigint: true });
    assertSafeRoot(root);
    const current = lstatSync(target, { bigint: true });
    if (!sameIdentity(before, after) || !sameIdentity(before, current) || BigInt(bytes.length) !== after.size) {
      throw new Error("handoff changed while reading; restart at offset 0");
    }
  } finally {
    closeSync(descriptor);
  }

  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (expected !== undefined && expected !== sha256) throw new Error("handoff snapshot changed; discard mixed coverage and restart at offset 0");
  let decoded;
  try { decoded = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes); }
  catch { throw new Error("handoff is not valid UTF-8; no content returned"); }
  const characters = Array.from(decoded);
  const total = characters.length;
  if (offset > total || (offset === total && total > 0)) throw new Error("offset must identify content within the handoff");
  const end = Math.min(total, offset + maxChars);
  return Object.freeze({
    requestedRoot, root, file: "dev/SESSION_HANDOFF.md", sha256, offset, end, total,
    nextOffset: end < total ? end : null,
    text: characters.slice(offset, end).join("")
  });
}

export function formatHandoffChunk(chunk) {
  const metadata = JSON.stringify({ requestedRoot: chunk.requestedRoot, root: chunk.root, file: chunk.file, sha256: chunk.sha256, offset: chunk.offset, end: chunk.end, total: chunk.total, unit: "Unicode code points", nextOffset: chunk.nextOffset });
  return `AHK_HANDOFF_BEGIN ${metadata}\n${chunk.text}\nAHK_HANDOFF_END ${chunk.sha256} ${chunk.offset}:${chunk.end}/${chunk.total}\n`;
}

function unsignedInteger(value, name) {
  const text = String(value);
  if (!/^(0|[1-9][0-9]*)$/.test(text) || !Number.isSafeInteger(Number(text))) throw new Error(`${name} must be a non-negative safe integer`);
  return Number(text);
}

function inspect(target) {
  try { return lstatSync(target); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

function assertSafeRoot(root) {
  if (!lstatSync(root).isDirectory()) throw new Error("root must be an existing directory");
  const dev = inspect(path.join(root, "dev"));
  if (!dev?.isDirectory() || dev.isSymbolicLink()) throw new Error("dev must be an existing directory inside root, not a link");
  const migrations = inspect(path.join(root, "dev", "governance_migrations"));
  if (migrations && (!migrations.isDirectory() || migrations.isSymbolicLink())) throw new Error("governance_migrations must not be a link or non-directory");
  if (inspect(path.join(root, "dev", "governance_migrations", ".upgrade.lock"))) {
    throw new Error("upgrade lock exists; do not read handoff; resume the authorized upgrade recovery first");
  }
}

function sameIdentity(left, right) {
  // Windows path metadata may report dev=0 while the open handle reports its
  // volume ID. Compare a device ID only when both probes expose one.
  const sameDevice = left.dev === 0n || right.dev === 0n || left.dev === right.dev;
  return sameDevice && right.isFile() && !right.isSymbolicLink() && ["ino", "size", "mtimeNs", "ctimeNs"].every(key => left[key] === right[key]);
}
