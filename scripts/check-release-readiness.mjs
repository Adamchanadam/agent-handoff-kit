#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractOpeningMessage, normalizePrompt } from "../bin/prompt-mirror-core.mjs";
import { requiredInstalledTargets } from "../bin/installed-file-contract.mjs";
import {
  commandDocumentation,
  QA_RELEASE_READINESS_INVENTORY,
  QA_RELEASE_READINESS_INVENTORY_DIGEST,
  R034_ARTIFACT_CONTRACT,
  RELEASE_PACKAGE_CONTRACT,
  RELEASE_STATE_CONTRACT
} from "./qa-assurance-manifest.mjs";
import { describeResult, runChecked, runNodeScriptChecked } from "./qa-runner-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const tempRoot = path.join(tmpdir(), `ack-release-flow-${Date.now()}`);
const cliNode = process.platform === "win32" ? "node" : process.execPath;
const pinnedV041Artifact = {
  packageRoot: process.env[R034_ARTIFACT_CONTRACT.packageRootEnv]
    || (process.platform === "win32" ? R034_ARTIFACT_CONTRACT.windowsDefaultPackageRoot : null),
  tarballPath: process.env[R034_ARTIFACT_CONTRACT.tarballPathEnv]
    || (process.platform === "win32" ? R034_ARTIFACT_CONTRACT.windowsDefaultTarballPath : null),
  sha1: R034_ARTIFACT_CONTRACT.sha1,
  integrity: R034_ARTIFACT_CONTRACT.integrity
};
const plainStartupBoundary = "A plain `Start Agent Handoff` / `開工` with no same-message task or explicit long-run instruction only authorizes minimum state recovery, one optional display-only title update when safely supported, the startup card, the current objective/risk/recommended next action, and then the end of the turn. It does not authorize task-specific reads, research, plans, protocols, preflight, file searches, sub-agents, QA, packaging, project-file writes, network access, other external actions, or opt-out execution wording.";

await main();

