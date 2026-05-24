#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
  const version = packageJson.version;
  assert(version && /^\d+\.\d+\.\d+$/.test(version), "package version missing or malformed (expected semver e.g. 0.1.8)");
  assert(JSON.stringify(packageJson.files) === JSON.stringify(["bin/", "runtime-core/", "packs/", "docs/whatsnew/", "README.md", "LICENSE"]), "npm package files boundary changed");
  assert(packageJson.scripts["qa:prototype"], "qa:prototype script is missing");
  assert(packageJson.scripts["qa:packs"], "qa:packs script is missing");
  assert(packageJson.scripts["qa:upgrade"], "qa:upgrade script is missing");
  assert(packageJson.scripts["qa:release"], "qa:release script is missing");

  runQaScript("check-public-prototype.mjs", "prototype QA");
  runQaScript("check-pack-scenarios.mjs", "pack scenario QA");
  runQaScript("check-upgrade-safety.mjs", "upgrade safety QA");

  const pack = runNpm(["pack", "--dry-run"], "npm package release dry-run");
  const packText = outputText(pack);
  assert(packText.includes("total files: 30"), "npm dry-run did not report expected 30 package files (v0.3.6+ includes docs/whatsnew/v0.3.1.md through v0.3.6.md)");
  assert(!packText.includes("docs/qa/"), "QA docs entered npm package");
  assert(!packText.includes("scripts/"), "source QA scripts entered npm package");
  assert(!packText.includes("test-fixtures/"), "test fixtures entered npm package");
  assert(!existsSync(path.join(root, `adamchanadam-agent-handoff-kit-${version}.tgz`)), "npm dry-run left a tarball behind");

  assertIncludes("README.md", [
    `目前版本為 \`v${version}\``,
    "AI Session 之間的接力棒",
    "AI 跨對話失憶",
    "https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-intro.html",
    "請特別留意：那一段不是給 Terminal 的指令",
    "START_NEXT_SESSION_PROMPT.txt",
    "## 它解決甚麼問題",
    "## 三步上手",
    "## 工作模式",
    "必讀資料",
    "收工",
    "wrap up",
    "handoff",
    "## 項目決策日誌",
    "dev/PROJECT_DECISIONS.md",
    "## 外部工具治理",
    "機密分離原則"
  ]);

  assertIncludes("CHANGELOG.md", [
    `## v${version} — `,
    "RULE_PACKS.md",
    "upgrade --dry-run",
    "自訂 row",
    "表頭已被改動",
    "`conflict` 停手",
    "## v0.3.2 — 2026-05-23",
    "user journey UX 改進",
    "項目狀態速覽",
    "## v0.3.1 — 2026-05-23",
    "CLI messaging gap fix",
    "plan-time upgrade no-op detection",
    "## v0.3.0 — 2026-05-22",
    "## v0.1.7 — 2026-05-20",
    "## v0.1.6 — 2026-05-20",
    "## v0.1.5 — 2026-05-20",
    "## v0.1.4 — 2026-05-20",
    "已 npm publish",
    "## v0.1.3 — 2026-05-19",
    "## v0.1.2 — 2026-05-19",
    "修正 `v0.1.1` package README",
    "## v0.1.1 — 2026-05-19",
    "正式發佈版本",
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
    `v${version} 發佈狀態`,
    "v0.1.2 發佈狀態",
    "v0.1.7 發佈狀態",
    "v0.1.6 發佈狀態",
    `npm latest 為 \`${version}\``,
    "v0.1.5 發佈狀態",
    "v0.1.4 發佈狀態",
    "v0.1.3 發佈狀態",
    "v0.1.1 發佈狀態",
    "v0.1.0 已發佈狀態",
    "發佈後仍需驗證",
    "不得因 `v0.1.0` 已發佈而宣稱",
    "安裝後指示驗收",
    "不是在 Terminal 繼續輸入",
    "治理 QA 缺口矩陣",
    "產品級發佈前全面檢",
    "Product Journey Matrix",
    "QC Gap Backflow",
    "產品旅程矩陣",
    "執行落差",
    "技能／子代理流程仲裁驗收",
    "技能流程覆蓋",
    "PROJECT_DECISIONS 結構驗收",
    "Project Decisions Discipline Sweep",
    "Release Artifact Vocabulary Sweep",
    "R-028 project narrative discipline",
    "Onboarding Pack 結構驗收 (R-029)",
    "Onboarding Pack Discipline Sweep（R-029",
    "Onboarding UX discipline（R-029）",
    "Cross-surface wording consistency 驗收 (R-029.1",
    "Cross-surface Wording Consistency Sweep",
    "Cross-surface wording alignment（R-029.1",
    "Routing table propagation discipline（R-029.2",
    "CLI 場景分流（scenario branching）一致性（R-031.1",
    "CLI Scenario Branching Coverage Sweep（R-031.1",
    "v0.3.1 發佈狀態",
    "v0.3.2 發佈狀態",
    "v0.3.5 發佈狀態",
    "v0.3.4 發佈狀態",
    "交接生命週期一致性",
    "Handoff Lifecycle Consistency Sweep",
    "Cross-mind evidence 9-trigger table",
    "v0.3.3 發佈狀態"
  ]);

  assertIncludes("runtime-core/AGENTS.core.md", [
    "Detect end-of-session or handoff intent",
    "next-session opening message",
    "dev/RULE_PACKS.md",
    "Reachable is not the same as ingested",
    "Do not treat unread sources as absent",
    "External skill flows, subagents, task plans",
    "do not replace this loop",
    "active project root",
    "ack:section:*",
    "State Reconciliation Check",
    "handoff lifecycle consistency",
    "Do not append a new state snapshot",
    "R-010 SESSION_LOG handoff-role discipline",
    "Advance the SESSION_LOG N-rule",
    "dev/SESSION_LOG_archive/INDEX.md",
    "Maintain `dev/PROJECT_DECISIONS.md`",
    "R-028 project narrative discipline",
    "Evolution Timeline",
    "Decisions Archive",
    "Architecture Choices",
    "Insights & Learnings",
    "first-time-user signals (R-029)",
    "onboarding signal keywords",
    "dev/rules/onboarding.md",
    "transient pack",
    "startup availability probe",
    "R-030 Integration governance discipline",
    "dev/rules/integrations.md",
    "Credential separation"
  ]);

  assertIncludes("runtime-core/PROJECT_INDEX.md", [
    "## Installed Integrations",
    "機密分離原則",
    "### Connectors",
    "### MCPs",
    "### Plugins",
    "### Skills",
    "### Source-of-truth Architecture",
    "`via`"
  ]);

  assertIncludes("runtime-core/SESSION_HANDOFF.md", [
    "Installed Integrations registry",
    "availability probe",
    "ack:field:lifecycle-conflicts-resolved"
  ]);

  assertIncludes("runtime-core/RULE_PACKS.md", [
    "dev/rules/integrations.md",
    "Connector-first default",
    "credential separation"
  ]);

  assertIncludes("packs/integrations.md", [
    "Integrations Pack",
    "機密分離原則",
    "Connectors（Anthropic 官方 vetted）",
    "MCPs（community / custom）",
    "Plugins（Claude Code plugin bundle）",
    "Skills（SKILL.md instruction set）",
    "Source-of-truth Architecture",
    "Cross-session Lifecycle",
    "Connector-first default"
  ]);

  assertIncludes("packs/knowledge.md", [
    "Connector-first default",
    "R-030 Integration governance discipline",
    "Backward-compat"
  ]);

  assertIncludes("packs/safety.md", [
    "Differentiate three layers of external access",
    "Anthropic-vetted Connectors",
    "Community / custom MCP servers",
    "Credential leak prevention",
    "Recognize common credential prefixes"
  ]);

  assertIncludes("packs/onboarding.md", [
    "Scenario F. 審視已裝外部工具",
    "Step F.1 — Intake",
    "Step F.2 — 機密分離 brief",
    "Step F.3 — Source-of-truth Architecture mapping",
    "Step F.4 — 寫入項目登記表",
    "Step F.5 — Verify availability",
    "順便：你 Claude Code"
  ]);

  assertIncludes("runtime-core/SESSION_LOG.md", [
    "Handoff role",
    "trace-back / audit trail layer",
    "R-010 SESSION_LOG handoff-role discipline"
  ]);

  assertIncludes("bin/agent-handoff-kit.mjs", [
    "assessSessionLogDiscipline",
    "R-010 SESSION_LOG handoff-role discipline",
    "SESSION_LOG 接力角色紀律",
    "runtime-core/PROJECT_DECISIONS.md",
    "dev/PROJECT_DECISIONS.md",
    "project decisions log structure",
    "packs/onboarding.md",
    "dev/rules/onboarding.md",
    "onboarding pack structure (新手引導包)",
    "packs/integrations.md",
    "dev/rules/integrations.md",
    "integrations pack structure (外部工具治理)",
    "checkInstalledIntegrationsCredentialLeak",
    "assessHandoffLifecycleConsistency"
  ]);

  const install = run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", tempRoot], "release user-flow install");
  assert(install.stdout.includes("安裝完成：下一步請在 AI 對話中操作"), "install output missing AI-chat next-step heading");
  assert(install.stdout.includes("請注意：下面文字不是 Terminal 指令。"), "install output does not warn that next text is not a Terminal command");
  assert(!install.stdout.includes("next: Follow AGENTS.md"), "install output still contains misleading old next line");
  const doctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", tempRoot], "release user-flow doctor");
  assert(doctor.stdout.includes("status: passed"), "doctor did not pass in release user-flow check");
  assert(doctor.stdout.includes("✅ 檢查通過"), "doctor output missing beginner-friendly passed message");
  assert(doctor.stdout.includes("schema checks:"), "doctor did not run schema checks");
  assert(doctor.stdout.includes("dev/SESSION_HANDOFF.md (handoff required sections)"), "doctor did not check handoff schema");
  assert(doctor.stdout.includes("dev/PROJECT_INDEX.md (project index tables)"), "doctor did not check project index schema");
  assert(doctor.stdout.includes("dev/RULE_PACKS.md (rule pack router coverage)"), "doctor did not check rule pack router schema");
  assert(doctor.stdout.includes("dev/PROJECT_DECISIONS.md (project decisions log structure)"), "doctor did not check PROJECT_DECISIONS schema (R-028)");
  assert(doctor.stdout.includes("dev/rules/onboarding.md (onboarding pack structure (新手引導包))"), "doctor did not check onboarding pack schema");
  assert(doctor.stdout.includes("dev/rules/integrations.md (integrations pack structure (外部工具治理))"), "doctor did not check integrations pack schema (R-030 v0.3.0+)");
  assert(doctor.stdout.includes("SESSION_LOG 接力角色紀律: ok"), "doctor did not run SESSION_LOG discipline check, or fresh install triggered an unexpected warning");
  assert(doctor.stdout.includes("Credential 機密分離 sweep: ok"), "doctor did not run credential leak sweep (R-030 v0.3.0+)");

  const installedHandoff = readAt(tempRoot, "dev/SESSION_HANDOFF.md");
  const installedLog = readAt(tempRoot, "dev/SESSION_LOG.md");
  const installedPrompt = readAt(tempRoot, "START_NEXT_SESSION_PROMPT.txt");
  assert(installedHandoff.includes("📋 Next session: copy and paste the whole block below"), "installed handoff missing copy marker");
  assert(installedHandoff.includes("```text"), "installed handoff missing fenced text block");
  assert(normalizePrompt(installedPrompt) === normalizePrompt(extractOpeningMessage(installedHandoff)), "installed START_NEXT_SESSION_PROMPT.txt does not match handoff opening message");
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

  // R-026 Release Artifact Vocabulary Sweep — forbidden vocabulary must not appear in
  // user-facing release artifacts. CHANGELOG is bounded to the latest version section
  // because historical entries may legitimately mention the forbidden phrases (e.g. v0.1.4
  // history records when the phrase "人話解讀" was added before being later retired).
  const r026Forbidden = [/人話解讀/, /人話補一句/, /人話解釋/];
  checkForbiddenVocabulary("README.md", read("README.md"), r026Forbidden);
  checkForbiddenVocabulary("agent-handoff-kit-intro.html", read("agent-handoff-kit-intro.html"), r026Forbidden);
  checkForbiddenVocabulary("agent-handoff-kit-guide.html", read("agent-handoff-kit-guide.html"), r026Forbidden);
  checkForbiddenVocabularyInChangelogLatestSection(read("CHANGELOG.md"), r026Forbidden);

  // v0.2.2 R-029.4: Internal reference ID sweep. v2-specific governance IDs (R-XXX) and
  // step numbering ("closeout step N") and discipline jargon ("strict mechanical") must
  // not appear on user-facing surfaces. v0.2.0 + v0.2.1 release shipped with R-028 / R-029 /
  // R-010 etc explicit IDs leaking into onboarding HTML — these are maintainer-only
  // governance references that have no meaning to end users. v0.2.2 patches this by
  // extending R-026 forbidden vocabulary scope to include internal jargon patterns,
  // permanently enforced across user-facing surfaces. CHANGELOG historical sections
  // and the v0.2.2 release notes itself naturally reference R-029.4 + earlier R-XXX
  // IDs as part of the release narrative, so the latest CHANGELOG section is excluded
  // from this sweep (R-026 anchor-bounded pattern reused).
  const internalReferenceForbidden = [/R-\d{3}/, /closeout step \d+/, /strict mechanical/i];
  checkForbiddenVocabulary("README.md", read("README.md"), internalReferenceForbidden);
  checkForbiddenVocabulary("agent-handoff-kit-intro.html", read("agent-handoff-kit-intro.html"), internalReferenceForbidden);
  checkForbiddenVocabulary("agent-handoff-kit-guide.html", read("agent-handoff-kit-guide.html"), internalReferenceForbidden);

  // R-030 v0.3.0+: Internal "v2 / advanced user path" jargon must not appear on user-facing surfaces.
  const v2JargonForbidden = [/v2 (的|嘅) advanced user path/, /v2 advanced user path/];
  checkForbiddenVocabulary("agent-handoff-kit-intro.html", read("agent-handoff-kit-intro.html"), v2JargonForbidden);
  checkForbiddenVocabulary("agent-handoff-kit-guide.html", read("agent-handoff-kit-guide.html"), v2JargonForbidden);

  // R-030 v0.3.0+ cross-callout wording assertion retired in v0.3.1:
  // The 2026-05-23 R-031 guide.html rewrite simplified the hero + Case A Step 2 narrative
  // and removed the shared "兩種開工方式" anchor in favour of context-aware plain-language
  // framing per the R-031 surface document output principle (HUMAN_DOCUMENT_GOVERNANCE).
  // Cross-surface canonical phrase consistency is still enforced below by
  // checkCrossSurfaceWordingConsistency() for the R-029 trigger phrase across 4 surfaces.

  // R-030 v0.3.0+: Credential leak prevention sweep over runtime-core template files.
  const credentialLeakPatterns = [
    /sk-ant-[A-Za-z0-9_-]{20,}/,
    /\bsk-[A-Za-z0-9_-]{20,}/,
    /\bntn_[A-Za-z0-9_-]{40,}/,
    /\bsecret_[A-Za-z0-9_-]{40,}/,
    /\bya29\.[A-Za-z0-9_-]{20,}/,
    /\b1\/\/[A-Za-z0-9_-]{30,}/,
    /\bxox[abprs]-[A-Za-z0-9-]{10,}/,
    /\bghp_[A-Za-z0-9]{36}/,
    /\bgho_[A-Za-z0-9]{36}/,
    /\bghs_[A-Za-z0-9]{36}/,
    /\bgithub_pat_[A-Za-z0-9_]{20,}/,
    /\bsl\.[A-Za-z0-9_-]{50,}/,
    /\bAKIA[A-Z0-9]{16}/,
    /\bAIza[A-Za-z0-9_-]{35}/
  ];
  checkForbiddenVocabulary("runtime-core/PROJECT_INDEX.md", read("runtime-core/PROJECT_INDEX.md"), credentialLeakPatterns);
  checkForbiddenVocabulary("runtime-core/SESSION_HANDOFF.md", read("runtime-core/SESSION_HANDOFF.md"), credentialLeakPatterns);

  // Onboarding HTML book-language discipline — Cantonese spoken characters must not appear
  // in user-facing HTML (Wording style: 繁體中文書面語). Triggers if any of the listed
  // characters appear outside explicitly allowed contexts.
  const cantoneseSpokenChars = /[嘅咁喺揀唔乜啱嚟咗嗰]/g;
  checkBookLanguage("agent-handoff-kit-intro.html", read("agent-handoff-kit-intro.html"), cantoneseSpokenChars);
  checkBookLanguage("agent-handoff-kit-guide.html", read("agent-handoff-kit-guide.html"), cantoneseSpokenChars);

  // R-029.1 v0.2.1: Cross-surface wording consistency sweep. The R-029 onboarding trigger
  // phrase must appear identically across all user-facing surfaces (CLI post-install output
  // + README + onboarding HTML) so first-time users see the same prompt regardless of which
  // surface they encounter first. v0.2.0 release shipped with inconsistency (CLI output used
  // legacy "Read AGENTS.md and follow it..." while R-029 callouts used "help me start") —
  // v0.2.1 patches this by enforcing a single canonical trigger phrase.
  checkCrossSurfaceWordingConsistency();

  // R-031.1 v0.3.1+: CLI Scenario Branching Coverage Sweep. Real-invoke bin in 5
  // automated scenarios (install fresh / upgrade no-op / upgrade metadata-only stale /
  // upgrade structurally stale / doctor healthy & latest) and assert must-have /
  // must-not-have output patterns per scenario contract.
  checkScenarioBranchingDocAlignment();
  simulateScenarioBranching();

  console.log("");
  console.log("Agent Handoff Kit release readiness QA passed");
  console.log(`user-flow root: ${tempRoot}`);
}

