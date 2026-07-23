#!/usr/bin/env node

// One Gate 5 whole-set proof. `prepare` and `verify` are deliberately split
// only because some sandboxed Node environments cannot spawn the candidate
// CLI; ordinary CI may use `all`.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir as systemTmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadOfficialOriginCatalog } from "../bin/official-origin-catalog.mjs";
import { assertGate5FrozenSet, freezeGate5Set, gate5SourceConservationItems } from "../bin/upgrade-inventory.mjs";
import { materializeVerifiedV038ArtifactFixture } from "./r034-v038-artifact-fixture.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const candidateRoot = path.resolve(__dirname, "..");
const qaTmp = process.env.AGENT_HANDOFF_KIT_QA_TMP || (process.platform === "win32" ? "C:\\tmp" : systemTmpdir());
const catalog = await loadOfficialOriginCatalog();
const runtimeTargets = new Set(["AGENTS.md", "dev/RULE_PACKS.md", "dev/rules/integrations.md", "START_NEXT_SESSION_PROMPT.txt", "dev/SESSION_HANDOFF.md", "dev/PROJECT_INDEX.md"]);
const statefulTargets = new Set(["START_NEXT_SESSION_PROMPT.txt", "dev/SESSION_HANDOFF.md", "dev/PROJECT_INDEX.md"]);
const sidecarSuffix = ".r034-gate5-closure-before.json";

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});

async function main() {
  const { phase, project } = parseArgs(process.argv.slice(2));
  if (phase === "prepare") {
    await prepare(project ?? fresh("gate5-closure"));
    return;
  }
  if (phase === "verify") {
    await verify(requiredProject(project));
    return;
  }
  if (phase !== "all") throw new Error("usage: check-r034-gate5-closure.mjs [prepare|verify|all] [--root <fixture>]");
  const target = project ?? fresh("gate5-closure");
  await prepare(target);
  const upgrade = cli(["upgrade", "--yes", "--root", target], "Gate 5 whole-set upgrade");
  assert(upgrade.status === 0, `Gate 5 whole-set upgrade failed: ${output(upgrade)}`);
  const doctor = cli(["doctor", "--root", target], "Gate 5 whole-set ordinary doctor");
  assert(doctor.status === 0 && output(doctor).includes("status: passed"), `Gate 5 whole-set ordinary doctor failed: ${output(doctor)}`);
  await verify(target);
}

