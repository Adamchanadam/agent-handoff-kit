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
  assert(read(path.join(conflictRoot, "CLAUDE.md")).includes("Do not replace this custom bridge."), "conflict file was overwritten");
  const conflictReport = latestReport(conflictRoot);
  const conflictText = read(conflictReport);
  assert(conflictText.includes("## Conflicts"), "conflict report missing conflicts section");
  assert(conflictText.includes("CLAUDE.md"), "conflict report missing CLAUDE.md");

  console.log("");
  console.log("Agent Handoff Kit upgrade safety QA passed");
  console.log(`merge root: ${mergeRoot}`);
  console.log(`conflict root: ${conflictRoot}`);
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
