#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const tempRoot = path.join(tmpdir(), `ack-release-flow-${Date.now()}`);

main();

function main() {
  const packageJson = JSON.parse(read("package.json"));
  assert(packageJson.name === "@adamchanadam/agent-handoff-kit", "package name drifted");
  assert(packageJson.version === "0.1.0", "package version drifted from current prototype baseline");
  assert(JSON.stringify(packageJson.files) === JSON.stringify(["bin/", "runtime-core/", "packs/", "README.md", "LICENSE"]), "npm package files boundary changed");
  assert(packageJson.scripts["qa:prototype"], "qa:prototype script is missing");
  assert(packageJson.scripts["qa:packs"], "qa:packs script is missing");
  assert(packageJson.scripts["qa:upgrade"], "qa:upgrade script is missing");
  assert(packageJson.scripts["qa:release"], "qa:release script is missing");

  runQaScript("check-public-prototype.mjs", "prototype QA");
  runQaScript("check-pack-scenarios.mjs", "pack scenario QA");
  runQaScript("check-upgrade-safety.mjs", "upgrade safety QA");

  const pack = runNpm(["pack", "--dry-run"], "npm package release dry-run");
  const packText = outputText(pack);
  assert(packText.includes("total files: 20"), "npm dry-run did not report expected 20 package files");
  assert(!packText.includes("docs/qa/"), "QA docs entered npm package");
  assert(!packText.includes("scripts/"), "source QA scripts entered npm package");
  assert(!existsSync(path.join(root, "adamchanadam-agent-handoff-kit-0.1.0.tgz")), "npm dry-run left a tarball behind");

  assertIncludes("README.md", [
    "狀態：`v0.1.0` 已正式發佈",
    "目前正式公開版本為 `0.1.0`",
    "## 它解決甚麼問題",
    "## 日常使用",
    "## 工作模式與規則包",
    "必讀事實",
    "npm run qa:prototype",
    "npm run qa:packs",
    "npm run qa:upgrade",
    "npm run qa:release",
    "收工",
    "wrap up",
    "handoff",
    "fenced `text` code block"
  ]);

  assertIncludes("CHANGELOG.md", [
    "## v0.1.0 — 2026-05-17",
    "早期正式發佈版本",
    "原始碼倉庫專用 `npm run qa:release`",
    "Installer hardening 仍未完成"
  ]);

  assertIncludes("docs/qa/release-grade-qa.md", [
    "`npm run qa:release`",
    "用戶流程驗收",
    "任務入口",
    "不屬於 npm package",
    "v0.1.0 發佈狀態",
    "發佈後仍需驗證",
    "不得因 `v0.1.0` 已發佈而宣稱"
  ]);

  assertIncludes("runtime-core/AGENTS.core.md", [
    "Detect end-of-session or handoff intent",
    "next-session opening message",
    "dev/RULE_PACKS.md",
    "Reachable is not the same as ingested",
    "Do not treat unread sources as absent",
    "ack:section:*",
    "State Reconciliation Check",
    "Do not append a new state snapshot"
  ]);

  run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", tempRoot], "release user-flow install");
  const doctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", tempRoot], "release user-flow doctor");
  assert(doctor.stdout.includes("status: passed"), "doctor did not pass in release user-flow check");
  assert(doctor.stdout.includes("schema checks:"), "doctor did not run schema checks");
  assert(doctor.stdout.includes("dev/SESSION_HANDOFF.md (handoff required sections)"), "doctor did not check handoff schema");
  assert(doctor.stdout.includes("dev/PROJECT_INDEX.md (project index tables)"), "doctor did not check project index schema");
  assert(doctor.stdout.includes("dev/RULE_PACKS.md (rule pack router coverage)"), "doctor did not check rule pack router schema");

  const installedHandoff = readAt(tempRoot, "dev/SESSION_HANDOFF.md");
  const installedLog = readAt(tempRoot, "dev/SESSION_LOG.md");
  assert(installedHandoff.includes("📋 Next session: copy and paste the whole block below"), "installed handoff missing copy marker");
  assert(installedHandoff.includes("```text"), "installed handoff missing fenced text block");
  assertHandoffMarker(installedHandoff, "section", "next-task-required-reading");
  assertHandoffMarker(installedHandoff, "section", "durable-anchors");
  assertHandoffMarker(installedHandoff, "section", "closeout-reconciled-state");
  assertHandoffMarker(installedHandoff, "section", "task-understanding-summary");
  assertHandoffMarker(installedHandoff, "section", "state-reconciliation-check");
  assert(installedLog.includes("### Next Session Opening Message"), "installed log missing opening message schema");
  const installedIndex = readAt(tempRoot, "dev/PROJECT_INDEX.md");
  assert(installedIndex.includes("## Fact Base"), "installed project index missing fact base section");
  assert(installedIndex.includes("## External Sources"), "installed project index missing external sources section");
  assert(installedIndex.includes("## Local QC Commands"), "installed project index missing local QC commands section");
  assert(installedIndex.includes("Reachable means the source can be found"), "installed project index missing reachable-versus-ingested note");
  assert(!existsSync(path.join(tempRoot, "archive")), "installer created archive directory by default");
  simulateMultiSessionFlow(installedHandoff, installedLog);
  simulateLocalizedHandoffHeadings();

  console.log("");
  console.log("Agent Handoff Kit release readiness QA passed");
  console.log(`user-flow root: ${tempRoot}`);
}

