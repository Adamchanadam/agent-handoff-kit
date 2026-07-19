#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir as systemTmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { POST_UPGRADE_STATE_COMPOSITIONS } from "./qa-assurance-manifest.mjs";
import { validateOfficialOriginCatalog } from "../bin/official-origin-catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const packageVersion = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version;
const previousVersion = previousPatch(packageVersion);
const legacyArchiveSourceVersion = "0.3.41";
const legacyArchiveAcceptedVersion = "0.3.45";
const qaTmp = process.env.AGENT_HANDOFF_KIT_QA_TMP || (process.platform === "win32" ? "C:\\tmp" : systemTmpdir());
const stateCompositionMatrix = POST_UPGRADE_STATE_COMPOSITIONS.map((scenario) => Object.freeze({ ...scenario, run: scenarioRunner(scenario.id) }));
const officialOriginCatalog = JSON.parse(readFileSync(path.join(root, "bin", "migration-baselines", "official-origin-catalog.json"), "utf8"));
validateOfficialOriginCatalog(officialOriginCatalog);
const publishedArtifactIdentityCache = new Map();

main();

function main() {
  const candidateBin = installPackedCandidate();
  for (const scenario of stateCompositionMatrix) {
    scenario.run(candidateBin);
    console.log(`ok: state composition ${scenario.id} (${scenario.baseline}; ${scenario.deliveryArtifact})`);
  }
  checkArchiveCanonicalCasing(candidateBin);
  console.log("");
  console.log("Agent Handoff Kit post-upgrade closeout finalize QA passed");
}

function scenarioRunner(id) {
  if (id === "adjacent-published-pristine-upgrade-closeout") return checkAdjacentPublishedUpgradeCanFinalizeCloseout;
  if (id === "v045-accepted-witness-legacy-archive-upgrade-closeout") return checkPublishedV045LegacyArchiveMigration;
  throw new Error(`no state-composition runner registered for ${id}`);
}

function checkAdjacentPublishedUpgradeCanFinalizeCloseout(candidateBin) {
  const prefix = fresh(`prev-${previousVersion}-prefix`);
  const project = fresh(`prev-${previousVersion}-project`);
  npm(["install", "--prefix", prefix, `@adamchanadam/agent-handoff-kit@${previousVersion}`], `install previous published v${previousVersion}`);
  const previousBin = path.join(prefix, "node_modules", "@adamchanadam", "agent-handoff-kit", "bin", "agent-handoff-kit.mjs");
  assert(existsSync(previousBin), "previous published CLI did not install");

  run(process.execPath, [previousBin, "init", "--yes", "--root", project], `v${previousVersion} init`);
  const upgrade = cli(candidateBin, ["upgrade", "--yes", "--root", project], `v${previousVersion} to packed v${packageVersion} upgrade`);
  assert(output(upgrade).includes("migration committed") || output(upgrade).includes("accepted-current-state"), "adjacent upgrade did not reach a committed or accepted state");
  const doctor = cli(candidateBin, ["doctor", "--root", project], "doctor after packed adjacent upgrade");
  assert(output(doctor).includes("status: passed"), "doctor did not pass immediately after adjacent upgrade");

  simulateCloseout(project);
  const blocked = cli(candidateBin, ["doctor", "--root", project], "doctor after normal closeout before finalize", { allowFailure: true });
  assert(blocked.status !== 0 && output(blocked).includes("unbound success state"), "normal post-upgrade closeout should be blocked before finalize");

  const finalized = cli(candidateBin, ["finalize-closeout", "--root", project], "finalize post-upgrade closeout");
  assert(output(finalized).includes("closeout finalized"), "finalize-closeout did not report the finalized closeout witness");
  const finalDoctor = cli(candidateBin, ["doctor", "--root", project], "doctor after closeout finalize");
  assert(output(finalDoctor).includes("status: passed"), "doctor did not pass after closeout finalize");
  const card = cli(candidateBin, ["closeout-status", "--root", project], "closeout-status after closeout finalize");
  assert(output(card).includes("status: complete"), "closeout-status did not accept the finalized closeout");

  const journalCount = countMigrationJournals(project);
  const secondFinalize = cli(candidateBin, ["finalize-closeout", "--root", project], "idempotent finalize post-upgrade closeout");
  assert(output(secondFinalize).includes("already matches"), "second finalize-closeout should be a no-op when bytes already match");
  assert(countMigrationJournals(project) === journalCount, "second finalize-closeout created a duplicate journal");
  const secondDoctor = cli(candidateBin, ["doctor", "--root", project], "doctor after idempotent closeout finalize");
  assert(output(secondDoctor).includes("status: passed"), "doctor did not pass after idempotent finalize");

  mkdirSync(path.join(project, "docs"), { recursive: true });
  writeFileSync(path.join(project, "docs", "unexpected-note.md"), "# Unexpected note\n", "utf8");
  const rejectedNewFile = cli(candidateBin, ["finalize-closeout", "--root", project], "finalize with new non-closeout file", { allowFailure: true });
  assert(rejectedNewFile.status !== 0 && output(rejectedNewFile).includes("non-closeout drift"), "finalize-closeout accepted a new non-closeout file");

  writeFileSync(path.join(project, "dev", "rules", "safety.md"), `${read(path.join(project, "dev", "rules", "safety.md"))}\n\nUnexpected non-closeout drift.\n`, "utf8");
  const rejectedRule = cli(candidateBin, ["finalize-closeout", "--root", project], "finalize with rule-pack drift", { allowFailure: true });
  assert(rejectedRule.status !== 0 && output(rejectedRule).includes("non-closeout drift"), "finalize-closeout accepted rule-pack drift");
  console.log("ok: adjacent published upgrade allows only explicit post-upgrade closeout finalize");
}