function checkCrossSurfaceWordingConsistency() {
  const canonicalTriggerPhrase = "I just installed agent-handoff-kit. Help me get started.";
  const surfaces = [
    { file: "bin/agent-handoff-kit.mjs", role: "CLI printInstallNextSteps" },
    { file: "README.md", role: "README first-screen R-029 callout + 三步上手 step 2" },
    { file: "agent-handoff-kit-intro.html", role: "intro #howto Step 2 + #recap cell 1" },
    { file: "agent-handoff-kit-guide.html", role: "guide hero R-029 callout" }
  ];
  for (const surface of surfaces) {
    const text = read(surface.file);
    if (!text.includes(canonicalTriggerPhrase)) {
      throw new Error(`Cross-surface wording inconsistency (R-029.1): canonical R-029 trigger phrase missing in ${surface.file} (${surface.role}). Expected phrase: "${canonicalTriggerPhrase}"`);
    }
    console.log(`ok: ${surface.file} cross-surface R-029 trigger phrase`);
  }
}

function checkScenarioBranchingDocAlignment() {
  const qaDoc = read("docs/qa/release-grade-qa.md");
  const rows = [
    {
      id: "1",
      snippets: [
        "install fresh",
        "安裝完成",
        "I just installed agent-handoff-kit. Help me get started.",
        "請注意：下面文字不是 Terminal 指令",
        "升級完成",
        "你已經是最新版本"
      ]
    },
    {
      id: "2",
      snippets: [
        "install with conflict",
        "conflict",
        "migration report",
        "工具已停手，沒有覆寫",
        "全部通過"
      ]
    },
    {
      id: "3a",
      snippets: [
        "upgrade metadata-only stale",
        "升級完成",
        "metadata 更新紀錄",
        "template version metadata 更新為當前版本",
        "doctor self-check 不再提示項目版本未對齊",
        "你已經是最新版本，沒有檔案需要建立或合併",
        "安裝完成",
        "I just installed agent-handoff-kit. Help me get started."
      ]
    },
    {
      id: "3b",
      snippets: [
        "upgrade structurally stale",
        "升級完成",
        "進行中的工作對話已熟悉 Agent Handoff Kit 可繼續使用原本開工方式",
        "I just upgraded agent-handoff-kit",
        "template version metadata 更新為當前版本",
        "安裝完成",
        "I just installed agent-handoff-kit. Help me get started."
      ]
    },
    {
      id: "4",
      snippets: [
        "upgrade no-op",
        "你已經是最新版本，沒有檔案需要建立或合併",
        "output 行數 ≤ 20 行",
        "安裝完成",
        "升級完成",
        "I just installed",
        "I just upgraded",
        "migration report",
        "upgrade self-check"
      ]
    },
    {
      id: "5",
      snippets: [
        "upgrade with conflict",
        "conflict",
        "migration report",
        "工具已停手，沒有覆寫",
        "升級完成"
      ]
    },
    {
      id: "6",
      snippets: [
        "doctor healthy & latest",
        "status: passed",
        "繼續日常使用即可",
        "如要升級到較新版"
      ]
    },
    {
      id: "7",
      snippets: [
        "doctor healthy with newer available",
        "maybePrintUpdateNotice",
        "status: passed",
        "doctor 結尾再講一次升級指令"
      ]
    }
  ];

  for (const row of rows) {
    const line = qaDoc.split(/\r?\n/).find((candidate) => candidate.startsWith(`| ${row.id} |`));
    assert(line, `docs/qa/release-grade-qa.md missing scenario ${row.id} row in seven-scenario table`);
    for (const snippet of row.snippets) {
      assert(line.includes(snippet), `docs/qa/release-grade-qa.md scenario ${row.id} row is not aligned with release scenario contract; missing: ${snippet}`);
    }
  }
  assert(qaDoc.includes("場景 1 / 3a / 3b / 4 / 6 為 automated"), "docs/qa/release-grade-qa.md automated simulation scope must list scenario 1 / 3a / 3b / 4 / 6");
  assert(qaDoc.includes("場景 2 / 5 / 7 屬 conditional state"), "docs/qa/release-grade-qa.md human-review scope must list scenario 2 / 5 / 7");
  console.log("ok: docs/qa/release-grade-qa.md seven-scenario table aligned with CLI scenario contract");
}

