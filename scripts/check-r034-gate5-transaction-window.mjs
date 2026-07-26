#!/usr/bin/env node

import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir as systemTmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { installedFileContracts } from "../bin/installed-file-contract.mjs";
import { getOfficialBaseline, loadOfficialOriginCatalog } from "../bin/official-origin-catalog.mjs";
import { readFormalUserRules } from "../bin/user-rules-router.mjs";
import { materializeProjectIndexTemplateVersion, parseProjectIndexTemplateVersion } from "../bin/upgrade-inventory.mjs";

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
  assertLockRevalidationRecomputesPreflightSource();
  await checkPostLockPreReplaceDriftRollsBack();
  await checkExactRouteDriftStops();
  await checkNonRuntimeWholeStateDriftStops();
  await checkHeadedAppendixPreservesAndReadsBack();
  console.log("ok: Gate 5 first-item transaction acceptance blocks final-window route bytes drift and preserves headed appendix bytes through the same readback authority");
}

function assertLockRevalidationRecomputesPreflightSource() {
  const source = read(path.join(candidateRoot, "bin", "agent-handoff-kit.mjs"));
  const preflight = extractFunction(source, "buildInstallTransactionPreflight");
  assert(!preflight.includes("expectedSourceConservation"), "lock-time preflight still has an expected source-conservation bypass");
  assert(!preflight.includes("expectedSupersedesCurrentStateDigests"), "lock-time preflight still has an expected supersedes-current-state bypass");
  assert(preflight.includes("createSourceConservation(root, outputs, archiveMigrations"), "preflight no longer recomputes source conservation through the shared builder");
  assert(preflight.includes("findRestoredCurrentStateDigests(root, outputs, archiveMigrations"), "preflight no longer recomputes supersession digest inputs");

  const lockRevalidation = extractFunction(source, "assertPreparedTransactionPreflightStillCurrent");
  assert(!lockRevalidation.includes("expectedSourceConservation"), "lock revalidation passes expected source-conservation as actual state");
  assert(!lockRevalidation.includes("expectedSupersedesCurrentStateDigests"), "lock revalidation passes expected supersedes-current-state digests as actual state");
  assert(lockRevalidation.includes("excludeInFlightTransactionId: transaction.id"), "lock revalidation does not declare the current prepared transaction self-artifact boundary");

  const sourceConservation = extractFunction(source, "createSourceConservation");
  assert(sourceConservation.includes("excludeInFlightTransactionId"), "source conservation has no current transaction self-artifact boundary");
  assert(sourceConservation.includes("transaction-state"), "source conservation self-artifact boundary is not limited to transaction-state entries");
  console.log("ok: lock-time pre-replace preflight recomputes source conservation and supersession inputs, excluding only the current prepared transaction state");
}