function checkPublishedV045LegacyArchiveMigration(candidateBin) {
  const project = createPublishedLegacyArchiveProject("legacy-accepted-witness");
  assertPublishedLegacyArchiveAcceptedWitness(project);

  const dryRun = cli(candidateBin, ["upgrade", "--dry-run", "--root", project], "legacy archive upgrade dry-run");
  assert(output(dryRun).includes("conflict: 0"), "legacy archive upgrade dry-run should remain a conflict-free preview");
  assert(archiveDirectoryNames(project).join(",") === "session_log_archive", "dry-run changed legacy archive casing");
  assertPublishedLegacyArchiveAcceptedWitness(project);

  const upgrade = cli(candidateBin, ["upgrade", "--yes", "--root", project], "v0.3.45 legacy archive upgrade");
  assert(output(upgrade).includes("migration committed"), "legacy archive upgrade did not commit a canonical casing migration");
  assert(archiveDirectoryNames(project).join(",") === "SESSION_LOG_archive", "legacy archive casing was not canonicalized by the committed upgrade");
  assert(existsSync(path.join(project, "dev", "SESSION_LOG_archive", "INDEX.md")), "canonical archive contents were not retained");
  assertLegacyArchiveNestedTree(project, "SESSION_LOG_archive");

  const doctor = cli(candidateBin, ["doctor", "--root", project], "doctor after legacy archive upgrade");
  assert(output(doctor).includes("status: passed"), "doctor did not pass after legacy archive migration");

  const journalCount = countMigrationJournals(project);
  const repeat = cli(candidateBin, ["upgrade", "--yes", "--root", project], "legacy archive idempotent upgrade");
  assert(!output(repeat).includes("migration committed"), "idempotent legacy archive upgrade created a new migration");
  assert(countMigrationJournals(project) === journalCount, "idempotent legacy archive upgrade created a duplicate journal");
  const repeatDoctor = cli(candidateBin, ["doctor", "--root", project], "doctor after idempotent legacy archive upgrade");
  assert(output(repeatDoctor).includes("status: passed"), "doctor did not pass after idempotent legacy archive upgrade");

  simulateCloseout(project);
  const blocked = cli(candidateBin, ["doctor", "--root", project], "doctor after legacy archive closeout before finalize", { allowFailure: true });
  assert(blocked.status !== 0 && output(blocked).includes("unbound success state"), "legacy archive path did not retain the normal pre-finalize closeout boundary");
  const finalized = cli(candidateBin, ["finalize-closeout", "--root", project], "finalize legacy archive closeout");
  assert(output(finalized).includes("closeout finalized"), "legacy archive path could not finalize normal closeout");
  const finalDoctor = cli(candidateBin, ["doctor", "--root", project], "doctor after legacy archive closeout finalize");
  assert(output(finalDoctor).includes("status: passed"), "doctor did not pass after legacy archive closeout finalize");

  checkLegacyArchiveRollbackAndRetry(candidateBin);
  checkLegacyArchiveInterruptedRecoveryAndRetry(candidateBin);
  checkLegacyArchiveRelocateCrashRecoveryAndRetry(candidateBin);
  checkLegacyArchiveMaterializeCrashRecoveryAndRetry(candidateBin);
}