// R-031.1 v0.3.1+: CLI scenario branching simulation. Real-invoke bin in 5 automated
// scenarios and assert must-have / must-not-have output per scenario contract.
// Scenario 3 is split inline into 3a metadata-only stale and 3b structurally stale
// via a real v0.1.7 fixture, so the upgrade-substantive path is no longer delegated
// to `scripts/check-upgrade-safety.mjs`.
// Scenarios 2 / 5 / 7 (install with conflict / upgrade with conflict / doctor outdated)
// require more elaborate state setup and remain on the human review checklist for now.
function simulateScenarioBranching() {
  console.log("");
  console.log("CLI scenario branching coverage (R-031.1):");
  const env = { ...process.env, AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "1" };
  const tempBase = path.join(tmpdir(), `ack-r0311-${Date.now()}`);
  const currentVersion = JSON.parse(read("package.json")).version;
  const s1Root = path.join(tempBase, "scenario-install-fresh");

  // Scenario 1: install fresh
  // R-031.3 v0.3.3+: must-not-have anchored to "✅ 升級完成：" banner format to avoid
  // false positives from whatsnew historical mentions of "升級完成" in narrative text.
  const s1 = run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", s1Root], "scenario 1 install fresh", { env });
  assertScenarioOutput("scenario 1 (install fresh)", s1.stdout, {
    mustHave: [
      /✅ 安裝完成：/,
      /I just installed agent-handoff-kit\. Help me get started\./,
      /請注意：下面文字不是 Terminal 指令/,
      /如何確認安裝完成/,
      /一組交接檔案/,
      /沒有圖形介面/
    ],
    mustNotHave: [
      /✅ 升級完成：/,
      /你已經是最新版本/,
      /I just upgraded agent-handoff-kit/
    ]
  });

  // Scenario 4: upgrade no-op (re-run upgrade on freshly installed root — already latest)
  const s4 = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", s1Root], "scenario 4 upgrade no-op", { env });
  assertScenarioOutput("scenario 4 (upgrade no-op)", s4.stdout, {
    mustHave: [
      /你已經是最新版本，沒有檔案需要建立或合併/
    ],
    mustNotHave: [
      /✅ 安裝完成：/,
      /✅ 升級完成：/,
      /I just installed agent-handoff-kit\. Help me get started\./,
      /I just upgraded agent-handoff-kit/,
      /migration report:/,
      /upgrade self-check/
    ]
  });
  // Output should be short — no-op short-circuit drops the ceremony.
  const s4LineCount = s4.stdout.split("\n").length;
  if (s4LineCount > 20) {
    throw new Error(`scenario 4 (upgrade no-op) output too long: ${s4LineCount} lines (expected ≤ 20). Short-circuit may have failed; check printUpgradeNoopShortCircuit + isUpgradeNoopAtPlanTime logic in bin.`);
  }
  console.log(`ok: scenario 4 output ${s4LineCount} lines (≤ 20 threshold)`);

  // R-031.3 v0.3.4+: Scenario 3 split into 3a (metadata-only stale) + 3b (structurally
  // stale via real test-fixtures/v0.1.7 fixture) per minimum-correct fix from cross-AI
  // root-fix audit. Old single scenario used `init + rewrite version row` which left
  // structure fully current — never tested the inject-vs-merge ordering bug because
  // PROJECT_INDEX kept its v0.3.x `## Installed Integrations` section, so upgrade plan
  // marked it `skip` not `merge`. Real-user case (Adam v0.3.3 first-test) had both
  // metadata + structure stale; the new 3a + 3b split covers each axis independently.

  // Scenario 3a — metadata-only stale: current init + only rewrite version row.
  // Plan create/merge/conflict all 0. Catches the metadata-only no-op short-circuit
  // bug — without `projectIndexVersionNeedsInject` guard, plan-time short-circuit
  // returns before inject can fire.
  const s3aRoot = path.join(tempBase, "scenario-upgrade-metadata-only");
  const s3aInit = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", s3aRoot], { encoding: "utf8", env, cwd: root });
  if (s3aInit.status !== 0) {
    throw new Error(`Scenario 3a init prep failed: ${s3aInit.stderr || s3aInit.stdout}`);
  }
  const s3aIndexPath = path.join(s3aRoot, "dev/PROJECT_INDEX.md");
  const s3aIndexText = readFileSync(s3aIndexPath, "utf8");
  writeFileSync(
    s3aIndexPath,
    s3aIndexText.replace(
      /\| Agent Handoff Kit template version \| [\d.]+ \|/,
      "| Agent Handoff Kit template version | 0.2.9 |"
    ),
    "utf8"
  );
  const s3a = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", s3aRoot], "scenario 3a upgrade metadata-only stale", { env });
  assertScenarioOutput("scenario 3a (upgrade metadata-only stale)", s3a.stdout, {
    mustHave: [
      /✅ 升級完成：/
    ],
    mustNotHave: [
      // 確認 metadata-only stale case 唔被 plan-time no-op short-circuit 截走
      // 用真正 short-circuit banner format (書面中文「你已經是」) 而非 whatsnew
      // historical mention 嘅廣東口語 wording，防 false positive
      /✅ 結果：你已經是最新版本/,
      // 確認 inject 真正生效，doctor self-check 之後唔再講 root 落後
      /項目內記錄的 Kit 版本與目前工具版本不同/
    ]
  });
  const s3aPostIndex = readFileSync(s3aIndexPath, "utf8");
  const s3aVersionMatch = s3aPostIndex.match(/\| Agent Handoff Kit template version \| ([\d.]+) \|/);
  if (!s3aVersionMatch || s3aVersionMatch[1] !== currentVersion) {
    throw new Error(`scenario 3a post-upgrade: PROJECT_INDEX template version expected v${currentVersion}, got v${s3aVersionMatch?.[1] ?? "missing"}`);
  }
  console.log(`ok: scenario 3a (metadata-only stale) post-upgrade template version = v${s3aVersionMatch[1]}`);

  // Scenario 3b — structurally stale via real test-fixtures/v0.1.7 fixture:
  // PROJECT_INDEX comes from actual v0.1.7 init output, lacks v0.2.0+
  // `## Installed Integrations` section, so upgrade plan marks it for `merge`.
  // Catches the inject-vs-merge ordering bug — without inject-after-merge fix,
  // merge writes mergedText (with v0.1.7 row) AFTER inject, leaving root stale.
  const s3bRoot = path.join(tempBase, "scenario-upgrade-structurally-stale");
  const s3bInit = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", s3bRoot], { encoding: "utf8", env, cwd: root });
  if (s3bInit.status !== 0) {
    throw new Error(`Scenario 3b init prep failed: ${s3bInit.stderr || s3bInit.stdout}`);
  }
  const s3bIndexPath = path.join(s3bRoot, "dev/PROJECT_INDEX.md");
  copyFileSync(path.join(root, "test-fixtures/v0.1.7/dev/PROJECT_INDEX.md"), s3bIndexPath);
  rmSync(path.join(s3bRoot, "dev/PROJECT_DECISIONS.md"), { force: true });
  rmSync(path.join(s3bRoot, "dev/rules/onboarding.md"), { force: true });
  rmSync(path.join(s3bRoot, "dev/rules/integrations.md"), { force: true });
  const s3b = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", s3bRoot], "scenario 3b upgrade structurally-stale (real v0.1.7 fixture)", { env });
  assertScenarioOutput("scenario 3b (upgrade structurally-stale via real v0.1.7 fixture)", s3b.stdout, {
    mustHave: [
      /✅ 升級完成：/,
      /本次升級/,
      /v0\.1\.7/,
      /跨度較大/,
      /github\.com\/Adamchanadam\/agent-handoff-kit\/releases/,
      /I just upgraded agent-handoff-kit/
    ],
    mustNotHave: [
      /✅ 安裝完成：/,
      /I just installed agent-handoff-kit\. Help me get started\./,
      /項目內記錄的 Kit 版本與目前工具版本不同/
    ]
  });
  const s3bPostIndex = readFileSync(s3bIndexPath, "utf8");
  const s3bVersionMatch = s3bPostIndex.match(/\| Agent Handoff Kit template version \| ([\d.]+) \|/);
  if (!s3bVersionMatch || s3bVersionMatch[1] !== currentVersion) {
    throw new Error(`scenario 3b post-upgrade: PROJECT_INDEX template version expected v${currentVersion}, got v${s3bVersionMatch?.[1] ?? "missing"}`);
  }
  console.log(`ok: scenario 3b (structurally stale) post-upgrade template version = v${s3bVersionMatch[1]}`);

  // Scenario 6: doctor healthy & latest
  const s6 = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", s1Root], "scenario 6 doctor healthy & latest", { env });
  assertScenarioOutput("scenario 6 (doctor healthy & latest)", s6.stdout, {
    mustHave: [
      /status: passed/,
      /繼續日常使用即可/,
      // R-031.2 v0.3.2+: 項目狀態速覽（三向 version + 距上次 closeout + 項目首次安裝）
      // Loosened from /📦 版本：工具 v/ to /📦 版本：工具/ — aligned branch wording is
      // "工具 / 項目記錄 / npm latest 三向對齊 vX" where "工具" is followed by "/" not "v",
      // so the original anchor missed the aligned case when network fetch succeeded.
      /項目狀態速覽/,
      /📦 版本：工具/,
      /📅 上次 closeout/,
      /🌱 項目首次安裝距今/
    ],
    mustNotHave: [
      /如要升級到較新版/
    ]
  });
}

