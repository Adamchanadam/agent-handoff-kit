import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getOfficialBaseline, validateOfficialOriginCatalog } from "./official-origin-catalog.mjs";
import { UPGRADE_INVENTORY_SCHEMA } from "./upgrade-inventory.mjs";

export const SEMANTIC_CANDIDATE_SCHEMA = 3;
export const semanticCandidateDecisions = Object.freeze([
  "preserve",
  "integrate",
  "move",
  "unchanged",
  "unresolved"
]);
export const semanticCandidateOwnership = Object.freeze([
  "kit-managed-exact",
  "user-or-unknown"
]);

const completeDecisions = new Set(semanticCandidateDecisions.filter((decision) => decision !== "unresolved"));
const ownershipKinds = new Set(semanticCandidateOwnership);
const userRulesRouterPath = "dev/USER_RULES.md";
const userRulesContentRoot = "dev/user_rules/";
const officialPackageName = "@adamchanadam/agent-handoff-kit";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const officialOriginCatalogPath = path.join(__dirname, "migration-baselines", "official-origin-catalog.json");
let cachedOfficialOriginCatalog = null;

/**
 * Builds an inert semantic-candidate bundle from a frozen inventory. The
 * bundle contains no operation authority: it can neither write nor activate
 * a project. Its job is only to make every proposed data disposition
 * hash-bound, complete, and mechanically inspectable before later stages.
 */
export function buildSemanticCandidate({ inventory, sourceContents, proposals, managedOrigins = [], toolVersion, projectRoot } = {}) {
  const sourceEntries = assertReadyInventory(inventory);
  const sourceByPath = toSourceContentMap(sourceContents, sourceEntries);
  const proposalByPath = toProposalMap(proposals, sourceEntries);
  const managedOriginByPath = toManagedOriginMap(managedOrigins, sourceEntries, sourceByPath, projectRoot);
  const sourceEntryByPath = new Map(sourceEntries.map((entry) => [entry.path, entry]));
  const normalizedToolVersion = requiredText(toolVersion, "semantic candidate requires a tool version");
  const candidates = [];
  const destinationContentByPath = new Map();

  for (const source of sourceEntries) {
    const proposal = proposalByPath.get(source.path);
    const sourceContent = sourceByPath.get(source.path);
    assert(sha256(sourceContent) === source.sha256, `source content no longer matches inventory: ${source.path}`);
    const decision = requiredText(proposal.decision, `candidate decision is required: ${source.path}`);
    assert(semanticCandidateDecisions.includes(decision), `unsupported semantic decision for ${source.path}: ${decision}`);
    const reason = requiredText(proposal.reason, `candidate reason is required: ${source.path}`);
    const ownership = normalizeOwnership(proposal.ownership, source, managedOriginByPath);

    const sourceByteRanges = normalizeSourceByteRanges(proposal.sourceByteRanges, source, sourceContent, ownership);

    if (decision === "unresolved") {
      candidates.push({
        sourcePath: source.path,
        sourceSha256: source.sha256,
        ownership,
        decision,
        reason,
        originalObligations: normalizeObligations(proposal.originalObligations, source.path),
        expectedReachability: formalReachability(source.path, sourceEntryByPath),
        expectedEffect: pendingEffect(proposal.expectedEffect, source.path),
        sourceByteRanges,
        destination: null,
        preservationWitness: null,
        userOverlay: null,
        preservationRoute: null
      });
      continue;
    }

    assert(completeDecisions.has(decision), `unsupported complete decision for ${source.path}: ${decision}`);
    const destinationPath = normalizeProjectRelative(proposal.destinationPath);
    assert(destinationPath, `candidate destination escapes project root: ${source.path}`);
    const destinationContent = toBuffer(proposal.destinationContent, `candidate destination content is required: ${source.path}`);
    const priorDestination = destinationContentByPath.get(destinationPath);
    if (priorDestination) {
      assert(priorDestination.equals(destinationContent), `candidate destinations disagree on content: ${destinationPath}`);
    } else {
      destinationContentByPath.set(destinationPath, destinationContent);
    }

    const offset = destinationContent.indexOf(sourceContent);
    assert(offset >= 0, `candidate does not preserve exact source bytes: ${source.path}`);
    const userOverlay = ownership.kind === "user-or-unknown" && proposal.userOverlay != null
      ? normalizeUserOverlay(proposal.userOverlay, source, sourceContent, destinationPath, destinationContent, offset, sourceEntryByPath)
      : null;
    const expectedReachability = userOverlay?.expectedReachability ?? formalReachability(source.path, sourceEntryByPath);
    if (ownership.kind === "user-or-unknown") {
      assert(expectedReachability.length > 0, `user-or-unknown source has no verified formal reader: ${source.path}`);
    }
    const preservationRoute = ownership.kind === "user-or-unknown"
      ? normalizePreservationRoute(proposal.preservationRoute, source, destinationPath, expectedReachability, userOverlay)
      : null;
    candidates.push({
      sourcePath: source.path,
      sourceSha256: source.sha256,
      ownership,
      decision,
      reason,
      originalObligations: normalizeObligations(proposal.originalObligations, source.path),
      expectedReachability,
      expectedEffect: pendingEffect(proposal.expectedEffect, source.path),
      sourceByteRanges,
      destination: {
        path: destinationPath,
        sha256: sha256(destinationContent),
        contentBase64: destinationContent.toString("base64")
      },
      preservationWitness: {
        kind: "exact-source-bytes",
        offset,
        bytes: sourceContent.length
      },
      userOverlay,
      preservationRoute
    });
  }

  const items = candidates.sort((left, right) => left.sourcePath.localeCompare(right.sourcePath));
  const body = {
    schemaVersion: SEMANTIC_CANDIDATE_SCHEMA,
    inventorySchemaVersion: UPGRADE_INVENTORY_SCHEMA,
    inventorySha256: inventory.inventorySha256,
    toolVersion: normalizedToolVersion,
    operationAuthority: "none",
    activationStatus: "not-authorized",
    runtimeValidationStatus: "not-run",
    status: items.some((item) => item.decision === "unresolved") ? "blocked-unresolved" : "pending-independent-review",
    items
  };
  return Object.freeze({ ...body, candidateSha256: digest(body) });
}

