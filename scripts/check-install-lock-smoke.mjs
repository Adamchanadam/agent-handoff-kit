#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { hostname, tmpdir as systemTmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requiredInstalledTargets } from "../bin/installed-file-contract.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const qaTmp = process.env.AGENT_HANDOFF_KIT_QA_TMP || (process.platform === "win32" ? "C:\\tmp" : systemTmpdir());
const packageVersion = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version;

main();

function main() {
  checkFreshInstallNoMigrationArtifacts();
  checkCreateOnlyUpgradeNoMigrationArtifacts();
  checkStaleCompletedCreateOnlyInitLockDoesNotBlock();
  console.log("ok: install lock smoke QA");
}

function checkFreshInstallNoMigrationArtifacts() {
  const project = fresh("fresh");
  const result = cli(["init", "--yes", "--root", project], "fresh init");
  assertRequiredFiles(project, "fresh init", result);
  assert(!existsSync(migrationsRoot(project)), "fresh init created dev/governance_migrations");
  assert(read(path.join(project, "dev", "SESSION_HANDOFF.md")).includes("First-use guidance state: eligible"), "fresh init did not keep first-use guidance eligible");
  assert(cli(["doctor", "--root", project], "fresh doctor").stdout.includes("status: passed"), "fresh init doctor did not pass");
  console.log("ok: quick fresh install leaves no migration lock");
}

function checkCreateOnlyUpgradeNoMigrationArtifacts() {
  const source = fresh("source");
  cli(["init", "--yes", "--root", source], "source init");

  const project = fresh("create-only-upgrade");
  copyFileSync(path.join(source, "AGENTS.md"), path.join(project, "AGENTS.md"));
  const dryRun = cli(["upgrade", "--dry-run", "--root", project], "create-only upgrade dry-run");
  assert(dryRun.stdout.includes("dry-run: no files written"), "create-only upgrade dry-run did not remain read-only");
  assert(!existsSync(migrationsRoot(project)), "create-only upgrade dry-run created dev/governance_migrations");

  const result = cli(["upgrade", "--yes", "--root", project], "create-only upgrade");
  assertRequiredFiles(project, "create-only upgrade", result);
  assert(result.stdout.includes("create-only install"), "create-only upgrade did not use the direct create-only path");
  assert(!existsSync(migrationsRoot(project)), "create-only upgrade created dev/governance_migrations");
  assert(cli(["doctor", "--root", project], "create-only doctor").stdout.includes("status: passed"), "create-only upgrade doctor did not pass");
  console.log("ok: quick create-only upgrade leaves no migration lock");
}

function checkStaleCompletedCreateOnlyInitLockDoesNotBlock() {
  const project = fresh("stale-create-only-lock");
  cli(["init", "--yes", "--root", project], "stale-lock source init");
  const lockPath = writeStaleCompletedCreateOnlyInitLock(project);
  assert(existsSync(lockPath), "stale create-only fixture did not write lock");
  const before = snapshot(project);

  assert(cli(["doctor", "--root", project], "stale-lock doctor").stdout.includes("status: passed"), "stale completed create-only init lock made doctor fail");
  assert(sameSnapshot(before, snapshot(project)), "doctor changed stale-lock fixture bytes");

  const dryRun = cli(["upgrade", "--dry-run", "--root", project], "stale-lock upgrade dry-run");
  assert(dryRun.stdout.includes("dry-run: no files written"), "stale-lock dry-run was not read-only");
  assert(sameSnapshot(before, snapshot(project)), "dry-run changed stale-lock fixture bytes");

  const noOp = cli(["upgrade", "--yes", "--root", project], "stale-lock upgrade");
  assert(noOp.stdout.includes("stale completed init lock ignored"), "stale completed create-only init lock was not ignored");
  assert(sameSnapshot(before, snapshot(project)), "stale-lock no-op upgrade changed fixture bytes");
  console.log("ok: quick stale completed create-only init lock is inert");
}

function writeStaleCompletedCreateOnlyInitLock(project) {
  const id = `qa-quick-stale-create-only-init-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const migrationDir = path.join(migrationsRoot(project), id);
  const stageDir = path.join(migrationDir, "stage");
  mkdirSync(path.join(migrationDir, "backup"), { recursive: true });
  mkdirSync(stageDir, { recursive: true });

  const entries = [];
  for (const targetRel of new Set(requiredInstalledTargets)) {
    const bytes = readFileSync(path.join(project, targetRel));
    const stagePath = path.join(stageDir, targetRel);
    mkdirSync(path.dirname(stagePath), { recursive: true });
    writeFileSync(stagePath, bytes);
    entries.push({
      targetRel,
      existed: false,
      beforeHash: null,
      afterHash: sha(bytes),
      backupRel: null,
      committed: false,
      reason: "QA quick stale completed create-only init lock"
    });
  }

  writeFileSync(path.join(migrationDir, "transaction.json"), `${JSON.stringify({
    id,
    command: "init",
    mode: "first-install",
    attemptedVersion: packageVersion,
    committedVersion: null,
    state: "committing",
    entries,
    archiveMigrations: [],
    plannedSkips: 0,
    createdAt: "2026-08-07T17:13:51.000Z"
  }, null, 2)}\n`, "utf8");

  const lockPath = path.join(migrationsRoot(project), ".upgrade.lock");
  writeFileSync(lockPath, `${JSON.stringify({
    id,
    command: "init",
    journal: `dev/governance_migrations/${id}/transaction.json`,
    host: hostname(),
    pid: 99999999,
    createdAt: "2026-08-07T17:13:51.000Z"
  }, null, 2)}\n`, "utf8");
  return lockPath;
}

function fresh(label) {
  const project = path.join(qaTmp, `ack-install-lock-smoke-${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(project, { recursive: true });
  return project;
}

function cli(args, label) {
  const result = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "1" },
    windowsHide: true
  });
  if (result.error || result.status !== 0) throw new Error(`${label} failed\n${output(result)}`);
  return result;
}

function assertRequiredFiles(project, label, result) {
  const missing = requiredInstalledTargets.filter((relative) => !existsSync(path.join(project, relative)));
  if (missing.length === 0) return;
  throw new Error(`${label} missing installed files:\n${missing.map((item) => `- ${item}`).join("\n")}\n${output(result)}`);
}

function migrationsRoot(project) {
  return path.join(project, "dev", "governance_migrations");
}

function snapshot(project) {
  const files = [];
  walk(project, project, files);
  return new Map(files.map((relative) => [relative, sha(readFileSync(path.join(project, relative)))]));
}

function walk(base, current, files) {
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) walk(base, absolute, files);
    else if (entry.isFile()) files.push(path.relative(base, absolute).replaceAll(path.sep, "/"));
  }
}

function read(file) {
  return readFileSync(file, "utf8");
}

function sha(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function sameSnapshot(left, right) {
  return left.size === right.size && [...left].every(([key, value]) => right.get(key) === value);
}

function output(result) {
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
