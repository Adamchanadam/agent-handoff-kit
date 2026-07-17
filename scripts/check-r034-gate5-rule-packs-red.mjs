#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir as systemTmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadOfficialOriginCatalog } from "../bin/official-origin-catalog.mjs";
import { buildUpgradeInventory } from "../bin/upgrade-inventory.mjs";
import { materializeVerifiedV038ArtifactFixture } from "./r034-v038-artifact-fixture.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const candidateRoot = path.resolve(__dirname, "..");
const qaTmp = process.env.AGENT_HANDOFF_KIT_QA_TMP || (process.platform === "win32" ? "C:\\tmp" : systemTmpdir());
const catalog = await loadOfficialOriginCatalog();

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});

async function main() {
  // Gate 5 representative red only. The unmarked row is intentionally inside
  // the active router table: it has no heading or ownership marker, while its
  // target is mechanically reachable through AGENTS.md -> RULE_PACKS.md.
  const project = fresh("gate5-rule-packs-red");
  const artifact = await materializeVerifiedV038ArtifactFixture({ project, catalog });

  const agentsRel = "AGENTS.md";
  const routerRel = "dev/RULE_PACKS.md";
  const localRel = "dev/rules/local-routing-rule.md";
  const localEffect = "LOCAL_RULE_PACK_ROUTE_EFFECT_v1";
  const localBytes = Buffer.from(`${localEffect}\n`, "utf8");
  const routerPath = path.join(project, routerRel);
  const officialRouterBytes = readBuffer(routerPath);
  const officialRouterText = officialRouterBytes.toString("utf8");
  const localRow = `| Local project rule | \`${localRel}\` | Apply ${localEffect} before the Kit route selected for this task. |`;
  const tableBoundary = /\r?\n\r?\n## Routing Rule/;
  assert(tableBoundary.test(officialRouterText), "trusted v0.3.38 RULE_PACKS fixture has no routing-table boundary");
  // Keep this row contiguous with the active table. A visually nearby row
  // after a blank line is not a formal RULE_PACKS route and would not test the
  // AGENTS -> RULE_PACKS runtime reader.
  const beforeRouterText = officialRouterText.replace(tableBoundary, `\n${localRow}\n\n## Routing Rule`);
  const beforeRouterBytes = Buffer.from(beforeRouterText, "utf8");
  writeFileSync(routerPath, beforeRouterBytes);
  write(path.join(project, localRel), localBytes);

  const beforeInventory = await buildUpgradeInventory({ root: project });
  assert(beforeInventory.status === "ready", `fixture inventory blocked before upgrade: ${JSON.stringify(beforeInventory.blockers)}`);
  assert(hasReachability(beforeInventory, routerRel, "AGENTS.md"), "fixture AGENTS.md does not formally reach RULE_PACKS.md");
  assert(hasReachability(beforeInventory, localRel, routerRel), "fixture local route is not mechanically reachable from RULE_PACKS.md");
  assert(read(path.join(project, agentsRel)).includes("Use `dev/RULE_PACKS.md` to decide"), "fixture AGENTS.md does not contain the active RULE_PACKS entry instruction");
  assert(beforeRouterText.includes(localRow) && !localRow.includes("ack:route:"), "fixture did not create an unmarked local route row");

  const result = cli(["upgrade", "--yes", "--root", project], "v0.3.38 RULE_PACKS whole-file preserve green");
  const resultText = output(result);
  assert(result.status === 0, `whole-file RULE_PACKS preservation blocked safe Kit updates: ${resultText}`);
  assert(resultText.includes("migration committed") && resultText.includes("project health: passed"), "green upgrade did not emit same-readback success state");

  const afterRouterBytes = readBuffer(routerPath);
  const afterRouterText = afterRouterBytes.toString("utf8");
  assert(afterRouterBytes.equals(beforeRouterBytes), "whole-file preserve changed a non-exact RULE_PACKS byte");
  assert(afterRouterText.includes(localRow), "whole-file preserve lost the unheaded local route row");
  assert(readBuffer(path.join(project, localRel)).equals(localBytes), "upgrade changed the local route target bytes");
  assert(existsSync(path.join(project, "dev", "rules", "closeout.md")), "whole-file preserve prevented an unrelated safe Kit update");

  const afterInventory = await buildUpgradeInventory({ root: project });
  assert(afterInventory.status === "ready", `fixture inventory blocked after upgrade: ${JSON.stringify(afterInventory.blockers)}`);
  assert(hasReachability(afterInventory, routerRel, "AGENTS.md") && hasReachability(afterInventory, localRel, routerRel), "whole-file preserve removed the AGENTS -> RULE_PACKS -> local route path");

  const transaction = latestTransaction(project);
  const journalEntry = transaction.journal.entries.find((entry) => entry.targetRel === routerRel);
  assert(journalEntry, "transaction journal omitted the preserved RULE_PACKS target");
  assert(journalEntry.beforeHash === sha(beforeRouterBytes) && journalEntry.afterHash === sha(afterRouterBytes) && journalEntry.beforeHash === journalEntry.afterHash, "transaction hashes do not bind identical preserved router bytes");
  const sharedEntry = transaction.journal.currentStateWitness?.entries?.find((entry) => entry.targetRel === routerRel);
  assert(sharedEntry?.beforeHash === sha(beforeRouterBytes) && sharedEntry.afterHash === sha(afterRouterBytes) && sharedEntry.beforeHash === sharedEntry.afterHash, "shared current-state witness omitted preserved RULE_PACKS byte identity");

  const runtimeEntry = transaction.journal.runtimeAcceptance?.entries?.find((entry) => entry.targetRel === routerRel);
  const sharedRuntimeEntry = transaction.journal.currentStateWitness?.runtimeAcceptance?.entries?.find((entry) => entry.targetRel === routerRel);
  assert(transaction.journal.runtimeAcceptance?.schemaVersion === 4 && runtimeEntry && sharedRuntimeEntry, "same runtime acceptance omitted the direct RULE_PACKS preserve item");
  assert(runtimeEntry.disposition === "preserve" && runtimeEntry.conflictDecision === "non-exact-package-bytes" && runtimeEntry.effectDecision === "preserve-unmodified-through-direct-rule-packs-entry", "direct RULE_PACKS preservation decision is incomplete");
  assert(runtimeEntry.accepted.sha256 === sha(beforeRouterBytes) && runtimeEntry.sourceWitness.sha256 === sha(beforeRouterBytes) && runtimeEntry.accepted.bytes === beforeRouterBytes.length && runtimeEntry.sourceWitness.bytes === beforeRouterBytes.length, "direct RULE_PACKS acceptance lost its original-byte witness");
  assert(runtimeEntry.sourceByteRanges?.length === 1 && runtimeEntry.sourceByteRanges[0].start === 0 && runtimeEntry.sourceByteRanges[0].end === beforeRouterBytes.length && runtimeEntry.sourceByteRanges[0].sha256 === sha(beforeRouterBytes), "direct RULE_PACKS acceptance does not prove one complete non-overlapping source range");
  assert(runtimeEntry.originalReader.reader === "AGENTS.md" && runtimeEntry.originalReader.via === "direct-rule-packs-entry" && runtimeEntry.activeReader.reader === "AGENTS.md" && runtimeEntry.activeReader.via === "direct-rule-packs-entry", "direct RULE_PACKS acceptance omitted the formal reader");
  const originalLocalRoute = runtimeEntry.originalReader.routes.find((route) => route.targetRel === localRel);
  const activeLocalRoute = runtimeEntry.activeReader.routes.find((route) => route.targetRel === localRel);
  assert(originalLocalRoute?.sha256 === sha(localBytes) && originalLocalRoute.bytes === localBytes.length && activeLocalRoute?.sha256 === sha(localBytes) && activeLocalRoute.bytes === localBytes.length, "direct RULE_PACKS acceptance omitted the local target bytes from the reader/effect witness");
  assert(transaction.journal.currentStateWitness.runtimeAcceptance?.acceptanceDigest === transaction.journal.runtimeAcceptance.acceptanceDigest, "whole current-state witness did not bind direct RULE_PACKS acceptance");
  assert(transaction.journal.runtimeAcceptanceReadback?.reader?.includes("direct RULE_PACKS entry"), "post-transaction doctor did not fresh-read the direct RULE_PACKS acceptance");
  assert(transaction.journal.currentStateReadback?.runtimeAcceptanceDigest === transaction.journal.runtimeAcceptance.acceptanceDigest, "success state did not use the same direct RULE_PACKS acceptance digest");

  const doctor = cli(["doctor", "--root", project], "RULE_PACKS representative ordinary doctor");
  const doctorText = output(doctor);
  assert(doctor.status === 0 && doctorText.includes("status: passed") && doctorText.includes("direct RULE_PACKS entry"), "ordinary doctor did not fresh-read the same direct RULE_PACKS acceptance state");
  assert(transaction.report.includes("## Runtime Acceptance") && transaction.report.includes(transaction.journal.runtimeAcceptance.acceptanceDigest) && transaction.report.includes(`dev/RULE_PACKS.md:${sha(beforeRouterBytes)}:preserve:preserve-unmodified-through-direct-rule-packs-entry:range=0-${beforeRouterBytes.length}`), "migration report did not consume the same complete direct RULE_PACKS acceptance witness");
  assert(transaction.report.includes("## Shared Current-State Witness") && transaction.report.includes(transaction.journal.currentStateWitness.currentStateDigest), "migration report did not consume the same whole current-state identity");

  // Directly affected regression: the local target is not a transaction output,
  // so only the direct RULE_PACKS formal reader can detect this effect drift.
  writeFileSync(path.join(project, localRel), Buffer.from("LOCAL_RULE_PACK_ROUTE_EFFECT_DRIFT_v1\n", "utf8"));
  const driftDoctor = cli(["doctor", "--root", project], "RULE_PACKS local target drift regression");
  assert(driftDoctor.status !== 0 && !output(driftDoctor).includes("status: passed"), "ordinary doctor accepted local route-target byte drift after the transaction");
  writeFileSync(path.join(project, localRel), localBytes);
  const restoredDoctor = cli(["doctor", "--root", project], "RULE_PACKS local target drift restoration");
  assert(restoredDoctor.status === 0 && output(restoredDoctor).includes("status: passed"), "ordinary doctor did not recover after restoring the accepted local target bytes");

  console.log("GREEN: the original RULE_PACKS red fixture preserves the complete non-exact table unchanged, keeps its unheaded AGENTS -> RULE_PACKS local route and target bytes effective, and binds one complete source range plus the ordered reader/effect witness to the same transaction, doctor, report, and success state. Local target drift fails doctor until restored.");
  console.log(`fixture: ${project}`);
  console.log(`RULE_PACKS before sha256: ${sha(beforeRouterBytes)}`);
  console.log(`RULE_PACKS after sha256:  ${sha(afterRouterBytes)}`);
  console.log(`transaction: ${transaction.journal.id}`);
}

