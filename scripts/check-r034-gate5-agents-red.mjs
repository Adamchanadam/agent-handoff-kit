#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir as systemTmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadOfficialOriginCatalog } from "../bin/official-origin-catalog.mjs";
import { extractExplicitLocalReferences, materializeProjectIndexTemplateVersion, parseProjectIndexTemplateVersion } from "../bin/upgrade-inventory.mjs";
import { materializeVerifiedV038ArtifactFixture } from "./r034-v038-artifact-fixture.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const candidateRoot = path.resolve(__dirname, "..");
const qaTmp = process.env.AGENT_HANDOFF_KIT_QA_TMP || (process.platform === "win32" ? "C:\\tmp" : systemTmpdir());
const catalog = await loadOfficialOriginCatalog();
const packageVersion = JSON.parse(readFileSync(path.join(candidateRoot, "package.json"), "utf8")).version;
const projectIndexRel = "dev/PROJECT_INDEX.md";

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});

async function main() {
  // This is the original Gate 5 AGENTS false-green input. It now serves as
  // the single green proof: no input change, no source splitting.
  const project = fresh("gate5-agents-red");
  const artifact = await materializeVerifiedV038ArtifactFixture({ project, catalog });

  const agentsRel = "AGENTS.md";
  const agentsPath = path.join(project, agentsRel);
  const localRel = "docs/local-agent-rule.txt";
  const localPath = path.join(project, localRel);
  const localBytes = Buffer.from("LOCAL_AGENT_RULE_TARGET_BYTES_v1\n", "utf8");
  const userRule = "Always retain LOCAL_AGENT_RULE_EFFECT_v1 before applying Kit-managed instructions.";
  const userReference = `Read [the local agent rule](${localRel}) before changing project rules.`;
  const originalOfficialBytes = readBuffer(agentsPath);
  const managedEnd = "<!-- END Agent Handoff Kit managed core -->";
  const officialText = originalOfficialBytes.toString("utf8");
  assert(officialText.includes(managedEnd), "trusted v0.3.38 AGENTS fixture has no managed-core end boundary");
  const beforeBytes = Buffer.from(officialText.replace(managedEnd, `${userRule}\n${userReference}\n${managedEnd}`), "utf8");
  writeFileSync(agentsPath, beforeBytes);
  write(localPath, localBytes);

  const beforeText = beforeBytes.toString("utf8");
  assert(beforeText.indexOf(userRule) > beforeText.indexOf("keep the core within budget.") && beforeText.indexOf(userRule) < beforeText.indexOf(managedEnd), "fixture did not place the unheaded user rule inside the non-exact managed-looking body");
  assert(extractExplicitLocalReferences(beforeText).some((entry) => entry.path === localRel), "fixture local reference is not mechanically reachable from the formal AGENTS entry");
  const originalProjectIndex = artifact.freshInitOutputs.find((entry) => entry.targetRel === "dev/PROJECT_INDEX.md");
  assert(originalProjectIndex, "v0.3.38 artifact fixture omitted PROJECT_INDEX identity");
  const projectIndexBefore = read(path.join(project, projectIndexRel));

  const result = cli(["upgrade", "--yes", "--root", project], "v0.3.38 AGENTS mixed-source red");
  const resultText = output(result);
  assert(result.status === 0, `whole-file AGENTS preservation blocked safe Kit updates: ${resultText}`);
  assert(resultText.includes("migration committed") && resultText.includes("project health: passed"), "green upgrade did not emit same-readback success state");

  const afterBytes = readBuffer(agentsPath);
  const afterText = afterBytes.toString("utf8");
  assert(afterBytes.equals(beforeBytes), "whole-file preserve changed a non-exact AGENTS byte");
  assert(afterText.includes(userRule) && afterText.includes(userReference), "whole-file preserve lost the unheaded direct-entry user rule or its local reference");
  assert(extractExplicitLocalReferences(afterText).some((entry) => entry.path === localRel), "whole-file preserve removed the formal AGENTS local reference");
  assert(readBuffer(localPath).equals(localBytes), "upgrade changed the locally referenced target bytes");
  assert(existsSync(path.join(project, "dev", "rules", "closeout.md")), "whole-file preserve prevented an unrelated safe Kit update");
  assert(parseProjectIndexTemplateVersion(projectIndexBefore) === "0.3.38", "AGENTS red PROJECT_INDEX did not start with the expected old Stack version");
  assert(parseProjectIndexTemplateVersion(read(path.join(project, projectIndexRel))) === packageVersion, "AGENTS red PROJECT_INDEX did not materialize the package Stack version");
  assert(read(path.join(project, projectIndexRel)) === materializeProjectIndexTemplateVersion(projectIndexBefore, packageVersion), "AGENTS red PROJECT_INDEX changed bytes outside the shared Stack version-row materializer");

  const transaction = latestTransaction(project);
  const entry = transaction.journal.entries.find((candidate) => candidate.targetRel === agentsRel);
  assert(entry, "transaction journal omitted the preserved AGENTS target");
  assert(entry.beforeHash === sha(beforeBytes) && entry.afterHash === sha(afterBytes) && entry.beforeHash === entry.afterHash, "transaction hashes do not bind identical preserved AGENTS bytes");

  const wholeEntry = transaction.journal.currentStateWitness?.entries?.find((candidate) => candidate.targetRel === agentsRel);
  assert(wholeEntry?.afterHash === sha(beforeBytes), "shared current-state witness omitted the preserved AGENTS byte identity");
  assert(!acceptedTarget(transaction.journal.formalUserRules, agentsRel), "formal user-rules acceptance unexpectedly covers AGENTS mixed-source bytes");
  const accepted = transaction.journal.runtimeAcceptance?.entries.find((candidate) => candidate.targetRel === agentsRel);
  assert(transaction.journal.runtimeAcceptance?.schemaVersion === 4 && accepted, "runtime acceptance omitted the direct AGENTS preserve item");
  assert(accepted.disposition === "preserve" && accepted.conflictDecision === "non-exact-package-bytes" && accepted.effectDecision === "preserve-unmodified-through-direct-formal-entry", "direct AGENTS preservation decision is incomplete");
  assert(accepted.accepted.sha256 === sha(beforeBytes) && accepted.sourceWitness.sha256 === sha(beforeBytes) && accepted.accepted.bytes === beforeBytes.length && accepted.sourceWitness.bytes === beforeBytes.length, "direct AGENTS acceptance lost its original-byte witness");
  assert(accepted.sourceByteRanges?.length === 1 && accepted.sourceByteRanges[0].start === 0 && accepted.sourceByteRanges[0].end === beforeBytes.length && accepted.sourceByteRanges[0].sha256 === sha(beforeBytes), "direct AGENTS acceptance does not prove one complete non-overlapping source range");
  const projectIndexEntry = transaction.journal.entries.find((candidate) => candidate.targetRel === projectIndexRel);
  const projectIndexAfter = read(path.join(project, projectIndexRel));
  assert(projectIndexEntry?.beforeHash === sha(Buffer.from(projectIndexBefore, "utf8")) && projectIndexEntry.afterHash === sha(Buffer.from(projectIndexAfter, "utf8")) && projectIndexEntry.beforeHash !== projectIndexEntry.afterHash, "PROJECT_INDEX transaction entry did not bind the version-row metadata transition");
  assert(projectIndexEntry.reason?.includes("unique real PROJECT_INDEX Stack template-version row"), "PROJECT_INDEX transaction entry did not disclose the narrow Stack version-row reason");
  assert(!transaction.journal.runtimeAcceptance?.entries.some((candidate) => candidate.targetRel === projectIndexRel), "PROJECT_INDEX metadata transition was falsely included in runtimeAcceptance preserve entries");
  assert(transaction.report.includes(projectIndexEntry.afterHash) && transaction.report.includes(projectIndexEntry.reason), "PROJECT_INDEX metadata transition was not disclosed in the migration report");
  assert(accepted.originalReader.reader === "AGENTS.md" && accepted.originalReader.via === "direct-formal-entry" && accepted.activeReader.agentsSha256 === sha(beforeBytes) && accepted.priorityRelation.includes("single complete source range 0..N"), "direct AGENTS acceptance omitted reader or priority/effect evidence");
  assert(!accepted.activeReader.references?.some((reference) => reference.targetRel === localRel), "direct AGENTS acceptance treated a generic Markdown link as filesystem authority");
  assert(transaction.journal.currentStateWitness.runtimeAcceptance?.acceptanceDigest === transaction.journal.runtimeAcceptance.acceptanceDigest, "whole current-state witness did not bind direct AGENTS acceptance");
  assert(transaction.journal.runtimeAcceptanceReadback?.reader?.includes("direct AGENTS whole-file entry"), "post-transaction doctor did not fresh-read the direct AGENTS acceptance");
  assert(transaction.journal.currentStateReadback?.runtimeAcceptanceDigest === transaction.journal.runtimeAcceptance.acceptanceDigest, "success state did not use the same direct AGENTS acceptance digest");

  const doctor = cli(["doctor", "--root", project], "AGENTS mixed-source ordinary doctor");
  assert(doctor.status === 0 && output(doctor).includes("direct AGENTS whole-file entry") && output(doctor).includes("shared current-state witness: 1") && output(doctor).includes("status: passed"), "ordinary doctor did not fresh-read the same direct AGENTS acceptance state");
  assert(transaction.report?.includes("## Runtime Acceptance") && transaction.report.includes(transaction.journal.runtimeAcceptance.acceptanceDigest) && transaction.report.includes(`AGENTS.md:${sha(beforeBytes)}:preserve:preserve-unmodified-through-direct-formal-entry:ranges=0-${beforeBytes.length}`), "migration report did not consume the same complete direct AGENTS acceptance witness");
  assert(transaction.report.includes("## Shared Current-State Witness") && transaction.report.includes(transaction.journal.currentStateWitness.currentStateDigest), "migration report did not consume the same whole current-state identity");
  assert(!journalMentionsPath(transaction.journal, localRel), "transaction journal treated the generic AGENTS link target as current authority");
  assert(!transaction.report.includes(localRel), "migration report mentioned the generic AGENTS link target");

  writeFileSync(localPath, Buffer.from("LOCAL_AGENT_RULE_TARGET_DRIFT_v1\n", "utf8"));
  const driftDoctor = cli(["doctor", "--root", project], "AGENTS local target drift regression");
  assert(driftDoctor.status === 0 && output(driftDoctor).includes("status: passed"), "ordinary doctor treated inert AGENTS local-reference target drift as a blocker");
  assert(readBuffer(agentsPath).equals(beforeBytes), "doctor changed AGENTS bytes while ignoring an inert local-reference target");

  console.log("GREEN: the original AGENTS mixed-source red fixture preserves the complete file unchanged, keeps its unheaded direct-entry user rule and local reference text, and binds one complete source range plus direct reader/priority/effect to the same transaction, doctor, report, and success witness. The generic referenced target is inert and does not block doctor when changed.");
  console.log(`fixture: ${project}`);
  console.log(`artifact integrity: ${artifact.integrity}`);
  console.log(`AGENTS before sha256: ${sha(beforeBytes)}`);
  console.log(`AGENTS after sha256:  ${sha(afterBytes)}`);
  console.log(`transaction: ${transaction.journal.id}`);
}

function acceptedTarget(component, targetRel) {
  return Boolean(component?.entries?.some((entry) => entry.targetRel === targetRel));
}

function journalMentionsPath(journal, targetRel) {
  return JSON.stringify(journal).includes(targetRel);
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
    .filter((candidate) => JSON.parse(read(path.join(candidate, "transaction.json"))).runtimeAcceptance)
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs);
  assert(candidates.length === 1, "AGENTS red fixture expected exactly one transaction");
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