function simulateMultiSessionFlow(installedHandoff, installedLog) {
  const closedHandoff = installedHandoff
    .replace("Last Updated: TBD", "Last Updated: 2026-05-14 17:41:41 +01:00")
    .replaceAll("<absolute project root>", tempRoot)
    .replaceAll("TBD", "simulated user-flow value")
    .replace("- Stale snapshots left in this handoff: simulated user-flow value", "- Stale snapshots left in this handoff: no")
    .replace("- Opening message matches current state: simulated user-flow value", "- Opening message matches current state: yes")
    .replace("- Next AI can continue from `AGENTS.md`, this handoff, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history: simulated user-flow value", "- Next AI can continue from `AGENTS.md`, this handoff, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history: yes");
  assertReconciledHandoff(closedHandoff);
  const staleHandoff = closedHandoff.replace("- Stale snapshots left in this handoff: no", "- Stale snapshots left in this handoff: yes");
  assert(!isReconciledHandoff(staleHandoff), "stale handoff snapshot should fail reconciliation check");
  const openingMessage = extractOpeningMessage(closedHandoff);
  assert(openingMessage.includes(tempRoot), "simulated opening message missing project root");
  assert(openingMessage.includes("Read in order:"), "simulated opening message missing read order");
  assert(openingMessage.includes("dev/PROJECT_INDEX.md"), "simulated opening message missing project index read");

  const logEntry = [
    "## 2026-05-14 — Simulated User Flow",
    "",
    "- **ID:** release_readiness_user_flow",
    "- **Summary:** Simulated a small task, closeout, and next-session opening message.",
    "- **Changed:** dev/SESSION_HANDOFF.md, dev/SESSION_LOG.md",
    "- **Done:** Filled handoff placeholders and recorded a resumable opening message.",
    "- **QC:** doctor passed before and after simulated closeout.",
    "- **Sync:** not_applicable for simulated project.",
    "- **Pending:** Continue from the opening message in the next session.",
    "- **Risks:** none for simulated project.",
    "- **Log maintenance:** kept current entry and template for future sessions.",
    "",
    "### Next Session Opening Message",
    "",
    "📋 Next session: copy and paste the whole block below",
    "",
    "```text",
    openingMessage,
    "```",
    "",
    installedLog
  ].join("\n");

  writeFileSync(path.join(tempRoot, "dev/SESSION_HANDOFF.md"), closedHandoff, "utf8");
  writeFileSync(path.join(tempRoot, "dev/SESSION_LOG.md"), logEntry, "utf8");

  const resumedDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", tempRoot], "release user-flow resumed doctor");
  assert(resumedDoctor.stdout.includes("status: passed"), "doctor did not pass after simulated closeout");
  assert(resumedDoctor.stdout.includes("schema checks:"), "resumed doctor did not run schema checks");
}

