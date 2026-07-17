import { createHash } from "node:crypto";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";

export const USER_RULES_ROUTER_PATH = "dev/USER_RULES.md";
export const USER_RULES_CONTENT_ROOT = "dev/user_rules/";

export const FORMAL_USER_RULES_ENTRY_ANCHOR = "<!-- ack:user-rules-router:dev/USER_RULES.md -->";
export const USER_RULES_ACCEPTANCE_SCHEMA_VERSION = 2;
const formalEntryInstruction = "Before loading task packs, read `dev/USER_RULES.md`.";
const acceptanceAnchorPattern = /<!-- ack:user-rules-acceptance:sha256=([a-f0-9]{64}) -->/g;
const registryStart = "<!-- ack:user-rules-registry:start -->";
const registryEnd = "<!-- ack:user-rules-registry:end -->";
const stateStart = "<!-- ack:user-rules-state:start -->";
const stateEnd = "<!-- ack:user-rules-state:end -->";
const managedCoreStart = "<!-- BEGIN Agent Handoff Kit managed core -->";
const managedCoreEnd = "<!-- END Agent Handoff Kit managed core -->";

/**
 * Reads the formal user-rule path: AGENTS.md -> USER_RULES.md -> accepted,
 * registered dev/user_rules entries. It is read-only: every rule must match
 * its accepted raw-byte witness before it is returned, and the helper grants
 * no migration or activation authority.
 */
export async function readFormalUserRules({ root, allowActiveTransaction = false } = {}) {
  if (typeof root !== "string" || !root.trim()) throw new Error("user-rules reader requires a project root");
  const rootPath = path.resolve(root);
  const rootStats = await lstat(rootPath).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!rootStats?.isDirectory() || rootStats.isSymbolicLink()) throw new Error("user-rules reader root must be a real directory");
  const realRoot = await realpath(rootPath);
  if (!allowActiveTransaction && await hasActiveUpgradeLock(rootPath)) {
    throw new Error("user-rules activation is pending recovery; normal entry refuses to read a partial transaction state");
  }

  const agents = await readSafeFile(rootPath, realRoot, "AGENTS.md");
  const agentsText = agents.bytes.toString("utf8");
  const formalEntry = parseFormalUserRulesEntry(agentsText);

  const router = await readSafeFile(rootPath, realRoot, USER_RULES_ROUTER_PATH);
  const entries = parseUserRulesRegistry(router.bytes.toString("utf8"));
  const state = parseUserRulesState(router.bytes.toString("utf8"));
  const acceptedDigest = formalEntry.acceptanceDigest;
  const actualDigest = userRulesAcceptanceDigest(entries, state);
  if (acceptedDigest !== actualDigest) {
    throw new Error("AGENTS.md user-rules acceptance digest does not match the ordered registry state");
  }
  if (state) assertCurrentKitState(agentsText, state);
  const rules = [];
  for (const entry of entries) {
    const rule = await readSafeFile(rootPath, realRoot, entry.contentPath);
    assertAcceptedBytes(entry, rule.bytes);
    rules.push(Object.freeze({ ...entry, path: entry.contentPath, bytes: rule.bytes, sha256: sha256(rule.bytes) }));
  }
  return Object.freeze({
    entryPath: "AGENTS.md",
    routerPath: USER_RULES_ROUTER_PATH,
    agentsSha256: sha256(agents.bytes),
    routerSha256: sha256(router.bytes),
    acceptanceDigest: actualDigest,
    state,
    rules: Object.freeze(rules)
  });
}

/**
 * Hashes the canonical whole acceptance state. This binds the entry sequence
 * and every accepted witness / reader / priority / effect field to the formal
 * AGENTS.md entry, so a partial router edit cannot silently change priority or
 * meaning while retaining individually valid rule bytes.
 */
export function userRulesAcceptanceDigest(entries, state = null) {
  if (!Array.isArray(entries)) throw new Error("user-rules acceptance digest requires an entry array");
  const canonicalEntries = entries.map((entry, index) => normalizeUserRuleEntry(entry, index));
  const canonical = state
    ? { schemaVersion: USER_RULES_ACCEPTANCE_SCHEMA_VERSION, state: normalizeUserRulesState(state), entries: canonicalEntries }
    : { schemaVersion: 1, entries: canonicalEntries };
  return sha256(`${JSON.stringify(canonical)}\n`);
}

