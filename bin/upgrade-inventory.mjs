import { createHash } from "node:crypto";
import { lstat, readdir, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { installedFileContracts, upgradeStateFileContracts, INSTALLED_FILE_CONTRACT_SCHEMA } from "./installed-file-contract.mjs";
import { loadOfficialOriginCatalog } from "./official-origin-catalog.mjs";

export const UPGRADE_INVENTORY_SCHEMA = 1;
export const GATE5_FROZEN_SET_SCHEMA = 2;
export const GATE5_ROOT_SOURCE_INVENTORY_SCHEMA = 1;

const formalEntryTargets = Object.freeze([
  "AGENTS.md",
  "CLAUDE.md",
  "GEMINI.md",
  "START_NEXT_SESSION_PROMPT.txt"
]);

const dynamicDirectories = Object.freeze([
  { relative: "dev/governance_migrations", classification: "transaction-state" },
  { relative: "dev/SESSION_LOG_archive", classification: "session-log-archive" },
  { relative: "dev/session_log_archive", classification: "legacy-session-log-archive" }
]);

/**
 * Builds a read-only, hash-bound description of the Kit data that an upgrade
 * can reach. It deliberately records whole source files before any semantic
 * candidate tries to divide or merge their contents: a heading, language, or
 * layout is never treated as ownership evidence.
 */
export async function buildUpgradeInventory({ root, contracts = installedFileContracts } = {}) {
  if (!root) throw new Error("upgrade inventory requires a project root");
  const rootPath = path.resolve(root);
  const rootStats = await lstat(rootPath).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!rootStats?.isDirectory() || rootStats.isSymbolicLink()) {
    throw new Error("upgrade inventory root must be a real directory");
  }
  const realRoot = await realpath(rootPath);
  const entries = new Map();
  const blockers = [];
  const queue = [];
  const queued = new Set();

  const addBlocker = (relative, reason) => {
    const key = `${relative}\0${reason}`;
    if (!blockers.some((item) => `${item.path}\0${item.reason}` === key)) blockers.push({ path: relative, reason });
  };

  async function addFile(relative, classification, reachability = null, enqueueForReferences = false) {
    const normalized = normalizeProjectRelative(relative);
    if (!normalized) {
      addBlocker(String(relative), "reference escapes the selected project root");
      return null;
    }
    const absolute = path.resolve(rootPath, normalized);
    if (!isInside(rootPath, absolute)) {
      addBlocker(normalized, "reference escapes the selected project root");
      return null;
    }
    const stats = await lstat(absolute).catch((error) => {
      if (error?.code === "ENOENT") return null;
      throw error;
    });
    if (!stats) return null;
    if (stats.isSymbolicLink()) {
      addBlocker(normalized, "symbolic links and junctions are not accepted as inventory sources");
      return null;
    }
    if (!stats.isFile()) {
      addBlocker(normalized, "inventory source is not a regular file");
      return null;
    }
    const resolved = await realpath(absolute);
    if (!isInside(realRoot, resolved)) {
      addBlocker(normalized, "resolved inventory source is outside the selected project root");
      return null;
    }

    const buffer = await readFile(absolute);
    let entry = entries.get(normalized);
    if (!entry) {
      entry = {
        path: normalized,
        sha256: sha256(buffer),
        bytes: buffer.length,
        classifications: new Set(),
        reachability: new Map(),
        text: decodeUtf8(buffer)
      };
      entries.set(normalized, entry);
    }
    entry.classifications.add(classification);
    if (reachability) entry.reachability.set(`${reachability.from}\0${reachability.via}`, reachability);
    if (enqueueForReferences && entry.text != null && !queued.has(normalized)) {
      queued.add(normalized);
      queue.push(entry);
    }
    return entry;
  }

  for (const contract of contracts) {
    const isFormalEntry = formalEntryTargets.includes(contract.targetRel);
    await addFile(
      contract.targetRel,
      "managed-contract",
      isFormalEntry ? { from: "formal-entry", via: contract.targetRel } : { from: "managed-contract", via: contract.targetRel },
      true
    );
  }

  for (const directory of dynamicDirectories) {
    await addTree(directory.relative, directory.classification);
  }

  for (const contract of contracts) {
    if (!contract.targetRel.startsWith("dev/rules/")) continue;
    const legacy = `dev/${path.posix.basename(contract.targetRel)}`;
    await addFile(legacy, "legacy-rule-location", { from: "legacy-location", via: legacy }, true);
  }

  while (queue.length > 0) {
    const source = queue.shift();
    for (const reference of extractExplicitLocalReferences(source.text)) {
      const target = normalizeProjectRelative(reference.path);
      if (!target) continue;
      await addFile(target, "formal-reference", { from: source.path, via: reference.via }, true);
    }
  }

  const frozenEntries = [...entries.values()]
    .map((entry) => ({
      path: entry.path,
      sha256: entry.sha256,
      bytes: entry.bytes,
      classifications: [...entry.classifications].sort(),
      reachability: [...entry.reachability.values()]
        .sort((left, right) => `${left.from}\0${left.via}`.localeCompare(`${right.from}\0${right.via}`))
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const sortedBlockers = blockers.sort((left, right) => `${left.path}\0${left.reason}`.localeCompare(`${right.path}\0${right.reason}`));
  const digestInput = {
    schemaVersion: UPGRADE_INVENTORY_SCHEMA,
    entries: frozenEntries,
    blockers: sortedBlockers
  };

  return Object.freeze({
    schemaVersion: UPGRADE_INVENTORY_SCHEMA,
    status: sortedBlockers.length === 0 ? "ready" : "blocked",
    entries: frozenEntries,
    blockers: sortedBlockers,
    inventorySha256: sha256(Buffer.from(`${JSON.stringify(digestInput)}\n`, "utf8")),
    formalEntryTargets: formalEntryTargets.filter((target) => entries.has(target))
  });

  async function addTree(relativeDirectory, classification) {
    const normalized = normalizeProjectRelative(relativeDirectory);
    if (!normalized) {
      addBlocker(String(relativeDirectory), "dynamic directory escapes the selected project root");
      return;
    }
    if (!(await hasExactProjectPath(rootPath, normalized))) return;
    const absolute = path.resolve(rootPath, normalized);
    const stats = await lstat(absolute).catch((error) => {
      if (error?.code === "ENOENT") return null;
      throw error;
    });
    if (!stats) return;
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      addBlocker(normalized, "dynamic inventory directory is not a safe real directory");
      return;
    }
    const resolved = await realpath(absolute);
    if (!isInside(realRoot, resolved)) {
      addBlocker(normalized, "dynamic inventory directory resolves outside the selected project root");
      return;
    }
    for (const item of await readdir(absolute, { withFileTypes: true })) {
      const child = `${normalized}/${item.name}`;
      if (item.isDirectory()) await addTree(child, classification);
      else if (item.isFile()) await addFile(child, classification, { from: "dynamic-state", via: normalized }, false);
      else addBlocker(child, "dynamic inventory source is not a regular file or directory");
    }
  }
}

async function hasExactProjectPath(rootPath, normalized) {
  const parts = normalized.split("/");
  let current = rootPath;
  for (const part of parts) {
    const entries = await readdir(current, { withFileTypes: true }).catch((error) => {
      if (error?.code === "ENOENT") return null;
      throw error;
    });
    if (!entries) return false;
    const exact = entries.find((entry) => entry.name === part);
    if (!exact) return false;
    current = path.join(current, exact.name);
  }
  return true;
}

/**
 * Gate 5 needs a stronger closure than the shared semantic-candidate
 * inventory: every regular project source under the selected root receives a
 * raw-byte witness, even when no currently known Kit reader reaches it.  The
 * latter is recorded as explicitly outside the known Kit reachability set,
 * never silently omitted.  This is read-only evidence; it does not choose an
 * upgrade action or make an unknown source Kit-managed.
 */
export async function buildGate5RootSourceInventory({ root, reachableInventory } = {}) {
  if (!root) throw new Error("Gate 5 root-source inventory requires a project root");
  if (!reachableInventory || reachableInventory.schemaVersion !== UPGRADE_INVENTORY_SCHEMA) {
    throw new Error("Gate 5 root-source inventory requires the current reachable inventory");
  }
  const rootPath = path.resolve(root);
  const rootStats = await lstat(rootPath).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!rootStats?.isDirectory() || rootStats.isSymbolicLink()) {
    throw new Error("Gate 5 root-source inventory root must be a real directory");
  }
  const rootReal = await realpath(rootPath);
  const reachableByPath = new Map(reachableInventory.entries.map((entry) => [entry.path, entry]));
  const entries = new Map();
  const blockers = [...reachableInventory.blockers];
  const exclusions = Object.freeze([{ path: ".git", reason: "version-control metadata is not project content unless a formal reader explicitly reaches it" }]);

  const addBlocker = (relative, reason) => {
    const key = `${relative}\0${reason}`;
    if (!blockers.some((item) => `${item.path}\0${item.reason}` === key)) blockers.push({ path: relative, reason });
  };

  async function addFile(relative) {
    const normalized = normalizeProjectRelative(relative);
    if (!normalized) {
      addBlocker(String(relative), "root-source path escapes the selected project root");
      return;
    }
    const absolute = path.resolve(rootPath, normalized);
    if (!isInside(rootPath, absolute)) {
      addBlocker(normalized, "root-source path escapes the selected project root");
      return;
    }
    const stats = await lstat(absolute).catch((error) => {
      if (error?.code === "ENOENT") return null;
      throw error;
    });
    if (!stats) return;
    if (stats.isSymbolicLink()) {
      addBlocker(normalized, "symbolic links and junctions are not accepted as root-source inputs");
      return;
    }
    if (!stats.isFile()) {
      addBlocker(normalized, "root-source input is not a regular file");
      return;
    }
    const resolved = await realpath(absolute);
    if (!isInside(rootReal, resolved)) {
      addBlocker(normalized, "root-source input resolves outside the selected project root");
      return;
    }
    const bytes = await readFile(absolute);
    const reachable = reachableByPath.get(normalized);
    // A same-name dev/<rule>.md probe is discovery-only. It is neither a
    // package contract nor a formal reader/effect witness, so Gate 5 must not
    // let that path shape turn an ordinary root source into a Kit item. Actual
    // formal references remain intact and continue to establish reachability.
    const classifications = (reachable?.classifications ?? []).filter((classification) => classification !== "legacy-rule-location");
    const reachability = (reachable?.reachability ?? []).filter((entry) => entry.from !== "legacy-location");
    entries.set(normalized, Object.freeze({
      path: normalized,
      sha256: sha256(bytes),
      bytes: bytes.length,
      classifications: Object.freeze(["root-source", ...classifications].sort()),
      reachability: Object.freeze([...reachability]
        .sort((left, right) => `${left.from}\0${left.via}`.localeCompare(`${right.from}\0${right.via}`)))
    }));
  }

  async function walk(relative = "") {
    const absolute = relative ? path.join(rootPath, relative) : rootPath;
    const children = await readdir(absolute, { withFileTypes: true });
    children.sort((left, right) => left.name.localeCompare(right.name));
    for (const child of children) {
      const childRelative = relative ? `${relative}/${child.name}` : child.name;
      if (childRelative === ".git") continue;
      if (child.isSymbolicLink()) {
        addBlocker(childRelative, "symbolic links and junctions are not accepted as root-source inputs");
      } else if (child.isDirectory()) {
        await walk(childRelative);
      } else if (child.isFile()) {
        await addFile(childRelative);
      } else {
        addBlocker(childRelative, "root-source input is not a regular file or directory");
      }
    }
  }

  await walk();
  for (const reachable of reachableInventory.entries) {
    if (!entries.has(reachable.path)) {
      addBlocker(reachable.path, "reachable inventory source was absent from the root-source scan");
    }
  }
  const frozenEntries = [...entries.values()].sort((left, right) => left.path.localeCompare(right.path));
  const sortedBlockers = blockers.sort((left, right) => `${left.path}\0${left.reason}`.localeCompare(`${right.path}\0${right.reason}`));
  const body = {
    schemaVersion: GATE5_ROOT_SOURCE_INVENTORY_SCHEMA,
    entries: frozenEntries,
    blockers: sortedBlockers,
    exclusions
  };
  return Object.freeze({
    ...body,
    status: sortedBlockers.length === 0 ? "ready" : "blocked",
    rootSourceSha256: sha256(Buffer.from(`${JSON.stringify(body)}\n`, "utf8"))
  });
}

/**
 * Freezes the complete set that a Gate 5 upgrade may reason about before any
 * candidate, transaction, or semantic disposition is attempted. This is not
 * an activation record and grants no write authority: it binds every reached
 * project source's raw bytes to the installed package contract, formal
 * historical source, transaction/registry surface, bridges, router, and
 * formal entry.
 */
export async function freezeGate5Set({ root, contracts = installedFileContracts, transitionContracts = upgradeStateFileContracts, catalog = null } = {}) {
  const inventory = await buildUpgradeInventory({ root, contracts });
  if (inventory.status !== "ready") throw new Error("Gate 5 frozen set requires a ready reachable inventory");
  const rootSourceInventory = await buildGate5RootSourceInventory({ root, reachableInventory: inventory });
  if (rootSourceInventory.status !== "ready") throw new Error("Gate 5 frozen set requires a complete safe root-source inventory");
  const rootPath = path.resolve(root);
  const officialCatalog = catalog ?? await loadOfficialOriginCatalog();
  const packageContracts = normalizeContracts(contracts, transitionContracts);
  const contractByTarget = new Map(packageContracts.map((contract) => [contract.targetRel, contract]));
  const contractBody = {
    schemaVersion: INSTALLED_FILE_CONTRACT_SCHEMA,
    installed: contracts.map(({ sourceRel, targetRel, strategy }) => ({ sourceRel, targetRel, strategy })),
    transition: transitionContracts.map(({ sourceRel, targetRel, strategy }) => ({ sourceRel, targetRel, strategy }))
  };
  const contractDigestSha256 = sha256(Buffer.from(`${JSON.stringify(contractBody)}\n`, "utf8"));
  const installedTemplateVersion = await readInstalledTemplateVersion(rootPath);
  const release = installedTemplateVersion ? officialCatalog.releases?.[installedTemplateVersion] : null;
  const entryByPath = new Map(rootSourceInventory.entries.map((entry) => [entry.path, entry]));
  const items = rootSourceInventory.entries.map((entry) => {
    const contract = contractByTarget.get(entry.path) ?? null;
    const historicalEntry = contract && release?.manifest?.[entry.path]?.state === "present"
      ? release.manifest[entry.path]
      : null;
    const exactPackageBytes = Boolean(historicalEntry && entry.sha256 === historicalEntry.rawSha256);
    const discoveredReachability = entry.reachability.map(({ from, via }) => ({ reader: from, via }));
    const readers = discoveredReachability.filter(({ reader }) => isFormalReader(reader));
    const kitReachable = entry.classifications.some((classification) => classification !== "root-source");
    const unresolvedReason = !kitReachable
      ? null
      : !exactPackageBytes
      ? "non-exact-or-unknown bytes require a verified preserve destination or remain unresolved"
      : readers.length === 0
      ? "no verified existing reader; priority and effect remain unresolved"
      : "reader is recorded, but priority/conflict and runtime effect remain unresolved before a per-item transaction proof";
    return Object.freeze({
      sourcePath: entry.path,
      sourceIdentity: Object.freeze({ sha256: entry.sha256, bytes: entry.bytes }),
      classifications: Object.freeze([...entry.classifications]),
      existingReaders: Object.freeze(readers),
      discoveredReachability: Object.freeze(discoveredReachability),
      priorityConflict: Object.freeze({
        status: kitReachable ? "unresolved-before-runtime-validation" : "not-applicable-outside-known-kit-reachability",
        relation: !kitReachable ? "outside-known-kit-reachability" : readers.length > 0 ? "reader-reachable-priority-not-proven" : "no-verified-reader"
      }),
      effect: Object.freeze({
        status: kitReachable ? "unresolved-before-runtime-validation" : "not-applicable-outside-known-kit-reachability",
        decision: !kitReachable ? "outside-known-kit-reachability" : readers.length > 0 ? "preserve-existing-route-or-stop" : "unresolved"
      }),
      packageContract: contract
        ? Object.freeze({ sourceRel: contract.sourceRel, targetRel: contract.targetRel, strategy: contract.strategy, scope: contract.scope })
        : null,
      historicalOrigin: historicalEntry
        ? Object.freeze({
          packageIdentity: release.source.npm.spec,
          installedTemplateVersion,
          rawSha256: historicalEntry.rawSha256,
          exactPackageBytes,
          catalogDigestSha256: officialCatalog.catalogDigestSha256
        })
        : null,
      ownership: exactPackageBytes && contract?.scope === "installed"
        ? "kit-managed-exact"
        : "user-or-unknown",
      unresolvedReason
    });
  });
  const contractCoverage = packageContracts.map((contract) => {
    const source = entryByPath.get(contract.targetRel) ?? null;
    const historicalState = release?.manifest?.[contract.targetRel]?.state ?? "unavailable";
    const status = source
      ? "source-frozen"
      : historicalState === "absent"
      ? "not-present-in-historical-package"
      : contract.scope === "transition"
      ? "not-present-no-formal-transition-state"
      : "unresolved-missing-installed-source";
    return Object.freeze({
      sourceRel: contract.sourceRel,
      targetRel: contract.targetRel,
      strategy: contract.strategy,
      scope: contract.scope,
      sourceStatus: status,
      sourceIdentity: source ? Object.freeze({ sha256: source.sha256, bytes: source.bytes }) : null,
      historicalState
    });
  });
  const unresolvedItems = items
    .filter((item) => item.unresolvedReason)
    .map((item) => Object.freeze({ sourcePath: item.sourcePath, reason: item.unresolvedReason }));
  const unresolvedContractTargets = contractCoverage
    .filter((item) => item.sourceStatus === "unresolved-missing-installed-source")
    .map((item) => Object.freeze({ sourcePath: item.targetRel, reason: "installed package target is missing from the root-source set" }));
  const bridgePaths = ["CLAUDE.md", "GEMINI.md"];
  const body = {
    schemaVersion: GATE5_FROZEN_SET_SCHEMA,
    operationAuthority: "none",
    activationStatus: "not-authorized",
    inventory: Object.freeze({ schemaVersion: inventory.schemaVersion, sha256: inventory.inventorySha256 }),
    rootSourceInventory: Object.freeze({
      schemaVersion: rootSourceInventory.schemaVersion,
      sha256: rootSourceInventory.rootSourceSha256,
      entryCount: rootSourceInventory.entries.length,
      exclusions: rootSourceInventory.exclusions
    }),
    packageContract: Object.freeze({
      schemaVersion: INSTALLED_FILE_CONTRACT_SCHEMA,
      digestSha256: contractDigestSha256,
      installedTargets: Object.freeze(contracts.map(({ targetRel }) => targetRel)),
      transitionTargets: Object.freeze(transitionContracts.map(({ targetRel }) => targetRel)),
      coverage: Object.freeze(contractCoverage)
    }),
    historicalSource: Object.freeze({
      catalogSchemaVersion: officialCatalog.schemaVersion,
      catalogDigestSha256: officialCatalog.catalogDigestSha256,
      installedTemplateVersion,
      packageIdentity: release?.source?.npm?.spec ?? null,
      packageIntegrity: release?.source?.npm?.integrity ?? null,
      status: release ? "bound-to-installed-catalog-identity" : "unresolved-no-catalog-release-for-installed-version"
    }),
    formalSurfaces: Object.freeze({
      entry: binding(entryByPath, "AGENTS.md"),
      bridges: Object.freeze(bridgePaths.map((targetRel) => binding(entryByPath, targetRel))),
      router: binding(entryByPath, "dev/USER_RULES.md"),
      transactionRegistry: Object.freeze({
        root: "dev/governance_migrations",
        entries: Object.freeze(items.filter((item) => item.classifications.includes("transaction-state")).map((item) => item.sourcePath))
      })
    }),
    items: Object.freeze(items),
    unresolved: Object.freeze([...unresolvedItems, ...unresolvedContractTargets]
      .sort((left, right) => `${left.sourcePath}\0${left.reason}`.localeCompare(`${right.sourcePath}\0${right.reason}`)))
  };
  return Object.freeze({ ...body, frozenSetSha256: sha256(Buffer.from(`${JSON.stringify(body)}\n`, "utf8")) });
}

export function assertGate5FrozenSet(frozen) {
  if (!frozen || typeof frozen !== "object" || Array.isArray(frozen)) throw new Error("Gate 5 frozen set is required");
  if (frozen.schemaVersion !== GATE5_FROZEN_SET_SCHEMA) throw new Error("unsupported Gate 5 frozen-set schema");
  if (frozen.operationAuthority !== "none" || frozen.activationStatus !== "not-authorized") throw new Error("Gate 5 frozen set must not claim operation authority");
  if (!Array.isArray(frozen.items) || frozen.items.length === 0) throw new Error("Gate 5 frozen set has no items");
  if (!frozen.rootSourceInventory || frozen.rootSourceInventory.schemaVersion !== GATE5_ROOT_SOURCE_INVENTORY_SCHEMA
    || !/^[0-9a-f]{64}$/.test(frozen.rootSourceInventory.sha256)
    || !Number.isInteger(frozen.rootSourceInventory.entryCount) || frozen.rootSourceInventory.entryCount !== frozen.items.length
    || !Array.isArray(frozen.rootSourceInventory.exclusions)) {
    throw new Error("Gate 5 frozen set does not bind a complete root-source inventory");
  }
  if (!frozen.packageContract || !Array.isArray(frozen.packageContract.coverage)) {
    throw new Error("Gate 5 frozen set does not bind package-contract coverage");
  }
  const paths = new Set();
  const orderedPaths = [];
  for (const item of frozen.items) {
    if (!item || typeof item !== "object" || typeof item.sourcePath !== "string" || paths.has(item.sourcePath)) throw new Error("Gate 5 frozen set has duplicate or invalid source paths");
    paths.add(item.sourcePath);
    orderedPaths.push(item.sourcePath);
    if (!/^[0-9a-f]{64}$/.test(item.sourceIdentity?.sha256) || !Number.isInteger(item.sourceIdentity?.bytes) || item.sourceIdentity.bytes < 0) throw new Error(`Gate 5 frozen set source identity is invalid: ${item.sourcePath}`);
    if (!Array.isArray(item.classifications) || !item.classifications.includes("root-source")
      || !Array.isArray(item.existingReaders) || !item.priorityConflict?.status || !item.effect?.status
      || !(item.unresolvedReason === null || typeof item.unresolvedReason === "string")) {
      throw new Error(`Gate 5 frozen set omits root-source, reader, priority/conflict, or effect record: ${item.sourcePath}`);
    }
    if (!item.historicalOrigin && item.ownership !== "user-or-unknown") throw new Error(`Gate 5 frozen set assigns ownership without historical evidence: ${item.sourcePath}`);
    if (item.historicalOrigin?.exactPackageBytes && item.packageContract?.scope === "installed" && item.ownership !== "kit-managed-exact") throw new Error(`Gate 5 frozen set rejects exact managed ownership: ${item.sourcePath}`);
    if (item.historicalOrigin && !item.historicalOrigin.exactPackageBytes && item.ownership !== "user-or-unknown") throw new Error(`Gate 5 frozen set accepts non-exact package bytes: ${item.sourcePath}`);
  }
  const expectedUnresolved = frozen.items
    .filter((item) => item.unresolvedReason)
    .map((item) => `${item.sourcePath}\0${item.unresolvedReason}`);
  const actualUnresolved = frozen.unresolved?.map((item) => `${item.sourcePath}\0${item.reason}`) ?? [];
  for (const coverage of frozen.packageContract.coverage) {
    if (!coverage || typeof coverage.targetRel !== "string" || typeof coverage.sourceStatus !== "string") {
      throw new Error("Gate 5 frozen set package-contract coverage is invalid");
    }
    if (coverage.sourceStatus === "unresolved-missing-installed-source") {
      expectedUnresolved.push(`${coverage.targetRel}\0installed package target is missing from the root-source set`);
    }
  }
  if (JSON.stringify(orderedPaths) !== JSON.stringify([...orderedPaths].sort((left, right) => left.localeCompare(right)))) {
    throw new Error("Gate 5 frozen set items are not in canonical source-path order");
  }
  if (JSON.stringify(actualUnresolved) !== JSON.stringify([...actualUnresolved].sort((left, right) => left.localeCompare(right)))) {
    throw new Error("Gate 5 frozen set unresolved list is not in canonical order");
  }
  if (JSON.stringify(actualUnresolved) !== JSON.stringify([...expectedUnresolved].sort((left, right) => left.localeCompare(right)))) {
    throw new Error("Gate 5 frozen set unresolved list does not exactly match item states");
  }
  const { frozenSetSha256, ...body } = frozen;
  if (frozenSetSha256 !== sha256(Buffer.from(`${JSON.stringify(body)}\n`, "utf8"))) throw new Error("Gate 5 frozen-set digest does not match its contents");
  return true;
}

function normalizeContracts(contracts, transitionContracts) {
  const seen = new Set();
  const all = [];
  for (const [scope, source] of [["installed", contracts], ["transition", transitionContracts]]) {
    for (const contract of source) {
      if (seen.has(contract.targetRel)) continue;
      seen.add(contract.targetRel);
      all.push(Object.freeze({ ...contract, scope }));
    }
  }
  return all;
}

function binding(entryByPath, targetRel) {
  const entry = entryByPath.get(targetRel);
  return Object.freeze({
    path: targetRel,
    present: Boolean(entry),
    sourceIdentity: entry ? Object.freeze({ sha256: entry.sha256, bytes: entry.bytes }) : null,
    readers: entry ? Object.freeze(entry.reachability.map(({ from, via }) => ({ reader: from, via })).filter(({ reader }) => isFormalReader(reader))) : Object.freeze([])
  });
}

function isFormalReader(reader) {
  return reader === "formal-entry" || !["managed-contract", "legacy-location", "dynamic-state"].includes(reader);
}

async function readInstalledTemplateVersion(root) {
  const bytes = await readFile(path.join(root, "dev", "PROJECT_INDEX.md")).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!bytes) return null;
  const match = /^\| Agent Handoff Kit template version \| ([0-9]+\.[0-9]+\.[0-9]+) \|/m.exec(bytes.toString("utf8"));
  return match?.[1] ?? null;
}