function hasReachability(inventory, targetRel, from) {
  const entry = inventory.entries.find((candidate) => candidate.path === targetRel);
  return Boolean(entry?.reachability?.some((item) => item.from === from));
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

function latestTransaction(root) {
  const migrations = path.join(root, "dev", "governance_migrations");
  const candidates = readdirSync(migrations)
    .filter((name) => name !== ".upgrade.lock")
    .map((name) => path.join(migrations, name))
    .filter((candidate) => statSync(candidate).isDirectory() && existsSync(path.join(candidate, "transaction.json")))
    .filter((candidate) => JSON.parse(read(path.join(candidate, "transaction.json"))).runtimeAcceptance);
  assert(candidates.length === 1, "RULE_PACKS red fixture expected exactly one runtime-acceptance transaction");
  const directory = candidates[0];
  return {
    journal: JSON.parse(read(path.join(directory, "transaction.json"))),
    report: read(path.join(directory, "migration-report.md"))
  };
}

function fresh(label) {
  const project = path.join(qaTmp, `ack-r034-${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  assert(!existsSync(project), `QA fixture already exists: ${project}`);
  mkdirSync(project, { recursive: true });
  return project;
}

function write(file, content) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
}

function read(file) { return readFileSync(file, "utf8"); }
function readBuffer(file) { return readFileSync(file); }
function sha(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function output(result) { return `${result.stdout ?? ""}\n${result.stderr ?? ""}`; }
function assert(condition, message) { if (!condition) throw new Error(message); }
