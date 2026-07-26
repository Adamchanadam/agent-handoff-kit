import { createHash } from "node:crypto";
import { lstat, readdir, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { installedFileContracts, upgradeStateFileContracts, INSTALLED_FILE_CONTRACT_SCHEMA } from "./installed-file-contract.mjs";
import { loadOfficialOriginCatalog } from "./official-origin-catalog.mjs";
import { FORMAL_USER_RULES_ENTRY_ANCHOR, readFormalUserRules } from "./user-rules-router.mjs";

export const UPGRADE_INVENTORY_SCHEMA = 1;
export const GATE5_FROZEN_SET_SCHEMA = 2;
export const GATE5_ROOT_SOURCE_INVENTORY_SCHEMA = 1;

const formalEntryTargets = Object.freeze([
  "AGENTS.md",
  "CLAUDE.md",
  "GEMINI.md",
  "START_NEXT_SESSION_PROMPT.txt"
]);

const transactionRegistryRoot = "dev/governance_migrations";

const archiveDirectories = Object.freeze([
  { relative: "dev/SESSION_LOG_archive", classification: "session-log-archive" },
  { relative: "dev/session_log_archive", classification: "legacy-session-log-archive" }
]);

export function gate5ItemRequiresSourceConservation(item) {
  return Boolean(item && Array.isArray(item.classifications)
    && item.classifications.some((classification) => classification !== "root-source"));
}

export function gate5SourceConservationItems(frozen) {
  return Object.freeze((frozen?.items ?? []).filter(gate5ItemRequiresSourceConservation));
}

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

  const addBlocker = (relative, reason) => {
    const key = `${relative}\0${reason}`;
    if (!blockers.some((item) => `${item.path}\0${item.reason}` === key)) blockers.push({ path: relative, reason });
  };

  async function addFile(relative, classification, reachability = null) {
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
    return entry;
  }

  for (const contract of contracts) {
    const isFormalEntry = formalEntryTargets.includes(contract.targetRel);
    await addFile(
      contract.targetRel,
      "managed-contract",
      isFormalEntry ? { from: "formal-entry", via: contract.targetRel } : { from: "managed-contract", via: contract.targetRel }
    );
  }

  await addTransactionRegistry(transactionRegistryRoot);

  for (const directory of archiveDirectories) {
    await addTree(directory.relative, directory.classification);
  }

  const agentsEntry = entries.get("AGENTS.md");
  if (agentsEntry?.text?.includes(FORMAL_USER_RULES_ENTRY_ANCHOR)) {
    try {
      const formal = await readFormalUserRules({ root: rootPath, allowActiveTransaction: true });
      await addFile(formal.routerPath, "formal-user-rules-router", { from: formal.entryPath, via: formal.routerPath });
      for (const rule of formal.rules) {
        await addFile(rule.path, "formal-user-rule-content", { from: formal.routerPath, via: rule.path });
      }
    } catch (error) {
      addBlocker("dev/USER_RULES.md", `formal user-rules state is unsafe: ${String(error?.message ?? error)}`);
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

  async function addTransactionRegistry(relativeDirectory) {
    const normalized = normalizeProjectRelative(relativeDirectory);
    if (!normalized) {
      addBlocker(String(relativeDirectory), "transaction registry escapes the selected project root");
      return;
    }
    const absolute = path.resolve(rootPath, normalized);
    const stats = await lstat(absolute).catch((error) => {
      if (error?.code === "ENOENT") return null;
      throw error;
    });
    if (!stats) return;
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      addBlocker(normalized, "transaction registry is not a safe real directory");
      return;
    }
    const resolved = await realpath(absolute);
    if (!isInside(realRoot, resolved)) {
      addBlocker(normalized, "transaction registry resolves outside the selected project root");
      return;
    }
    for (const item of await readdir(absolute, { withFileTypes: true })) {
      const child = `${normalized}/${item.name}`;
      const childAbsolute = path.join(absolute, item.name);
      const childStats = await lstat(childAbsolute).catch((error) => {
        if (error?.code === "ENOENT") return null;
        throw error;
      });
      if (!childStats) continue;
      if (childStats.isFile()) continue;
      if (childStats.isSymbolicLink() || !childStats.isDirectory()) {
        addBlocker(child, "transaction registry child is not a safe real directory");
        continue;
      }
      const childResolved = await realpath(childAbsolute);
      if (!isInside(realRoot, childResolved)) {
        addBlocker(child, "transaction registry child resolves outside the selected project root");
        continue;
      }
      await addFile(`${child}/transaction.json`, "transaction-state", { from: "transaction-registry", via: normalized });
    }
  }

  async function addTree(relativeDirectory, classification) {
    const normalized = normalizeProjectRelative(relativeDirectory);
    if (!normalized) {
      addBlocker(String(relativeDirectory), "dynamic directory escapes the selected project root");
      return;
    }
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
      const childAbsolute = path.join(absolute, item.name);
      const childStats = await lstat(childAbsolute).catch((error) => {
        if (error?.code === "ENOENT") return null;
        throw error;
      });
      if (!childStats) continue;
      if (childStats.isSymbolicLink()) {
        addBlocker(child, "dynamic inventory source is not a safe real file or directory");
      } else if (childStats.isDirectory()) {
        await addTree(child, classification);
      } else if (childStats.isFile()) {
        await addFile(child, classification, { from: "dynamic-state", via: normalized });
      } else {
        addBlocker(child, "dynamic inventory source is not a regular file or directory");
      }
    }
  }
}