/**
 * Rechecks a serialized candidate against the live source and frozen
 * inventory. This is deliberately independent of review/provider data:
 * deterministic data validation may inspect a candidate, but it still grants
 * no write or activation authority.
 */
export function assertCandidateReadyForDeterministicValidation({ candidate, inventory, sourceContents, managedOrigins = [], toolVersion, projectRoot } = {}) {
  assert(candidate && typeof candidate === "object", "semantic candidate is required");
  const sourceEntries = assertReadyInventory(inventory);
  assert(candidate.schemaVersion === SEMANTIC_CANDIDATE_SCHEMA, "semantic candidate schema version is not supported");
  assert(candidate.inventorySchemaVersion === UPGRADE_INVENTORY_SCHEMA, "semantic candidate inventory schema is not supported");
  assert(candidate.inventorySha256 === inventory.inventorySha256, "semantic candidate inventory digest does not match the frozen inventory");
  assert(candidate.toolVersion === requiredText(toolVersion, "deterministic validation requires a tool version"), "semantic candidate tool version does not match the current tool");
  assert(candidate.operationAuthority === "none" && candidate.activationStatus === "not-authorized", "semantic candidate must not claim operation authority");
  assert(candidate.runtimeValidationStatus === "not-run", "semantic candidate must not claim runtime validation");
  assert(["pending-independent-review", "blocked-unresolved"].includes(candidate.status), "semantic candidate has an invalid status");
  assert(Array.isArray(candidate.items), "semantic candidate items are required");
  assert(candidate.candidateSha256 === digest(candidateBody(candidate)), "semantic candidate digest does not match its contents");

  const sourceByPath = toSourceContentMap(sourceContents, sourceEntries);
  const managedOriginByPath = toManagedOriginMap(managedOrigins, sourceEntries, sourceByPath, projectRoot);
  const sourceEntryByPath = new Map(sourceEntries.map((entry) => [entry.path, entry]));
  const candidateByPath = new Map();
  const destinationContentByPath = new Map();
  for (const item of candidate.items) {
    assert(item && typeof item === "object", "semantic candidate item must be an object");
    assert(!candidateByPath.has(item.sourcePath), `semantic candidate duplicates source: ${item.sourcePath}`);
    candidateByPath.set(item.sourcePath, item);
  }
  assert(candidateByPath.size === sourceEntries.length, "semantic candidate does not cover the frozen inventory exactly");

  for (const source of sourceEntries) {
    const item = candidateByPath.get(source.path);
    assert(item, `semantic candidate omitted source: ${source.path}`);
    assert(item.sourceSha256 === source.sha256, `semantic candidate source hash mismatch: ${source.path}`);
    const sourceContent = sourceByPath.get(source.path);
    assert(sha256(sourceContent) === source.sha256, `source content no longer matches inventory: ${source.path}`);
    const ownership = normalizeOwnership(item.ownership, source, managedOriginByPath);
    assert(semanticCandidateDecisions.includes(item.decision), `semantic candidate has invalid decision: ${source.path}`);
    requiredText(item.reason, `semantic candidate reason is required: ${source.path}`);
    normalizeObligations(item.originalObligations, source.path);
    const expectedReachability = normalizeReachability(item.expectedReachability, source.path);
    pendingEffect(item.expectedEffect, source.path);
    const sourceByteRanges = normalizeSourceByteRanges(item.sourceByteRanges, source, sourceContent, ownership);

    if (item.decision === "unresolved") {
      assert(item.destination === null && item.preservationWitness === null && item.userOverlay === null && item.preservationRoute === null, `unresolved item must not claim a destination: ${source.path}`);
      assert(sameReachability(expectedReachability, formalReachability(source.path, sourceEntryByPath)), `semantic candidate reachability is not derived from the frozen formal reader graph: ${source.path}`);
      continue;
    }

    assert(completeDecisions.has(item.decision), `semantic candidate has invalid complete decision: ${source.path}`);
    assert(item.destination && typeof item.destination === "object", `semantic candidate destination is required: ${source.path}`);
    const destinationPath = normalizeProjectRelative(item.destination.path);
    assert(destinationPath, `semantic candidate destination escapes project root: ${source.path}`);
    const destinationContent = decodeBase64(item.destination.contentBase64, source.path);
    assert(sha256(destinationContent) === item.destination.sha256, `semantic candidate destination hash mismatch: ${source.path}`);
    const previous = destinationContentByPath.get(destinationPath);
    if (previous) assert(previous.equals(destinationContent), `semantic candidate destinations disagree on content: ${destinationPath}`);
    else destinationContentByPath.set(destinationPath, destinationContent);
    assert(item.preservationWitness?.kind === "exact-source-bytes", `semantic candidate preservation witness is invalid: ${source.path}`);
    assert(Number.isInteger(item.preservationWitness.offset) && item.preservationWitness.offset >= 0, `semantic candidate preservation offset is invalid: ${source.path}`);
    assert(item.preservationWitness.bytes === sourceContent.length, `semantic candidate preservation byte count is invalid: ${source.path}`);
    assert(item.preservationWitness.offset + sourceContent.length <= destinationContent.length, `semantic candidate preservation range is invalid: ${source.path}`);
    assert(destinationContent.subarray(item.preservationWitness.offset, item.preservationWitness.offset + sourceContent.length).equals(sourceContent), `semantic candidate preservation witness does not match source: ${source.path}`);
    if (ownership.kind === "user-or-unknown") {
      const userOverlay = item.userOverlay == null
        ? null
        : normalizeUserOverlay(item.userOverlay, source, sourceContent, destinationPath, destinationContent, item.preservationWitness.offset, sourceEntryByPath);
      const verifiedReachability = userOverlay?.expectedReachability ?? formalReachability(source.path, sourceEntryByPath);
      assert(sameReachability(expectedReachability, verifiedReachability), `semantic candidate reachability is not derived from the frozen formal reader graph: ${source.path}`);
      assert(verifiedReachability.length > 0, `user-or-unknown source has no verified formal reader: ${source.path}`);
      normalizePreservationRoute(item.preservationRoute, source, destinationPath, expectedReachability, userOverlay);
    } else {
      assert(item.userOverlay === null && item.preservationRoute === null, `exact Kit-managed item must not claim a user preservation route: ${source.path}`);
      assert(sameReachability(expectedReachability, formalReachability(source.path, sourceEntryByPath)), `semantic candidate reachability is not derived from the frozen formal reader graph: ${source.path}`);
    }
  }

  assert(candidate.status !== "blocked-unresolved", "unresolved semantic items block deterministic validation");
  return candidate;
}

