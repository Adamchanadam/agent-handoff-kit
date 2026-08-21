#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { hostname, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createQaTempTracker } from "./qa-temp-cleanup.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageVersion = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version;
const qaTemp = createQaTempTracker("upgrade transaction-window QA");

let passed = false;
try {
  checkMalformedActiveLocksFailClosed();
  checkInvalidActiveLockReferencesFailClosed();
  checkPreReplaceDriftRollsBack();
  checkSupportedActiveRecoveryStillWorks();
  checkCleanTransactionIsOperationLocal();
  console.log("ok: upgrade transaction window is operation-local");
  passed = true;
} finally {
  if (passed) qaTemp.cleanupOnSuccess();
  else qaTemp.reportRetained("QA failed before cleanup");
}

function checkMalformedActiveLocksFailClosed() {
  const variants = [
    ["empty", ""],
    ["open-object", "{"],
    ["open-array", "["],
    ["malformed", "{ not json\n"]
  ];
  for (const [label, lockBytes] of variants) {
    const project = install(`malformed-lock-${label}`);
    writeOldCommittedJournal(project);
    const lockPath = path.join(project, "dev", "governance_migrations", ".upgrade.lock");
    writeFileSync(lockPath, lockBytes, "utf8");
    assertActiveLockBlocksWithoutWrites(project, `malformed ${label}`, "upgrade lock exists but is unreadable or malformed");
  }
  console.log("ok: malformed active locks fail closed without quarantine or historical-journal fallback");
}

function checkInvalidActiveLockReferencesFailClosed() {
  const invalidSchema = install("invalid-lock-schema");
  writeOldCommittedJournal(invalidSchema);
  writeFileSync(path.join(invalidSchema, "dev", "governance_migrations", ".upgrade.lock"), `${JSON.stringify({ id: "qa-invalid" }, null, 2)}\n`, "utf8");
  assertActiveLockBlocksWithoutWrites(invalidSchema, "invalid schema lock", "upgrade lock schema is invalid");

  const missingJournal = install("missing-lock-journal");
  writeOldCommittedJournal(missingJournal);
  writeFileSync(path.join(missingJournal, "dev", "governance_migrations", ".upgrade.lock"), `${JSON.stringify({
    id: "qa-missing-journal",
    command: "upgrade",
    journal: "dev/governance_migrations/missing-active/transaction.json",
    host: currentHost(),
    pid: 99999999
  }, null, 2)}\n`, "utf8");
  assertActiveLockBlocksWithoutWrites(missingJournal, "missing exact journal", "incomplete upgrade lock has no readable journal");

  const unreadableJournal = install("unreadable-lock-journal");
  const unreadableDir = path.join(unreadableJournal, "dev", "governance_migrations", "unreadable-active");
  mkdirSync(unreadableDir, { recursive: true });
  writeOldCommittedJournal(unreadableJournal);
  writeFileSync(path.join(unreadableJournal, "dev", "governance_migrations", ".upgrade.lock"), `${JSON.stringify({
    id: "qa-unreadable-journal",
    command: "upgrade",
    journal: "dev/governance_migrations/unreadable-active",
    host: currentHost(),
    pid: 99999999
  }, null, 2)}\n`, "utf8");
  assertActiveLockBlocksWithoutWrites(unreadableJournal, "unreadable exact journal", "incomplete upgrade lock has no readable journal");

  console.log("ok: invalid active lock schema and exact-journal failures fail closed");
}

function checkPreReplaceDriftRollsBack() {
  const project = install("pre-replace-drift");
  const targetRel = "dev/PROJECT_INDEX.md";
  const targetPath = path.join(project, targetRel);
  const before = readFileSync(targetPath);
  const injected = Buffer.from(`${before.toString("utf8")}\nQA_EXTERNAL_PRE_REPLACE_DRIFT\n`, "utf8");
  const result = cli(["upgrade", "--yes", "--root", project], "pre-replace drift", {
    allowFailure: true,
    env: {
      AGENT_HANDOFF_KIT_QA_MUTATE_BEFORE_LOCK_REVALIDATION: targetRel,
      AGENT_HANDOFF_KIT_QA_MUTATE_BEFORE_LOCK_REVALIDATION_BASE64: injected.toString("base64")
    }
  });
  assert(result.status !== 0, "pre-replace drift unexpectedly committed");
  assert(output(result).includes("lock-time preflight drifted before target replacement"), "pre-replace drift did not stop at lock-time identity");
  assert(readFileSync(targetPath).equals(injected), "pre-replace drift target bytes were overwritten");
  const lockPath = path.join(project, "dev", "governance_migrations", ".upgrade.lock");
  assert(!existsSync(lockPath), "successful pre-replace cleanup retained upgrade lock");
  const record = latestJournalRecord(project);
  const journal = record?.journal;
  assert(journal.state === "rolled-back", "pre-replace drift journal did not record rolled-back state");
  assert(journal.entries.every((entry) => entry.committed === false), "pre-replace drift committed a target entry");
  assert(!existsSync(path.join(path.dirname(record.path), "migration-report.md")), "pre-replace drift produced a success report");
}

