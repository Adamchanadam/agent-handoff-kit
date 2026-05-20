#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

main();

function main() {
  const mergeRoot = path.join(tmpdir(), `ack-upgrade-merge-${Date.now()}`);
  mkdirSync(mergeRoot, { recursive: true });
  writeFileSync(path.join(mergeRoot, "AGENTS.md"), "# Existing Project\n\n## User Local Rules\n\nKeep this local rule.\n", "utf8");

  const upgrade = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", mergeRoot], "upgrade existing AGENTS.md");
  assert(upgrade.stdout.includes("merged: 1"), "upgrade did not report one merged file");
  assert(upgrade.stdout.includes("backup:"), "upgrade did not report backup path");

  const mergedAgents = read(path.join(mergeRoot, "AGENTS.md"));
  assert(mergedAgents.includes("## User Local Rules"), "user local rules were not preserved");
  assert(mergedAgents.includes("Keep this local rule."), "user local rule text was not preserved");
  assert(mergedAgents.includes("BEGIN Agent Handoff Kit managed core"), "managed core block was not added");
  assert(mergedAgents.includes("Agent Handoff Kit Core Runtime"), "core runtime text was not merged");
  assertSingleCore(mergedAgents, "local-rule merge should create one managed core");

  const mergeReport = latestReport(mergeRoot);
  assert(read(mergeReport).includes("## Merged"), "migration report missing merged section");
  assert(read(mergeReport).includes("AGENTS.md"), "migration report missing AGENTS.md");
  const backupAgents = findFile(path.join(path.dirname(mergeReport), "backup"), "AGENTS.md");
  assert(backupAgents, "backup AGENTS.md was not created");
  assert(read(backupAgents).includes("Keep this local rule."), "backup did not preserve original AGENTS.md");

  const doctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", mergeRoot], "doctor after upgrade");
  assert(doctor.stdout.includes("status: passed"), "doctor did not pass after safe upgrade");

  const conflictRoot = path.join(tmpdir(), `ack-upgrade-conflict-${Date.now()}`);
  mkdirSync(conflictRoot, { recursive: true });
  writeFileSync(path.join(conflictRoot, "CLAUDE.md"), "# Existing Claude Memory\n\nDo not replace this custom bridge.\n", "utf8");

  const conflict = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", conflictRoot], "upgrade conflict scenario", { allowFailure: true });
  assert(conflict.status !== 0, "conflict scenario should return non-zero status");
  assert(outputText(conflict).includes("conflict: 1"), "conflict scenario did not report one conflict");
  assert(outputText(conflict).includes("需要人工確認"), "conflict scenario did not explain the conflict in plain language");
  assert(outputText(conflict).includes("這不是檔案壞掉"), "conflict scenario did not reassure that files are not broken");
  assert(read(path.join(conflictRoot, "CLAUDE.md")).includes("Do not replace this custom bridge."), "conflict file was overwritten");
  const conflictReport = latestReport(conflictRoot);
  const conflictText = read(conflictReport);
  assert(conflictText.includes("## Conflicts"), "conflict report missing conflicts section");
  assert(conflictText.includes("CLAUDE.md"), "conflict report missing CLAUDE.md");

  // Regression guard for R-016: doctor must not fail just because the
  // dev/PROJECT_INDEX.md template version row is older than the CLI version.
  // Upgrade preserves PROJECT_INDEX (user-owned), so an older install must
  // still pass doctor after upgrade.
  const staleRoot = path.join(tmpdir(), `ack-upgrade-stalever-${Date.now()}`);
  mkdirSync(staleRoot, { recursive: true });
  run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", staleRoot], "init for stale-version scenario");
  const staleIndexPath = path.join(staleRoot, "dev/PROJECT_INDEX.md");
  const staleIndex = read(staleIndexPath).replace(
    /\| Agent Handoff Kit template version \| [^|]*\|/,
    "| Agent Handoff Kit template version | 0.1.0 |"
  );
  writeFileSync(staleIndexPath, staleIndex, "utf8");
  assert(read(staleIndexPath).includes("| Agent Handoff Kit template version | 0.1.0 |"), "stale version row was not written");
  const staleUpgrade = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", staleRoot], "upgrade with stale version row");
  assert(staleUpgrade.stdout.includes("dev/PROJECT_INDEX.md"), "upgrade did not mention PROJECT_INDEX handling");
  assert(read(staleIndexPath).includes("| Agent Handoff Kit template version | 0.1.0 |"), "upgrade must preserve the user PROJECT_INDEX version row");
  const staleDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", staleRoot], "doctor after stale-version upgrade");
  assert(staleDoctor.stdout.includes("status: passed"), "doctor must pass even when PROJECT_INDEX version row is older than the CLI (R-016)");

  // Regression guard for R-023: older Agent Handoff Kit core files did not
  // include managed-core markers. Upgrade must replace that stale core rather
  // than append a second core below it.
  const oldCoreRoots = [
    ["v0.1.3-style", staleCoreFixture({ skillArbitration: false, promptMirror: false })],
    ["v0.1.4-style", staleCoreFixture({ skillArbitration: true, promptMirror: false })]
  ];
  for (const [label, staleCore] of oldCoreRoots) {
    const oldCoreRoot = path.join(tmpdir(), `ack-upgrade-oldcore-${label}-${Date.now()}`);
    mkdirSync(oldCoreRoot, { recursive: true });
    writeFileSync(path.join(oldCoreRoot, "AGENTS.md"), [
      "# Project Local Preamble",
      "",
      "Keep pre-core local rule.",
      "",
      staleCore,
      "",
      "## User Local Rules",
      "",
      "Keep post-core local rule."
    ].join("\n"), "utf8");
    const oldCoreUpgrade = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", oldCoreRoot], `upgrade ${label} AGENTS core`);
    assert(oldCoreUpgrade.stdout.includes("merged: 1"), `${label} upgrade should report one merged file`);
    const upgradedCore = read(path.join(oldCoreRoot, "AGENTS.md"));
    assertSingleCore(upgradedCore, `${label} upgrade must not leave duplicate core runtimes`);
    assert(upgradedCore.includes("# Project Local Preamble"), `${label} upgrade removed pre-core local heading`);
    assert(upgradedCore.includes("Keep pre-core local rule."), `${label} upgrade removed pre-core local rule`);
    assert(upgradedCore.includes("## User Local Rules"), `${label} upgrade removed post-core local heading`);
    assert(upgradedCore.includes("Keep post-core local rule."), `${label} upgrade removed post-core local rule`);
    assert(upgradedCore.includes("START_NEXT_SESSION_PROMPT.txt"), `${label} upgrade did not add current prompt mirror contract`);
    assert(upgradedCore.includes("External skill flows, subagents, task plans"), `${label} upgrade did not add skill/subagent arbitration`);
    const oldCoreDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", oldCoreRoot], `doctor after ${label} AGENTS core upgrade`);
    assert(oldCoreDoctor.stdout.includes("status: passed"), `${label} doctor did not pass after old core replacement`);
  }

  console.log("");
  console.log("Agent Handoff Kit upgrade safety QA passed");
  console.log(`merge root: ${mergeRoot}`);
  console.log(`conflict root: ${conflictRoot}`);
  console.log(`stale-version root: ${staleRoot}`);
}