function assertReadyInventory(inventory) {
  assert(inventory && typeof inventory === "object", "semantic candidate requires an inventory");
  assert(inventory.schemaVersion === UPGRADE_INVENTORY_SCHEMA, "semantic candidate inventory schema is not supported");
  assert(inventory.status === "ready", "semantic candidate requires a ready inventory");
  assert(Array.isArray(inventory.entries) && inventory.entries.length > 0, "semantic candidate inventory entries are required");
  assert(typeof inventory.inventorySha256 === "string" && /^[a-f0-9]{64}$/.test(inventory.inventorySha256), "semantic candidate inventory digest is invalid");
  const entries = [...inventory.entries].sort((left, right) => left.path.localeCompare(right.path));
  const paths = new Set();
  for (const entry of entries) {
    assert(entry && typeof entry === "object", "semantic candidate inventory entry must be an object");
    assert(normalizeProjectRelative(entry.path) === entry.path, `semantic candidate inventory path is invalid: ${entry.path}`);
    assert(!paths.has(entry.path), `semantic candidate inventory duplicates source: ${entry.path}`);
    paths.add(entry.path);
    assert(typeof entry.sha256 === "string" && /^[a-f0-9]{64}$/.test(entry.sha256), `semantic candidate inventory hash is invalid: ${entry.path}`);
    assert(Array.isArray(entry.reachability), `semantic candidate inventory reachability is invalid: ${entry.path}`);
    for (const reachability of entry.reachability) {
      assert(reachability && typeof reachability === "object", `semantic candidate inventory reachability is invalid: ${entry.path}`);
      assert(typeof reachability.from === "string" && reachability.from.trim(), `semantic candidate inventory reachability source is invalid: ${entry.path}`);
      assert(typeof reachability.via === "string" && reachability.via.trim(), `semantic candidate inventory reachability route is invalid: ${entry.path}`);
    }
  }
  return entries;
}

