#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { buildUpgradeInventory } from "../bin/upgrade-inventory.mjs";
import { createQaTempTracker } from "./qa-temp-cleanup.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageVersion = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version;
const qaTemp = createQaTempTracker("upgrade inventory QA");

let passed = false;
try {
  const project = fresh("upgrade-inventory");
  cli(["init", "--yes", "--root", project], "inventory bootstrap");

  const agentsPath = path.join(project, "AGENTS.md");
  const agentsBefore = readFileSync(agentsPath);
  writeFileSync(
    agentsPath,
    `${agentsBefore.toString("utf8")}\n[ordinary docs link](docs/custom-policy.json)\nPlain path: notes/繁中與日本語/普通.txt\n`,
    "utf8"
  );
  mkdirSync(path.join(project, "docs"), { recursive: true });
  mkdirSync(path.join(project, "notes", "繁中與日本語"), { recursive: true });
  writeFileSync(path.join(project, "docs", "custom-policy.json"), "{\"ordinary\":true}\n", "utf8");
  writeFileSync(path.join(project, "notes", "繁中與日本語", "普通.txt"), "普通檔案\n", "utf8");
  mkdirSync(path.join(project, "dev", "governance_migrations", "old-committed"), { recursive: true });
  writeFileSync(path.join(project, "dev", "governance_migrations", "old-committed", "transaction.json"), "{ malformed historical receipt\n", "utf8");
  mkdirSync(path.join(project, "dev", "SESSION_LOG_archive"), { recursive: true });
  writeFileSync(path.join(project, "dev", "SESSION_LOG_archive", "INDEX.md"), "# Archive Index\n\n| Batch | Date range | Entry count | File path |\n|---|---|---:|---|\n| 001 | 2026-07-26 | 1 | dev/SESSION_LOG_archive/archive_001.md |\n", "utf8");
  writeFileSync(path.join(project, "dev", "SESSION_LOG_archive", "archive_001.md"), "# Archive 001\n\ntrace\n", "utf8");

  const before = await readyInventory(project);
  const paths = new Set(before.entries.map((entry) => entry.path));

  for (const required of [
    "AGENTS.md",
    "dev/SESSION_HANDOFF.md",
    "dev/PROJECT_INDEX.md",
    "dev/RULE_PACKS.md",
    "dev/SESSION_LOG_archive/INDEX.md",
    "dev/SESSION_LOG_archive/archive_001.md"
  ]) {
    assert(paths.has(required), `typed current inventory is missing ${required}`);
  }

  for (const inert of [
    "docs/custom-policy.json",
    "notes/繁中與日本語/普通.txt",
    "dev/governance_migrations/old-committed/transaction.json"
  ]) {
    assert(!paths.has(inert), `inert or historical path entered current inventory: ${inert}`);
  }

  const ordinaryHashes = new Map([
    ["docs/custom-policy.json", sha(readFileSync(path.join(project, "docs", "custom-policy.json")))],
    ["notes/繁中與日本語/普通.txt", sha(readFileSync(path.join(project, "notes", "繁中與日本語", "普通.txt")))]
  ]);
  writeFileSync(path.join(project, "docs", "custom-policy.json"), "{\"ordinary\":\"drifted\"}\n", "utf8");
  writeFileSync(path.join(project, "notes", "繁中與日本語", "普通.txt"), "普通檔案 drift\n", "utf8");
  writeFileSync(path.join(project, "dev", "governance_migrations", "old-committed", "transaction.json"), "{\"state\":\"committed\",\"currentStateWitness\":\"drift\"}\n", "utf8");

  const after = await readyInventory(project);
  assert(before.inventorySha256 === after.inventorySha256, "ordinary or historical receipt drift changed current inventory digest");
  assert(sha(readFileSync(path.join(project, "docs", "custom-policy.json"))) !== ordinaryHashes.get("docs/custom-policy.json"), "ordinary JSON sentinel did not drift");
  assert(sha(readFileSync(path.join(project, "notes", "繁中與日本語", "普通.txt"))) !== ordinaryHashes.get("notes/繁中與日本語/普通.txt"), "ordinary Unicode sentinel did not drift");

  const doctor = cli(["doctor", "--root", project], "inventory doctor");
  assert(doctor.stdout.includes("status: passed"), `doctor did not ignore inert historical receipt\n${output(doctor)}`);
  console.log("ok: upgrade inventory is current scoped authority only");
  passed = true;
} finally {
  if (passed) qaTemp.cleanupOnSuccess();
  else qaTemp.reportRetained("QA failed before cleanup");
}

async function readyInventory(projectRoot) {
  const inventory = await buildUpgradeInventory({ root: projectRoot });
  assert(inventory.schemaVersion === 1, "unexpected upgrade inventory schema");
  assert(inventory.status === "ready", `inventory blocked: ${JSON.stringify(inventory.blockers)}`);
  return inventory;
}

function fresh(label) {
  const projectRoot = path.join(tmpdir(), `ahk-${label}-${packageVersion}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  qaTemp.track(projectRoot);
  mkdirSync(projectRoot, { recursive: true });
  return projectRoot;
}

function cli(args, label) {
  const result = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", ...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "1" }
  });
  if (result.error || result.status !== 0) throw new Error(`${label} failed\n${output(result)}`);
  return result;
}

function output(result) {
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

function sha(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