function checkLegacyArchiveRollbackAndRetry(candidateBin) {
  const project = createPublishedLegacyArchiveProject("legacy-accepted-witness-rollback");
  assertPublishedLegacyArchiveAcceptedWitness(project);
  const expected = snapshotArchiveTree(project, "session_log_archive");
  const failed = cli(candidateBin, ["upgrade", "--yes", "--root", project], "legacy archive materialization rollback", {
    allowFailure: true,
    env: { AGENT_HANDOFF_KIT_QA_FAIL_AFTER_ARCHIVE_MATERIALIZE: "1" }
  });
  assert(failed.status !== 0, "archive materialization fault did not fail the transaction");
  assert(archiveDirectoryNames(project).join(",") === "session_log_archive", "rollback did not restore legacy archive casing");
  assertSameArchiveTree(project, "session_log_archive", expected, "rollback did not restore legacy archive tree");
  assert(!existsSync(path.join(project, "dev", "governance_migrations", ".upgrade.lock")), "successful archive rollback retained the recovery lock");

  const retry = cli(candidateBin, ["upgrade", "--yes", "--root", project], "legacy archive retry after rollback");
  assert(output(retry).includes("migration committed"), "archive retry after rollback did not commit");
  assert(archiveDirectoryNames(project).join(",") === "SESSION_LOG_archive", "archive retry after rollback did not canonicalize casing");
  const doctor = cli(candidateBin, ["doctor", "--root", project], "doctor after archive rollback retry");
  assert(output(doctor).includes("status: passed"), "doctor did not pass after archive rollback retry");
  console.log("ok: archive materialization failure rolls back exact legacy bytes before retry");
}

function checkLegacyArchiveInterruptedRecoveryAndRetry(candidateBin) {
  const project = createPublishedLegacyArchiveProject("legacy-accepted-witness-interrupt");
  assertPublishedLegacyArchiveAcceptedWitness(project);
  const interrupted = cli(candidateBin, ["upgrade", "--yes", "--root", project], "legacy archive interruption after staging", {
    allowFailure: true,
    env: { AGENT_HANDOFF_KIT_QA_INTERRUPT_AFTER_ARCHIVE_STAGE: "1" }
  });
  assert(interrupted.status !== 0, "archive staging interruption did not stop the process");
  assert(existsSync(path.join(project, "dev", "governance_migrations", ".upgrade.lock")), "interrupted archive transaction did not retain the recovery lock");
  assert(archiveDirectoryNames(project).length === 0, "interrupted archive transaction did not isolate the source in transaction backup");

  const retry = cli(candidateBin, ["upgrade", "--yes", "--root", project], "legacy archive recovery retry");
  assert(output(retry).includes("recovered interrupted upgrade"), "retry did not recover the interrupted archive transaction first");
  assert(output(retry).includes("migration committed"), "archive recovery retry did not commit");
  assert(archiveDirectoryNames(project).join(",") === "SESSION_LOG_archive", "archive recovery retry did not canonicalize casing");
  assert(!existsSync(path.join(project, "dev", "governance_migrations", ".upgrade.lock")), "archive recovery retry retained the recovery lock");
  const doctor = cli(candidateBin, ["doctor", "--root", project], "doctor after interrupted archive recovery retry");
  assert(output(doctor).includes("status: passed"), "doctor did not pass after interrupted archive recovery retry");
  console.log("ok: archive staging interruption recovers and retries through the same transaction boundary");
}

