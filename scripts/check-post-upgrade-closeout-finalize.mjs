#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir as systemTmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const packageVersion = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version;
const previousVersion = previousPatch(packageVersion);
const qaTmp = process.env.AGENT_HANDOFF_KIT_QA_TMP || (process.platform === "win32" ? "C:\\tmp" : systemTmpdir());

main();

function main() {
  checkAdjacentPublishedUpgradeCanFinalizeCloseout();
  checkArchiveCanonicalCasing();
  console.log("");
  console.log("Agent Handoff Kit post-upgrade closeout finalize QA passed");
}

function checkAdjacentPublishedUpgradeCanFinalizeCloseout() {
  const prefix = fresh(`prev-${previousVersion}-prefix`);
  const project = fresh(`prev-${previousVersion}-project`);
  npm(["install", "--prefix", prefix, `@adamchanadam/agent-handoff-kit@${previousVersion}`], `install previous published v${previousVersion}`);
  const previousBin = path.join(prefix, "node_modules", "@adamchanadam", "agent-handoff-kit", "bin", "agent-handoff-kit.mjs");
  assert(existsSync(previousBin), "previous published CLI did not install");

  run(process.execPath, [previousBin, "init", "--yes", "--root", project], `v${previousVersion} init`);
  const upgrade = cli(["upgrade", "--yes", "--root", project], `v${previousVersion} to v${packageVersion} upgrade`);
  assert(output(upgrade).includes("migration committed") || output(upgrade).includes("accepted-current-state"), "adjacent upgrade did not reach a committed or accepted state");
  const doctor = cli(["doctor", "--root", project], "doctor after adjacent upgrade");
  assert(output(doctor).includes("status: passed"), "doctor did not pass immediately after adjacent upgrade");

  simulateCloseout(project);
  const blocked = cli(["doctor", "--root", project], "doctor after normal closeout before finalize", { allowFailure: true });
  assert(blocked.status !== 0 && output(blocked).includes("unbound success state"), "normal post-upgrade closeout should be blocked before finalize");

  const finalized = cli(["finalize-closeout", "--root", project], "finalize post-upgrade closeout");
  assert(output(finalized).includes("closeout finalized"), "finalize-closeout did not report the finalized closeout witness");
  const finalDoctor = cli(["doctor", "--root", project], "doctor after closeout finalize");
  assert(output(finalDoctor).includes("status: passed"), "doctor did not pass after closeout finalize");
  const card = cli(["closeout-status", "--root", project], "closeout-status after closeout finalize");
  assert(output(card).includes("status: complete"), "closeout-status did not accept the finalized closeout");

  const journalCount = countMigrationJournals(project);
  const secondFinalize = cli(["finalize-closeout", "--root", project], "idempotent finalize post-upgrade closeout");
  assert(output(secondFinalize).includes("already matches"), "second finalize-closeout should be a no-op when bytes already match");
  assert(countMigrationJournals(project) === journalCount, "second finalize-closeout created a duplicate journal");
  const secondDoctor = cli(["doctor", "--root", project], "doctor after idempotent closeout finalize");
  assert(output(secondDoctor).includes("status: passed"), "doctor did not pass after idempotent finalize");

  mkdirSync(path.join(project, "docs"), { recursive: true });
  writeFileSync(path.join(project, "docs", "unexpected-note.md"), "# Unexpected note\n", "utf8");
  const rejectedNewFile = cli(["finalize-closeout", "--root", project], "finalize with new non-closeout file", { allowFailure: true });
  assert(rejectedNewFile.status !== 0 && output(rejectedNewFile).includes("non-closeout drift"), "finalize-closeout accepted a new non-closeout file");

  writeFileSync(path.join(project, "dev", "rules", "safety.md"), `${read(path.join(project, "dev", "rules", "safety.md"))}\n\nUnexpected non-closeout drift.\n`, "utf8");
  const rejectedRule = cli(["finalize-closeout", "--root", project], "finalize with rule-pack drift", { allowFailure: true });
  assert(rejectedRule.status !== 0 && output(rejectedRule).includes("non-closeout drift"), "finalize-closeout accepted rule-pack drift");
  console.log("ok: adjacent published upgrade allows only explicit post-upgrade closeout finalize");
}

function checkArchiveCanonicalCasing() {
  const project = fresh("archive-casing");
  cli(["init", "--yes", "--root", project], "archive casing init");
  const canonical = path.join(project, "dev", "SESSION_LOG_archive");
  mkdirSync(canonical, { recursive: true });
  writeFileSync(path.join(canonical, "INDEX.md"), "# Archive Index\n", "utf8");
  const doctor = cli(["doctor", "--root", project], "archive casing canonical doctor");
  assert(output(doctor).includes("status: passed"), "canonical SESSION_LOG_archive casing should pass doctor");

  const legacyProject = fresh("archive-legacy-casing");
  cli(["init", "--yes", "--root", legacyProject], "archive legacy casing init");
  const legacy = path.join(legacyProject, "dev", "session_log_archive");
  mkdirSync(legacy, { recursive: true });
  writeFileSync(path.join(legacy, "INDEX.md"), "# Legacy Archive Index\n", "utf8");
  const rejected = cli(["doctor", "--root", legacyProject], "archive legacy casing doctor", { allowFailure: true });
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

function cli(args, label, options = {}) {
  return run(process.execPath, ["bin/agent-handoff-kit.mjs", ...args], label, options);
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
function assert(condition, message) { if (!condition) throw new Error(message); }
