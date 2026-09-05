#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractOpeningMessage } from "../bin/prompt-mirror-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = mkdtempSync(path.join(tmpdir(), "ack-closeout-card-"));
const env = { ...process.env, AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "1" };

try {
  const packageJson = JSON.parse(readAt(root, "package.json"));
  const version = packageJson.version;
  invoke(["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", fixtureRoot], "closeout-card fixture init");

  const handoffPath = path.join(fixtureRoot, "dev", "SESSION_HANDOFF.md");
  const initial = readFileSync(handoffPath, "utf8");
  assert(initial.includes("ack:field:closeout-outcome"), "installed handoff missing closeout outcome field");
  assert(initial.includes("ack:field:project-required-persistence"), "installed handoff missing project-required persistence field");

  const complete = closeoutReadyHandoff(initial);
  writeFixtureHandoff(complete);
  const passed = invoke(["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], "complete closeout card");
  assert(passed.stdout.includes(`Agent Handoff Kit v${version}`), "complete closeout card omitted verified version");
  assert(passed.stdout.includes("handoff saved"), "complete closeout card omitted success state");
  assert(passed.stdout.includes("status: complete"), "complete closeout card omitted machine-readable complete state");
  assert(!passed.stdout.includes("handoff blocked"), "complete closeout card showed a blocked state");

  assertCloseoutComplete(complete.replace("Git root: no Git repository (fixture root)", "Git root: not_applicable — workspace-health reports git: no, no .git metadata found."), "literal workspace-health no-Git evidence with explanation");
  writeFixtureHandoff(complete.replace("Git root: no Git repository (fixture root)", "Git root: /claimed/repository"));
  const falseGit = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], { cwd: root, encoding: "utf8", env });
  assert(!falseGit.error && falseGit.status !== 0 && falseGit.stdout.includes("handoff records Git identity, but live root is not a Git repository"), "unrelated Git identity in a non-Git fixture was accepted");

  const sufficiencyCases = [
    ["negative answer", complete.replace("Answer: yes", "Answer: no — parent outcome missing")],
    ["unknown answer", complete.replace("Answer: yes", "Answer: unknown")],
    ["missing answer", complete.replace("Answer: yes", "")],
    ["duplicate answer", complete.replace("Answer: yes", "Answer: yes\nAnswer: no")],
    ["visible contradiction before inline comment", complete.replace("Answer: yes", "Answer: yes\nAnswer: no <!-- parent remains unknown -->")],
    ["empty evidence", complete.replace(/^Reconstruction evidence:.*$/m, "Reconstruction evidence:")],
    ["placeholder evidence", complete.replace(/^Reconstruction evidence:.*$/m, "Reconstruction evidence: TBD")],
    ["fenced evidence", complete.replace(/^(Reconstruction evidence:.*)$/m, "~~~~markdown\n$1\n~~~~")],
    ["indented code evidence", complete.replace(/^(Reconstruction evidence:.*)$/m, "    $1")],
    ["tab-indented code evidence", complete.replace(/^(Reconstruction evidence:.*)$/m, " \t$1")],
    ["comment evidence", complete.replace(/^(Reconstruction evidence:.*)$/m, "<!--\n$1\n-->")],
    ["out-of-section evidence", complete.replace(/^Reconstruction evidence:.*$/m, "").replace("## Next Session Opening Message", "## Next Session Opening Message\n\nReconstruction evidence: Task Understanding and Active Objective were checked.")],
    ["duplicate evidence", complete.replace(/^(Reconstruction evidence:.*)$/m, "$1\n$1")],
    ["continuation contradiction", complete.replace("without searching old log history: yes", "without searching old log history: no")]
  ];
  for (const [label, text] of sufficiencyCases) {
    writeFixtureHandoff(text);
    const before = readAt(fixtureRoot, "dev/SESSION_HANDOFF.md");
    const rejected = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], { cwd: root, encoding: "utf8", env });
    assert(!rejected.error && rejected.status !== 0 && rejected.stdout.includes("handoff sufficiency read-back is incomplete"), `${label} was not rejected by the sufficiency gate`);
    assert(!rejected.stdout.includes("handoff saved"), `${label} falsely claimed saved`);
    assert(before === readAt(fixtureRoot, "dev/SESSION_HANDOFF.md"), `${label} mutated the handoff`);
  }
  assertCloseoutComplete(complete.replace("## Handoff Sufficiency Check", "## 交接充分性檢查").replace(/\r?\n/g, "\r\n"), "localized heading and CRLF");
  assertCloseoutComplete(complete.replace(/^Reconstruction evidence:.*$/m, "Reconstruction evidence: Task Understanding and Active Objective preserve the outcome; Risks / Blockers records an unknown dependency and the safe next action; Next Task Required Reading names the unread source."), "evidence may faithfully describe blocked work");
  console.log("ok: explicit insufficiency, missing/hidden/duplicate proof and continuation contradictions cannot produce a complete card");

  const lifecycleConflict = complete.replace(
    "1. follow-up scope — monitor only if a new reproducible failure occurs.",
    "1. Completed fixture closeout and read-back."
  );
  writeFixtureHandoff(lifecycleConflict);
  invoke(["bin/agent-handoff-kit.mjs", "doctor", "--root", fixtureRoot], "lifecycle-conflict fixture doctor");
  const lifecycleRejected = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], { cwd: root, encoding: "utf8", env });
  assert(!lifecycleRejected.error && lifecycleRejected.status !== 0, "lifecycle conflict produced a successful closeout card");
  assert(lifecycleRejected.stdout.includes("handoff lifecycle read-back is not healthy"), "lifecycle conflict omitted lifecycle blocker");
  assert(
    lifecycleRejected.stdout.includes('Resolved [Completed This Session]: "Completed fixture closeout and read-back."'),
    "lifecycle conflict omitted the resolved line"
  );
  assert(
    lifecycleRejected.stdout.includes('Carry-forward [Next Priorities]: "Completed fixture closeout and read-back."'),
    "lifecycle conflict omitted the carry-forward line"
  );

  const openingBackground = insertCompletedLine(
    insertOpeningLine(
      complete,
      "延續性背景資訊喺開場白重複提及，方便下一輪不再重問資料路徑。"
    ),
    "已完成核對：延續性背景資訊喺開場白重複提及，五大區段一致無矛盾。"
  );
  assertCloseoutComplete(openingBackground, "opening background lifecycle text");

  const contextualOpeningRoute = insertCompletedLine(
    insertOpeningLine(
      complete,
      "下次你話「開工」或者新一輪 AI 讀返 AGENTS.md + dev/SESSION_HANDOFF.md，就會知道:去 Doc\\00_原始資料 攞新一個月兩份匯出檔，延伸 Doc\\01_報告 最新底稿，唔使再由頭問一次規則。"
    ),
    "已完成核對 Doc\\00_原始資料 同 Doc\\01_報告 開場白背景路徑。"
  );
  assertCloseoutComplete(contextualOpeningRoute, "contextual opening route text");

  const noBlockerRisk = replaceRisksLine(
    insertCompletedLine(complete, "Completed v0.3.57 release candidate full gate."),
    "No blocker remains for v0.3.57 release candidate full gate."
  );
  assertCloseoutComplete(noBlockerRisk, "resolved no-blocker risk text");

  const monitorOnlyCondition = replaceRisksLine(
    insertCompletedLine(complete, "已完成 Doc 報告資料匯入驗證。"),
    "只監察：Doc 報告資料匯入如有新失敗才重開。"
  );
  assertCloseoutComplete(monitorOnlyCondition, "Chinese conditional monitor-only text");

  const openingContinuation = insertOpeningLine(
    insertCompletedLine(complete, "Completed Doc\\01_報告 latest draft final review."),
    "Continue Doc\\01_報告 latest draft final review before delivery."
  );
  writeFixtureHandoff(openingContinuation);
  const openingContinuationRejected = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], { cwd: root, encoding: "utf8", env });
  assert(!openingContinuationRejected.error && openingContinuationRejected.status !== 0, "opening continuation conflict produced a successful closeout card");
  assert(openingContinuationRejected.stdout.includes("handoff lifecycle read-back is not healthy"), "opening continuation conflict omitted lifecycle blocker");

  const blocked = complete.replace(
    /- Project-required persistence:[^\r\n]*/,
    "- Project-required persistence: blocked — project policy requires a Git push that is not authorized."
  );
  writeFixtureHandoff(blocked);
  const rejected = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], { cwd: root, encoding: "utf8", env });
  assert(!rejected.error && rejected.status !== 0, "blocked project-required persistence produced a successful closeout card");
  assert(rejected.stdout.includes("handoff blocked"), "blocked closeout card did not identify the blocked state");
  assert(rejected.stdout.includes("status: blocked"), "blocked closeout card omitted machine-readable blocked state");
  assert(
    rejected.stdout.includes("這不是失敗；只是還有事未保存、未提交、未驗證或需要處理"),
    "blocked closeout card omitted the human next-step explanation"
  );
  assert(!rejected.stdout.includes("handoff saved"), "blocked closeout card falsely claimed handoff saved");

  console.log("ok: closeout card is bound to persistence outcome");
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