function run(command, args, label, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8"
  });

  if (!options.allowFailure && (result.error || result.status !== 0)) {
    throw new Error(`${label} failed\n${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  }

  console.log(`ok: ${label}`);
  return result;
}

function latestReport(projectRoot) {
  const dir = path.join(projectRoot, "dev/governance_migrations");
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert(entries.length > 0, "no migration report directory found");
  return path.join(dir, entries.at(-1), "migration-report.md");
}

function findFile(startDir, targetName) {
  if (!existsSync(startDir)) return null;
  for (const entry of readdirSync(startDir, { withFileTypes: true })) {
    const fullPath = path.join(startDir, entry.name);
    if (entry.isDirectory()) {
      const found = findFile(fullPath, targetName);
      if (found) return found;
      continue;
    }
    if (entry.isFile() && entry.name === targetName) return fullPath;
  }
  return null;
}

function read(filePath) {
  return readFileSync(filePath, "utf8");
}

function outputText(result) {
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

function assertSingleCore(text, label) {
  assert(count(text, "# Agent Handoff Kit Core Runtime") === 1, `${label}: duplicate Agent Handoff Kit core runtime heading`);
  assert(count(text, "BEGIN Agent Handoff Kit managed core") <= 1, `${label}: duplicate managed core start marker`);
  assert(count(text, "BEGIN Agent Handoff Kit managed core") === count(text, "END Agent Handoff Kit managed core"), `${label}: managed core markers are not paired`);
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

function staleCoreFixture({ skillArbitration, promptMirror }) {
  return `# Agent Handoff Kit Core Runtime

This is a stale installed core used to test upgrade replacement.

## 1. Startup Reads

After this core is loaded, read in order:

1. \`dev/SESSION_HANDOFF.md\`
2. the latest entry in \`dev/SESSION_LOG.md\`
3. \`dev/PROJECT_INDEX.md\`
4. \`dev/RULE_PACKS.md\`

Before acting on a non-trivial task, identify required local source-of-truth files and external sources. Reachable is not the same as ingested. Do not treat unread sources as absent.

## 2. Work Loop

Use this loop for every task:

1. PLAN
2. READ
3. CHANGE
4. QC
5. PERSIST
${skillArbitration ? "\nExternal skill flows, subagents, task plans, or another tool's \"finish\" step do not replace this loop.\n" : ""}
## 3. Safety Boundaries

Do not delete, reset, overwrite, bulk-move, or publish without explicit user approval.

## 4. Closeout And Handoff

At full closeout:

1. Reconcile \`dev/SESSION_HANDOFF.md\`.
2. Add a concise entry to \`dev/SESSION_LOG.md\`.
3. Update \`dev/PROJECT_INDEX.md\` if needed.
4. Check \`dev/DOC_SYNC_REGISTRY.md\`.
5. Record unresolved drift risk.
6. Complete the \`State Reconciliation Check\`.
7. Run the handoff sufficiency check.
8. If either check fails, fix \`dev/SESSION_HANDOFF.md\` first.
9. Show a short closeout card, then provide a fenced opening message.
${promptMirror ? "\n10. Regenerate `START_NEXT_SESSION_PROMPT.txt`.\n" : ""}
## 5. Pack Loading

Use \`dev/RULE_PACKS.md\` to decide which pack to read.

## Core Complexity Rule

New default-core rules are allowed only when they apply to most sessions, protect safety or continuity, cannot live in a pack or registry, and keep the core within budget.
`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