/**
 * Gate 5 current scope is the typed reachable inventory. It deliberately does
 * not walk the project root: ordinary files outside installed/runtime/formal
 * user-rule/transaction/archive contracts are outside machine authority.
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
  const entries = new Map();
  const blockers = [...reachableInventory.blockers];

  for (const reachable of reachableInventory.entries) {
    const classifications = reachable.classifications ?? [];
    const reachability = reachable.reachability ?? [];
    entries.set(reachable.path, Object.freeze({
      path: reachable.path,
      sha256: reachable.sha256,
      bytes: reachable.bytes,
      classifications: Object.freeze(["root-source", ...classifications].sort()),
      reachability: Object.freeze([...reachability]
        .sort((left, right) => `${left.from}\0${left.via}`.localeCompare(`${right.from}\0${right.via}`)))
    }));
  }
  const frozenEntries = [...entries.values()].sort((left, right) => left.path.localeCompare(right.path));
  const sortedBlockers = blockers.sort((left, right) => `${left.path}\0${left.reason}`.localeCompare(`${right.path}\0${right.reason}`));
  const body = {
    schemaVersion: GATE5_ROOT_SOURCE_INVENTORY_SCHEMA,
    entries: frozenEntries,
    blockers: sortedBlockers
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
  const installedTemplateVersion = await readProjectIndexTemplateVersion(rootPath);
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
  const sourceConservationPaths = items
    .filter(gate5ItemRequiresSourceConservation)
    .map((item) => item.sourcePath);
  const body = {
    schemaVersion: GATE5_FROZEN_SET_SCHEMA,
    operationAuthority: "none",
    activationStatus: "not-authorized",
    inventory: Object.freeze({ schemaVersion: inventory.schemaVersion, sha256: inventory.inventorySha256 }),
    rootSourceInventory: Object.freeze({
      schemaVersion: rootSourceInventory.schemaVersion,
      sha256: rootSourceInventory.rootSourceSha256,
      entryCount: rootSourceInventory.entries.length
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
    sourceConservation: Object.freeze({
      selection: "known-kit-reachability",
      protectedEntryCount: sourceConservationPaths.length,
      sourcePaths: Object.freeze(sourceConservationPaths)
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
    || !Number.isInteger(frozen.rootSourceInventory.entryCount) || frozen.rootSourceInventory.entryCount !== frozen.items.length) {
    throw new Error("Gate 5 frozen set does not bind its scoped typed source inventory");
  }
  if (!frozen.packageContract || !Array.isArray(frozen.packageContract.coverage)) {
    throw new Error("Gate 5 frozen set does not bind package-contract coverage");
  }
  if (!frozen.sourceConservation || frozen.sourceConservation.selection !== "known-kit-reachability"
    || !Number.isInteger(frozen.sourceConservation.protectedEntryCount)
    || !Array.isArray(frozen.sourceConservation.sourcePaths)) {
    throw new Error("Gate 5 frozen set does not define its current-state source-conservation selection");
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
  const expectedSourceConservationPaths = frozen.items
    .filter(gate5ItemRequiresSourceConservation)
    .map((item) => item.sourcePath);
  if (frozen.sourceConservation.protectedEntryCount !== expectedSourceConservationPaths.length
    || JSON.stringify(frozen.sourceConservation.sourcePaths) !== JSON.stringify(expectedSourceConservationPaths)) {
    throw new Error("Gate 5 frozen set source-conservation selection does not match known Kit reachability");
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

export async function readProjectIndexTemplateVersion(root) {
  const bytes = await readFile(path.join(root, "dev", "PROJECT_INDEX.md")).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!bytes) return null;
  return parseProjectIndexTemplateVersion(bytes.toString("utf8"));
}

export function parseProjectIndexTemplateVersion(text) {
  return projectIndexTemplateVersionEvidence(text)?.version ?? null;
}

export function projectIndexTemplateVersionRow(text) {
  return projectIndexTemplateVersionEvidence(text)?.row ?? null;
}

export function materializeProjectIndexTemplateVersion(text, version) {
  if (!isStableSemver(version)) return text;
  const evidence = projectIndexTemplateVersionEvidence(text);
  if (!evidence) return text;
  return String(text).slice(0, evidence.rowStart)
    + evidence.row.replace(`| ${evidence.version} |`, `| ${version} |`)
    + String(text).slice(evidence.rowEnd);
}

function projectIndexTemplateVersionEvidence(text) {
  const value = String(text);
  const normalized = value.replace(/\r\n/g, "\n");
  const visibleLines = markdownVisibleLinesOutsideHiddenBlocks(value);
  const headings = [];
  for (const item of visibleLines) if (/^## [^\r\n]+$/u.test(item.text)) headings.push({ title: item.text.trim(), line: item.line, offset: item.normalizedStart });
  const stackHeadings = headings.filter((heading) => heading.title === "## Stack");
  if (stackHeadings.length !== 1) return null;
  const stack = stackHeadings[0];
  const nextHeading = headings.find((heading) => heading.line > stack.line);
  const stackStart = stack.offset + visibleLines.find((line) => line.line === stack.line)?.text.length + 1;
  const stackEnd = nextHeading ? nextHeading.offset : normalized.length;
  const stackLines = visibleLines.filter((line) => line.normalizedStart >= stackStart && line.normalizedStart < stackEnd);
  const candidateRows = [];
  const rowPattern = /^\| Agent Handoff Kit template version \| ([^|\n]+) \| [^|\n]+ \|$/u;
  for (const line of stackLines) {
    const match = rowPattern.exec(line.text);
    if (!match) continue;
    const version = match[1].trim();
    if (!isStableSemver(version)) return null;
    candidateRows.push({
      version,
      row: line.text,
      rowStart: line.start,
      rowEnd: line.end
    });
  }
  const versionLabelRows = stackLines.filter((line) => line.text.startsWith("| Agent Handoff Kit template version |"));
  if (versionLabelRows.length !== candidateRows.length || candidateRows.length !== 1) return null;
  const [row] = candidateRows;
  return { version: row.version, row: row.row, rowStart: row.rowStart, rowEnd: row.rowEnd };
}

export function markdownVisibleLinesOutsideHiddenBlocks(text) {
  const value = String(text);
  const normalized = value.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const result = [];
  let offset = 0;
  let fence = null;
  let inComment = false;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (inComment) {
      if (line.includes("-->")) inComment = false;
      offset += line.length + 1;
      continue;
    }
    const fenceMatch = /^\s{0,3}(`{3,}|~{3,})(?![`~])(.*)$/u.exec(line);
    const fenceRun = fenceMatch?.[1] ?? null;
    if (fence) {
      if (
        fenceRun
        && fenceRun[0] === fence.char
        && fenceRun.length >= fence.length
        && /^\s*$/u.test(fenceMatch?.[2] ?? "")
      ) {
        fence = null;
      }
      offset += line.length + 1;
      continue;
    }
    if (fenceRun) {
      fence = { char: fenceRun[0], length: fenceRun.length };
      offset += line.length + 1;
      continue;
    }
    const commentStart = line.indexOf("<!--");
    if (commentStart >= 0) {
      if (line.indexOf("-->", commentStart + 4) < 0) inComment = true;
      offset += line.length + 1;
      continue;
    }
    result.push({
      text: line,
      line: index,
      normalizedStart: offset,
      normalizedEnd: offset + line.length,
      start: originalOffsetForNormalizedOffset(value, offset),
      end: originalOffsetForNormalizedOffset(value, offset + line.length)
    });
    offset += line.length + 1;
  }
  return result;
}

function originalOffsetForNormalizedOffset(text, normalizedOffset) {
  let original = 0;
  let normalized = 0;
  while (original < text.length && normalized < normalizedOffset) {
    if (text[original] === "\r" && text[original + 1] === "\n") {
      original += 2;
      normalized += 1;
    } else {
      original += 1;
      normalized += 1;
    }
  }
  return original;
}

function isStableSemver(value) {
  return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u.test(String(value));
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