function closeoutReadyHandoff(text) {
  return text
    .replace("Last Updated: TBD", "Last Updated: 2026-07-16 12:00:00 +01:00")
    .replaceAll("<absolute project root>", fixtureRoot)
    .replaceAll("TBD", "closeout fixture")
    .replace("Answer: closeout fixture", "Answer: yes")
    .replace(/^Reconstruction evidence:.*$/m, "Reconstruction evidence: Task Understanding identifies the standalone fixture outcome; Active Objective and Next Priorities identify the resume boundary; Next Task Required Reading identifies its sources and gaps.")
    .replace("1. closeout fixture", "1. Completed fixture closeout and read-back.")
    .replace("1. closeout fixture", "1. follow-up scope — monitor only if a new reproducible failure occurs.")
    .replace("1. closeout fixture", "1. none")
    .replace("- Checks run this session: closeout fixture", "- Checks run this session: fixture closeout state and read-back passed.")
    .replace("- Checks not run and why: closeout fixture", "- Checks not run and why: none.")
    .replace("Recommended next step: closeout fixture — reason: closeout fixture", "Recommended next step: Resume from the opening message — reason: this fixture verifies resumable continuity.")
    .replace("- Stale snapshots left in this handoff: closeout fixture", "- Stale snapshots left in this handoff: no")
    .replace("- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: closeout fixture", "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: yes")
    .replace("- Recommended next step is explicit and reasoned: closeout fixture", "- Recommended next step is explicit and reasoned: yes — action and reason are recorded.")
    .replace("- Opening message matches current state: closeout fixture", "- Opening message matches current state: yes")
    .replace("- Next AI can continue from `AGENTS.md`, this handoff, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history: closeout fixture", "- Next AI can continue from `AGENTS.md`, this handoff, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history: yes")
    .replace("Git root: closeout fixture", "Git root: no Git repository (fixture root)")
    .replace("Branch: closeout fixture", "Branch: not_applicable - no Git repository")
    .replace("Commit: closeout fixture", "Commit: not_applicable - no Git repository")
    .replace("Worktree / parallel workspace status: closeout fixture", "Worktree / parallel workspace status: not_applicable - no Git repository")
    .replace("Uncommitted changes summary: closeout fixture", "Uncommitted changes summary: not_applicable - no Git repository")
    .replace(/- Closeout outcome:[^\r\n]*/, "- Closeout outcome: complete — all required writes, read-backs, and project-required persistence are complete.")
    .replace(/- Project-required persistence:[^\r\n]*/, "- Project-required persistence: not_required — this fixture has no project-required Git persistence.");
}