async function main() {
  if (process.argv.includes("--qa-inventory-self-test")) {
    checkReleaseReadinessInventorySelfTest();
    return;
  }
  const packageJson = JSON.parse(read("package.json"));
  assert(packageJson.name === "@adamchanadam/agent-handoff-kit", "package name drifted");
  const version = packageJson.version;
  assert(version && /^\d+\.\d+\.\d+$/.test(version), "package version missing or malformed (expected semver e.g. 0.1.8)");
  assert(JSON.stringify(packageJson.files) === JSON.stringify(["bin/", "runtime-core/", "packs/", "README.md", "LICENSE"]), "npm package files boundary changed");
  // This isolated checker executes every required QA script directly below.
  // The public npm package deliberately excludes source QA helpers, so a
  // package.json `scripts` table would neither prove nor run the release gate.
  checkWhatsnewSchema(version);
  checkGithubReleaseBodyContract(version);
  checkPublicOnboardingVersion(version);
  checkEnglishPublicSurfaces(version);
  checkReleaseStateCoherence(version);
  checkCandidateWorktreeIsClean();
  checkChangedBilingualCandidateEvidence(version);
  checkUpgradeSuccessOutputSourceContract(version);
  checkRecommendedNextStepContract();
  checkCliHelpHotPathContract();

  const executedQaIds = [];
  for (const qaCheck of QA_RELEASE_READINESS_INVENTORY) {
    await runManifestQaScript(qaCheck, executedQaIds);
  }
  assertReleaseReadinessInventoryComplete(executedQaIds);

  const pack = runNpm(["pack", "--dry-run"], "npm package release dry-run");
  const packText = outputText(pack);
  const expectedFiles = expectedPackageFileCount();
  assert(packText.includes(`total files: ${expectedFiles}`), `npm dry-run did not report expected ${expectedFiles} package files`);
  assert(packText.includes("README.en.md"), "npm package is missing the English README");
  assert(!packText.includes("docs/qa/"), "QA docs entered npm package");
  assert(!packText.includes("docs/whatsnew/"), "release-note source docs entered npm package");
  assert(!packText.includes("scripts/"), "source QA scripts entered npm package");
  assert(!packText.includes("test-fixtures/"), "test fixtures entered npm package");
  assert(!existsSync(path.join(root, `adamchanadam-agent-handoff-kit-${version}.tgz`)), "npm dry-run left a tarball behind");
  checkPackedPackageUpgradeSmoke(version);

  assertIncludes("README.md", [
    `v${version}`,
    "AI 對話之間的接力棒",
    "AI 跨對話失憶",
    "適合能讀寫本機專案資料夾的 agentic AI 工具",
    "不適合普通 web chat AI",
    "https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-intro.html",
    "https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-ai-install.html",
    "不需要研究終端機指令",
    "你不用判斷安裝、升級、檢查或檔案結構",
    "START_NEXT_SESSION_PROMPT.txt",
    "## 🚀 三步上手",
    "## 🔎 它解決甚麼問題",
    "## 🟢 開工",
    "收工",
    "wrap up",
    "handoff",
    "## 🗂️ AI 會替你維護甚麼",
    "## 💬 你可以怎樣叫 AI",
    "讓新文件不變成孤兒",
    "掃描未接入 Agent Handoff Kit 的重要文件",
    "AI 只會先列出可能需要接入的文件與原因",
    "把今次錯誤整理成日後工作規則",
    "讓下次 AI 知道要怎樣避免",
    "之後開新對話也要沿用",
    "不是只留在當次對話摘要",
    "機密不要寫入項目文件"
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

  checkQaCommandDocumentation();
  checkRulePackRoutingDurableHomeAudit();
  checkGovernanceBridgeContract();
  checkTaskPersistenceGateContract();

  assertIncludes("runtime-core/AGENTS.core.md", [
    "A direct ordinary or stateless task does not read the handoff merely because the project root is known",
    "Clear continuity intent",
    "A direct ordinary task begins without a startup card or onboarding ceremony",
    "Explicit guidance requests",
    "A fresh install or short message only makes guidance available",
    "Do not read `dev/SESSION_LOG.md` during ordinary startup",
    "Read `dev/PROJECT_INDEX.md` when the task needs",
    "Pack loading is normally silent",
    "Show the startup card only for explicit continuity startup",
    "A plain continuity message with no same-message task or explicit long-run instruction authorizes only that recovery",
    "one optional display-only title update when safely supported",
    "the end of the turn",
    "It does not authorize task-specific reads, research, plans, protocols, preflight, file searches, sub-agents, QA, packaging, project-file writes, network access, other external actions, or opt-out wording",
    "A concrete objective found only in loaded state is not authority to complete it",
    "current-title readback and title control",
    "Replace only a generic or stale title",
    "keep an informative title",
    "Use `<project name>｜<primary action>` from facts already loaded for startup",
    "Do not read `dev/PROJECT_INDEX.md`, files, network, or other state solely to name the title",
    "must not contain progress, completion, status, task/session IDs, absolute paths, secrets, or unverified facts",
    "skip silently",
    "display-only; it is not project state, permission, progress, completion evidence, a health result, or a source of truth",
    "開工，繼續完成目前目標",
    "Agent Handoff Kit v<version>",
    "Never print the literal placeholder `v<version>`",
    "Reachable is not the same as ingested",
    "Search hits, truncated output, summaries, and status claims do not replace the relevant source content",
    "Materially changed Markdown governance artifacts must be indexed",
    "the bundled doctor does not claim to scan them",
    "External skill flows, subagents, task plans",
    "## 2.1 Persistence Gate",
    "No persistence",
    "Lightweight checkpoint",
    "Full closeout",
    "Clear end-of-session or handoff intent",
    "Load `dev/rules/closeout.md`",
    "no third full copy is retained",
    "Load `dev/rules/integrations.md` when the current task actually uses an external tool"
  ]);
  assert(!read("runtime-core/AGENTS.core.md").includes("at most one bounded, low-cost, reversible first checkpoint"), "plain startup still authorizes a task checkpoint");
  assert(!read("runtime-core/AGENTS.core.md").includes("Show a short closeout card, then provide a copy-paste-ready next-session opening message inside a fenced `text` code block"), "closeout final response must not precede prompt persistence/read-back");
  assert(!read("runtime-core/AGENTS.core.md").includes("If the same message or loaded state contains a concrete objective, begin its first safe action in the same response"), "plain startup still promotes a loaded objective into same-turn full-task authority");

  assertIncludes("runtime-core/PROJECT_INDEX.md", [
    "## Installed Integrations",
    "Credential Separation Principle",
    "### Connectors",
    "### MCPs",
    "### Plugins",
    "### Skills",
    "### Source-of-truth Architecture",
    "## Tool Operation References",
    "runtime-controlled tools",
    "Source and version/date",
    "Scope and known limits",
    "`via`"
  ]);

  assertIncludes("runtime-core/SESSION_HANDOFF.md", [
    "Installed Integrations registry",
    "Probe only immediately before actual use",
    "ack:field:lifecycle-conflicts-resolved",
    "ack:field:persistence-routing-checked",
    "ack:field:closeout-outcome",
    "ack:field:project-required-persistence",
    "Persistence routing checked",
    "Project-required persistence",
    "closeout-status",
    "Persistence routing rule"
  ]);

  assertIncludes("runtime-core/PROJECT_DECISIONS.md", [
    "Research-derived decisions use this compact evidence-chain format",
    "Evidence chain: Source=source:<id>; Summary=<source finding>; Inference=<reasoning>; Decision impact=<what changed>; Uncertainty=<limits or none>.",
    "This file does not store raw build / upload / QC evidence"
  ]);

  assertIncludes("runtime-core/RULE_PACKS.md", [
    "dev/rules/integrations.md",
    "capability verification immediately before use",
    "credential separation",
    "Runtime-controlled tool operation",
    "External tool resource pressure",
    "ownership-based external-tool resource closeout"
  ]);

  assertIncludes("packs/closeout.md", [
    "apply the integrations and safety ownership rules",
    "Close only task-owned resources",
    "Retain shared, user-owned, other-agent-owned, system, or ambiguous resources unless separately authorized"
  ]);

  assertIncludes("packs/integrations.md", [
    "Integrations Pack",
    "Credential Separation Principle",
    "External Tool Usage Verification Gate",
    "External Tool Resource Lifecycle",
    "task-owned",
    "agent-managed",
    "Shared / user-owned / other-agent-owned / system-level",
    "shared, user-owned, system-level, other-agent-owned, or unknown",
    "another AI agent's active tools",
    "do not invent",
    "input schema",
    "official documentation",
    "official type definitions",
    "official sample",
    "Runtime-Controlled Tool Operation Variants",
    "Tool Operation References",
    "Do not guess Chrome, Playwright, or DevTools commands",
    "Local HTML / app validation fallback",
    "`file://` rejection alone is not enough evidence to stop",
    "short-lived localhost service",
    "blocked",
    "unverified",
    "Connectors",
    "MCPs",
    "Plugins",
    "Skills",
    "Source-of-truth Architecture",
    "Cross-session Lifecycle",
    "Connector-first default"
  ]);

  assertIncludes("packs/knowledge.md", [
    "Connector-first default",
    "R-030 Integration governance discipline",
    "External Tool Usage Verification Gate",
    "Do not invent `mcp__*` names or arguments",
    "Backward-compat"
  ]);

  assertIncludes("packs/safety.md", [
    "External Tool Usage Verification Gate",
    "Differentiate three layers of external access",
    "Anthropic-vetted Connectors",
    "Community / custom MCP servers",
    "Credential leak prevention",
    "Process termination and cache cleanup boundary",
    "Short-lived localhost validation services",
    "task-owned or agent-managed",
    "Generic process names such as `node`, `python`, or `chrome` are never enough ownership evidence",
    "another AI agent running on the same machine",
    "browser profiles",
    "desktop app sessions",
    "shared tool servers",
    "notebook kernels",
    "parser failure",
    "minimal reproducible script",
    "syntax-only check",
    "read back the affected files",
    "Recognize common credential prefixes"
  ]);

  assertIncludes("packs/onboarding.md", [
    "Continuity startup boundary",
    "starts continuity and reads the minimum current handoff state; it is not an onboarding signal",
    "Explicit requests such as \"新手，教我用\" enter onboarding directly",
    "Infer when sufficient; ask only when unresolved",
    "When the user has already supplied a concrete, actionable objective and enough material facts",
    "Only show the scenario chooser when the user's intent remains genuinely unresolved",
    "High-risk, external, permission, cost, publishing, and irreversible actions still require",
    "Scenario F. External-tool governance",
    "Step F.1: collect installed external tools",
    "Step F.2: explain credential separation",
    "Step F.3: map source-of-truth architecture",
    "Step F.4: when authorized",
    "Step F.5: verify current availability",
    "Chinese only as quoted user phrases"
  ]);

  assertIncludes("runtime-core/SESSION_LOG.md", [
    "Handoff role",
    "trace-back / audit trail layer",
    "R-010 SESSION_LOG handoff-role discipline",
    "maintenance trigger check",
    "Log maintenance",
    "Evidence disposition"
  ]);

  assertIncludes("bin/agent-handoff-kit.mjs", [
    "assessSessionLogDiscipline",
    "R-010 SESSION_LOG handoff-role discipline",
    "SESSION_LOG 接力角色紀律",
    "project decisions log structure",
    "onboarding pack structure",
    "integrations pack structure",
    "External Tool Resource Lifecycle",
    "checkInstalledIntegrationsCredentialLeak",
    "assessHandoffLifecycleConsistency",
    "checkHandoffTemperatureBoundary",
    "handoff temperature boundary checks",
    "checkGeneratedMarkdownGovernance",
    "generated markdown governance checks"
  ]);
  assertIncludes("bin/installed-file-contract.mjs", [
    "runtime-core/PROJECT_DECISIONS.md",
    "dev/PROJECT_DECISIONS.md",
    "packs/onboarding.md",
    "dev/rules/onboarding.md",
    "packs/integrations.md",
    "dev/rules/integrations.md"
  ]);

  const install = run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", tempRoot], "release user-flow install");
  assert(install.stdout.includes("安裝完成：下一步請在 AI 對話中操作"), "install output missing AI-chat next-step heading");
  assert(install.stdout.includes("下面這句不是終端機指令。"), "install output does not warn that next text is not a terminal command");
  assert(!install.stdout.includes("next: Follow AGENTS.md"), "install output still contains misleading old next line");
  const doctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", tempRoot], "release user-flow doctor");
  assert(doctor.stdout.includes("status: passed"), "doctor did not pass in release user-flow check");
  assert(doctor.stdout.includes("✅ 檢查通過"), "doctor output missing beginner-friendly passed message");
  assert(doctor.stdout.includes("schema checks:"), "doctor did not run schema checks");
  assert(doctor.stdout.includes("dev/SESSION_HANDOFF.md (handoff required sections)"), "doctor did not check handoff schema");
  assert(doctor.stdout.includes("dev/PROJECT_INDEX.md (project index tables)"), "doctor did not check project index schema");
  assert(doctor.stdout.includes("dev/RULE_PACKS.md (rule pack router coverage)"), "doctor did not check rule pack router schema");
  assert(doctor.stdout.includes("dev/PROJECT_DECISIONS.md (project decisions log structure)"), "doctor did not check PROJECT_DECISIONS schema (R-028)");
  assert(doctor.stdout.includes("research decision trace checks: 1"), "doctor did not run research decision trace checks");
  assert(doctor.stdout.includes("dev/PROJECT_DECISIONS.md (research-derived decision evidence chains)"), "doctor did not report research-derived decision trace check");
  assert(doctor.stdout.includes("handoff temperature boundary checks: 1"), "doctor did not run handoff temperature boundary checks");
  assert(doctor.stdout.includes("dev/SESSION_HANDOFF.md / START_NEXT_SESSION_PROMPT.txt (current-state evidence boundary)"), "doctor did not report handoff temperature boundary check");
  assert(doctor.stdout.includes("generated markdown governance checks: 1"), "doctor did not run generated markdown governance checks");
  assert(doctor.stdout.includes("dev/PROJECT_INDEX.md (generated Markdown registration; other formats require human review)"), "doctor did not report the bounded generated Markdown governance check");
  assert(doctor.stdout.includes("dev/rules/onboarding.md (onboarding pack structure)"), "doctor did not check onboarding pack schema");
  assert(doctor.stdout.includes("dev/rules/integrations.md (integrations pack structure)"), "doctor did not check integrations pack schema (R-030 v0.3.0+)");
  assert(doctor.stdout.includes("SESSION_LOG 接力角色紀律: ok"), "doctor did not run SESSION_LOG discipline check, or fresh install triggered an unexpected warning");
  assert(doctor.stdout.includes("Credential separation sweep: ok"), "doctor did not run credential leak sweep (R-030 v0.3.0+)");

  const installedHandoff = readAt(tempRoot, "dev/SESSION_HANDOFF.md");
  const installedLog = readAt(tempRoot, "dev/SESSION_LOG.md");
  const installedPrompt = readAt(tempRoot, "START_NEXT_SESSION_PROMPT.txt");
  assert(installedHandoff.includes("📋 Next session: agent-managed startup content below"), "installed handoff missing agent-managed startup marker");
  assert(installedHandoff.includes("```text"), "installed handoff missing fenced text block");
  assert(installedHandoff.includes(plainStartupBoundary), "installed handoff lacks the plain-startup stop boundary");
  assert(!installedHandoff.includes("If my message or the handoff already gives an executable task, begin its first safe action in this response."), "installed handoff still promotes a loaded objective into same-turn full-task authority");
  assert(normalizePrompt(installedPrompt) === normalizePrompt(extractOpeningMessage(installedHandoff)), "installed START_NEXT_SESSION_PROMPT.txt does not match handoff opening message");
  simulateInSessionPromptConvenienceDrift(installedHandoff);
  assertHandoffMarker(installedHandoff, "section", "next-task-required-reading");
  assertHandoffMarker(installedHandoff, "section", "durable-anchors");
  assertHandoffMarker(installedHandoff, "section", "closeout-reconciled-state");
  assertHandoffMarker(installedHandoff, "section", "task-understanding-summary");
  assertHandoffMarker(installedHandoff, "section", "state-reconciliation-check");
  assert(installedLog.includes("- **Opening-message mirror:**"), "installed log missing opening-message mirror result field");
  assert(!installedLog.includes("### Next Session Opening Message"), "installed log must not contain a third full opening-message schema");
  assertSessionLogMarkerContract(installedLog, "fresh install SESSION_LOG");
  const installedIndex = readAt(tempRoot, "dev/PROJECT_INDEX.md");
  assert(installedIndex.includes("## Fact Base"), "installed project index missing fact base section");
  assert(installedIndex.includes("## External Sources"), "installed project index missing external sources section");
  assert(installedIndex.includes("## Tool Operation References"), "installed project index missing tool operation references section");
  assert(installedIndex.includes("## Local QC Commands"), "installed project index missing local QC commands section");
  assert(installedIndex.includes("Reachable means the source can be found"), "installed project index missing reachable-versus-ingested note");
  assert(!existsSync(path.join(tempRoot, "archive")), "installer created archive directory by default");
  checkResearchDecisionTraceContract();
  checkHandoffTemperatureBoundaryContract();
  await checkGeneratedMarkdownGovernanceContract();
  simulateMultiSessionFlow(installedHandoff, installedLog);
  simulateLocalizedHandoffHeadings();

  // R-026 Release Artifact Vocabulary Sweep — forbidden vocabulary must not appear in
  // user-facing release artifacts. CHANGELOG is bounded to the latest version section
  // because historical entries may legitimately mention the forbidden phrases (e.g. v0.1.4
  // history records when the phrase "人話解讀" was added before being later retired).
  const r026Forbidden = [/人話解讀/, /人話補一句/, /人話解釋/];
  checkForbiddenVocabulary("README.md", read("README.md"), r026Forbidden);
  checkForbiddenVocabulary("agent-handoff-kit-ai-install.html", read("agent-handoff-kit-ai-install.html"), r026Forbidden);
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
  checkForbiddenVocabulary("agent-handoff-kit-ai-install.html", read("agent-handoff-kit-ai-install.html"), internalReferenceForbidden);
  checkForbiddenVocabulary("agent-handoff-kit-intro.html", read("agent-handoff-kit-intro.html"), internalReferenceForbidden);
  checkForbiddenVocabulary("agent-handoff-kit-guide.html", read("agent-handoff-kit-guide.html"), internalReferenceForbidden);

  // R-030 v0.3.0+: Internal "v2 / advanced user path" jargon must not appear on user-facing surfaces.
  const v2JargonForbidden = [/v2 (的|嘅) advanced user path/, /v2 advanced user path/];
  checkForbiddenVocabulary("agent-handoff-kit-ai-install.html", read("agent-handoff-kit-ai-install.html"), v2JargonForbidden);
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
  checkBookLanguage("agent-handoff-kit-ai-install.html", read("agent-handoff-kit-ai-install.html"), cantoneseSpokenChars);
  checkBookLanguage("agent-handoff-kit-intro.html", read("agent-handoff-kit-intro.html"), cantoneseSpokenChars);
  checkBookLanguage("agent-handoff-kit-guide.html", read("agent-handoff-kit-guide.html"), cantoneseSpokenChars);

  // R-029.1 v0.2.1: Cross-surface wording consistency sweep. The R-029 onboarding trigger
  // startup entry must appear consistently across user-facing surfaces (CLI post-install
  // output + README + onboarding HTML). v0.3.19 makes short startup the primary route:
  // `Start Agent Handoff` / `開工` when the local AI is already rooted in the project,
  // and the path-bearing fallback only when the AI is not yet pointed at the folder.
  checkCrossSurfaceWordingConsistency();
  checkDecisionFirstOnboardingWording();
  checkAiInstallPageContract(version);

  // v0.3.7 candidate discipline: `npx` cold-start UX must be explicit. A project can
  // already contain old Kit files while npm still needs to fetch the CLI package before
  // running `doctor`; user-facing examples must avoid the misleading bare `npx ... doctor`
  // path and explain that `doctor` checks only.
  checkNpxColdStartUxGuidance();

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
  const primaryStartupPhrases = ["Start Agent Handoff", "開工"];
  const pathFallbackPhrase = "Read AGENTS.md first, then Start Agent Handoff";
  const closeoutPhrases = ["Wrap up Agent Handoff", "收工"];
  const staleStandaloneOnboardingPhrases = [
    "help me start",
    "I just installed agent-handoff-kit",
    "新手起步句",
    "在 AI 對話中說「教我用」",
    "Read AGENTS.md first. Then open START_NEXT_SESSION_PROMPT.txt",
    "日常開工句",
    "固定開工句",
    "貼同一條固定開工句",
    "下次開工:複製貼上以下整段",
    "貼回 START_NEXT_SESSION_PROMPT",
    "下一次任何 AI 工具",
    "你只要貼一段提示",
    "開新對話,貼一段字",
    "開新對話，貼一段字"
  ];
  const surfaces = [
    { file: "bin/agent-handoff-kit.mjs", role: "CLI printInstallNextSteps" },
    { file: "README.md", role: "README first-screen startup callout + 三步上手 step 2" },
    { file: "agent-handoff-kit-intro.html", role: "intro #howto Step 2 + #recap cell 1" },
    { file: "agent-handoff-kit-guide.html", role: "guide hero startup callout" }
  ];
  for (const surface of surfaces) {
    const text = read(surface.file);
    for (const phrase of primaryStartupPhrases) {
      if (!text.includes(phrase)) {
        throw new Error(`Cross-surface primary startup phrase missing in ${surface.file} (${surface.role}). Expected: "${phrase}"`);
      }
    }
    if (!text.includes(pathFallbackPhrase)) {
      throw new Error(`Cross-surface path fallback phrase missing in ${surface.file} (${surface.role}). Expected phrase fragment: "${pathFallbackPhrase}"`);
    }
    if (!text.includes("普通 web chat") && !text.includes("web chat AI") && !text.includes("web 版")) {
      throw new Error(`Local-agent support boundary missing in ${surface.file} (${surface.role}).`);
    }
    for (const phrase of closeoutPhrases) {
      if (!text.includes(phrase)) {
        throw new Error(`Cross-surface closeout phrase missing in ${surface.file} (${surface.role}). Expected: "${phrase}"`);
      }
    }
    if (!/直接(?:接力|開始)/.test(text)) {
      throw new Error(`Concrete-task startup fast path missing in ${surface.file} (${surface.role}).`);
    }
    for (const stalePhrase of staleStandaloneOnboardingPhrases) {
      if (text.includes(stalePhrase)) {
        throw new Error(`Stale standalone onboarding phrase "${stalePhrase}" found in ${surface.file} (${surface.role}); current surface must route through AGENTS.md and the authoritative handoff.`);
      }
    }
    console.log(`ok: ${surface.file} cross-surface startup boundary`);
  }
  const intro = read("agent-handoff-kit-intro.html");
  assert(intro.includes("開工接上狀態"), "intro #magic section must explain startup as well as closeout");
  assert(intro.includes("收工留下交接"), "intro #magic section must explain closeout as part of the full flow");
  assert(!intro.includes("03 / 只需記住三個字"), "intro #magic section must not frame the flow as closeout-only three-word memory");
  assert(!intro.includes("AI 自動收工"), "intro #magic heading must not frame Agent Handoff Kit as closeout-only");
}

function checkPublicOnboardingVersion(version) {
  const surfaces = [
    "agent-handoff-kit-ai-install.html",
    "agent-handoff-kit-intro.html",
    "agent-handoff-kit-guide.html"
  ];
  const currentToken = `v${version}`;
  const previousPatchToken = `v${previousPatch(version)}`;
  for (const file of surfaces) {
    const text = read(file);
    const visible = stripHtml(text);
    assert(text.includes(currentToken), `${file} missing current visible version ${currentToken}`);
    assert(!text.includes(previousPatchToken), `${file} still contains previous patch version ${previousPatchToken}`);
    assert(visible.includes(`本頁對齊 ${currentToken}`) && visible.includes("@latest 實際取得版本以 npm registry 為準"), `${file} does not state release-aligned page version and npm @latest boundary`);
  }
  const guide = read("agent-handoff-kit-guide.html");
  const targetCount = requiredInstalledTargets.length;
  for (const snippet of [`create: ${targetCount}`, `created: ${targetCount}`, `create ${targetCount} / merge 0 / skip 0 / conflict 0`]) {
    assert(guide.includes(snippet), `guide fresh-install example is not derived from the ${targetCount}-target installed-file contract: ${snippet}`);
  }
  console.log(`ok: public onboarding HTML version aligned to ${currentToken}`);
}

function checkNpxColdStartUxGuidance() {
  const readme = read("README.md");
  const cli = read("bin/agent-handoff-kit.mjs");
  const qaDoc = read("docs/qa/release-grade-qa.md");
  const intro = stripHtml(read("agent-handoff-kit-intro.html"));
  const guide = stripHtml(read("agent-handoff-kit-guide.html"));
  const aiInstall = stripHtml(read("agent-handoff-kit-ai-install.html"));
  const commonEntryCommands = [
    "npx --yes @adamchanadam/agent-handoff-kit@latest init",
    "npx --yes @adamchanadam/agent-handoff-kit@latest doctor",
    "npx --yes @adamchanadam/agent-handoff-kit@latest upgrade"
  ];
  for (const command of commonEntryCommands) {
    assert(cli.includes(command), `CLI help / next-step output missing npx cold-start-safe command: ${command}`);
    assert(aiInstall.includes(command.replace(" upgrade", " upgrade")) || command.endsWith("doctor"), `AI install page missing npx cold-start-safe command: ${command}`);
  }
  assert(readme.includes("使用時，你只需要說明目的；確認資料夾、判斷安裝或升級、執行指令和檢查結果，交給能讀寫本機資料夾的 AI 處理。"), "README must state the product principle: user states goal, AI handles technical work");
  assert(readme.includes("第一次用，不需要先讀完整 README，也不需要研究終端機指令。只做三件事："), "README first path must keep installation as a simple user journey");
  assert(readme.includes("你不用判斷安裝、升級、檢查或檔案結構。"), "README must keep install/upgrade/status decisions on the AI side");
  for (const forbidden of [
    "## 🖼️ 最新功能圖解",
    "最新圖解會直接顯示在這裡",
    "最多保留 3 張",
    "舊圖解放到完整索引",
    "agent-handoff-kit-resource-lifecycle-v035.png",
    "看完整圖解",
    "看正式 Release",
    "全部圖解"
  ]) {
    assert(!readme.includes(forbidden), `README must not carry visual-explainer shelf or maintainer display policy: ${forbidden}`);
  }
  const visualIndex = read("docs/whatsnew/README.md");
  assert(visualIndex.includes("# 功能圖解與版本頁索引"), "docs/whatsnew index must be framed as visual explainers plus version pages");
  assert(visualIndex.includes("正式版本紀錄以 [GitHub Releases]"), "docs/whatsnew index must point official release history to GitHub Releases");
  assert(!visualIndex.includes("README 首頁會直接展示最新功能圖解"), "docs/whatsnew index must not claim README displays visual explainers");
  assert(!visualIndex.includes("集中放 Agent Handoff Kit 的版本說明與功能圖解"), "docs/whatsnew index must not present itself as a second complete version-history surface");
  const quickStart = sectionBetween(readme, "## 🚀 三步上手", "## 🔎 它解決甚麼問題");
  assert(quickStart.includes("1. 在你想使用 Agent Handoff Kit 的資料夾打開 AI，貼上這句話："), "README quick start step 1 must be user-goal wording, not technical procedure");
  assert(quickStart.includes("https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-ai-install.html"), "README quick start must route installation and upgrade to the AI install page");
  assert(quickStart.includes("2. 安裝完成後，對 AI 說 `Start Agent Handoff` 或「開工」。"), "README quick start step 2 must be user action only");
  assert(quickStart.includes("3. 完成本輪工作後，對 AI 說「收工」。"), "README quick start step 3 must be user action only");
  const quickStartActionLines = quickStart
    .split(/\r?\n/)
    .filter((line) => /^[123]\. /.test(line.trim()))
    .join("\n");
  for (const forbidden of ["init", "upgrade", "doctor", "dry-run", "確認資料夾", "衝突", "預演"]) {
    assert(!quickStartActionLines.includes(forbidden), `README quick start action lines must not expose AI technical work to users: ${forbidden}`);
  }
  assert(!readme.includes("| 第一次在新資料夾使用 | `npx --yes @adamchanadam/agent-handoff-kit@latest init` |"), "README must not reintroduce a parallel manual init table");
  assert(!readme.includes("npx --yes @adamchanadam/agent-handoff-kit@latest init"), "README must keep direct init commands out of the user-facing main path");
  assert(!readme.includes("npx --yes @adamchanadam/agent-handoff-kit@latest upgrade"), "README must keep direct upgrade commands out of the user-facing main path");
  assert(!readme.includes("npx --yes @adamchanadam/agent-handoff-kit@latest doctor"), "README must keep direct doctor commands out of the user-facing main path");
  assert(!readme.includes("### 手動入口"), "README must not label direct npx commands as a parallel manual entry");
  assert(!readme.includes("### 常見入口"), "README must not present the direct npx table as the general common entry after AI-assisted install became the simplest path");
  assert(!readme.includes("| 已裝過舊版，想先看升級會改甚麼 | `npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run` |"), "README common entries must not present upgrade --dry-run as the old-install entry");
  assert(!readme.includes("`dry-run` 只會預覽"), "README must not teach dry-run as a user-facing parallel path");
  assert(cli.includes("已裝過：執行 upgrade；若想先預覽，才加 --dry-run"), "CLI help must present upgrade as the old-install entry and dry-run as optional preview");
  assert(cli.includes("--dry-run 只預覽、不寫入；它不是正式升級完成"), "CLI help must explain dry-run is not a completed upgrade");
  assert(qaDoc.includes("README 不另開一套平行安裝教學"), "Release-grade QA must preserve AI install page as the single README install entry");
  assert(intro.includes("npx --yes @adamchanadam/agent-handoff-kit@latest init"), "intro page missing canonical npx init command");
  assert(intro.includes("未安裝或不確定是否要升級時") && intro.includes("agent-handoff-kit-ai-install.html"), "intro page must route unsure users to the AI install page before manual terminal commands");
  assert(aiInstall.includes("npx --yes @adamchanadam/agent-handoff-kit@latest init"), "AI install page missing canonical npx init command");
  assert(aiInstall.includes("npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run"), "AI install page missing canonical npx upgrade dry-run command");
  assert(aiInstall.includes("npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --yes"), "AI install page missing canonical npx upgrade command");
  assert(aiInstall.includes("npx --yes @adamchanadam/agent-handoff-kit@latest doctor"), "AI install page missing canonical npx doctor command");
  assert(guide.includes("npx --yes @adamchanadam/agent-handoff-kit@latest init"), "guide page missing canonical npx init command");
  assert(guide.includes("npx --yes @adamchanadam/agent-handoff-kit@latest doctor"), "guide page missing canonical npx doctor command");
  assert(guide.includes("請它讀 agent-handoff-kit-ai-install.html") || guide.includes("請它讀安裝指令頁"), "guide page must route first-time users to the AI install page before manual terminal commands");
  assert(readme.includes("已裝過舊版，或資料夾裡已有 `AGENTS.md`、`CLAUDE.md`、`GEMINI.md` 等 AI 記憶文件，也用同一句交給 AI 判斷。"), "README must keep old Kit files on the same AI-assisted install path");
  assert(aiInstall.includes("若 `doctor` 通過") && aiInstall.includes("若 `doctor` 失敗"), "AI install page must explain doctor follow-up without moving the technical distinction into README");
  assert(cli.includes("真正會建立項目文件的是 init；doctor 只檢查"), "CLI output must explain init writes project files and doctor only checks");
  assert(cli.includes("即使資料夾已有 AGENTS.md 或 dev/"), "CLI output must explain existing Kit files can still require npx to fetch the executable tool");
  assert(cli.includes("不是本工具的建議用戶路徑"), "CLI help must discourage bare npx doctor as an official user path");
  assert(qaDoc.includes("不列為官方建議用戶路徑"), "Release-grade QA must classify bare npx doctor as non-canonical");

  const misleadingExamples = [
    { file: "README.md", text: readme },
    { file: "bin/agent-handoff-kit.mjs", text: cli },
    { file: "agent-handoff-kit-ai-install.html", text: aiInstall },
    { file: "agent-handoff-kit-intro.html", text: intro },
    { file: "agent-handoff-kit-guide.html", text: guide }
  ];
  for (const surface of misleadingExamples) {
    assert(!surface.text.includes("npx @adamchanadam/agent-handoff-kit doctor"), `${surface.file} still contains misleading bare npx doctor example`);
    assert(!surface.text.includes("npx @adamchanadam/agent-handoff-kit init"), `${surface.file} still contains misleading bare npx init example`);
  }

  const terminalFirstDriftPhrases = [
    "第一步完全與 AI 無關",
    "由終端機一句安裝",
    "然後再在項目資料夾執行 `npx",
    "準備好 Notion 資料庫與本機資料夾結構之後,在 <code>~/cafe-research/</code> 打開終端機"
  ];
  for (const phrase of terminalFirstDriftPhrases) {
    for (const surface of misleadingExamples) {
      assert(!surface.text.includes(phrase), `${surface.file} still contains terminal-first install drift phrase: ${phrase}`);
    }
  }
  console.log("ok: npx cold-start UX guidance");
}

function checkAiInstallPageContract(version) {
  assert(existsSync(path.join(root, "agent-handoff-kit-ai-install.html")), "AI install GitHub Pages HTML is missing");

  const page = read("agent-handoff-kit-ai-install.html");
  const plain = stripHtml(page);
  assert(page.includes(`v${version}`), `AI install page missing current visible version v${version}`);
  assert(read("README.md").includes("agent-handoff-kit-ai-install.html"), "README must link the AI install page");
  assert(read("agent-handoff-kit-intro.html").includes("agent-handoff-kit-ai-install.html"), "intro page must link the AI install page");
  assert(read("agent-handoff-kit-guide.html").includes("agent-handoff-kit-ai-install.html"), "guide page must link the AI install page");
  assert(read("docs/qa/release-grade-qa.md").includes("AI 代安裝頁驗收"), "release-grade QA must include AI install page acceptance");
  assert(read("docs/qa/release-grade-qa.md").includes("AI-assisted install page"), "Product Journey Matrix must include AI-assisted install page scenario");

  assertIncludes("agent-handoff-kit-ai-install.html", [
    "請讀取 https://adamchanadam.github.io/agent-handoff-kit/agent-handoff-kit-ai-install.html ，並在這個資料夾安裝或升級 Agent Handoff Kit。",
    "顯示目前工作資料夾的絕對路徑",
    "這是否就是要安裝或升級 Agent Handoff Kit 的資料夾？",
    "未能確認時停止",
    "npx --yes @adamchanadam/agent-handoff-kit@latest init --yes --root .",
    "npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run --root .",
    "npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --yes --root .",
    "npx --yes @adamchanadam/agent-handoff-kit@latest doctor --root .",
    "預演有 conflict 時",
    "停止並保持零寫入",
    "用戶不用判斷技術差異，也不用選 npm 指令",
    "能讀寫此資料夾的 AI",
    "先取得用戶授權",
    "未知本地 hash 只證明內容存在且未被偷換",
    "`doctor` 與 hash 讀回驗收",
    "不要用重裝或整檔覆寫繞過 conflict",
    "Start Agent Handoff",
    "AI 完成後必須回覆這份報告",
    "執行任何 `npx` 命令前，先記住本段",
    "AI 不可只說「完成」或只貼終端機輸出",
    "✅ 結果：安裝完成、升級完成，或因 conflict 停止",
    "📁 目前資料夾：顯示已確認的絕對路徑",
    "🩺 健康檢查：說明 `doctor` 是通過、失敗，還是只提示便利副本落後",
    "⚠️ 下一步不是終端機指令",
    "🚀 下一步：若 AI 已在此資料夾內",
    "完成報告範本"
  ]);

  const firstCommandIndex = plain.indexOf("npx --yes @adamchanadam/agent-handoff-kit@latest init --yes --root .");
  const completionContractIndex = plain.indexOf("AI 完成後必須回覆這份報告");
  assert(firstCommandIndex >= 0, "AI install page missing first npx command");
  assert(completionContractIndex >= 0, "AI install page missing completion report contract heading");
  assert(
    completionContractIndex < firstCommandIndex,
    "AI install completion report contract must appear before the first npx command so prompt-driven agents see it before execution"
  );

  const preCommandText = plain.slice(0, firstCommandIndex);
  for (const snippet of [
    "AI 完成後必須回覆這份報告",
    "AI 不可只說「完成」或只貼終端機輸出",
    "完成報告範本",
    "⚠️ 下一步不是終端機指令",
    "Start Agent Handoff",
    "開工"
  ]) {
    assert(preCommandText.includes(snippet), `AI install pre-command contract missing: ${snippet}`);
  }

  const forbiddenActions = ["git commit", "git push", "git tag", "npm publish", "GitHub Release"];
  for (const action of forbiddenActions) {
    assert(plain.includes(action), `AI install page must explicitly forbid or mention safe boundary for: ${action}`);
  }
  assert(plain.includes("不刪除") && plain.includes("不覆寫衝突"), "AI install page must forbid deletion and conflict overwrite");
  for (const forbidden of [
    "Kit 開發者",
    "可讀取專案的 AI",
    "可讀取檔案的 AI",
    "支援本地 hash",
    "maintainer local-hash",
    "舊 migration 資料夾、stage 或已回滾報告只屬歷史證據"
  ]) {
    assert(!plain.includes(forbidden), `AI install page retained stale conflict route: ${forbidden}`);
  }
  assert(!read("package.json").includes("agent-handoff-kit-ai-install.html"), "AI install page must remain outside npm files whitelist");
  console.log("ok: AI install page contract");
}

function checkScenarioBranchingDocAlignment() {
  const qaDoc = read("docs/qa/release-grade-qa.md");
  const rows = [
    {
      id: "1",
      snippets: [
        "install fresh",
        "安裝完成",
        "Start Agent Handoff",
        "Read AGENTS.md first, then Start Agent Handoff",
        "下面這句不是終端機指令",
        "普通 web chat AI",
        "升級完成",
        "你已經是最新版本"
      ]
    },
    {
      id: "2",
      snippets: [
        "init with existing local rules",
        "資料夾已有本地 AI 規則",
        "已補齊缺少檔案，但仍要檢查入口連接",
        "upgrade --dry-run",
        "既有 `AGENTS.md` 保留",
        "乾淨首次安裝"
      ]
    },
    {
      id: "3a",
      snippets: [
        "upgrade metadata-only stale",
        "Kit 檔案已更新",
        "版本詳情不在升級流程內展開",
        "metadata 更新紀錄",
        "template version metadata 更新為當前版本",
        "doctor self-check 不再提示項目版本未對齊",
        "你已經是最新版本，沒有檔案需要建立或合併",
        "安裝完成",
        "I just installed agent-handoff-kit. Help me get started.",
        "本次升級涵蓋"
      ]
    },
    {
      id: "3b",
      snippets: [
        "upgrade structurally stale",
        "Kit 檔案已更新",
        "進行中的工作對話已熟悉 Agent Handoff Kit 可繼續使用原本開工方式",
        "版本詳情不在升級流程內展開",
        "template version metadata 更新為當前版本",
        "安裝完成",
        "I just installed agent-handoff-kit. Help me get started.",
        "I just upgraded agent-handoff-kit",
        "本次升級涵蓋"
      ]
    },
    {
      id: "3c",
      snippets: [
        "upgrade stale lifecycle placeholder",
        "舊版本 metadata",
        "Reclassified at upgrade",
        "升級驗收完成",
        "handoff lifecycle mechanical checks",
        "本次升級涵蓋"
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
        "升級後自動檢查"
      ]
    },
    {
      id: "4b",
      snippets: [
        "upgrade no-op",
        "handoff lifecycle",
        "Kit 檔案已是最新版本，沒有檔案需要建立或合併",
        "完整 doctor 健康檢查未通過",
        "status: failed",
        "handoff lifecycle mechanical checks",
        "不要重裝或覆寫用戶內容",
        "繼續日常使用即可"
      ]
    },
    {
      id: "4f",
      snippets: [
        "upgrade no-op schema auto-repair",
        "handoff opening message structure",
        "If this root does not match the expected project root",
        "restore root mismatch guard in Next Session Opening Message",
        "status: passed",
        "升級驗收完成"
      ]
    },
    {
      id: "4g",
      snippets: [
        "upgrade no-op temperature auto-repair",
        "handoff temperature boundary checks",
        "historical npm latest state",
        "historical GitHub Release state",
        "move historical evidence out of hot handoff state",
        "regenerate prompt from repaired handoff opening message",
        "status: passed",
        "升級驗收完成"
      ]
    },
    {
      id: "4c",
      snippets: [
        "upgrade substantive with stale prompt convenience copy",
        "START_NEXT_SESSION_PROMPT.txt",
        "便利副本落後只可 warning",
        "升級驗收完成",
        "status: failed"
      ]
    },
    {
      id: "4d",
      snippets: [
        "upgrade anchor drift auto-repair",
        "dev/rules/safety.md",
        "cmd /c rmdir",
        "restore safety pack high-risk rules in ## Rules section",
        "升級驗收完成",
        "anchor checks failed"
      ],
      mustHaveCell: ["dev/rules/safety.md", "restore safety pack high-risk rules in ## Rules section", "cmd /c rmdir"],
      mustNotCell: ["anchor checks failed", "不要重跑 upgrade"]
    },
    {
      id: "4e",
      snippets: [
        "upgrade handoff continuity anchor auto-repair",
        "dev/SESSION_HANDOFF.md",
        "do not create an archive directory by default",
        "insert handoff archive continuity rule",
        "升級驗收完成",
        "anchor checks failed"
      ],
      mustHaveCell: ["dev/SESSION_HANDOFF.md", "insert handoff archive continuity rule", "do not create an archive directory by default"],
      mustNotCell: ["anchor checks failed", "不要重跑 upgrade"]
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
        "檢查已通過",
        "項目狀態速覽",
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
    assert(line, `docs/qa/release-grade-qa.md missing scenario ${row.id} row in multi-scenario table`);
    for (const snippet of row.snippets) {
      assert(line.includes(snippet), `docs/qa/release-grade-qa.md scenario ${row.id} row is not aligned with release scenario contract; missing: ${snippet}`);
    }
    const cells = markdownTableCells(line);
    if (row.mustHaveCell) {
      for (const snippet of row.mustHaveCell) {
        assert(cells[2]?.includes(snippet), `docs/qa/release-grade-qa.md scenario ${row.id} must-have cell missing: ${snippet}`);
      }
    }
    if (row.mustNotCell) {
      for (const snippet of row.mustNotCell) {
        assert(cells[3]?.includes(snippet), `docs/qa/release-grade-qa.md scenario ${row.id} must-NOT-have cell missing: ${snippet}`);
      }
    }
  }
  assert(qaDoc.includes("場景 1 / 2 / 3a / 3b / 3c / 4 / 4b / 4c / 4d / 4e / 4f / 4g / 5 / 6 / 7 為 automated"), "docs/qa/release-grade-qa.md automated simulation scope must list every scenario");
  assert(qaDoc.includes("upgrade quality matrix"), "docs/qa/release-grade-qa.md must document the upgrade quality matrix");
  assert(qaDoc.includes("版本、功能、穩定性三軸"), "docs/qa/release-grade-qa.md must define upgrade as version, function, and stability coverage");
  assert(qaDoc.includes("dev/SESSION_LOG.md") && qaDoc.includes("dev/PROJECT_DECISIONS.md") && qaDoc.includes("dev/rules/integrations.md") && qaDoc.includes("dev/rules/onboarding.md"), "docs/qa/release-grade-qa.md upgrade quality matrix must list the non-single-file upgrade drift coverage");
  assert(!qaDoc.includes("場景 2 / 5 / 7 屬 conditional state"), "docs/qa/release-grade-qa.md still claims scenario 2 / 5 / 7 are manual-only");
  assert(!qaDoc.includes("七個場景嘅 output contract"), "docs/qa/release-grade-qa.md still describes the scenario table as seven scenarios");
  console.log("ok: docs/qa/release-grade-qa.md multi-scenario table aligned with CLI scenario contract");
}

function markdownTableCells(line) {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

// R-031.1 v0.3.1+: CLI scenario branching simulation. Real-invoke bin in automated
// scenarios and assert must-have / must-not-have output per scenario contract.
// Scenario 3 is split inline into 3a metadata-only stale, 3b structurally stale
// via a real v0.1.7 fixture, and 3c stale lifecycle placeholder from an older
// metadata row, so the upgrade-substantive path is no longer delegated to
// `scripts/check-upgrade-safety.mjs`.
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
      /Start Agent Handoff/,
      /Read AGENTS\.md first, then Start Agent Handoff/,
      /下面這句不是終端機指令/,
      /能讀寫此資料夾的 AI agent/,
      /普通 web chat AI 若不能讀寫本機資料夾，並不適合使用本工具/,
      /不用再留在終端機/,
      /START_NEXT_SESSION_PROMPT\.txt/
    ],
    mustNotHave: [
      /✅ 升級完成：/,
      /你已經是最新版本/,
      /I just installed agent-handoff-kit\. Help me get started\./,
      /I just upgraded agent-handoff-kit/
    ]
  });

  // Scenario 2: init in a folder with existing local AI rules. `init` merges the
  // managed core into AGENTS.md, preserves local prose, and completes the install
  // without an unnecessary second upgrade ceremony.
  const s2Root = path.join(tempBase, "scenario-install-existing-local-rules");
  mkdirSync(s2Root, { recursive: true });
  const s2AgentsPath = path.join(s2Root, "AGENTS.md");
  writeFileSync(s2AgentsPath, "# Local AI Rules\n\nKeep this user-owned line.\n", "utf8");
  const s2 = run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", s2Root], "scenario 2 init with existing local rules", { env });
  assertScenarioOutput("scenario 2 (init preserves existing local rules)", s2.stdout, {
    mustHave: [
      /✅ 安裝完成：下一步請在 AI 對話中操作/,
      /merged: 1/,
      /skipped existing: 0/,
      /Start Agent Handoff/
    ],
    mustNotHave: [
      /已補齊缺少檔案，但仍要檢查入口連接/,
      /upgrade --dry-run/,
      /I just installed agent-handoff-kit\. Help me get started\./,
      /Read AGENTS\.md first\. Then open START_NEXT_SESSION_PROMPT\.txt/,
      /工具已停手，沒有覆寫 conflict 檔案/
    ]
  });
  const s2AgentsPost = readFileSync(s2AgentsPath, "utf8");
  assert(s2AgentsPost.includes("Keep this user-owned line."), "scenario 2 init overwrote existing AGENTS.md");

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
      /升級後自動檢查/
    ]
  });
  // Output should be short — no-op short-circuit drops the ceremony.
  const s4LineCount = s4.stdout.split("\n").length;
  if (s4LineCount > 20) {
    throw new Error(`scenario 4 (upgrade no-op) output too long: ${s4LineCount} lines (expected ≤ 20). Short-circuit may have failed; check printUpgradeNoopShortCircuit + isUpgradeNoopAtPlanTime logic in bin.`);
  }
  console.log(`ok: scenario 4 output ${s4LineCount} lines (≤ 20 threshold)`);

  // Scenario 4b: upgrade no-op, but handoff lifecycle field is still a placeholder
  // after substantive AI-generated content exists. This guards the v0.3.7 real-user
  // miss where upgrade said "繼續日常使用即可" while doctor failed immediately after.
  // The fixture deliberately contains generic package-scope and pending wording; the
  // product check must not infer lifecycle truth from arbitrary AI prose.
  const s4bRoot = path.join(tempBase, "scenario-upgrade-noop-handoff-needs-closeout");
  const s4bInit = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", s4bRoot], { encoding: "utf8", env, cwd: root });
  if (s4bInit.status !== 0) {
    throw new Error(`Scenario 4b init prep failed: ${s4bInit.stderr || s4bInit.stdout}`);
  }
  const s4bHandoffPath = path.join(s4bRoot, "dev/SESSION_HANDOFF.md");
  let s4bHandoff = readFileSync(s4bHandoffPath, "utf8");
  s4bHandoff = s4bHandoff
    .replace("Record only work actually completed in the current session.\n\n1. TBD", "Record only work actually completed in the current session.\n\n1. Completed `@adamchanadam` package verification and upgrade UX review.")
    .replace("## Next Priorities\n\n1. TBD", "## Next Priorities\n\n1. Pending maintainer publish decision; continue normal project work after closeout.")
    .replace("- Checks run this session: TBD", "- Checks run this session: Verified package scope and no-op upgrade journey.")
    .replace("## Next Session Opening Message\n\n📋 Next session: agent-managed startup content below", "## Next Session Opening Message\n\n📋 Next session: agent-managed startup content below");
  writeFileSync(s4bHandoffPath, s4bHandoff, "utf8");
  const s4b = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", s4bRoot], { encoding: "utf8", env, cwd: root });
  if (s4b.status === 0) {
    throw new Error(`scenario 4b upgrade no-op expected failure but exited 0\n${s4b.stdout}`);
  }
  assertScenarioOutput("scenario 4b (upgrade no-op, handoff needs closeout)", `${s4b.stdout}\n${s4b.stderr}`, {
    mustHave: [
      /Kit 檔案已是最新版本，沒有檔案需要建立或合併/,
      /完整 doctor 健康檢查未通過/,
      /status: failed/,
      /handoff lifecycle mechanical checks/,
      /不要重裝或覆寫用戶內容/
    ],
    mustNotHave: [
      /繼續日常使用即可/,
      /✅ 結果：你已經是最新版本/,
      /✅ 安裝完成：/,
      /✅ 升級完成：/,
      /I just installed agent-handoff-kit\. Help me get started\./,
      /I just upgraded agent-handoff-kit/
    ]
  });
  const s4bDoctor = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "doctor", "--root", s4bRoot], { encoding: "utf8", env, cwd: root });
  if (s4bDoctor.status === 0) {
    throw new Error(`scenario 4b doctor expected failure but exited 0\n${s4bDoctor.stdout}`);
  }
  assertScenarioOutput("scenario 4b (doctor reports handoff closeout needed)", s4bDoctor.stdout, {
    mustHave: [
      /status: failed/,
      /handoff lifecycle mechanical checks/,
      /completed work is not carried forward as unresolved next work/
    ],
    mustNotHave: [
      /status: passed/,
      /繼續日常使用即可/
    ]
  });

  // Scenario 4f: upgrade no-op with a repairable schema failure. The handoff
  // opening message lost the root mismatch guard, which is Kit-owned startup
  // safety text. Upgrade should restore it and pass doctor, not offload this
  // template drift to the user.
  const s4fRoot = path.join(tempBase, "scenario-upgrade-noop-schema-auto-repair");
  const s4fInit = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", s4fRoot], { encoding: "utf8", env, cwd: root });
  if (s4fInit.status !== 0) {
    throw new Error(`Scenario 4f init prep failed: ${s4fInit.stderr || s4fInit.stdout}`);
  }
  const s4fHandoffPath = path.join(s4fRoot, "dev/SESSION_HANDOFF.md");
  writeFileSync(
    s4fHandoffPath,
    readFileSync(s4fHandoffPath, "utf8").replace("If the root does not match the handoff", "If this startup guard is missing"),
    "utf8"
  );
  const s4f = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", s4fRoot], "scenario 4f upgrade no-op schema auto-repair", { env });
  assertScenarioOutput("scenario 4f (upgrade no-op, schema auto-repair)", s4f.stdout, {
    mustHave: [
      /update handoff lifecycle[/]startup contracts/,
      /status: passed/,
      /✅ migration committed/,
      /✅ project health: passed/
    ],
    mustNotHave: [
      /handoff opening message structure[\s\S]*missing/,
      /完整 doctor 健康檢查未通過/,
      /status: failed/,
      /繼續日常使用即可/,
      /✅ 安裝完成：/,
      /✅ 升級完成：/
    ]
  });
  const s4fDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", s4fRoot], "scenario 4f doctor after schema auto-repair", { env });
  assert(s4fDoctor.stdout.includes("status: passed"), "scenario 4f doctor must pass after schema auto-repair");

  // Scenario 4g: upgrade no-op with repairable current-state temperature failure.
  // This reproduces the real Agent_Public_Squares class in generic form:
  // historical release/npm evidence sits in hot handoff and prompt state. Upgrade
  // should clean the hot state, regenerate the prompt copy, and pass doctor.
  const s4gRoot = path.join(tempBase, "scenario-upgrade-noop-temperature-auto-repair");
  const s4gInit = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", s4gRoot], { encoding: "utf8", env, cwd: root });
  if (s4gInit.status !== 0) {
    throw new Error(`Scenario 4g init prep failed: ${s4gInit.stderr || s4gInit.stdout}`);
  }
  const s4gHandoffPath = path.join(s4gRoot, "dev/SESSION_HANDOFF.md");
  writeFileSync(
    s4gHandoffPath,
    readFileSync(s4gHandoffPath, "utf8").replace(
      "6. Installed Integrations registry:",
      "6. npm latest 0.3.23 and GitHub Release v0.3.23 are historical release evidence.\n7. Installed Integrations registry:"
    ),
    "utf8"
  );
  writeFileSync(
    path.join(s4gRoot, "START_NEXT_SESSION_PROMPT.txt"),
    `${readFileSync(path.join(s4gRoot, "START_NEXT_SESSION_PROMPT.txt"), "utf8").trimEnd()}\n\nnpm latest 0.3.23 and GitHub Release v0.3.23 are historical release evidence.\n`,
    "utf8"
  );
  const s4g = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", s4gRoot], "scenario 4g upgrade no-op temperature auto-repair", { env });
  assertScenarioOutput("scenario 4g (upgrade no-op, temperature auto-repair)", s4g.stdout, {
    mustHave: [
      /update handoff lifecycle[/]startup contracts/,
      /status: passed/,
      /✅ migration committed/,
      /✅ project health: passed/
    ],
    mustNotHave: [
      /✅ 結果：你已經是最新版本/,
      /完整 doctor 健康檢查未通過/,
      /status: failed/,
      /繼續日常使用即可/,
      /✅ 安裝完成：/,
      /✅ 升級完成：/
    ]
  });
  const s4gDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", s4gRoot], "scenario 4g doctor after temperature auto-repair", { env });
  assert(s4gDoctor.stdout.includes("status: passed"), "scenario 4g doctor must pass after temperature auto-repair");

  // Scenario 4c: stale START_NEXT_SESSION_PROMPT.txt convenience copy. The project
  // has a legacy unmarked AGENTS core, so upgrade performs a substantive merge.
  // If the authoritative handoff opening message is readable, the prompt copy is
  // Kit-owned and can be regenerated safely; upgrade should repair it instead of
  // leaving a warning for the user.
  const s4cRoot = path.join(tempBase, "scenario-upgrade-stale-prompt-copy");
  const s4cInit = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", s4cRoot], { encoding: "utf8", env, cwd: root });
  if (s4cInit.status !== 0) {
    throw new Error(`Scenario 4c init prep failed: ${s4cInit.stderr || s4cInit.stdout}`);
  }
  const s4cAgentsPath = path.join(s4cRoot, "AGENTS.md");
  writeFileSync(s4cAgentsPath, [
    "# Project Local Preamble",
    "",
    "Keep this local rule.",
    "",
    staleCoreFixture()
  ].join("\n"), "utf8");
  // This fixture represents a pre-R-034 legacy project. It cannot retain the
  // fresh-only formal router after replacing AGENTS with the legacy core: that
  // mixed state must be a product conflict, not an auto-repair fixture.
  rmSync(path.join(s4cRoot, "dev", "USER_RULES.md"), { force: true });
  writeFileSync(
    path.join(s4cRoot, "START_NEXT_SESSION_PROMPT.txt"),
    "Work in <absolute project root>.\n\nRead AGENTS.md and continue.\n",
    "utf8"
  );
  const s4c = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", s4cRoot], "scenario 4c upgrade with stale prompt convenience copy", { env });
  assertScenarioOutput("scenario 4c (stale prompt convenience copy auto-repair)", s4c.stdout, {
    mustHave: [
      /replace unmarked legacy Agent Handoff Kit core with managed-marker block/,
      /✅ migration committed/,
      /✅ project health: passed/
    ],
    mustNotHave: [
      /warn  START_NEXT_SESSION_PROMPT.txt/,
      /status: failed/,
      /anchor checks failed/,
      /請執行：npx --yes @adamchanadam\/agent-handoff-kit@latest upgrade --dry-run/
    ]
  });
  const s4cPrompt = readFileSync(path.join(s4cRoot, "START_NEXT_SESSION_PROMPT.txt"), "utf8");
  assert(s4cPrompt.includes("Read AGENTS.md, then dev/SESSION_HANDOFF.md"), "scenario 4c prompt copy must be regenerated from handoff opening message");

  // Scenario 4d: when a Kit-maintained file lacks a required anchor, upgrade
  // must repair the bounded missing anchor and pass self-check. A novice should
  // not be sent to ask AI to repair the upgrade result.
  const s4dRoot = path.join(tempBase, "scenario-upgrade-self-check-anchor-failure");
  const s4dInit = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", s4dRoot], { encoding: "utf8", env, cwd: root });
  if (s4dInit.status !== 0) {
    throw new Error(`Scenario 4d init prep failed: ${s4dInit.stderr || s4dInit.stdout}`);
  }
  const s4dAgentsPath = path.join(s4dRoot, "AGENTS.md");
  writeFileSync(s4dAgentsPath, [
    "# Project Local Preamble",
    "",
    "Keep this local rule.",
    "",
    staleCoreFixture()
  ].join("\n"), "utf8");
  // Keep the legacy fixture internally coherent for the same reason as 4c.
  rmSync(path.join(s4dRoot, "dev", "USER_RULES.md"), { force: true });
  const s4dSafetyPath = path.join(s4dRoot, "dev/rules/safety.md");
  writeFileSync(
    s4dSafetyPath,
    readFileSync(s4dSafetyPath, "utf8").replace("cmd /c rmdir", "cmd command removed from this stale local copy"),
    "utf8"
  );
  const s4d = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", s4dRoot], "scenario 4d anchor drift auto-repair", { env });
  assertScenarioOutput("scenario 4d (upgrade anchor drift auto-repair)", s4d.stdout, {
    mustHave: [
      /dev\/rules\/safety.md/,
      /restore safety pack high-risk rules in ## Rules section/,
      /✅ migration committed/,
      /✅ project health: passed/,
      /status: passed/
    ],
    mustNotHave: [
      /anchor checks failed/,
      /不要重跑 upgrade/,
      /非破壞性補回缺失 anchor/,
      /請執行：npx --yes @adamchanadam\/agent-handoff-kit@latest upgrade --dry-run；不要手動覆寫既有檔案/
    ]
  });

  // Scenario 4e: a Kit-owned handoff continuity anchor is missing from
  // SESSION_HANDOFF.md. Unlike user-owned safety-rule drift, this can be
  // non-destructively restored by upgrade because the missing line belongs to the
  // maintained handoff template contract. This guards the v0.3.21 public runtime
  // failure where upgrade skipped SESSION_HANDOFF.md and doctor immediately failed.
  const s4eRoot = path.join(tempBase, "scenario-upgrade-handoff-continuity-auto-repair");
  const s4eInit = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", s4eRoot], { encoding: "utf8", env, cwd: root });
  if (s4eInit.status !== 0) {
    throw new Error(`Scenario 4e init prep failed: ${s4eInit.stderr || s4eInit.stdout}`);
  }
  const s4eHandoffPath = path.join(s4eRoot, "dev/SESSION_HANDOFF.md");
  writeFileSync(
    s4eHandoffPath,
    readFileSync(s4eHandoffPath, "utf8").replace("; do not create an archive directory by default", ""),
    "utf8"
  );
  const s4e = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", s4eRoot], "scenario 4e handoff continuity auto-repair", { env });
  assertScenarioOutput("scenario 4e (handoff continuity anchor auto-repair)", s4e.stdout, {
    mustHave: [
      /merge: 1/,
      /update handoff lifecycle[/]startup contracts/,
      /✅ migration committed/,
      /✅ project health: passed/,
      /status: passed/
    ],
    mustNotHave: [
      /anchor checks failed/,
      /不要重跑 upgrade/,
      /非破壞性補回缺失 anchor/,
      /Agent Handoff Kit Anchor Repair/
    ]
  });
  const s4eHandoffPost = readFileSync(s4eHandoffPath, "utf8");
  assert(s4eHandoffPost.includes("do not create an archive directory by default"), "scenario 4e did not restore handoff archive continuity anchor");

  // R-031.3 v0.3.4+: Scenario 3 split into 3a (metadata-only stale) + 3b (structurally
  // stale via real test-fixtures/v0.1.7 fixture) per minimum-correct fix from cross-AI
  // root-fix audit. Old single scenario used `init + rewrite version row` which left
  // structure fully current — never tested the inject-vs-merge ordering bug because
  // PROJECT_INDEX kept its v0.3.x `## Installed Integrations` section, so upgrade plan
  // marked it `skip` not `merge`. Real-user case (Adam v0.3.3 first-test) had both
  // metadata + structure stale; the new 3a + 3b split covers each axis independently.

  // Scenario 3a — synthetic, metadata-only non-exact state: current init + only
  // rewrite the version row. This is not a published historical artifact, so the
  // changed whole file has no raw-byte ownership identity. R-034 therefore must
  // preserve it and bind that preservation to the shared readback; an old
  // metadata-injection expectation cannot authorize a rewrite.
  const s3aRoot = path.join(tempBase, "scenario-upgrade-metadata-only");
  const s3aInit = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", s3aRoot], { encoding: "utf8", env, cwd: root });
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
  const s3aIndexBefore = readFileSync(s3aIndexPath);
  const s3a = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", s3aRoot], "scenario 3a upgrade metadata-only stale", { env });
  assertScenarioOutput("scenario 3a (upgrade metadata-only stale)", s3a.stdout, {
    mustHave: [
      /Kit migration 已通過離線遷移驗收/,
      /✅ migration committed/,
      /版本詳情不在升級流程內展開/,
      /github\.com\/Adamchanadam\/agent-handoff-kit\/releases\/latest/
    ],
    mustNotHave: [
      /✅ 結果：你已經是最新版本/,
      /本次升級涵蓋/,
      /^# v0\./m,
      /本版新加了甚麼/,
      /I just upgraded agent-handoff-kit/
    ]
  });
  assertConciseUpgradeSuccessNarrative("scenario 3a (upgrade metadata-only stale)", s3a.stdout, currentVersion);
  assert(readFileSync(s3aIndexPath).equals(s3aIndexBefore), "scenario 3a rewrote non-exact PROJECT_INDEX bytes");
  const s3aDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", s3aRoot], "scenario 3a ordinary doctor after preserved metadata", { env });
  const s3aMigrations = path.join(s3aRoot, "dev", "governance_migrations");
  const s3aTransactions = readdirSync(s3aMigrations)
    .filter((name) => existsSync(path.join(s3aMigrations, name, "transaction.json")))
    .sort();
  const s3aTransaction = s3aTransactions.at(-1);
  const s3aJournal = s3aTransaction
    ? JSON.parse(readFileSync(path.join(s3aMigrations, s3aTransaction, "transaction.json"), "utf8"))
    : null;
  const s3aEntry = s3aJournal?.runtimeAcceptance?.entries?.find((entry) => entry.targetRel === "dev/PROJECT_INDEX.md");
  const s3aDigest = s3aJournal?.currentStateWitness?.currentStateDigest;
  const s3aReport = s3aTransaction
    ? readFileSync(path.join(s3aMigrations, s3aTransaction, "migration-report.md"), "utf8")
    : "";
  assert(
    s3aDoctor.stdout.includes("status: passed")
      && s3aEntry?.disposition === "preserve"
      && s3aEntry?.activeReader?.reader === "AGENTS.md"
      && s3aEntry?.activeReader?.via === "direct-formal-entry"
      && s3aEntry?.effectDecision === "preserve-unmodified-through-direct-stateful-formal-entry"
      && s3aDigest
      && s3aJournal.currentStateReadback?.currentStateDigest === s3aDigest
      && s3aReport.includes(s3aDigest),
    "scenario 3a did not bind preserved PROJECT_INDEX to the shared doctor/report current-state readback"
  );
  console.log("ok: scenario 3a preserves synthetic non-exact PROJECT_INDEX bytes and doctor/report read the same accepted state");

  // Scenario 3b — structurally stale via real test-fixtures/v0.1.7 fixture:
  // PROJECT_INDEX comes from actual v0.1.7 init output, lacks v0.2.0+
  // `## Installed Integrations` section, so upgrade plan marks it for `merge`.
  // Catches the inject-vs-merge ordering bug — without inject-after-merge fix,
  // merge writes mergedText (with v0.1.7 row) AFTER inject, leaving root stale.
  const s3bRoot = path.join(tempBase, "scenario-upgrade-structurally-stale");
  const s3bInit = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", s3bRoot], { encoding: "utf8", env, cwd: root });
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
      /Kit migration 已通過離線遷移驗收/,
      /✅ migration committed/,
      /版本詳情不在升級流程內展開/,
      /github\.com\/Adamchanadam\/agent-handoff-kit\/releases\/latest/
    ],
    mustNotHave: [
      /✅ 安裝完成：/,
      /I just installed agent-handoff-kit\. Help me get started\./,
      /項目內記錄的 Kit 版本與目前工具版本不同/,
      /本次升級涵蓋/,
      /^# v0\./m,
      /本版新加了甚麼/,
      /I just upgraded agent-handoff-kit/
    ]
  });
  assertConciseUpgradeSuccessNarrative("scenario 3b (upgrade structurally-stale via real v0.1.7 fixture)", s3b.stdout, currentVersion);
  const s3bPostIndex = readFileSync(s3bIndexPath, "utf8");
  const s3bVersionMatch = s3bPostIndex.match(/\| Agent Handoff Kit template version \| ([\d.]+) \|/);
  if (!s3bVersionMatch || s3bVersionMatch[1] !== currentVersion) {
    throw new Error(`scenario 3b post-upgrade: PROJECT_INDEX template version expected v${currentVersion}, got v${s3bVersionMatch?.[1] ?? "missing"}`);
  }
  console.log(`ok: scenario 3b (structurally stale) post-upgrade template version = v${s3bVersionMatch[1]}`);

  // Scenario 3c — stale lifecycle placeholder with older template metadata.
  // These stateful files no longer have exact package bytes. R-034 therefore
  // preserves them whole and proves their direct reader/effect through the
  // shared transaction state; pathname and a familiar lifecycle marker do not
  // grant replacement ownership.
  const s3cRoot = path.join(tempBase, "scenario-upgrade-stale-lifecycle-placeholder");
  materializePinnedV041ArtifactInit(s3cRoot);
  const s3cIndexPath = path.join(s3cRoot, "dev/PROJECT_INDEX.md");
  const s3cHandoffPath = path.join(s3cRoot, "dev/SESSION_HANDOFF.md");
  let s3cHandoff = readFileSync(s3cHandoffPath, "utf8");
  s3cHandoff = s3cHandoff
    .replace("Record only work actually completed in the current session.\n\n1. TBD", "Record only work actually completed in the current session.\n\n1. Installed Agent Handoff Kit v0.1.7 and filled project baseline fields.")
    .replace("- Checks run this session: TBD", "- Checks run this session: init succeeded; doctor had not been run before upgrade.");
  writeFileSync(s3cHandoffPath, s3cHandoff, "utf8");
  const s3cIndexBefore = readFileSync(s3cIndexPath);
  const s3cHandoffBefore = readFileSync(s3cHandoffPath);
  const s3c = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", s3cRoot], "scenario 3c upgrade stale lifecycle placeholder", { env });
  assertScenarioOutput("scenario 3c (upgrade stale lifecycle placeholder)", s3c.stdout, {
    mustHave: [
      /Kit migration 已通過離線遷移驗收/,
      /dev\/SESSION_HANDOFF\.md has no exact historical raw-byte identity after root\/version initialization/,
      /版本詳情不在升級流程內展開/,
      /github\.com\/Adamchanadam\/agent-handoff-kit\/releases\/latest/,
      /✅ migration committed/,
      /✅ project health: passed/
    ],
    mustNotHave: [
      /missing  dev\/SESSION_HANDOFF.md \(handoff lifecycle mechanical checks\)/,
      /status: failed/,
      /交接狀態仍需 AI closeout 核對/,
      /本次升級涵蓋/,
      /^# v0\./m,
      /本版新加了甚麼/,
      /I just upgraded agent-handoff-kit/
    ]
  });
  assertConciseUpgradeSuccessNarrative("scenario 3c (upgrade stale lifecycle placeholder)", s3c.stdout, currentVersion);
  assert(readFileSync(s3cIndexPath).equals(s3cIndexBefore), "scenario 3c overwrote non-exact PROJECT_INDEX bytes");
  assert(readFileSync(s3cHandoffPath).equals(s3cHandoffBefore), "scenario 3c overwrote non-exact handoff bytes");
  const s3cDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", s3cRoot], "scenario 3c ordinary doctor after preserved-state upgrade", { env });
  const s3cMigrations = path.join(s3cRoot, "dev", "governance_migrations");
  const s3cTransactions = readdirSync(s3cMigrations)
    .filter((name) => existsSync(path.join(s3cMigrations, name, "transaction.json")))
    .sort();
  const s3cTransaction = s3cTransactions.at(-1);
  const s3cJournal = s3cTransaction
    ? JSON.parse(readFileSync(path.join(s3cMigrations, s3cTransaction, "transaction.json"), "utf8"))
    : null;
  const s3cEntries = s3cJournal?.runtimeAcceptance?.entries ?? [];
  const s3cStatefulEntries = ["dev/SESSION_HANDOFF.md", "dev/PROJECT_INDEX.md"]
    .map((targetRel) => s3cEntries.find((entry) => entry.targetRel === targetRel));
  const s3cDigest = s3cJournal?.currentStateWitness?.currentStateDigest;
  const s3cReport = s3cTransaction
    ? readFileSync(path.join(s3cMigrations, s3cTransaction, "migration-report.md"), "utf8")
    : "";
  assert(
    s3cDoctor.stdout.includes("status: passed")
      && s3cStatefulEntries.every((entry) => entry?.disposition === "preserve"
        && entry?.activeReader?.reader === "AGENTS.md"
        && entry?.activeReader?.via === "direct-formal-entry"
        && entry?.effectDecision === "preserve-unmodified-through-direct-stateful-formal-entry")
      && s3cDigest
      && s3cJournal.currentStateReadback?.currentStateDigest === s3cDigest
      && s3cReport.includes(s3cDigest),
    "scenario 3c did not bind preserved stateful files to the shared doctor/report current-state readback"
  );
  console.log("ok: scenario 3c preserves non-exact stateful bytes and doctor/report read the same accepted state");

  // Scenario 5: upgrade with conflict. This guards the user-facing stop state:
  // when a bridge file cannot be safely merged, output must say the upgrade is
  // not complete and must not print the success ceremony.
  const s5Root = path.join(tempBase, "scenario-upgrade-with-conflict");
  const s5Init = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", s5Root], { encoding: "utf8", env, cwd: root });
  if (s5Init.status !== 0) {
    throw new Error(`Scenario 5 init prep failed: ${s5Init.stderr || s5Init.stdout}`);
  }
  const s5ClaudePath = path.join(s5Root, "CLAUDE.md");
  writeFileSync(s5ClaudePath, "# Local Claude Instructions\n\nThis file intentionally does not route to the Kit entry file.\n", "utf8");
  const s5 = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", s5Root], { encoding: "utf8", env, cwd: root });
  if (s5.status === 0) {
    throw new Error(`scenario 5 upgrade with conflict expected non-zero exit\n${s5.stdout}`);
  }
  assertScenarioOutput("scenario 5 (upgrade with conflict)", s5.stdout, {
    mustHave: [
      /conflict: 1/,
      /升級預檢發現 conflict/,
      /治理目標檔、版本與 migration artifact 均沒有寫入/,
      /你不用判斷技術差異/,
      /能讀寫這個資料夾的 AI/,
      /授權合併/,
      /doctor 與 hash 讀回驗收/,
      /未知本地 hash 只作內容 witness/
    ],
    mustNotHave: [
      /✅ 升級完成：/,
      /migration report:/,
      /升級後自動檢查/,
      /I just upgraded agent-handoff-kit/,
      /Kit 開發者/,
      /可讀取專案的 AI/,
      /可讀取檔案的 AI/,
      /support local hash/,
      /支援本地 hash/,
      /maintainer local-hash/
    ]
  });
  const s5ClaudePost = readFileSync(s5ClaudePath, "utf8");
  assert(s5ClaudePost.includes("intentionally does not route"), "scenario 5 conflict file was overwritten");

  // Scenario 6: doctor healthy & latest
  const s6 = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", s1Root], "scenario 6 doctor healthy & latest", { env });
  assertScenarioOutput("scenario 6 (doctor healthy & latest)", s6.stdout, {
    mustHave: [
      /status: passed/,
      /檢查已通過/,
      // R-031.2 v0.3.2+: 項目狀態速覽（三向 version + 距上次 closeout + 項目首次安裝）
      // Loosened from /📦 版本：工具 v/ to /📦 版本：工具/ — aligned branch wording is
      // "工具 / 項目記錄 / npm latest 三向對齊 vX" where "工具" is followed by "/" not "v",
      // so the original anchor missed the aligned case when network fetch succeeded.
      /項目狀態速覽/,
      /📦 版本：工具/,
      /📅 上次收工/,
      /🌱 項目首次安裝距今/
    ],
    mustNotHave: [
      /如要升級到較新版/
    ]
  });

  // Scenario 7: doctor healthy with a newer version available. Ordinary doctor
  // owns its single registry lookup and reports that result itself; it must not
  // rely on the separate startup update-notice banner.
  const newerVersion = nextPatch(currentVersion);
  const s7Env = {
    ...process.env,
    AGENT_HANDOFF_KIT_UPDATE_CHECK_FORCE: "1",
    AGENT_HANDOFF_KIT_UPDATE_MOCK_LATEST: newerVersion
  };
  const s7 = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", s1Root], "scenario 7 doctor healthy with newer available", { env: s7Env });
  assertScenarioOutput("scenario 7 (doctor healthy with newer available)", s7.stdout, {
    mustHave: [
      new RegExp(`npm 有新版（v${escapeRegExp(newerVersion)}）；doctor 只檢查不修改`),
      /status: passed/,
      /檢查已通過/
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

function assertConciseUpgradeSuccessNarrative(label, output, expectedVersion) {
  const start = output.indexOf("🛠️  Kit migration 已通過離線遷移驗收");
  assert(start >= 0, `${label} missing upgrade pre-check narrative start`);
  const autoCheck = output.indexOf("✅ migration committed", start);
  assert(autoCheck >= 0, `${label} missing post-upgrade auto-check boundary`);

  const section = output.slice(start, autoCheck);
  const nonEmptyLines = section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  assert(nonEmptyLines.length <= 8, `${label} upgrade success narrative too long: ${nonEmptyLines.length} non-empty lines`);
  // The required same-run doctor wording makes the verified concise narrative
  // 431 characters. Keep the cap tight enough to reject even a small extra line
  // or release-note expansion while allowing that mandatory health boundary.
  assert(section.length <= 432, `${label} upgrade success narrative too long: ${section.length} chars`);
  assert(section.includes("版本詳情不在升級流程內展開"), `${label} missing concise release-details pointer`);
  assert(section.includes("https://github.com/Adamchanadam/agent-handoff-kit/releases/latest"), `${label} missing GitHub Release link`);
  assert(output.includes(`📦 版本：v${expectedVersion}`), `${label} output version does not match package version v${expectedVersion}`);
  assert(!/^#\s+v\d+\.\d+\.\d+/m.test(section), `${label} printed markdown release-note heading`);
  assert(!/^##\s+/m.test(section), `${label} printed markdown release-note subsection`);
  assert(!section.includes("本版新加了甚麼"), `${label} printed release-note body heading`);
  assert(!section.includes("對你已有檔案的影響"), `${label} printed release-note impact section`);
  assert(!section.includes("建議下一步"), `${label} printed release-note recommendation section`);
  console.log(`ok: ${label} concise upgrade success narrative (${nonEmptyLines.length} lines, ${section.length} chars)`);
}

function staleCoreFixture() {
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

External skill flows, subagents, task plans, or another tool's "finish" step do not replace this loop.

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
9. Regenerate \`START_NEXT_SESSION_PROMPT.txt\` from \`dev/SESSION_HANDOFF.md\`, then read it back or verify it.
10. Show a short closeout card, then provide the next-session startup entry: \`Start Agent Handoff\` / \`開工\`, plus the path-bearing fallback when the next AI is not yet pointed at this project root.

## 5. Pack Loading

Use \`dev/RULE_PACKS.md\` to decide which pack to read.

## Core Complexity Rule

New default-core rules are allowed only when they apply to most sessions, protect safety or continuity, cannot live in a pack or registry, and keep the core within budget.
`;
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

function latestChangelogSection(text) {
  const latestHeading = text.match(/^## v[\d.]+[^\n]*/m);
  if (!latestHeading) {
    throw new Error(`CHANGELOG.md missing latest "## v<version>" heading — anchor-bounded section read cannot proceed`);
  }
  const startIdx = latestHeading.index;
  const afterStart = text.slice(startIdx + latestHeading[0].length);
  const nextHeadingMatch = afterStart.match(/\n## v[\d.]+/);
  const endIdx = nextHeadingMatch ? startIdx + latestHeading[0].length + nextHeadingMatch.index : text.length;
  return text.slice(startIdx, endIdx);
}

function checkForbiddenVocabularyInChangelogLatestSection(text, patterns) {
  // Bound to the latest version section: from the first "## v" heading to the next "## v"
  // heading (or end of file). Historical sections are intentionally excluded.
  const latestSection = latestChangelogSection(text);
  for (const pattern of patterns) {
    const match = latestSection.match(pattern);
    if (match) {
      throw new Error(`R-026 forbidden vocabulary "${match[0]}" found in CHANGELOG.md latest section (release artifact must not contain this phrase; historical sections excluded)`);
    }
  }
  console.log(`ok: CHANGELOG.md latest section forbidden-vocabulary sweep (R-026 anchor-bounded)`);
}

function checkCliHelpHotPathContract() {
  const result = run(process.execPath, ["bin/agent-handoff-kit.mjs", "--help"], "CLI help hot-path contract");
  const help = outputText(result);
  assert(help.includes("只有接力、收工或依賴既有狀態的任務才讀交接狀態"), "CLI help does not state the conditional handoff read boundary");
  assert(help.includes("第一次安裝只令新手引導可用，不會強制進入教學"), "CLI help still lacks the cold-onboarding boundary");
  assert(help.includes("<項目名> 開工」是明確接力"), "CLI help does not recognize project-name continuity intent");
  assert(help.includes("closeout-status"), "CLI help does not expose the state-bound closeout card command");
  assert(!help.includes("AI 會依 AGENTS.md 讀取 START_NEXT_SESSION_PROMPT.txt"), "CLI help still instructs rooted agents to read the portable mirror");
  assert(!help.includes("第一次安裝後該檔案會啟動新手引導"), "CLI help still forces onboarding after install");
  assert(!help.includes("某某開工 / 某某收工"), "CLI help still treats all compound start/close phrases as ambiguous");
}

function checkDecisionFirstOnboardingWording() {
  const surfaces = [
    { file: "README.md", required: ["第一次安裝只會令新手引導可用", "AI 會直接開始第一個安全步驟", "只有目標仍然含糊"] },
    { file: "agent-handoff-kit-intro.html", required: ["第一次安裝只令新手引導可用", "直接開始第一個安全步驟", "只有目標仍含糊"] },
    { file: "agent-handoff-kit-guide.html", required: ["第一次安裝只令新手引導可用", "目標清楚就直接開始", "仍無目標才提供"] }
  ];
  for (const surface of surfaces) {
    assertIncludes(surface.file, surface.required);
  }
  const combined = surfaces.map((surface) => read(surface.file)).join("\n");
  assert(!combined.includes("再用 5 步引導你:選情境"), "public onboarding copy still forces the legacy five-step chooser path");
  console.log("ok: public decision-first onboarding wording");
}

function checkRecommendedNextStepContract() {
  assertIncludes("runtime-core/AGENTS.core.md", [
    "🚀 推薦下一步：<one action + reason>",
    "one recommended next action",
    "current objective, next action, active risk"
  ]);
  assertIncludes("packs/closeout.md", [
    "recommended next action",
    "one recommended next action and a short reason"
  ]);
  assertIncludes("runtime-core/SESSION_HANDOFF.md", [
    "Recommended next step: TBD — reason: TBD",
    "ack:field:recommended-next-step-explicit",
    "Recommended next step is explicit and reasoned: TBD",
    "Recommended next-step rule: `Next Priorities` must name the single recommended next action"
  ]);
  assertIncludes("packs/communication.md", [
    "Give a clear recommended next step",
    "state it directly with a short reason",
    "Offer two or three choices only when the user truly must decide",
    "do not turn an already-made technical judgment into an open question"
  ]);
  assertIncludes("bin/agent-handoff-kit.mjs", [
    "communication recommended next-step discipline",
    "ack:field:recommended-next-step-explicit",
    "Recommended next step is explicit and reasoned"
  ]);
  console.log("ok: recommended next-step contract");
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
    .replace("1. simulated user-flow value", "1. Completed fixture installation and verified the installed templates.")
    .replace("1. simulated user-flow value", "1. follow-up scope — monitor unrelated packaging telemetry; trigger: only if a packaging error returns.")
    .replace("1. simulated user-flow value", "1. none")
    .replace("- Checks run this session: simulated user-flow value", "- Checks run this session: passed fixture installation validation.")
    .replace("- Checks not run and why: simulated user-flow value", "- Checks not run and why: none.")
    .replace("Recommended next step: simulated user-flow value — reason: simulated user-flow value", "Recommended next step: Continue from the opening message — reason: this verifies resumable startup continuity.")
    .replace("- Stale snapshots left in this handoff: simulated user-flow value", "- Stale snapshots left in this handoff: no")
    .replace("- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: simulated user-flow value", "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: yes")
    .replace("- Recommended next step is explicit and reasoned: simulated user-flow value", "- Recommended next step is explicit and reasoned: yes — recommended action and reason are recorded.")
    .replace("- Opening message matches current state: simulated user-flow value", "- Opening message matches current state: yes")
    .replace("- Next AI can continue from `AGENTS.md`, this handoff, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history: simulated user-flow value", "- Next AI can continue from `AGENTS.md`, this handoff, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history: yes");
  assertReconciledHandoff(closedHandoff);
  const staleHandoff = closedHandoff.replace("- Stale snapshots left in this handoff: no", "- Stale snapshots left in this handoff: yes");
  assert(!isReconciledHandoff(staleHandoff), "stale handoff snapshot should fail reconciliation check");
  const lifecycleConflictHandoff = closedHandoff
    .replace("1. simulated user-flow value", "1. Verified `doctor` / `upgrade` reliability concern is closed.")
    .replace("1. simulated user-flow value", "1. Investigate product-layer reliability issue in `doctor` / `upgrade` before modifying public output.")
    .replace("- Checks run this session: simulated user-flow value", "- Checks run this session: verified `doctor` / `upgrade` reliability concern is closed.")
    .replace("- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: yes", "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: no — completed work still appears as unresolved next work.");
  assert(!isReconciledHandoff(lifecycleConflictHandoff), "explicit unresolved lifecycle field should fail lifecycle consistency");
  const lifecycleAffirmativeWithPendingHandoff = closedHandoff.replace(
    "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: yes",
    "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: yes — completed work is resolved; remaining product work is pending and explicitly reclassified as next work."
  );
  assert(
    isReconciledHandoff(lifecycleAffirmativeWithPendingHandoff),
    "affirmative lifecycle field with pending follow-up wording should pass"
  );
  const lifecycleNarrativeWithPendingHandoff = closedHandoff.replace(
    "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: yes",
    "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: Reclassified after review: completed work moved from pending to recorded; remaining follow-up is not pending in this handoff."
  );
  assert(
    assessHandoffLifecycleConsistency(lifecycleNarrativeWithPendingHandoff).ok,
    "lifecycle narrative with non-leading pending wording should not be treated as placeholder"
  );
  const openingMessage = extractOpeningMessage(closedHandoff);
  assert(openingMessage.includes(tempRoot), "simulated opening message missing project root");
  assert(openingMessage.includes("Read AGENTS.md, then dev/SESSION_HANDOFF.md"), "simulated opening message missing continuity hot read order");
  assert(openingMessage.includes("Do not read dev/SESSION_LOG.md during ordinary startup"), "simulated opening message missing ordinary-startup log boundary");
  assert(openingMessage.includes("dev/PROJECT_INDEX.md"), "simulated opening message missing project index read");

  const logEntry = [
    "## 2026-05-14 — Simulated User Flow",
    "",
    "- **ID:** release_readiness_user_flow",
    "- **Summary:** Simulated a small task, closeout, and next-session opening message.",
    "- **Changed:** dev/SESSION_HANDOFF.md, dev/SESSION_LOG.md",
    "- **Done:** Filled handoff placeholders and recorded a resumable opening message.",
    "- **QC:** doctor passed before and after simulated closeout.",
    "- **Evidence disposition:** kept as recent trace evidence.",
    "- **Sync:** not_applicable for simulated project.",
    "- **Pending:** Continue from the opening message in the next session.",
    "- **Risks:** none for simulated project.",
    "- **Log maintenance:** kept current entry and template for future sessions.",
    "- **Opening-message mirror:** regenerated and verified; full text omitted by design.",
    "",
    installedLog
  ].join("\n");
  assertSessionLogMarkerContract(logEntry, "simulated closeout SESSION_LOG");

  writeFileSync(path.join(tempRoot, "dev/SESSION_HANDOFF.md"), closedHandoff, "utf8");
  writeFileSync(path.join(tempRoot, "dev/SESSION_LOG.md"), logEntry, "utf8");
  writeFileSync(path.join(tempRoot, "START_NEXT_SESSION_PROMPT.txt"), `${openingMessage}\n`, "utf8");

  const resumedDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", tempRoot], "release user-flow resumed doctor");
  assert(resumedDoctor.stdout.includes("status: passed"), "doctor did not pass after simulated closeout");
  assert(resumedDoctor.stdout.includes("schema checks:"), "resumed doctor did not run schema checks");
}


function simulateInSessionPromptConvenienceDrift(installedHandoff) {
  assert(installedHandoff.includes(plainStartupBoundary), "startup boundary missing before prompt-convenience drift simulation");
  const driftedHandoff = installedHandoff.replace(
    plainStartupBoundary,
    `${plainStartupBoundary} This sentence simulates in-session handoff evolution before closeout.`
  );
  writeFileSync(path.join(tempRoot, "dev/SESSION_HANDOFF.md"), driftedHandoff, "utf8");

  const driftDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", tempRoot], "release user-flow in-session prompt convenience drift");
  assert(driftDoctor.stdout.includes("status: passed"), "doctor should pass when only START_NEXT_SESSION_PROMPT.txt convenience copy is stale before closeout");
  assert(driftDoctor.stdout.includes("prompt mirror checks: 1"), "doctor did not run prompt mirror warning check");
  assert(driftDoctor.stdout.includes("warn  START_NEXT_SESSION_PROMPT.txt"), "doctor did not warn about prompt convenience drift");
  assert(driftDoctor.stdout.includes("session 進行中不用手動重生"), "doctor did not explain prompt copy drift is closeout-time work");

  writeFileSync(path.join(tempRoot, "dev/SESSION_HANDOFF.md"), installedHandoff, "utf8");
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
    && /Recommended next step is explicit and reasoned:\s*yes/i.test(text)
    && /Recommended next step:\s*(?!TBD\b).+?\s+— reason:\s*(?!TBD\b).+/i.test(text)
    && /Opening message matches current state:\s*yes/i.test(text)
    && /Next AI can continue from `AGENTS\.md`, this handoff, `dev\/PROJECT_INDEX\.md`, and needed rule packs without searching old log history:\s*yes/i.test(text)
    && assessHandoffLifecycleConsistency(text).ok;
}

function assessHandoffLifecycleConsistency(text) {
  const fieldValue = fieldValueAfterMarker(text, "lifecycle-conflicts-resolved");
  if (isAffirmativeLifecycleFieldValue(fieldValue)) return { ok: true };
  if (isUnresolvedLifecycleFieldValue(fieldValue)) return { ok: false };
  if (isPlaceholderLifecycleFieldValue(fieldValue) && hasSubstantiveHandoffState(text)) {
    return { ok: false };
  }
  return { ok: true };
}

function isAffirmativeLifecycleFieldValue(value) {
  const trimmed = (value || "").trim();
  return /^(yes|resolved|confirmed|complete|completed|ok|passed|all clear)\b|^(是|已|完成|已完成|已解決|已核對|已確認|通過)\b/i.test(trimmed);
}

function isUnresolvedLifecycleFieldValue(value) {
  const trimmed = normalizeLifecycleFieldValue(value);
  return /^(no|blocked|uncertain)\b|^(否|阻擋|不確定)\b/i.test(trimmed)
    || /\b(still unresolved|not resolved)\b|仍未解決|尚未解決/i.test(trimmed);
}

function isPlaceholderLifecycleFieldValue(value) {
  const trimmed = normalizeLifecycleFieldValue(value);
  return !trimmed
    || /^(TBD|todo|pending|unverified|unknown|needs-review)\b|^(待核對|待確認|未核對|未確認)\b/i.test(trimmed);
}

function normalizeLifecycleFieldValue(value) {
  return (value || "").trim().replace(/^[-*]\s*/, "");
}

function hasSubstantiveHandoffState(text) {
  const sections = [
    extractSectionText(text, "completed-this-session", "Completed This Session"),
    extractSectionText(text, "validation-qc", "Validation / QC")
  ].join("\n");
  const body = sections.replace(/```[\s\S]*?```/g, "");
  return body.split(/\r?\n/).some((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("##") || trimmed.startsWith("<!--")) return false;
    if (/^Record only work actually completed/i.test(trimmed)) return false;
    if (/\bTBD\b|待定|待核對|未適用/i.test(trimmed)) return false;
    const normalized = trimmed.replace(/^[\d.*\-)\s]+/, "").replace(/[`\s#|:\-*/()[\].,;，。；、]/g, "");
    return normalized.length > 20;
  });
}

function fieldValueAfterMarker(text, fieldId) {
  const markerText = `ack:field:${fieldId}`;
  const markerIndex = text.indexOf(markerText);
  if (markerIndex >= 0) {
    const after = text.slice(markerIndex).split(/\r?\n/).slice(1);
    const line = after.find((candidate) => candidate.trim().startsWith("- "));
    if (!line) return "";
    const colonIndex = line.indexOf(":");
    return colonIndex >= 0 ? line.slice(colonIndex + 1).trim() : line.trim();
  }
  const fallback = text.match(/Completed \/ pending \/ risk \/ opening-message lifecycle conflicts resolved or explicitly reclassified:\s*([^\n]+)/i);
  return fallback ? fallback[1].trim() : "";
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

async function runManifestQaScript(qaCheck, executedQaIds) {
  executedQaIds.push(qaCheck.id);
  await executeQaScript(qaCheck.script, qaCheck.label);
}

function executeQaScript(scriptName, label) {
  const entry = QA_RELEASE_READINESS_INVENTORY.find((item) => item.script === scriptName);
  return runNodeScriptChecked(path.join("scripts", scriptName), label, { cwd: root, timeoutMs: entry?.timeoutMs });
}

function assertReleaseReadinessInventoryComplete(executedQaIds) {
  const expected = QA_RELEASE_READINESS_INVENTORY.map((qaCheck) => qaCheck.id);
  assert(JSON.stringify(executedQaIds) === JSON.stringify(expected), `release-readiness QA inventory drifted from manifest (${QA_RELEASE_READINESS_INVENTORY_DIGEST})`);
}

function checkReleaseReadinessInventorySelfTest() {
  assert(process.env.AGENT_HANDOFF_KIT_QA_TEST_MODE === "1", "--qa-inventory-self-test is test-only");
  assertReleaseReadinessInventoryComplete(QA_RELEASE_READINESS_INVENTORY.map((qaCheck) => qaCheck.id));
  const omitted = QA_RELEASE_READINESS_INVENTORY.slice(1).map((qaCheck) => qaCheck.id);
  assertThrows(() => assertReleaseReadinessInventoryComplete(omitted), "omitted release-readiness manifest member was not detected");
  const extra = [...QA_RELEASE_READINESS_INVENTORY.map((qaCheck) => qaCheck.id), "undeclared-hidden-check"];
  assertThrows(() => assertReleaseReadinessInventoryComplete(extra), "undeclared release-readiness member was not detected");
  console.log(`ok: release-readiness inventory self-test (${QA_RELEASE_READINESS_INVENTORY_DIGEST})`);
}

function checkWhatsnewSchema(version) {
  const whatsnewDir = path.join(root, "docs/whatsnew");
  const currentFile = path.join(whatsnewDir, `v${version}.md`);
  assert(existsSync(currentFile), `docs/whatsnew/v${version}.md is missing`);
  const files = readdirSync(whatsnewDir).filter((name) => /^v\d+\.\d+\.\d+\.md$/.test(name)).sort();
  assert(files.length > 0, "docs/whatsnew has no version files");
  const requiredHeadings = [
    "## 本版新加了甚麼",
    "## 對你已有檔案的影響",
    "## 建議下一步"
  ];
  for (const file of files) {
    const text = readAt(whatsnewDir, file).replace(/\r\n/g, "\n");
    const versionFromName = file.replace(/\.md$/, "");
    assert(text.startsWith(`# ${versionFromName}\n`), `${file} must start with "# ${versionFromName}"`);
    let previousIndex = -1;
    for (const heading of requiredHeadings) {
      const index = text.indexOf(heading);
      assert(index >= 0, `${file} missing heading: ${heading}`);
      assert(index > previousIndex, `${file} heading order drifted: ${heading}`);
      previousIndex = index;
    }
  }
  console.log(`ok: docs/whatsnew schema (${files.length} files, current v${version})`);
}

function checkGithubReleaseBodyContract(version) {
  const currentWhatsnew = readAt("docs/whatsnew", `v${version}.md`).replace(/\r\n/g, "\n");
  const requiredHeadings = [
    "## 本版新加了甚麼",
    "## 對你已有檔案的影響",
    "## 建議下一步"
  ];
  assert(currentWhatsnew.startsWith(`# v${version}\n`), `docs/whatsnew/v${version}.md must start with "# v${version}" for GitHub Release body reuse`);
  let previousIndex = -1;
  for (const heading of requiredHeadings) {
    const index = currentWhatsnew.indexOf(heading);
    assert(index >= 0, `docs/whatsnew/v${version}.md missing GitHub Release body heading: ${heading}`);
    assert(index > previousIndex, `docs/whatsnew/v${version}.md GitHub Release body heading order drifted: ${heading}`);
    previousIndex = index;
  }
  assertIncludes("docs/qa/release-grade-qa.md", [
    "GitHub Release body 固定結構驗收",
    "vX.Y.Z - <用戶可理解的價值短句>",
    "`# vX.Y.Z`",
    "`## 本版新加了甚麼`",
    "`## 對你已有檔案的影響`",
    "`## 建議下一步`",
    "唯一允許位置是 `# vX.Y.Z` 後、第一個 H2 前的一張版本圖",
    "不得把圖解展示規則、維護策略或索引安排寫入 body",
    "不得回退成舊 `## 用戶價值` 格式",
    "gh release view vX.Y.Z --json name,body"
  ]);
  console.log("ok: GitHub Release body contract");
}

function checkReleaseStateCoherence(version) {
  const current = `v${version}`;
  const readmeHead = read("README.md").split(/\r?\n/).slice(0, 12).join("\n");
  const englishReadmeHead = read("README.en.md").split(/\r?\n/).slice(0, 12).join("\n");
  assert(readmeHead.includes(`原始碼套件版本：\`${current}\``), "README.md first screen must state the source package version without claiming it is already published");
  assert(readmeHead.includes("npm `@latest` 與 GitHub Release 以發佈後讀回為準"), "README.md first screen must keep npm/GitHub release state as an external readback boundary");
  assert(englishReadmeHead.includes(`Source package version: \`${current}\``), "README.en.md first screen must state the source package version without claiming it is already published");
  assert(englishReadmeHead.includes("npm `@latest` and GitHub Release are verified by post-publish readback"), "README.en.md first screen must keep npm/GitHub release state as an external readback boundary");

  const activeSurfaces = RELEASE_STATE_CONTRACT.surfaces.map((surface) => materializeVersionedPath(surface.path, version));
  const forbidden = RELEASE_STATE_CONTRACT.forbiddenPatterns.map((pattern) => new RegExp(pattern.source, pattern.flags));
  for (const file of activeSurfaces) {
    const text = read(file);
    for (const pattern of forbidden) {
      const match = pattern.exec(text);
      assert(!match, `${file} still exposes release-state drift: ${match?.[0]}`);
    }
    assert(text.includes(current), `${file} does not expose current version ${current}`);
  }

  const changelog = read("CHANGELOG.md").replace(/\r\n/g, "\n");
  const heading = changelog.match(/^## v\d+\.\d+\.\d+ — .+$/m);
  assert(heading?.[0]?.startsWith(`## ${current} — `), `CHANGELOG.md latest heading must be ${current}`);
  assert(!/## v\d+\.\d+\.\d+ — candidate/im.test(heading[0]), "CHANGELOG.md latest heading must not be a candidate heading");
  const latestSection = latestChangelogSection(changelog);
  assert(!/狀態：本地候選|狀態：正式發佈版本|正式可用版本仍是|尚未發佈。正式可用版本|GitHub Release 與 npm `@latest` 應以/u.test(latestSection), "CHANGELOG.md latest status must not claim pre-publish or post-publish state from source text");

  const whatsnewIndex = readAt("docs/whatsnew", "README.md");
  assert(!whatsnewIndex.includes("目前已發佈版本："), "docs/whatsnew/README.md must not declare source version pages as already published");
  const publishedIndex = whatsnewIndex.indexOf("目前版本頁：");
  const currentLink = whatsnewIndex.indexOf(`[${current} 版本頁]`);
  assert(publishedIndex >= 0 && currentLink > publishedIndex, `docs/whatsnew/README.md must list ${current} under source version pages`);
  console.log("ok: source release-state boundary across active public surfaces");
}

function checkCandidateWorktreeIsClean() {
  const dirty = outputText(run("git", ["status", "--porcelain"], "candidate worktree status"));
  assert(!dirty.trim(), "release readiness requires a clean local candidate commit; dirty or untracked files cannot be accepted as release evidence");
  console.log("ok: release-readiness candidate is clean and commit-bound");
}

function checkQaCommandDocumentation() {
  const text = read("docs/qa/release-grade-qa.md").replace(/\r\n/g, "\n");
  assert(text.includes(commandDocumentation()), "public QA command block drifted from the assurance manifest");
  assert(text.includes("Historical release records below are evidence, not the current QA command contract."), "public QA document does not distinguish historical evidence from current commands");
  console.log("ok: public QA command documentation is manifest-owned");
}

function checkUpgradeSuccessOutputSourceContract(version) {
  const cli = read("bin/agent-handoff-kit.mjs");
  assert(cli.includes("const version = await readPackageVersion();"), "CLI no longer reads its version from package.json");
  assert(!cli.includes("function printWhatsnew"), "CLI still defines old inline whatsnew printer");
  assert(!cli.includes("await printWhatsnew"), "CLI still calls old inline whatsnew printer");
  assert(!cli.includes("I just upgraded agent-handoff-kit"), "CLI still contains old optional upgraded-project AI prompt");
  assert(cli.includes("function printUpgradeNextSteps(root, conflictCount)"), "CLI upgrade success output is not routed through the concise helper");
  assert(cli.includes("https://github.com/Adamchanadam/agent-handoff-kit/releases/latest"), "CLI upgrade success output missing GitHub Release latest link");
  assert(cli.includes("版本詳情不在升級流程內展開"), "CLI upgrade success output missing concise release-details wording");
  console.log("ok: upgrade success output source contract");
}

function expectedPackageFileCount() {
  return RELEASE_PACKAGE_CONTRACT.expectedPackageFileCount;
}

function checkPackedPackageUpgradeSmoke(version) {
  const smokeBase = path.join(tmpdir(), `ack-packed-smoke-${Date.now()}`);
  const packDir = path.join(smokeBase, "pack");
  const prefix = path.join(smokeBase, "prefix");
  const upgradeRoot = path.join(smokeBase, "upgrade-root");
  mkdirSync(packDir, { recursive: true });
  mkdirSync(prefix, { recursive: true });
  mkdirSync(upgradeRoot, { recursive: true });

  runNpm(["pack", "--pack-destination", packDir, "--json"], "npm package packed smoke tarball");
  const tgz = readdirSync(packDir).find((name) => name.endsWith(".tgz"));
  assert(tgz, "packed smoke tarball missing");
  const tgzPath = path.join(packDir, tgz);

  runNpm(["install", "--prefix", prefix, tgzPath], "npm package packed smoke install");
  const packageRoot = path.join(prefix, "node_modules", "@adamchanadam", "agent-handoff-kit");
  const packedBin = path.join(packageRoot, "bin", "agent-handoff-kit.mjs");
  assert(existsSync(packedBin), "packed smoke installed CLI missing");
  assert(!existsSync(path.join(packageRoot, "docs", "whatsnew")), "packed smoke unexpectedly includes docs/whatsnew");

  materializePinnedV041ArtifactInit(upgradeRoot);
  const agentsPath = path.join(upgradeRoot, "AGENTS.md");
  const userSuffix = Buffer.from("\n\nKeep this unheaded local rule effective after the packed upgrade.\n", "utf8");
  const preUpgradeAgents = readFileSync(agentsPath);
  writeFileSync(agentsPath, Buffer.concat([preUpgradeAgents, userSuffix]));

  const upgrade = run(process.execPath, [packedBin, "upgrade", "--yes", "--root", upgradeRoot], "packed package prior-version upgrade smoke");
  const upgradeText = outputText(upgrade);
  assert(upgradeText.includes("版本詳情不在升級流程內展開"), "packed upgrade smoke missing concise release-details pointer");
  assert(!upgradeText.includes("本次升級涵蓋"), "packed upgrade smoke printed inline release-note range");
  assert(!/^# v\d+\.\d+\.\d+/m.test(upgradeText), "packed upgrade smoke printed markdown release-note heading");
  assert(!upgradeText.includes("本版新加了甚麼"), "packed upgrade smoke printed release-note body heading");
  assertConciseUpgradeSuccessNarrative("packed package prior-version upgrade smoke", upgradeText, version);
  const upgradedAgents = readFileSync(path.join(upgradeRoot, "AGENTS.md"), "utf8");
  assert(upgradedAgents.includes("Do not read `dev/SESSION_LOG.md` during ordinary startup"), "packed upgrade smoke did not propagate the continuity hot path into AGENTS.md");
  assert(readFileSync(agentsPath).subarray(readFileSync(agentsPath).length - userSuffix.length).equals(userSuffix), "packed upgrade smoke lost unheaded direct-AGENTS user bytes");
  const upgradedCloseout = readFileSync(path.join(upgradeRoot, "dev", "rules", "closeout.md"), "utf8");
  assert(upgradedCloseout.includes("Reconcile lifecycle state"), "packed upgrade smoke did not install the dedicated closeout contract");

  const migrations = path.join(upgradeRoot, "dev", "governance_migrations");
  const transactionNames = readdirSync(migrations).filter((name) => existsSync(path.join(migrations, name, "transaction.json"))).sort();
  assert(transactionNames.length > 0, "packed upgrade smoke did not create an accepted transaction");
  const transactionName = transactionNames.at(-1);
  const journal = JSON.parse(readFileSync(path.join(migrations, transactionName, "transaction.json"), "utf8"));
  assert(journal.currentStateWitness?.transaction?.attemptedVersion === version, "packed upgrade smoke journal does not bind the target version to its current-state witness");
  assert(journal.currentStateReadback?.currentStateDigest === journal.currentStateWitness.currentStateDigest, "packed upgrade smoke report/readback is detached from the current-state witness");
  const report = readFileSync(path.join(migrations, transactionName, "migration-report.md"), "utf8");
  assert(report.includes(journal.currentStateWitness.currentStateDigest), "packed upgrade smoke report does not cite the same current-state witness");

  const firstDoctor = run(process.execPath, [packedBin, "doctor", "--root", upgradeRoot], "packed package doctor after upgrade smoke");
  assertAcceptedCurrentStateDoctorOutput(outputText(firstDoctor), version, "packed package first doctor");
  const beforeSecond = transactionNames.length;
  const secondUpgrade = run(process.execPath, [packedBin, "upgrade", "--yes", "--root", upgradeRoot], "packed package second upgrade smoke");
  const afterSecond = readdirSync(migrations).filter((name) => existsSync(path.join(migrations, name, "transaction.json"))).length;
  assert(secondUpgrade.status === 0 && !outputText(secondUpgrade).includes("migration committed") && afterSecond === beforeSecond, "packed upgrade smoke created a phantom second transaction");
  const secondDoctor = run(process.execPath, [packedBin, "doctor", "--root", upgradeRoot], "packed package second doctor after accepted current state");
  assertAcceptedCurrentStateDoctorOutput(outputText(secondDoctor), version, "packed package second doctor");
}

function checkEnglishPublicSurfaces(version) {
  const pairs = [
    { chinese: "README.md", english: "README.en.md" },
    { chinese: "agent-handoff-kit-ai-install.html", english: "agent-handoff-kit-ai-install.en.html" },
    { chinese: "agent-handoff-kit-intro.html", english: "agent-handoff-kit-intro.en.html" },
    { chinese: "agent-handoff-kit-guide.html", english: "agent-handoff-kit-guide.en.html" },
    { chinese: "local-agentic-ai-workflow-case-study.html", english: "local-agentic-ai-workflow-case-study.en.html", versioned: false }
  ];
  for (const pair of pairs) {
    assert(existsSync(path.join(root, pair.english)), `English public surface is missing: ${pair.english}`);
    assert(read(pair.chinese).includes(pair.english), `${pair.chinese} does not link its English counterpart`);
    const english = read(pair.english);
    assert(english.includes(pair.chinese), `${pair.english} does not link its Traditional Chinese counterpart`);
    if (pair.english.endsWith(".html")) {
      assert(/<html lang="en"/i.test(english), `${pair.english} must declare English content`);
      // This checker owns only stable public-surface mechanics. Translation
      // parity is a change-triggered human acceptance task owned by the
      // writing pack and the candidate evidence, not a permanent release
      // assertion for every historical language pair.
      if (pair.versioned !== false && pair.english !== "agent-handoff-kit-guide.en.html") {
        assert(english.includes(`v${version}`), `${pair.english} is not aligned to v${version}`);
        assert(english.includes("npm registry"), `${pair.english} must distinguish source-page and npm versions`);
      }
    }
  }
  const install = read("agent-handoff-kit-ai-install.en.html");
  for (const command of ["init", "upgrade --dry-run", "upgrade --yes", "doctor"]) {
    assert(install.includes(`npx --yes @adamchanadam/agent-handoff-kit@latest ${command}`), `English AI install page misses ${command}`);
  }

  console.log("ok: English public pages and language navigation");
}

function checkChangedBilingualCandidateEvidence(version) {
  // Translation semantics cannot be inferred from text shape. This is only a
  // candidate-scoped completeness guard: when a committed candidate actually
  // changes one language pair, require the Writing Pack's independent review
  // evidence for that pair. An unchanged pair is explicitly not applicable.
  const pairs = [
    { heading: "### Bilingual README semantic gate", chinese: "README.md", english: "README.en.md" },
    { heading: "### Bilingual practical-guide semantic gate", chinese: "agent-handoff-kit-guide.html", english: "agent-handoff-kit-guide.en.html" },
    { heading: "### Bilingual AI-install semantic gate", chinese: "agent-handoff-kit-ai-install.html", english: "agent-handoff-kit-ai-install.en.html" },
    { heading: "### Bilingual introduction semantic gate", chinese: "agent-handoff-kit-intro.html", english: "agent-handoff-kit-intro.en.html" },
    {
      heading: "### Bilingual local-workflow case-study semantic gate",
      chinese: "local-agentic-ai-workflow-case-study.html",
      english: "local-agentic-ai-workflow-case-study.en.html",
      assets: ["images/local-agentic-ai-workflow-blueprint.png", "images/local-agentic-ai-workflow-blueprint.en.png"]
    }
  ];
  const relevantPaths = pairs.flatMap((pair) => [pair.chinese, pair.english, ...(pair.assets ?? [])]);
  const dirty = outputText(run("git", ["status", "--porcelain", "--", ...relevantPaths], "candidate bilingual worktree status"));
  assert(!dirty.trim(), "candidate changes a bilingual public surface but is not commit-bound; create a clean local candidate commit before release readiness");

  const base = outputText(run("git", ["merge-base", "HEAD", "origin/main"], "candidate bilingual baseline")).trim();
  assert(/^[0-9a-f]{40}$/i.test(base), "candidate bilingual baseline is not a Git commit");
  const changed = new Set(
    outputText(run("git", ["diff", "--name-only", `${base}..HEAD`, "--", ...relevantPaths], "candidate bilingual change scope"))
      .split(/\r?\n/u)
      .map((value) => value.trim())
      .filter(Boolean)
  );
  const changedPairs = pairs.filter((pair) => [pair.chinese, pair.english, ...(pair.assets ?? [])].some((file) => changed.has(file)));
  if (changedPairs.length === 0) {
    console.log("ok: bilingual candidate evidence not applicable (no changed language counterpart)");
    return;
  }

  const report = read("docs/qa/release-grade-qa.md");
  for (const pair of changedPairs) {
    const heading = `${pair.heading}（v${version}`;
    const start = report.indexOf(heading);
    assert(start >= 0, `candidate changes ${pair.english} but release QA has no v${version} independent-review section`);
    const end = report.indexOf("\n### ", start + 4);
    const section = report.slice(start, end >= 0 ? end : undefined);
    for (const file of [pair.chinese, pair.english, ...(pair.assets ?? [])]) {
      const contents = pair.assets?.includes(file) ? readFileSync(path.join(root, file)) : read(file);
      const hash = createHash("sha256").update(contents).digest("hex").toUpperCase();
      assert(section.includes(`\`${file}\` SHA-256 \`${hash}\``), `candidate translation evidence is stale for changed ${file}`);
    }
    assert(section.includes("Verdict: **PASS**"), `changed ${pair.english} lacks an independent PASS verdict; do not claim release readiness`);
  }
  console.log(`ok: independent bilingual evidence covers ${changedPairs.length} changed language counterpart(s)`);
}

function assertAcceptedCurrentStateDoctorOutput(output, version, label) {
  assert(output.includes("status: passed"), `${label} did not pass`);
  assert(output.includes(`已接受目前狀態 v${version}`), `${label} did not display the verified accepted current-state version`);
  assert(!/項目版本記錄未與目前工具對齊|建議先執行 .*upgrade --dry-run/u.test(output), `${label} told the user to repeat upgrade despite the accepted current state`);
  assert(/🚀 下一步[:：][\s\S]*(?:Start Agent Handoff|開工|繼續使用)/u.test(output), `${label} did not provide a normal, non-upgrade next step for an accepted current state`);
}

function nextPatch(v) {
  const [major, minor, patch] = v.split(".").map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

function previousPatch(v) {
  const [major, minor, patch] = v.split(".").map(Number);
  if (!Number.isInteger(patch) || patch <= 0) {
    throw new Error(`Cannot derive previous patch version from ${v}`);
  }
  return `${major}.${minor}.${patch - 1}`;
}

function materializePinnedV041ArtifactInit(project) {
  const { packageRoot, tarballPath, sha1, integrity } = pinnedV041Artifact;
  assert(packageRoot && tarballPath, "set the pinned v0.3.41 artifact root and tarball path for packed upgrade smoke");
  assert(existsSync(tarballPath), "pinned v0.3.41 artifact tarball is missing for packed upgrade smoke");
  const artifactBytes = readFileSync(tarballPath);
  assert(createHash("sha1").update(artifactBytes).digest("hex") === sha1, "pinned v0.3.41 artifact SHA-1 drifted for packed upgrade smoke");
  assert(`sha512-${createHash("sha512").update(artifactBytes).digest("base64")}` === integrity, "pinned v0.3.41 artifact SHA-512 drifted for packed upgrade smoke");
  const artifactCli = path.join(packageRoot, "bin", "agent-handoff-kit.mjs");
  assert(existsSync(artifactCli), "pinned v0.3.41 artifact extraction is missing its formal CLI");
  const init = spawnSync(cliNode, [artifactCli, "init", "--yes", "--root", project], {
    cwd: packageRoot,
    encoding: "utf8",
    env: { ...process.env, AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "1" }
  });
  assert(!init.error && init.status === 0, `pinned v0.3.41 artifact fresh init failed for packed upgrade smoke\n${outputText(init)}`);
}

function runNpm(args, label) {
  if (process.env.npm_execpath) {
    return run(process.execPath, [process.env.npm_execpath, ...args], label);
  }
  if (process.platform === "win32") {
    return run("npm.cmd", args, label, { shell: true });
  }
  return run("npm", args, label);
}

function run(command, args, label, options = {}) {
  const spawnOptions = {
    cwd: root,
    encoding: "utf8",
    shell: options.shell ?? false
  };
  if (options.env) spawnOptions.env = options.env;
  const spawnCommand = command === process.execPath ? cliNode : command;
  const result = spawnSync(spawnCommand, args, spawnOptions);

  if (result.error || result.status !== 0) {
    throw new Error(`${label} failed\n${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  }

  console.log(`ok: ${label}`);
  return result;
}

function checkResearchDecisionTraceContract() {
  const positiveRoot = path.join(tmpdir(), `ack-research-trace-pass-${Date.now()}`);
  run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", positiveRoot], "research trace positive bootstrap");
  const positiveIndexPath = path.join(positiveRoot, "dev/PROJECT_INDEX.md");
  const positiveDecisionsPath = path.join(positiveRoot, "dev/PROJECT_DECISIONS.md");
  writeFileSync(
    positiveIndexPath,
    readFileSync(positiveIndexPath, "utf8").replace(
      "| TBD | local source of truth / reference / draft / archive | TBD | path or instruction | TBD |",
      "| source:becoming-positioning | memoir positioning reference | before brand strategy decisions | Notion command page | 2026-06-02 |"
    ),
    "utf8"
  );
  writeFileSync(
    positiveDecisionsPath,
    readFileSync(positiveDecisionsPath, "utf8").replace(
      "(empty)",
      "- 2026-06-02 [research-derived] Brand positioning. Evidence chain: Source=source:becoming-positioning; Summary=memoir positioning avoids resume chronology; Inference=invite readers into the life world first; Decision impact=homepage voice; Uncertainty=none."
    ),
    "utf8"
  );
  const positiveDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", positiveRoot], "research trace positive doctor");
  assert(positiveDoctor.stdout.includes("status: passed"), "research trace positive fixture should pass doctor");

  const negativeRoot = path.join(tmpdir(), `ack-research-trace-fail-${Date.now()}`);
  run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", negativeRoot], "research trace negative bootstrap");
  const negativeDecisionsPath = path.join(negativeRoot, "dev/PROJECT_DECISIONS.md");
  writeFileSync(
    negativeDecisionsPath,
    readFileSync(negativeDecisionsPath, "utf8").replace(
      "(empty)",
      "- 2026-06-02 [research-derived] Brand positioning changed without persisted source chain."
    ),
    "utf8"
  );
  const negativeDoctor = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "doctor", "--root", negativeRoot], {
    cwd: root,
    encoding: "utf8"
  });
  assert(negativeDoctor.status !== 0, "research trace negative fixture should fail doctor");
  assert(outputText(negativeDoctor).includes("research decision trace checks"), "research trace negative fixture did not fail the trace check");
  assert(outputText(negativeDoctor).includes("missing Evidence chain"), "research trace negative fixture did not report missing Evidence chain");
  console.log("ok: research-derived decision trace contract");
}

function checkHandoffTemperatureBoundaryContract() {
  const tempRoot = path.join(tmpdir(), `ack-handoff-temperature-fail-${Date.now()}`);
  run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", tempRoot], "handoff temperature boundary bootstrap");
  const handoffPath = path.join(tempRoot, "dev/SESSION_HANDOFF.md");
  const handoffText = readFileSync(handoffPath, "utf8");
  const pollutedHandoff = handoffText.replace(
    plainStartupBoundary,
    [
      plainStartupBoundary,
      "",
      "Post-publish artifact smoke passed 7/7; npm latest is v0.3.22; continue monitoring this release as next priority."
    ].join("\n")
  );
  writeFileSync(handoffPath, pollutedHandoff, "utf8");
  writeFileSync(path.join(tempRoot, "START_NEXT_SESSION_PROMPT.txt"), extractOpeningMessage(pollutedHandoff), "utf8");

  const doctor = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "doctor", "--root", tempRoot], {
    cwd: root,
    encoding: "utf8"
  });
  const output = outputText(doctor);
  assert(doctor.status !== 0, "handoff temperature negative fixture should fail doctor");
  assert(output.includes("handoff temperature boundary checks"), "handoff temperature negative fixture did not fail the boundary check");
  assert(output.includes("post-publish artifact smoke evidence"), "handoff temperature negative fixture did not report one-time release evidence");
  assert(output.includes("historical npm latest state"), "handoff temperature negative fixture did not report stale npm latest evidence");
  console.log("ok: handoff temperature boundary contract");
}

async function checkGeneratedMarkdownGovernanceContract() {
  const negativeRoot = path.join(tmpdir(), `ack-generated-markdown-fail-${Date.now()}`);
  run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", negativeRoot], "generated markdown governance negative bootstrap");
  mkdirSync(path.join(negativeRoot, "outputs"), { recursive: true });
  writeFileSync(
    path.join(negativeRoot, "outputs/unregistered_design.md"),
    "# Unregistered Design\n\nThis dry-run artifact should fail doctor until it is indexed or classified.\n",
    "utf8"
  );

  const negativeDoctor = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "doctor", "--root", negativeRoot], {
    cwd: root,
    encoding: "utf8"
  });
  const negativeOutput = outputText(negativeDoctor);
  assert(negativeDoctor.status !== 0, "unregistered generated Markdown should fail doctor");
  assert(negativeOutput.includes("generated markdown governance checks"), "generated Markdown negative fixture did not fail the governance check");
  assert(negativeOutput.includes("outputs/unregistered_design.md"), "generated Markdown negative fixture did not report the orphan path");

  const negativeIndexPath = path.join(negativeRoot, "dev/PROJECT_INDEX.md");
  writeFileSync(
    negativeIndexPath,
    `${readFileSync(negativeIndexPath, "utf8")}\n| \`outputs/unregistered_design.md.backup\` | longer lookalike only |\n| \`outputs/**\` | broad pattern is not an exact registration |\n`,
    "utf8"
  );
  const negativeLogPath = path.join(negativeRoot, "dev/SESSION_LOG.md");
  writeFileSync(
    negativeLogPath,
    `${readFileSync(negativeLogPath, "utf8")}\nObserved outputs/unregistered_design.md while reviewing outputs/other.md, which is temporary.\n`,
    "utf8"
  );
  const lookalikeDoctor = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "doctor", "--root", negativeRoot], { cwd: root, encoding: "utf8" });
  assert(lookalikeDoctor.status !== 0 && outputText(lookalikeDoctor).includes("outputs/unregistered_design.md"), "longer path, broad pattern, or another file's temporary label made an orphan artifact pass");

  const positiveRoot = path.join(tmpdir(), `ack-generated-markdown-pass-${Date.now()}`);
  run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", positiveRoot], "generated markdown governance positive bootstrap");
  mkdirSync(path.join(positiveRoot, "outputs"), { recursive: true });
  writeFileSync(
    path.join(positiveRoot, "outputs/registered_design.md"),
    "# Registered Design\n\nThis dry-run artifact is intentionally indexed.\n",
    "utf8"
  );
  const positiveIndexPath = path.join(positiveRoot, "dev/PROJECT_INDEX.md");
  writeFileSync(
    positiveIndexPath,
    readFileSync(positiveIndexPath, "utf8").replace(
      "| TBD | local source of truth / reference / draft / archive | TBD | path or instruction | TBD |",
      "| `outputs/registered_design.md` | dry-run generated design artifact | before continuing generated design work | local file | 2026-06-29 |"
    ),
    "utf8"
  );
  const positiveDoctorLabel = "generated markdown governance positive doctor";
  const positiveDoctor = await runChecked(
    process.execPath,
    ["bin/agent-handoff-kit.mjs", "doctor", "--root", positiveRoot],
    positiveDoctorLabel,
    { cwd: root, timeoutMs: 120_000 }
  );
  assert(
    positiveDoctor.stdout.includes("status: passed"),
    `indexed generated Markdown fixture should pass doctor\n${describeResult(positiveDoctor)}`
  );
  console.log(`ok: ${positiveDoctorLabel}`);
  console.log("ok: generated Markdown governance contract");
}

function checkRulePackRoutingDurableHomeAudit() {
  assertIncludes("docs/qa/release-grade-qa.md", [
    "Rule Pack Routing And Durable-home Scope Sweep",
    "Natural-language task → rule pack → durable home",
    "Long-term governance routing",
    "長期治理入庫",
    "Rules / packs 路由與入庫範圍",
    "可重用操作程序是否被導向既有 pack 或 registered reference",
    "不得只存放在 SESSION_LOG / SESSION_HANDOFF / START_NEXT_SESSION_PROMPT",
    "不得因一次任務就任意新建 governance docs"
  ]);

  assertIncludes("runtime-core/RULE_PACKS.md", [
    "Explicit onboarding requests",
    "A fresh install or \"I just installed\" is eligibility context, not a forced route",
    "is continuity",
    "Clear end-of-session or handoff intent",
    "Destructive file operations",
    "Code, tests, build",
    "Draft, edit",
    "Sources, evidence",
    "Governance, prompts, agents",
    "Release, publish",
    "External notes",
    "actually uses an external Connector",
    "Governance bridge / bridge governance",
    "equivalent Chinese user phrases",
    "scan for unbridged governance documents",
    "Long-term governance routing",
    "future sessions should remember",
    "connect this document to governance",
    "scan for unbridged governance documents",
    "Reply format, language",
    "minimum set",
    "cannot weaken core safety"
  ]);

  assertIncludes("runtime-core/AGENTS.core.md", [
    "Read `dev/RULE_PACKS.md` when a task pack must be selected",
    "After the task, apply the Persistence Gate",
    "relevant pack, registered reference, or QA check",
    "do not use handoff or log as the only home for reusable procedures"
  ]);

  assertIncludes("packs/agent-governance.md", [
    "Before creating durable workflow",
    "first classify the knowledge type",
    "reusable operating procedures belong in the relevant rule pack or registered reference",
    "New runbooks are last resort only",
    "not stored only in `dev/SESSION_HANDOFF.md`",
    "reusable operating procedures belong in the relevant rule pack or registered reference",
    "New runbooks are last resort only",
    "Governance Bridge Workflow",
    "For repo-wide scans, report candidates as candidates",
    "Long-term Governance Routing",
    "Content-based trigger",
    "Do not persist long-term governance knowledge only in",
    "project index / registered reference / integrations pack",
    "duplicate source-of-truth risk"
  ]);

  console.log("ok: rule pack routing and durable-home scope audit anchors");
}

function checkGovernanceBridgeContract() {
  assertIncludes("docs/qa/release-grade-qa.md", [
    "Governance bridge / 治理打通",
    "接入 Agent Handoff Kit",
    "掃描未接入 Agent Handoff Kit 的重要文件",
    "指定重要文件接入 Agent Handoff Kit",
    "repo-wide 未接合文件掃描",
    "只有所有適用 governance link 都存在才可報 bridged",
    "略過層必須寫 not applicable 原因",
    "不得自動刪除、重命名或合併真源",
    "Governance Bridge Scenario Matrix",
    "Governance Bridge Scenario Matrix Sweep",
    "如果只更新 `PROJECT_INDEX` 或 `SESSION_LOG`，必須報 `partially bridged`",
    "任何略過層都要列為 `Not applicable` 並附原因",
    "stock list、production guide / runbook、repo-wide scan、duplicate source-of-truth",
    "不要求 Adam 做人工 diff review",
    "full audit 報告必須列出 stock list、production guide / runbook、repo-wide scan、duplicate source-of-truth 四個情景的 automated PASS 證據",
    "Full audit 報告若只寫治理打通 PASS 而沒有列出上述四情景證據"
  ]);

  assertIncludes("runtime-core/RULE_PACKS.md", [
    "Governance bridge / bridge governance",
    "equivalent Chinese user phrases",
    "bridge governance",
    "connect this document to governance",
    "scan for unbridged governance documents",
    "dev/rules/agent-governance.md"
  ]);

  assertIncludes("packs/agent-governance.md", [
    "Governance Bridge Workflow",
    "target file itself",
    "dev/PROJECT_INDEX.md",
    "dev/DOC_SYNC_REGISTRY.md",
    "related workflows, guides, runbooks, or rule packs",
    "dev/SESSION_HANDOFF.md",
    "dev/SESSION_LOG.md",
    "duplicate source-of-truth risk",
    "Status: bridged / partially bridged / unbridged / blocked",
    "Use bridged only when every applicable governance link is present",
    "If only `dev/PROJECT_INDEX.md` or `dev/SESSION_LOG.md` was updated, report partially bridged",
    "Not applicable: list skipped layers with a reason",
    "For repo-wide scans, report candidates as candidates"
  ]);

  assertIncludes("bin/agent-handoff-kit.mjs", [
    "agent governance pack structure",
    "update marker-identified official routing rows while preserving every unmarked local row",
    "mergeAgentGovernanceBridgeWorkflow"
  ]);

  assertIncludes("README.md", [
    "讓新文件不變成孤兒",
    "把這份文件接入 Agent Handoff Kit",
    "掃描未接入 Agent Handoff Kit 的重要文件",
    "AI 只會先列出可能需要接入的文件與原因",
    "是否接入、合併或退役由你確認",
    "如涉及刪除、改名、合併權威文件、發佈、上傳或權限變更，AI 應先說明影響並等你確認"
  ]);

  assertIncludes("agent-handoff-kit-intro.html", [
    "id=\"bridge\"",
    "把 docs/stock-list.md 接入 Agent Handoff Kit",
    "治理打通 docs/stock-list.md",
    "bridge governance for docs/stock-list.md",
    "只列缺口,不亂改"
  ]);

  assertIncludes("agent-handoff-kit-guide.html", [
    "id=\"bridge-step\"",
    "把 docs/example.md 接入 Agent Handoff Kit",
    "我剛建立了 <code>docs/production-guide.md</code>,把這份文件接入 Agent Handoff Kit",
    "我不會自動刪除、改名或合併文件"
  ]);

  assertIncludes("scripts/check-upgrade-safety.mjs", [
    "governance bridge RULE_PACKS marker migration",
    "official governance bridge marked route was not restored",
    "unmarked local RULE_PACKS row was not preserved"
  ]);

  assertIncludes("scripts/check-post-upgrade-closeout-finalize.mjs", [
    "doctor after normal closeout before finalize",
    "finalize-closeout",
    "non-closeout drift",
    "SESSION_LOG_archive"
  ]);

  assertIncludes("scripts/check-pack-scenarios.mjs", [
    "governanceBridgeUseCases",
    "new stock list source-of-truth",
    "production guide / runbook",
    "repo-wide unbridged document scan",
    "duplicate source-of-truth risk",
    "Do not fail ordinary docs merely because they are not indexed",
    "do not delete, rename, or move files without explicit approval"
  ]);

  console.log("ok: governance bridge contract");
}

function checkTaskPersistenceGateContract() {
  assertIncludes("docs/qa/release-grade-qa.md", [
    "Task Persistence Gate Sweep",
    "完成任務不等於完整收工",
    "例行通過檢查不得觸發輕量保存",
    "未拍板草稿不得觸發完整收工",
    "新增或刪除文件、新來源",
    "用戶要求把經驗轉成機制",
    "分批新增產品目標 / 開發清單 / 驗收規則",
    "單一當前任務契約",
    "Cross-workspace External Impact Note Sweep",
    "Cross-workspace operation -> external impact note -> next session startup",
    "一目標一行",
    "回讀驗證",
    "目標 handoff 未更新",
    "不得掃描 sibling folders",
    "不得推斷乾淨或同步完成"
  ]);

  assertIncludes("runtime-core/AGENTS.core.md", [
    "Choose exactly one tier after a task",
    "No persistence: no durable fact was produced",
    "active unapproved drafts",
    "routine rerunnable checks",
    "Lightweight checkpoint",
    "do not regenerate the startup mirror or perform full closeout",
    "Full closeout: explicit end-of-session / handoff intent",
    "explicit end-of-session / handoff intent",
    "Route current objective, next action, active risk",
    "sync obligations to `dev/DOC_SYNC_REGISTRY.md`",
    "long-term rationale to `dev/PROJECT_DECISIONS.md`",
    "Do not store the same task contract or reusable rule in several homes",
    "External effects are never implied permission for commit, push, publish, release, deployment, cleanup, or another workspace write",
    "Record verified external impact through the relevant integrations, release, safety, and closeout contracts"
  ]);

  assertIncludes("packs/agent-governance.md", [
    "task contract changes",
    "product goals, requirements, development checklists, acceptance rules",
    "spec, backlog, issue list, README, runbook",
    "Merge into the existing authoritative home"
  ]);

  assertIncludes("README.md", [
    "完成本輪工作後，對 AI 說「收工」"
  ]);

  assertIncludes("agent-handoff-kit-intro.html", [
    "準備結束本輪工作時說一聲「收工」",
    "準備結束本輪工作時說「收工」"
  ]);

  assertIncludes("agent-handoff-kit-guide.html", [
    "準備結束本輪工作時講「收工」",
    "準備結束本輪工作時一句「收工」"
  ]);

  const guide = read("agent-handoff-kit-guide.html");
  assert(!guide.includes("正式執行 + 寫入交接"), "guide must not teach task completion as immediate handoff write");
  assert(!guide.includes("接著我要進入寫入交接階段"), "guide must not show automatic handoff stage after a normal task");
  assert(!guide.includes("完成任務後收工時"), "guide must not phrase closeout as every task completion");
  assert(!guide.includes("必要狀態保存"), "guide must not expose internal persistence-gate terminology");
  assert(!guide.includes("不需要先完整收工"), "guide must not explain the prior over-closeout failure mode");
  assert(!guide.includes("不用先收工"), "guide must not explain the prior over-closeout failure mode");

  const intro = read("agent-handoff-kit-intro.html");
  assert(!intro.includes("完成時說一聲「收工」"), "intro must not phrase closeout as ordinary task completion");
  assert(!intro.includes("完成時說「收工」"), "intro must not phrase closeout as ordinary task completion");

  const cli = read("bin/agent-handoff-kit.mjs");
  assert(cli.includes("準備結束本輪工作、需要保存交接、或有下一輪必須知道的狀態時"), "doctor healthy next step must explain closeout as end-of-session or durable-state work");
  assert(!cli.includes("如剛完成一個任務，記得在 AI 對話輸入「收工」保存交接。"), "doctor healthy next step must not phrase closeout as every task completion");
  assert(!cli.includes("如果剛完成任務，記得在 AI 對話輸入「收工」保存交接。"), "upgrade no-op next step must not phrase closeout as every task completion");
  assert(!cli.includes("第一次完成任務後，可以在 AI 對話輸入「收工」。"), "doctor status overview must not phrase closeout as every task completion");

  const governancePack = read("packs/agent-governance.md");
  assert(!governancePack.includes("No persistence"), "agent governance pack must reference the core gate instead of duplicating tier thresholds");
  assert(!governancePack.includes("Lightweight checkpoint"), "agent governance pack must reference the core gate instead of duplicating tier thresholds");

  console.log("ok: task persistence gate contract");
}

function assertLatestCrossMindTableComplete(version) {
  const text = read("docs/qa/release-grade-qa.md");
  const heading = `### Cross-mind evidence 9-trigger table（v${version}）`;
  const start = text.indexOf(heading);
  assert(start >= 0, `docs/qa/release-grade-qa.md missing latest Cross-mind evidence table for v${version}`);

  const rest = text.slice(start + heading.length);
  const nextHeading = rest.search(/\n## /);
  const section = nextHeading >= 0 ? rest.slice(0, nextHeading) : rest;
  const rows = section
    .split(/\r?\n/)
    .filter((line) => /^\| \d+\. /.test(line));

  assert(rows.length === 9, `latest Cross-mind evidence table for v${version} must contain exactly 9 trigger rows, found ${rows.length}`);
  for (const row of rows) {
    const cells = row.split("|").slice(1, -1).map((cell) => cell.trim());
    assert(cells.length === 4, `latest Cross-mind evidence row has wrong cell count: ${row}`);
    assert(cells.every(Boolean), `latest Cross-mind evidence row has an empty cell: ${row}`);
    assert(/^(yes|no\b)/i.test(cells[1]), `latest Cross-mind evidence Required cell must start with yes/no: ${row}`);
    assert(/^(passed|iterated|blocked)$/i.test(cells[2]), `latest Cross-mind evidence Result cell must be passed / iterated / blocked: ${row}`);
  }
  console.log(`ok: latest Cross-mind evidence 9-trigger table complete for v${version}`);
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

function assertSessionLogMarkerContract(text, label) {
  const markers = [
    "<!-- ack:section:session-log-preamble -->",
    "<!-- ack:section:session-log-entry-template -->",
    "<!-- ack:log-entry:start -->",
    "<!-- ack:log-entry:end -->"
  ];
  for (const marker of markers) {
    assert(count(text, marker) === 1, `${label}: expected exactly one ${marker}`);
  }
  const positions = markers.map((marker) => text.indexOf(marker));
  for (let i = 1; i < positions.length; i += 1) {
    assert(positions[i - 1] < positions[i], `${label}: SESSION_LOG markers are out of order`);
  }
}

function sectionBetween(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  assert(start >= 0, `section start not found: ${startMarker}`);
  const end = text.indexOf(endMarker, start + startMarker.length);
  assert(end >= 0, `section end not found after ${startMarker}: ${endMarker}`);
  return text.slice(start, end);
}

function read(relativePath) {
  return readAt(root, relativePath);
}

function readAt(baseDir, relativePath) {
  return readFileSync(path.join(baseDir, relativePath), "utf8");
}

function materializeVersionedPath(relativePath, version) {
  return relativePath.replace(/\$\{version\}/g, version);
}

function stripHtml(value) {
  return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
}

function outputText(result) {
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertThrows(fn, message) {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(message);
}