/**
 * Creates the state portion of a whole acceptance witness. The Kit base is
 * identified by its package version and the exact normalized managed-core
 * bytes; user rules remain represented separately by their raw-byte entries.
 */
export function createUserRulesState({ packageVersion, agentsText } = {}) {
  if (typeof packageVersion !== "string" || !/^\d+\.\d+\.\d+$/.test(packageVersion)) {
    throw new Error("user-rules state requires a stable package version");
  }
  return Object.freeze({
    kitBase: Object.freeze({
      target: "AGENTS.md",
      packageVersion,
      managedCoreSha256: managedCoreSha256(agentsText)
    }),
    router: Object.freeze({
      path: USER_RULES_ROUTER_PATH,
      contentRoot: USER_RULES_CONTENT_ROOT
    })
  });
}

/** Rewrites only the state and registry regions of the formal router. */
export function renderUserRulesRouter(routerText, { state, entries } = {}) {
  const normalizedState = normalizeUserRulesState(state);
  if (!Array.isArray(entries)) throw new Error("user-rules router rendering requires entries");
  const canonicalEntries = entries.map((entry, index) => normalizeUserRuleEntry(entry, index));
  const source = ensureStateRegion(String(routerText));
  return replaceMarkedJson(
    replaceMarkedJson(source, registryStart, registryEnd, canonicalEntries),
    stateStart,
    stateEnd,
    normalizedState
  );
}

function ensureStateRegion(routerText) {
  const hasStart = count(routerText, stateStart);
  const hasEnd = count(routerText, stateEnd);
  if (hasStart === 0 && hasEnd === 0) {
    // A v1 formal router had no Kit-base state section. Adding this isolated,
    // marker-bounded acceptance region leaves its registry and every user byte
    // untouched; any malformed partial region is still rejected below.
    return `${routerText.replace(/\s*$/, "")}\n\n${stateStart}\n\`\`\`json\n{}\n\`\`\`\n${stateEnd}\n`;
  }
  if (hasStart !== 1 || hasEnd !== 1) throw new Error("user-rules router state markers must be unique");
  return routerText;
}

/** Replaces the sole formal acceptance digest in the AGENTS external entry. */
export function renderUserRulesAcceptanceDigest(agentsText, digest) {
  if (typeof digest !== "string" || !/^[a-f0-9]{64}$/.test(digest)) throw new Error("user-rules acceptance digest is invalid");
  const source = String(agentsText);
  const entry = parseFormalUserRulesEntry(source);
  const newline = source.includes("\r\n") ? "\r\n" : "\n";
  const lines = source.split(/\r?\n/);
  lines[entry.acceptanceDigestLine] = `<!-- ack:user-rules-acceptance:sha256=${digest} -->`;
  return lines.join(newline);
}

/**
 * Creates one canonical, hash-bound registration for a fresh user rule.
 * Later migration code may supply a distinct source witness, but it must use
 * the same strict schema and be accepted atomically with its target state.
 */
export function createFreshUserRuleAcceptance({ entryId, contentPath, bytes, priorityRelation = "before-task-packs", effectDecision = "fresh-user-rule" } = {}) {
  const normalizedId = normalizeEntryId(entryId);
  const normalizedPath = normalizeUserRulePath(contentPath);
  const content = toBuffer(bytes, "fresh user-rule acceptance requires raw bytes");
  const witness = byteWitness(content);
  return Object.freeze({
    entryId: normalizedId,
    contentPath: normalizedPath,
    accepted: witness,
    sourceWitness: witness,
    originalReader: Object.freeze({ reader: "fresh-user-registration", via: "user-controlled-content" }),
    activeReader: Object.freeze({ reader: "AGENTS.md", via: USER_RULES_ROUTER_PATH }),
    priorityRelation: requiredText(priorityRelation, "user-rules priority relation is required"),
    effectDecision: requiredText(effectDecision, "user-rules effect decision is required")
  });
}

/** True only for the canonical content area used by a registered rule. */
export function isFormalUserRulesContentPath(value) {
  try {
    return normalizeUserRulePath(value) === value;
  } catch {
    return false;
  }
}