function writeFixtureHandoff(text) {
  writeFileSync(path.join(fixtureRoot, "dev", "SESSION_HANDOFF.md"), text, "utf8");
  writeFileSync(path.join(fixtureRoot, "START_NEXT_SESSION_PROMPT.txt"), `${extractOpeningMessage(text)}\n`, "utf8");
}

function insertCompletedLine(text, line) {
  return text.replace(
    "1. Completed fixture closeout and read-back.",
    `1. Completed fixture closeout and read-back.\n2. ${line}`
  );
}

function replaceRisksLine(text, line) {
  return text.replace(
    /## Risks \/ Blockers\r?\n\r?\n1\. none/,
    `## Risks / Blockers\n\n1. ${line}`
  );
}

function insertOpeningLine(text, line) {
  return text.replace(
    "Resume the current objective. A plain `Start Agent Handoff` / `開工` with no same-message task or explicit long-run instruction only authorizes minimum state recovery",
    `${line}\n\nResume the current objective. A plain \`Start Agent Handoff\` / \`開工\` with no same-message task or explicit long-run instruction only authorizes minimum state recovery`
  );
}

function assertCloseoutComplete(text, label) {
  writeFixtureHandoff(text);
  const result = invoke(["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], label);
  assert(result.stdout.includes("status: complete"), `${label} omitted machine-readable complete state`);
  assert(!result.stdout.includes("handoff blocked"), `${label} showed a blocked state`);
}

function invoke(args, label) {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", env });
  if (result.error || result.status !== 0) throw new Error(`${label} failed\n${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  return result;
}

function readAt(base, relative) {
  return readFileSync(path.join(base, relative), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