async function checkPostLockPreReplaceDriftRollsBack() {
  const project = fresh("gate5-pre-replace-drift");
  materializeOfficialInstall("0.3.38", project);
  const legacyArchiveRel = "dev/session_log_archive/archive_001.md";
  write(path.join(project, legacyArchiveRel), "# Legacy archive\n\nMust not move before pre-replace revalidation passes.\n");
  const integrationRel = "dev/rules/integrations.md";
  const integrationPath = path.join(project, integrationRel);
  const originalBytes = readBuffer(integrationPath);
  const candidateBytes = readBuffer(path.join(candidateRoot, "packs", "integrations.md"));
  const canonicalArchivePath = path.join(project, "dev", "SESSION_LOG_archive");
  const canonicalArchiveBefore = existsSync(canonicalArchivePath) ? treeSnapshot(canonicalArchivePath) : null;
  const driftBytes = Buffer.concat([
    originalBytes,
    Buffer.from("\n## External Pre-Replace Drift\n\nThis write landed after lock acquisition and before target replacement.\n", "utf8")
  ]);

  const result = cli(["upgrade", "--yes", "--root", project], "post-lock pre-replace drift rollback", {
    AGENT_HANDOFF_KIT_QA_MUTATE_BEFORE_LOCK_REVALIDATION: integrationRel,
    AGENT_HANDOFF_KIT_QA_MUTATE_BEFORE_LOCK_REVALIDATION_BASE64: driftBytes.toString("base64")
  });

  assert(result.status !== 0, `post-lock pre-replace drift unexpectedly succeeded: ${output(result)}`);
  assertNoSuccess(result, "post-lock pre-replace drift");
  assert(output(result).includes("transaction pre-replace preflight identity drifted under lock"), "post-lock pre-replace drift did not fail at the lock revalidation boundary");
  assert(output(result).includes("migration rolled back"), "post-lock pre-replace drift did not report truthful rollback");
  assert(readBuffer(integrationPath).equals(driftBytes), "post-lock pre-replace rollback overwrote the injected external bytes");
  assert(!readBuffer(integrationPath).equals(candidateBytes), "post-lock pre-replace rollback published the transaction candidate");
  assert(existsSync(path.join(project, legacyArchiveRel)), "post-lock pre-replace drift relocated the legacy archive before revalidation passed");
  assert(canonicalArchiveBefore
    ? sameTreeSnapshot(canonicalArchiveBefore, treeSnapshot(canonicalArchivePath))
    : !existsSync(canonicalArchivePath), "post-lock pre-replace drift changed the canonical archive before revalidation passed");
  assert(!existsSync(path.join(project, "dev", "governance_migrations", ".upgrade.lock")), "successful post-lock pre-replace rollback retained the transaction lock");

  const transaction = latestTransaction(project);
  assert(transaction.journal.state === "rolled-back", `post-lock pre-replace journal state was ${transaction.journal.state}, expected rolled-back`);
  assert(transaction.journal.entries.every((entry) => entry.committed === false), "post-lock pre-replace drift committed a journal entry");
  const integrationEntry = transaction.journal.entries.find((entry) => entry.targetRel === integrationRel);
  assert(integrationEntry?.beforeHash === sha(originalBytes) && integrationEntry.afterHash !== sha(driftBytes), "post-lock pre-replace journal did not retain the pre-injection input and transaction-owned candidate identity");
  assert((transaction.journal.archiveMigrations ?? []).every((migration) => migration.state === "prepared"), "post-lock pre-replace drift advanced archive relocation state");
  assert(transaction.report === null, "post-lock pre-replace drift wrote a migration success report");
  console.log("ok: post-lock pre-replace preflight drift rolls back the prepared journal, removes the lock, preserves injected external bytes, and performs zero archive relocation or target replacement");
}

async function checkNonRuntimeWholeStateDriftStops() {
  const project = fresh("gate5-whole-state-non-runtime-drift");
  materializeOfficialInstall("0.3.38", project);
  const targetRel = "dev/PROJECT_INDEX.md";
  const targetPath = path.join(project, targetRel);
  const driftBytes = Buffer.concat([
    readBuffer(path.join(candidateRoot, "runtime-core", "PROJECT_INDEX.md")),
    Buffer.from("\n<!-- externally changed after transaction preparation -->\n", "utf8")
  ]);
  const result = cli(["upgrade", "--yes", "--root", project], "whole-state non-runtime drift", {
    AGENT_HANDOFF_KIT_QA_MUTATE_AFTER_TRANSACTION_PREPARE: targetRel,
    AGENT_HANDOFF_KIT_QA_MUTATE_AFTER_TRANSACTION_PREPARE_BASE64: driftBytes.toString("base64")
  });

  assert(result.status !== 0, `non-runtime whole-state drift unexpectedly succeeded: ${output(result)}`);
  assertNoSuccess(result, "non-runtime whole-state drift");
  assert(readBuffer(targetPath).equals(driftBytes), "whole-state witness recovery overwrote non-runtime external bytes");
  const transaction = latestTransaction(project);
  const entry = transaction.journal.entries.find((candidate) => candidate.targetRel === targetRel);
  assert(entry && entry.afterHash !== sha(driftBytes), "whole-state drift target was not bound into the transaction witness");
  assert(existsSync(path.join(project, "dev", "governance_migrations", ".upgrade.lock")), "non-runtime whole-state drift did not retain the recovery lock");
  console.log("ok: non-runtime transaction bytes drift blocks the shared current-state witness before doctor/report/success");
}

