#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractOpeningMessage, normalizePrompt } from "../bin/prompt-mirror-core.mjs";
import { collectOfficialShortcuts } from "./generate-upgrade-fixtures.mjs";
import { commands, commandFiles } from "../bin/commands.mjs";
import { freshInstallMappings, requiredInstalledTargets } from "../bin/installed-file-contract.mjs";
import { materializeProjectIndexTemplateVersion, parseProjectIndexTemplateVersion } from "../bin/upgrade-inventory.mjs";
import {
  commandDocumentation,
  QA_RELEASE_READINESS_INVENTORY,
  QA_RELEASE_READINESS_INVENTORY_DIGEST,
  RELEASE_PACKAGE_CONTRACT,
  RELEASE_STATE_CONTRACT
} from "./qa-assurance-manifest.mjs";
import { describeResult, runChecked, runNodeScriptChecked } from "./qa-runner-core.mjs";
import { validateCandidateEvidence } from "./qa.mjs";
import { createQaTempTracker } from "./qa-temp-cleanup.mjs";
import { resolveFeatureDeliveryBase } from "./feature-delivery.mjs";
import { loadOfficialOriginCatalog, selectRecentPublishedStableVersions } from "../bin/official-origin-catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const qaTemp = createQaTempTracker("release readiness QA");
const tempRoot = qaTemp.track(path.join(tmpdir(), `ack-release-flow-${Date.now()}`));
const cliNode = process.platform === "win32" ? "node" : process.execPath;
const plainStartupBoundary = "A plain `Start Agent Handoff` / `開工` with no same-message task or explicit long-run instruction only authorizes minimum state recovery, the display-only current-thread naming checkpoint when safely supported, the startup card, the current objective/risk/recommended next action, and then the end of the turn. It does not authorize task-specific reads, research, plans, protocols, preflight, file searches, sub-agents, QA, packaging, project-file writes, network access, other external actions, or opt-out execution wording.";
const GITHUB_RELEASE_BODY_HEADINGS = [
  "## 本版新加了甚麼",
  "## 對你已有檔案的影響",
  "## 建議下一步"
];
const MACHINE_RESULT_SHARED_PRODUCT_ROOTS = Object.freeze(["package.json", "bin", "runtime-core", "packs"]);
// These are the only narrow content-scope candidates. Diff reuse still needs
// a current, independently bound execution record; all other members execute.
const MACHINE_RESULT_SCOPE_CANDIDATES = Object.freeze({
  "official-origin-catalog": Object.freeze({ commandArgs: [] }),
  "prompt-mirror": Object.freeze({ commandArgs: [] })
});
const MACHINE_RESULT_NON_REUSABLE = Object.freeze({
  "qa-assurance-manifest": "runtime-selected subprocess and candidate inputs",
  "install-lock-smoke": "subprocess and execution-environment inputs",
  "public-prototype": "repository-wide scan and package inputs",
  "command-entry": "CLI, service, and execution-environment inputs",
  "progress-view": "watcher, service, and execution-environment inputs",
  "closeout-card": "Git and execution-environment inputs",
  "handoff-continuity": "artifact availability and execution-environment inputs",
  "closeout-efficiency": "subprocess and execution-environment inputs",
  "public-mirror": "mirror-copy, package, and execution-environment inputs",
  "pack-scenarios": "subprocess and execution-environment inputs",
  "upgrade-inventory": "CLI and execution-environment inputs",
  "upgrade-transaction-window": "active-lock and execution-environment inputs",
  "upgrade-safety": "artifact availability and execution-environment inputs"
});
const MACHINE_RESULT_PRODUCER_ROOTS = Object.freeze([
  "scripts/check-release-readiness.mjs",
  "scripts/qa.mjs",
  "scripts/qa-assurance-manifest.mjs",
  "scripts/qa-runner-core.mjs",
  "scripts/qa-temp-cleanup.mjs"
]);
const rootMismatchGuard = currentRootMismatchGuard();
const officialOriginCatalog = await loadOfficialOriginCatalog();
const oldestRecentPublishedUpgradeVersion = selectRecentPublishedStableVersions(officialOriginCatalog)[0];
if (!oldestRecentPublishedUpgradeVersion) throw new Error("official catalog has no published stable packed-upgrade baseline");

let passed = false;
try {
  await main();
  passed = true;
} finally {
  if (passed) qaTemp.cleanupOnSuccess();
  else qaTemp.reportRetained("QA failed before cleanup");
}

async function main() {
  const machineOptions = parseMachineResultOptions(process.argv.slice(2));
  if (machineOptions.capturePath) {
    await captureMachineResults(machineOptions.capturePath);
    return;
  }
  if (process.argv.includes('--evidence-guards-only')) {
    checkCrossMindTableCounterexamples();
    await checkBilingualBaselineCounterexamples();
    const version = JSON.parse(read('package.json')).version;
    assertLatestCrossMindTableComplete(version);
    await checkChangedBilingualCandidateEvidence(version, { allowDirty: true });
    console.log('Focused release evidence guards passed; this is not formal full acceptance.');
    return;
  }
  if (process.argv.includes('--task-persistence-only')) {
    checkTaskPersistenceGateContract();
    console.log('Focused task-persistence contract check passed; this is not formal full acceptance.');
    return;
  }
  if (process.argv.includes('--closeout-flow-only')) {
    run(process.execPath, ['bin/agent-handoff-kit.mjs', 'init', '--yes', '--root', tempRoot], 'closeout flow install', { env: { ...process.env, AGENT_HANDOFF_KIT_SKIP_UPDATE_CHECK: '1' } });
    simulateMultiSessionFlow(readAt(tempRoot, 'dev/SESSION_HANDOFF.md'), readAt(tempRoot, 'dev/SESSION_LOG.md'));
    console.log('Focused real CLI closeout flow passed; this is not formal full acceptance.');
    return;
  }
  if (process.argv.includes('--public-docs-only')) {
    checkShortcutTeachingDocuments();
    checkShortcutTeachingCounterexamples();
    checkCrossSurfaceWordingConsistency();
    checkPublicOnboardingVersion(JSON.parse(read('package.json')).version);
    checkNpxColdStartUxGuidance();
    checkAiInstallPageContract(JSON.parse(read('package.json')).version);
    checkDecisionFirstOnboardingWording();
    checkEnglishPublicSurfaces(JSON.parse(read('package.json')).version);
    console.log('Public user-document checks passed; semantic and browser review are separate evidence.');
    return;
  }
  if (process.argv.includes('--packaged-features-only')) {
    checkPackedPackageUpgradeSmoke(JSON.parse(read('package.json')).version,{featuresOnly:true});
    return;
  }
  if (process.argv.includes("--qa-inventory-self-test")) {
    checkReleaseReadinessInventorySelfTest();
    return;
  }
  if (process.argv.includes("--machine-results-contract-self-test")) {
    await checkMachineResultsContract();
    return;
  }
  if (process.argv.includes("--release-notes-contract-self-test")) {
    checkGithubReleaseNotesContractSelfTest();
    return;
  }
  if (process.argv.includes("--scenario-contract-self-test")) {
    checkScenarioBranchingPreFreezeSelfTest();
    return;
  }
  if (process.argv.includes("--pre-freeze-evidence")) {
    const packageJson = JSON.parse(read("package.json"));
    const version = packageJson.version;
    assert(version && /^\d+\.\d+\.\d+$/.test(version), "package version missing or malformed for pre-freeze evidence");
    checkReleaseSourceContracts(version);
    checkReleaseSourceContractCounterexamples(version);
    checkScenarioBranchingDocAlignment();
    await checkChangedBilingualCandidateEvidence(version, { allowDirty: true });
    assertLatestCrossMindTableComplete(version);
    checkDecisionFirstOnboardingWording();
    console.log(`ok: pre-freeze candidate evidence is complete for v${version}`);
    return;
  }
  const packageJson = JSON.parse(read("package.json"));
  assert(packageJson.name === "@adamchanadam/agent-handoff-kit", "package name drifted");
  const version = packageJson.version;
  assert(version && /^\d+\.\d+\.\d+$/.test(version), "package version missing or malformed (expected semver e.g. 0.1.8)");
  checkReleaseSourceContracts(version);
  checkReleaseSourceContractCounterexamples(version);
  let acceptedMachineEvidence = null;
  if (machineOptions.mode === "diff") {
    acceptedMachineEvidence = await validateCandidateEvidence({ candidate: version, evidence: machineOptions.evidencePath, mode: "diff" });
    assertAcceptedMachineEvidenceSha256(acceptedMachineEvidence, machineOptions.evidenceSha256);
  }
  assert(JSON.stringify(packageJson.files) === JSON.stringify(RELEASE_PACKAGE_CONTRACT.packageFiles), "npm package files boundary changed");
  // This isolated checker executes every required QA script directly below.
  // The public npm package deliberately excludes source QA helpers, so a
  // package.json `scripts` table would neither prove nor run the release gate.
  checkWhatsnewSchema(version);
  checkGithubReleaseBodyContract(version);
  checkPublicOnboardingVersion(version);
  checkEnglishPublicSurfaces(version);
  checkReleaseStateCoherence(version);
  checkCandidateWorktreeIsClean();
  checkQaCommandDocumentation();
  checkRulePackRoutingDurableHomeAudit();
  checkGovernanceBridgeContract();
  checkTaskPersistenceGateContract();
  await checkChangedBilingualCandidateEvidence(version);
  assertLatestCrossMindTableComplete(version);
  checkCrossMindTableCounterexamples();
  await checkBilingualBaselineCounterexamples();
  checkUpgradeSuccessOutputSourceContract(version);
  checkRecommendedNextStepContract();
  checkCliHelpHotPathContract();
  checkQaTempCleanupContract();
  checkWorkspaceHealthContract();

  const reusableRecords = machineOptions.mode === "diff"
    ? readReusableMachineResults(machineOptions.evidencePath, acceptedMachineEvidence.candidateEvidenceSha256)
    : new Map();
  const executedQaIds = [];
  for (const qaCheck of QA_RELEASE_READINESS_INVENTORY) {
    await runManifestQaScript(qaCheck, executedQaIds, reusableRecords, machineOptions.mode);
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

  checkShortcutTeachingDocuments();
  checkShortcutTeachingCounterexamples();

  function checkReleaseSourceContracts(version, {
    onboardingText = read("packs/onboarding.md"),
    sessionLogText = read("runtime-core/SESSION_LOG.md")
  } = {}) {
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

  assertIncludes("runtime-core/AGENTS.core.md", [
    "A direct ordinary or stateless task does not read the handoff merely because the project root is known",
    "Clear continuity intent",
    "A direct ordinary task begins without a startup card or onboarding ceremony",
    "Explicit guidance requests",
    "First-use exception: when `dev/SESSION_HANDOFF.md` says `First-use guidance state: eligible`",
    "A fresh install marks first-use guidance as `eligible`",
    "Do not read `dev/SESSION_LOG.md` during ordinary startup",
    "Read `dev/PROJECT_INDEX.md` when the task needs",
    "Pack loading is normally silent",
    "Show the startup card only for explicit continuity startup",
    "Render the startup card in a fenced `text` block and preserve spacing",
    "A plain continuity message with no same-message task or explicit long-run instruction authorizes only that recovery",
    "the display-only current-thread naming checkpoint when safely supported",
    "the end of the turn",
    "It does not authorize task-specific reads, research, plans, protocols, preflight, file searches, sub-agents, QA, packaging, project-file writes, network access, other external actions, or opt-out wording",
    "A concrete objective found only in loaded state is not authority to complete it",
    "### Current-thread naming checkpoint",
    "not an optional task",
    "before emitting the final startup card or beginning any same-message authorized task work",
    "use the project name alone",
    "開工，繼續完成目前目標",
    "Agent Handoff Kit v<version>",
    "Never print the literal placeholder `v<version>`",
    "Reachable is not the same as ingested",
    "Search hits, truncated output, summaries, and status claims do not replace the relevant source content",
    "Materially changed Markdown governance artifacts must be indexed",
    "the bundled doctor does not claim to scan them",
    "Ordinary document edits normally use local read-back and task-specific checks only",
    "do not run `agent-handoff-kit doctor`, write handoff / log state, or regenerate the startup mirror solely because a document changed",
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
    "update only sections whose current truth changed",
    "Regenerate only if normalized content differs",
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
    "Full closeout is differential and write-minimal",
    "Update only fields whose current truth changed",
    "Regenerate it only when normalized content differs",
    "apply the integrations and safety ownership rules",
    "Close only task-owned resources",
    "Retain shared, user-owned, other-agent-owned, system, or ambiguous resources unless separately authorized",
    "`agent-handoff-kit closeout-status` checks explicit lifecycle declarations and same-scope textual contradictions",
    "it does not prove natural-language semantic consistency",
    "preserve the facts, report the checker defect and stop wording retries",
    "first `Resolved [...]` / `Carry-forward [...]` pair"
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

  for (const snippet of [
    "Continuity startup boundary",
    "starts continuity and reads the minimum current handoff state; it is not an onboarding signal",
    "Public capability answer",
    "The main answer is what the user can say to an AI, not a CLI command list",
    "normal user language first",
    "display-only onboarding card",
    "   /\\_/\\   Agent Handoff Kit",
    "  ( o.o )  quick guide",
    "must not claim `continuity ready`, `handoff saved`, a version",
    "Do not perform extra reads, `doctor`, version checks, or handoff loading merely to fill the card",
    "Daily continuity",
    "Keep important files connected",
    "Find missing governance links",
    "Turn a recurring mistake into future practice",
    "Keep an API / MCP / tool-use practice reusable",
    "Declare external tools safely",
    "Finish a long external-tool task cleanly",
    "Do not make CLI maintenance commands the main onboarding answer",
    "Mention `init`, `upgrade`, `doctor`, `workspace-health`, or `closeout-status` only when",
    "把這份文件接入 Agent Handoff Kit",
    "掃描未接入 Agent Handoff Kit 的重要文件",
    "把今次錯誤整理成日後工作規則",
    "以後都用這個 API 調用方式",
    "機密不要寫入項目文件",
    "外部工具資源收口結果",
    "Explicit requests such as \"新手，教我用\" enter onboarding directly",
    "Infer when sufficient; ask only when unresolved",
    "When the user has already supplied a concrete, actionable objective and enough material facts",
    "Only show the scenario chooser when the user's intent remains genuinely unresolved",
    "High-risk, external, permission, cost, publishing, and irreversible actions still require",
    "Scenario F. External-tool governance",
    "Step F.1: inspect runtime-exposed external tools by category first: Connectors, MCPs, Plugins, Skills, browser automation, crawlers, notebooks, or local helper services.",
    "Ask the user only for names, access, or source details the runtime cannot reveal, then classify them.",
    "Step F.2: explain credential separation",
    "Step F.3: map source-of-truth architecture",
    "Step F.4: when authorized",
    "Step F.5: verify current availability",
    "For an unavailable tool, follow `dev/rules/integrations.md` classified fallback for the affected surface; mark blocked / unverified only when no authorized capable route can establish the needed contract.",
    "Chinese only as quoted user phrases"
  ]) assert(onboardingText.includes(snippet), `packs/onboarding.md missing snippet: ${snippet}`);
  assert(!onboardingText.includes("Step F.1: collect installed external tools"), "packs/onboarding.md retains the stale collect-installed-tools F.1 rule");

  for (const snippet of [
    "Handoff role",
    "trace-back / audit trail layer",
    "Each closeout applies `dev/rules/closeout.md` `## Maintenance Trigger Check`",
    "Do not create an entry solely for a size advisory",
    "Do not remove validation evidence or unresolved risks",
    "Log maintenance",
    "Evidence disposition"
  ]) assert(sessionLogText.includes(snippet), `runtime-core/SESSION_LOG.md missing snippet: ${snippet}`);
  assert(!sessionLogText.includes("maintenance trigger check"), "runtime-core/SESSION_LOG.md retains the retired forced maintenance-trigger wording");

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
    "handoff temperature boundary checks"
  ]);
  assertIncludes("bin/installed-file-contract.mjs", [
    "runtime-core/PROJECT_DECISIONS.md",
    "dev/PROJECT_DECISIONS.md",
    "packs/onboarding.md",
    "dev/rules/onboarding.md",
    "packs/integrations.md",
    "dev/rules/integrations.md"
  ]);
  }

  function checkReleaseSourceContractCounterexamples(version) {
    const onboardingText = read("packs/onboarding.md");
    const sessionLogText = read("runtime-core/SESSION_LOG.md");
    const mutations = [
      {
        label: "stale F.1 collect-installed-tools wording",
        before: "Step F.1: inspect runtime-exposed external tools by category first: Connectors, MCPs, Plugins, Skills, browser automation, crawlers, notebooks, or local helper services.",
        after: "Step F.1: collect installed external tools before classifying them."
      },
      {
        label: "F.1 ask-only runtime boundary",
        before: "Ask the user only for names, access, or source details the runtime cannot reveal, then classify them.",
        after: "Ask the user for external-tool details, then classify them."
      },
      {
        label: "F.5 classified fallback and only-blocked condition",
        before: "For an unavailable tool, follow `dev/rules/integrations.md` classified fallback for the affected surface; mark blocked / unverified only when no authorized capable route can establish the needed contract.",
        after: "For an unavailable tool, mark it blocked."
      }
    ];
    for (const mutation of mutations) {
      const mutated = onboardingText.replace(mutation.before, mutation.after);
      assert(mutated !== onboardingText, `source-contract counterexample did not mutate ${mutation.label}`);
      assertThrows(
        () => checkReleaseSourceContracts(version, { onboardingText: mutated }),
        `release source contract accepted missing ${mutation.label}`
      );
    }
    const forcedMaintenanceTrigger = sessionLogText.replace(
      "Do not create an entry solely for a size advisory",
      "maintenance trigger check"
    );
    assert(forcedMaintenanceTrigger !== sessionLogText, "source-contract counterexample did not mutate the SESSION_LOG advisory rule");
    assertThrows(
      () => checkReleaseSourceContracts(version, { sessionLogText: forcedMaintenanceTrigger }),
      "release source contract accepted retired forced SESSION_LOG maintenance wording"
    );
    console.log("ok: release source contract rejects stale F.1, missing ask-only, missing fallback, and forced SESSION_LOG maintenance wording");
  }

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
  assert(!doctor.stdout.includes("generated markdown governance checks"), "doctor must not claim generated Markdown root-discovery checks");
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
  await checkUnregisteredMarkdownNonDiscoveryContract();
  simulateMultiSessionFlow(installedHandoff, installedLog);
  simulateWorkspaceHealthCloseoutGuard();
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
  // The independently accepted README states the same fast path without the
  // old word "directly". Accept its explicit task condition, not arbitrary prose.
  const taskGuidance = /直接(?:接力|開始)|你已清楚描述目標和現有資料時，AI 可開始第一個安全步驟，不必先走新手流程/u;
  const readmeTaskSentence = "你已清楚描述目標和現有資料時，AI 可開始第一個安全步驟，不必先走新手流程";
  assert(taskGuidance.test(readmeTaskSentence), "accepted concrete-task wording must pass");
  assert(!taskGuidance.test(readmeTaskSentence.replace("AI 可開始第一個安全步驟，不必先走新手流程", "AI 必須先走完整新手流程")), "missing concrete-task fast path must fail");
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
    { file: "bin/agent-handoff-kit.mjs", role: "CLI printInstallNextSteps" }
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
    if (!taskGuidance.test(text)) {
      throw new Error(`Concrete-task startup fast path missing in ${surface.file} (${surface.role}).`);
    }
    for (const stalePhrase of staleStandaloneOnboardingPhrases) {
      if (text.includes(stalePhrase)) {
        throw new Error(`Stale standalone onboarding phrase "${stalePhrase}" found in ${surface.file} (${surface.role}); current surface must route through AGENTS.md and the authoritative handoff.`);
      }
    }
    console.log(`ok: ${surface.file} cross-surface startup boundary`);
  }
  checkShortcutTeachingDocuments();
}