function simulateLocalizedHandoffHeadings() {
  const handoffPath = path.join(tempRoot, "dev/SESSION_HANDOFF.md");
  const localized = readFileSync(handoffPath, "utf8")
    .replace("## Durable Anchors", "## 長期錨點")
    .replace("## Closeout-Reconciled State", "## 收尾已對賬狀態")
    .replace("## Current Baseline", "## 目前基線")
    .replace("## Task Understanding Summary", "## 任務理解摘要")
    .replace("## Active Objective", "## 目前目標")
    .replace("## Next Priorities", "## 下一步優先事項")
    .replace("## Next Task Required Reading", "## 下一個任務必讀資料")
    .replace("## Risks / Blockers", "## 風險與阻礙")
    .replace("## Validation / QC", "## 驗收與檢查")
    .replace("## Workspace Identity", "## 工作區身份")
    .replace("## Sync Status", "## 同步狀態")
    .replace("## State Reconciliation Check", "## 狀態對賬檢查")
    .replace("## Handoff Sufficiency Check", "## 交接足夠性檢查")
    .replace("## Next Session Opening Message", "## 下一次開工訊息")
    .replace("- User intent:", "- 使用者意圖:")
    .replace("- Task essence:", "- 任務本質:")
    .replace("- Success criteria:", "- 成功口徑:")
    .replace("- State sections rewritten or confirmed current:", "- 已重寫或確認仍為最新的狀態段落:")
    .replace("- Stale snapshots left in this handoff:", "- 交接內是否仍有過時快照:")
    .replace("- Opening message matches current state:", "- 開工訊息是否符合目前狀態:");
  writeFileSync(handoffPath, localized, "utf8");
  const localizedDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", tempRoot], "release user-flow localized handoff doctor");
  assert(localizedDoctor.stdout.includes("status: passed"), "doctor did not pass after localizing handoff headings");
}

function assertReconciledHandoff(text) {
  assert(isReconciledHandoff(text), "simulated closeout handoff did not pass state reconciliation check");
}

function isReconciledHandoff(text) {
  return text.includes("## State Reconciliation Check")
    && /Stale snapshots left in this handoff:\s*no/i.test(text)
    && /Opening message matches current state:\s*yes/i.test(text)
    && /Next AI can continue from `AGENTS\.md`, this handoff, `dev\/PROJECT_INDEX\.md`, and needed rule packs without searching old log history:\s*yes/i.test(text);
}

function extractOpeningMessage(text) {
  const marker = "📋 Next session: copy and paste the whole block below";
  const markerIndex = text.indexOf(marker);
  assert(markerIndex >= 0, "opening message marker missing");
  const fenceStart = text.indexOf("```text", markerIndex);
  assert(fenceStart >= 0, "opening message text fence missing");
  const contentStart = text.indexOf("\n", fenceStart);
  const fenceEnd = text.indexOf("```", contentStart + 1);
  assert(contentStart >= 0 && fenceEnd >= 0, "opening message text fence is not closed");
  return text.slice(contentStart + 1, fenceEnd).trim();
}

function runQaScript(scriptName, label) {
  run(process.execPath, [path.join("scripts", scriptName)], label);
}

function runNpm(args, label) {
  if (process.env.npm_execpath) {
    return run(process.execPath, [process.env.npm_execpath, ...args], label);
  }
  return run(process.platform === "win32" ? "npm.cmd" : "npm", args, label);
}

function run(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8"
  });

  if (result.error || result.status !== 0) {
    throw new Error(`${label} failed\n${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  }

  console.log(`ok: ${label}`);
  return result;
}

function assertIncludes(relativePath, snippets) {
  const text = read(relativePath);
  for (const snippet of snippets) {
    assert(text.includes(snippet), `${relativePath} missing snippet: ${snippet}`);
  }
}

function assertHandoffMarker(text, type, id) {
  const expected = `ack:${type}:${id}`;
  assert(text.includes(expected), `installed handoff missing semantic marker: ${expected}`);
}

function read(relativePath) {
  return readAt(root, relativePath);
}

function readAt(baseDir, relativePath) {
  return readFileSync(path.join(baseDir, relativePath), "utf8");
}

function outputText(result) {
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
