#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir as systemTmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { installedFileContracts } from "../bin/installed-file-contract.mjs";
import { loadOfficialOriginCatalog } from "../bin/official-origin-catalog.mjs";
import { assertGate5FrozenSet, freezeGate5Set, gate5SourceConservationItems } from "../bin/upgrade-inventory.mjs";
import { materializeVerifiedV038ArtifactFixture } from "./r034-v038-artifact-fixture.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const qaTmp = process.env.AGENT_HANDOFF_KIT_QA_TMP || (process.platform === "win32" ? "C:\\tmp" : systemTmpdir());
const catalog = await loadOfficialOriginCatalog();

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});

async function main() {
  const project = fresh("gate5-freeze");
  const artifact = await materializeVerifiedV038ArtifactFixture({ project, catalog });
  append(path.join(project, "dev", "rules", "integrations.md"), "\n## Local Project Rules\n\nPreserve these headed but user-owned bytes.\n");
  append(path.join(project, "AGENTS.md"), "\n## Local project references\n\n- [Custom policy](docs/custom-policy.json)\n");
  write(path.join(project, "docs", "custom-policy.json"), "{\n  \"retention\": \"local\"\n}\n");
  write(path.join(project, "notes", "繁中與日本語", "無標題規則.txt"), "保留這份未被正式 Kit reader 讀取的使用者內容。\nユーザー固有の内容。\n");
  write(path.join(project, ".git", "HEAD"), "ref: refs/heads/main\n");
  write(path.join(project, "dev", "safety.md"), "# Legacy safety location\n\nRetain this legacy source at its existing route.\n");
  write(path.join(project, "dev", "governance_migrations", "registry-note.txt"), "safe regular registry child is not transaction authority\n");
  write(path.join(project, "dev", "governance_migrations", "historical", "transaction.json"), "{\n  \"state\": \"committed\"\n}\n");

  const before = snapshot(project);
  const first = await freezeGate5Set({ root: project, catalog });
  const second = await freezeGate5Set({ root: project, catalog });
  assertGate5FrozenSet(first);
  const reordered = JSON.parse(JSON.stringify(first));
  reordered.items.reverse();
  refreshFrozenSetDigest(reordered);
  assertThrows(() => assertGate5FrozenSet(reordered), "source-conservation selection does not match known Kit reachability", "reordered whole-Kit set was accepted");
  const incompleteUnresolved = JSON.parse(JSON.stringify(first));
  incompleteUnresolved.unresolved.pop();
  refreshFrozenSetDigest(incompleteUnresolved);
  assertThrows(() => assertGate5FrozenSet(incompleteUnresolved), "unresolved list does not exactly match", "incomplete unresolved list was accepted");
  assert(first.frozenSetSha256 === second.frozenSetSha256, "same project state produced an unstable Gate 5 frozen-set digest");
  assert(sameSnapshot(before, snapshot(project)), "freezing the Gate 5 set changed fixture bytes");
  assert(first.operationAuthority === "none" && first.activationStatus === "not-authorized", "frozen set claimed activation authority");
  assert(first.packageContract.installedTargets.length === installedFileContracts.length, "package contract coverage drifted from installed contract");
  assert(first.packageContract.coverage.length === installedFileContracts.length + 1, "whole frozen set omitted a package or formal-transition contract target");
  assert(first.rootSourceInventory.entryCount === first.items.length && /^[0-9a-f]{64}$/.test(first.rootSourceInventory.sha256), "scoped frozen set omitted its typed-source identity");
  const protectedItems = gate5SourceConservationItems(first);
  assert(first.sourceConservation.selection === "known-kit-reachability", "frozen set did not name the source-conservation selection rule");
  assert(first.sourceConservation.protectedEntryCount === protectedItems.length, "source-conservation protected count drifted from known Kit reachability");
  assert(JSON.stringify(first.sourceConservation.sourcePaths) === JSON.stringify(protectedItems.map((item) => item.sourcePath)), "source-conservation protected paths drifted from known Kit reachability");
  assert(first.historicalSource.installedTemplateVersion === "0.3.38" && first.historicalSource.packageIdentity === "@adamchanadam/agent-handoff-kit@0.3.38" && first.historicalSource.packageIntegrity, "historical package identity is not bound to the installed fixture");
  assert(first.formalSurfaces.entry.present, "formal AGENTS entry is absent from the frozen set");
  assert(first.formalSurfaces.bridges.every((entry) => entry.present), "bridge surfaces are not bound to the frozen set");
  assert(!first.formalSurfaces.router.present, "legacy fixture invented a user-rules router instead of binding its absence");
  assert(first.formalSurfaces.transactionRegistry.entries.includes("dev/governance_migrations/historical/transaction.json"), "transaction registry source is not bound to the frozen set");

  const items = new Map(first.items.map((item) => [item.sourcePath, item]));
  const headedMixed = items.get("dev/rules/integrations.md");
  assert(headedMixed?.ownership === "user-or-unknown", "headed appendix was inferred to be managed");
  assert(headedMixed.historicalOrigin && !headedMixed.historicalOrigin.exactPackageBytes, "headed appendix was incorrectly accepted as exact package bytes");
  assert(!items.has("dev/safety.md"), "same-name legacy path was promoted into Gate 5 scoped inventory");
  assert(!first.sourceConservation.sourcePaths.includes("dev/safety.md"), "same-name ordinary legacy source was promoted into current-state source conservation");
  assert(!items.has("dev/governance_migrations/registry-note.txt"), "safe regular transaction-registry child was promoted into Gate 5 scoped inventory");
  assert(!first.sourceConservation.sourcePaths.includes("dev/governance_migrations/registry-note.txt"), "safe regular transaction-registry child was protected by current-state source conservation");
  assert(!items.has("docs/custom-policy.json"), "generic AGENTS Markdown link was promoted into Gate 5 scoped inventory");
  assert(!first.sourceConservation.sourcePaths.includes("docs/custom-policy.json"), "generic AGENTS Markdown link was protected by current-state source conservation");
  const unheadedOrdinary = items.get("notes/繁中與日本語/無標題規則.txt");
  assert(!unheadedOrdinary, "ordinary multilingual user source was promoted into Gate 5 scoped inventory");
  assert(!first.sourceConservation.sourcePaths.includes("notes/繁中與日本語/無標題規則.txt"), "ordinary root source was protected as current-state authority");
  assert(!items.has(".git/HEAD"), "root-source inventory treated version-control metadata as project content");
  for (const item of first.items) {
    assert(item.sourceIdentity.sha256 === sha(readFileSync(path.join(project, item.sourcePath))), `frozen source bytes do not match current bytes: ${item.sourcePath}`);
    assert(Array.isArray(item.existingReaders) && item.priorityConflict?.status && item.effect?.status, `frozen item omits reader, priority/conflict, or effect record: ${item.sourcePath}`);
  }
  for (const excluded of ["dev/safety.md", "dev/governance_migrations/registry-note.txt", "docs/custom-policy.json", "notes/繁中與日本語/無標題規則.txt"]) {
    assert(before.has(excluded), `fixture sentinel missing before freeze: ${excluded}`);
    assert(snapshot(project).get(excluded) === before.get(excluded), `freeze changed excluded sentinel bytes: ${excluded}`);
  }
  assert(!first.unresolved.some((entry) => entry.sourcePath === "dev/safety.md"), "canonical unresolved list retained path-only legacy safety source");
  assert(!first.unresolved.some((entry) => entry.sourcePath === "dev/governance_migrations/registry-note.txt"), "canonical unresolved list retained safe regular transaction-registry child");
  assert(first.unresolved.some((entry) => entry.sourcePath === "dev/rules/integrations.md"), "canonical unresolved list omitted the mixed rule-pack item");
  const productionInventorySource = readFileSync(path.join(root, "bin", "upgrade-inventory.mjs"), "utf8");
  assert(!productionInventorySource.includes("hasExactProjectPath"), "production inventory still contains parent-directory enumeration helper");
  assert(!productionInventorySource.includes("readdir(current"), "production inventory still enumerates parent directories while locating typed roots");

  append(path.join(project, "notes", "繁中與日本語", "無標題規則.txt"), "ordinary drift ignored by scoped inventory\n");
  const ordinaryDrift = await freezeGate5Set({ root: project, catalog });
  assert(first.frozenSetSha256 === ordinaryDrift.frozenSetSha256 && first.rootSourceInventory.sha256 === ordinaryDrift.rootSourceInventory.sha256, "ordinary user-file drift invalidated the scoped frozen-set digest");
  append(path.join(project, "dev", "rules", "integrations.md"), "after-freeze drift\n");
  const drifted = await freezeGate5Set({ root: project, catalog });
  assert(first.frozenSetSha256 !== drifted.frozenSetSha256 && first.rootSourceInventory.sha256 !== drifted.rootSourceInventory.sha256, "typed source-byte drift did not invalidate the scoped frozen-set digest");
  console.log("ok: verified v0.3.38 artifact fixture scoped typed frozen set binds package contract, historical source, transaction registry, bridges, router absence, formal entry, raw bytes, reader records, and a fixture-specific digest");
  console.log(`ok: artifact integrity ${artifact.integrity}`);
  console.log(`ok: frozen-set digest ${first.frozenSetSha256}`);
  console.log("ok: headed mixed bytes remain user-or-unknown; generic links, same-name legacy paths, safe registry regular files, ordinary notes, and .git are outside scoped current inventory");
  console.log(`ok: canonical remaining unresolved ${first.unresolved.map((entry) => `${entry.sourcePath} — ${entry.reason}`).join(" | ") || "none"}`);
  console.log("R-034 v0.3.38 scoped typed frozen-set witness passed; it is evidence-only and not a Gate 5 PASS");
}