function checkPublicOnboardingVersion(version) {
  for (const kind of ['intro','guide','ai-install']) for (const suffix of ['', '.en']) {
    const file=`agent-handoff-kit-${kind}${suffix}.html`,text=read(file);
    assert(text.includes(`v${version}`), `${file} missing source version`);
    assert(text.includes(suffix?'published version':'已發布版本'), `${file} must not imply unreleased code is downloadable`);
  }
  assert(!read('agent-handoff-kit-guide.html').includes('created: 22'), 'guide must not show obsolete installation output');
  console.log('ok: public page versions and download boundary');
}

function checkNpxColdStartUxGuidance() {
  checkShortcutTeachingDocuments();
  const cli=read('bin/agent-handoff-kit.mjs'),install=read('agent-handoff-kit-ai-install.html');
  for(const command of ['init','doctor','upgrade']) {
    const text=`npx --yes @adamchanadam/agent-handoff-kit@latest ${command}`;
    assert(cli.includes(text) && install.includes(text), `AI/CLI setup route missing ${command}`);
  }
  for(const snippet of ['已裝過：執行 upgrade；若想先預覽，才加 --dry-run','--dry-run 只預覽、不寫入；它不是正式升級完成','真正會建立項目文件的是 init；doctor 只檢查','即使資料夾已有 AGENTS.md 或 dev/','不是本工具的建議用戶路徑']) assert(cli.includes(snippet), `CLI cold-start contract missing: ${snippet}`);
  for(const file of ['README.md','README.en.md','agent-handoff-kit-intro.html','agent-handoff-kit-guide.html','agent-handoff-kit-ai-install.html','bin/agent-handoff-kit.mjs']) assert(!/npx @adamchanadam\/agent-handoff-kit (?:init|doctor)/u.test(read(file)), `${file} exposes cold-start-unsafe example`);
  console.log('ok: single AI-assisted setup route; CLI safety instructions preserved');
}

function checkAiInstallPageContract(version) {
  for(const suffix of ['', '.en']) validateAiSetupDocument(read(`agent-handoff-kit-ai-install${suffix}.html`),suffix==='');
  assert(!read('package.json').includes('agent-handoff-kit-ai-install.html'), 'AI install HTML must remain outside npm files whitelist');
  console.log('ok: AI install safety, recovery, same-run checks and one pre-command completion reply');
}

function currentRootMismatchGuard() {
  const cliSource = read("bin/agent-handoff-kit.mjs");
  const match = /^const rootMismatchGuard = ("(?:[^"\\]|\\.)*");$/m.exec(cliSource);
  assert(match, "bin/agent-handoff-kit.mjs must expose a rootMismatchGuard source contract");
  const guard = JSON.parse(match[1]);
  const opening = extractOpeningMessage(read("runtime-core/SESSION_HANDOFF.md"));
  assert(opening && opening.includes(guard), "runtime-core/SESSION_HANDOFF.md opening message must retain the CLI rootMismatchGuard");
  return guard;
}

function checkScenarioBranchingPreFreezeSelfTest() {
  checkScenarioBranchingDocAlignment();
  const qaDoc = read("docs/qa/release-grade-qa.md");
  const drifted = qaDoc.replace(rootMismatchGuard, "If this source-to-scenario guard has drifted");
  assert(drifted !== qaDoc, "scenario-contract self-test fixture did not change the current rootMismatchGuard");
  assertThrows(
    () => checkScenarioBranchingDocAlignment({ qaDoc: drifted }),
    "pre-freeze scenario contract accepted a runtime-to-QA-doc rootMismatchGuard drift"
  );
  console.log("ok: pre-freeze scenario contract rejects runtime-to-QA-doc guard drift");
}

