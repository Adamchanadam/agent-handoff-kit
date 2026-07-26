#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir as systemTmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { installedFileContracts } from "../bin/installed-file-contract.mjs";
import { buildUpgradeInventory } from "../bin/upgrade-inventory.mjs";
import { getOfficialBaseline, loadOfficialOriginCatalog } from "../bin/official-origin-catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const qaTmp = process.env.AGENT_HANDOFF_KIT_QA_TMP || (process.platform === "win32" ? "C:\\tmp" : systemTmpdir());
const catalog = await loadOfficialOriginCatalog();
const modifiedRuleContracts = Object.freeze([
  "dev/rules/safety.md",
  "dev/rules/research.md",
  "dev/rules/agent-governance.md",
  "dev/rules/knowledge.md",
  "dev/rules/integrations.md"
]);
const inertUserTargets = Object.freeze([
  "docs/custom-policy.json",
  "資料/附加規則.md",
  "docs/unrelated.txt",
  "dev/safety.md"
]);

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});

async function main() {
  const project = fresh("inventory");
  materializeOfficialInstall("0.3.40", project);
  writeFixtureState(project);
  const before = fullSnapshot(project);
  const first = await buildUpgradeInventory({ root: project });
  const afterFirst = fullSnapshot(project);
  const second = await buildUpgradeInventory({ root: project });
  const afterSecond = fullSnapshot(project);

  assert(first.status === "ready", `inventory unexpectedly blocked: ${JSON.stringify(first.blockers)}`);
  assert(first.inventorySha256 === second.inventorySha256, "same typed source tree produced an unstable inventory digest");
  assert(equalSnapshots(before, afterFirst) && equalSnapshots(before, afterSecond), "read-only inventory changed the fixture");
  assert(first.formalEntryTargets.length === 4, "formal entry targets were not all retained");

  const entries = new Map(first.entries.map((entry) => [entry.path, entry]));
  for (const { targetRel } of installedFileContracts) {
    assert(entries.has(targetRel), `managed contract omitted from inventory: ${targetRel}`);
  }
  for (const targetRel of modifiedRuleContracts) {
    const entry = entries.get(targetRel);
    assert(entry, `typed installed rule-pack contract omitted: ${targetRel}`);
    assert(entry.sha256 === sha(readFileSync(path.join(project, targetRel))), `typed installed contract hash drifted: ${targetRel}`);
    assert(readFileSync(path.join(project, targetRel), "utf8").includes(`R034_CUSTOM_${path.basename(targetRel, ".md").toUpperCase()}`), `typed installed contract text changed: ${targetRel}`);
  }

  assert(entries.get("dev/governance_migrations/prior/transaction.json")?.classifications.includes("transaction-state"), "exact transaction.json state was not inventoried");
  assert(entries.get("dev/session_log_archive/archive_001.md")?.classifications.includes("legacy-session-log-archive"), "legacy session-log archive was not inventoried");
  for (const inertTarget of inertUserTargets) {
    assert(!entries.has(inertTarget), `inert generic user target became inventory authority: ${inertTarget}`);
    assert(readFileSync(path.join(project, inertTarget), "utf8") === beforeText(project, inertTarget), `inventory changed inert user target bytes: ${inertTarget}`);
  }

  write(path.join(project, "docs", "custom-policy.json"), "{\n  \"retention\": \"local-drift\"\n}\n");
  write(path.join(project, "資料", "附加規則.md"), "# 附加規則\n\nDRIFT SHOULD BE INERT.\n");
  write(path.join(project, "docs", "unrelated.txt"), "Unrelated drift must not affect typed inventory.\n");
  write(path.join(project, "dev", "safety.md"), "# Legacy safety location\n\nDRIFT SHOULD BE INERT.\n");
  const drifted = await buildUpgradeInventory({ root: project });
  const driftEntries = new Map(drifted.entries.map((entry) => [entry.path, entry]));
  assert(drifted.status === "ready", `generic user target drift unexpectedly blocked inventory: ${JSON.stringify(drifted.blockers)}`);
  assert(drifted.inventorySha256 === first.inventorySha256, "inert generic target byte drift changed the typed inventory digest");
  for (const inertTarget of inertUserTargets) {
    assert(!driftEntries.has(inertTarget), `drifted inert target became inventory authority: ${inertTarget}`);
  }

  console.log("ok: R-034 inventory is scoped to installed contracts, exact transaction journals, and typed archive state");
  console.log("ok: generic AGENTS Markdown/plain/Unicode references and unrelated files remain inert and do not affect the inventory digest");
  console.log(`ok: inventory digest ${first.inventorySha256}`);
  console.log("Agent Handoff Kit R-034 inventory QA passed");
}