function toSourceContentMap(sourceContents, sourceEntries) {
  const map = new Map();
  const pairs = sourceContents instanceof Map
    ? [...sourceContents]
    : Array.isArray(sourceContents)
      ? sourceContents
      : sourceContents && typeof sourceContents === "object"
        ? Object.entries(sourceContents)
        : [];
  for (const pair of pairs) {
    assert(Array.isArray(pair) && pair.length === 2, "source contents must contain path/content pairs");
    const sourcePath = normalizeProjectRelative(pair[0]);
    assert(sourcePath, "source content path escapes project root");
    assert(!map.has(sourcePath), `source contents duplicate path: ${sourcePath}`);
    map.set(sourcePath, toBuffer(pair[1], `source content is required: ${sourcePath}`));
  }
  const expectedPaths = new Set(sourceEntries.map((entry) => entry.path));
  assert(map.size === expectedPaths.size, "source contents do not cover the frozen inventory exactly");
  for (const sourcePath of expectedPaths) assert(map.has(sourcePath), `source content missing for inventory path: ${sourcePath}`);
  for (const sourcePath of map.keys()) assert(expectedPaths.has(sourcePath), `source content is outside the frozen inventory: ${sourcePath}`);
  return map;
}

function toProposalMap(proposals, sourceEntries) {
  assert(Array.isArray(proposals), "semantic candidate proposals are required");
  const map = new Map();
  for (const proposal of proposals) {
    assert(proposal && typeof proposal === "object", "semantic candidate proposal must be an object");
    const sourcePath = normalizeProjectRelative(proposal.sourcePath);
    assert(sourcePath, "semantic candidate proposal source escapes project root");
    assert(!map.has(sourcePath), `semantic candidate proposals duplicate source: ${sourcePath}`);
    map.set(sourcePath, proposal);
  }
  const expectedPaths = new Set(sourceEntries.map((entry) => entry.path));
  assert(map.size === expectedPaths.size, "semantic candidate proposals do not cover the frozen inventory exactly");
  for (const sourcePath of expectedPaths) assert(map.has(sourcePath), `semantic candidate proposal omitted source: ${sourcePath}`);
  for (const sourcePath of map.keys()) assert(expectedPaths.has(sourcePath), `semantic candidate proposal is outside the frozen inventory: ${sourcePath}`);
  return map;
}

/**
 * An exact Kit claim is deliberately whole-file evidence. A source that no
 * longer equals its packaged bytes cannot donate a "mostly official" range
 * to an automatic upgrade; it remains user-or-unknown until a human-review
 * candidate chooses a safe preservation route.
 */
