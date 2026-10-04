#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractOpeningMessage } from "../bin/prompt-mirror-core.mjs";
import { doctorFailureExplanation, assessSessionLogDiscipline } from "../bin/agent-handoff-kit.mjs";
import { requiredShortcutTargets } from "../bin/installed-file-contract.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = mkdtempSync(path.join(tmpdir(), "ack-closeout-card-"));
const env = { ...process.env, AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "1" };

try {
  const closeoutPack = readAt(root, "packs/closeout.md");
  assert(closeoutPack.includes("`closeout unavailable` card") && closeoutPack.includes("no CLI card") && closeoutPack.includes("never replaces a returned complete or blocked CLI card"), "closeout unavailable presentation contract is missing or can replace a returned CLI card");
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

  const logPath = path.join(fixtureRoot, "dev", "SESSION_LOG.md");
  const originalLog = readFileSync(logPath, "utf8");
  const withEntries = count => originalLog + Array.from({ length: count }, (_, i) => `\n## 2026-10-03 Session ${i + 1}\n\nFixture trace.\n`).join("");
  const withLines = count => originalLog + "\n".repeat(count - originalLog.split("\n").length);
  for (const [label, text, shouldBlock, warning] of [
    ["ten entries remain below the archive trigger", withEntries(10), false, ""],
    ["eleven entries require maintenance", withEntries(11), true, "entry count = 11"],
    ["twenty-five entries cannot complete closeout", withEntries(25), true, "entry count = 25"],
    ["1499 lines remain below the safety trigger", withLines(1499), false, ""],
    ["1500 lines remain below the safety trigger", withLines(1500), false, ""],
    ["1501 lines require maintenance", withLines(1501), true, "line count = 1501"]
  ]) {
    writeFileSync(logPath, text, "utf8");
    const assessment = await assessSessionLogDiscipline(fixtureRoot);
    assert(assessment.ok === !shouldBlock, `${label}: shared maintenance assessment differs`);
    const dailyDoctor = invoke(["bin/agent-handoff-kit.mjs", "doctor", "--root", fixtureRoot], label + " daily doctor");
    assert(dailyDoctor.stdout.includes(`SESSION_LOG 接力角色紀律: ${shouldBlock ? "warn" : "ok"}`), `${label}: ordinary doctor lost its advisory result`);
    const result = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], { cwd: root, encoding: "utf8", env });
    assert(!result.error && result.status === (shouldBlock ? 1 : 0), `${label}: unexpected closeout exit\n${result.stdout}`);
    assert(result.stdout.includes(`status: ${shouldBlock ? "blocked" : "complete"}`), `${label}: closeout state is wrong`);
    if (shouldBlock) {
      assert(result.stdout.includes("SESSION_LOG maintenance checks") && result.stdout.includes(warning), `${label}: maintenance cause or measured trigger was hidden`);
      assert(!result.stdout.includes("handoff saved"), `${label}: maintenance falsely claimed saved`);
    }
    assert(readFileSync(logPath, "utf8") === text, `${label}: read-only check changed the log`);
  }
  // An interrupted archive may leave a copy, while the active log is still due.
  const archivePath = path.join(fixtureRoot, "dev", "SESSION_LOG_archive");
  mkdirSync(archivePath);
  writeFileSync(path.join(archivePath, "archive_partial.md"), withEntries(11), "utf8");
  writeFileSync(logPath, withEntries(11), "utf8");
  const interrupted = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], { cwd: root, encoding: "utf8", env });
  assert(!interrupted.error && interrupted.status === 1 && interrupted.stdout.includes("SESSION_LOG maintenance checks"), "partial archive copy hid the still-overdue active log");
  writeFileSync(logPath, originalLog, "utf8");
  assertCloseoutComplete(complete, "maintenance recovery after active log readback");
  console.log("ok: ordinary doctor remains advisory; closeout enforces the shared entry/line maintenance triggers and interrupted maintenance stays blocked");

  const shortcutPath = path.join(fixtureRoot, requiredShortcutTargets[0]);
  const shortcutBytes = readFileSync(shortcutPath);
  rmSync(shortcutPath);
  const missingShortcut = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", fixtureRoot], { cwd: root, encoding: "utf8", env });
  assert(!missingShortcut.error && missingShortcut.status === 1, "missing shortcut passed doctor");
  assert(missingShortcut.stdout.includes("project shortcuts failed") && missingShortcut.stdout.includes("專案快捷入口缺少或內容不一致。") && missingShortcut.stdout.includes("upgrade --dry-run"), "shortcut diagnosis omitted its real cause or repair route");
  assert(!missingShortcut.stdout.includes("下次開工提示副本與 handoff 真源不同。") && !missingShortcut.stdout.includes("prompt mirror checks:"), "shortcut failure was misreported as an unrun mirror check");
  writeFileSync(shortcutPath, shortcutBytes);
  assert(!doctorFailureExplanation("unknown future check").includes("提示副本"), "unknown failure kind guessed a mirror defect");
  assert(doctorFailureExplanation("prompt mirror checks").includes("提示副本"), "actual mirror failure lost its specific explanation");
  console.log("ok: missing shortcuts and unknown failure kinds cannot be mislabeled as mirror failures");

  for (const [label, text, reason] of [
    ["stale snapshot declaration", complete.replace("Stale snapshots left in this handoff: no", "Stale snapshots left in this handoff: yes"), "stale snapshots"],
    ["next-step declaration is negative", complete.replace("Recommended next step is explicit and reasoned: yes", "Recommended next step is explicit and reasoned: no"), "recommended next step"],
    ["opening declaration is negative", complete.replace("Opening message matches current state: yes", "Opening message matches current state: no"), "opening message"],
    ["fenced declaration is not a confirmation", complete.replace("- Opening message matches current state: yes", "~~~~\n- Opening message matches current state: yes\n~~~~"), "opening message"],
    ["duplicate declaration is not a confirmation", complete.replace("<!-- ack:field:stale-snapshots-left -->", "<!-- ack:field:stale-snapshots-left -->\n- Stale snapshots left in this handoff: no\n<!-- ack:field:stale-snapshots-left -->"), "stale snapshots"]
  ]) {
    writeFixtureHandoff(text);
    const result = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], { cwd: root, encoding: "utf8", env });
    assert(!result.error && result.status === 1 && result.stdout.includes("status: blocked") && result.stdout.includes(reason), `${label} did not block closeout with its real cause\n${result.stdout}`);
    assert(!result.stdout.includes("handoff saved") && readAt(fixtureRoot, "dev/SESSION_HANDOFF.md") === text, `${label} changed state or falsely claimed saved`);
  }
  const nextStep = "Recommended next step: Resume from the opening message — reason: this fixture verifies resumable continuity.";
  const nextPriorities = `${nextStep}\n\n1. follow-up scope — monitor only if a new reproducible failure occurs.`;
  const replacePriorities = (value) => complete.replace(nextPriorities, value);
  assertCloseoutComplete(complete.replace("Opening message matches current state: yes", "Opening message matches current state: 已確認"), "Chinese affirmative declaration");
  for (const [label, narrative] of [
    ["original native invitation repro", "Recommended next step: read `docs/source-note.md` and verify the event date before drafting — reason: the invitation must not state an unverified date."],
    ["ordinary English prose", "Read the supplier record first. Its date determines the next delivery notice."],
    ["ordinary Traditional Chinese prose", "先讀取採購紀錄；當中的日期會決定下一步通知。"],
    ["yes/no user decision", "The user must decide yes or no: publish the record now, or wait for the scheduled review."],
    ["honest blocker", "The required attachment is unavailable. Request it before performing the dependent review."],
    ["English action begins with unconfirmed dependency", "Recommended next step: unconfirmed supplier contact must be verified in the procurement register — reason: release the purchase order only after the contact is verified."],
    ["Traditional Chinese reason contains unverified data", "Recommended next step: 讀取採購紀錄並核對供應商資料 — reason: 訂單不可引用未核實的聯絡資料。"]
  ]) {
    assertCloseoutComplete(complete.replace(nextStep, narrative), label);
  }
  assertCloseoutComplete(replacePriorities("- Read the supplier record before drafting the next delivery notice."), "ordinary Markdown bullet priority");
  for (const [label, text] of [
    ...["否", "未確認", "待確認", "已", "已確認，仍未解決", "已確認，但尚未確認來源", "", "TBD"].map((value) => ["unconfirmed Chinese opening: " + value, complete.replace("Opening message matches current state: yes", "Opening message matches current state: " + value)]),
    ["missing Next Priorities section", complete.replace(`<!-- ack:section:next-priorities -->\n## Next Priorities\n\n${nextPriorities}\n`, "")],
    ["empty Next Priorities", replacePriorities("")],
    ["single placeholder priority", replacePriorities("TBD")],
    ["only placeholder priorities", replacePriorities("TBD\n<next priority>\n待確認")],
    ...["1. TBD", "+ TBD", "**TBD**", "---", "### TBD", "Recommended next step: TBD — reason: TBD"].map((value) => ["Markdown or template placeholder priority: " + value, replacePriorities(value)]),
    ["fenced priority example only", replacePriorities("~~~~markdown\nExample: review the source record.\n~~~~")],
    ["comment priority example only", replacePriorities("<!-- Example: review the source record. -->")],
    ["indented priority example only", replacePriorities("    Example: review the source record.")]
  ]) {
    writeFixtureHandoff(text);
    const result = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], { cwd: root, encoding: "utf8", env });
    assert(!result.error && result.status === 1 && result.stdout.includes("status: blocked"), `${label} falsely completed closeout`);
    assert(readAt(fixtureRoot, "dev/SESSION_HANDOFF.md") === text, `${label} changed its source packet`);
  }
  console.log("ok: localized lifecycle declarations and visible non-placeholder priorities pass without narrative-grammar proof; empty, placeholder-only and hidden examples reject");
  assertCloseoutComplete(complete, "reconciled declarations recover");
  console.log("ok: stale snapshots, missing/placeholder priorities and unconfirmed opening state cannot complete closeout");

  assertCloseoutComplete(complete.replace("Git root: no Git repository (fixture root)", "Git root: not_applicable — workspace-health reports git: no, no .git metadata found."), "literal workspace-health no-Git evidence with explanation");
  const naturalNoGit = complete
    .replace("Git root: no Git repository (fixture root)", "Git root: not applicable — no `.git` metadata found")
    .replace("Branch: not_applicable - no Git repository", "Branch: not applicable")
    .replace("Commit: not_applicable - no Git repository", "Commit: not applicable");
  assertCloseoutComplete(naturalNoGit, "natural-language non-Git workspace identity");
  for (const noGit of ["none (workspace-health: no .git metadata found)", "not_applicable; checked at closeout", "n/a — fixture has no repository"]) {
    assertCloseoutComplete(complete.replace("Git root: no Git repository (fixture root)", `Git root: ${noGit}`), "absent Git identity with explanation");
  }
  assertCloseoutComplete(complete.replace("Answer: yes", "Answer: yes, packet reconstructed; future reception remains required").replace("history: yes", "history: yes, once received with task authorization"), "affirmative packet sufficiency with reception boundary");
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

  // Completion applies to its assertion, not every topic mentioned in the same
  // paragraph. These truthful limitations must not require magic prefixes.
  const scopedLifecycleCases = [
    ["completed paragraph preserves a limitation", "Completed local report routing. Technical acceptance review remains LIMITED.", "Technical acceptance review remains LIMITED; non-blocking for local routing."],
    ["Chinese completed paragraph preserves a limitation", "本機報告路由已完成；正式技術接納仍未通過。", "正式技術接納仍未通過；不阻擋本機路由。"],
    ["mixed risk paragraph repeats a completed fact", "Local report routing is complete.", "Local report routing is complete; technical acceptance remains LIMITED."],
    ["shared project is not shared acceptance", "Completed Aurora monthly report local routing.", "Aurora monthly report technical acceptance remains LIMITED."],
    ["negated technical verification", "Completed local report routing; public website verification was not completed.", "Public website verification remains pending."],
    ["comma separated qualification", "Completed local report routing, but technical acceptance review remains LIMITED.", "Technical acceptance review remains LIMITED."],
    ["temporal qualifier is substantive scope", "Completed export acceptance before the data migration.", "Export acceptance after the data migration remains pending."],
    ["dash qualifier is substantive scope", "Completed export acceptance — staging.", "Export acceptance — production remains pending."],
  ];
  for (const [label, done, risk] of scopedLifecycleCases) {
    assertCloseoutComplete(replaceRisksLine(insertCompletedLine(complete, done), risk), label);
  }
  assertCloseoutComplete(replaceRisksLine(complete.replace(
    "fixture closeout state and read-back passed.",
    "Technical acceptance review is incomplete."
  ), "Technical acceptance review is incomplete."), "incomplete is not complete in QC");

  for (const [label, done, risk] of [
    ["same acceptance unfinished", "Technical acceptance review completed.", "Technical acceptance review remains incomplete."],
    ["nonblocking does not erase contradiction", "Completed technical acceptance review.", "Technical acceptance review remains incomplete; non-blocking for local routing."],
    ["separate limitation does not erase contradiction", "Completed local report routing; technical acceptance review remains LIMITED.", "Local report routing remains incomplete; technical acceptance review remains LIMITED."],
    ["Chinese true contradiction", "正式技術接納已通過。", "正式技術接納仍未通過。"],
    ["unrelated no-blocker claim does not erase contradiction", "Completed technical acceptance review.", "No blockers remain for local routing; technical acceptance review remains incomplete."],
    ["unrelated reclassification does not erase contradiction", "Completed technical acceptance review.", "Monitor-only local routing — trigger: a new route failure; technical acceptance review remains incomplete."]
  ]) assertLifecycleBlocked(replaceRisksLine(insertCompletedLine(complete, done), risk), label);
  for (const [label, done, risk] of [
    ["unresolved status", "Completed technical acceptance review.", "Technical acceptance review remains unresolved."],
    ["completion without errors", "Completed technical acceptance review without errors.", "Technical acceptance review remains pending."],
    ["successful completion adverb", "Completed technical acceptance review successfully.", "Technical acceptance review remains pending."]
  ]) assertLifecycleBlocked(replaceRisksLine(insertCompletedLine(complete, done), risk), label);
  assertLifecycleBlocked(replaceRisksLine(complete.replace("fixture closeout state and read-back passed.", "Technical acceptance review: PASS."), "Technical acceptance review remains pending."), "QC PASS is affirmative");
  assertLifecycleBlocked(insertCompletedLine(complete, "Completed technical acceptance review.").replace("1. follow-up scope — monitor only if a new reproducible failure occurs.", "1. Continue technical acceptance review next session."), "next-session timing does not change scope");
  // Metamorphic coverage: changing the domain/identifier cannot change the
  // decision; changing the acceptance scope must. No product-specific bypass.
  for (const [entity, finishedScope, pendingScope] of [
    ["Quartz dataset v2.4", "schema validation", "retention audit"],
    ["Cedar photo catalogue", "thumbnail generation", "copyright review"],
    ["Orion warehouse console", "offline simulation", "onsite commissioning"]
  ]) {
    for (const state of ["pending", "incomplete", "LIMITED"]) {
      const done = `Completed ${entity} ${finishedScope}.`;
      assertCloseoutComplete(replaceRisksLine(insertCompletedLine(complete, done), `${entity} ${pendingScope} remains ${state}.`), `${entity}: distinct scope ${state}`);
      assertLifecycleBlocked(replaceRisksLine(insertCompletedLine(complete, done), `${entity} ${finishedScope} remains ${state}.`), `${entity}: same scope ${state}`);
    }
  }
  console.log("ok: lifecycle completion and limitations are assertion-scoped; real contradictions still block");

  const openingContinuation = insertOpeningLine(
    insertCompletedLine(complete, "Completed Doc\\01_報告 latest draft final review before delivery."),
    "Continue Doc\\01_報告 latest draft final review before delivery."
  );
  writeFixtureHandoff(openingContinuation);
  const openingContinuationRejected = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], { cwd: root, encoding: "utf8", env });
  assert(!openingContinuationRejected.error && openingContinuationRejected.status !== 0, "opening continuation conflict produced a successful closeout card");
  assert(openingContinuationRejected.stdout.includes("handoff lifecycle read-back is not healthy"), "opening continuation conflict omitted lifecycle blocker");
  assertLifecycleBlocked(insertOpeningLine(insertCompletedLine(complete, "Completed technical acceptance review."), "Local report routing is complete; continue technical acceptance review."), "opening directive after completed context");
  assertLifecycleBlocked(replaceRisksLine(insertCompletedLine(complete, "Completed export acceptance before the data migration."), "Export acceptance before the data migration remains pending."), "same temporal scope still conflicts");

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

  // A no-repository explanation must never disguise a real branch mismatch.
  const git = args => {
    const result = spawnSync("git", ["-c", "core.hooksPath=" + path.join(fixtureRoot, ".no-hooks"), "-C", fixtureRoot, ...args], { encoding: "utf8", env });
    assert(!result.error && result.status === 0, `local Git fixture failed: ${result.stderr}`);
    return result.stdout.trim();
  };
  git(["init", "-b", "main", "--quiet"]);
  git(["-c", "user.name=QA Fixture", "-c", "user.email=qa@example.invalid", "-c", "commit.gpgsign=false", "commit", "--allow-empty", "-m", "isolated fixture", "--quiet"]);
  const gitPacket = complete
    .replace("Git root: no Git repository (fixture root)", `Git root: ${fixtureRoot}`)
    .replace("Branch: not_applicable - no Git repository", "Branch: main")
    .replace("Commit: not_applicable - no Git repository", `Commit: ${git(["rev-parse", "HEAD"])}`)
    .replace("Worktree / parallel workspace status: not_applicable - no Git repository", "Worktree / parallel workspace status: one registered fixture worktree")
    .replace("Uncommitted changes summary: not_applicable - no Git repository", "Uncommitted changes summary: untracked fixture files");
  assertCloseoutComplete(gitPacket, "real Git fixture with matching branch");
  for (const branch of ["none (release branch)", "not_applicable; named branch", "n/a — named branch"]) {
    writeFixtureHandoff(gitPacket.replace("Branch: main", `Branch: ${branch}`));
    const mismatch = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], { cwd: root, encoding: "utf8", env });
    assert(!mismatch.error && mismatch.status !== 0 && mismatch.stdout.includes("handoff branch does not match live branch"), "absence-like branch name hid a real branch mismatch");
  }
  git(["branch", "-m", "none"]);
  assertCloseoutComplete(gitPacket.replace("Branch: main", "Branch: none (release branch)"), "matching real branch named none with explanation");
  console.log("ok: explanatory no-Git root values cannot hide mismatched real Git branch names");
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

function assertLifecycleBlocked(text, label) {
  writeFixtureHandoff(text);
  const before = readAt(fixtureRoot, "dev/SESSION_HANDOFF.md");
  const result = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], { cwd: root, encoding: "utf8", env });
  assert(!result.error && result.status !== 0 && result.stdout.includes("handoff lifecycle read-back is not healthy"), `${label} was not blocked by lifecycle read-back\n${result.stdout}`);
  assert(!result.stdout.includes("handoff saved"), `${label} falsely claimed saved`);
  assert(before === readAt(fixtureRoot, "dev/SESSION_HANDOFF.md"), `${label} mutated the handoff`);
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