/**
 * Parses the JSON acceptance registry delimited by the durable router markers.
 * Directory placement, titles, language, and file shape are never ownership
 * evidence; only the registry's accepted byte witness governs this reader.
 */
export function parseUserRulesRegistry(text) {
  const source = String(text);
  if (count(source, registryStart) !== 1 || count(source, registryEnd) !== 1) {
    throw new Error("user-rules registry markers must be unique");
  }
  const start = source.indexOf(registryStart) + registryStart.length;
  const end = source.indexOf(registryEnd);
  if (end < start) throw new Error("user-rules registry markers are out of order");
  const body = source.slice(start, end).trim();
  const fenced = /^```json\r?\n([\s\S]*?)\r?\n```$/.exec(body);
  if (!fenced) throw new Error("user-rules registry must be one JSON fenced block");
  let rawEntries;
  try {
    rawEntries = JSON.parse(fenced[1]);
  } catch {
    throw new Error("user-rules registry JSON is invalid");
  }
  if (!Array.isArray(rawEntries)) throw new Error("user-rules registry must be a JSON array");
  const entryIds = new Set();
  const contentPaths = new Set();
  return Object.freeze(rawEntries.map((value, index) => {
    const entry = normalizeUserRuleEntry(value, index);
    if (entryIds.has(entry.entryId)) throw new Error(`user-rules registry duplicates entry id: ${entry.entryId}`);
    if (contentPaths.has(entry.contentPath)) throw new Error(`user-rules registry duplicates entry path: ${entry.contentPath}`);
    entryIds.add(entry.entryId);
    contentPaths.add(entry.contentPath);
    return entry;
  }));
}

export function parseUserRulesState(text) {
  const source = String(text);
  if (count(source, stateStart) === 0 && count(source, stateEnd) === 0) return null;
  return normalizeUserRulesState(parseMarkedJson(source, stateStart, stateEnd, "user-rules state"));
}

function parseUserRulesAcceptanceDigest(agentsText) {
  return parseFormalUserRulesEntry(agentsText).acceptanceDigest;
}