function toManagedOriginMap(value, sourceEntries, sourceByPath, projectRoot) {
  const map = new Map();
  const pairs = value instanceof Map
    ? [...value]
    : Array.isArray(value)
      ? value.map((item) => [item?.sourcePath, item])
      : value && typeof value === "object"
        ? Object.entries(value)
        : [];
  const expectedPaths = new Set(sourceEntries.map((entry) => entry.path));
  for (const [rawPath, rawOrigin] of pairs) {
    assert(rawOrigin && typeof rawOrigin === "object", "managed origin must be an object");
    const sourcePath = normalizeProjectRelative(rawOrigin.sourcePath ?? rawPath);
    assert(sourcePath && expectedPaths.has(sourcePath), `managed origin is outside frozen inventory: ${String(rawPath)}`);
    assert(!map.has(sourcePath), `managed origins duplicate source: ${sourcePath}`);
    const targetPath = normalizeProjectRelative(rawOrigin.targetPath);
    assert(targetPath === sourcePath, `managed origin target does not match source: ${sourcePath}`);
    const sourceSha256 = requiredText(rawOrigin.sourceSha256, `managed origin source hash is required: ${sourcePath}`);
    assert(sourceSha256 === sha256(sourceByPath.get(sourcePath)), `managed origin source hash does not match source: ${sourcePath}`);
    const packageProof = verifyPackageIdentity(rawOrigin.packageIdentity, sourcePath, sourceByPath.get(sourcePath), projectRoot);
    map.set(sourcePath, {
      packageIdentity: packageProof.packageIdentity,
      targetPath,
      sourceSha256,
      packageEvidence: packageProof.packageEvidence
    });
  }
  return map;
}

function normalizeOwnership(value, source, managedOriginByPath) {
  assert(value && typeof value === "object", `semantic candidate ownership is required: ${source.path}`);
  const kind = requiredText(value.kind, `semantic candidate ownership kind is required: ${source.path}`);
  assert(ownershipKinds.has(kind), `semantic candidate ownership kind is invalid: ${source.path}`);
  if (kind === "kit-managed-exact") {
    const expectedOrigin = managedOriginByPath.get(source.path);
    assert(expectedOrigin, `exact Kit-managed ownership lacks package evidence: ${source.path}`);
    const supplied = value.managedOrigin;
    if (supplied != null) {
      assert(supplied && typeof supplied === "object", `managed origin is invalid: ${source.path}`);
      assert(
        supplied.packageIdentity === expectedOrigin.packageIdentity
        && normalizeProjectRelative(supplied.targetPath) === expectedOrigin.targetPath
        && supplied.sourceSha256 === expectedOrigin.sourceSha256
        && (supplied.packageEvidence == null || samePackageEvidence(supplied.packageEvidence, expectedOrigin.packageEvidence)),
        `exact Kit-managed ownership evidence does not match source: ${source.path}`
      );
    }
    return { kind, managedOrigin: expectedOrigin };
  }
  assert(value.managedOrigin == null, `user-or-unknown ownership must not claim package origin: ${source.path}`);
  return { kind, managedOrigin: null };
}

function normalizeSourceByteRanges(value, source, sourceContent, ownership) {
  assert(Array.isArray(value) && value.length > 0, `semantic candidate requires source byte ranges: ${source.path}`);
  const ranges = [];
  let cursor = 0;
  for (const rawRange of value) {
    assert(rawRange && typeof rawRange === "object", `semantic candidate source byte range is invalid: ${source.path}`);
    const kind = requiredText(rawRange.kind, `semantic candidate source byte range kind is invalid: ${source.path}`);
    assert(["kit-managed-exact", "user-or-unknown"].includes(kind), `semantic candidate source byte range kind is invalid: ${source.path}`);
    const sourceOffset = rawRange.sourceOffset;
    const bytes = rawRange.bytes;
    assert(Number.isInteger(sourceOffset) && sourceOffset === cursor, `semantic candidate source byte ranges must be complete, ordered, and non-overlapping: ${source.path}`);
    assert(Number.isInteger(bytes) && bytes > 0 && sourceOffset + bytes <= sourceContent.length, `semantic candidate source byte range length is invalid: ${source.path}`);
    const sourceSha256 = requiredText(rawRange.sourceSha256, `semantic candidate source byte range hash is required: ${source.path}`);
    assert(sourceSha256 === sha256(sourceContent.subarray(sourceOffset, sourceOffset + bytes)), `semantic candidate source byte range hash mismatch: ${source.path}`);
    assert(kind === ownership.kind, `semantic candidate cannot auto-split ownership inside a source: ${source.path}`);
    ranges.push({ kind, sourceOffset, bytes, sourceSha256 });
    cursor += bytes;
  }
  assert(cursor === sourceContent.length, `semantic candidate source byte ranges do not reconstruct source exactly: ${source.path}`);
  if (ownership.kind === "kit-managed-exact") {
    assert(ranges.length === 1 && ranges[0].sourceOffset === 0 && ranges[0].bytes === sourceContent.length, `exact Kit-managed ownership must cover the whole source: ${source.path}`);
  }
  return ranges;
}