async function checkExactRouteDriftStops() {
  const project = fresh("gate5-transaction-window-red");
  materializeOfficialInstall("0.3.38", project);
  const integrationRel = "dev/rules/integrations.md";
  const integrationPath = path.join(project, integrationRel);
  const originalBytes = readBuffer(integrationPath);
  const agents = read(path.join(project, "AGENTS.md"));
  const router = read(path.join(project, "dev", "RULE_PACKS.md"));
  assert(agents.includes("dev/RULE_PACKS.md"), "v0.3.38 fixture has no AGENTS -> RULE_PACKS formal route");
  assert(router.includes("dev/rules/integrations.md"), "v0.3.38 fixture has no RULE_PACKS -> integrations route");

  // Preserve every current Kit anchor so this is a real false-green probe,
  // not a malformed-file case that doctor already rejects. The appended
  // instruction changes the active integrations runtime bytes after the
  // transaction has prepared and committed its candidate state.
  const candidateBytes = readBuffer(path.join(candidateRoot, "packs", "integrations.md"));
  const driftBytes = Buffer.concat([
    candidateBytes,
    Buffer.from("\n## External Transaction-Window Rule\n\nUse this externally written rule instead of the accepted integrations content.\n", "utf8")
  ]);
  const result = cli(["upgrade", "--yes", "--root", project], "v0.3.38 transaction-window false-green red", {
    AGENT_HANDOFF_KIT_QA_MUTATE_AFTER_TRANSACTION_PREPARE: integrationRel,
    AGENT_HANDOFF_KIT_QA_MUTATE_AFTER_TRANSACTION_PREPARE_BASE64: driftBytes.toString("base64")
  });

  assert(result.status !== 0, `transaction-window drift unexpectedly succeeded: ${output(result)}`);
  assertNoSuccess(result, "transaction-window drift");
  assert(readBuffer(integrationPath).equals(driftBytes), "transaction-window drift bytes were overwritten or not injected");
  assert(!readBuffer(integrationPath).equals(originalBytes), "transaction-window drift fixture did not change the active integrations bytes");

  const transaction = latestTransaction(project);
  const integrationEntry = transaction.journal.entries.find((entry) => entry.targetRel === integrationRel);
  assert(integrationEntry, "transaction journal did not include the integrations target");
  assert(integrationEntry.afterHash !== sha(driftBytes), "journal unexpectedly accepted transaction-window drift bytes");
  const acceptedIntegration = transaction.journal.runtimeAcceptance?.entries.find((entry) => entry.targetRel === integrationRel);
  assert(acceptedIntegration?.disposition === "replace" && acceptedIntegration.conflictDecision === "exact-official-package-bytes", "exact integrations replacement was not included in the shared runtime acceptance");
  assert(existsSync(path.join(project, "dev", "governance_migrations", ".upgrade.lock")), "transaction-window drift did not retain the recovery lock");
  const recovery = cli(["upgrade", "--yes", "--root", project], "transaction-window drift recovery", {
    AGENT_HANDOFF_KIT_QA_RECOVER_ONLY: "1"
  });
  assert(recovery.status !== 0 && output(recovery).includes("third-state edits"), "transaction-window recovery overwrote the external integrations bytes instead of stopping");
  assert(readBuffer(integrationPath).equals(driftBytes), "transaction-window recovery changed external integrations bytes");
  console.log("ok: exact integrations transaction-window drift blocks doctor/report/success and retains external bytes plus recovery lock");
}