function fresh(label) {
  const project = path.join(qaTmp, `ack-r034-${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  assert(!existsSync(project), `QA fixture already exists: ${project}`);
  mkdirSync(project, { recursive: true });
  return project;
}

function snapshot(project) {
  const files = [];
  walk(project, project, files);
  return new Map(files.map((relative) => [relative, sha(readFileSync(path.join(project, relative)))]));
}

function walk(base, current, files) {
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) walk(base, absolute, files);
    else if (entry.isFile()) files.push(path.relative(base, absolute).replaceAll(path.sep, "/"));
  }
}

function write(file, content) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content, "utf8");
}

function append(file, content) { write(file, `${readFileSync(file, "utf8")}${content}`); }
function sha(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function refreshFrozenSetDigest(frozen) {
  const { frozenSetSha256: _discarded, ...body } = frozen;
  frozen.frozenSetSha256 = sha(Buffer.from(`${JSON.stringify(body)}\n`, "utf8"));
}
function sameSnapshot(left, right) { return left.size === right.size && [...left].every(([key, value]) => right.get(key) === value); }
function assertThrows(action, expected, label) {
  try { action(); } catch (error) {
    assert(String(error?.message ?? error).includes(expected), `${label}: unexpected error ${error?.message ?? error}`);
    return;
  }
  throw new Error(`${label}: expected rejection`);
}
function assert(condition, message) { if (!condition) throw new Error(message); }