function normalizeUserOverlay(value, source, sourceContent, destinationPath, destinationContent, wholeOffset, sourceEntryByPath) {
  assert(value && typeof value === "object", `user overlay is required: ${source.path}`);
  const entryId = requiredText(value.entryId, `user overlay entry id is required: ${source.path}`);
  assert(/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(entryId), `user overlay entry id is invalid: ${source.path}`);
  const routerPath = normalizeProjectRelative(value.routerPath);
  assert(routerPath === userRulesRouterPath, `user overlay must use ${userRulesRouterPath}: ${source.path}`);
  const contentPath = normalizeProjectRelative(value.contentPath);
  assert(contentPath === destinationPath && contentPath.startsWith(userRulesContentRoot), `user overlay destination must be a registered user-rule file: ${source.path}`);
  assert(value.reader?.reader === "AGENTS.md" && value.reader?.via === userRulesRouterPath, `user overlay reader is not the formal runtime entry: ${source.path}`);
  const priorityRelation = requiredText(value.priorityRelation, `user overlay priority relation is required: ${source.path}`);
  assert(priorityRelation === "after-kit-base-before-task-packs", `user overlay priority relation is not the formal router order: ${source.path}`);
  assert(Array.isArray(value.sourceRangeWitnesses) && value.sourceRangeWitnesses.length > 0, `user overlay source range witnesses are required: ${source.path}`);
  const ranges = [];
  let cursor = 0;
  for (const rawRange of value.sourceRangeWitnesses) {
    assert(rawRange && typeof rawRange === "object", `user overlay source range witness is invalid: ${source.path}`);
    const sourceOffset = rawRange.sourceOffset;
    const bytes = rawRange.bytes;
    const destinationOffset = rawRange.destinationOffset;
    assert(Number.isInteger(sourceOffset) && sourceOffset === cursor, `user overlay source ranges must be complete, ordered, and non-overlapping: ${source.path}`);
    assert(Number.isInteger(bytes) && bytes > 0 && sourceOffset + bytes <= sourceContent.length, `user overlay source range length is invalid: ${source.path}`);
    assert(Number.isInteger(destinationOffset) && destinationOffset === wholeOffset + sourceOffset, `user overlay destination offset is invalid: ${source.path}`);
    const sourceSha256 = requiredText(rawRange.sourceSha256, `user overlay source range hash is required: ${source.path}`);
    const bytesFromSource = sourceContent.subarray(sourceOffset, sourceOffset + bytes);
    assert(sourceSha256 === sha256(bytesFromSource), `user overlay source range hash mismatch: ${source.path}`);
    assert(destinationContent.subarray(destinationOffset, destinationOffset + bytes).equals(bytesFromSource), `user overlay source range is not preserved at destination: ${source.path}`);
    ranges.push({ sourceOffset, bytes, sourceSha256, destinationOffset });
    cursor += bytes;
  }
  assert(cursor === sourceContent.length, `user overlay source ranges do not reconstruct source exactly: ${source.path}`);
  const expectedReachability = formalReachability(routerPath, sourceEntryByPath);
  assert(expectedReachability.some((entry) => entry.reader === "AGENTS.md" && entry.via === userRulesRouterPath), `user overlay router has no verified formal entry path: ${source.path}`);
  return {
    entryId,
    routerPath,
    contentPath,
    reader: { reader: "AGENTS.md", via: userRulesRouterPath },
    priorityRelation,
    sourceRangeWitnesses: ranges,
    expectedReachability
  };
}