async function checkHeadedAppendixPreservesAndReadsBack() {
  const project = fresh("gate5-headed-appendix-green");
  materializeOfficialInstall("0.3.38", project);
  const integrationRel = "dev/rules/integrations.md";
  const integrationPath = path.join(project, integrationRel);
  const projectIndexBaseline = getOfficialBaseline({ version: "0.3.38", targetRel: "dev/PROJECT_INDEX.md", catalog, root: project });
  assert(projectIndexBaseline?.state === "present", "v0.3.38 catalog has no PROJECT_INDEX baseline");
  const projectIndexBefore = read(path.join(project, projectIndexRel));
  const headedBytes = Buffer.concat([
    readBuffer(integrationPath),
    Buffer.from("\n## Local Project Rules\n\nPreserve these user-authored headed appendix bytes exactly.\n", "utf8")
  ]);
  writeFileSync(integrationPath, headedBytes);

  const result = cli(["upgrade", "--yes", "--root", project], "v0.3.38 headed appendix first-item green");
  assert(result.status === 0, `headed appendix upgrade did not commit safe Kit updates: ${output(result)}`);
  assert(output(result).includes("migration committed") && output(result).includes("project health: passed"), "headed appendix green omitted the same-readback success state");
  assert(readBuffer(integrationPath).equals(headedBytes), "headed appendix upgrade changed original user bytes");
  assert(existsSync(path.join(project, "dev", "rules", "closeout.md")), "headed appendix preservation prevented an unrelated safe Kit update");
  assertProjectIndexMetadataTransition(project, projectIndexBefore, null);

  const transaction = latestTransaction(project);
  const accepted = transaction.journal.runtimeAcceptance?.entries.find((entry) => entry.targetRel === integrationRel);
  assert(accepted?.disposition === "preserve" && accepted.conflictDecision === "non-exact-package-bytes", "headed appendix was not recorded as a preserve decision");
  assert(accepted.accepted.sha256 === sha(headedBytes) && accepted.accepted.bytes === headedBytes.length, "headed appendix acceptance lost its raw-byte identity");
  assert(accepted.sourceWitness.sha256 === sha(headedBytes) && accepted.sourceWitness.bytes === headedBytes.length, "headed appendix original-byte witness changed during preservation");
  assert(accepted.activeReader.reader === "AGENTS.md" && accepted.activeReader.via === "dev/RULE_PACKS.md" && accepted.effectDecision === "preserve-unmodified-through-existing-rule-pack-route", "headed appendix acceptance omitted the active reader or effect decision");
  assertProjectIndexMetadataTransition(project, projectIndexBefore, transaction);
  assert(transaction.journal.runtimeAcceptanceReadback?.reader?.includes("AGENTS -> RULE_PACKS routes") && transaction.journal.runtimeAcceptanceReadback.reader.includes("direct RULE_PACKS entry"), "headed appendix success state did not use doctor runtime acceptance readback");
  const currentState = transaction.journal.currentStateWitness;
  assert(currentState?.currentStateDigest && currentState.runtimeAcceptance?.acceptanceDigest === transaction.journal.runtimeAcceptance.acceptanceDigest, "headed appendix did not bind runtime acceptance into one current-state witness");
  assert(currentState.entries.map((entry) => entry.targetRel).join("|") === transaction.journal.entries.map((entry) => entry.targetRel).join("|"), "current-state witness did not retain transaction entry order");
  assert(transaction.journal.currentStateReadback?.reader === "doctor shared current-state witness check" && transaction.journal.currentStateReadback.currentStateDigest === currentState.currentStateDigest, "headed appendix success state did not use the same fresh whole-witness readback");
  assert(transaction.report.includes("## Runtime Acceptance") && transaction.report.includes("## Shared Current-State Witness") && transaction.report.includes(currentState.currentStateDigest), "headed appendix report did not read the shared current-state identity");

  const doctor = cli(["doctor", "--root", project], "headed appendix ordinary doctor");
  assert(doctor.status === 0 && output(doctor).includes("runtime acceptance checks: 1") && output(doctor).includes("shared current-state witness: 1") && output(doctor).includes("status: passed"), "ordinary doctor did not reload the same headed-appendix acceptance state");
  await assertRejects(() => readFormalUserRules({ root: project }), "AGENTS.md must contain one formal user-rules entry", "legacy fixture unexpectedly claimed the unrelated fresh USER_RULES reader");
  assertNewerInactiveJournalCannotOverrideCurrentState(project, transaction);
  assertComponentSubstitutionCannotSplitWholeWitness(project, transaction);
  console.log("ok: headed appendix bytes remain unmodified while ordinary doctor/report/success reload one AGENTS -> RULE_PACKS preserve acceptance");
}