function checkLegacyArchiveRelocateCrashRecoveryAndRetry(candidateBin) {
  const project = createPublishedLegacyArchiveProject("legacy-accepted-witness-relocate-crash");
  assertPublishedLegacyArchiveAcceptedWitness(project);
  const interrupted = cli(candidateBin, ["upgrade", "--yes", "--root", project], "legacy archive interruption after relocation before staged journal", {
    allowFailure: true,
    env: { AGENT_HANDOFF_KIT_QA_INTERRUPT_AFTER_ARCHIVE_RELOCATE_BEFORE_STAGE: "1" }
  });
  assert(interrupted.status !== 0, "archive pre-staged relocation interruption did not stop the process");
  assert(existsSync(path.join(project, "dev", "governance_migrations", ".upgrade.lock")), "pre-staged relocation interruption did not retain the recovery lock");
  assert(archiveDirectoryNames(project).length === 0, "pre-staged relocation interruption did not isolate the source in transaction backup");

  const retry = cli(candidateBin, ["upgrade", "--yes", "--root", project], "legacy archive pre-staged relocation recovery retry");
  assert(output(retry).includes("recovered interrupted upgrade"), "retry did not recover the pre-staged relocation transaction first");
  assert(output(retry).includes("migration committed"), "pre-staged relocation recovery retry did not commit");
  assert(archiveDirectoryNames(project).join(",") === "SESSION_LOG_archive", "pre-staged relocation recovery retry did not canonicalize casing");
  assertLegacyArchiveNestedTree(project, "SESSION_LOG_archive");
  const doctor = cli(candidateBin, ["doctor", "--root", project], "doctor after pre-staged relocation recovery retry");
  assert(output(doctor).includes("status: passed"), "doctor did not pass after pre-staged relocation recovery retry");
  console.log("ok: archive pre-staged relocation interruption recovers and retries");
}

function checkLegacyArchiveMaterializeCrashRecoveryAndRetry(candidateBin) {
  const project = createPublishedLegacyArchiveProject("legacy-accepted-witness-materialize-crash");
  assertPublishedLegacyArchiveAcceptedWitness(project);
  const interrupted = cli(candidateBin, ["upgrade", "--yes", "--root", project], "legacy archive interruption after materialization before journal", {
    allowFailure: true,
    env: { AGENT_HANDOFF_KIT_QA_INTERRUPT_AFTER_ARCHIVE_MATERIALIZE_BEFORE_JOURNAL: "1" }
  });
  assert(interrupted.status !== 0, "archive pre-materialized journal interruption did not stop the process");
  assert(existsSync(path.join(project, "dev", "governance_migrations", ".upgrade.lock")), "pre-materialized journal interruption did not retain the recovery lock");
  assert(archiveDirectoryNames(project).join(",") === "SESSION_LOG_archive", "pre-materialized journal interruption should expose only canonical archive before recovery");

  const retry = cli(candidateBin, ["upgrade", "--yes", "--root", project], "legacy archive pre-materialized recovery retry");
  assert(output(retry).includes("recovered interrupted upgrade"), "retry did not recover the pre-materialized transaction first");
  assert(output(retry).includes("migration committed"), "pre-materialized recovery retry did not commit");
  assert(archiveDirectoryNames(project).join(",") === "SESSION_LOG_archive", "pre-materialized recovery retry did not canonicalize casing");
  assertLegacyArchiveNestedTree(project, "SESSION_LOG_archive");
  const doctor = cli(candidateBin, ["doctor", "--root", project], "doctor after pre-materialized recovery retry");
  assert(output(doctor).includes("status: passed"), "doctor did not pass after pre-materialized recovery retry");
  console.log("ok: archive pre-materialized interruption recovers and retries");
}

function createPublishedLegacyArchiveProject(label) {
  const project = fresh(`${label}-project`);
  const sourceBin = installPublishedBin(legacyArchiveSourceVersion, `${label}-source`);
  const acceptedBin = installPublishedBin(legacyArchiveAcceptedVersion, `${label}-accepted`);
  run(process.execPath, [sourceBin, "init", "--yes", "--root", project], `v${legacyArchiveSourceVersion} init for ${label}`);
  const legacy = path.join(project, "dev", "session_log_archive");
  mkdirSync(legacy, { recursive: true });
  mkdirSync(path.join(legacy, "nested", "empty"), { recursive: true });
  writeFileSync(path.join(legacy, "INDEX.md"), "# Legacy Archive Index\n", "utf8");
  writeFileSync(path.join(legacy, "archive_001_2026-07-19_to_2026-07-19.md"), "# Legacy archive batch\n", "utf8");
  writeFileSync(path.join(legacy, "nested", "notes.md"), "# Nested legacy archive note\n", "utf8");
  const accepted = run(process.execPath, [acceptedBin, "upgrade", "--yes", "--root", project], `v${legacyArchiveSourceVersion} to v${legacyArchiveAcceptedVersion} accepted legacy archive upgrade for ${label}`);
  assert(output(accepted).includes("migration committed"), `published v${legacyArchiveAcceptedVersion} did not commit the accepted legacy archive witness for ${label}`);
  const doctor = run(process.execPath, [acceptedBin, "doctor", "--root", project], `v${legacyArchiveAcceptedVersion} doctor for accepted legacy archive ${label}`);
  assert(output(doctor).includes("status: passed"), `published v${legacyArchiveAcceptedVersion} doctor did not accept the legacy archive witness for ${label}`);
  assert(archiveDirectoryNames(project).join(",") === "session_log_archive", `published v${legacyArchiveAcceptedVersion} changed legacy archive casing for ${label}`);
  assertPublishedLegacyArchiveAcceptedWitness(project);
  return project;
}