function normalizePreservationRoute(value, source, destinationPath, expectedReachability, userOverlay) {
  assert(value && typeof value === "object", `user-or-unknown source requires a preservation route: ${source.path}`);
  const kind = requiredText(value.kind, `preservation route kind is required: ${source.path}`);
  const priorityRelation = requiredText(value.priorityRelation, `preservation route priority relation is required: ${source.path}`);
  if (kind === "formal-user-overlay") {
    assert(userOverlay, `formal user overlay route lacks registered content: ${source.path}`);
    assert(value.entryId === userOverlay.entryId && normalizeProjectRelative(value.routerPath) === userOverlay.routerPath && normalizeProjectRelative(value.contentPath) === userOverlay.contentPath, `formal user overlay route does not match its registered content: ${source.path}`);
    assert(value.reader?.reader === "AGENTS.md" && value.reader?.via === userRulesRouterPath, `formal user overlay route is not reachable from the runtime entry: ${source.path}`);
    assert(priorityRelation === userOverlay.priorityRelation, `formal user overlay route priority differs from registered content: ${source.path}`);
    assert(priorityRelation === "after-kit-base-before-task-packs", `formal user overlay route priority is not the formal router order: ${source.path}`);
    assert(expectedReachability.some((entry) => entry.reader === "AGENTS.md" && entry.via === userRulesRouterPath), `formal user overlay reachability is absent: ${source.path}`);
    return {
      kind,
      entryId: userOverlay.entryId,
      routerPath: userOverlay.routerPath,
      contentPath: userOverlay.contentPath,
      reader: { reader: "AGENTS.md", via: userRulesRouterPath },
      priorityRelation
    };
  }
  assert(kind === "existing-formal-reader", `preservation route kind is invalid: ${source.path}`);
  assert(userOverlay === null, `existing reader route must not silently move content into a user overlay: ${source.path}`);
  assert(priorityRelation === "preserve-existing-effect-pending-runtime-validation", `existing reader route priority is not a safe pending relation: ${source.path}`);
  const reader = requiredText(value.reader, `existing reader route reader is required: ${source.path}`);
  const via = requiredText(value.via, `existing reader route path is required: ${source.path}`);
  assert(normalizeProjectRelative(value.contentPath) === destinationPath, `existing reader route must preserve its destination path: ${source.path}`);
  assert(expectedReachability.some((entry) => entry.reader === reader && entry.via === via), `existing reader route is not in expected reachability: ${source.path}`);
  return { kind, contentPath: destinationPath, reader, via, priorityRelation };
}

function normalizeObligations(value, sourcePath) {
  assert(Array.isArray(value) && value.length > 0, `semantic candidate requires original obligations: ${sourcePath}`);
  const obligations = [...new Set(value.map((item) => requiredText(item, `semantic candidate obligation is invalid: ${sourcePath}`)))].sort((left, right) => left.localeCompare(right));
  assert(obligations.length === value.length, `semantic candidate obligations must be unique: ${sourcePath}`);
  return obligations;
}

function normalizeReachability(value, sourcePath) {
  assert(Array.isArray(value), `semantic candidate requires expected reachability: ${sourcePath}`);
  const entries = value.map((entry) => ({
    reader: requiredText(entry?.reader, `semantic candidate reachability reader is invalid: ${sourcePath}`),
    via: requiredText(entry?.via, `semantic candidate reachability route is invalid: ${sourcePath}`)
  }));
  entries.sort((left, right) => `${left.reader}\0${left.via}`.localeCompare(`${right.reader}\0${right.via}`));
  for (let index = 1; index < entries.length; index += 1) {
    assert(`${entries[index - 1].reader}\0${entries[index - 1].via}` !== `${entries[index].reader}\0${entries[index].via}`, `semantic candidate reachability must be unique: ${sourcePath}`);
  }
  return entries;
}

function formalReachability(sourcePath, sourceEntryByPath) {
  const readers = new Set();
  const visit = (currentPath, ancestors) => {
    if (ancestors.has(currentPath)) return;
    const source = sourceEntryByPath.get(currentPath);
    if (!source) return;
    const nextAncestors = new Set(ancestors);
    nextAncestors.add(currentPath);
    for (const edge of source.reachability) {
      if (edge.from === "formal-entry") readers.add(source.path);
      else if (sourceEntryByPath.has(edge.from)) visit(edge.from, nextAncestors);
    }
  };
  visit(sourcePath, new Set());
  return [...readers]
    .sort((left, right) => left.localeCompare(right))
    .map((reader) => ({ reader, via: sourcePath }));
}