function assertNewerInactiveJournalCannotOverrideCurrentState(project, transaction) {
  const staleDirectory = path.join(path.dirname(transaction.directory), "old-journal-mtime-bumped");
  cpSync(transaction.directory, staleDirectory, { recursive: true });
  const staleJournalPath = path.join(staleDirectory, "transaction.json");
  const stale = JSON.parse(read(staleJournalPath));
  stale.id = path.basename(staleDirectory);
  stale.createdAt = "2000-01-01T00:00:00.000Z";
  for (const entry of stale.entries) {
    if (entry.backupRel) entry.backupRel = path.join("dev", "governance_migrations", stale.id, "backup", entry.targetRel);
  }
  const integrationRel = "dev/rules/integrations.md";
  const integrationEntry = stale.entries.find((entry) => entry.targetRel === integrationRel);
  assert(integrationEntry, "stale journal fixture has no integrations entry");
  const staleStage = path.join(staleDirectory, "stage", integrationRel);
  const staleBytes = Buffer.concat([readBuffer(staleStage), Buffer.from("\n## Stale Journal Only\n\nDo not select this old witness.\n", "utf8")]);
  writeFileSync(staleStage, staleBytes);
  integrationEntry.afterHash = sha(staleBytes);
  const staleAcceptance = stale.runtimeAcceptance.entries.find((entry) => entry.targetRel === integrationRel);
  assert(staleAcceptance, "stale journal fixture has no runtime acceptance entry");
  staleAcceptance.accepted = { sha256: sha(staleBytes), bytes: staleBytes.length };
  staleAcceptance.sourceWitness = { sha256: sha(staleBytes), bytes: staleBytes.length };
  recomputeRuntimeAcceptanceDigest(stale.runtimeAcceptance);
  stale.runtimeAcceptanceReadback = null;
  stale.currentStateReadback = null;
  stale.currentStateWitness = buildCurrentStateWitness(stale);
  writeFileSync(staleJournalPath, `${JSON.stringify(stale, null, 2)}\n`, "utf8");
  const future = new Date(Date.now() + 60_000);
  utimesSync(staleJournalPath, future, future);

  const doctor = cli(["doctor", "--root", project], "newer stale journal selection");
  assert(doctor.status !== 0, `ordinary doctor accepted a newer-mtime inactive journal: ${output(doctor)}`);
  assertNoSuccess(doctor, "newer stale journal selection");
  assert(output(doctor).includes("shared current-state witness is detached"), "ordinary doctor did not identify the detached newer stale journal");
  // The failure itself is the proof that a touched historical journal cannot
  // become an authority.  Mark this synthetic adversarial copy non-committed
  // before the next independent component-substitution probe uses the same
  // otherwise valid transaction.
  stale.state = "rolled-back";
  writeFileSync(staleJournalPath, `${JSON.stringify(stale, null, 2)}\n`, "utf8");
  console.log("ok: ordinary doctor fails closed instead of accepting a newer-mtime inactive journal");
}

function assertComponentSubstitutionCannotSplitWholeWitness(project, transaction) {
  const journalPath = path.join(transaction.directory, "transaction.json");
  const journal = JSON.parse(read(journalPath));
  const originalWholeDigest = journal.currentStateWitness?.currentStateDigest;
  assert(originalWholeDigest, "component substitution fixture has no whole current-state digest");
  journal.runtimeAcceptance.entries[0].priorityRelation = `${journal.runtimeAcceptance.entries[0].priorityRelation}; substituted component metadata`;
  recomputeRuntimeAcceptanceDigest(journal.runtimeAcceptance);
  assert(journal.runtimeAcceptance.acceptanceDigest !== journal.currentStateWitness.runtimeAcceptance.acceptanceDigest, "component substitution did not create a distinct valid component identity");
  writeFileSync(journalPath, `${JSON.stringify(journal, null, 2)}\n`, "utf8");

  const doctor = cli(["doctor", "--root", project], "whole witness component substitution");
  assert(doctor.status !== 0, `doctor accepted independently valid substituted component: ${output(doctor)}`);
  assertNoSuccess(doctor, "whole witness component substitution");
  assert(output(doctor).includes("shared current-state witness is detached"), "component substitution did not fail the whole current-state witness boundary");
  console.log("ok: independently valid substituted runtime component cannot split the whole current-state witness");
}

function recomputeRuntimeAcceptanceDigest(acceptance) {
  const body = { schemaVersion: acceptance.schemaVersion, entries: acceptance.entries };
  acceptance.acceptanceDigest = sha(Buffer.from(`${JSON.stringify(body)}\n`, "utf8"));
}

function buildCurrentStateWitness(journal) {
  const body = {
    schemaVersion: 1,
    transaction: { id: journal.id, command: journal.command, mode: journal.mode, attemptedVersion: journal.attemptedVersion },
    entries: journal.entries.map((entry) => ({
      targetRel: entry.targetRel,
      existed: entry.existed,
      beforeHash: entry.beforeHash,
      afterHash: entry.afterHash,
      backupRel: entry.backupRel
    })),
    formalUserRules: journal.formalUserRules ?? null,
    runtimeAcceptance: journal.runtimeAcceptance ?? null
  };
  return { ...body, currentStateDigest: sha(Buffer.from(`${JSON.stringify(body)}\n`, "utf8")) };
}

function assertNoSuccess(result, label) {
  const text = output(result);
  assert(!text.includes("migration committed") && !text.includes("project health: passed") && !text.includes("/\\_/\\"), `${label} printed a false success signal`);
}