async function prepare(project) {
  assert(!existsSync(project) || readdirSync(project).length === 0, `Gate 5 closure fixture is not empty: ${project}`);
  if (!existsSync(project)) mkdirSync(project, { recursive: true });
  const artifact = await materializeVerifiedV038ArtifactFixture({ project, catalog });
  const agents = path.join(project, "AGENTS.md");
  const agentsText = read(agents);
  const coreEnd = "<!-- END Agent Handoff Kit managed core -->";
  const localRel = "docs/local-agent-rule.txt";
  const localRule = "Always retain GATE5_WHOLE_SET_AGENT_EFFECT_v1 before applying Kit-managed instructions.";
  const localReference = `Read [the Gate 5 local rule](${localRel}) before changing project rules.`;
  assert(agentsText.includes(coreEnd), "trusted v0.3.38 AGENTS has no managed-core end marker");
  write(agents, agentsText.replace(coreEnd, `${localRule}\n${localReference}\n${coreEnd}`));
  write(path.join(project, localRel), "GATE5_WHOLE_SET_AGENT_TARGET_v1\n");

  const router = path.join(project, "dev", "RULE_PACKS.md");
  const routerText = read(router);
  const routeRel = "dev/rules/gate5-local-route.md";
  const localRow = `| Local Gate 5 route | \`${routeRel}\` | Apply GATE5_WHOLE_SET_ROUTE_EFFECT_v1 before Kit-managed routes. |`;
  assert(/\r?\n\r?\n## Routing Rule/.test(routerText), "trusted v0.3.38 RULE_PACKS has no active-table boundary");
  write(router, routerText.replace(/\r?\n\r?\n## Routing Rule/, `\n${localRow}\n\n## Routing Rule`));
  write(path.join(project, routeRel), "GATE5_WHOLE_SET_ROUTE_TARGET_v1\n");
  append(path.join(project, "dev", "rules", "integrations.md"), "\n## Local Project Rules\n\nPreserve these headed but user-owned integration bytes.\n");
  write(path.join(project, "dev", "safety.md"), "# Legacy safety location\n\nRetain this ordinary root source.\n");
  write(path.join(project, "dev", "governance_migrations", "historical", "transaction.json"), "{\n  \"state\": \"committed\"\n}\n");

  const before = await freezeGate5Set({ root: project, catalog });
  assertGate5FrozenSet(before);
  const item = new Map(before.items.map((entry) => [entry.sourcePath, entry]));
  const protectedPaths = new Set(gate5SourceConservationItems(before).map((entry) => entry.sourcePath));
  assert(item.get("dev/safety.md")?.unresolvedReason === null, "path-only legacy safety source entered Gate 5 reachability");
  assert(!protectedPaths.has("dev/safety.md"), "path-only legacy safety source entered current-state source conservation");
  for (const targetRel of runtimeTargets) assert(item.has(targetRel), `whole-set fixture omitted runtime target ${targetRel}`);
  const sidecar = {
    schemaVersion: 3,
    project,
    artifactIntegrity: artifact.integrity,
    artifactFreshInitOutputDigest: artifact.freshInitOutputDigest,
    artifactFreshInitOutputs: artifact.freshInitOutputs.map((entry) => ({
      targetRel: entry.targetRel,
      sourceRel: entry.sourceRel,
      sha256: entry.sha256,
      bytes: entry.bytes,
      identity: entry.identity,
      transform: entry.transform
    })),
    artifactInitialTransactionWitness: {
      sourcePath: artifact.initialTransactionWitness.sourcePath,
      sha256: artifact.initialTransactionWitness.sha256,
      bytes: artifact.initialTransactionWitness.byteLength,
      identity: artifact.initialTransactionWitness.identity
    },
    frozenSetSha256: before.frozenSetSha256,
    sourceConservationPaths: before.sourceConservation.sourcePaths,
    items: before.items.map((entry) => ({
      sourcePath: entry.sourcePath,
      sourceIdentity: entry.sourceIdentity,
      ownership: entry.ownership,
      unresolvedReason: entry.unresolvedReason,
      classifications: entry.classifications,
      sourceConservationProtected: protectedPaths.has(entry.sourcePath)
    }))
  };
  writeFileSync(sidecarPath(project), `${JSON.stringify(sidecar, null, 2)}\n`, "utf8");
  console.log(`PREPARED: ${project}`);
  console.log(`artifact integrity: ${artifact.integrity}`);
  console.log(`frozen-set digest: ${before.frozenSetSha256}`);
  console.log(`pre-upgrade unresolved: ${before.unresolved.map((entry) => entry.sourcePath).join(", ")}`);
}

async function verify(project) {
  const sidecar = JSON.parse(read(sidecarPath(project)));
  assert(sidecar.schemaVersion === 3, "unsupported Gate 5 closure sidecar");
  assert(sidecar.artifactFreshInitOutputs?.length === 20, "artifact witness did not derive every v0.3.38 package fresh-init target");
  assert(sidecar.artifactFreshInitOutputs.every((entry) => entry.identity === "exact-fresh-init-artifact-output" && typeof entry.transform === "string"), "artifact witness falsely labels a raw package path as a fresh-init identity");
  assert(sidecar.artifactInitialTransactionWitness?.identity === "artifact-init-generated-historical-transaction-witness", "artifact-generated initial transaction witness is absent or misclassified");
  assert(sidecar.items.length === 25, "Gate 5 closure fixture no longer contains the frozen 25-source input set");
  const after = await freezeGate5Set({ root: project, catalog });
  assertGate5FrozenSet(after);
  const transaction = latestRuntimeTransaction(project);
  const journal = transaction.journal;
  const current = new Map(after.items.map((entry) => [entry.sourcePath, entry]));
  const journalEntries = new Map(journal.entries.map((entry) => [entry.targetRel, entry]));
  const accepted = journal.runtimeAcceptance;
  const sourceConservation = journal.currentStateWitness?.sourceConservation;
  assert(accepted?.schemaVersion === 4, "whole-set transaction omitted schema-v4 shared runtime acceptance");
  assert(sourceConservation?.schemaVersion === 1, "whole-set transaction omitted shared frozen-source conservation");
  assert(sourceConservation.frozenSetSha256 === sidecar.frozenSetSha256, "whole-set current state does not bind the exact pre-upgrade frozen-set identity");
  assert(sourceConservation.entries.length === sidecar.sourceConservationPaths.length, "whole-set current state does not cover every protected original source");
  assert(journal.currentStateWitness?.runtimeAcceptance?.acceptanceDigest === accepted.acceptanceDigest, "whole-set current state does not bind runtime acceptance");
  assert(journal.currentStateReadback?.sourceConservationEntryCount === sidecar.sourceConservationPaths.length, "whole-set success state did not use the fresh protected frozen-source readback");
  assert(journal.currentStateReadback?.runtimeAcceptanceDigest === accepted.acceptanceDigest, "whole-set success state did not use the fresh runtime acceptance readback");
  assert(journal.runtimeAcceptanceReadback?.reader?.includes("direct AGENTS whole-file entry") && journal.runtimeAcceptanceReadback.reader.includes("direct RULE_PACKS entry"), "whole-set doctor readback does not disclose both preserved routing boundaries");
  assert(transaction.report.includes(accepted.acceptanceDigest) && transaction.report.includes(journal.currentStateWitness.currentStateDigest), "whole-set report does not consume the same acceptance/current-state identity");
  assert(transaction.report.includes(`Frozen source-conservation entries: ${sidecar.sourceConservationPaths.length}`), "whole-set report omits the source-conservation portion of the same current state");

  const closed = [];
  const conservedByPath = new Map(sourceConservation.entries.map((entry) => [entry.sourcePath, entry]));
  for (const source of sidecar.items) {
    const active = current.get(source.sourcePath);
    assert(active, `whole-set equality lost original source: ${source.sourcePath}`);
    const originalHash = source.sourceIdentity.sha256;
    const conserved = conservedByPath.get(source.sourcePath);
    if (source.sourceConservationProtected) {
      assert(conserved, `whole-set current state omitted protected original source: ${source.sourcePath}`);
      assert(conserved.sourceWitness.sha256 === originalHash && conserved.sourceWitness.bytes === source.sourceIdentity.bytes, `whole-set source witness differs from original bytes: ${source.sourcePath}`);
      assert(conserved.accepted.sha256 === active.sourceIdentity.sha256 && conserved.accepted.bytes === active.sourceIdentity.bytes, `whole-set current-state readback differs from active bytes: ${source.sourcePath}`);
      assert(conserved.sourceByteRanges?.length === 1 && conserved.sourceByteRanges[0].start === 0 && conserved.sourceByteRanges[0].end === source.sourceIdentity.bytes && conserved.sourceByteRanges[0].sha256 === originalHash, `whole-set source has no complete byte-range reconstruction witness: ${source.sourcePath}`);
    } else {
      assert(!conserved, `ordinary outside-reachability source was protected as current-state authority: ${source.sourcePath}`);
    }
    const transactionEntry = journalEntries.get(source.sourcePath);
    if (runtimeTargets.has(source.sourcePath)) {
      assertRuntimeClosure(source.sourcePath, originalHash, active, accepted, transactionEntry);
      closed.push(`${source.sourcePath}:runtime`);
      continue;
    }
    if (source.sourcePath === "docs/local-agent-rule.txt") {
      const agents = accepted.entries.find((entry) => entry.targetRel === "AGENTS.md");
      assert(agents?.activeReader?.references?.some((reference) => reference.targetRel === source.sourcePath && reference.sha256 === originalHash), "AGENTS local target lacks same-acceptance reader/effect closure");
      assert(active.sourceIdentity.sha256 === originalHash, "AGENTS local target bytes changed");
      closed.push(`${source.sourcePath}:direct-agents-reference`);
      continue;
    }
    if (source.sourcePath === "dev/rules/gate5-local-route.md") {
      const router = accepted.entries.find((entry) => entry.targetRel === "dev/RULE_PACKS.md");
      assert(router?.activeReader?.routes?.some((route) => route.targetRel === source.sourcePath && route.sha256 === originalHash), "RULE_PACKS local target lacks same-acceptance reader/effect closure");
      assert(active.sourceIdentity.sha256 === originalHash, "RULE_PACKS local target bytes changed");
      closed.push(`${source.sourcePath}:direct-rule-packs-route`);
      continue;
    }
    if (source.sourcePath.startsWith("dev/governance_migrations/")) {
      assert(active.sourceIdentity.sha256 === originalHash, `historical transaction evidence changed: ${source.sourcePath}`);
      closed.push(`${source.sourcePath}:historical-evidence`);
      continue;
    }
    if (source.sourcePath === "dev/safety.md") {
      assert(active.sourceIdentity.sha256 === originalHash && source.unresolvedReason === null, "ordinary same-name root source was changed or promoted into Kit reachability");
      closed.push(`${source.sourcePath}:outside-kit-reachability`);
      continue;
    }
    if (source.ownership === "kit-managed-exact") {
      if (transactionEntry) {
        assert(transactionEntry.beforeHash === originalHash && transactionEntry.afterHash === active.sourceIdentity.sha256, `exact managed transaction identity mismatch: ${source.sourcePath}`);
      } else {
        assert(active.sourceIdentity.sha256 === originalHash, `exact managed item changed without the shared transaction: ${source.sourcePath}`);
      }
      closed.push(`${source.sourcePath}:exact-managed`);
      continue;
    }
    assert(active.sourceIdentity.sha256 === originalHash, `unclassified original root source changed: ${source.sourcePath}`);
    closed.push(`${source.sourcePath}:unchanged-outside-runtime`);
  }
  assert(closed.length === sidecar.items.length, "whole-set closure did not classify every original source item");
  assert(conservedByPath.size === sidecar.sourceConservationPaths.length, "whole-set current state contains an unaccounted source-conservation entry");
  console.log(`GREEN: Gate 5 whole-set equality classified ${closed.length} original sources under one artifact-backed frozen set and one bounded shared current-state acceptance.`);
  console.log(`before frozen-set digest: ${sidecar.frozenSetSha256}`);
  console.log(`after frozen-set digest:  ${after.frozenSetSha256}`);
  console.log(`transaction: ${journal.id}`);
  console.log("canonical remaining unresolved for this frozen fixture: none (all original sources have an exact transaction, shared runtime-preserve/readback, retained historical-evidence, or outside-Kit-reachability disposition)");
}

function assertRuntimeClosure(targetRel, originalHash, active, accepted, transactionEntry) {
  const entry = accepted.entries.find((candidate) => candidate.targetRel === targetRel);
  assert(entry, `runtime target lacks shared acceptance entry: ${targetRel}`);
  assert(entry.accepted.sha256 === active.sourceIdentity.sha256, `runtime acceptance differs from current bytes: ${targetRel}`);
  if (entry.disposition === "preserve") {
    assert(entry.accepted.sha256 === originalHash && active.sourceIdentity.sha256 === originalHash, `preserved runtime target changed bytes: ${targetRel}`);
    assert(transactionEntry?.beforeHash === originalHash && transactionEntry.afterHash === originalHash, `preserved runtime target lacks unchanged transaction bytes: ${targetRel}`);
  } else {
    assert(transactionEntry?.beforeHash === originalHash && transactionEntry.afterHash === active.sourceIdentity.sha256, `exact runtime target lacks complete transaction identity: ${targetRel}`);
  }
}

function latestRuntimeTransaction(root) {
  const migrations = path.join(root, "dev", "governance_migrations");
  const candidates = readdirSync(migrations)
    .filter((name) => name !== ".upgrade.lock")
    .map((name) => path.join(migrations, name))
    .filter((candidate) => statSync(candidate).isDirectory() && existsSync(path.join(candidate, "transaction.json")))
    .map((directory) => ({ directory, journal: JSON.parse(read(path.join(directory, "transaction.json"))) }))
    .filter(({ journal }) => journal.state === "committed" && journal.runtimeAcceptance && journal.currentStateWitness)
    .sort((left, right) => statSync(right.directory).mtimeMs - statSync(left.directory).mtimeMs);
  assert(candidates.length === 1, "whole-set fixture expected one committed runtime-acceptance transaction");
  return { journal: candidates[0].journal, report: read(path.join(candidates[0].directory, "migration-report.md")) };
}

function cli(args, label) {
  const result = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", ...args], {
    cwd: candidateRoot,
    encoding: "utf8",
    env: { ...process.env, AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "1" }
  });
  if (result.error) throw new Error(`${label} could not start: ${result.error.message}`);
  return result;
}

function parseArgs(args) {
  const phase = ["prepare", "verify", "all"].includes(args[0]) ? args[0] : "all";
  const rootIndex = args.indexOf("--root");
  const project = rootIndex >= 0 ? path.resolve(args[rootIndex + 1] ?? "") : null;
  if (rootIndex >= 0 && !project) throw new Error("--root requires a fixture path");
  return { phase, project };
}

function fresh(label) {
  const project = path.join(qaTmp, `ack-r034-${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  assert(!existsSync(project), `QA fixture already exists: ${project}`);
  mkdirSync(project, { recursive: true });
  return project;
}

function requiredProject(value) { if (!value || !existsSync(value)) throw new Error("verify requires --root <prepared fixture>"); return value; }
function sidecarPath(project) { return `${project}${sidecarSuffix}`; }
function write(file, text) { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, text, "utf8"); }
function append(file, text) { write(file, `${read(file)}${text}`); }
function read(file) { return readFileSync(file, "utf8"); }
function output(result) { return `${result.stdout ?? ""}\n${result.stderr ?? ""}`; }
function assert(condition, message) { if (!condition) throw new Error(message); }