export function extractExplicitLocalReferences(text) {
  const matches = new Map();
  const add = (raw, via) => {
    const normalized = normalizeReference(raw);
    if (normalized) matches.set(`${normalized}\0${via}`, { path: normalized, via });
  };
  for (const match of String(text).matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g)) add(match[1], "markdown-link");
  for (const match of String(text).matchAll(/`([^`\r\n]+)`/g)) add(match[1], "inline-code-path");
  for (const match of String(text).matchAll(/^\s*@([^\s]+)\s*$/gm)) add(match[1], "bridge-import");
  // Do not treat the dot before a filename extension as sentence punctuation.
  // On Windows, the truncated `dev/USER_RULES` then aliases the real
  // `dev/user_rules/` directory, making a valid formal router look unsafe.
  for (const match of String(text).matchAll(/(?:^|[\s("'`])((?:[\p{L}\p{N}_-]+[\\/])+[\p{L}\p{N}_. -]*[\p{L}\p{N}_.-])(?=$|[\s,;:，。!?)\]}>"'])/gu)) add(match[1], "plain-local-path");
  return [...matches.values()].sort((left, right) => `${left.path}\0${left.via}`.localeCompare(`${right.path}\0${right.via}`));
}

function normalizeReference(raw) {
  const value = String(raw).trim().replace(/^<|>$/g, "");
  if (!value || value.includes("://") || value.startsWith("~") || /^[A-Za-z]:[\\/]/.test(value) || value.startsWith("/")) return null;
  const withoutFragment = value.split(/[?#]/, 1)[0].replaceAll("\\", "/");
  if (!withoutFragment || withoutFragment.endsWith("/") || (!withoutFragment.includes("/") && !/\.[\p{L}\p{N}]+$/u.test(withoutFragment))) return null;
  return normalizeProjectRelative(withoutFragment);
}

function normalizeProjectRelative(relative) {
  const normalized = path.posix.normalize(String(relative).replaceAll("\\", "/").replace(/^\.\//, ""));
  if (!normalized || normalized === "." || normalized === ".." || normalized.startsWith("../") || path.posix.isAbsolute(normalized)) return null;
  return normalized;
}

function isInside(root, target) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function decodeUtf8(buffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return null;
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