function assertProjectIndexMetadataTransition(project, beforeText, transaction) {
  const afterText = read(path.join(project, projectIndexRel));
  assert(parseProjectIndexTemplateVersion(beforeText) === "0.3.38", "headed appendix PROJECT_INDEX did not start with the expected old Stack version");
  assert(parseProjectIndexTemplateVersion(afterText) === packageVersion, "headed appendix PROJECT_INDEX did not materialize the package Stack version");
  assert(afterText === materializeProjectIndexTemplateVersion(beforeText, packageVersion), "headed appendix PROJECT_INDEX changed bytes outside the shared Stack version-row materializer");
  if (!transaction) return;
  const entry = transaction.journal.entries.find((candidate) => candidate.targetRel === projectIndexRel);
  assert(entry?.beforeHash === sha(Buffer.from(beforeText, "utf8")) && entry.afterHash === sha(Buffer.from(afterText, "utf8")) && entry.beforeHash !== entry.afterHash, "PROJECT_INDEX transaction entry did not bind the version-row metadata transition");
  assert(entry.reason?.includes("unique real PROJECT_INDEX Stack template-version row"), "PROJECT_INDEX transaction entry did not disclose the narrow Stack version-row reason");
  assert(!transaction.journal.runtimeAcceptance?.entries.some((candidate) => candidate.targetRel === projectIndexRel), "PROJECT_INDEX metadata transition was falsely included in runtimeAcceptance preserve entries");
  assert(transaction.report?.includes(entry.afterHash) && transaction.report.includes(entry.reason), "PROJECT_INDEX metadata transition was not disclosed in the migration report");
}

function treeSnapshot(rootPath) {
  const files = [];
  walkTree(rootPath, rootPath, files);
  return new Map(files.map((relative) => [relative, sha(readBuffer(path.join(rootPath, relative)))]));
}

function walkTree(base, current, files) {
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) walkTree(base, absolute, files);
    else if (entry.isFile()) files.push(path.relative(base, absolute).replaceAll(path.sep, "/"));
  }
}

function sameTreeSnapshot(left, right) {
  return left.size === right.size && [...left].every(([key, value]) => right.get(key) === value);
}

function materializeOfficialInstall(version, project) {
  for (const { targetRel } of installedFileContracts) {
    const baseline = getOfficialBaseline({ version, targetRel, catalog, root: project });
    if (baseline?.state === "present") write(path.join(project, targetRel), baseline.text);
  }
}

function cli(args, label, env) {
  const result = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", ...args], {
    cwd: candidateRoot,
    encoding: "utf8",
    env: { ...process.env, ...env }
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
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs);
  assert(candidates.length === 1, "transaction-window fixture expected exactly one transaction");
  const directory = candidates[0];
  return {
    directory,
    journal: JSON.parse(read(path.join(directory, "transaction.json"))),
    report: existsSync(path.join(directory, "migration-report.md")) ? read(path.join(directory, "migration-report.md")) : null
  };
}

async function assertRejects(action, expected, label) {
  try {
    await action();
  } catch (error) {
    assert(String(error?.message ?? error).includes(expected), `${label}: unexpected rejection ${error?.message ?? error}`);
    return;
  }
  throw new Error(`${label}: expected rejection`);
}

function fresh(label) {
  const project = path.join(qaTmp, `ack-r034-${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  assert(!existsSync(project), `QA fixture already exists: ${project}`);
  mkdirSync(project, { recursive: true });
  return project;
}

function write(file, content) { mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, content, "utf8"); }
function read(file) { return readFileSync(file, "utf8"); }
function readBuffer(file) { return readFileSync(file); }
function sha(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function output(result) { return `${result.stdout ?? ""}\n${result.stderr ?? ""}`; }
function assert(condition, message) { if (!condition) throw new Error(message); }

function extractFunction(source, name) {
  const plainStart = source.indexOf(`function ${name}`);
  const asyncStart = source.indexOf(`async function ${name}`);
  const functionStart = plainStart >= 0 ? plainStart : asyncStart;
  assert(functionStart >= 0, `missing function ${name}`);
  const nextFunction = source.slice(functionStart + 1).search(/\n(?:async )?function /);
  return nextFunction >= 0
    ? source.slice(functionStart, functionStart + 1 + nextFunction)
    : source.slice(functionStart);
}