function checkScenarioBranchingDocAlignment({ qaDoc = read("docs/qa/release-grade-qa.md") } = {}) {
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
        "user-managed handoff prose"
      ],
      mustHaveCell: [
        "你已經是最新版本，沒有檔案需要建立或合併",
        "繼續日常使用即可",
        "`doctor` `status: passed`",
        "fixture bytes unchanged"
      ],
      mustNotCell: [
        "完整 doctor 健康檢查未通過",
        "status: failed",
        "handoff lifecycle mechanical checks",
        "安裝完成",
        "升級完成",
        "I just installed",
        "I just upgraded",
        "migration report"
      ]
    },
    {
      id: "4f",
      snippets: [
        "upgrade no-op schema auto-repair",
        "handoff opening message structure",
        rootMismatchGuard,
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
        "upgrade metadata migration with stale prompt convenience copy",
        "START_NEXT_SESSION_PROMPT.txt",
        "current managed core",
        "authoritative handoff opening",
        "migration committed",
        "status: failed"
      ]
    },
    {
      id: "4d",
      snippets: [
        "upgrade unknown safety edit conflict",
        "dev/rules/safety.md",
        "cmd /c rmdir",
        "zero writes",
        "no lock",
        "anchor checks failed"
      ],
      mustHaveCell: ["dev/rules/safety.md", "conflict", "zero writes", "no lock", "anchor checks failed"],
      mustNotCell: ["migration committed", "restore safety pack high-risk rules in ## Rules section"]
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
  const tempBase = qaTemp.track(path.join(tmpdir(), `ack-r0311-${Date.now()}`));
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

  // Scenario 4b: upgrade no-op with arbitrary user-managed handoff prose.
  // Doctor/upgrade may validate Kit-owned structural fields, but must not infer an
  // unresolved lifecycle state from free prose in handoff sections. Full closeout
  // lifecycle consistency remains owned by the separate closeout-status contract.
  const s4bRoot = path.join(tempBase, "scenario-upgrade-noop-arbitrary-handoff-prose");
  const s4bInit = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", s4bRoot], { encoding: "utf8", env, cwd: root });
  if (s4bInit.status !== 0) {
    throw new Error(`Scenario 4b init prep failed: ${s4bInit.stderr || s4bInit.stdout}`);
  }
  const s4bHandoffPath = path.join(s4bRoot, "dev/SESSION_HANDOFF.md");
  let s4bHandoff = readFileSync(s4bHandoffPath, "utf8");
  s4bHandoff = s4bHandoff
    .replace("Record only work actually completed in the current session.\n\n1. TBD", "Record only work actually completed in the current session.\n\n1. Completed `@adamchanadam` package verification and upgrade UX review; this is user-managed prose, not a doctor blocker.")
    .replace("Recommended next step: TBD — reason: TBD", "Recommended next step: Pending maintainer publish decision; continue normal project work after closeout — reason: arbitrary prose is managed by the user and closeout, not by upgrade no-op.")
    .replace("- Checks run this session: TBD", "- Checks run this session: Verified package scope, no-op upgrade journey, and pending wording tolerance.")
    .replace("- Stale snapshots left in this handoff: TBD", "- Stale snapshots left in this handoff: no")
    .replace("- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: TBD", "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: yes — arbitrary prose reviewed outside the doctor/upgrade no-op path.")
    .replace("- Persistence routing checked: TBD", "- Persistence routing checked: yes")
    .replace("- Current blockers or risks: TBD", "- Current blockers or risks: none");
  writeFileSync(s4bHandoffPath, s4bHandoff, "utf8");
  const s4bBefore = directorySnapshot(s4bRoot);
  const s4b = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", s4bRoot], "scenario 4b upgrade no-op with arbitrary handoff prose", { env });
  assertScenarioOutput("scenario 4b (upgrade no-op tolerates arbitrary handoff prose)", s4b.stdout, {
    mustHave: [
      /你已經是最新版本，沒有檔案需要建立或合併/
    ],
    mustNotHave: [
      /完整 doctor 健康檢查未通過/,
      /status: failed/,
      /handoff lifecycle mechanical checks/,
      /✅ 安裝完成：/,
      /✅ 升級完成：/,
      /I just installed agent-handoff-kit\. Help me get started\./,
      /I just upgraded agent-handoff-kit/,
      /migration report:/,
      /migration committed/
    ]
  });
  const s4bDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", s4bRoot], "scenario 4b doctor with arbitrary handoff prose", { env });
  assertScenarioOutput("scenario 4b (doctor tolerates arbitrary handoff prose)", s4bDoctor.stdout, {
    mustHave: [
      /status: passed/
    ],
    mustNotHave: [
      /status: failed/
    ]
  });
  assert(equalSnapshots(s4bBefore, directorySnapshot(s4bRoot)), "scenario 4b no-op upgrade or doctor changed fixture bytes");
  console.log("ok: scenario 4b no-op with arbitrary handoff prose left fixture bytes unchanged");

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
  const s4fHandoff = readFileSync(s4fHandoffPath, "utf8");
  assert(s4fHandoff.includes(rootMismatchGuard), "scenario 4f fixture must include the current CLI rootMismatchGuard");
  writeFileSync(s4fHandoffPath, s4fHandoff.replace(rootMismatchGuard, "If this startup guard is missing"), "utf8");
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

  // Scenario 4c: stale START_NEXT_SESSION_PROMPT.txt convenience copy. Keep a
  // current managed core and its accepted USER_RULES intact, with a local prefix.
  // A stale Stack version requires a metadata migration; it is not ownership
  // evidence permitting replacement of any unknown core or project rule.
  // If the authoritative handoff opening message is readable, the prompt copy is
  // Kit-owned and can be regenerated safely; upgrade should repair it instead of
  // leaving a warning for the user.
  const s4cRoot = path.join(tempBase, "scenario-upgrade-stale-prompt-copy");
  const s4cInit = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", s4cRoot], { encoding: "utf8", env, cwd: root });
  if (s4cInit.status !== 0) {
    throw new Error(`Scenario 4c init prep failed: ${s4cInit.stderr || s4cInit.stdout}`);
  }
  const s4cAgentsPath = path.join(s4cRoot, "AGENTS.md");
  writeFileSync(s4cAgentsPath, Buffer.concat([
    Buffer.from("# Project Local Preamble\n\nKeep this local rule.\n\n", "utf8"),
    readFileSync(s4cAgentsPath)
  ]));
  const s4cIndexPath = path.join(s4cRoot, "dev/PROJECT_INDEX.md");
  writeFileSync(s4cIndexPath, materializeProjectIndexTemplateVersion(readFileSync(s4cIndexPath, "utf8"), "0.3.64"), "utf8");
  const s4cIndexBefore = readFileSync(s4cIndexPath);
  const s4cPreserved = new Map(["AGENTS.md", "dev/USER_RULES.md", "dev/SESSION_HANDOFF.md", "dev/SESSION_LOG.md"]
    .map((rel) => [rel, readFileSync(path.join(s4cRoot, rel))]));
  writeFileSync(
    path.join(s4cRoot, "START_NEXT_SESSION_PROMPT.txt"),
    "Work in <absolute project root>.\n\nRead AGENTS.md and continue.\n",
    "utf8"
  );
  const s4c = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", s4cRoot], "scenario 4c upgrade with stale prompt convenience copy", { env });
  assertScenarioOutput("scenario 4c (stale prompt convenience copy auto-repair)", s4c.stdout, {
    mustHave: [
      /managed core matches current content; local surrounding bytes preserved/,
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
  const s4cOpening = extractOpeningMessage(readFileSync(path.join(s4cRoot, "dev/SESSION_HANDOFF.md"), "utf8"));
  assert(s4cOpening != null && normalizePrompt(s4cPrompt) === normalizePrompt(s4cOpening), "scenario 4c prompt copy must match the full authoritative handoff opening message");
  for (const [rel, before] of s4cPreserved) {
    assert(before.equals(readFileSync(path.join(s4cRoot, rel))), `scenario 4c changed preserved ${rel} while repairing its generated mirror`);
  }
  assertProjectIndexMetadataTransition("scenario 4c", s4cIndexBefore, readFileSync(s4cIndexPath), currentVersion);

  // Scenario 4d: an unknown edit inside a safety rule loses a required anchor.
  // Doctor must expose it, but a missing anchor or familiar numbered-rule shape
  // cannot authorize deleting that edit. Upgrade must stop without any writes.
  const s4dRoot = path.join(tempBase, "scenario-upgrade-self-check-anchor-failure");
  const s4dInit = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", s4dRoot], { encoding: "utf8", env, cwd: root });
  if (s4dInit.status !== 0) {
    throw new Error(`Scenario 4d init prep failed: ${s4dInit.stderr || s4dInit.stdout}`);
  }
  const s4dSafetyPath = path.join(s4dRoot, "dev/rules/safety.md");
  writeFileSync(
    s4dSafetyPath,
    readFileSync(s4dSafetyPath, "utf8").replace("cmd /c rmdir", "cmd command removed from this stale local copy"),
    "utf8"
  );
  const s4dBefore = directorySnapshot(s4dRoot);
  const s4dDoctor = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "doctor", "--root", s4dRoot], { encoding: "utf8", env, cwd: root });
  assert(s4dDoctor.status !== null && s4dDoctor.status !== 0, "scenario 4d doctor must reject the missing safety anchor");
  assertScenarioOutput("scenario 4d (doctor exposes unknown safety edit)", s4dDoctor.stdout, {
    mustHave: [/missing  dev\/rules\/safety.md/, /cmd \/c rmdir/, /status: failed/, /anchor checks failed/],
    mustNotHave: [/status: passed/]
  });
  const s4d = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", s4dRoot], { encoding: "utf8", env, cwd: root });
  assert(s4d.status !== null && s4d.status !== 0, "scenario 4d upgrade must reject an unproven local safety edit");
  assertScenarioOutput("scenario 4d (upgrade unknown safety edit conflict)", s4d.stdout, {
    mustHave: [
      /dev\/rules\/safety.md/,
      /conflict: 1/,
      /升級預檢發現 conflict/,
      /治理目標檔、版本與 migration artifact 均沒有寫入/
    ],
    mustNotHave: [
      /restore safety pack high-risk rules in ## Rules section/,
      /✅ migration committed/,
      /✅ project health: passed/,
      /migration report:/
    ]
  });
  assert(equalSnapshots(s4dBefore, directorySnapshot(s4dRoot)), "scenario 4d doctor or rejected upgrade changed fixture bytes or created artifacts");
  assert(!existsSync(path.join(s4dRoot, "dev/governance_migrations/.upgrade.lock")), "scenario 4d conflict must not create an upgrade lock");

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

  // Scenario 3 keeps metadata-only and structurally stale PROJECT_INDEX upgrades
  // separate so row materialization, H2 section migration, and operation-local
  // journal/report evidence can be checked independently.

  // Scenario 3a — synthetic, metadata-only stale state: current init + only the
  // shared Stack version row materialized backward, then upgrade materializes it
  // forward again without giving PROJECT_INDEX whole-file runtime authority.
  const s3aRoot = path.join(tempBase, "scenario-upgrade-metadata-only");
  const s3aInit = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", s3aRoot], { encoding: "utf8", env, cwd: root });
  if (s3aInit.status !== 0) {
    throw new Error(`Scenario 3a init prep failed: ${s3aInit.stderr || s3aInit.stdout}`);
  }
  const s3aIndexPath = path.join(s3aRoot, "dev/PROJECT_INDEX.md");
  const s3aIndexText = readFileSync(s3aIndexPath, "utf8");
  writeFileSync(s3aIndexPath, materializeProjectIndexTemplateVersion(s3aIndexText, "0.2.9"), "utf8");
  const s3aIndexBefore = readFileSync(s3aIndexPath);
  assert(parseProjectIndexTemplateVersion(s3aIndexBefore.toString("utf8")) === "0.2.9", "scenario 3a prep did not create stale Stack version evidence");
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
  assertProjectIndexMetadataTransition("scenario 3a", s3aIndexBefore, readFileSync(s3aIndexPath), currentVersion);
  const s3aDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", s3aRoot], "scenario 3a ordinary doctor after preserved metadata", { env });
  const s3aMigrations = path.join(s3aRoot, "dev", "governance_migrations");
  const s3aTransactions = readdirSync(s3aMigrations)
    .filter((name) => existsSync(path.join(s3aMigrations, name, "transaction.json")))
    .sort();
  const s3aTransaction = s3aTransactions.at(-1);
  const s3aJournal = s3aTransaction
    ? JSON.parse(readFileSync(path.join(s3aMigrations, s3aTransaction, "transaction.json"), "utf8"))
    : null;
  const s3aEntry = s3aJournal?.entries?.find((entry) => entry.targetRel === "dev/PROJECT_INDEX.md");
  const s3aReport = s3aTransaction
    ? readFileSync(path.join(s3aMigrations, s3aTransaction, "migration-report.md"), "utf8")
    : "";
  assert(
    s3aDoctor.stdout.includes("status: passed")
      && assertProjectIndexOperationReceipt("scenario 3a", s3aJournal, s3aEntry, s3aReport),
    "scenario 3a did not disclose PROJECT_INDEX metadata transition through the operation-local journal/report"
  );
  console.log("ok: scenario 3a materializes only the PROJECT_INDEX Stack version row with operation-local journal/report evidence");

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
  // SESSION_HANDOFF may receive the bounded lifecycle/startup migration while
  // preserving user state; PROJECT_INDEX updates only its shared Stack version row.
  const s3cRoot = path.join(tempBase, "scenario-upgrade-stale-lifecycle-placeholder");
  materializeRecentPublishedArtifactInit(s3cRoot);
  const s3cIndexPath = path.join(s3cRoot, "dev/PROJECT_INDEX.md");
  const s3cHandoffPath = path.join(s3cRoot, "dev/SESSION_HANDOFF.md");
  let s3cHandoff = readFileSync(s3cHandoffPath, "utf8");
  s3cHandoff = s3cHandoff
    .replace("Record only work actually completed in the current session.\n\n1. TBD", "Record only work actually completed in the current session.\n\n1. Installed Agent Handoff Kit v0.1.7 and filled project baseline fields.")
    .replace("- Checks run this session: TBD", "- Checks run this session: init succeeded; doctor had not been run before upgrade.");
  writeFileSync(s3cHandoffPath, s3cHandoff, "utf8");
  const s3cIndexBefore = readFileSync(s3cIndexPath);
  const s3c = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", s3cRoot], "scenario 3c upgrade stale lifecycle placeholder", { env });
  assertScenarioOutput("scenario 3c (upgrade stale lifecycle placeholder)", s3c.stdout, {
    mustHave: [
      /Kit migration 已通過離線遷移驗收/,
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
  assertProjectIndexMetadataTransition("scenario 3c", s3cIndexBefore, readFileSync(s3cIndexPath), currentVersion);
  const s3cHandoffAfter = readFileSync(s3cHandoffPath, "utf8");
  assert(
    s3cHandoffAfter.includes("Installed Agent Handoff Kit v0.1.7 and filled project baseline fields.")
      && s3cHandoffAfter.includes("init succeeded; doctor had not been run before upgrade."),
    "scenario 3c lost user-authored handoff state during lifecycle migration"
  );
  const s3cDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", s3cRoot], "scenario 3c ordinary doctor after preserved-state upgrade", { env });
  const s3cMigrations = path.join(s3cRoot, "dev", "governance_migrations");
  const s3cTransactions = readdirSync(s3cMigrations)
    .filter((name) => existsSync(path.join(s3cMigrations, name, "transaction.json")))
    .sort();
  const s3cTransaction = s3cTransactions.at(-1);
  const s3cJournal = s3cTransaction
    ? JSON.parse(readFileSync(path.join(s3cMigrations, s3cTransaction, "transaction.json"), "utf8"))
    : null;
  const s3cHandoffEntry = s3cJournal?.entries?.find((entry) => entry.targetRel === "dev/SESSION_HANDOFF.md");
  const s3cIndexEntry = s3cJournal?.entries?.find((entry) => entry.targetRel === "dev/PROJECT_INDEX.md");
  const s3cReport = s3cTransaction
    ? readFileSync(path.join(s3cMigrations, s3cTransaction, "migration-report.md"), "utf8")
    : "";
  assert(
    s3cDoctor.stdout.includes("status: passed")
      && s3cHandoffEntry?.beforeHash !== s3cHandoffEntry?.afterHash
      && s3cHandoffEntry?.reason?.includes("handoff lifecycle/startup contracts")
      && s3cReport.includes(`merge: dev/SESSION_HANDOFF.md - ${s3cHandoffEntry.reason}`)
      && s3cReport.includes("dev/SESSION_HANDOFF.md")
      && s3cReport.includes("committed=true")
      && assertProjectIndexOperationReceipt("scenario 3c", s3cJournal, s3cIndexEntry, s3cReport),
    "scenario 3c did not disclose handoff lifecycle migration and PROJECT_INDEX metadata transition through operation-local journal/report"
  );
  console.log("ok: scenario 3c preserves user handoff state and materializes PROJECT_INDEX Stack version row with operation-local journal/report evidence");

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

function directorySnapshot(rootDir) {
  const entries = [];
  const visit = (dir, prefix = "") => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        entries.push(`dir\t${rel}`);
        visit(abs, rel);
      } else if (entry.isFile()) {
        entries.push(`file\t${rel}\t${createHash("sha256").update(readFileSync(abs)).digest("hex")}`);
      } else if (entry.isSymbolicLink()) {
        entries.push(`symlink\t${rel}`);
      } else {
        entries.push(`other\t${rel}`);
      }
    }
  };
  visit(rootDir);
  return entries;
}

function equalSnapshots(left, right) {
  return left.length === right.length && left.every((entry, index) => entry === right[index]);
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

function assertProjectIndexMetadataTransition(label, beforeBytes, afterBytes, expectedVersion) {
  const beforeText = beforeBytes.toString("utf8");
  const afterText = afterBytes.toString("utf8");
  assert(parseProjectIndexTemplateVersion(beforeText) !== expectedVersion, `${label} PROJECT_INDEX fixture was not stale before upgrade`);
  assert(parseProjectIndexTemplateVersion(afterText) === expectedVersion, `${label} PROJECT_INDEX did not materialize package version`);
  assert(afterText === materializeProjectIndexTemplateVersion(beforeText, expectedVersion), `${label} PROJECT_INDEX changed bytes outside the shared Stack version-row materializer`);
}

function assertProjectIndexOperationReceipt(label, journal, entry, report) {
  assert(entry, `${label} transaction journal lacks PROJECT_INDEX entry`);
  assert(entry.beforeHash && entry.afterHash && entry.beforeHash !== entry.afterHash, `${label} PROJECT_INDEX entry lacks distinct before/after identity`);
  assert(entry.reason?.includes("unique real PROJECT_INDEX Stack template-version row"), `${label} PROJECT_INDEX entry lacks canonical metadata reason`);
  assert(!journal?.runtimeAcceptance && !journal?.currentStateWitness, `${label} journal recreated future current-state authority`);
  assert(report.includes(`merge: dev/PROJECT_INDEX.md - ${entry.reason}`), `${label} report lacks PROJECT_INDEX target/reason summary`);
  assert(report.includes("committed=true"), `${label} report lacks committed action state`);
  return true;
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
  assert(help.includes("第一次安裝會把新手引導標記為待使用"), "CLI help still lacks the fresh-install onboarding boundary");
  assert(help.includes("升級不會重置"), "CLI help still lacks the upgrade no-reset onboarding boundary");
  assert(help.includes("<項目名> 開工」是明確接力"), "CLI help does not recognize project-name continuity intent");
  assert(help.includes("closeout-status"), "CLI help does not expose the state-bound closeout card command");
  assert(help.includes("workspace-health"), "CLI help does not expose the read-only workspace health command");
  assert(help.includes("Read live root / Git / worktree state without writing files"), "CLI help does not explain workspace-health as read-only");
  assert(!help.includes("AI 會依 AGENTS.md 讀取 START_NEXT_SESSION_PROMPT.txt"), "CLI help still instructs rooted agents to read the portable mirror");
  assert(!help.includes("第一次安裝只令新手引導可用，不會強制進入教學"), "CLI help still says fresh install does not force onboarding");
  assert(!help.includes("第一次安裝後該檔案會啟動新手引導"), "CLI help still forces onboarding after install");
  assert(!help.includes("某某開工 / 某某收工"), "CLI help still treats all compound start/close phrases as ambiguous");
}

function checkQaTempCleanupContract() {
  assertIncludes("scripts/qa-temp-cleanup.mjs", [
    "createQaTempTracker",
    "cleanupOnSuccess",
    "reportRetained",
    "AGENT_HANDOFF_KIT_KEEP_QA_TMP",
    "lstatSync"
  ]);
  for (const script of [
    "scripts/build-public-mirror.mjs",
    "scripts/check-install-lock-smoke.mjs",
    "scripts/check-public-prototype.mjs",
    "scripts/check-release-readiness.mjs",
    "scripts/check-upgrade-inventory.mjs",
    "scripts/check-upgrade-safety.mjs",
    "scripts/check-upgrade-transaction-window.mjs"
  ]) {
    assertIncludes(script, [
      "createQaTempTracker",
      "cleanupOnSuccess",
      "reportRetained"
    ]);
  }
  console.log("ok: QA temporary roots clean up after PASS and retain failure evidence");
}

function checkWorkspaceHealthContract() {
  assertIncludes("bin/agent-handoff-kit.mjs", [
    "workspace-health",
    "collectWorkspaceHealth",
    "git\", [\"-C\", root",
    "worktree\", \"list\", \"--porcelain",
    "assessHandoffWorkspaceIdentity",
    "workspace identity read-back is not healthy"
  ]);
  assertIncludes("runtime-core/AGENTS.core.md", [
    "Workspace identity is a last-verified snapshot",
    "agent-handoff-kit workspace-health --root <project root>"
  ]);
  assertIncludes("packs/closeout.md", [
    "workspace-health",
    "Do not treat `dev/PROJECT_INDEX.md` or old handoff prose as the live worktree truth",
    "read-only workspace-health comparison"
  ]);
  assertIncludes("runtime-core/PROJECT_INDEX.md", [
    "Agent Handoff Kit workspace health",
    "do not maintain a long-term dynamic worktree list here"
  ]);
  console.log("ok: workspace-health closeout truth contract");
}

function checkDecisionFirstOnboardingWording() {
  checkShortcutTeachingDocuments();
  console.log('ok: startup waits for a task; first use guidance and complete reception remain reader-visible');
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
    .replace("Expected project root: TBD", `Expected project root: \`${tempRoot}\``)
    .replace("- Closeout outcome: not_started — full closeout has not yet been assessed.", "- Closeout outcome: complete — simulated task and required local records are reconciled.")
    .replace("- Project-required persistence: not_assessed — state whether this project's required Git or other persistence completed, is not required, or is blocked.", "- Project-required persistence: not_required — this isolated non-Git fixture has no external persistence requirement.")
    .replace("Answer: TBD", "Answer: yes — the fixture task, next action and boundaries are recorded in this packet.")
    .replace("Reconstruction evidence: TBD", "Reconstruction evidence: Task Understanding Summary, Completed This Session, Next Priorities and Workspace Identity contain the fixture outcome and bounded continuation")
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
    .replace("- Next AI can continue from `AGENTS.md`, this handoff, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history: simulated user-flow value", "- Next AI can continue from `AGENTS.md`, this handoff, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history: yes")
    .replace("Git root: simulated user-flow value", "Git root: no Git repository (fixture root)")
    .replace("Branch: simulated user-flow value", "Branch: not_applicable - no Git repository")
    .replace("Commit: simulated user-flow value", "Commit: not_applicable - no Git repository")
    .replace("Worktree / parallel workspace status: simulated user-flow value", "Worktree / parallel workspace status: not_applicable - no Git repository")
    .replace("Uncommitted changes summary: simulated user-flow value", "Uncommitted changes summary: not_applicable - no Git repository");
  const staleHandoff = closedHandoff.replace("- Stale snapshots left in this handoff: no", "- Stale snapshots left in this handoff: yes");
  const lifecycleConflictHandoff = closedHandoff
    .replace("1. simulated user-flow value", "1. Verified `doctor` / `upgrade` reliability concern is closed.")
    .replace("1. simulated user-flow value", "1. Investigate product-layer reliability issue in `doctor` / `upgrade` before modifying public output.")
    .replace("- Checks run this session: simulated user-flow value", "- Checks run this session: verified `doctor` / `upgrade` reliability concern is closed.")
    .replace("- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: yes", "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: no — completed work still appears as unresolved next work.");
  const lifecycleAffirmativeWithPendingHandoff = closedHandoff.replace(
    "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: yes",
    "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: yes — completed work is resolved; remaining product work is pending and explicitly reclassified as next work."
  );
  const lifecycleNarrativeWithPendingHandoff = closedHandoff.replace(
    "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: yes",
    "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: Reclassified after review: completed work moved from pending to recorded; remaining follow-up is not pending in this handoff."
  );
  const affirmativeButUnresolvedHandoff = closedHandoff.replace(
    "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: yes",
    "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: yes — still unresolved"
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
    "- **Opening-message mirror:** verified no-op or regenerated and verified; full text omitted by design.",
    "",
    installedLog
  ].join("\n");
  assertSessionLogMarkerContract(logEntry, "simulated closeout SESSION_LOG");

  writeFileSync(path.join(tempRoot, "dev/SESSION_HANDOFF.md"), closedHandoff, "utf8");
  writeFileSync(path.join(tempRoot, "dev/SESSION_LOG.md"), logEntry, "utf8");
  writeFileSync(path.join(tempRoot, "START_NEXT_SESSION_PROMPT.txt"), `${openingMessage}\n`, "utf8");

  // Expected outcomes are fixed test inputs. Only the shipped CLI decides
  // whether the written project can complete closeout; there is no QA copy of
  // its lifecycle, reconciliation or sufficiency implementation.
  const cases = [
    ['reconciled handoff', closedHandoff, true],
    ['stale handoff snapshot', staleHandoff, false, /stale snapshot/i],
    ['negative next-step declaration', closedHandoff.replace('Recommended next step is explicit and reasoned: yes', 'Recommended next step is explicit and reasoned: no'), false, /recommended.next.step/i],
    ['placeholder next step', closedHandoff.replace('Recommended next step: Continue from the opening message — reason: this verifies resumable startup continuity.', 'Recommended next step: TBD — reason: TBD'), false, /recommended.next.step/i],
    ['negative opening declaration', closedHandoff.replace('Opening message matches current state: yes', 'Opening message matches current state: no'), false, /opening.message/i],
    ['negative continuation declaration', closedHandoff.replace('and needed rule packs without searching old log history: yes', 'and needed rule packs without searching old log history: no'), false, /handoff sufficiency read-back is incomplete/],
    ['explicit unresolved lifecycle', lifecycleConflictHandoff, false, /handoff lifecycle read-back is not healthy/],
    ['affirmative but still unresolved lifecycle', affirmativeButUnresolvedHandoff, false, /handoff lifecycle read-back is not healthy/],
    ['affirmative with reclassified follow-up', lifecycleAffirmativeWithPendingHandoff, true],
    ['narrative with reclassified follow-up', lifecycleNarrativeWithPendingHandoff, true]
  ];
  for (const [label, handoff, expectedComplete, reason] of cases) {
    writeFileSync(path.join(tempRoot, 'dev/SESSION_HANDOFF.md'), handoff, 'utf8');
    writeFileSync(path.join(tempRoot, 'START_NEXT_SESSION_PROMPT.txt'), `${extractOpeningMessage(handoff)}\n`, 'utf8');
    const result = spawnSync(cliNode, ['bin/agent-handoff-kit.mjs', 'closeout-status', '--root', tempRoot], { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 120_000 });
    const output = outputText(result);
    assert(!result.error && Number.isInteger(result.status), `${label}: closeout CLI did not finish: ${result.error?.message ?? output}`);
    assert(result.status === (expectedComplete ? 0 : 1), `${label}: unexpected closeout exit ${result.status}\n${output}`);
    assert(new RegExp(`^status: ${expectedComplete ? 'complete' : 'blocked'}$`, 'm').test(output), `${label}: unexpected closeout card\n${output}`);
    if (reason) assert(reason.test(output), `${label}: closeout did not identify the expected reason\n${output}`);
    console.log(`ok: real closeout-status ${label}`);
  }
  writeFileSync(path.join(tempRoot, 'dev/SESSION_HANDOFF.md'), closedHandoff, 'utf8');
  writeFileSync(path.join(tempRoot, 'START_NEXT_SESSION_PROMPT.txt'), `${openingMessage}\n`, 'utf8');

  const resumedDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", tempRoot], "release user-flow resumed doctor", { env: { ...process.env, AGENT_HANDOFF_KIT_SKIP_UPDATE_CHECK: '1' } });
  assert(resumedDoctor.stdout.includes("status: passed"), "doctor did not pass after simulated closeout");
  assert(resumedDoctor.stdout.includes("schema checks:"), "resumed doctor did not run schema checks");
}

function simulateWorkspaceHealthCloseoutGuard() {
  const repoRoot = qaTemp.track(path.join(tmpdir(), `ack-workspace-health-${Date.now()}`));
  const siblingWorktree = qaTemp.track(`${repoRoot}-parallel`);
  mkdirSync(repoRoot, { recursive: true });
  run("git", ["-C", repoRoot, "init"], "workspace-health git init");
  writeFileSync(path.join(repoRoot, "seed.txt"), "seed\n", "utf8");
  run("git", ["-C", repoRoot, "add", "seed.txt"], "workspace-health seed add");
  run("git", [
    "-C", repoRoot,
    "-c", "user.name=Agent Handoff Kit QA",
    "-c", "user.email=qa@example.invalid",
    "commit", "-m", "seed"
  ], "workspace-health seed commit");
  run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", repoRoot], "workspace-health kit install");
  run("git", ["-C", repoRoot, "add", "AGENTS.md", "CLAUDE.md", "GEMINI.md", "START_NEXT_SESSION_PROMPT.txt", "dev"], "workspace-health kit add");
  run("git", [
    "-C", repoRoot,
    "-c", "user.name=Agent Handoff Kit QA",
    "-c", "user.email=qa@example.invalid",
    "commit", "-m", "install kit"
  ], "workspace-health kit commit");
  run("git", ["-C", repoRoot, "worktree", "add", "--detach", siblingWorktree, "HEAD"], "workspace-health add parallel worktree");

  const health = run(process.execPath, ["bin/agent-handoff-kit.mjs", "workspace-health", "--root", repoRoot], "workspace-health multi-worktree readback");
  assert(health.stdout.includes("workspace: verified"), "workspace-health did not verify the git fixture");
  assert(health.stdout.includes("git: yes"), "workspace-health did not identify the git fixture");
  assert(health.stdout.includes("worktrees: 2"), "workspace-health did not report the parallel worktree count");

  const handoffPath = path.join(repoRoot, "dev/SESSION_HANDOFF.md");
  const installedHandoff = readFileSync(handoffPath, "utf8");
  const branch = outputText(run("git", ["-C", repoRoot, "rev-parse", "--abbrev-ref", "HEAD"], "workspace-health branch readback")).trim();
  const head = outputText(run("git", ["-C", repoRoot, "rev-parse", "HEAD"], "workspace-health HEAD readback")).trim();
  const closedHandoff = installedHandoff
    .replace("Last Updated: TBD", "Last Updated: 2026-05-14 17:41:41 +01:00")
    .replaceAll("<absolute project root>", repoRoot)
    .replace("Expected project root: TBD", `Expected project root: \`${repoRoot}\``)
    .replace("Git root: TBD", `Git root: \`${repoRoot}\``)
    .replace("Branch: TBD", `Branch: \`${branch}\``)
    .replace("Commit: TBD", `Commit: \`${head}\``)
    .replace("Worktree / parallel workspace status: TBD", "Worktree / parallel workspace status: no parallel worktree")
    .replace("Uncommitted changes summary: TBD", "Uncommitted changes summary: clean")
    .replace("<!-- ack:field:closeout-outcome -->\n- Closeout outcome: not_started — full closeout has not yet been assessed.", "<!-- ack:field:closeout-outcome -->\n- Closeout outcome: complete — workspace-health fixture closeout state is complete.")
    .replace("<!-- ack:field:project-required-persistence -->\n- Project-required persistence: not_assessed — state whether this project's required Git or other persistence completed, is not required, or is blocked.", "<!-- ack:field:project-required-persistence -->\n- Project-required persistence: not_required — fixture remote persistence is not required.")
    .replaceAll("TBD", "simulated user-flow value")
    .replace("1. simulated user-flow value", "1. Workspace-health fixture installed and committed.")
    .replace("1. simulated user-flow value", "1. follow-up scope — monitor workspace-health only if a future closeout-status blocker returns.")
    .replace("1. simulated user-flow value", "1. none")
    .replace("- Checks run this session: simulated user-flow value", "- Checks run this session: workspace-health fixture prepared.")
    .replace("- Checks not run and why: simulated user-flow value", "- Checks not run and why: none.")
    .replace("Recommended next step: simulated user-flow value — reason: simulated user-flow value", "Recommended next step: No next action — reason: workspace-health fixture is complete.")
    .replace("- Stale snapshots left in this handoff: simulated user-flow value", "- Stale snapshots left in this handoff: no")
    .replace("- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: simulated user-flow value", "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: yes")
    .replace("- Recommended next step is explicit and reasoned: simulated user-flow value", "- Recommended next step is explicit and reasoned: yes — recommended action and reason are recorded.")
    .replace("- Opening message matches current state: simulated user-flow value", "- Opening message matches current state: yes")
    .replace("- Next AI can continue from `AGENTS.md`, this handoff, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history: simulated user-flow value", "- Next AI can continue from `AGENTS.md`, this handoff, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history: yes");
  writeFileSync(handoffPath, closedHandoff, "utf8");
  writeFileSync(path.join(repoRoot, "START_NEXT_SESSION_PROMPT.txt"), `${extractOpeningMessage(closedHandoff)}\n`, "utf8");

  const blocked = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "closeout-status", "--root", repoRoot], {
    cwd: root,
    encoding: "utf8"
  });
  const blockedOutput = outputText(blocked);
  assert(blocked.status !== 0, "closeout-status accepted a false no-parallel-worktree handoff");
  assert(blockedOutput.includes("workspace identity read-back is not healthy"), "closeout-status did not report workspace identity as the blocker");
  assert(blockedOutput.includes("handoff says no parallel worktree"), "closeout-status did not explain the false no-parallel-worktree claim");
  console.log("ok: workspace-health blocks false-green closeout workspace identity");
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

function parseMachineResultOptions(args) {
  const relevant = args.some((value) => value === "--capture-machine-results" || value === "--execution-mode" || value === "--candidate-evidence" || value === "--accepted-evidence-sha256");
  if (!relevant) return { mode: "complete", evidencePath: null, evidenceSha256: null, capturePath: null };
  let mode = null, evidencePath = null, evidenceSha256 = null, capturePath = null;
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--execution-mode") mode = args[++index];
    else if (value === "--candidate-evidence") evidencePath = args[++index];
    else if (value === "--accepted-evidence-sha256") evidenceSha256 = args[++index];
    else if (value === "--capture-machine-results") capturePath = args[++index];
    else throw new Error("machine-results invocation has an unrelated argument: " + value);
  }
  if (capturePath) {
    assert(!mode && !evidencePath, "machine-results capture cannot also run a release-readiness mode");
    assert(typeof capturePath === "string" && capturePath, "--capture-machine-results requires an output path");
    return { mode: null, evidencePath: null, evidenceSha256: null, capturePath };
  }
  assert(mode === "complete" || mode === "diff", "--execution-mode must be complete or diff");
  if (mode === "complete") assert(!evidencePath && !evidenceSha256, "complete execution cannot receive reusable machine-result evidence");
  else {
    assert(typeof evidencePath === "string" && evidencePath, "diff execution requires --candidate-evidence <accepted-evidence.json>");
    assert(typeof evidenceSha256 === "string" && /^[a-f0-9]{64}$/i.test(evidenceSha256), "diff execution requires the accepted candidate-evidence SHA-256");
  }
  return { mode, evidencePath, evidenceSha256: evidenceSha256?.toLowerCase() ?? null, capturePath: null };
}

function assertAcceptedMachineEvidenceSha256(acceptedEvidence, parentBoundSha256) {
  assert(acceptedEvidence?.candidateEvidenceSha256 === parentBoundSha256,
    "diff execution accepted candidate evidence differs from the parent-bound SHA-256");
}

async function runManifestQaScript(qaCheck, executedQaIds, reusableRecords = new Map(), mode = "complete", execute = executeQaScript) {
  executedQaIds.push(qaCheck.id);
  if (mode === "diff" && reusableRecords.has(qaCheck.id)) {
    console.log("reuse: " + qaCheck.id);
    return;
  }
  await execute(qaCheck.script, qaCheck.label);
}

function executeQaScript(scriptName, label) {
  const entry = QA_RELEASE_READINESS_INVENTORY.find((item) => item.script === scriptName);
  return runNodeScriptChecked(path.join("scripts", scriptName), label, { cwd: root, timeoutMs: entry?.timeoutMs });
}

function assertReleaseReadinessInventoryComplete(executedQaIds) {
  const expected = QA_RELEASE_READINESS_INVENTORY.map((qaCheck) => qaCheck.id);
  assert(JSON.stringify(executedQaIds) === JSON.stringify(expected), `release-readiness QA inventory drifted from manifest (${QA_RELEASE_READINESS_INVENTORY_DIGEST})`);
}

function machineResultProducerScope() {
  // Producer identity covers its static local source closure. Dynamic package
  // actions remain execution inputs and cannot make a record reusable by fiat.
  return deriveMachineResultScope(root, MACHINE_RESULT_PRODUCER_ROOTS, undefined, { rejectUnresolvedDynamicImports: false });
}

function machineResultExternalPath(candidate, label, { mustNotExist = false } = {}) {
  assert(typeof candidate === "string" && candidate, label + " path is required");
  const absolute = path.resolve(candidate);
  const parent = path.dirname(absolute);
  assert(existsSync(parent), label + " parent does not exist: " + parent);
  assertMachineResultExternalPathHasNoLinks(absolute, label);
  const realParent = realpathSync(parent);
  const output = path.join(realParent, path.basename(absolute));
  assert(output === absolute, label + " path changed while resolving its parent");
  assert(!isInsideOrSameMachineScopeRoot(realpathSync(root), output), label + " must be outside the Public source root");
  if (existsSync(output)) {
    const stat = lstatSync(output);
    assert(!stat.isSymbolicLink() && stat.isFile(), label + " must be a regular non-link file");
    assert(!mustNotExist, label + " already exists: " + output);
  }
  return output;
}

function assertMachineResultExternalPathHasNoLinks(candidate, label) {
  const absolute = path.resolve(candidate);
  let cursor = existsSync(absolute) ? absolute : path.dirname(absolute);
  const volumeRoot = path.parse(cursor).root;
  for (;;) {
    const stat = lstatSync(cursor);
    assert(!stat.isSymbolicLink(), label + " must not cross a link: " + cursor);
    if (cursor === volumeRoot) return;
    const parent = path.dirname(cursor);
    assert(parent !== cursor, label + " path has no filesystem root: " + absolute);
    cursor = parent;
  }
}

function machineResultRuntime() {
  assert(process.execArgv.length === 0, "machine-results capture requires Node with no exec arguments");
  assert(!process.env.NODE_OPTIONS, "machine-results capture rejects NODE_OPTIONS");
  return Object.freeze({ node: process.version, platform: process.platform, arch: process.arch });
}

function machineResultChildEnvironment() {
  const environment = { ...process.env };
  delete environment.NODE_OPTIONS;
  return environment;
}

async function captureMachineResults(outputPath) {
  const output = machineResultExternalPath(outputPath, "machine-results capture", { mustNotExist: true });
  const runtime = machineResultRuntime();
  const records = [];
  let capturedError = null;
  for (const qaCheck of QA_RELEASE_READINESS_INVENTORY.filter((entry) => Object.hasOwn(MACHINE_RESULT_SCOPE_CANDIDATES, entry.id))) {
    const sourceScope = currentMachineResultScope(qaCheck, []);
    const producerScope = machineResultProducerScope();
    let result;
    let captureError = null;
    try {
      result = await runNodeScriptChecked(path.join("scripts", qaCheck.script), qaCheck.label, { cwd: root, env: machineResultChildEnvironment(), timeoutMs: qaCheck.timeoutMs });
    } catch (error) {
      result = error?.result;
      captureError = error;
    }
    let sourceScopeAfter = null, producerScopeAfter = null;
    try {
      sourceScopeAfter = currentMachineResultScope(qaCheck, []);
      producerScopeAfter = machineResultProducerScope();
      assert(JSON.stringify(sourceScopeAfter) === JSON.stringify(sourceScope), "machine-results source scope changed during execution");
      assert(JSON.stringify(producerScopeAfter) === JSON.stringify(producerScope), "machine-results producer scope changed during execution");
    } catch (error) {
      captureError ??= error;
    }
    const execution = {
      sourceRoot: realpathSync(root),
      command: process.execPath,
      args: [path.join("scripts", qaCheck.script)],
      timeoutMs: qaCheck.timeoutMs,
      nodeExecutableSha256: machineSha256(readFileSync(process.execPath)),
      invocationProfile: "default-no-preload",
      producerScope,
      producerScopeAfter
    };
    const raw = { id: qaCheck.id, runtime, execution, sourceScope, sourceScopeAfter, result, captureError: captureError ? captureError.message : null };
    const rawPath = machineResultExternalPath(path.join(path.dirname(output), path.basename(output) + "." + qaCheck.id + ".raw.json"), "machine-results raw output", { mustNotExist: true });
    writeFileSync(rawPath, JSON.stringify(raw, null, 2) + "\n", { encoding: "utf8", flag: "wx" });
    records.push({ schemaVersion: 1, kind: "release-readiness-machine-result", ...raw, rawOutput: { path: rawPath, sha256: machineSha256(readFileSync(rawPath)) } });
    if (captureError) { capturedError ??= captureError; break; }
  }
  const capture = { schemaVersion: 1, kind: "release-readiness-machine-results", outcome: capturedError ? "failed" : "completed", inventoryDigest: QA_RELEASE_READINESS_INVENTORY_DIGEST, records };
  writeFileSync(output, JSON.stringify(capture, null, 2) + "\n", { encoding: "utf8", flag: "wx" });
  if (capturedError) throw capturedError;
  console.log("ok: captured " + records.length + " limited machine-result records at " + output);
}

function readReusableMachineResults(evidencePath, acceptedEvidenceSha256) {
  const evidenceBytes = readFileSync(machineResultExternalPath(evidencePath, "candidate evidence"));
  assert(machineSha256(evidenceBytes) === acceptedEvidenceSha256, "candidate evidence changed after full validation");
  const evidence = JSON.parse(evidenceBytes);
  const value = evidence.machineResults;
  assert(value && value.schemaVersion === 1 && value.kind === "release-readiness-machine-results", "diff evidence requires machineResults");
  assert(value.outcome === "completed", "diff machine-results capture did not complete");
  assert(value.inventoryDigest === QA_RELEASE_READINESS_INVENTORY_DIGEST && Array.isArray(value.records), "diff machine-results inventory binding is invalid");
  const records = new Map();
  for (const record of value.records) {
    assert(!records.has(record?.id), "diff machine-results duplicate id: " + record?.id);
    const qaCheck = QA_RELEASE_READINESS_INVENTORY.find((entry) => entry.id === record?.id);
    assert(qaCheck, "diff machine-results unknown id: " + record?.id);
    if (validateReusableMachineResult(record, qaCheck)) records.set(record.id, record);
  }
  return records;
}

function validateReusableMachineResult(record, qaCheck) {
  validateMachineResultRawIntegrity(record, qaCheck);
  if (!Object.hasOwn(MACHINE_RESULT_SCOPE_CANDIDATES, qaCheck.id)) return false;
  const expectedArgs = [path.join("scripts", qaCheck.script)];
  let scope, producerScope;
  try {
    scope = currentMachineResultScope(qaCheck, []);
    producerScope = machineResultProducerScope();
  } catch {
    return false;
  }
  if (JSON.stringify(record.runtime) !== JSON.stringify(machineResultRuntime())) return false;
  if (record.execution?.sourceRoot !== realpathSync(root)) return false;
  if (record.execution?.command !== process.execPath || JSON.stringify(record.execution?.args) !== JSON.stringify(expectedArgs)) return false;
  if (record.execution?.timeoutMs !== qaCheck.timeoutMs || record.execution?.nodeExecutableSha256 !== machineSha256(readFileSync(process.execPath))) return false;
  if (record.execution?.invocationProfile !== "default-no-preload") return false;
  if (JSON.stringify(record.execution?.producerScope) !== JSON.stringify(producerScope) || JSON.stringify(record.execution?.producerScopeAfter) !== JSON.stringify(producerScope)) return false;
  if (JSON.stringify(record.sourceScope) !== JSON.stringify(scope) || JSON.stringify(record.sourceScopeAfter) !== JSON.stringify(scope)) return false;
  if (record.captureError || record.result?.status !== 0 || record.result?.timedOut !== false || record.result?.errorType !== null || record.result?.stopped !== true || record.result?.signal !== null) return false;
  if (typeof record.result?.stdout !== "string" || typeof record.result?.stderr !== "string") return false;
  return true;
}

function validateMachineResultRawIntegrity(record, qaCheck) {
  assert(record?.schemaVersion === 1 && record.kind === "release-readiness-machine-result", "machine result has the wrong schema");
  assert(record.id === qaCheck.id, "machine result id does not match the inventory member");
  const rawPath = machineResultExternalPath(record.rawOutput?.path, "machine result raw output");
  assert(machineSha256(readFileSync(rawPath)) === record.rawOutput?.sha256?.toLowerCase(), "machine result raw output hash mismatch");
  const raw = JSON.parse(readFileSync(rawPath, "utf8"));
  assert(JSON.stringify(raw) === JSON.stringify({ id: record.id, runtime: record.runtime, execution: record.execution, sourceScope: record.sourceScope, sourceScopeAfter: record.sourceScopeAfter, result: record.result, captureError: record.captureError ?? null }), "machine result raw output does not match its bound fields");
  assert(record.execution && typeof record.execution === "object" && Array.isArray(record.execution.args), "machine result execution is incomplete");
  assert(record.result && typeof record.result === "object" && Array.isArray(record.result.args), "machine result raw result is incomplete");
  assert(record.result.command === record.execution.command && JSON.stringify(record.result.args) === JSON.stringify(record.execution.args) && record.result.timeoutMs === record.execution.timeoutMs, "machine result raw executor differs from its declared execution");
}

// These declared roots are source inputs, not general reuse proof. Only the
// two allowlisted members can reach a validated diff reuse decision.
function machineResultInputRoots() { return Object.freeze({
  "qa-assurance-manifest": ["docs", "test-fixtures", "scripts/check-qa-assurance-manifest.mjs"],
  "install-lock-smoke": ["test-fixtures", "scripts/check-install-lock-smoke.mjs"],
  "public-prototype": ["scripts/check-public-prototype.mjs"],
  "command-entry": ["scripts/check-command-entry.mjs"],
  "progress-view": ["scripts/check-progress-view.mjs"],
  "closeout-card": ["scripts/check-closeout-card-contract.mjs"],
  "handoff-continuity": ["test-fixtures", "scripts/check-handoff-continuity.mjs"],
  "closeout-efficiency": ["scripts/check-closeout-efficiency.mjs"],
  "public-mirror": ["README.md", "README.en.md", "docs", "agent-handoff-kit-ai-install.en.html", "agent-handoff-kit-ai-install.html", "agent-handoff-kit-guide.en.html", "agent-handoff-kit-guide.html", "agent-handoff-kit-intro.en.html", "agent-handoff-kit-intro.html", "local-agentic-ai-workflow-case-study.en.html", "local-agentic-ai-workflow-case-study.html", "sitemap.xml", "robots.txt", "scripts/build-public-mirror.mjs"],
  "pack-scenarios": ["test-fixtures", "README.md", "agent-handoff-kit-intro.html", "agent-handoff-kit-guide.html", "scripts/check-pack-scenarios.mjs"],
  "upgrade-inventory": ["scripts/check-upgrade-inventory.mjs"],
  "upgrade-transaction-window": ["scripts/check-upgrade-transaction-window.mjs"],
  "official-origin-catalog": ["bin/migration-baselines", "test-fixtures", "scripts/check-official-origin-catalog.mjs"],
  "upgrade-safety": ["test-fixtures", "scripts/check-upgrade-safety.mjs"],
  "prompt-mirror": ["scripts/check-prompt-mirror.mjs"]
}); }

function currentMachineResultScope(qaCheck, commandArgs) {
  const id = qaCheck?.id;
  assert(QA_RELEASE_READINESS_INVENTORY.some((entry) => entry.id === id), `machine-results scope is missing for ${id ?? "unknown"}`);
  const memberRoots = machineResultInputRoots()[id];
  assert(Array.isArray(memberRoots), `machine-results scope is missing for ${id}`);
  assert(Array.isArray(commandArgs), `machine-results scope requires actual command args for ${id}`);
  const candidate = MACHINE_RESULT_SCOPE_CANDIDATES[id];
  assert(candidate, `machine-results scope is non-reusable for ${id}: ${MACHINE_RESULT_NON_REUSABLE[id] ?? "no limited content-scope eligibility"}`);
  assert(JSON.stringify(commandArgs) === JSON.stringify(candidate.commandArgs), `machine-results scope command args are not eligible for ${id}`);
  return deriveMachineResultScope(root, [...MACHINE_RESULT_SHARED_PRODUCT_ROOTS, ...memberRoots]);
}

function deriveMachineResultScope(scopeRoot, roots, beforeReadback, { rejectUnresolvedDynamicImports = true } = {}) {
  const absoluteRoot = machineScopePhysicalRoot(scopeRoot);
  assert(beforeReadback === undefined || typeof beforeReadback === "function", "machine-results scope readback hook is invalid");
  const initial = captureMachineResultScopeSnapshot(absoluteRoot, roots, rejectUnresolvedDynamicImports);
  beforeReadback?.();
  const readback = captureMachineResultScopeSnapshot(absoluteRoot, roots, rejectUnresolvedDynamicImports);
  assert(JSON.stringify(initial) === JSON.stringify(readback), "machine-results scope changed during readback");
  return initial;
}

function captureMachineResultScopeSnapshot(absoluteRoot, roots, rejectUnresolvedDynamicImports) {
  const files = new Set();
  for (const rel of roots) {
    assert(typeof rel === "string" && !path.isAbsolute(rel), `machine-results declared source is invalid: ${rel}`);
    const target = path.resolve(absoluteRoot, rel);
    assert(isInsideOrSameMachineScopeRoot(absoluteRoot, target), `machine-results declared source escapes root: ${rel}`);
    collectMachineScopeFiles(target, files, absoluteRoot);
  }
  const visited = new Set();
  for (const file of [...files]) if (file.endsWith(".mjs")) collectStaticRelativeModuleClosure(file, files, visited, absoluteRoot, rejectUnresolvedDynamicImports);
  return [...files].sort().map((file) => machineScopeSnapshotEntry(absoluteRoot, file));
}

function machineScopePhysicalRoot(scopeRoot) {
  const absoluteRoot = path.resolve(scopeRoot);
  assert(existsSync(absoluteRoot), `machine-results scope root is missing: ${absoluteRoot}`);
  const stat = lstatSync(absoluteRoot);
  assert(stat.isDirectory() && !stat.isSymbolicLink(), `machine-results scope root must be a non-link directory: ${absoluteRoot}`);
  return realpathSync(absoluteRoot);
}

function machineScopePathStat(scopeRoot, candidate) {
  const absolute = path.resolve(candidate);
  assert(isInsideOrSameMachineScopeRoot(scopeRoot, absolute), `machine-results scope path escapes root: ${absolute}`);
  assert(existsSync(absolute), `machine-results scope path is missing: ${absolute}`);
  const stat = assertMachineScopePathHasNoLinks(scopeRoot, absolute);
  assert(stat.isDirectory() || stat.isFile(), `machine-results scope path must be a regular file or non-link directory: ${path.relative(scopeRoot, absolute)}`);
  const physical = realpathSync(absolute);
  assert(isInsideOrSameMachineScopeRoot(scopeRoot, physical), `machine-results scope path resolves outside root: ${path.relative(scopeRoot, absolute)}`);
  return { absolute, stat };
}

function assertMachineScopePathHasNoLinks(scopeRoot, candidate) {
  let cursor = path.resolve(candidate);
  for (;;) {
    const stat = lstatSync(cursor);
    assert(!stat.isSymbolicLink(), `machine-results scope path must not cross a link: ${path.relative(scopeRoot, cursor)}`);
    if (cursor === scopeRoot) return lstatSync(candidate);
    const parent = path.dirname(cursor);
    assert(parent !== cursor && isInsideOrSameMachineScopeRoot(scopeRoot, parent), `machine-results scope path escapes root: ${candidate}`);
    cursor = parent;
  }
}

function collectMachineScopeFiles(target, files, scopeRoot) {
  const { absolute, stat } = machineScopePathStat(scopeRoot, target);
  if (stat.isDirectory()) {
    for (const name of readdirSync(absolute)) collectMachineScopeFiles(path.join(absolute, name), files, scopeRoot);
  } else files.add(absolute);
}

function machineScopeSnapshotEntry(scopeRoot, file) {
  const { absolute, stat } = machineScopePathStat(scopeRoot, file);
  assert(stat.isFile(), `machine-results scope entry is not a regular file: ${path.relative(scopeRoot, absolute)}`);
  const bytes = readFileSync(absolute);
  machineScopePathStat(scopeRoot, absolute);
  return { relativePath: path.relative(scopeRoot, absolute).replaceAll("\\", "/"), sha256: machineSha256(bytes) };
}

function collectStaticRelativeModuleClosure(entry, files, visited, scopeRoot, rejectUnresolvedDynamicImports = true) {
  const { absolute, stat } = machineScopePathStat(scopeRoot, entry);
  assert(stat.isFile(), `machine-results module is not a regular file: ${path.relative(scopeRoot, absolute)}`);
  if (visited.has(absolute)) return;
  visited.add(absolute);
  const source = readFileSync(absolute, "utf8");
  if (rejectUnresolvedDynamicImports) assert(!/\bimport\s*\(\s*(?!["'])/.test(source), `machine-results scope has an unresolved dynamic import: ${path.relative(scopeRoot, absolute)}`);
  const specifiers = new Set([
    ...[...source.matchAll(/^\s*import\s+(?:[^"']*?\s+from\s+)?["'](\.{1,2}\/[^"']+)["']/gm)].map((match) => match[1]),
    ...[...source.matchAll(/^\s*export\s+(?:[^"']*?\s+from\s+)["'](\.{1,2}\/[^"']+)["']/gm)].map((match) => match[1]),
    ...[...source.matchAll(/^\s*(?:await\s+)?import\s*\(\s*["'](\.{1,2}\/[^"']+)["']\s*\)/gm)].map((match) => match[1])
  ]);
  for (const specifier of specifiers) {
    const dependency = path.resolve(path.dirname(absolute), specifier);
    const dependencyState = machineScopePathStat(scopeRoot, dependency);
    assert(dependencyState.stat.isFile(), `machine-results scope has an unresolved local import: ${path.relative(scopeRoot, absolute)} -> ${specifier}`);
    files.add(dependencyState.absolute);
    collectStaticRelativeModuleClosure(dependency, files, visited, scopeRoot, rejectUnresolvedDynamicImports);
  }
}

function isInsideOrSameMachineScopeRoot(scopeRoot, candidate) {
  const relative = path.relative(scopeRoot, candidate);
  return !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

async function checkMachineResultsContract() {
  assert(JSON.stringify(Object.keys(machineResultInputRoots()).sort()) === JSON.stringify(QA_RELEASE_READINESS_INVENTORY.map((item) => item.id).sort()), "machine-results scope coverage differs from release-readiness inventory");
  assert(JSON.stringify(Object.keys(MACHINE_RESULT_SCOPE_CANDIDATES).sort()) === JSON.stringify(["official-origin-catalog", "prompt-mirror"]), "machine-results content-scope candidate set drifted");
  assert(JSON.stringify(Object.keys(MACHINE_RESULT_NON_REUSABLE).sort()) === JSON.stringify(QA_RELEASE_READINESS_INVENTORY.map((item) => item.id).filter((id) => !Object.hasOwn(MACHINE_RESULT_SCOPE_CANDIDATES, id)).sort()), "machine-results non-reusable coverage drifted");
  const qaCheck = QA_RELEASE_READINESS_INVENTORY.find((item) => item.id === "official-origin-catalog");
  const scope = currentMachineResultScope(qaCheck, []);
  assert(scope.length > 0, "machine-results source scope is empty");
  const includes = (entries, relative) => entries.some((entry) => entry.relativePath === relative);
  assert(includes(scope, "scripts/check-official-origin-catalog.mjs"), "machine-results scope omitted the official-origin content entry");
  const promptMirrorCheck = QA_RELEASE_READINESS_INVENTORY.find((item) => item.id === "prompt-mirror");
  assert(currentMachineResultScope(promptMirrorCheck, []).length > 0, "machine-results scope omitted the prompt-mirror content entry");
  assertThrows(() => currentMachineResultScope(promptMirrorCheck), "machine-results scope accepted missing command args");
  assertThrows(() => currentMachineResultScope(promptMirrorCheck, ["--root", root]), "machine-results scope accepted prompt-mirror root mode");
  assertThrows(() => currentMachineResultScope({ id: "unknown-machine-result" }, []), "machine-results scope accepted an unknown member");
  for (const nonReusableId of Object.keys(MACHINE_RESULT_NON_REUSABLE)) {
    const nonReusableCheck = QA_RELEASE_READINESS_INVENTORY.find((item) => item.id === nonReusableId);
    assertThrows(() => currentMachineResultScope(nonReusableCheck, []), `machine-results scope accepted non-reusable member: ${nonReusableId}`);
  }
  const closureRoot = path.join(tempRoot, "machine-results-static-closure");
  mkdirSync(closureRoot, { recursive: true });
  writeFileSync(path.join(closureRoot, "entry.mjs"), 'import "./helper.mjs";\n', "utf8");
  writeFileSync(path.join(closureRoot, "helper.mjs"), 'export const value = "first";\n', "utf8");
  const beforeHelperChange = deriveMachineResultScope(closureRoot, ["entry.mjs"]);
  writeFileSync(path.join(closureRoot, "helper.mjs"), 'export const value = "second";\n', "utf8");
  const afterHelperChange = deriveMachineResultScope(closureRoot, ["entry.mjs"]);
  assert(JSON.stringify(beforeHelperChange) !== JSON.stringify(afterHelperChange), "machine-results scope did not change after an imported helper changed");
  writeFileSync(path.join(closureRoot, "literal.mjs"), "import('./helper.mjs');\n", "utf8");
  assert(includes(deriveMachineResultScope(closureRoot, ["literal.mjs"]), "helper.mjs"), "machine-results scope omitted a literal dynamic import");
  writeFileSync(path.join(closureRoot, "unknown.mjs"), "const target = './helper.mjs'; im" + "port(target);\n", "utf8");
  assertThrows(() => deriveMachineResultScope(closureRoot, ["unknown.mjs"]), "machine-results scope accepted an unknown dynamic import");
  const snapshotRoot = path.join(tempRoot, "machine-results-snapshot");
  mkdirSync(snapshotRoot, { recursive: true });
  writeFileSync(path.join(snapshotRoot, "entry.mjs"), 'import "./helper.mjs";\n', "utf8");
  writeFileSync(path.join(snapshotRoot, "helper.mjs"), 'export const value = "before";\n', "utf8");
  assertThrows(() => deriveMachineResultScope(snapshotRoot, ["entry.mjs"], () => writeFileSync(path.join(snapshotRoot, "helper.mjs"), 'export const value = "after";\n', "utf8")), "machine-results scope accepted a changed readback snapshot");
  const linkRoot = path.join(tempRoot, "machine-results-link");
  const externalLinkTarget = path.join(tempRoot, "machine-results-link-target");
  mkdirSync(linkRoot, { recursive: true });
  mkdirSync(externalLinkTarget, { recursive: true });
  writeFileSync(path.join(externalLinkTarget, "outside.mjs"), 'export const outside = true;\n', "utf8");
  symlinkSync(externalLinkTarget, path.join(linkRoot, "outside"), "junction");
  assertThrows(() => deriveMachineResultScope(linkRoot, ["outside"]), "machine-results scope accepted a linked declared source");
  const aliasRoot = path.join(tempRoot, "machine-results-link-alias");
  const aliasTarget = path.join(aliasRoot, "inside");
  mkdirSync(aliasTarget, { recursive: true });
  writeFileSync(path.join(aliasTarget, "helper.mjs"), 'export const inside = true;\n', "utf8");
  symlinkSync(aliasTarget, path.join(aliasRoot, "alias"), "junction");
  assertThrows(() => deriveMachineResultScope(aliasRoot, ["alias/helper.mjs"]), "machine-results scope accepted an intermediate linked declared source");
  writeFileSync(path.join(aliasRoot, "entry.mjs"), 'import "./alias/helper.mjs";\n', "utf8");
  assertThrows(() => deriveMachineResultScope(aliasRoot, ["entry.mjs"]), "machine-results scope accepted an intermediate linked import");
  const externalRoot = path.join(tempRoot, "machine-results-external-link");
  const externalTarget = path.join(externalRoot, "target");
  mkdirSync(externalTarget, { recursive: true });
  symlinkSync(externalTarget, path.join(externalRoot, "alias"), "junction");
  assertThrows(() => machineResultExternalPath(path.join(externalRoot, "alias", "capture.json"), "machine-results external link"), "machine-results external path accepted an intermediate link");
  const originalExecArgv = [...process.execArgv];
  const originalNodeOptions = process.env.NODE_OPTIONS;
  try {
    process.execArgv.push("--jitless");
    assertThrows(() => machineResultRuntime(), "machine-results runtime accepted an extra Node option");
    process.execArgv.splice(0, process.execArgv.length, ...originalExecArgv);
    process.env.NODE_OPTIONS = "--require ./benign.cjs";
    assertThrows(() => machineResultRuntime(), "machine-results runtime accepted NODE_OPTIONS");
  } finally {
    process.execArgv.splice(0, process.execArgv.length, ...originalExecArgv);
    if (originalNodeOptions === undefined) delete process.env.NODE_OPTIONS;
    else process.env.NODE_OPTIONS = originalNodeOptions;
  }
  const producerScope = machineResultProducerScope();
  assert(includes(producerScope, "scripts/feature-delivery.mjs") && includes(producerScope, "scripts/generate-upgrade-fixtures.mjs"), "machine-results producer scope omitted a static import closure member");
  const result = await runChecked(process.execPath, ["-e", "process.stdout.write('machine-results raw proof\\n')"], "machine-results raw proof", { cwd: root });
  mkdirSync(tempRoot, { recursive: true });
  const rawPath = path.join(tempRoot, "machine-results-contract-raw.json");
  const runtime = machineResultRuntime();
  const execution = {
    sourceRoot: realpathSync(root), command: process.execPath, args: [path.join("scripts", qaCheck.script)], timeoutMs: qaCheck.timeoutMs,
    nodeExecutableSha256: machineSha256(readFileSync(process.execPath)), invocationProfile: "default-no-preload", producerScope, producerScopeAfter: producerScope
  };
  const normalizedResult = { ...result, command: process.execPath, args: [path.join("scripts", qaCheck.script)], timeoutMs: qaCheck.timeoutMs, signal: null };
  const raw = { id: qaCheck.id, runtime, execution, sourceScope: scope, sourceScopeAfter: scope, result: normalizedResult, captureError: null };
  writeFileSync(rawPath, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
  const record = { schemaVersion: 1, kind: "release-readiness-machine-result", ...raw, rawOutput: { path: rawPath, sha256: machineSha256(readFileSync(rawPath)) } };
  assert(validateReusableMachineResult(record, qaCheck), "valid machine result was not reusable");
  const tampered = { ...record, rawOutput: { ...record.rawOutput, sha256: "0".repeat(64) } };
  assertThrows(() => validateReusableMachineResult(tampered, qaCheck), "tampered raw output was accepted");
  const rewriteRaw = (candidate) => {
    const body = { id: candidate.id, runtime: candidate.runtime, execution: candidate.execution, sourceScope: candidate.sourceScope, sourceScopeAfter: candidate.sourceScopeAfter, result: candidate.result, captureError: candidate.captureError ?? null };
    writeFileSync(rawPath, `${JSON.stringify(body, null, 2)}\n`, "utf8");
    candidate.rawOutput.sha256 = machineSha256(readFileSync(rawPath));
  };
  const failed = structuredClone(record); failed.result.status = 1; rewriteRaw(failed);
  assert(!validateReusableMachineResult(failed, qaCheck), "failed result was reusable");
  const stale = structuredClone(record); stale.runtime.node = "stale"; rewriteRaw(stale);
  assert(!validateReusableMachineResult(stale, qaCheck), "stale runtime was reusable");
  writeFileSync(rawPath, `${JSON.stringify({ tampered: true }, null, 2)}\n`, "utf8");
  assertThrows(() => validateReusableMachineResult(stale, qaCheck), "stale record with tampered raw output was accepted");
  const wrongRaw = structuredClone(record); wrongRaw.result.command = "wrong-node"; wrongRaw.result.args = ["wrong-script"]; wrongRaw.result.signal = "SIGTERM"; delete wrongRaw.result.stdout; rewriteRaw(wrongRaw);
  assertThrows(() => validateReusableMachineResult(wrongRaw, qaCheck), "invalid terminal raw result was accepted");
  rewriteRaw(record);
  const supplied = new Map([[qaCheck.id, record]]);
  const completeCalls = [];
  await runManifestQaScript(qaCheck, [], supplied, "complete", async (script) => completeCalls.push(script));
  assert(completeCalls.length === 1, "complete dispatcher reused a supplied machine result");
  const diffCalls = [];
  await runManifestQaScript(qaCheck, [], supplied, "diff", async (script) => diffCalls.push(script));
  assert(diffCalls.length === 0, "diff dispatcher did not reuse a validated machine result");
  const reusableEvidencePath = path.join(tempRoot, "machine-results-reusable-evidence.json");
  const reusableEvidence = { machineResults: { schemaVersion: 1, kind: "release-readiness-machine-results", outcome: "completed", inventoryDigest: QA_RELEASE_READINESS_INVENTORY_DIGEST, records: [record] } };
  writeFileSync(reusableEvidencePath, `${JSON.stringify(reusableEvidence, null, 2)}\n`, "utf8");
  const reusableEvidenceSha256 = machineSha256(readFileSync(reusableEvidencePath));
  assertAcceptedMachineEvidenceSha256({ candidateEvidenceSha256: reusableEvidenceSha256 }, reusableEvidenceSha256);
  assertThrows(() => assertAcceptedMachineEvidenceSha256({ candidateEvidenceSha256: reusableEvidenceSha256 }, "0".repeat(64)), "diff execution accepted a parent-bound candidate-evidence SHA-256 that was not actually validated");
  assert(readReusableMachineResults(reusableEvidencePath, reusableEvidenceSha256).has(qaCheck.id), "completed machine-results evidence was not reusable");
  const incompleteEvidence = structuredClone(reusableEvidence); incompleteEvidence.machineResults.outcome = "failed";
  writeFileSync(reusableEvidencePath, `${JSON.stringify(incompleteEvidence, null, 2)}\n`, "utf8");
  assertThrows(() => readReusableMachineResults(reusableEvidencePath, machineSha256(readFileSync(reusableEvidencePath))), "incomplete machine-results capture was reusable");
  console.log("ok: machine-results scope eligibility is fail-closed; content candidates require declared scope and record integrity only");
}

function machineSha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
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
  validateGithubReleaseBodyText(version, currentWhatsnew, `docs/whatsnew/v${version}.md`);
  checkConcreteGithubReleaseNotesContract(version);
  assertIncludes("docs/qa/release-grade-qa.md", [
    "GitHub Release body 固定結構驗收",
    "vX.Y.Z - <用戶可理解的價值短句>",
    "AGENT_HANDOFF_KIT_RELEASE_TITLE",
    "AGENT_HANDOFF_KIT_RELEASE_NOTES_FILE",
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

function checkConcreteGithubReleaseNotesContract(version) {
  const notesFile = process.env.AGENT_HANDOFF_KIT_RELEASE_NOTES_FILE;
  const title = process.env.AGENT_HANDOFF_KIT_RELEASE_TITLE;
  if (!notesFile && !title) {
    return;
  }
  assert(notesFile && title, "GitHub Release notes gate requires both AGENT_HANDOFF_KIT_RELEASE_NOTES_FILE and AGENT_HANDOFF_KIT_RELEASE_TITLE");
  validateGithubReleaseTitle(version, title, "AGENT_HANDOFF_KIT_RELEASE_TITLE");
  const absoluteNotesFile = path.resolve(notesFile);
  assert(existsSync(absoluteNotesFile), `AGENT_HANDOFF_KIT_RELEASE_NOTES_FILE does not exist: ${notesFile}`);
  const body = readFileSync(absoluteNotesFile, "utf8").replace(/\r\n/g, "\n");
  validateGithubReleaseBodyText(version, body, "AGENT_HANDOFF_KIT_RELEASE_NOTES_FILE");
  console.log("ok: concrete GitHub Release notes/title contract");
}

function checkGithubReleaseNotesContractSelfTest() {
  assert(process.env.AGENT_HANDOFF_KIT_QA_TEST_MODE === "1", "--release-notes-contract-self-test is test-only");
  const version = "0.3.59";
  const validTitle = `v${version} - 規則見證安全修補`;
  const validBody = [
    `# v${version}`,
    "",
    "## 本版新加了甚麼",
    "",
    "- `doctor` 會先確認接受紀錄是否一致。",
    "",
    "## 對你已有檔案的影響",
    "",
    "這版不會自動改寫你的 user rules。",
    "",
    "## 建議下一步",
    "",
    "受影響項目升級後跑 `doctor`。"
  ].join("\n");
  validateGithubReleaseTitle(version, validTitle, "self-test valid title");
  validateGithubReleaseBodyText(version, validBody, "self-test valid body");
  assertThrows(
    () => validateGithubReleaseTitle(version, `v${version} - Formal user-rules doctor guard`, "self-test English title"),
    "English implementation title was not rejected"
  );
  assertThrows(
    () => validateGithubReleaseBodyText(version, `# v${version}\n\n## 用戶價值\n\n- wrong`, "self-test old body"),
    "old release body format was not rejected"
  );
  assertThrows(
    () => validateGithubReleaseBodyText(version, validBody.replace("## 對你已有檔案的影響", "## 內部驗收證據"), "self-test missing heading"),
    "missing required release body heading was not rejected"
  );
  console.log("ok: GitHub Release notes contract self-test");
}

function validateGithubReleaseTitle(version, title, label) {
  const prefix = `v${version} - `;
  assert(title.startsWith(prefix), `${label} must start with "${prefix}"`);
  const value = title.slice(prefix.length).trim();
  assert(value, `${label} must include a short user-value phrase after "${prefix}"`);
  assert(/[\u3400-\u9fff]/u.test(value), `${label} must use a Traditional Chinese user-value phrase, not an English implementation label`);
}

function validateGithubReleaseBodyText(version, body, label) {
  assert(body.startsWith(`# v${version}\n`), `${label} must start with "# v${version}" for GitHub Release body reuse`);
  let previousIndex = -1;
  for (const heading of GITHUB_RELEASE_BODY_HEADINGS) {
    const index = body.indexOf(heading);
    assert(index >= 0, `${label} missing GitHub Release body heading: ${heading}`);
    assert(index > previousIndex, `${label} GitHub Release body heading order drifted: ${heading}`);
    previousIndex = index;
  }
  assert(!body.includes("## 用戶價值"), `${label} must not use the old GitHub Release body format`);
  assert(!/(candidate evidence|review bundle|manifest digest|release-readiness|SHA-256|targetCommitish|npm integrity)/iu.test(body), `${label} must keep internal release evidence out of the public GitHub Release body`);
}

function checkReleaseStateCoherence(version) {
  const current = `v${version}`;
  const readmeHead = read("README.md").split(/\r?\n/).slice(0, 12).join("\n");
  const englishReadmeHead = read("README.en.md").split(/\r?\n/).slice(0, 12).join("\n");
  assert(readmeHead.includes(`文件對應程式版本：\`${current}\``), "README.md first screen must state the source package version without claiming it is already published");
  assert(readmeHead.includes("正式下載可用的功能，以已發布版本為準"), "README.md first screen must keep npm/GitHub release state as an external readback boundary");
  assert(englishReadmeHead.includes(`Code version covered: \`${current}\``), "README.en.md first screen must state the source package version without claiming it is already published");
  assert(englishReadmeHead.includes("Features available to download depend on the published version"), "README.en.md first screen must keep npm/GitHub release state as an external readback boundary");

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

function checkPackedPackageUpgradeSmoke(version, {featuresOnly=false} = {}) {
  const smokeBase = qaTemp.track(path.join(tmpdir(), `ack-packed-smoke-${Date.now()}`));
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

  checkPackedShortcutDelivery({smokeBase,packedBin,tgzPath,version});
  if(featuresOnly)return;
  materializeRecentPublishedArtifactInit(upgradeRoot);
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
  assert(journal.attemptedVersion === version && journal.committedVersion === version && journal.state === "committed", "packed upgrade smoke journal does not bind the target version to the committed transaction");
  assert(!journal.currentStateWitness && !journal.runtimeAcceptance, "packed upgrade smoke journal created future current-state authority");
  const report = readFileSync(path.join(migrations, transactionName, "migration-report.md"), "utf8");
  assert(report.includes("- Completed transaction journals are operation receipts only after their lock is cleared."), "packed upgrade smoke report does not disclose operation-local historical authority");

  const firstDoctor = run(process.execPath, [packedBin, "doctor", "--root", upgradeRoot], "packed package doctor after upgrade smoke");
  assertAcceptedCurrentStateDoctorOutput(outputText(firstDoctor), version, "packed package first doctor");
  const beforeSecond = transactionNames.length;
  const secondUpgrade = run(process.execPath, [packedBin, "upgrade", "--yes", "--root", upgradeRoot], "packed package second upgrade smoke");
  const afterSecond = readdirSync(migrations).filter((name) => existsSync(path.join(migrations, name, "transaction.json"))).length;
  assert(secondUpgrade.status === 0 && !outputText(secondUpgrade).includes("migration committed") && afterSecond === beforeSecond, "packed upgrade smoke created a phantom second transaction");
  const secondDoctor = run(process.execPath, [packedBin, "doctor", "--root", upgradeRoot], "packed package second doctor after accepted current state");
  assertAcceptedCurrentStateDoctorOutput(outputText(secondDoctor), version, "packed package second doctor");
}

function checkPackedShortcutDelivery({smokeBase,packedBin,tgzPath,version}) {
  const official=JSON.parse(read('bin/migration-baselines/official-origin-catalog.json')).generatedShortcuts['0.4.0'];
  const baselineDir=path.join(smokeBase,'published-shortcuts'),baselinePrefix=path.join(smokeBase,'old-cli');
  mkdirSync(baselineDir,{recursive:true});
  const packed=JSON.parse(runNpm(['pack',official.npm.spec,'--json','--pack-destination',baselineDir],'published shortcut artifact').stdout)[0];
  const baselineTar=path.join(baselineDir,packed.filename),bytes=readFileSync(baselineTar);
  assert(createHash('sha256').update(bytes).digest('hex')===official.npm.tarballSha256,'published shortcut artifact mismatch');
  assert('sha512-'+createHash('sha512').update(bytes).digest('base64')===official.npm.integrity,'published shortcut npm integrity mismatch');
  runNpm(['install','--prefix',baselinePrefix,'--ignore-scripts',baselineTar],'published shortcut package extract');
  const oldRoot=path.join(baselinePrefix,'node_modules/@adamchanadam/agent-handoff-kit');
  const oldBin=path.join(oldRoot,'bin/agent-handoff-kit.mjs');
  assert(JSON.stringify(collectOfficialShortcuts({packageRoot:oldRoot,tarballPath:baselineTar,version:'0.4.0',npmIdentity:official.npm}))===JSON.stringify(official),'published shortcut history regeneration drifted');
  const fresh=path.join(smokeBase,'fresh-features'),upgraded=path.join(smokeBase,'old-shortcut-features');
  const call=(bin,args,label,env={})=>run(process.execPath,[bin,...args],label,{env:{...process.env,AGENT_HANDOFF_KIT_SKIP_UPDATE_CHECK:'1',...env}});
  const ready=project=>{for(const f of commandFiles())assert(readFileSync(path.join(project,f.file),'utf8')===f.text,'packaged entry mismatch: '+f.file);};
  call(packedBin,['init','--yes','--root',fresh],'packed fresh feature delivery');ready(fresh);
  call(oldBin,['init','--yes','--root',upgraded],'published normal init');
  call(oldBin,['commands','--yes','--root',upgraded],'published optional shortcuts baseline');
  for(const [file,digest]of Object.entries(official.files))assert(createHash('sha256').update(readFileSync(path.join(upgraded,file))).digest('hex')===digest,'old official shortcut not reproduced');
  const userPath=path.join(upgraded,'private-project-note.txt');writeFileSync(userPath,'preserve custom work\n');
  const agents=path.join(upgraded,'AGENTS.md');writeFileSync(agents,'# Local project instructions\n\n'+readFileSync(agents,'utf8'));
  call(packedBin,['upgrade','--yes','--root',upgraded],'published-to-packed normal upgrade');ready(upgraded);
  assert(readFileSync(userPath,'utf8')==='preserve custom work\n','packed upgrade lost ordinary work');
  assert(readFileSync(agents,'utf8').startsWith('# Local project instructions\n\n'),'packed upgrade lost local AGENTS prefix');
  const before=commandFiles().map(f=>readFileSync(path.join(upgraded,f.file),'utf8'));
  call(packedBin,['upgrade','--yes','--root',upgraded],'packed repeat upgrade');
  assert(JSON.stringify(before)===JSON.stringify(commandFiles().map(f=>readFileSync(path.join(upgraded,f.file),'utf8'))),'packed repeat changed shortcuts');
  call(packedBin,['commands','--dry-run','--root',upgraded],'packed shortcut usage entry');
  call(packedBin,['update','--root',upgraded],'packed update entry',{AGENT_HANDOFF_KIT_UPDATE_MOCK_LATEST:version});
  // Missing generated output must make the actual packaged doctor fail.
  const missing=commandFiles().at(-1);rmSync(path.join(fresh,missing.file));
  const negative=spawnSync(process.execPath,[packedBin,'doctor','--root',fresh],{encoding:'utf8',env:{...process.env,AGENT_HANDOFF_KIT_SKIP_UPDATE_CHECK:'1'}});
  assert(!negative.error && Number.isInteger(negative.status) && negative.status!==0 && outputText(negative).includes(missing.file),'packaged doctor must actually reject the missing feature output');
  call(packedBin,['upgrade','--yes','--root',fresh],'packed missing output repair');ready(fresh);
  console.log('ok: actual package fresh init, published0.4.0-to-candidate normal upgrade, all generated entries, custom preservation, repeat and usage CLI; native hosts remain separate');
  console.log('delivery package sha256: '+createHash('sha256').update(readFileSync(tgzPath)).digest('hex'));
  console.log('delivery baseline sha256: '+official.npm.tarballSha256);
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
        assert(english.includes("published version"), `${pair.english} must distinguish source-page and npm versions`);
      }
    }
  }
  const install = read("agent-handoff-kit-ai-install.en.html");
  for (const command of ["init", "upgrade --dry-run", "upgrade --yes", "doctor"]) {
    assert(install.includes(`npx --yes @adamchanadam/agent-handoff-kit@latest ${command}`), `English AI install page misses ${command}`);
  }

  console.log("ok: English public pages and language navigation");
}

async function checkChangedBilingualCandidateEvidence(version, { allowDirty = false, projectRoot = root } = {}) {
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
  const dirty = outputText(run("git", ["status", "--porcelain", "--", ...relevantPaths], "candidate bilingual worktree status", { cwd: projectRoot }));
  if (!allowDirty) {
    assert(!dirty.trim(), "candidate changes a bilingual public surface but is not commit-bound; create a clean local candidate commit before release readiness");
  } else if (dirty.trim()) {
    console.log("ok: candidate bilingual pre-freeze worktree scope");
  }

  const baseline = await resolveFeatureDeliveryBase(projectRoot, version);
  const changed = new Set(allowDirty
    ? outputText(run("git", ["diff", "--name-only", baseline.baseCommit, "--", ...relevantPaths], "candidate bilingual change scope", { cwd: projectRoot }))
      .split(/\r?\n/u)
      .map((value) => value.trim())
      .filter(Boolean)
    : baseline.changedFiles);
  const changedPairs = pairs.filter((pair) => [pair.chinese, pair.english, ...(pair.assets ?? [])].some((file) => changed.has(file)));
  if (changedPairs.length === 0) {
    console.log("ok: bilingual candidate evidence not applicable (no changed language counterpart)");
    return;
  }

  const report = readAt(projectRoot, "docs/qa/release-grade-qa.md");
  for (const pair of changedPairs) {
    const heading = `${pair.heading}（v${version}`;
    const start = report.indexOf(heading);
    assert(start >= 0, `candidate changes ${pair.english} but release QA has no v${version} independent-review section`);
    const end = report.indexOf("\n### ", start + 4);
    const section = report.slice(start, end >= 0 ? end : undefined);
    for (const file of [pair.chinese, pair.english, ...(pair.assets ?? [])]) {
      const contents = pair.assets?.includes(file) ? readFileSync(path.join(projectRoot, file)) : readAt(projectRoot, file);
      const hash = createHash("sha256").update(contents).digest("hex").toUpperCase();
      assert(section.includes(`\`${file}\` SHA-256 \`${hash}\``), `candidate translation evidence is stale for changed ${file}`);
    }
    assert(section.includes("Verdict: **PASS**"), `changed ${pair.english} lacks an independent PASS verdict; do not claim release readiness`);
  }
  console.log(`ok: independent bilingual evidence covers ${changedPairs.length} changed language counterpart(s)`);
}

function assertAcceptedCurrentStateDoctorOutput(output, version, label) {
  assert(output.includes("status: passed"), `${label} did not pass`);
  assert(!/項目版本記錄未與目前工具對齊|建議先執行 .*upgrade --dry-run/u.test(output), `${label} told the user to repeat upgrade despite the accepted current state`);
  assert(/🚀 下一步[:：][\s\S]*(?:Start Agent Handoff|開工|繼續使用)/u.test(output), `${label} did not provide a normal, non-upgrade next step for an accepted current state`);
}

function nextPatch(v) {
  const [major, minor, patch] = v.split(".").map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

function materializeRecentPublishedArtifactInit(project) {
  const npmIdentity = officialOriginCatalog.releases[oldestRecentPublishedUpgradeVersion]?.source?.npm;
  assert(npmIdentity?.spec === `@adamchanadam/agent-handoff-kit@${oldestRecentPublishedUpgradeVersion}`, "recent published baseline npm spec is missing or drifted");
  assert(npmIdentity.shasum && npmIdentity.integrity && Number.isInteger(npmIdentity.entryCount), "v0.3.41 fixture npm identity is incomplete");

  const artifactRoot = path.join(tempRoot, `published-v${oldestRecentPublishedUpgradeVersion}-artifact`);
  mkdirSync(artifactRoot, { recursive: true });
  const pack = runNpm(["pack", npmIdentity.spec, "--json", "--pack-destination", artifactRoot], `published v${oldestRecentPublishedUpgradeVersion} artifact retrieval`);
  let records;
  try {
    records = JSON.parse(pack.stdout);
  } catch {
    throw new Error(`published v${oldestRecentPublishedUpgradeVersion} artifact retrieval returned invalid JSON\n${outputText(pack)}`);
  }
  const record = records?.[0];
  assert(record?.filename === `adamchanadam-agent-handoff-kit-${oldestRecentPublishedUpgradeVersion}.tgz`, "recent published baseline artifact filename mismatch");
  assert(record.shasum === npmIdentity.shasum, "recent published baseline artifact npm shasum mismatch");
  assert(record.integrity === npmIdentity.integrity, "recent published baseline artifact npm integrity mismatch");
  assert(record.entryCount === npmIdentity.entryCount, "recent published baseline artifact npm entry count mismatch");
  const tarballPath = path.join(artifactRoot, record.filename);
  assert(existsSync(tarballPath), "recent published baseline artifact retrieval did not create its tarball");
  const artifactBytes = readFileSync(tarballPath);
  assert(createHash("sha1").update(artifactBytes).digest("hex") === npmIdentity.shasum, "recent published baseline artifact SHA-1 drifted for packed upgrade smoke");
  assert(`sha512-${createHash("sha512").update(artifactBytes).digest("base64")}` === npmIdentity.integrity, "recent published baseline artifact SHA-512 drifted for packed upgrade smoke");

  const installRoot = path.join(artifactRoot, "install");
  mkdirSync(installRoot, { recursive: true });
  runNpm(["install", "--prefix", installRoot, "--ignore-scripts", tarballPath], "recent published baseline artifact extract");
  const packageRoot = path.join(installRoot, "node_modules", "@adamchanadam", "agent-handoff-kit");
  const metadata = JSON.parse(readFileSync(path.join(packageRoot, "package.json"), "utf8"));
  assert(metadata.name === "@adamchanadam/agent-handoff-kit" && metadata.version === oldestRecentPublishedUpgradeVersion, "recent published baseline extracted package identity mismatch");
  const artifactCli = path.join(packageRoot, "bin", "agent-handoff-kit.mjs");
  assert(existsSync(artifactCli), "recent published baseline artifact extraction is missing its formal CLI");
  const init = spawnSync(cliNode, [artifactCli, "init", "--yes", "--root", project], {
    cwd: packageRoot,
    encoding: "utf8",
    env: { ...process.env, AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "1" }
  });
  assert(!init.error && init.status === 0, `published v${oldestRecentPublishedUpgradeVersion} artifact fresh init failed for packed upgrade smoke\n${outputText(init)}`);
  console.log(`ok: published v${oldestRecentPublishedUpgradeVersion} artifact retrieved and verified for packed upgrade smoke`);
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
    cwd: options.cwd ?? root,
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
  const positiveRoot = qaTemp.track(path.join(tmpdir(), `ack-research-trace-pass-${Date.now()}`));
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

  const negativeRoot = qaTemp.track(path.join(tmpdir(), `ack-research-trace-fail-${Date.now()}`));
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
  const handoffTempRoot = qaTemp.track(path.join(tmpdir(), `ack-handoff-temperature-fail-${Date.now()}`));
  run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", handoffTempRoot], "handoff temperature boundary bootstrap");
  const handoffPath = path.join(handoffTempRoot, "dev/SESSION_HANDOFF.md");
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
  writeFileSync(path.join(handoffTempRoot, "START_NEXT_SESSION_PROMPT.txt"), extractOpeningMessage(pollutedHandoff), "utf8");

  const doctor = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "doctor", "--root", handoffTempRoot], {
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

async function checkUnregisteredMarkdownNonDiscoveryContract() {
  const negativeRoot = qaTemp.track(path.join(tmpdir(), `ack-generated-markdown-nondiscovery-${Date.now()}`));
  run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", negativeRoot], "unregistered Markdown non-discovery bootstrap");
  mkdirSync(path.join(negativeRoot, "outputs"), { recursive: true });
  writeFileSync(
    path.join(negativeRoot, "outputs/unregistered_design.md"),
    "# Unregistered Design\n\nThis artifact is a human governance responsibility, not a doctor root-scan target.\n",
    "utf8"
  );
  const sentinelBytes = readFileSync(path.join(negativeRoot, "outputs/unregistered_design.md"));

  const negativeDoctor = spawnSync(cliNode, ["bin/agent-handoff-kit.mjs", "doctor", "--root", negativeRoot], {
    cwd: root,
    encoding: "utf8"
  });
  const negativeOutput = outputText(negativeDoctor);
  assert(negativeDoctor.status === 0 && negativeOutput.includes("status: passed"), "unregistered Markdown should not fail doctor");
  assert(!negativeOutput.includes("generated markdown governance checks"), "doctor still claims generated Markdown root-discovery checks");
  assert(!negativeOutput.includes("outputs/unregistered_design.md"), "doctor reported an arbitrary unregistered Markdown path");
  assert(readFileSync(path.join(negativeRoot, "outputs/unregistered_design.md")).equals(sentinelBytes), "doctor changed arbitrary unregistered Markdown bytes");

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
  assert(lookalikeDoctor.status === 0 && !outputText(lookalikeDoctor).includes("outputs/unregistered_design.md"), "lookalike rows or prose made doctor report an arbitrary unregistered Markdown path");

  const positiveRoot = qaTemp.track(path.join(tmpdir(), `ack-generated-markdown-pass-${Date.now()}`));
  run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", positiveRoot], "registered Markdown non-discovery bootstrap");
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
  const positiveDoctorLabel = "registered Markdown ordinary doctor";
  const positiveDoctor = await runChecked(
    process.execPath,
    ["bin/agent-handoff-kit.mjs", "doctor", "--root", positiveRoot],
    positiveDoctorLabel,
    { cwd: root, timeoutMs: 120_000 }
  );
  assert(
    positiveDoctor.stdout.includes("status: passed"),
    `registered Markdown fixture should pass ordinary doctor\n${describeResult(positiveDoctor)}`
  );
  console.log(`ok: ${positiveDoctorLabel}`);
  console.log("ok: unregistered Markdown non-discovery contract");
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
    "A fresh install with `First-use guidance state: eligible` enters onboarding when no executable objective remains",
    "upgrade never resets consumed / not_applicable first-use state",
    "is continuity",
    "Capability / teaching answers must surface normal-language public command categories",
    "instead of reducing the help answer to CLI maintenance commands",
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
    "Repeat-failure escalation",
    "same failure class recurs",
    "authoritative owner",
    "counterexample or replay check",
    "independent reviewer, subagent, or fresh-context pass",
    "Do not create a central penalty database",
    "public rule carrying project-specific incident details",
    "does not create a central penalty store, cross-project blacklist, or permanent role split",
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
    "不得自動刪除、重命名、移動或合併真源",
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

  checkShortcutTeachingDocuments();

  assertIncludes("scripts/check-upgrade-safety.mjs", [
    "governance bridge RULE_PACKS marker migration",
    "official governance bridge marked route was not restored",
    "unmarked local RULE_PACKS row was not preserved"
  ]);

  assertIncludes("scripts/check-upgrade-safety.mjs", [
    "long-lived lifecycle",
    "malformed historical receipt",
    "ordinary workspace files are inert"
  ]);

  assertIncludes("scripts/check-upgrade-inventory.mjs", [
    "dev/SESSION_LOG_archive/INDEX.md",
    "dev/SESSION_LOG_archive/archive_001.md",
    "typed current inventory is missing",
    "ordinary or historical receipt drift changed current inventory digest"
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
    "明確任務計劃先走主驗收路徑",
    "普通 Markdown / README / spec / checklist 任務不得被 governance bridge",
    "repo-wide scan",
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
    "不得推斷乾淨或同步完成",
    "expected lag",
    "不得當作 drift 而每一步更新 handoff",
    "Kit-managed / release / closeout / external-effect 狀態已變"
  ]);

  assertIncludes("runtime-core/AGENTS.core.md", [
    "Choose exactly one tier after a task",
    "No persistence: no durable fact was produced",
    "active unapproved drafts",
    "routine rerunnable checks",
    "Task-first governance locality",
    "concrete, actionable, authorized task plan",
    "follow the plan's main acceptance path before governance side work",
    "Governance may become the main path only when the task itself is governance",
    "semantically requires cross-session force",
    "do not start governance bridge, long-term-governance routing, repo-wide scans, handoff writes, or closeout solely because the task mentions Markdown, README, docs, specs, plans, checklists, or generated outputs",
    "Lightweight checkpoint",
    "do not perform full closeout",
    "Checkpoint opening consistency: when an authorized checkpoint changes actionable facts",
    "reconcile only those affected current facts in that same checkpoint",
    "Do not merely label an authoritative opening historical",
    "between Persistence Gate decisions",
    "expected lag, not drift",
    "do not update handoff merely to mirror each intermediate step",
    "Pre-closeout checkpoint guard",
    "Do not write either file merely because the next AI might misread stale state",
    "update only the named current-state field(s) or one concise log entry",
    "preserve unrelated / historical handoff sections byte-stable where practical",
    "durable or startup-needed fact must survive interruption",
    "the handoff is the smallest correct home",
    "Kit-managed / release / closeout / external-effect state changed",
    "Ordinary document edits normally use local read-back and task-specific checks only",
    "do not run `agent-handoff-kit doctor`, write handoff / log state, or regenerate the startup mirror solely because a document changed",
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
    "Ordinary target-authority documents, drafts, and user-task deliverables do not load this pack solely because they are Markdown or generated",
    "subordinate to the core task-first governance locality rule",
    "not as permission to interrupt an explicit user task plan",
    "turn an ordinary user-task deliverable into governance work",
    "product goals, requirements, development checklists, acceptance rules",
    "spec, backlog, issue list, README, runbook",
    "Merge into the existing authoritative home",
    "Before any pre-closeout handoff / log write for governance work",
    "future agents may read stale handoff is not enough",
    "leave handoff lag expected unless checkpoint conditions are met",
    "leave historical evidence sections byte-stable",
    "Existing target-authority documents that only received a local content edit normally need read-back and task-specific validation",
    "`agent-handoff-kit doctor` only for scoped Kit / typed registered-surface checks"
  ]);

  assertIncludes("packs/closeout.md", [
    "Handoff cold zones are historical / evidence sections",
    "Do not rewrite, reword, reorder, or refresh cold zones",
    "When older detailed narrative no longer changes the next action, preserve it byte-for-byte in existing trace/archive storage and verify that copy before removing it from the current packet."
  ]);

  assertIncludes("runtime-core/SESSION_HANDOFF.md", [
    "Cold-zone retention and trace/archive handling are owned by `dev/rules/closeout.md`",
    "keep stable anchors plus the current outcome, remaining obligations, decision-changing corrections/rejected reasons, evidence limits and pointers in this packet",
    "Full reception of the current packet remains mandatory"
  ]);
  const handoffTemplate = read("runtime-core/SESSION_HANDOFF.md");
  assert(!handoffTemplate.includes("Historical evidence, old validation records, completed-work narratives, and unchanged durable anchors are cold zones"), "handoff template still duplicates the retired cold-zone definition instead of routing to the closeout pack");
  assert(!handoffTemplate.includes("preserve them byte-for-byte where practical"), "handoff template still carries the retired cold-zone byte-preservation instruction");

  assertIncludes("scripts/check-pack-scenarios.mjs", [
    "pre-closeout checkpoint boundary",
    "Do not write either file merely because the next AI might misread stale state",
    "explicit user task plan remains task-first",
    "run repo-wide governance scan before following an explicit user task plan"
  ]);

  assertIncludes("scripts/check-closeout-efficiency.mjs", [
    "full closeout no longer protects cold-zone historical evidence",
    "handoff template does not route cold-zone procedure to the installed closeout pack"
  ]);

  assertIncludes("scripts/check-upgrade-safety.mjs", [
    "ordinary work and handoff dry-run leave runtime state files byte-stable",
    "upgrade --dry-run changed handoff, log, or startup mirror"
  ]);

  checkShortcutTeachingDocuments();

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

function assertLatestCrossMindTableComplete(version, text = read("docs/qa/release-grade-qa.md")) {
  const heading = `### Cross-mind evidence 9-trigger table（v${version}）`;
  const start = text.indexOf(heading);
  assert(start >= 0, `docs/qa/release-grade-qa.md missing latest Cross-mind evidence table for v${version}`);
  assert(text.indexOf(heading, start + heading.length) < 0, `duplicate Cross-mind evidence table for v${version}`);

  const rest = text.slice(start + heading.length);
  const nextHeading = rest.search(/\n#{1,3} /);
  const section = nextHeading >= 0 ? rest.slice(0, nextHeading) : rest;
  const rows = section
    .split(/\r?\n/)
    .filter((line) => /^\|\s*\d+\.\s+/.test(line));

  assert(rows.length === 9, `latest Cross-mind evidence table for v${version} must contain exactly 9 trigger rows, found ${rows.length}`);
  const identities = new Set();
  const triggers = new Set();
  for (const row of rows) {
    const cells = row.split("|").slice(1, -1).map((cell) => cell.trim());
    assert(cells.length === 4, `latest Cross-mind evidence row has wrong cell count: ${row}`);
    assert(cells.every(Boolean), `latest Cross-mind evidence row has an empty cell: ${row}`);
    const trigger = /^(\d+)\.\s+(.+)$/.exec(cells[0]);
    const identity = Number(trigger?.[1]);
    const name = trigger?.[2].toLowerCase().replace(/\s+/g, ' ').trim();
    assert(identity >= 1 && identity <= 9 && !identities.has(identity), `Cross-mind trigger identity must occur exactly once in 1–9: ${row}`);
    assert(name && !triggers.has(name), `Cross-mind trigger text is duplicated: ${row}`);
    identities.add(identity);
    triggers.add(name);
    assert(/^(yes|no)\b/i.test(cells[1]), `latest Cross-mind evidence Required cell must start with yes/no: ${row}`);
    assert(/^(passed|iterated|blocked)$/i.test(cells[2]), `latest Cross-mind evidence Result cell must be passed / iterated / blocked: ${row}`);
    assert(cells[2].toLowerCase() !== 'blocked', `Cross-mind trigger is blocked; release cannot proceed: ${row}`);
    if (/^no\b/i.test(cells[1])) {
      const reason = cells[1].replace(/^no\b[\s:;—–-]*/i, '') || cells[3];
      assert(!/^(?:n\/?a|none|not[_ ](?:required|applicable)|skip(?:ped)?|passed|iterated)[.!。]?$/i.test(reason), `Cross-mind not-required trigger needs a specific reason: ${row}`);
    }
  }
  console.log(`ok: latest Cross-mind evidence 9-trigger table complete for v${version}`);
}

function checkCrossMindTableCounterexamples() {
  const heading = '### Cross-mind evidence 9-trigger table（v9.8.7）';
  const rows = Array.from({ length: 9 }, (_, index) => `| ${index + 1}. trigger ${index + 1} | yes | passed | Independent review recorded for this trigger. |`);
  const table = (values) => [heading, ...values].join('\n');
  assertLatestCrossMindTableComplete('9.8.7', table(rows));
  const notRequired = [...rows];
  notRequired[0] = '| 1. trigger 1 | no | passed | No external write is included in this candidate. |';
  assertLatestCrossMindTableComplete('9.8.7', table(notRequired));
  const mutations = [
    ['required blocked', values => { values[0] = values[0].replace('passed', 'blocked'); }],
    ['non-required blocked', values => { values[0] = values[0].replace('yes | passed', 'no | blocked'); }],
    ['same row nine times', values => values.fill(values[0])],
    ['missing trigger', values => values.pop()],
    ['unknown trigger', values => { values[8] = values[8].replace('9. trigger', '10. trigger'); }],
    ['renumbered duplicate trigger', values => { values[8] = values[8].replace('trigger 9', 'trigger 1'); }],
    ['false yes prefix', values => { values[0] = values[0].replace('yes', 'yesterday'); }],
    ['skip without reason', values => { values[0] = '| 1. trigger 1 | no | passed | N/A |'; }]
  ];
  for (const [label, mutate] of mutations) {
    const changed = [...rows]; mutate(changed);
    assertThrows(() => assertLatestCrossMindTableComplete('9.8.7', table(changed)), `Cross-mind accepted ${label}`);
  }
  assertThrows(() => assertLatestCrossMindTableComplete('9.8.7', `${table(rows)}\n${table(rows)}`), 'Cross-mind accepted duplicate candidate tables');
  console.log('ok: Cross-mind terminal-state and unique-trigger counterexamples');
}

async function checkBilingualBaselineCounterexamples() {
  const project = qaTemp.track(path.join(tmpdir(), `ack-bilingual-baseline-${Date.now()}`));
  mkdirSync(path.join(project, 'docs/qa'), { recursive: true });
  const git = (args) => run('git', ['-C', project, ...args], 'bilingual baseline fixture');
  const commit = (message) => { git(['add', '.']); git(['-c', 'user.name=Agent Handoff Kit QA', '-c', 'user.email=qa@example.invalid', 'commit', '-m', message]); };
  git(['init']);
  writeFileSync(path.join(project, 'README.md'), 'Chinese baseline\n');
  writeFileSync(path.join(project, 'README.en.md'), 'English baseline\n');
  writeFileSync(path.join(project, 'docs/qa/release-grade-qa.md'), 'No candidate evidence yet.\n');
  commit('previous stable release');
  git(['tag', 'v1.0.0']);
  const initial = await resolveFeatureDeliveryBase(project, '1.0.1');
  assert(initial.baseVersion === '1.0.0' && initial.changedFiles.length === 0, 'unchanged release baseline must have no changes');
  await checkChangedBilingualCandidateEvidence('1.0.1', { projectRoot: project });
  git(['update-ref', 'refs/remotes/origin/main', 'HEAD']);
  writeFileSync(path.join(project, 'README.en.md'), 'Changed English candidate\n');
  commit('candidate language change');
  const assertChanged = async (label) => {
    const baseline = await resolveFeatureDeliveryBase(project, '1.0.1');
    assert(baseline.baseCommit === initial.baseCommit && baseline.changedFiles.includes('README.en.md'), `${label}: preceding stable release change was lost`);
    let rejected = false;
    try { await checkChangedBilingualCandidateEvidence('1.0.1', { projectRoot: project }); }
    catch (error) { assert(error.message.includes('no v1.0.1 independent-review section'), `${label}: unexpected failure: ${error.message}`); rejected = true; }
    assert(rejected, `${label}: missing bilingual evidence incorrectly passed`);
  };
  await assertChanged('unpublished branch');
  git(['update-ref', 'refs/remotes/origin/main', 'HEAD']);
  await assertChanged('candidate already pushed to main');
  writeFileSync(path.join(project, 'unrelated.txt'), 'remote movement\n');
  commit('remote main advances');
  git(['update-ref', 'refs/remotes/origin/main', 'HEAD']);
  git(['checkout', '--detach', 'HEAD~1']);
  await assertChanged('remote advanced beyond candidate');
  git(['tag', 'v1.0.1']);
  git(['tag', 'v1.0.2-rc.1']);
  await assertChanged('same-version and prerelease tags ignored');
  console.log('ok: shared preceding-release baseline survives branch, pushed main, remote movement and unchanged candidates');
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


// Human guidance is checked here once. Detailed runtime behavior remains owned by
// the existing core/pack/installer checks; these assertions never replace full reading.
function publicProse(text) { return stripHtml(text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')); }
function validateAiSetupDocument(text,zh) {
  const plain=publicProse(text),first=plain.indexOf('npx --yes @adamchanadam/agent-handoff-kit@latest init');
  const report=plain.indexOf(zh?'執行前先讀：完成後怎樣回覆':'Before running: the completion reply');
  assert(report>=0 && report<first,'one completion reply contract must precede execution');
  assert((plain.match(new RegExp(zh?'執行前先讀：完成後怎樣回覆':'Before running: the completion reply','g'))||[]).length===1,'completion reply must have one owner');
  for(const command of ['init --yes','upgrade --dry-run','upgrade --yes','doctor']) assert(plain.includes(`npx --yes @adamchanadam/agent-handoff-kit@latest ${command} --root .`),`AI setup missing ${command}`);
  const required=zh?['不刪除、不覆寫衝突','沒有未完成交易、健康結果明示通過','絕對路徑','未確認前，不執行 init、upgrade 或 doctor','零寫入','取得具體授權後才修改','不得靠重裝或整檔覆寫繞過衝突','不能手動刪鎖','不能以單獨 doctor 取代恢復','程序成功退出','完整終態','其後沒有相關檔案變更或不明狀態','保留所有提醒','用戶另行要求檢查','不等於再次核對 npm 最新版','所有專案快捷入口','不要為升級猜補工作進度','已安裝不代表原生選單及呼叫已驗證','不要因安裝完成就自行開始已保存的任務']:['Do not delete files, overwrite conflicts','no transaction remains unfinished, health explicitly passed','absolute path','Before confirmation, do not run init, upgrade or doctor','zero writes','obtain specific authorization before editing','Do not bypass conflicts by reinstalling','Do not delete locks manually','substitute standalone doctor for recovery','process exited successfully','full final state','no relevant file changed or became uncertain afterward','Keep all warnings','user separately requests a check','does not recheck the latest npm release','all project shortcuts','Do not invent work progress','Installed files do not prove native menus and invocation were verified','Finishing setup does not authorize starting the saved task'];
  for(const phrase of required)assert(plain.includes(phrase),`AI setup lost boundary: ${phrase}`);
  for(const action of ['git commit','git push','git tag','npm publish','GitHub Release'])assert(plain.includes(action),`AI setup missing explicit external-action boundary: ${action}`);
}
function checkShortcutTeachingDocuments(readDoc=read) {
  const names=['README.md','README.en.md','docs/commands.md','docs/progress.md',...['intro','guide','ai-install'].flatMap(k=>[`agent-handoff-kit-${k}.html`,`agent-handoff-kit-${k}.en.html`]),'local-agentic-ai-workflow-case-study.html','local-agentic-ai-workflow-case-study.en.html'];
  for(const name of names){
    const text=readDoc(name),plain=name.endsWith('.html')?publicProse(text):text;
    assert(!/(?<!Agent Handoff )\bKit\b/.test(plain),`${name}: unexplained product shorthand`);
    if(name.endsWith('.html')){
      const body=text.split('<body')[1],ids=[...body.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
      assert(new Set(ids).size===ids.length,`${name}: duplicate HTML IDs`);
      for(const m of body.matchAll(/\bdata-copy="([^"]+)"/g))assert(ids.includes(m[1]),`${name}: copy target missing`);
      if(body.includes('data-copy='))assert(body.includes('data-copy-status role="status" aria-live="polite"'),`${name}: missing accessible copy feedback`);
      for(const m of body.matchAll(/\bhref="#([^"]+)"/g))assert(ids.includes(m[1]),`${name}: missing section link`);
      for(const m of body.matchAll(/\b(?:src|href)="([^"#:]+)(?:#[^"]*)?"/g)){const url=m[1];if(!url.startsWith('//'))assert(existsSync(path.resolve(root,path.dirname(name),url.split('?')[0])),`${name}: missing local asset/link ${url}`);}
      for(const m of text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))JSON.parse(m[1]);
    }
    if(!name.includes('ai-install')){
      for(const jargon of ['Reconstruction evidence','eligible','RULE_PACKS','DOC_SYNC_REGISTRY','cold-start','source-of-truth','loop engineering','harness engineering'])assert(!plain.includes(jargon),`${name}: reader-facing internal term ${jargon}`);
      assert(!/npx --yes @adamchanadam\/agent-handoff-kit@latest (?:init|upgrade|doctor)/.test(plain),`${name}: duplicate manual installation journey`);
    }
    if(!name.includes('case-study')&&!name.includes('progress.md')&&!name.includes('ai-install')){
      const entryNames=name.startsWith('README')||name.includes('-intro')?['handoff-kit-start','handoff-kit-progress','handoff-kit-close']:commands.map(c=>c.name);
      for(const entry of entryNames)assert(text.includes(entry),`${name}: missing reader shortcut ${entry}`);
      assert(text.includes('agent-handoff-kit-guide'),'reader shortcut list must link to the complete guide');
      assert(text.includes('/skills') && (text.includes('Codex 用 $')||text.includes('Codex uses $')||text.includes('$handoff-kit-start')),`${name}: missing Codex syntax distinction`);
    }
  }
  // Product coverage complements command teaching: a complete menu cannot replace
  // the explanation of continuity, files, enduring requirements and working methods.
  // Semantic/bilingual review remains required; phrases below only catch deletion.
  for (const suffix of ['', '.en']) {
    const zh=suffix==='';
    const coverage=[
      [`README${suffix}.md`, zh?['跨對話接力','重要文件不漏掉','長期紀錄找得回','按任務選做法','保留日後要求']:['Carry work between conversations','Keep important files connected','Keep a useful long-term record','Adapt to the task','Keep future working requirements']],
      [`agent-handoff-kit-intro${suffix}.html`,zh?['你的修正和未完事項','文件用途','重要決定、選擇原因','工作要求','按任務採用合適的做法']:['your corrections and unfinished items','what files are for','important decisions, their reasons','working requirements','applies the relevant approach']],
      [`agent-handoff-kit-guide${suffix}.html`,zh?['保存重點，日後找得回','按工作需要，換合適做法']:['Keep the context you will need later','Use the right approach for the task']]
    ];
    for(const [name,phrases]of coverage)for(const phrase of phrases)assert(publicProse(readDoc(name)).includes(phrase),`${name}: product explanation missing: ${phrase}`);
  }
  for(const suffix of ['','.en']){
    const guide=readDoc(`agent-handoff-kit-guide${suffix}.html`),zh=suffix==='';
    for(const c of commands){const id=c.name.replace('handoff-kit-','');assert(guide.includes(`id="${id}"`) && guide.includes(`data-command="${id}"`),`guide lacks copyable ${c.name}`);}
    const required=zh?['第一次使用而尚未有目標','再等你提出任務','交接未讀齊或有重要矛盾','不等於整個專案完成','不修復、不升級','你確認修改範圍後才改','沒有說明要求時','有新版便自動升級','不在背景定時更新','不強行覆寫','同一條 npx --registry &lt;loopback&gt; … 呼叫','.npmrc 讀回只是準備紀錄，不能證明已繼承','檔案已安裝不等於工具選單已重新載入','結束對話前','之後查看、篩選和畫面更新不另叫 AI']:['On first use, with no goal yet','then waits for your task','incomplete or contains an important contradiction','does not mean the whole project is complete','does not repair or upgrade','edits wait for your approval of the scope','If no requirement is given','If a newer release exists','not on a background schedule','does not force overwrites','same npx --registry &lt;loopback&gt; … invocation','.npmrc readback is setup metadata, not proof of inheritance','Installed files do not mean a tool has reloaded its menu','ending the conversation','subsequent page updates do not make further AI calls'];
    for(const phrase of required)assert(publicProse(guide).includes(phrase),`guide boundary missing: ${phrase}`);
    const install=readDoc(`agent-handoff-kit-ai-install${suffix}.html`);validateAiSetupDocument(install,zh);
    assert(readDoc(`README${suffix}.md`).includes(`agent-handoff-kit-ai-install${suffix}.html`),'README must use the AI setup page');
    assert(guide.includes('images/agent-handoff-kit-dashboard-en.webp')&&guide.includes('images/agent-handoff-kit-dashboard-zh-Hant.webp'),'guide must show both dashboard languages');
  }
}
function checkShortcutTeachingCounterexamples(){
  const cases=[
    ['agent-handoff-kit-guide.html','data-copy-status role="status" aria-live="polite"','','missing accessible copy feedback'],
    ['agent-handoff-kit-guide.html','不修復、不升級','會修復及升級','guide boundary missing: 不修復、不升級'],
    ['agent-handoff-kit-guide.en.html','then waits for your task','then starts the saved task','guide boundary missing: then waits for your task'],
    ['agent-handoff-kit-guide.html','同一條 <code>npx --registry &lt;loopback&gt; …</code> 呼叫','只要 Node 讀取 .npmrc 便是受控路徑','guide boundary missing: 同一條 npx --registry &lt;loopback&gt; … 呼叫'],
    ['agent-handoff-kit-guide.en.html','same <code>npx --registry &lt;loopback&gt; …</code> invocation','a direct Node run reads the controlled registry','guide boundary missing: same npx --registry &lt;loopback&gt; … invocation'],
    ['agent-handoff-kit-guide.html','id="troubleshooting"','id="help"','duplicate HTML IDs'],
    ['agent-handoff-kit-intro.html','src="images/agent-handoff-kit-main-visual2.png','src="images/missing-brand.png','missing local asset/link images/missing-brand.png'],
    ['agent-handoff-kit-ai-install.html','不能手動刪鎖','可手動刪鎖','AI setup lost boundary: 不能手動刪鎖'],
    ['agent-handoff-kit-ai-install.html','不刪除、不覆寫衝突','可以刪除、可覆寫衝突','AI setup lost boundary: 不刪除、不覆寫衝突'],
    ['agent-handoff-kit-ai-install.html','健康結果明示通過','健康結果不必通過','AI setup lost boundary: 沒有未完成交易、健康結果明示通過'],
    ['agent-handoff-kit-ai-install.en.html','Do not delete files, overwrite conflicts','You may delete files and overwrite conflicts','AI setup lost boundary: Do not delete files, overwrite conflicts'],
    ['agent-handoff-kit-ai-install.en.html','health explicitly passed','health need not pass','AI setup lost boundary: no transaction remains unfinished, health explicitly passed']
  ];
  for(const[file,from,to,expected]of cases){
    const source=read(file);assert(source.includes(from),`mutation anchor missing ${from}`);
    let rejection='';try{checkShortcutTeachingDocuments(n=>n===file?source.replace(from,to):read(n));}catch(error){rejection=error.message;}
    assert(rejection.includes(expected),`bad teaching mutation rejected for wrong reason or accepted: ${file} ${from}: ${rejection}`);
  }
  const shorthandFile='agent-handoff-kit-intro.html', shorthandSource=read(shorthandFile);
  assert(shorthandSource.includes('替你留下甚麼？'),'reader heading anchor missing');
  let shorthandRejection='';
  try{checkShortcutTeachingDocuments(n=>n===shorthandFile?shorthandSource.replace('替你留下甚麼？','Kit 幫你留下甚麼？'):read(n));}catch(error){shorthandRejection=error.message;}
  assert(shorthandRejection.includes('unexplained product shorthand'),'unexplained Kit shorthand must be rejected');
  // Remove the product story while leaving the everyday command navigation intact.
  for(const file of ['agent-handoff-kit-intro.html','agent-handoff-kit-intro.en.html']){
    const source=read(file),mutated=source.replace(/<section class="kit-section" id="what">[\s\S]*?<\/section>/,'<section class="kit-section" id="what"></section>');
    assert(source!==mutated,'product-section mutation must change input');
    assert(['handoff-kit-start','handoff-kit-progress','handoff-kit-close'].every(c=>mutated.includes(c)),'product mutation must retain everyday shortcuts');
    let rejection='';try{checkShortcutTeachingDocuments(n=>n===file?mutated:read(n));}catch(error){rejection=error.message;}
    assert(rejection.includes('product explanation missing:'),`command-only product story accepted or wrong rejection: ${file}: ${rejection}`);
  }
  console.log('ok: missing product explanation, feedback, unsafe behavior, duplicate anchors and broken images fail document checks');
}