function checkSupportedActiveRecoveryStillWorks() {
  const project = install("supported-active-recovery");
  const interrupted = cli(["upgrade", "--yes", "--root", project], "supported active recovery fixture", {
    allowFailure: true,
    env: { AGENT_HANDOFF_KIT_QA_INTERRUPT_AFTER_JOURNAL_COMMIT: "1" }
  });
  assert(interrupted.status !== 0 && output(interrupted).includes("QA interruption after committed journal"), "active recovery fixture did not stop after committed journal");
  const migrationDir = path.dirname(latestJournalRecord(project).path);
  const lockPath = path.join(project, "dev", "governance_migrations", ".upgrade.lock");
  assert(existsSync(lockPath), "active recovery fixture did not retain lock");
  assert(!existsSync(path.join(migrationDir, "migration-report.md")), "active recovery fixture unexpectedly wrote report before recovery");
  const recovered = cli(["upgrade", "--yes", "--root", project], "supported active recovery");
  assert(recovered.stdout.includes("recovered committed upgrade"), "supported active recovery did not run exact-reference recovery");
  assert(!existsSync(lockPath), "supported active recovery retained lock");
  assert(existsSync(path.join(migrationDir, "migration-report.md")), "supported active recovery did not rebuild report");
  console.log("ok: supported active transaction recovery still uses exact lock/journal references");
}

function checkCleanTransactionIsOperationLocal() {
  const project = install("clean-transaction");
  const result = cli(["upgrade", "--yes", "--root", project], "clean transaction");
  assert(result.stdout.includes("沒有檔案需要建立或合併") || result.stdout.includes("migration committed"), "clean upgrade did not finish truthfully");
  const journal = latestJournalRecord(project)?.journal;
  if (journal) {
    assert(!("currentStateWitness" in journal), "committed journal contains future current-state witness");
    assert(!("sourceConservation" in journal), "committed journal contains future source-conservation authority");
    assert(!("runtimeAcceptance" in journal), "committed journal contains future runtime acceptance authority");
  }
  const doctor = cli(["doctor", "--root", project], "clean transaction doctor");
  assert(doctor.stdout.includes("status: passed"), `doctor failed after clean transaction\n${output(doctor)}`);
}

function install(label) {
  const project = path.join(tmpdir(), `ahk-txn-${label}-${packageVersion}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  qaTemp.track(project);
  mkdirSync(project, { recursive: true });
  cli(["init", "--yes", "--root", project], `${label} init`);
  const index = path.join(project, "dev", "PROJECT_INDEX.md");
  const text = readFileSync(index, "utf8").replace(`| Agent Handoff Kit template version | ${packageVersion} |`, "| Agent Handoff Kit template version | 0.3.53 |");
  writeFileSync(index, text, "utf8");
  return project;
}

function writeOldCommittedJournal(project) {
  const dir = path.join(project, "dev", "governance_migrations", "old-committed-history");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "transaction.json"), `${JSON.stringify({
    id: "old-committed-history",
    command: "upgrade",
    attemptedVersion: "0.3.53",
    committedVersion: "0.3.53",
    state: "committed",
    entries: [],
    archiveMigrations: [],
    createdAt: "2026-07-26T00:00:00.000Z",
    committedAt: "2026-07-26T00:00:01.000Z"
  }, null, 2)}\n`, "utf8");
}

function assertActiveLockBlocksWithoutWrites(project, label, expectedText) {
  const before = fullSnapshot(project);
  const commands = [
    ["upgrade", "--dry-run", "--root", project],
    ["upgrade", "--yes", "--root", project],
    ["doctor", "--root", project]
  ];
  for (const args of commands) {
    const result = cli(args, `${label} ${args[0]}`, { allowFailure: true });
    assert(result.status !== 0, `${label}: ${args.join(" ")} unexpectedly succeeded`);
    assert(output(result).includes(expectedText) || output(result).includes("pending transaction") || output(result).includes("unresolved transaction") || output(result).includes("partial transaction state"), `${label}: ${args.join(" ")} did not report active-lock boundary\n${output(result)}`);
    assertSnapshotsEqual(before, fullSnapshot(project), `${label}: ${args.join(" ")} changed fixture bytes`);
    assertNoUnboundLock(project, label);
  }
}

function fullSnapshot(project) {
  const snapshot = new Map();
  collectAllFiles(project, project, snapshot);
  return snapshot;
}

function collectAllFiles(base, dir, snapshot) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    const relative = path.relative(base, absolute).replace(/\\/g, "/");
    if (entry.isDirectory()) collectAllFiles(base, absolute, snapshot);
    else if (entry.isFile()) snapshot.set(relative, sha(readFileSync(absolute)));
  }
}

function assertSnapshotsEqual(left, right, message) {
  assert(left.size === right.size, `${message}: file count changed ${left.size} -> ${right.size}`);
  for (const [relative, digest] of left) {
    assert(right.get(relative) === digest, `${message}: ${relative} changed`);
  }
}

function assertNoUnboundLock(project, label) {
  const migrationsRoot = path.join(project, "dev", "governance_migrations");
  const unbound = readdirSync(migrationsRoot).filter((name) => name.startsWith(".upgrade.lock.unbound-"));
  assert(unbound.length === 0, `${label}: lock was quarantined as ${unbound.join(", ")}`);
}

function currentHost() {
  return hostname();
}

function latestJournalRecord(project) {
  const rootDir = path.join(project, "dev", "governance_migrations");
  if (!existsSync(rootDir)) return null;
  const files = [];
  collect(rootDir, "transaction.json", files);
  if (files.length === 0) return null;
  const latest = files.sort((left, right) => statSync(left).mtimeMs - statSync(right).mtimeMs).at(-1);
  return { path: latest, journal: JSON.parse(readFileSync(latest, "utf8")) };
}

function collect(dir, name, files) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(absolute, name, files);
    else if (entry.isFile() && entry.name === name) files.push(absolute);
  }
}

function cli(args, label, options = {}) {
  const result = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", ...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "1", ...(options.env ?? {}) }
  });
  if (!options.allowFailure && (result.error || result.status !== 0)) throw new Error(`${label} failed\n${output(result)}`);
  return result;
}

function output(result) {
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}