function sameReachability(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function verifyPackageIdentity(value, sourcePath, sourceContent, projectRoot) {
  const packageIdentity = requiredText(value, `managed origin package identity is required: ${sourcePath}`);
  const match = new RegExp(`^${escapeRegExp(officialPackageName)}@([0-9]+\\.[0-9]+\\.[0-9]+)$`).exec(packageIdentity);
  assert(match, `managed origin package identity is not an installed Kit release: ${sourcePath}`);
  assert(typeof projectRoot === "string" && projectRoot.trim(), `managed origin verification requires the selected project root: ${sourcePath}`);
  const version = match[1];
  const rootPath = path.resolve(projectRoot);
  const catalog = trustedOfficialOriginCatalog();
  const release = catalog.releases[version];
  const npm = release?.source?.npm;
  assert(npm?.spec === packageIdentity && /^[0-9a-f]{40}$/.test(npm.shasum) && typeof npm.integrity === "string" && npm.integrity.startsWith("sha512-") && Number.isInteger(npm.entryCount), `managed origin package artifact evidence is invalid: ${sourcePath}`);
  const installedTemplateVersion = readInstalledTemplateVersion(rootPath);
  assert(installedTemplateVersion === version, `managed origin package identity does not match the installed project package: ${sourcePath}`);
  const baseline = getOfficialBaseline({
    version,
    targetRel: sourcePath,
    catalog,
    root: rootPath
  });
  assert(baseline?.state === "present", `managed origin package does not contain target: ${sourcePath}`);
  assert(Buffer.from(baseline.text, "utf8").equals(sourceContent), `managed origin package bytes do not match source: ${sourcePath}`);
  return {
    packageIdentity,
    packageEvidence: Object.freeze({
      installedTemplateVersion,
      catalogDigestSha256: catalog.catalogDigestSha256,
      npm: Object.freeze({ spec: npm.spec, shasum: npm.shasum, integrity: npm.integrity, entryCount: npm.entryCount })
    })
  };
}

function readInstalledTemplateVersion(projectRoot) {
  let indexText;
  try {
    indexText = readFileSync(path.join(projectRoot, "dev", "PROJECT_INDEX.md"), "utf8");
  } catch {
    throw new Error("managed origin installed project package evidence is missing");
  }
  const match = /^\| Agent Handoff Kit template version \| ([0-9]+\.[0-9]+\.[0-9]+) \| [^|\n]+ \|$/m.exec(indexText);
  if (!match) throw new Error("managed origin installed project package evidence is invalid");
  return match[1];
}

function samePackageEvidence(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function trustedOfficialOriginCatalog() {
  if (cachedOfficialOriginCatalog) return cachedOfficialOriginCatalog;
  const catalog = JSON.parse(readFileSync(officialOriginCatalogPath, "utf8"));
  validateOfficialOriginCatalog(catalog);
  cachedOfficialOriginCatalog = catalog;
  return catalog;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pendingEffect(value, sourcePath) {
  assert(value && typeof value === "object", `semantic candidate requires expected effect: ${sourcePath}`);
  assert(value.status === "pending-runtime-validation", `semantic candidate cannot claim runtime effect before validation: ${sourcePath}`);
  assert(value.decision === "preserve-source-obligations-and-priority", `semantic candidate effect decision is invalid: ${sourcePath}`);
  return {
    status: "pending-runtime-validation",
    decision: "preserve-source-obligations-and-priority"
  };
}

function candidateBody(candidate) {
  const { candidateSha256, ...body } = candidate;
  return body;
}

function normalizeProjectRelative(value) {
  if (typeof value !== "string") return null;
  const normalized = path.posix.normalize(value.replaceAll("\\", "/").replace(/^\.\//, ""));
  if (!normalized || normalized === "." || normalized === ".." || normalized.startsWith("../") || path.posix.isAbsolute(normalized)) return null;
  return normalized;
}

function toBuffer(value, message) {
  if (Buffer.isBuffer(value)) return Buffer.from(value);
  if (typeof value === "string") return Buffer.from(value, "utf8");
  throw new Error(message);
}

function decodeBase64(value, sourcePath) {
  assert(typeof value === "string" && /^[A-Za-z0-9+/]*={0,2}$/.test(value) && value.length % 4 === 0, `semantic candidate destination encoding is invalid: ${sourcePath}`);
  return Buffer.from(value, "base64");
}

function requiredText(value, message) {
  assert(typeof value === "string" && value.trim().length > 0, message);
  return value.trim();
}

function digest(value) {
  return sha256(Buffer.from(`${JSON.stringify(value)}\n`, "utf8"));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