function installPublishedBin(version, label) {
  assertPublishedArtifactIdentity(version);
  const prefix = fresh(`${label}-${version}-prefix`);
  npm(["install", "--prefix", prefix, `@adamchanadam/agent-handoff-kit@${version}`], `install published v${version} for ${label}`);
  const packageJsonPath = path.join(prefix, "node_modules", "@adamchanadam", "agent-handoff-kit", "package.json");
  assert(existsSync(packageJsonPath), `published v${version} package.json did not install for ${label}`);
  const installed = JSON.parse(read(packageJsonPath));
  assert(installed.version === version, `published v${version} installed identity mismatch for ${label}`);
  const bin = path.join(prefix, "node_modules", "@adamchanadam", "agent-handoff-kit", "bin", "agent-handoff-kit.mjs");
  assert(existsSync(bin), `published v${version} CLI did not install for ${label}`);
  return bin;
}

function assertPublishedArtifactIdentity(version) {
  if (publishedArtifactIdentityCache.has(version)) return publishedArtifactIdentityCache.get(version);
  const catalogNpm = officialOriginCatalog.releases?.[version]?.source?.npm;
  assert(catalogNpm?.spec === `@adamchanadam/agent-handoff-kit@${version}`, `official catalog has no pinned npm spec for v${version}`);
  assert(/^[a-f0-9]{40}$/.test(catalogNpm.shasum), `official catalog has no pinned shasum for v${version}`);
  assert(typeof catalogNpm.integrity === "string" && catalogNpm.integrity.startsWith("sha512-"), `official catalog has no pinned integrity for v${version}`);
  const viewed = npm(["view", `@adamchanadam/agent-handoff-kit@${version}`, "version", "dist.shasum", "dist.integrity", "--json"], `npm identity readback v${version}`);
  const parsed = JSON.parse(viewed.stdout);
  assert(parsed.version === version, `npm readback version mismatch for v${version}`);
  assert((parsed.dist?.shasum ?? parsed["dist.shasum"]) === catalogNpm.shasum, `npm readback shasum differs from official catalog for v${version}`);
  assert((parsed.dist?.integrity ?? parsed["dist.integrity"]) === catalogNpm.integrity, `npm readback integrity differs from official catalog for v${version}`);
  publishedArtifactIdentityCache.set(version, catalogNpm);
  return catalogNpm;
}