function assertScenarioOutput(label, output, contract) {
  for (const pattern of contract.mustHave) {
    if (!pattern.test(output)) {
      throw new Error(`${label} missing required pattern: ${pattern}\n--- Output (first 2000 chars) ---\n${output.slice(0, 2000)}`);
    }
  }
  for (const pattern of contract.mustNotHave) {
    if (pattern.test(output)) {
      const match = output.match(pattern);
      throw new Error(`${label} contains forbidden pattern: ${pattern} (matched: "${match[0]}")\n--- Output (first 2000 chars) ---\n${output.slice(0, 2000)}`);
    }
  }
  console.log(`ok: ${label} output contract`);
}

function checkForbiddenVocabulary(label, text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      throw new Error(`R-026 forbidden vocabulary "${match[0]}" found in ${label} (release artifact must not contain this phrase)`);
    }
  }
  console.log(`ok: ${label} forbidden-vocabulary sweep (R-026)`);
}

function checkForbiddenVocabularyInChangelogLatestSection(text, patterns) {
  // Bound to the latest version section: from the first "## v" heading to the next "## v"
  // heading (or end of file). Historical sections are intentionally excluded.
  const latestHeading = text.match(/^## v[\d.]+[^\n]*/m);
  if (!latestHeading) {
    throw new Error(`CHANGELOG.md missing latest "## v<version>" heading — anchor-bounded grep cannot proceed`);
  }
  const startIdx = latestHeading.index;
  const afterStart = text.slice(startIdx + latestHeading[0].length);
  const nextHeadingMatch = afterStart.match(/\n## v[\d.]+/);
  const endIdx = nextHeadingMatch ? startIdx + latestHeading[0].length + nextHeadingMatch.index : text.length;
  const latestSection = text.slice(startIdx, endIdx);
  for (const pattern of patterns) {
    const match = latestSection.match(pattern);
    if (match) {
      throw new Error(`R-026 forbidden vocabulary "${match[0]}" found in CHANGELOG.md latest section (release artifact must not contain this phrase; historical sections excluded)`);
    }
  }
  console.log(`ok: CHANGELOG.md latest section forbidden-vocabulary sweep (R-026 anchor-bounded)`);
}

function checkBookLanguage(label, text, pattern) {
  // Exclude content inside <div class="block-body">...</div> (CLI Terminal mock blocks).
  // These mirror literal CLI output from bin/agent-handoff-kit.mjs which contains
  // R-026 contract phrasing that may differ from long-form book-language
  // discipline because it is verbatim CLI output, not user-facing narrative.
  const blockBodyRegex = /<div class="block-body">[\s\S]*?<\/div>/g;
  const strippedText = text.replace(blockBodyRegex, (match) => " ".repeat(match.length));
  const matches = [...strippedText.matchAll(pattern)];
  if (matches.length > 0) {
    const samples = matches.slice(0, 5).map((m) => {
      const line = text.slice(0, m.index).split("\n").length;
      return `line ${line}: ${m[0]}`;
    });
    throw new Error(`Book-language discipline violated in ${label}: ${matches.length} Cantonese spoken character(s) found. First ${samples.length}: ${samples.join(", ")}`);
  }
  console.log(`ok: ${label} book-language discipline sweep`);
}

function simulateMultiSessionFlow(installedHandoff, installedLog) {
  const closedHandoff = installedHandoff
    .replace("Last Updated: TBD", "Last Updated: 2026-05-14 17:41:41 +01:00")
    .replaceAll("<absolute project root>", tempRoot)
    .replaceAll("TBD", "simulated user-flow value")
    .replace("- Stale snapshots left in this handoff: simulated user-flow value", "- Stale snapshots left in this handoff: no")
    .replace("- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: simulated user-flow value", "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: yes")
    .replace("- Opening message matches current state: simulated user-flow value", "- Opening message matches current state: yes")
    .replace("- Next AI can continue from `AGENTS.md`, this handoff, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history: simulated user-flow value", "- Next AI can continue from `AGENTS.md`, this handoff, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history: yes");
  assertReconciledHandoff(closedHandoff);
  const staleHandoff = closedHandoff.replace("- Stale snapshots left in this handoff: no", "- Stale snapshots left in this handoff: yes");
  assert(!isReconciledHandoff(staleHandoff), "stale handoff snapshot should fail reconciliation check");
  const lifecycleConflictHandoff = closedHandoff
    .replace("1. simulated user-flow value", "1. Verified `doctor` / `upgrade` reliability concern is closed.")
    .replace("1. simulated user-flow value", "1. Investigate product-layer reliability issue in `doctor` / `upgrade` before modifying public output.")
    .replace("- Checks run this session: simulated user-flow value", "- Checks run this session: verified `doctor` / `upgrade` reliability concern is closed.");
  assert(!isReconciledHandoff(lifecycleConflictHandoff), "completed work carried forward as unresolved next work should fail lifecycle consistency");
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
  writeFileSync(path.join(tempRoot, "START_NEXT_SESSION_PROMPT.txt"), `${openingMessage}\n`, "utf8");

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
    .replace("- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified:", "- 已完成／待辦／風險／開工訊息的生命週期矛盾是否已解決或明確重新分類:")
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
    && /Completed \/ pending \/ risk \/ opening-message lifecycle conflicts resolved or explicitly reclassified:\s*yes/i.test(text)
    && /Opening message matches current state:\s*yes/i.test(text)
    && /Next AI can continue from `AGENTS\.md`, this handoff, `dev\/PROJECT_INDEX\.md`, and needed rule packs without searching old log history:\s*yes/i.test(text)
    && assessHandoffLifecycleConsistency(text).ok;
}

function assessHandoffLifecycleConsistency(text) {
  const evidenceText = [
    extractSectionText(text, "completed-this-session", "Completed This Session"),
    extractSectionText(text, "validation-qc", "Validation / QC")
  ].join("\n");
  const targetText = [
    extractSectionText(text, "next-priorities", "Next Priorities"),
    extractSectionText(text, "risks-blockers", "Risks / Blockers"),
    extractSectionText(text, "next-session-opening-message", "Next Session Opening Message")
  ].join("\n");
  const topics = extractLifecycleTopics(evidenceText);
  for (const topic of topics) {
    if (hasUnresolvedCarryForward(targetText, topic)) return { ok: false };
  }
  return { ok: true };
}

function extractLifecycleTopics(text) {
  const topics = new Set();
  for (const match of text.matchAll(/`([^`\n]{2,80})`/g)) {
    const topic = match[1].trim();
    if (!topic || /^dev\/|^docs\/|\.md$|\.txt$|\.json$|^AGENTS\.md$/.test(topic)) continue;
    topics.add(topic);
  }
  return [...topics];
}

function hasUnresolvedCarryForward(text, topic) {
  const pattern = new RegExp(escapeRegExp(topic), "ig");
  for (const match of text.matchAll(pattern)) {
    const start = Math.max(0, match.index - 180);
    const end = Math.min(text.length, match.index + topic.length + 180);
    const context = text.slice(start, end);
    if (/\b(monitor-only|follow-up scope|blocked|reopened|re-opened|if new evidence|conditional|no-op)\b|只監察|監察|後續範圍|跟進範圍|阻擋|已重開|明確重開|新證據/i.test(context)) continue;
    if (/\b(investigate|reproduce|pending|todo|unresolved|must start|start with read-only|reliability concern remains open|needs investigation)\b|調查|重查|未解|待辦|仍需|未完成|開始.{0,20}核查|先.{0,20}調查/i.test(context)) return true;
  }
  return false;
}

function extractSectionText(text, markerId, headingTitle) {
  const markerText = `ack:section:${markerId}`;
  const markerIndex = text.indexOf(markerText);
  if (markerIndex >= 0) {
    const start = text.indexOf("\n", markerIndex);
    if (start < 0) return "";
    const nextMarker = text.indexOf("<!-- ack:section:", start + 1);
    return text.slice(start + 1, nextMarker >= 0 ? nextMarker : text.length);
  }
  const headingMatch = new RegExp(`^## ${escapeRegExp(headingTitle)}\\s*$`, "m").exec(text);
  if (!headingMatch) return "";
  const start = headingMatch.index + headingMatch[0].length;
  const nextHeading = /\n##\s+/.exec(text.slice(start));
  return text.slice(start, nextHeading ? start + nextHeading.index : text.length);
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

function normalizePrompt(text) {
  return text.replace(/\r\n/g, "\n").trim();
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

function run(command, args, label, options = {}) {
  const spawnOptions = {
    cwd: root,
    encoding: "utf8"
  };
  if (options.env) spawnOptions.env = options.env;
  const result = spawnSync(command, args, spawnOptions);

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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
