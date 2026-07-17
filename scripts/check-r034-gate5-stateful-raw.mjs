#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir as systemTmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadOfficialOriginCatalog } from "../bin/official-origin-catalog.mjs";
import { materializeVerifiedV038ArtifactFixture } from "./r034-v038-artifact-fixture.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const candidateRoot = path.resolve(__dirname, "..");
const qaTmp = process.env.AGENT_HANDOFF_KIT_QA_TMP || (process.platform === "win32" ? "C:\\tmp" : systemTmpdir());
const catalog = await loadOfficialOriginCatalog();
const statefulTargets = ["START_NEXT_SESSION_PROMPT.txt", "dev/SESSION_HANDOFF.md", "dev/PROJECT_INDEX.md"];

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});

async function main() {
  const project = fresh("gate5-stateful-raw");
  const artifact = await materializeVerifiedV038ArtifactFixture({ project, catalog });
  const handoffRel = "dev/SESSION_HANDOFF.md";
  const before = new Map(statefulTargets.map((targetRel) => [targetRel, readBuffer(path.join(project, targetRel))]));
  // This preserves every character but alters raw bytes. Pre-fix code accepted
  // it through the normalized/canonical historical path, wrote a new handoff,
  // and nevertheless printed a committed healthy success.
  const handoffLf = Buffer.from(before.get(handoffRel).toString("utf8").replaceAll("\r\n", "\n"), "utf8");
  assert(!handoffLf.equals(before.get(handoffRel)), "fixture did not create a raw-only stateful handoff drift");
  writeFileSync(path.join(project, handoffRel), handoffLf);
  before.set(handoffRel, handoffLf);

  const result = cli(["upgrade", "--yes", "--root", project], "stateful raw-byte green");
  const text = output(result);
  assert(result.status === 0 && text.includes("migration committed") && text.includes("project health: passed"), `stateful whole-file preserve blocked safe Kit updates: ${text}`);
  assert(text.includes("preserve: 3"), "upgrade did not disclose all root/version stateful preserves");
  for (const targetRel of statefulTargets) {
    assert(readBuffer(path.join(project, targetRel)).equals(before.get(targetRel)), `${targetRel}: stateful preserve changed raw bytes`);
  }
  assert(existsSync(path.join(project, "dev", "rules", "closeout.md")), "stateful preserve prevented an unrelated safe Kit update");

  const transaction = latestTransaction(project);
  const accepted = transaction.journal.runtimeAcceptance;
  assert(accepted?.schemaVersion === 4, "stateful whole-file acceptance did not use schema v4");
  const entries = statefulTargets.map((targetRel) => accepted.entries.find((entry) => entry.targetRel === targetRel));
  assert(entries.every(Boolean), "same runtime acceptance omitted a root/version stateful item");
  for (const entry of entries) {
    const bytes = before.get(entry.targetRel);
    assert(entry.disposition === "preserve" && entry.conflictDecision === "non-exact-package-bytes" && entry.effectDecision === "preserve-unmodified-through-direct-stateful-formal-entry", `${entry.targetRel}: stateful preservation decision is incomplete`);
    assert(entry.accepted.sha256 === sha(bytes) && entry.sourceWitness.sha256 === sha(bytes) && entry.accepted.bytes === bytes.length, `${entry.targetRel}: stateful raw-byte witness drifted`);
    assert(entry.sourceByteRanges?.length === 1 && entry.sourceByteRanges[0].start === 0 && entry.sourceByteRanges[0].end === bytes.length && entry.sourceByteRanges[0].sha256 === sha(bytes), `${entry.targetRel}: stateful whole-file range is incomplete`);
  }
  const handoffEntry = entries.find((entry) => entry.targetRel === handoffRel);
  assert(handoffEntry.activeReader.reader === "AGENTS.md" && handoffEntry.activeReader.via === "direct-formal-entry", "handoff formal reader is not bound to the active AGENTS entry");
  const startupEntry = entries.find((entry) => entry.targetRel === "START_NEXT_SESSION_PROMPT.txt");
  assert(startupEntry.activeReader.reader === "START_NEXT_SESSION_PROMPT.txt" && startupEntry.activeReader.via === "formal-startup-entry", "startup formal entry is not bound to its own raw bytes");
  assert(transaction.journal.currentStateWitness?.runtimeAcceptance?.acceptanceDigest === accepted.acceptanceDigest, "shared current-state witness did not bind stateful acceptance");
  assert(transaction.journal.runtimeAcceptanceReadback?.reader === "doctor formal startup/direct AGENTS stateful runtime acceptance check", "post-transaction doctor did not fresh-read the stateful acceptance");
  assert(transaction.journal.currentStateReadback?.runtimeAcceptanceDigest === accepted.acceptanceDigest, "success output did not use the same stateful acceptance digest");
  assert(transaction.report.includes(accepted.acceptanceDigest) && transaction.report.includes(transaction.journal.currentStateWitness.currentStateDigest), "report did not consume the same stateful/current-state identity");

  const doctor = cli(["doctor", "--root", project], "stateful ordinary doctor");
  assert(doctor.status === 0 && output(doctor).includes("formal startup/direct AGENTS stateful") && output(doctor).includes("status: passed"), "ordinary doctor did not fresh-read stateful acceptance");
  const saved = readBuffer(path.join(project, handoffRel));
  writeFileSync(path.join(project, handoffRel), Buffer.from("STATEFUL_HANDOFF_DRIFT_v1\n", "utf8"));
  const drift = cli(["doctor", "--root", project], "stateful reader drift");
  assert(drift.status !== 0 && !output(drift).includes("status: passed"), "ordinary doctor accepted direct-stateful reader/bytes drift");
  writeFileSync(path.join(project, handoffRel), saved);
  const restored = cli(["doctor", "--root", project], "stateful reader restoration");
  assert(restored.status === 0 && output(restored).includes("status: passed"), "ordinary doctor did not recover after restoring stateful bytes");

  console.log("GREEN: a raw-only pre-existing stateful drift is preserved whole; formal startup/direct AGENTS readers, report, doctor, and success consume one current-state acceptance, and reader/byte drift blocks doctor until restored.");
  console.log(`fixture: ${project}`);
  console.log(`artifact integrity: ${artifact.integrity}`);
  console.log(`transaction: ${transaction.journal.id}`);
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
  assert(candidates.length === 1, "stateful raw fixture expected one runtime-acceptance transaction");
  const directory = candidates[0];
  return { journal: JSON.parse(read(path.join(directory, "transaction.json"))), report: read(path.join(directory, "migration-report.md")) };
}

function fresh(label) {
  const project = path.join(qaTmp, `ack-r034-${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  assert(!existsSync(project), `QA fixture already exists: ${project}`);
  mkdirSync(project, { recursive: true });
  return project;
}

function read(file) { return readFileSync(file, "utf8"); }
function readBuffer(file) { return readFileSync(file); }
function sha(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function output(result) { return `${result.stdout ?? ""}\n${result.stderr ?? ""}`; }
function assert(condition, message) { if (!condition) throw new Error(message); }