function assertPublishedLegacyArchiveAcceptedWitness(project) {
  const witness = findCurrentStateWitness(project, legacyArchiveAcceptedVersion);
  assert(witness, `project does not contain a committed v${legacyArchiveAcceptedVersion} current-state witness`);
  assert(witness.transaction?.command === "upgrade", "legacy archive accepted witness was not created by upgrade");
  assert(witness.schemaVersion >= 2, "legacy archive accepted witness does not include source conservation");
  assert(archiveDirectoryNames(project).join(",") === "session_log_archive", "accepted fixture is not in legacy archive casing before candidate upgrade");
  const legacyEntry = (witness.sourceConservation?.entries ?? []).find((entry) => entry.sourcePath === "dev/session_log_archive/INDEX.md");
  assert(legacyEntry, "v0.3.45 accepted witness does not bind dev/session_log_archive/INDEX.md");
  assert((legacyEntry.classifications ?? []).includes("legacy-session-log-archive"), "legacy archive witness lacks legacy-session-log-archive provenance");
  assert(legacyEntry.accepted?.sha256 === legacyEntry.sourceWitness?.sha256 && legacyEntry.accepted?.bytes === legacyEntry.sourceWitness?.bytes, "legacy archive witness is not byte-stable");
  const bytes = read(path.join(project, "dev", "session_log_archive", "INDEX.md"));
  assert(Buffer.byteLength(bytes) === legacyEntry.accepted.bytes, "legacy archive witness byte count differs from project bytes");
  assert(sha256(bytes) === legacyEntry.accepted.sha256, "legacy archive witness hash differs from project bytes");
  assertLegacyArchiveNestedTree(project, "session_log_archive");
  for (const sourcePath of [
    "dev/session_log_archive/archive_001_2026-07-19_to_2026-07-19.md",
    "dev/session_log_archive/nested/notes.md"
  ]) {
    const entry = (witness.sourceConservation?.entries ?? []).find((item) => item.sourcePath === sourcePath);
    assert(entry, `v0.3.45 accepted witness does not bind ${sourcePath}`);
    const fileBytes = read(path.join(project, ...sourcePath.split("/")));
    assert(Buffer.byteLength(fileBytes) === entry.accepted.bytes, `${sourcePath} witness byte count differs from project bytes`);
    assert(sha256(fileBytes) === entry.accepted.sha256, `${sourcePath} witness hash differs from project bytes`);
  }
}

function findCurrentStateWitness(project, version) {
  const migrations = path.join(project, "dev", "governance_migrations");
  return readdirSync(migrations, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(migrations, entry.name, "transaction.json"))
    .filter((file) => existsSync(file))
    .map((file) => JSON.parse(read(file)))
    .filter((journal) => journal.state === "committed" && journal.currentStateWitness?.transaction?.attemptedVersion === version)
    .map((journal) => journal.currentStateWitness)
    .at(-1) ?? null;
}