function writeFixtureState(project) {
  const markers = [
    ["dev/rules/safety.md", "請保留專案的人工覆核門檻。"],
    ["dev/rules/research.md", "Keep the local evidence-retention exception."],
    ["dev/rules/agent-governance.md", "プロジェクト固有の承認条件を保持する。"],
    ["dev/rules/knowledge.md", "Keep the project knowledge ownership marker."],
    ["dev/rules/integrations.md", "保留本機整合的可用性檢查規則。"]
  ];
  for (const [targetRel, content] of markers) {
    const marker = `R034_CUSTOM_${path.basename(targetRel, ".md").toUpperCase()}`;
    append(path.join(project, targetRel), `\n${marker}\n${content}\n`);
  }
  append(
    path.join(project, "AGENTS.md"),
    "\n## Local project references\n\n- [Custom policy](docs/custom-policy.json)\n- `資料/附加規則.md`\n- Plain path: dev/safety.md\n"
  );
  write(path.join(project, "docs", "custom-policy.json"), "{\n  \"retention\": \"local\"\n}\n");
  write(path.join(project, "資料", "附加規則.md"), "# 附加規則\n\n僅供此專案使用。\n");
  write(path.join(project, "docs", "unrelated.txt"), "This file is deliberately unreachable.\n");
  write(path.join(project, "dev", "safety.md"), "# Legacy safety location\n\nRetain this legacy source for migration review.\n");
  write(path.join(project, "dev", "governance_migrations", "prior", "transaction.json"), "{\n  \"state\": \"committed\"\n}\n");
  write(path.join(project, "dev", "session_log_archive", "archive_001.md"), "# Historical trace\n");
}

function materializeOfficialInstall(version, project) {
  assert(catalog.releases[version], `v${version} missing from official origin catalog`);
  for (const { targetRel } of installedFileContracts) {
    const baseline = getOfficialBaseline({ version, targetRel, catalog, root: project });
    if (!baseline || baseline.state === "absent") continue;
    write(path.join(project, targetRel), baseline.text);
  }
}

function fresh(label) {
  const project = path.join(qaTmp, `ack-r034-${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  assert(!existsSync(project), `QA fixture already exists: ${project}`);
  mkdirSync(project, { recursive: true });
  return project;
}

function fullSnapshot(project) {
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

function beforeText(project, relative) {
  if (relative === "docs/custom-policy.json") return "{\n  \"retention\": \"local\"\n}\n";
  if (relative === "資料/附加規則.md") return "# 附加規則\n\n僅供此專案使用。\n";
  if (relative === "docs/unrelated.txt") return "This file is deliberately unreachable.\n";
  if (relative === "dev/safety.md") return "# Legacy safety location\n\nRetain this legacy source for migration review.\n";
  throw new Error(`unexpected inert target: ${relative}`);
}

function write(file, content) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content, "utf8");
}

function append(file, content) { write(file, `${readFileSync(file, "utf8")}${content}`); }
function sha(buffer) { return createHash("sha256").update(buffer).digest("hex"); }
function equalSnapshots(left, right) { return left.size === right.size && [...left].every(([key, value]) => right.get(key) === value); }
function assert(condition, message) { if (!condition) throw new Error(message); }