function parseFormalUserRulesEntry(agentsText) {
  const source = String(agentsText);
  if (count(source, FORMAL_USER_RULES_ENTRY_ANCHOR) !== 1) {
    throw new Error("AGENTS.md must contain one formal user-rules entry");
  }
  const rawDigestMatches = [...source.matchAll(acceptanceAnchorPattern)];
  if (rawDigestMatches.length !== 1) throw new Error("AGENTS.md must contain one user-rules acceptance digest");

  const lines = source.split(/\r?\n/);
  let fence = null;
  let comment = false;
  const activeAnchors = [];
  const activeDigests = [];
  const activeInstructionLines = new Set();
  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    const fenceMarker = /^(?:```|~~~)/.exec(trimmed)?.[0] ?? null;
    if (fence) {
      if (fenceMarker === fence) fence = null;
      continue;
    }
    if (fenceMarker) {
      fence = fenceMarker;
      continue;
    }
    if (comment) {
      if (trimmed.includes("-->")) comment = false;
      continue;
    }
    if (trimmed === FORMAL_USER_RULES_ENTRY_ANCHOR) {
      activeAnchors.push(index);
      continue;
    }
    const digest = /^<!-- ack:user-rules-acceptance:sha256=([a-f0-9]{64}) -->$/.exec(trimmed);
    if (digest) {
      activeDigests.push({ index, digest: digest[1] });
      continue;
    }
    if (trimmed.startsWith("<!--")) {
      if (!trimmed.includes("-->")) comment = true;
      continue;
    }
    if (trimmed.startsWith(formalEntryInstruction)) activeInstructionLines.add(index);
  }
  if (fence || comment || activeAnchors.length !== 1 || activeDigests.length !== 1) {
    throw new Error("AGENTS.md does not contain one active formal user-rules entry");
  }
  const anchorLine = activeAnchors[0];
  const digest = activeDigests[0];
  if (digest.index !== anchorLine + 1 || !activeInstructionLines.has(digest.index + 1)) {
    throw new Error("AGENTS.md formal user-rules entry is not an active canonical instruction");
  }
  return Object.freeze({ acceptanceDigest: digest.digest, acceptanceDigestLine: digest.index });
}

function normalizeUserRulesState(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("user-rules state must be an object");
  const kitBase = value.kitBase;
  const router = value.router;
  if (!kitBase || typeof kitBase !== "object" || Array.isArray(kitBase)
    || kitBase.target !== "AGENTS.md"
    || typeof kitBase.packageVersion !== "string" || !/^\d+\.\d+\.\d+$/.test(kitBase.packageVersion)
    || typeof kitBase.managedCoreSha256 !== "string" || !/^[a-f0-9]{64}$/.test(kitBase.managedCoreSha256)) {
    throw new Error("user-rules Kit base state is invalid");
  }
  if (!router || typeof router !== "object" || Array.isArray(router)
    || router.path !== USER_RULES_ROUTER_PATH || router.contentRoot !== USER_RULES_CONTENT_ROOT) {
    throw new Error("user-rules router state is invalid");
  }
  return Object.freeze({
    kitBase: Object.freeze({ target: "AGENTS.md", packageVersion: kitBase.packageVersion, managedCoreSha256: kitBase.managedCoreSha256 }),
    router: Object.freeze({ path: USER_RULES_ROUTER_PATH, contentRoot: USER_RULES_CONTENT_ROOT })
  });
}

function assertCurrentKitState(agentsText, state) {
  if (managedCoreSha256(agentsText) !== state.kitBase.managedCoreSha256) {
    throw new Error("AGENTS.md managed core does not match the accepted current user-rules state");
  }
}

function managedCoreSha256(agentsText) {
  const source = String(agentsText).replace(/\r\n?/g, "\n");
  const start = source.indexOf(managedCoreStart);
  const end = source.indexOf(managedCoreEnd);
  if (start < 0 || end < 0 || end <= start || count(source, managedCoreStart) !== 1 || count(source, managedCoreEnd) !== 1) {
    throw new Error("AGENTS.md has no unique managed core for user-rules state");
  }
  const contentStart = start + managedCoreStart.length;
  return sha256(Buffer.from(source.slice(contentStart, end).replace(/^\n|\n$/g, ""), "utf8"));
}

function replaceMarkedJson(text, startMarker, endMarker, value) {
  const source = String(text);
  if (count(source, startMarker) !== 1 || count(source, endMarker) !== 1) {
    throw new Error("user-rules router markers must be unique");
  }
  const start = source.indexOf(startMarker) + startMarker.length;
  const end = source.indexOf(endMarker);
  if (end < start) throw new Error("user-rules router markers are out of order");
  return `${source.slice(0, start)}\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n${source.slice(end)}`;
}

function parseMarkedJson(source, startMarker, endMarker, label) {
  if (count(source, startMarker) !== 1 || count(source, endMarker) !== 1) throw new Error(`${label} markers must be unique`);
  const start = source.indexOf(startMarker) + startMarker.length;
  const end = source.indexOf(endMarker);
  if (end < start) throw new Error(`${label} markers are out of order`);
  const body = source.slice(start, end).trim();
  const fenced = /^```json\r?\n([\s\S]*?)\r?\n```$/.exec(body);
  if (!fenced) throw new Error(`${label} must be one JSON fenced block`);
  try { return JSON.parse(fenced[1]); } catch { throw new Error(`${label} JSON is invalid`); }
}

async function hasActiveUpgradeLock(rootPath) {
  const lockPath = path.join(rootPath, "dev", "governance_migrations", ".upgrade.lock");
  try {
    return Boolean(await lstat(lockPath));
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function normalizeUserRuleEntry(value, index) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`user-rules registry entry ${index + 1} must be an object`);
  const entryId = normalizeEntryId(value.entryId);
  const contentPath = normalizeUserRulePath(value.contentPath);
  const accepted = normalizeByteWitness(value.accepted, `user-rules accepted bytes are invalid: ${contentPath}`);
  const sourceWitness = normalizeByteWitness(value.sourceWitness, `user-rules source witness is invalid: ${contentPath}`);
  if (accepted.sha256 !== sourceWitness.sha256 || accepted.bytes !== sourceWitness.bytes || accepted.contentBase64 !== sourceWitness.contentBase64) {
    throw new Error(`user-rules source witness does not exactly match accepted bytes: ${contentPath}`);
  }
  const originalReader = normalizeReader(value.originalReader, "user-rules original reader is invalid");
  const activeReader = normalizeReader(value.activeReader, "user-rules active reader is invalid");
  if (activeReader.reader !== "AGENTS.md" || activeReader.via !== USER_RULES_ROUTER_PATH) {
    throw new Error(`user-rules active reader is not the formal entry: ${contentPath}`);
  }
  if (value.priorityRelation !== "before-task-packs") {
    throw new Error(`user-rules priority relation is not effective through the formal entry: ${contentPath}`);
  }
  if (value.effectDecision !== "fresh-user-rule") {
    throw new Error(`user-rules effect decision is not accepted through the formal entry: ${contentPath}`);
  }
  return Object.freeze({
    entryId,
    contentPath,
    accepted,
    sourceWitness,
    originalReader,
    activeReader,
    priorityRelation: "before-task-packs",
    effectDecision: "fresh-user-rule"
  });
}

function normalizeByteWitness(value, message) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(message);
  const sha = requiredText(value.sha256, message);
  if (!/^[a-f0-9]{64}$/.test(sha)) throw new Error(message);
  if (!Number.isInteger(value.bytes) || value.bytes < 0) throw new Error(message);
  const content = decodeBase64(value.contentBase64, message);
  if (content.length !== value.bytes || sha256(content) !== sha) throw new Error(message);
  return Object.freeze({ sha256: sha, bytes: value.bytes, contentBase64: value.contentBase64 });
}

function normalizeReader(value, message) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(message);
  return Object.freeze({ reader: requiredText(value.reader, message), via: requiredText(value.via, message) });
}

function assertAcceptedBytes(entry, bytes) {
  if (bytes.length !== entry.accepted.bytes || sha256(bytes) !== entry.accepted.sha256 || !bytes.equals(Buffer.from(entry.accepted.contentBase64, "base64"))) {
    throw new Error(`user-rules bytes do not match accepted witness: ${entry.contentPath}`);
  }
}

async function readSafeFile(rootPath, realRoot, relative) {
  const absolute = path.resolve(rootPath, relative);
  if (!isInside(rootPath, absolute)) throw new Error(`user-rules path escapes the project root: ${relative}`);
  const stats = await lstat(absolute).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!stats?.isFile() || stats.isSymbolicLink()) throw new Error(`user-rules file is missing or unsafe: ${relative}`);
  const resolved = await realpath(absolute);
  if (!isInside(realRoot, resolved)) throw new Error(`user-rules file resolves outside the project root: ${relative}`);
  return { bytes: await readFile(absolute) };
}

function byteWitness(bytes) {
  return Object.freeze({ sha256: sha256(bytes), bytes: bytes.length, contentBase64: bytes.toString("base64") });
}

function normalizeEntryId(value) {
  const entryId = requiredText(value, "user-rules entry id is required");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(entryId)) throw new Error("user-rules entry id is invalid");
  return entryId;
}

function normalizeUserRulePath(value) {
  const relative = normalizeProjectRelative(value);
  if (!relative || !relative.startsWith(USER_RULES_CONTENT_ROOT)) throw new Error("user-rules entry must stay under dev/user_rules/");
  return relative;
}

function normalizeProjectRelative(value) {
  if (typeof value !== "string") return null;
  const normalized = path.posix.normalize(value.replaceAll("\\", "/").replace(/^\.\//, ""));
  if (!normalized || normalized === "." || normalized === ".." || normalized.startsWith("../") || path.posix.isAbsolute(normalized)) return null;
  return normalized;
}

function isInside(root, target) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function decodeBase64(value, message) {
  if (typeof value !== "string" || !/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 !== 0) throw new Error(message);
  const bytes = Buffer.from(value, "base64");
  if (bytes.toString("base64") !== value) throw new Error(message);
  return bytes;
}

function toBuffer(value, message) {
  if (Buffer.isBuffer(value)) return Buffer.from(value);
  if (typeof value === "string") return Buffer.from(value, "utf8");
  throw new Error(message);
}

function requiredText(value, message) {
  if (typeof value !== "string" || !value.trim()) throw new Error(message);
  return value.trim();
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function count(text, fragment) {
  return text.split(fragment).length - 1;
}