function archiveDirectoryNames(project) {
  return readdirSync(path.join(project, "dev"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.toLowerCase() === "session_log_archive")
    .map((entry) => entry.name)
    .sort();
}

function assertLegacyArchiveNestedTree(project, name) {
  assert(existsSync(path.join(project, "dev", name, "INDEX.md")), `${name} missing INDEX.md`);
  assert(existsSync(path.join(project, "dev", name, "archive_001_2026-07-19_to_2026-07-19.md")), `${name} missing archive batch file`);
  assert(existsSync(path.join(project, "dev", name, "nested", "notes.md")), `${name} missing nested notes`);
  assert(existsSync(path.join(project, "dev", name, "nested", "empty")), `${name} missing nested empty directory`);
}

function snapshotArchiveTree(project, name) {
  const archive = path.join(project, "dev", name);
  const files = {};
  const directories = [];
  function visit(current, relative) {
    for (const entry of readdirSync(current, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
      const child = path.join(current, entry.name);
      if (entry.isDirectory()) {
        directories.push(childRelative);
        visit(child, childRelative);
      } else if (entry.isFile()) {
        files[childRelative] = sha256(read(child));
      }
    }
  }
  visit(archive, "");
  return { directories: directories.sort(), files };
}

function assertSameArchiveTree(project, name, expected, message) {
  const actual = snapshotArchiveTree(project, name);
  assert(JSON.stringify(actual) === JSON.stringify(expected), message);
}

function checkArchiveCanonicalCasing(candidateBin) {
  const project = fresh("archive-casing");
  cli(candidateBin, ["init", "--yes", "--root", project], "archive casing init");
  const canonical = path.join(project, "dev", "SESSION_LOG_archive");
  mkdirSync(canonical, { recursive: true });
  writeFileSync(path.join(canonical, "INDEX.md"), "# Archive Index\n", "utf8");
  const doctor = cli(candidateBin, ["doctor", "--root", project], "archive casing canonical doctor");
  assert(output(doctor).includes("status: passed"), "canonical SESSION_LOG_archive casing should pass doctor");

  const legacyProject = fresh("archive-legacy-casing");
  cli(candidateBin, ["init", "--yes", "--root", legacyProject], "archive legacy casing init");
  const legacy = path.join(legacyProject, "dev", "session_log_archive");
  mkdirSync(legacy, { recursive: true });
  writeFileSync(path.join(legacy, "INDEX.md"), "# Legacy Archive Index\n", "utf8");
  const rejected = cli(candidateBin, ["doctor", "--root", legacyProject], "archive legacy casing doctor", { allowFailure: true });
  assert(rejected.status !== 0 && /SESSION_LOG_archive|session_log_archive|casing/i.test(output(rejected)), "doctor accepted legacy archive casing");
  console.log("ok: SESSION_LOG_archive canonical casing is enforced");
}

function simulateCloseout(project) {
  const handoffPath = path.join(project, "dev", "SESSION_HANDOFF.md");
  const logPath = path.join(project, "dev", "SESSION_LOG.md");
  let handoff = read(handoffPath)
    .replace("Last Updated: TBD", "Last Updated: 2026-07-19 12:00:00 +00:00")
    .replaceAll("<absolute project root>", project)
    .replaceAll("TBD", "post-upgrade closeout fixture")
    .replace("1. post-upgrade closeout fixture", "1. Completed adjacent upgrade and closeout finalize fixture.")
    .replace("1. post-upgrade closeout fixture", "1. follow-up scope - continue ordinary product work only when requested.")
    .replace("1. post-upgrade closeout fixture", "1. none")
    .replace("- Checks run this session: post-upgrade closeout fixture", "- Checks run this session: adjacent upgrade doctor passed before closeout.")
    .replace("- Checks not run and why: post-upgrade closeout fixture", "- Checks not run and why: none.")
    .replace("Recommended next step: post-upgrade closeout fixture - reason: post-upgrade closeout fixture", "Recommended next step: Start the next session from the opening message - reason: this verifies post-upgrade handoff continuity.")
    .replace("Recommended next step: post-upgrade closeout fixture — reason: post-upgrade closeout fixture", "Recommended next step: Start the next session from the opening message — reason: this verifies post-upgrade handoff continuity.")
    .replace("- Stale snapshots left in this handoff: post-upgrade closeout fixture", "- Stale snapshots left in this handoff: no")
    .replace("- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: post-upgrade closeout fixture", "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: yes")
    .replace("- Closeout outcome: not_started - full closeout has not yet been assessed.", "- Closeout outcome: complete - full closeout completed for the post-upgrade fixture.")
    .replace("- Closeout outcome: not_started — full closeout has not yet been assessed.", "- Closeout outcome: complete — full closeout completed for the post-upgrade fixture.")
    .replace("- Project-required persistence: not_assessed - state whether this project's required Git or other persistence completed, is not required, or is blocked.", "- Project-required persistence: not_required - fixture has no project-required external persistence.")
    .replace("- Project-required persistence: not_assessed — state whether this project's required Git or other persistence completed, is not required, or is blocked.", "- Project-required persistence: not_required — fixture has no project-required external persistence.")
    .replace("- Recommended next step is explicit and reasoned: post-upgrade closeout fixture", "- Recommended next step is explicit and reasoned: yes")
    .replace("- Opening message matches current state: post-upgrade closeout fixture", "- Opening message matches current state: yes")
    .replace("- Next AI can continue from `AGENTS.md`, this handoff, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history: post-upgrade closeout fixture", "- Next AI can continue from `AGENTS.md`, this handoff, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history: yes");
  handoff = handoff.replace("Work in post-upgrade closeout fixture.", `Work in ${project}.`);
  handoff = ensureCloseoutStateFields(handoff);
  writeFileSync(handoffPath, handoff, "utf8");

  const opening = extractOpeningMessage(handoff);
  writeFileSync(path.join(project, "START_NEXT_SESSION_PROMPT.txt"), `${opening}\n`, "utf8");
  writeFileSync(path.join(project, "dev", "DOC_SYNC_REGISTRY.md"), `${read(path.join(project, "dev", "DOC_SYNC_REGISTRY.md"))}\n\n<!-- post-upgrade closeout fixture sync check -->\n`, "utf8");
  writeFileSync(path.join(project, "dev", "PROJECT_DECISIONS.md"), `${read(path.join(project, "dev", "PROJECT_DECISIONS.md"))}\n\n<!-- post-upgrade closeout fixture decision check -->\n`, "utf8");
  const archive = path.join(project, "dev", "SESSION_LOG_archive");
  mkdirSync(archive, { recursive: true });
  writeFileSync(path.join(archive, "INDEX.md"), "# Archive Index\n\n- archive_001_2026-07-19_to_2026-07-19.md\n", "utf8");
  writeFileSync(path.join(archive, "archive_001_2026-07-19_to_2026-07-19.md"), "# Archived closeout fixture\n", "utf8");
  writeFileSync(logPath, [
    "## 2026-07-19 - Post-upgrade closeout finalize fixture",
    "",
    "- Summary: Simulated normal closeout after an adjacent published upgrade.",
    "- Changed: dev/SESSION_HANDOFF.md, dev/SESSION_LOG.md, START_NEXT_SESSION_PROMPT.txt",
    "- QC: doctor passed before closeout; finalize-closeout is expected to bind the legal state update.",
    "",
    read(logPath)
  ].join("\n"), "utf8");
}

function ensureCloseoutStateFields(handoff) {
  if (handoff.includes("ack:field:closeout-outcome") && handoff.includes("ack:field:project-required-persistence")) return handoff;
  const fieldBlock = [
    "<!-- ack:field:closeout-outcome -->",
    "- Closeout outcome: complete - full closeout completed for the post-upgrade fixture.",
    "<!-- ack:field:project-required-persistence -->",
    "- Project-required persistence: not_required - fixture has no project-required external persistence."
  ].join("\n");
  if (handoff.includes("## State Reconciliation Check")) {
    return handoff.replace("## State Reconciliation Check", `## State Reconciliation Check\n\n${fieldBlock}`);
  }
  const openingMarker = "<!-- ack:section:next-session-opening-message -->";
  if (handoff.includes(openingMarker)) {
    return handoff.replace(openingMarker, `## State Reconciliation Check\n\n${fieldBlock}\n\n${openingMarker}`);
  }
  return `${handoff.trimEnd()}\n\n## State Reconciliation Check\n\n${fieldBlock}\n`;
}

function extractOpeningMessage(handoff) {
  const match = /```text\r?\n([\s\S]*?)\r?\n```/m.exec(handoff);
  assert(match, "handoff opening message block missing");
  return match[1];
}

function previousPatch(version) {
  const parts = version.split(".").map(Number);
  assert(parts.length === 3 && parts.every(Number.isInteger) && parts[2] > 0, `cannot derive previous patch from ${version}`);
  parts[2] -= 1;
  return parts.join(".");
}

function countMigrationJournals(project) {
  return readdirSync(path.join(project, "dev", "governance_migrations"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(path.join(project, "dev", "governance_migrations", entry.name, "transaction.json")))
    .length;
}

function fresh(label) {
  const target = path.join(qaTmp, `ack-closeout-finalize-${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(target, { recursive: true });
  return target;
}

function installPackedCandidate() {
  const packageRoot = fresh("candidate-package");
  const packDir = path.join(packageRoot, "pack");
  const prefix = path.join(packageRoot, "prefix");
  mkdirSync(packDir, { recursive: true });
  mkdirSync(prefix, { recursive: true });
  npm(["pack", "--pack-destination", packDir, "--json"], "pack candidate for state composition");
  const tarball = readdirSync(packDir).find((name) => name.endsWith(".tgz"));
  assert(tarball, "packed candidate tarball is missing");
  npm(["install", "--prefix", prefix, path.join(packDir, tarball)], "install packed candidate for state composition");
  const bin = path.join(prefix, "node_modules", "@adamchanadam", "agent-handoff-kit", "bin", "agent-handoff-kit.mjs");
  assert(existsSync(bin), "packed candidate CLI is missing");
  return bin;
}

function npm(args, label) {
  const npmCli = process.env.npm_execpath?.endsWith(".js")
    ? process.env.npm_execpath
    : path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
  assert(existsSync(npmCli), "cannot locate npm-cli.js for adjacent published artifact install");
  return run(process.execPath, [npmCli, ...args], label, {
    env: {
      ...process.env,
      NPM_CONFIG_UPDATE_NOTIFIER: "false",
      NPM_CONFIG_CACHE: path.join(qaTmp, "agent-handoff-kit-npm-cache")
    }
  });
}

function cli(candidateBin, args, label, options = {}) {
  return run(process.execPath, [candidateBin, ...args], label, options);
}

function run(command, args, label, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    input: options.input,
    env: { ...process.env, AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "1", ...(options.env ?? {}) }
  });
  if (!options.allowFailure && (result.error || result.status !== 0)) throw new Error(`${label} failed\n${output(result)}`);
  return result;
}

function read(file) { return readFileSync(file, "utf8"); }
function output(result) { return `${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`; }
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function assert(condition, message) { if (!condition) throw new Error(message); }
