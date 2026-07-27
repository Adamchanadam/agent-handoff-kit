#!/usr/bin/env node

import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { chmod, copyFile, link, lstat, mkdir, open, readFile, readdir, realpath, rename, rmdir, stat, unlink, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { hostname } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assessPromptMirrorRoot, assessPromptMirrorTexts, extractOpeningMessage } from "./prompt-mirror-core.mjs";
import { freshInstallMappings, installedFileContract, installedMappings, requiredInstalledTargets, upgradeStateMappings, upgradeStateTargets } from "./installed-file-contract.mjs";
import { getArtifactBoundManagedSegment, getOfficialBaseline, identifyOfficialOrigin, loadOfficialOriginCatalog } from "./official-origin-catalog.mjs";
import {
  markdownVisibleLinesOutsideHiddenBlocks,
  materializeProjectIndexTemplateVersion,
  parseProjectIndexTemplateVersion,
  projectIndexTemplateVersionRow,
  readProjectIndexTemplateVersion
} from "./upgrade-inventory.mjs";
import {
  FORMAL_USER_RULES_ENTRY_ANCHOR,
  USER_RULES_ROUTER_PATH,
  createUserRulesState,
  isFormalUserRulesContentPath,
  parseUserRulesRegistry,
  readFormalUserRules,
  renderUserRulesAcceptanceDigest,
  renderUserRulesRouter,
  userRulesAcceptanceDigest
} from "./user-rules-router.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");

const mappings = installedMappings;
const requiredTargets = requiredInstalledTargets;
const rulePackTargets = mappings
  .map(([, target]) => target)
  .filter((target) => target.startsWith("dev/rules/"));
const managedCoreStart = "<!-- BEGIN Agent Handoff Kit managed core -->";
const managedCoreEnd = "<!-- END Agent Handoff Kit managed core -->";
const credentialLeakPatterns = [
  { pattern: /sk-ant-[A-Za-z0-9_-]{20,}/, label: "Anthropic API key" },
  { pattern: /\bsk-[A-Za-z0-9_-]{20,}/, label: "sk-prefixed token" },
  { pattern: /\bntn_[A-Za-z0-9_-]{40,}/, label: "Notion token" },
  { pattern: /\bsecret_[A-Za-z0-9_-]{40,}/, label: "secret-prefixed token" },
  { pattern: /\bya29\.[A-Za-z0-9_-]{20,}/, label: "Google OAuth token" },
  { pattern: /\b1\/\/[A-Za-z0-9_-]{30,}/, label: "Google refresh token" },
  { pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}/, label: "Slack token" },
  { pattern: /\b(?:ghp|gho|ghs)_[A-Za-z0-9]{36}/, label: "GitHub token" },
  { pattern: /\bgithub_pat_[A-Za-z0-9_]{20,}/, label: "GitHub fine-grained token" },
  { pattern: /\bsl\.[A-Za-z0-9_-]{50,}/, label: "Dropbox token" },
  { pattern: /\bAKIA[A-Z0-9]{16}/, label: "AWS access key" },
  { pattern: /\bAIza[A-Za-z0-9_-]{35}/, label: "Google API key" }
];
const projectIndexTemplateVersionMetadataReason = "update only the unique real PROJECT_INDEX Stack template-version row while preserving every other PROJECT_INDEX byte";
const projectIndexTemplateVersionMetadataTransition = "project-index-template-version";

const requiredAnchors = [
  {
    target: "AGENTS.md",
    label: "continuity-first startup and proportional work",
    snippets: [
      "## 1. Intent And Startup",
      "dev/SESSION_HANDOFF.md",
      "Do not read `dev/SESSION_LOG.md` during ordinary startup",
      "dev/PROJECT_INDEX.md",
      "dev/RULE_PACKS.md",
      "Agent Handoff Kit v<version>",
      "continuity ready",
      "推薦下一步",
      "Start Agent Handoff",
      "A fresh install or short message only makes guidance available",
      "Direct ordinary tasks do not show the card",
      "Reachable is not the same as ingested",
      "Proportionate Work Loop",
      "Pack loading is normally silent",
      "dev/rules/integrations.md",
      "Probe an integration only immediately before a task uses it"
    ]
  },
  {
    target: "AGENTS.md",
    label: "closeout trigger and invariants",
    snippets: [
      "## 4. Closeout Trigger",
      "收工",
      "Wrap up Agent Handoff",
      "wrap up",
      "handoff",
      "dev/rules/closeout.md",
      "Current state lives in `dev/SESSION_HANDOFF.md`",
      "no third full copy is retained",
      "START_NEXT_SESSION_PROMPT.txt",
      "closeout-status",
      "handoff saved"
    ]
  },
  {
    target: "dev/rules/closeout.md",
    label: "closeout pack complete contract",
    snippets: [
      "Closeout Pack",
      "single detailed contract",
      "Reconcile lifecycle state",
      "Completed This Session",
      "prompt-mirror verification result",
      "Mark first-use guidance",
      "Maintenance Trigger Check",
      "START_NEXT_SESSION_PROMPT.txt",
      "omit the full opening message by design",
      "handoff saved",
      "Project-required persistence",
      "closeout-status",
      "Stop Conditions"
    ]
  },
  {
    target: "dev/SESSION_HANDOFF.md",
    label: "handoff workspace and opening message schema",
    snippets: [
      "ack:section:current-baseline",
      "ack:section:durable-anchors",
      "ack:section:closeout-reconciled-state",
      "ack:section:task-understanding-summary",
      "ack:section:active-objective",
      "ack:section:next-priorities",
      "ack:section:risks-blockers",
      "ack:section:validation-qc",
      "ack:section:workspace-identity",
      "ack:section:sync-status",
      "ack:section:next-task-required-reading",
      "ack:section:state-reconciliation-check",
      "ack:section:next-session-opening-message",
      "ack:field:recommended-next-step-explicit",
      "ack:field:lifecycle-conflicts-resolved",
      "ack:field:persistence-routing-checked",
      "ack:field:closeout-outcome",
      "ack:field:project-required-persistence",
      "ack:field:first-use-guidance-state",
      "📋 Next session:",
      "```text",
      "Do not read dev/SESSION_LOG.md during ordinary startup"
    ]
  },
  {
    target: "dev/rules/communication.md",
    label: "communication recommended next-step discipline",
    snippets: [
      "Communication Pack",
      "recommended next step",
      "state it directly with a short reason",
      "Offer two or three choices only when the user truly must decide",
      "do not turn an already-made technical judgment into an open question"
    ]
  },
  {
    target: "dev/SESSION_LOG.md",
    label: "session log event schema without prompt copy",
    placement: sessionLogAnchorPlacement,
    snippets: [
      "ack:section:session-log-preamble",
      "ack:section:session-log-entry-template",
      "ack:log-entry:start",
      "ack:log-entry:end",
      "Record what actually happened in the session",
      "## Entry Template",
      "- **QC:**",
      "- **Sync:**",
      "- **Log maintenance:**",
      "- **Opening-message mirror:**",
      "full text omitted by design"
    ]
  },
  {
    target: "dev/SESSION_HANDOFF.md",
    label: "handoff log archive continuity",
    placement: handoffContinuityAnchorPlacement,
    snippets: [
      "ack:section:handoff-sufficiency-check",
      "ack:section:state-reconciliation-check",
      "ack:field:stale-snapshots-left",
      "ack:field:opening-message-matches-current-state",
      "without searching old log history",
      "SESSION_LOG.md` carries recent evidence",
      "do not create an archive directory by default"
    ]
  },
  {
    target: "dev/SESSION_LOG.md",
    label: "log retention and evidence schema",
    placement: sessionLogAnchorPlacement,
    snippets: [
      "kept, summarized, or archived",
      "Do not remove validation evidence",
      "full opening message never belongs in this log",
      "not current state"
    ]
  },
  {
    target: "dev/PROJECT_INDEX.md",
    label: "template version metadata",
    placement: projectIndexAnchorPlacement,
    snippets: [
      "Agent Handoff Kit template version"
    ]
  },
  {
    target: "dev/PROJECT_INDEX.md",
    label: "tool operation references",
    snippets: [
      "Tool Operation References",
      "runtime-controlled tools",
      "Source and version/date",
      "Scope and known limits"
    ]
  },
  {
    target: "dev/rules/safety.md",
    label: "safety pack high-risk anchors",
    placement: safetyAnchorPlacement,
    snippets: [
      "deleting, overwriting, moving, renaming",
      "filesystem root, drive root",
      "cmd /c rmdir",
      "git reset --hard",
      "external APIs, SDKs, CLIs",
      "parser failure",
      "secret values",
      "task-owned or agent-managed",
      "other-agent-owned",
      "browser profiles",
      "desktop app sessions",
      "shared tool servers",
      "notebook kernels",
      "Short-lived localhost validation services"
    ]
  },
  {
    target: "dev/PROJECT_DECISIONS.md",
    label: "project decisions narrative anchors",
    placement: projectDecisionsAnchorPlacement,
    snippets: [
      "Project Decisions Log",
      "warm narrative layer",
      "do not need to read this file at startup",
      "The AI updates it during closeout",
      "Evidence chain: Source=source:<id>; Summary=<source finding>; Inference=<reasoning>; Decision impact=<what changed>; Uncertainty=<limits or none>.",
      "This file does not store raw build / upload / QC evidence",
      "Evolution Timeline",
      "Decisions Archive",
      "Architecture Choices",
      "Insights & Learnings"
    ]
  },
  {
    target: "dev/rules/onboarding.md",
    label: "onboarding pack core anchors",
    placement: onboardingAnchorPlacement,
    snippets: [
      "Onboarding Pack",
      "transient pack",
      "Explicit onboarding signal keywords",
      "Continuity startup boundary",
      "starts continuity and reads the minimum current handoff state; it is not an onboarding signal",
      "Infer when sufficient; ask only when unresolved",
      "Application Scenario Library",
      "Scenario A. Build systems, tools, platforms, websites, or apps",
      "Scenario B. Organize research or write a report",
      "Scenario C. Organize local files, Notion, Google Drive, or a knowledge base",
      "Scenario D. Learn to code",
      "Scenario E. Custom scenario",
      "Scenario F. External-tool governance",
      "Tone Discipline"
    ]
  },
  {
    target: "dev/rules/integrations.md",
    label: "integrations pack core anchors",
    placement: integrationsAnchorPlacement,
    snippets: [
      "Integrations Pack",
      "Connectors",
      "MCPs",
      "Plugins",
      "Skills",
      "Credential Separation Principle",
      "External Tool Usage Verification Gate",
      "External Tool Resource Lifecycle",
      "other-agent-owned",
      "do not invent",
      "input schema",
      "official documentation",
      "Source-of-truth Architecture",
      "Cross-session Lifecycle",
      "Connector-first default",
      "Runtime-Controlled Tool Operation Variants",
      "Tool Operation References",
      "Do not guess Chrome, Playwright, or DevTools commands",
      "Local HTML / app validation fallback",
      "`file://` rejection alone is not enough evidence to stop",
      "Anti-pattern"
    ]
  }
];

const schemaChecks = [
  {
    target: "AGENTS.md",
    label: "core runtime uniqueness",
    checks: [
      {
        label: "AGENTS.md health state is clean (single managed core, no unmarked dup, paired markers)",
        test: (text) => assessAgentsMdHealth(text).state === "clean"
      }
    ]
  },
  {
    target: "dev/SESSION_HANDOFF.md",
    label: "handoff required sections",
    checks: [
      section("current-baseline", "Current Baseline"),
      section("durable-anchors", "Durable Anchors"),
      section("closeout-reconciled-state", "Closeout-Reconciled State"),
      section("task-understanding-summary", "Task Understanding Summary"),
      section("active-objective", "Active Objective"),
      section("next-priorities", "Next Priorities"),
      section("next-task-required-reading", "Next Task Required Reading"),
      section("risks-blockers", "Risks / Blockers"),
      section("validation-qc", "Validation / QC"),
      section("workspace-identity", "Workspace Identity"),
      section("sync-status", "Sync Status"),
      section("state-reconciliation-check", "State Reconciliation Check"),
      section("handoff-sufficiency-check", "Handoff Sufficiency Check"),
      section("next-session-opening-message", "Next Session Opening Message"),
      marker("field", "stale-snapshots-left", "Stale snapshots left in this handoff"),
      marker("field", "lifecycle-conflicts-resolved", "Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified"),
      marker("field", "persistence-routing-checked", "Persistence routing checked"),
      marker("field", "closeout-outcome", "Closeout outcome"),
      marker("field", "project-required-persistence", "Project-required persistence"),
      marker("field", "recommended-next-step-explicit", "Recommended next step is explicit and reasoned"),
      marker("field", "opening-message-matches-current-state", "Opening message matches current state"),
      marker("field", "state-sections-rewritten-or-confirmed", "State sections rewritten or confirmed current"),
      marker("field", "user-intent", "User intent:"),
      marker("field", "task-essence", "Task essence:"),
      marker("field", "success-criteria", "Success criteria:")
      ,marker("field", "first-use-guidance-state", "First-use guidance state:")
    ]
  },
  {
    target: "dev/SESSION_HANDOFF.md",
    label: "handoff opening message structure",
    checks: [
      includes("📋 Next session:"),
      includes("```text"),
      includes("Work in "),
      includes("Read AGENTS.md, then dev/SESSION_HANDOFF.md"),
      includes("Do not read dev/SESSION_LOG.md during ordinary startup")
    ]
  },
  {
    target: "dev/SESSION_HANDOFF.md",
    label: "handoff lifecycle mechanical checks",
    checks: [
    ]
  },
  {
    target: "dev/SESSION_LOG.md",
    label: "session log entry fields",
    checks: [
      heading("Entry Template"),
      {
        label: "SESSION_LOG has one trusted current entry-template boundary",
        test: (text) => Boolean(sessionLogEntryTemplateContract(text))
      },
      marker("section", "session-log-preamble", "Handoff role"),
      marker("section", "session-log-entry-template", "Entry Template"),
      includes("ack:log-entry:start"),
      includes("ack:log-entry:end"),
      includes("- **ID:**"),
      includes("- **Summary:**"),
      includes("- **Changed:**"),
      includes("- **Done:**"),
      includes("- **QC:**"),
      includes("- **Evidence disposition:**"),
      includes("- **Sync:**"),
      includes("- **Pending:**"),
      includes("- **Risks:**"),
      includes("- **Log maintenance:**"),
      includes("- **Opening-message mirror:**"),
      {
        label: "SESSION_LOG does not contain a full opening-message copy",
        test: (text) => !text.includes("Read AGENTS.md, then dev/SESSION_HANDOFF.md. Trust the handoff over this generated mirror.")
      }
    ]
  },
  {
    target: "dev/PROJECT_INDEX.md",
    label: "project index tables",
    checks: [
      heading("Stack"),
      heading("Directory Map"),
      heading("Entry Points"),
      heading("Fact Base"),
      heading("External Sources"),
      heading("Installed Integrations"),
      heading("Tool Operation References"),
      heading("Local QC Commands"),
      {
        label: "Installed Integrations and Tool Operation References are unique real H2 sections before Local QC Commands",
        test: (text) => projectIndexGovernanceSectionsAreValid(text)
      },
      heading("Workspace Identity"),
      heading("Change Hotspots"),
      heading("Maintenance Rule"),
      tableHeader("Path", "Role", "Read when"),
      tableHeader("Source", "Role", "Required before", "Access method", "Last verified"),
      // External Sources tableHeader removed in v0.3.0 — schema accepts either 6-col legacy or 7-col v0.3.0+
      // to support non-destructive migration (existing v0.2.x users keep their 6-col table; new installs
      // get 7-col template with `via` column). The heading("External Sources") check above is sufficient
      // to verify the section is structurally present.
      tableHeader("Check", "Command", "Run before", "Last verified"),
      tableHeader("Change type", "Likely files", "Required checks"),
      tableHeader("Tool / operation", "Reference path or URL", "Required before", "Source and version/date", "Scope and known limits", "Last verified")
    ]
  },
  {
    target: "dev/DOC_SYNC_REGISTRY.md",
    label: "doc sync registry status vocabulary",
    checks: [
      heading("Status Vocabulary"),
      includes("confirmed"),
      includes("unverified"),
      includes("pending"),
      includes("blocked"),
      includes("not_applicable"),
      tableHeader("Change type", "Also check/update", "Verification")
    ]
  },
  {
    target: "dev/RULE_PACKS.md",
    label: "rule pack router coverage",
    checks: [
      heading("Routing Rule"),
      includes("Load the minimum set"),
      includes("cannot weaken core safety"),
      includes("dev/rules/safety.md"),
      includes("dev/rules/coding.md"),
      includes("dev/rules/research.md"),
      includes("dev/rules/release.md"),
      // R-029 v0.2.1+: routing table must include onboarding pack first-time signal row.
      // Without this anchor, the upgrade flow may silently leave v0.1.X users with a
      // stale routing table that does not route onboarding signals.
      includes("Explicit onboarding requests"),
      includes("dev/rules/onboarding.md"),
      includes("fresh install"),
      includes("dev/rules/closeout.md"),
      // R-030 v0.3.0+: routing table must include integrations pack row.
      includes("dev/rules/integrations.md"),
      includes("External tool resource pressure"),
      includes("ownership-based external-tool resource closeout"),
      includes("local HTML validation"),
      includes("localhost fallback"),
      includes("Governance bridge / bridge governance"),
      includes("equivalent Chinese user phrases"),
      includes("scan for unbridged governance documents"),
      includes("scan for unbridged governance documents")
    ]
  },
  {
    target: "dev/rules/closeout.md",
    label: "closeout pack structure",
    checks: [
      heading("Scope"),
      heading("Required Reads"),
      heading("Write Contract"),
      heading("Full Closeout"),
      heading("Maintenance Trigger Check"),
      heading("Opening Message And Card"),
      heading("Stop Conditions"),
      includes("full opening message"),
      includes("first-use guidance"),
      includes("START_NEXT_SESSION_PROMPT.txt")
    ]
  },
  {
    target: "dev/rules/agent-governance.md",
    label: "agent governance pack structure",
    checks: [
      heading("Scope"),
      heading("Load When"),
      heading("Rules"),
      heading("Governance Bridge Workflow"),
      heading("Checks"),
      heading("Closeout"),
      includes("Governance bridge is a triggered review"),
      includes("equivalent Chinese phrases"),
      includes("scan for unbridged governance documents"),
      includes("Status: bridged / partially bridged / unbridged / blocked"),
      includes("duplicate source-of-truth risk")
    ]
  },
  {
    target: "dev/PROJECT_DECISIONS.md",
    label: "project decisions log structure",
    checks: [
      heading("Evolution Timeline"),
      heading("Decisions Archive"),
      heading("Architecture Choices"),
      heading("Insights & Learnings"),
      includes("Evidence chain: Source=source:<id>; Summary=<source finding>; Inference=<reasoning>; Decision impact=<what changed>; Uncertainty=<limits or none>."),
      includes("(empty)")
    ]
  },
  {
    target: "dev/rules/onboarding.md",
    label: "onboarding pack structure",
    checks: [
      heading("Scope"),
      heading("Load When"),
      heading("Discipline"),
      heading("Application Scenario Library"),
      heading("Cross-reference to guide.html"),
      heading("Tone Discipline"),
      heading("Closeout")
    ]
  },
  {
    target: "dev/rules/integrations.md",
    label: "integrations pack structure",
    checks: [
      heading("Scope"),
      heading("Load When"),
      heading("Discipline"),
      includes("External Tool Resource Lifecycle"),
      includes("other-agent-owned"),
      heading("Rules"),
      heading("Checks"),
      heading("Closeout"),
      heading("Anti-patterns"),
      heading("Cross-reference")
    ]
  }
];

main().catch((error) => {
  console.error(`agent-handoff-kit: ${error.message}`);
  process.exitCode = 1;
});

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  const version = await readPackageVersion();
  // `doctor` renders version alignment itself.  Let that single health run own
  // the lookup instead of checking once here and once again inside doctor.
  if (command !== "closeout-status" && command !== "doctor") await maybePrintUpdateNotice(version);
  if (!command || options.help) {
    printHelp(version);
    return;
  }

  const root = path.resolve(options.root ?? process.cwd());

  if (command === "init" || command === "upgrade") {
    await runInstall(command, root, options, version);
    return;
  }

  if (command === "doctor") {
    await runDoctor(root, version);
    return;
  }

  if (command === "closeout-status") {
    await runCloseoutStatus(root, version);
    return;
  }

  throw new Error(`unknown command "${command}"`);
}

async function runCloseoutStatus(root, version) {
  let handoffText = "";
  try {
    handoffText = await readFile(path.join(root, "dev", "SESSION_HANDOFF.md"), "utf8");
  } catch {
    printCloseoutStatusCard(version, { ok: false, findings: ["current handoff is unreadable"] });
    process.exitCode = 1;
    return;
  }

  const findings = [];
  const outcome = closeoutOutcome(fieldValueAfterMarker(handoffText, "closeout-outcome"));
  const persistence = projectRequiredPersistence(fieldValueAfterMarker(handoffText, "project-required-persistence"));
  if (outcome !== "complete") findings.push("closeout outcome is not complete");
  if (!new Set(["complete", "not_required"]).has(persistence)) findings.push("project-required persistence is not complete or not required");
  if (!assessHandoffLifecycleConsistency(handoffText).ok) findings.push("handoff lifecycle read-back is not healthy");
  if (!assessPromptMirrorRoot(root).ok) findings.push("opening-message mirror is not current");

  // A closeout card needs a fresh local health readback, not a version-notice
  // network request.  The caller has already completed the closeout workflow.
  const doctor = await assessUpgradeNoopHealth(root, version, { skipVersionRegistryLookup: true });
  if (!doctor.ok) findings.push("fresh doctor read-back did not pass");

  const result = { ok: findings.length === 0, findings };
  printCloseoutStatusCard(version, result);
  if (!result.ok) process.exitCode = 1;
}

function closeoutOutcome(value) {
  return /^(complete|completed)\b/i.test((value ?? "").trim()) ? "complete" : "blocked";
}

function projectRequiredPersistence(value) {
  const normalized = (value ?? "").trim();
  if (/^(complete|completed)\b/i.test(normalized)) return "complete";
  if (/^not_required\b/i.test(normalized)) return "not_required";
  return "blocked";
}

function printCloseoutStatusCard(version, result) {
  console.log(`   /\\_/\\   Agent Handoff Kit v${version}`);
  if (result.ok) {
    console.log("  ( -.- )  handoff saved");
    console.log("   > ^ <");
    console.log("");
    console.log("status: complete");
    console.log("✅ Done: required closeout state is complete");
    console.log("🔎 QC: fresh doctor and opening-message mirror passed");
    console.log("📌 Handoff: opening message ready");
    console.log("⚠️ Boundary: none");
    return;
  }
  console.log("  ( x.x )  handoff blocked");
  console.log("   > ^ <");
  console.log("");
  console.log("status: blocked");
  console.log(`⚠️ Blocker: ${result.findings.join("; ")}`);
  console.log("💬 說明：這不是失敗；只是還有事未保存、未提交、未驗證或需要處理。先照 Blocker 行處理，不要把本輪當作已完成交接。");
  console.log("📌 Handoff: keep the current state resumable; do not call this closeout complete");
}

function parseArgs(args) {
  const options = {};
  let command;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!command && !arg.startsWith("-")) {
      command = arg;
      continue;
    }
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--yes" || arg === "-y") options.yes = true;
    else if (arg === "--manifest") options.manifest = args[++i];
    else if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--root") options.root = args[++i];
    else throw new Error(`unknown option "${arg}"`);
  }

  return { command, options };
}

// Detect stale PROJECT_INDEX template version metadata before the plan-time no-op
// path so a metadata-only root still enters the transaction ceremony.
async function needsProjectIndexVersionInject(root, command, version) {
  if (command !== "upgrade") return false;
  const installedVersion = await readProjectIndexTemplateVersion(root);
  return Boolean(installedVersion && compareSemver(installedVersion, version) < 0);
}

async function runInstall(command, root, options, version) {
  // Guard the selected root before reading or recovering any persisted
  // transaction. Recovery is a write path and must not run through a junction.
  await validateTransactionRoot(root, [], { createMissingRoot: false });
  if (options.dryRun) await assertDryRunHasNoPendingTransaction(root);
  else {
    await recoverInterruptedTransaction(root);
    if (command === "upgrade" && process.env.AGENT_HANDOFF_KIT_QA_RECOVER_ONLY === "1") {
      console.log("QA recovery-only path completed; no new upgrade transaction was started.");
      return;
    }
  }
  const installedVersion = await readProjectIndexTemplateVersion(root);
  if (command === "upgrade" && installedVersion && compareSemver(installedVersion, version) > 0) {
    console.log(`selected root: ${root}`);
    console.log(`status: blocked`);
    console.log(`reason: project template v${installedVersion} is newer than this CLI v${version}`);
    console.log("no files written: use an equal or newer Agent Handoff Kit CLI; downgrade requires a separately designed command");
    process.exitCode = 1;
    return;
  }
  const mode = await detectMode(root);
  const plan = await buildPlan(root, command, version);
  // Validate the operator-selected path before every exit path, including
  // dry-run, conflicts, and already-current no-op upgrades. Otherwise a
  // junction can be silently accepted whenever there is nothing to write.
  // Before confirmation, validate the selected path without creating it. A
  // cancelled init/upgrade must leave a previously missing root absent.
  await validateTransactionRoot(root, plan, { createMissingRoot: false });

  // R-031 v0.3.1+: plan-time upgrade no-op detection. When upgrade has zero
  // create/merge/conflict actions (skip-only), skip the full plan listing +
  // confirmWrite + ceremony. The plan listing in this scenario is pure noise —
  // user is already at latest and just verifying status.
  const planConflictCount = plan.filter((item) => item.action === "conflict").length;
  // A verified formal user-rules transition is represented as a planned merge
  // so a real change stays atomic with the Kit base.  On a freshly installed,
  // already-current root it can nevertheless produce no bytes at all.  Compute
  // that state in memory before choosing the user-facing no-op path; doctor
  // still performs the authoritative fresh readback below.
  let candidateOutputs = null;
  if (command === "upgrade" && planConflictCount === 0) {
    candidateOutputs = await buildTransactionOutputs(command, root, plan, version);
    reconcilePlanWithTransactionOutputs(plan, candidateOutputs);
  }
  const planCreateCount = plan.filter((item) => item.action === "create").length;
  const planMergeCount = plan.filter((item) => item.action === "merge").length;
  const planPreserveCount = plan.filter((item) => item.action === "preserve").length;
  const planSkipCount = plan.filter((item) => item.action === "skip").length;
  // Metadata-only stale guard. If PROJECT_INDEX structure is fully current but
  // the Stack version row is stale, the row still needs an operation-local
  // transaction instead of the no-op short circuit.
  const projectIndexVersionNeedsInject = await needsProjectIndexVersionInject(root, command, version);
  const isUpgradeNoopAtPlanTime = command === "upgrade"
    && planConflictCount === 0
    && !projectIndexVersionNeedsInject;

  const hasNoTransactionOutputs = candidateOutputs?.length === 0;

  if (isUpgradeNoopAtPlanTime && (
    (planCreateCount === 0 && planMergeCount === 0 && planPreserveCount === 0)
    || hasNoTransactionOutputs
  )) {
    const noOpHealth = await assessUpgradeNoopHealth(root, version);
    if (noOpHealth.ok) printCard(version, "continuity ready", "o.o");
    console.log(`command: ${command}`);
    console.log(`current directory: ${process.cwd()}`);
    console.log(`selected root: ${root}`);
    console.log(`version state: live ${installedVersion ? `v${installedVersion}` : "unverified"} -> target v${version}; current transaction: none (historical migration folders are evidence only)`);
    console.log(`mode: ${mode}`);
    console.log("");
    console.log(`📋 計劃預覽：create 0 / merge 0 / skip ${planSkipCount} / conflict 0 — 沒有檔案需要建立或合併。`);
    if (options.dryRun) {
      console.log("");
      console.log("dry-run: no files written");
    }
    printUpgradeNoopShortCircuit(version, noOpHealth);
    if (!noOpHealth.ok) process.exitCode = 1;
    return;
  }

  let transactionPreflight = null;
  if (planConflictCount === 0) {
    try {
      transactionPreflight = await buildInstallTransactionPreflight(command, root, plan, version, {
        candidateOutputs
      });
      candidateOutputs = transactionPreflight.outputs;
    } catch (error) {
      plan.push({
        targetRel: "transaction preflight",
        action: "conflict",
        reason: safeErrorLabel(error)
      });
    }
  }

  printPlan(command, root, mode, plan, version, options.dryRun, installedVersion);

  if (options.dryRun) {
    console.log("\ndry-run: no files written");
    printDryRunExplanation(command, mode, plan);
    if (plan.some((item) => item.action === "conflict")) process.exitCode = 1;
    return;
  }

  if (plan.some((item) => item.action === "conflict")) {
    console.log("");
    console.log("⛔ 升級預檢發現 conflict；治理目標檔、版本與 migration artifact 均沒有寫入。");
    console.log("📌 舊 migration stage、已回滾報告或版本列只屬證據，不代表目前交易。");
    console.log(conflictRepairNextStepLine());
    process.exitCode = 1;
    return;
  }

  if (!options.yes) {
    const ok = await confirmWrite();
    if (!ok) {
      console.log("cancelled: no files written");
      return;
    }
  }

  await executeInstallTransaction(command, root, mode, plan, version, transactionPreflight);
}

async function executeInstallTransaction(command, root, mode, plan, version, candidatePreflight = null, options = {}) {
  const preflight = candidatePreflight ?? await buildInstallTransactionPreflight(command, root, plan, version, options);
  const outputs = preflight.outputs;
  if (outputs.length === 0) {
    const health = await assessUpgradeNoopHealth(root, version);
    printUpgradeNoopShortCircuit(version, health);
    if (!health.ok) process.exitCode = 1;
    return;
  }

  // The user has confirmed writes. Create and revalidate a missing root only
  // now, immediately before transaction artifacts are prepared.
  await validateTransactionRoot(root, plan, { createMissingRoot: true });
  const transaction = await prepareTransaction(root, command, version, outputs, mode, plan, preflight.archiveMigrations);
  try {
    await injectBeforeLockRevalidationDrift(root, transaction.journal);
    await assertPreparedTransactionPreflightStillCurrent(root, transaction, preflight, plan);
  } catch (error) {
    await abortPreparedTransactionBeforeTargetWrites(root, transaction, error);
    throw error;
  }
  try {
    transaction.journal.state = "committing";
    await writeSecureJson(transaction.journalPath, transaction.journal);

    await applyArchiveCasingMigrations(root, transaction);

    let committedCount = 0;
    const qaFailAfterCommit = Number.parseInt(process.env.AGENT_HANDOFF_KIT_QA_FAIL_AFTER_COMMIT ?? "", 10);
    const qaFailAfterCommitTarget = process.env.AGENT_HANDOFF_KIT_QA_FAIL_AFTER_COMMIT_TARGET ?? null;
    const qaInterruptAfterReplace = process.env.AGENT_HANDOFF_KIT_QA_INTERRUPT_AFTER_REPLACE === "1"
      ? 1
      : Number.parseInt(process.env.AGENT_HANDOFF_KIT_QA_INTERRUPT_AFTER_REPLACE_COUNT ?? "", 10);
    for (const entry of transaction.journal.entries) {
      const output = outputs.find((item) => item.targetRel === entry.targetRel);
      const current = await readOptionalBuffer(output.targetAbs);
      const currentHash = current ? sha256(current) : null;
      if (currentHash !== entry.beforeHash) {
        throw new Error(`${entry.targetRel}: target changed after transaction preparation; no overwrite attempted`);
      }
      await atomicReplaceFromBuffer(root, output.targetAbs, output.after, transaction.id, entry.beforeHash, {
        targetRel: entry.targetRel,
        escrowDir: transaction.escrowDir,
        phase: "forward"
      });
      if (Number.isInteger(qaInterruptAfterReplace) && qaInterruptAfterReplace === committedCount + 1) {
        const interruption = new Error("QA interruption after target replacement before journal update");
        interruption.code = "ACK_QA_INTERRUPT_AFTER_REPLACE";
        throw interruption;
      }
      entry.committed = true;
      committedCount += 1;
      await writeSecureJson(transaction.journalPath, transaction.journal);
      if ((Number.isInteger(qaFailAfterCommit) && qaFailAfterCommit === committedCount)
        || (qaFailAfterCommitTarget === entry.targetRel)) {
        throw new Error(`QA fault injection after committed target ${entry.targetRel}`);
      }
    }

    // Test-only fault injection for the acceptance/readback boundary.  This
    // runs after every transaction target has been published and journaled,
    // but before the single fresh doctor readback that is allowed to certify
    // success.  Production behavior is unchanged unless the explicit QA
    // environment variables are present.
    await injectTransactionWindowDrift(root, transaction.journal);

    let formalRuntimeState = null;
    const doctorStatus = await runDoctor(root, version, {
      silentCard: true,
      context: "post-transaction-project-health",
      skipVersionRegistryLookup: true,
      allowActiveTransaction: true,
      captureFormalUserRules: (state) => { formalRuntimeState = state; },
    });
    if (doctorStatus !== "passed") {
      throw new Error("post-transaction doctor failed; transaction is not committed");
    }
    if (transaction.journal.formalUserRules) {
      if (!formalRuntimeState) throw new Error("post-transaction doctor did not produce the required formal runtime readback");
      transaction.journal.runtimeReadback = formalUserRulesReadbackFromDoctorState(formalRuntimeState, transaction.journal.formalUserRules);
    }
    transaction.journal.committedVersion = version;
    transaction.journal.state = "committed";
    transaction.journal.committedAt = new Date().toISOString();
    await writeSecureJson(transaction.journalPath, transaction.journal);
    if (process.env.AGENT_HANDOFF_KIT_QA_INTERRUPT_AFTER_JOURNAL_COMMIT === "1") {
      const interruption = new Error("QA interruption after committed journal before migration report");
      interruption.code = "ACK_QA_INTERRUPT_AFTER_JOURNAL_COMMIT";
      throw interruption;
    }
    const reportPath = await writeTransactionReport(transaction);
    await unlinkIfExists(transaction.lockPath);

    const created = outputs.filter((item) => !item.before).map((item) => item.targetRel);
    const merged = outputs.filter((item) => item.before).map((item) => item.reason ? `${item.targetRel} - ${item.reason}` : item.targetRel);
    printCard(version, command === "upgrade" ? "upgrade verified" : "continuity ready", "o.o");
    printInstallSummary(version, command, mode, root, {
      created: created.length,
      merged: merged.length,
      skipped: plan.filter((item) => item.action === "skip").length,
      conflicts: 0,
      backupRel: path.relative(root, transaction.backupDir),
      reportRel: path.relative(root, reportPath)
    });
    if (command === "upgrade") printUpgradeNextSteps(root, 0);
    else printInstallNextSteps(root, 0, mode, plan.filter((item) => item.action === "skip").length);

    if (command === "upgrade") {
      console.log("");
      console.log("✅ migration committed：已由同一輪正式 doctor 讀回後提交。");
      console.log("✅ project health: passed");
    }
  } catch (error) {
    if ([
      "ACK_QA_INTERRUPT_AFTER_REPLACE",
      "ACK_QA_INTERRUPT_AFTER_JOURNAL_COMMIT",
      "ACK_QA_INTERRUPT_AFTER_ARCHIVE_RELOCATE_BEFORE_STAGE",
      "ACK_QA_INTERRUPT_AFTER_ARCHIVE_STAGE",
      "ACK_QA_INTERRUPT_AFTER_ARCHIVE_MATERIALIZE_BEFORE_JOURNAL"
    ].includes(error?.code)) throw error;
    if (isNoClobberConflict(error)) {
      transaction.journal.state = "manual-recovery-required";
      transaction.journal.committedVersion = null;
      transaction.journal.error = safeErrorLabel(error);
      transaction.journal.recoveryConflicts = [safeErrorLabel(error)];
      await writeSecureJson(transaction.journalPath, transaction.journal).catch(() => {});
      console.log("⛔ migration incomplete：no-clobber boundary preserved concurrent bytes; recovery lock remains.");
      throw error;
    }
    transaction.journal.state = "rollback-needed";
    transaction.journal.error = safeErrorLabel(error);
    await writeSecureJson(transaction.journalPath, transaction.journal).catch(() => {});
    const rollback = await rollbackTransaction(root, transaction.journal, transaction.journalPath);
    if (rollback.ok) {
      await unlinkIfExists(transaction.lockPath);
      console.log("⚠️ migration rolled back：遷移驗收或寫入失敗，已復原本次交易所改動的目標。");
    } else {
      console.log("⛔ migration incomplete：現存檔案已出現第三種內容，工具沒有強制回滾以免覆寫後續修改。");
      for (const conflict of rollback.conflicts) console.log(`blocked  ${conflict}`);
    }
    throw error;
  }
}

async function buildInstallTransactionPreflight(command, root, plan, version, options = {}) {
  const outputs = options.candidateOutputs ?? await buildTransactionOutputs(command, root, plan, version, {
    allowActiveTransaction: options.allowActiveTransaction === true
  });
  if (outputs.length === 0) {
    return Object.freeze({
      outputs,
      archiveMigrations: Object.freeze([]),
      identity: installTransactionPreflightIdentity({ command, version, outputs })
    });
  }

  const credentialFindings = await detectInstalledCredentialFindings(root);
  if (credentialFindings.length > 0) {
    throw new Error(`existing governance contains ${credentialFindings.length} possible credential value(s); remove and rotate them before upgrade`);
  }

  await validateTransactionOverlay(root, outputs);
  const archiveMigrations = command === "upgrade"
    ? await prepareArchiveCasingMigrations(root)
    : [];
  const identity = installTransactionPreflightIdentity({
    command,
    version,
    outputs,
    archiveMigrations
  });
  return Object.freeze({
    outputs,
    archiveMigrations: Object.freeze(archiveMigrations),
    identity
  });
}

function installTransactionPreflightIdentity({ command, version, outputs = [], archiveMigrations = [] }) {
  const body = {
    schemaVersion: 1,
    command,
    version,
    outputs: outputs.map((output) => ({
      targetRel: output.targetRel,
      existed: Boolean(output.before),
      beforeHash: output.beforeHash,
      afterHash: output.afterHash,
      bytes: output.after.length,
      reason: output.reason ?? null
    })),
    archiveMigrations: archiveMigrations.map(archiveMigrationWitness)
  };
  return sha256(Buffer.from(`${JSON.stringify(body)}\n`, "utf8"));
}

async function assertPreparedTransactionPreflightStillCurrent(root, transaction, expected, plan) {
  let actual;
  try {
    actual = await buildInstallTransactionPreflight(
      transaction.journal.command,
      root,
      plan,
      transaction.journal.attemptedVersion,
      {
        allowActiveTransaction: true,
        excludeInFlightTransactionId: transaction.id
      }
    );
  } catch (error) {
    throw new Error(`transaction pre-replace preflight identity drifted under lock; no target replacement attempted: ${safeErrorLabel(error)}`);
  }
  if (actual.identity !== expected.identity) {
    throw new Error("transaction pre-replace preflight identity drifted under lock; no target replacement attempted");
  }
}

async function abortPreparedTransactionBeforeTargetWrites(root, transaction, error) {
  if (transaction.journal.state !== "prepared" || transaction.journal.entries.some((entry) => entry.committed)
    || (transaction.journal.archiveMigrations ?? []).some((migration) => migration.state !== "prepared")) {
    throw new Error("pre-replace abort is only valid for a prepared transaction with no committed entries or archive relocation");
  }
  transaction.journal.state = "rolled-back";
  transaction.journal.error = safeErrorLabel(error);
  transaction.journal.rollbackAt = new Date().toISOString();
  transaction.journal.recoveryConflicts = [];
  await writeSecureJson(transaction.journalPath, transaction.journal);
  await unlinkIfExists(transaction.lockPath);
  console.log("⚠️ migration rolled back：lock-time preflight drifted before target replacement; no target bytes were replaced.");
}

async function injectBeforeLockRevalidationDrift(root, journal) {
  const targetRel = process.env.AGENT_HANDOFF_KIT_QA_MUTATE_BEFORE_LOCK_REVALIDATION;
  if (!targetRel) return;
  const encoded = process.env.AGENT_HANDOFF_KIT_QA_MUTATE_BEFORE_LOCK_REVALIDATION_BASE64;
  if (!encoded) throw new Error("QA before-lock-revalidation drift payload is missing");
  if (!journal.entries.some((entry) => entry.targetRel === targetRel)) {
    throw new Error(`QA before-lock-revalidation target is not part of this transaction: ${targetRel}`);
  }
  const targetAbs = path.resolve(root, targetRel);
  if (!isInside(root, targetAbs)) throw new Error("QA before-lock-revalidation target escaped root");
  await writeFile(targetAbs, Buffer.from(encoded, "base64"), { mode: 0o600 });
}

async function detectInstalledCredentialFindings(root) {
  const credentialInputs = [];
  for (const relative of requiredTargets) {
    const buffer = await readOptionalBuffer(path.join(root, relative));
    if (buffer) credentialInputs.push({ relative, text: decodeUtf8(buffer, relative).text });
  }
  return detectCredentialValues(credentialInputs);
}

async function buildTransactionOutputs(command, root, plan, version, options = {}) {
  const byTarget = new Map();
  for (const item of plan) {
    if (item.action !== "create" && item.action !== "merge" && item.action !== "preserve") continue;
    const before = await readOptionalBuffer(item.targetAbs);
    let afterText = null;
    let after = null;
    let projectIndexVersionMetadataMerge = false;
    if (item.action === "preserve") {
      if (!before) throw new Error(`${item.targetRel}: preserved transaction item disappeared before preparation`);
      if (command === "upgrade" && item.targetRel === "dev/PROJECT_INDEX.md") {
        const originalText = decodeUtf8(before, item.targetRel).text;
        const materializedText = materializeProjectIndexTemplateVersion(originalText, version);
        if (materializedText !== originalText) {
          after = Buffer.from(materializedText, "utf8");
          projectIndexVersionMetadataMerge = true;
        }
        else after = Buffer.from(before);
      } else {
        after = Buffer.from(before);
      }
    } else if (item.action === "create") {
      const sourceText = await readTemplateSource(command, item.sourceRel, item.targetRel, item.sourceAbs);
      afterText = item.targetRel === "AGENTS.md" ? mergeManagedBlock("", sourceText) : sourceText;
    } else if (item.action === "merge" && item.targetRel === "dev/PROJECT_INDEX.md" && item.metadataTransition === projectIndexTemplateVersionMetadataTransition) {
      if (!before) throw new Error(`${item.targetRel}: template-version metadata transition disappeared before preparation`);
      const originalText = decodeUtf8(before, item.targetRel).text;
      const materializedText = materializeProjectIndexTemplateVersion(originalText, version);
      if (materializedText !== originalText) {
        after = Buffer.from(materializedText, "utf8");
        projectIndexVersionMetadataMerge = true;
      }
      else after = Buffer.from(before);
    } else {
      afterText = item.mergedText;
      after = item.mergedBytes ? Buffer.from(item.mergedBytes) : null;
    }
    // A first install may merge into a user-owned AGENTS.md.  It still creates
    // the formal router, so the matching active AGENTS entry must be installed
    // in the same transaction.  Do not duplicate a pre-existing entry.
    if (command === "init" && item.targetRel === "AGENTS.md" && !afterText.includes(FORMAL_USER_RULES_ENTRY_ANCHOR)) {
      const userRulesEntry = await readFile(path.join(packageRoot, "runtime-core", "USER_RULES_ENTRY.md"), "utf8");
      afterText = `${afterText.trimEnd()}\n\n${userRulesEntry.trim()}\n`;
    }
    if (afterText != null && !projectIndexVersionMetadataMerge) afterText = afterText.replaceAll("<absolute project root>", root);
    byTarget.set(item.targetRel, {
      targetRel: item.targetRel,
      targetAbs: item.targetAbs,
      before,
      after,
      afterText,
      ...(item.action === "preserve" && !projectIndexVersionMetadataMerge ? { forceTransaction: true } : {}),
      ...(item.action === "preserve" && !projectIndexVersionMetadataMerge ? { preservedRuntimeItem: item.preservedRuntimeItem } : {}),
      ...(item.managedSegmentRuntimeItem ? { managedSegmentRuntimeItem: item.managedSegmentRuntimeItem } : {}),
      reason: projectIndexVersionMetadataMerge ? projectIndexTemplateVersionMetadataReason : item.reason ?? item.action
    });
  }

  const indexRel = "dev/PROJECT_INDEX.md";
  const indexAbs = path.join(root, indexRel);
  let indexOutput = byTarget.get(indexRel);
  if (!indexOutput && (command === "upgrade" || await exists(indexAbs))) {
    const before = await readOptionalBuffer(indexAbs);
    if (before) indexOutput = { targetRel: indexRel, targetAbs: indexAbs, before, afterText: decodeUtf8(before, indexRel).text, reason: projectIndexTemplateVersionMetadataReason };
  }
  if (indexOutput?.afterText != null) {
    const materializedText = materializeProjectIndexTemplateVersion(indexOutput.afterText, version);
    if (materializedText !== indexOutput.afterText) {
      indexOutput.after = Buffer.from(materializedText, "utf8");
      indexOutput.afterText = null;
    } else {
      indexOutput.afterText = materializedText;
    }
    byTarget.set(indexRel, indexOutput);
  }

  const handoffRel = "dev/SESSION_HANDOFF.md";
  const promptRel = "START_NEXT_SESSION_PROMPT.txt";
  const handoffOutput = byTarget.get(handoffRel);
  const finalHandoffText = handoffOutput?.afterText ?? await readOptionalText(path.join(root, handoffRel));
  if (finalHandoffText) {
    const opening = extractOpeningMessage(finalHandoffText);
    if (opening != null) {
      const promptAbs = path.join(root, promptRel);
      const promptBefore = await readOptionalBuffer(promptAbs);
      const existing = byTarget.get(promptRel);
      if (!existing?.preservedRuntimeItem) {
        // A preserved historical handoff is itself the authoritative source for
        // this convenience mirror.  Do not change its root placeholder only in
        // the newly created mirror: that would make the final transaction fail
        // the mirror check while leaving the preserved handoff untouched.
        const preserveHandoffOpening = Boolean(handoffOutput?.preservedRuntimeItem);
        byTarget.set(promptRel, {
          targetRel: promptRel,
          targetAbs: promptAbs,
          before: existing?.before ?? promptBefore,
          afterText: preserveHandoffOpening ? opening : opening.replaceAll("<absolute project root>", root),
          reason: preserveHandoffOpening
            ? "regenerated byte-for-byte from preserved authoritative handoff opening message"
            : "regenerated from authoritative handoff opening message"
        });
      }
    }
  }

  await synchronizeFormalUserRulesTransactionState(command, root, byTarget, version, {
    allowActiveTransaction: options.allowActiveTransaction === true
  });

  const outputs = [];
  for (const item of byTarget.values()) {
    const after = item.after ?? encodeLikeExisting(item.afterText, item.before, item.targetRel);
    if (!item.forceTransaction && item.before && item.before.equals(after)) continue;
    outputs.push({ ...item, after, beforeHash: item.before ? sha256(item.before) : null, afterHash: sha256(after) });
  }
  return outputs;
}

function reconcilePlanWithTransactionOutputs(plan, outputs) {
  const outputByTarget = new Map(outputs.map((item) => [item.targetRel, item]));
  for (const item of plan) {
    const output = outputByTarget.get(item.targetRel);
    if (
      item.action === "preserve"
      && item.targetRel === "dev/PROJECT_INDEX.md"
      && output?.reason === projectIndexTemplateVersionMetadataReason
      && output.beforeHash !== output.afterHash
    ) {
      item.action = "merge";
      item.reason = output.reason;
      item.metadataTransition = projectIndexTemplateVersionMetadataTransition;
      delete item.preservedRuntimeItem;
      continue;
    }
    if (!["create", "merge", "preserve"].includes(item.action) || output) continue;
    // Planning formal state transitions before rendering their canonical
    // acceptance is necessary for safety. Once the in-memory comparison proves
    // no bytes would change, do not present that transition as a write.
    item.action = "skip";
    item.reason = "already accepted with no byte change in this transaction";
  }
}

async function synchronizeFormalUserRulesTransactionState(command, root, byTarget, version, options = {}) {
  const routerOutput = byTarget.get(USER_RULES_ROUTER_PATH);
  if (!routerOutput) return;

  let prior = null;
  if (command === "upgrade") {
    // The old formal reader is the sole authority for whether a prior router
    // is eligible for transition. A path, title, or directory never grants
    // this authority.
    prior = await readFormalUserRules({ root, allowActiveTransaction: options.allowActiveTransaction === true });
  }

  let agentOutput = byTarget.get("AGENTS.md");
  if (!agentOutput) {
    const targetAbs = path.join(root, "AGENTS.md");
    const before = await readOptionalBuffer(targetAbs);
    if (!before) throw new Error("formal user-rules transition requires AGENTS.md");
    agentOutput = {
      targetRel: "AGENTS.md",
      targetAbs,
      before,
      afterText: decodeUtf8(before, "AGENTS.md").text,
      reason: "formal user-rules acceptance transition"
    };
    byTarget.set("AGENTS.md", agentOutput);
  }

  const agentsText = agentOutput.afterText
    ?? decodeUtf8(agentOutput.after ?? agentOutput.before, "AGENTS.md").text;
  const entries = parseUserRulesRegistry(routerOutput.afterText);
  const state = createUserRulesState({ packageVersion: version, agentsText });
  routerOutput.afterText = renderUserRulesRouter(routerOutput.afterText, { state, entries });
  const acceptanceDigest = userRulesAcceptanceDigest(entries, state);
  const renderedAgentsText = renderUserRulesAcceptanceDigest(agentsText, acceptanceDigest);
  if (agentOutput.after) {
    const renderedBytes = encodeLikeExisting(renderedAgentsText, agentOutput.before, "AGENTS.md");
    if (!agentOutput.after.equals(renderedBytes)) {
      agentOutput.after = renderedBytes;
      agentOutput.reason = "formal user-rules acceptance digest transition";
    }
  }
  agentOutput.afterText = renderedAgentsText;
  const witness = createFormalUserRulesWitness(entries, state, acceptanceDigest);
  routerOutput.formalUserRules = witness;
  agentOutput.formalUserRules = witness;

  if (!prior) return;
  if (prior.rules.length !== entries.length || prior.acceptanceDigest !== userRulesAcceptanceDigest(entries, prior.state)) {
    throw new Error("formal user-rules transition input changed after formal reader validation");
  }
  for (const rule of prior.rules) {
    if (byTarget.has(rule.path)) throw new Error(`formal user-rules content overlaps a Kit transaction target: ${rule.path}`);
    byTarget.set(rule.path, {
      targetRel: rule.path,
      targetAbs: path.join(root, rule.path),
      before: rule.bytes,
      after: Buffer.from(rule.bytes),
      forceTransaction: true,
      formalUserRuleContent: true,
      formalUserRules: witness,
      reason: "formal user-rules original-byte preservation"
    });
  }
}

function createFormalUserRulesWitness(entries, state, acceptanceDigest) {
  return Object.freeze({
    acceptanceDigest,
    state,
    entries: Object.freeze(entries.map((entry) => Object.freeze({
      entryId: entry.entryId,
      contentPath: entry.contentPath,
      accepted: Object.freeze({ sha256: entry.accepted.sha256, bytes: entry.accepted.bytes }),
      sourceWitness: Object.freeze({ sha256: entry.sourceWitness.sha256, bytes: entry.sourceWitness.bytes }),
      originalReader: entry.originalReader,
      activeReader: entry.activeReader,
      priorityRelation: entry.priorityRelation,
      effectDecision: entry.effectDecision
    })))
  });
}

async function prepareTransaction(root, command, version, outputs, mode, plan, archiveMigrations = []) {
  const id = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}`;
  const migrationsRoot = path.join(root, "dev", "governance_migrations");
  const migrationDir = path.join(migrationsRoot, id);
  const backupDir = path.join(migrationDir, "backup");
  const stageDir = path.join(migrationDir, "stage");
  const escrowDir = path.join(migrationDir, "no-clobber-escrow");
  const archiveBackupDir = path.join(migrationDir, "archive-backup");
  const journalPath = path.join(migrationDir, "transaction.json");
  const lockPath = path.join(migrationsRoot, ".upgrade.lock");
  await mkdir(backupDir, { recursive: true });
  await mkdir(stageDir, { recursive: true });
  await mkdir(escrowDir, { recursive: true });
  await mkdir(archiveBackupDir, { recursive: true });
  await tightenPermissions(migrationsRoot, 0o700);
  await tightenPermissions(migrationDir, 0o700);
  await publishTransactionLock(root, lockPath, { id, host: hostname(), pid: process.pid, journal: path.relative(root, journalPath), command });

  const entries = [];
  for (const output of outputs) {
    const stagePath = path.join(stageDir, output.targetRel);
    await mkdir(path.dirname(stagePath), { recursive: true });
    await writeFile(stagePath, output.after, { mode: 0o600 });
    let backupRel = null;
    if (output.before) {
      const backupPath = path.join(backupDir, output.targetRel);
      await mkdir(path.dirname(backupPath), { recursive: true });
      await writeFile(backupPath, output.before, { mode: 0o600 });
      backupRel = path.relative(root, backupPath);
    }
    entries.push({ targetRel: output.targetRel, existed: Boolean(output.before), beforeHash: output.beforeHash, afterHash: output.afterHash, backupRel, committed: false, reason: output.reason ?? null });
  }
  const journal = {
    id,
    command,
    mode,
    attemptedVersion: version,
    committedVersion: null,
    plannedSkips: plan.filter((item) => item.action === "skip").length,
    host: hostname(),
    pid: process.pid,
    state: "prepared",
    createdAt: new Date().toISOString(),
    entries,
    formalUserRules: resolveFormalUserRulesWitness(outputs),
    runtimeReadback: null,
    archiveMigrations: archiveMigrations.map((migration, index) => ({
      ...migration,
      stageRel: `archive-backup/${index}`,
      state: "prepared"
    }))
  };
  await writeSecureJson(journalPath, journal);
  return { id, migrationDir, backupDir, stageDir, escrowDir, archiveBackupDir, journalPath, lockPath, journal };
}

async function prepareArchiveCasingMigrations(root) {
  const devDir = path.join(root, "dev");
  let entries;
  try {
    entries = await readdir(devDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  const matches = entries
    .filter((entry) => entry.isDirectory() && entry.name.toLowerCase() === "session_log_archive")
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
  if (matches.length === 0 || (matches.length === 1 && matches[0] === "SESSION_LOG_archive")) return [];
  if (matches.includes("SESSION_LOG_archive") || matches.length !== 1) {
    throw new Error(`archive casing migration is ambiguous: ${matches.map((name) => `dev/${name}`).join(", ")}`);
  }
  const originalRel = `dev/${matches[0]}`;
  return [{
    schemaVersion: 1,
    originalRel,
    canonicalRel: "dev/SESSION_LOG_archive",
    snapshot: await snapshotDirectoryTree(root, originalRel)
  }];
}

async function applyArchiveCasingMigrations(root, transaction) {
  for (const migration of transaction.journal.archiveMigrations ?? []) {
    const migrationDir = transaction.migrationDir;
    const originalAbs = path.join(root, migration.originalRel);
    const canonicalAbs = path.join(root, migration.canonicalRel);
    const stageAbs = path.join(migrationDir, migration.stageRel);
    if (migration.state === "prepared") {
      await assertExactDirectorySnapshot(root, migration.originalRel, migration.snapshot, "archive migration source changed before transaction commit");
      await assertExactProjectDirectoryAbsent(root, migration.canonicalRel, "canonical archive path appeared before transaction commit");
      if (await pathExists(stageAbs)) throw noClobberConflict(`${migration.originalRel}: transaction archive backup already exists; recovery lock retained`);
      await mkdir(path.dirname(stageAbs), { recursive: true });
      migration.state = "relocating";
      await writeSecureJson(transaction.journalPath, transaction.journal);
    }
    if (migration.state === "relocating") {
      await rename(originalAbs, stageAbs);
      await assertExactProjectDirectoryAbsent(root, migration.originalRel, "archive source remains after relocation");
      await assertDirectorySnapshotAtPath(stageAbs, migration.snapshot, "archive backup differs after relocation");
      if (process.env.AGENT_HANDOFF_KIT_QA_INTERRUPT_AFTER_ARCHIVE_RELOCATE_BEFORE_STAGE === "1") {
        const interruption = new Error("QA interruption after archive relocation before staged journal");
        interruption.code = "ACK_QA_INTERRUPT_AFTER_ARCHIVE_RELOCATE_BEFORE_STAGE";
        throw interruption;
      }
      migration.state = "staged";
      await writeSecureJson(transaction.journalPath, transaction.journal);
      if (process.env.AGENT_HANDOFF_KIT_QA_INTERRUPT_AFTER_ARCHIVE_STAGE === "1") {
        const interruption = new Error("QA interruption after archive relocation");
        interruption.code = "ACK_QA_INTERRUPT_AFTER_ARCHIVE_STAGE";
        throw interruption;
      }
    }
    if (migration.state === "staged") {
      migration.state = "materializing";
      await writeSecureJson(transaction.journalPath, transaction.journal);
    }
    if (migration.state === "materializing") {
      await materializeArchiveCanonicalPath(root, migration, stageAbs);
      if (process.env.AGENT_HANDOFF_KIT_QA_INTERRUPT_AFTER_ARCHIVE_MATERIALIZE_BEFORE_JOURNAL === "1") {
        const interruption = new Error("QA interruption after archive canonical materialization before materialized journal");
        interruption.code = "ACK_QA_INTERRUPT_AFTER_ARCHIVE_MATERIALIZE_BEFORE_JOURNAL";
        throw interruption;
      }
      migration.state = "materialized";
      await writeSecureJson(transaction.journalPath, transaction.journal);
      if (process.env.AGENT_HANDOFF_KIT_QA_FAIL_AFTER_ARCHIVE_MATERIALIZE === "1") {
        throw new Error("QA fault injection after archive canonical materialization");
      }
    }
    if (migration.state !== "materialized") throw new Error("archive migration journal state is invalid during commit");
  }
}

async function materializeArchiveCanonicalPath(root, migration, stageAbs) {
  await assertDirectorySnapshotAtPath(stageAbs, migration.snapshot, "archive backup changed before canonical materialization");
  await assertExactProjectDirectoryAbsent(root, migration.canonicalRel, "canonical archive path appeared during transaction");
  const canonicalAbs = path.join(root, migration.canonicalRel);
  try {
    await mkdir(canonicalAbs);
  } catch (error) {
    if (error?.code === "EEXIST") throw noClobberConflict(`${migration.canonicalRel}: canonical archive path appeared during transaction; recovery lock retained`);
    throw error;
  }
  for (const directory of migration.snapshot.directories.filter((item) => item).sort((left, right) => left.localeCompare(right))) {
    try {
      await mkdir(path.join(canonicalAbs, directory));
    } catch (error) {
      if (error?.code === "EEXIST") throw noClobberConflict(`${migration.canonicalRel}/${directory}: archive directory appeared during transaction; recovery lock retained`);
      throw error;
    }
  }
  for (const file of migration.snapshot.files) {
    const source = path.join(stageAbs, file.path);
    const target = path.join(canonicalAbs, file.path);
    const sourceBytes = await readFile(source);
    if (sourceBytes.length !== file.bytes || sha256(sourceBytes) !== file.sha256) {
      throw new Error(`${migration.originalRel}/${file.path}: archive backup bytes changed before canonical materialization`);
    }
    try {
      await writeFile(target, sourceBytes, { mode: 0o600, flag: "wx" });
    } catch (error) {
      if (error?.code === "EEXIST") throw noClobberConflict(`${migration.canonicalRel}/${file.path}: archive file appeared during transaction; recovery lock retained`);
      throw error;
    }
  }
  await assertExactDirectorySnapshot(root, migration.canonicalRel, migration.snapshot, "canonical archive materialization did not retain source bytes");
}

async function snapshotDirectoryTree(root, relative) {
  const absolute = path.join(root, relative);
  return snapshotDirectoryTreeAtPath(absolute);
}

async function snapshotDirectoryTreeAtPath(absolute) {
  const rootStats = await lstat(absolute).catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error));
  if (!rootStats?.isDirectory() || rootStats.isSymbolicLink()) throw new Error("archive migration directory is missing or unsafe");
  const directories = [""];
  const files = [];
  async function visit(current, relative) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
      const child = path.join(current, entry.name);
      if (entry.isDirectory()) {
        const stats = await lstat(child);
        if (stats.isSymbolicLink()) throw new Error(`${childRelative}: archive migration does not accept symbolic links or junctions`);
        directories.push(childRelative);
        await visit(child, childRelative);
      } else if (entry.isFile()) {
        const stats = await lstat(child);
        if (stats.isSymbolicLink()) throw new Error(`${childRelative}: archive migration does not accept symbolic links`);
        const bytes = await readFile(child);
        files.push({ path: childRelative, sha256: sha256(bytes), bytes: bytes.length });
      } else {
        throw new Error(`${childRelative}: archive migration accepts only regular files and directories`);
      }
    }
  }
  await visit(absolute, "");
  directories.sort((left, right) => left.localeCompare(right));
  files.sort((left, right) => left.path.localeCompare(right.path));
  const body = { schemaVersion: 1, directories, files };
  return { ...body, manifestSha256: sha256(Buffer.from(`${JSON.stringify(body)}\n`, "utf8")) };
}

function validateArchiveSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)
    || snapshot.schemaVersion !== 1
    || !Array.isArray(snapshot.directories) || snapshot.directories[0] !== ""
    || !Array.isArray(snapshot.files)
    || typeof snapshot.manifestSha256 !== "string" || !/^[a-f0-9]{64}$/.test(snapshot.manifestSha256)) {
    throw new Error("archive migration snapshot is invalid; no recovery writes attempted");
  }
  const seenDirectories = new Set();
  let previousDirectory = null;
  for (const directory of snapshot.directories) {
    if (typeof directory !== "string" || (directory && !isSafeProjectRelative(directory)) || seenDirectories.has(directory)
      || (previousDirectory != null && previousDirectory.localeCompare(directory) >= 0)) {
      throw new Error("archive migration directory snapshot is invalid; no recovery writes attempted");
    }
    seenDirectories.add(directory);
    previousDirectory = directory;
  }
  const seenFiles = new Set();
  let previousFile = null;
  for (const file of snapshot.files) {
    if (!file || typeof file !== "object" || Array.isArray(file)
      || !isSafeProjectRelative(file.path) || seenFiles.has(file.path)
      || !Number.isInteger(file.bytes) || file.bytes < 0
      || typeof file.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(file.sha256)
      || (previousFile != null && previousFile.localeCompare(file.path) >= 0)) {
      throw new Error("archive migration file snapshot is invalid; no recovery writes attempted");
    }
    seenFiles.add(file.path);
    previousFile = file.path;
  }
  const body = { schemaVersion: snapshot.schemaVersion, directories: snapshot.directories, files: snapshot.files };
  if (sha256(Buffer.from(`${JSON.stringify(body)}\n`, "utf8")) !== snapshot.manifestSha256) {
    throw new Error("archive migration snapshot digest is invalid; no recovery writes attempted");
  }
  return snapshot;
}

function archiveMigrationWitness(migration) {
  return {
    schemaVersion: migration.schemaVersion,
    originalRel: migration.originalRel,
    canonicalRel: migration.canonicalRel,
    snapshot: migration.snapshot
  };
}

function validateArchiveMigrations(value, { requireMaterialized = false } = {}) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("archive migration journal is missing or invalid; no recovery writes attempted");
  }
  const seenOriginal = new Set();
  const seenCanonical = new Set();
  let previous = null;
  for (const migration of value) {
    if (!migration || typeof migration !== "object" || Array.isArray(migration)
      || migration.schemaVersion !== 1
      || !isSafeProjectRelative(migration.originalRel) || !migration.originalRel.startsWith("dev/")
      || migration.canonicalRel !== "dev/SESSION_LOG_archive"
      || seenOriginal.has(migration.originalRel) || seenCanonical.has(migration.canonicalRel)
      || (previous != null && previous.localeCompare(migration.originalRel) >= 0)) {
      throw new Error("archive migration journal entry is invalid; no recovery writes attempted");
    }
    if (migration.stageRel !== undefined && (!isSafeProjectRelative(migration.stageRel) || !migration.stageRel.startsWith("archive-backup/"))) {
      throw new Error("archive migration backup path is invalid; no recovery writes attempted");
    }
    if (migration.state !== undefined && !["prepared", "relocating", "staged", "materializing", "materialized"].includes(migration.state)) {
      throw new Error("archive migration state is invalid; no recovery writes attempted");
    }
    if (requireMaterialized && migration.state !== undefined && migration.state !== "materialized") {
      throw new Error("committed archive migration is not materialized; no recovery writes attempted");
    }
    validateArchiveSnapshot(migration.snapshot);
    seenOriginal.add(migration.originalRel);
    seenCanonical.add(migration.canonicalRel);
    previous = migration.originalRel;
  }
  return value;
}

async function assertDirectorySnapshotAtPath(absolute, expected, reason) {
  const actual = await snapshotDirectoryTreeAtPath(absolute);
  if (actual.manifestSha256 !== expected.manifestSha256) throw new Error(reason);
}

async function assertExactDirectorySnapshot(root, relative, expected, reason) {
  const exact = await findExactProjectPath(root, relative);
  if (!exact) throw new Error(reason);
  await assertDirectorySnapshotAtPath(exact, expected, reason);
}

async function assertExactProjectDirectoryAbsent(root, relative, reason) {
  if (await findExactProjectPath(root, relative)) throw noClobberConflict(reason);
}

async function findExactProjectPath(root, relative) {
  if (!isSafeProjectRelative(relative)) throw new Error("archive migration path is unsafe");
  let current = root;
  for (const segment of relative.split("/")) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch (error) {
      if (error?.code === "ENOENT") return null;
      throw error;
    }
    const match = entries.find((entry) => entry.name === segment);
    if (!match) return null;
    current = path.join(current, match.name);
  }
  return current;
}

async function pathExists(filePath) {
  try {
    await lstat(filePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function validateTransactionRoot(root, plan, { createMissingRoot = true } = {}) {
  let rootStats;
  try {
    rootStats = await lstat(root);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    if (path.parse(path.resolve(root)).root === path.resolve(root)) throw new Error("selected root cannot be a filesystem root");
    const parent = await nearestExistingParent(path.dirname(root));
    if (!samePath(parent.lexical, parent.real)) throw new Error("selected root resolves through a symbolic link or junction; use the resolved project root");
    if (!createMissingRoot) {
      for (const item of plan) {
        if (item.action !== "create" && item.action !== "merge" && item.action !== "preserve") continue;
        const relative = path.relative(path.resolve(root), path.resolve(item.targetAbs));
        if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error(`target escapes selected root: ${item.targetRel}`);
      }
      return;
    }
    await mkdir(root, { recursive: true });
    rootStats = await lstat(root);
    if (!isInside(parent.real, await realpath(root))) throw new Error("created root escaped its verified parent");
  }
  if (rootStats.isSymbolicLink()) throw new Error("selected root is a symbolic link or junction; use the resolved project root");
  const realRoot = await realpath(root);
  for (const item of plan) {
    if (item.action !== "create" && item.action !== "merge" && item.action !== "preserve") continue;
    const relative = path.relative(root, item.targetAbs);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error(`target escapes selected root: ${item.targetRel}`);
    const parent = await nearestExistingRealParent(path.dirname(item.targetAbs));
    if (!isInside(realRoot, parent)) throw new Error(`target parent resolves outside selected root: ${item.targetRel}`);
    try {
      if ((await lstat(item.targetAbs)).isSymbolicLink()) throw new Error(`target is a symbolic link or junction: ${item.targetRel}`);
      const buffer = await readFile(item.targetAbs);
      decodeUtf8(buffer, item.targetRel);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
}

async function validateTransactionOverlay(root, outputs) {
  const preservedRuntimeTargets = new Set(outputs
    .filter((item) => item.preservedRuntimeItem?.disposition === "preserve")
    .map((item) => item.targetRel));
  const outputMap = new Map(outputs
    .filter((item) => !item.formalUserRuleContent)
    .map((item) => [item.targetRel, decodeUtf8(item.after, item.targetRel).text]));
  const finalText = async (relative) => outputMap.get(relative) ?? await readOptionalText(path.join(root, relative));
  const failures = [];
  for (const target of requiredTargets) if ((await finalText(target)) == null) failures.push(`${target}: missing after transaction`);
  for (const rule of requiredAnchors) {
    if (preservedRuntimeTargets.has(rule.target)) continue;
    const text = await finalText(rule.target);
    if (text == null) continue;
    for (const failure of requiredAnchorFailures(rule, text)) failures.push(`${rule.target}: ${failure.kind} ${failure.snippet}`);
  }
  for (const rule of schemaChecks) {
    if (preservedRuntimeTargets.has(rule.target)) continue;
    const text = await finalText(rule.target);
    if (text == null) continue;
    for (const check of rule.checks) if (!check.test(text)) failures.push(`${rule.target}: ${check.label}`);
  }

  const handoffText = await finalText("dev/SESSION_HANDOFF.md");
  const promptText = await finalText("START_NEXT_SESSION_PROMPT.txt");
  if (handoffText && promptText) {
    const otherTexts = [];
    for (const target of requiredTargets) {
      if (target === "dev/SESSION_HANDOFF.md" || target === "START_NEXT_SESSION_PROMPT.txt") continue;
      const text = await finalText(target);
      if (text) otherTexts.push({ relative: target, text });
    }
    const mirror = assessPromptMirrorTexts(handoffText, promptText, otherTexts);
    if (!mirror.ok) failures.push(`prompt mirror: ${mirror.reason}`);
  }
  const bridgeFailures = await validateBridgeTexts(finalText);
  failures.push(...bridgeFailures);
  if (failures.length > 0) throw new Error(`migration acceptance gate failed: ${failures.slice(0, 12).join("; ")}${failures.length > 12 ? `; +${failures.length - 12} more` : ""}`);
}

async function validateBridgeTexts(finalText) {
  const failures = [];
  for (const target of ["CLAUDE.md", "GEMINI.md"]) {
    const failure = bridgeTextFailure(target, await finalText(target) ?? "");
    if (failure) failures.push(`${target}: ${failure}`);
  }
  return failures;
}

function bridgeTextFailure(targetRel, text) {
  const active = stripMarkdownCommentsAndFences(text);
  if (targetRel === "CLAUDE.md") {
    const imports = active.split(/\r?\n/).filter((line) => line.trim() === "@AGENTS.md");
    return imports.length === 1 ? null : `expected one active @AGENTS.md import, found ${imports.length}`;
  }
  if (targetRel === "GEMINI.md") {
    return /^Authoritative operating rules remain in `AGENTS\.md`\.\s*$/m.test(active)
      && /^2\. Read `AGENTS\.md`\.\s*$/m.test(active)
      ? null
      : "active AGENTS.md bridge instructions missing or misplaced";
  }
  return "unknown bridge target";
}

async function atomicReplaceFromBuffer(root, targetAbs, buffer, id, expectedHash, options = {}) {
  const targetRel = options.targetRel ?? path.relative(root, targetAbs);
  const phase = options.phase ?? "forward";
  const escrowDir = options.escrowDir;
  if (!targetRel || targetRel.startsWith("..") || path.isAbsolute(targetRel)) throw new Error("atomic target escaped root");
  if (!escrowDir) throw new Error("no-clobber escrow directory is required");
  if (buffer !== null && !Buffer.isBuffer(buffer)) throw new Error("atomic replacement buffer is invalid");

  const rootReal = await realpath(root);
  const escrowRoot = path.resolve(escrowDir, phase);
  if (!isInside(root, escrowRoot)) throw new Error("no-clobber escrow escaped root");
  await mkdir(escrowRoot, { recursive: true });
  const escrowRootReal = await realpath(escrowRoot);
  if (!isInside(rootReal, escrowRootReal)) throw new Error("no-clobber escrow resolves outside selected root");

  // Every target replacement is a no-clobber sequence.  A hard-link escrow
  // first retains the precise inode that was read.  The current name is then
  // removed only after that escrow still has the expected hash, and the new
  // name is created with link(), which fails instead of overwriting a writer
  // that appears in the final window.  Escrows are retained as transaction
  // witnesses; they are never silently cleaned after a concurrent change.
  await assertTransactionTargetSafeAndCurrent(root, targetAbs, expectedHash);
  await mkdir(path.dirname(targetAbs), { recursive: true });
  await assertTransactionTargetSafeAndCurrent(root, targetAbs, expectedHash);

  const tempPath = buffer === null ? null : path.join(path.dirname(targetAbs), `.${path.basename(targetAbs)}.ack-${id}.tmp`);
  const replacementHash = buffer === null ? null : sha256(buffer);
  if (tempPath) await writeFile(tempPath, buffer, { mode: 0o600, flag: "wx" });
  await assertTransactionTargetSafeAndCurrent(root, targetAbs, expectedHash);

  let escrowPath = null;
  if (expectedHash !== null) {
    escrowPath = path.resolve(escrowRoot, targetRel);
    if (!isInside(escrowRoot, escrowPath)) throw new Error("no-clobber escrow target escaped root");
    await mkdir(path.dirname(escrowPath), { recursive: true });
    const escrowParent = await nearestExistingRealParent(path.dirname(escrowPath));
    if (!isInside(rootReal, escrowParent)) throw new Error("no-clobber escrow parent resolves outside selected root");
    if (await lstat(escrowPath).catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error))) {
      throw noClobberConflict(`${targetRel}: no-clobber escrow already exists; recovery lock retained`);
    }
    try {
      await link(targetAbs, escrowPath);
    } catch (error) {
      throw noClobberConflict(`${targetRel}: could not preserve current target before replacement; recovery lock retained`, error);
    }
    const escrowBeforeReplace = await readOptionalBuffer(escrowPath);
    if (!escrowBeforeReplace || sha256(escrowBeforeReplace) !== expectedHash) {
      throw noClobberConflict(`${targetRel}: target changed before no-clobber replacement; recovery lock retained`);
    }
    try {
      await unlink(targetAbs);
    } catch (error) {
      throw noClobberConflict(`${targetRel}: could not detach expected target; recovery lock retained`, error);
    }
  }

  await injectNoClobberRace(targetAbs, targetRel, phase);
  if (buffer === null) {
    if (await readOptionalBuffer(targetAbs)) {
      throw noClobberConflict(`${targetRel}: target appeared during no-clobber removal; recovery lock retained`);
    }
  } else {
    try {
      await link(tempPath, targetAbs);
    } catch (error) {
      throw noClobberConflict(`${targetRel}: target appeared during final no-clobber replacement; recovery lock retained`, error);
    }
    const published = await readOptionalBuffer(targetAbs);
    if (!published || sha256(published) !== replacementHash) {
      throw noClobberConflict(`${targetRel}: final replacement did not retain candidate bytes; recovery lock retained`);
    }
    await unlink(tempPath).catch((error) => {
      if (error?.code !== "ENOENT") throw error;
    });
  }

  if (escrowPath) {
    const escrowAfterReplace = await readOptionalBuffer(escrowPath);
    if (!escrowAfterReplace || sha256(escrowAfterReplace) !== expectedHash) {
      throw noClobberConflict(`${targetRel}: concurrent bytes changed the preserved pre-replacement inode; recovery lock retained`);
    }
  }
}

async function injectNoClobberRace(targetAbs, targetRel, phase) {
  if (process.env.AGENT_HANDOFF_KIT_QA_MUTATE_TARGET_AFTER_FINAL_VALIDATION !== targetRel) return;
  if (process.env.AGENT_HANDOFF_KIT_QA_MUTATE_TARGET_AFTER_FINAL_VALIDATION_PHASE !== phase) return;
  const encoded = process.env.AGENT_HANDOFF_KIT_QA_MUTATE_TARGET_AFTER_FINAL_VALIDATION_BASE64;
  if (!encoded) throw new Error("QA final-window target race payload is missing");
  try {
    await writeFile(targetAbs, Buffer.from(encoded, "base64"), { mode: 0o600, flag: "wx" });
  } catch (error) {
    throw noClobberConflict(`${targetRel}: QA final-window writer could not create its competing target`, error);
  }
}

async function injectTransactionWindowDrift(root, journal) {
  const targetRel = process.env.AGENT_HANDOFF_KIT_QA_MUTATE_AFTER_TRANSACTION_PREPARE;
  if (!targetRel) return;
  const encoded = process.env.AGENT_HANDOFF_KIT_QA_MUTATE_AFTER_TRANSACTION_PREPARE_BASE64;
  if (!encoded) throw new Error("QA transaction-window drift payload is missing");
  if (!journal.entries.some((entry) => entry.targetRel === targetRel)) {
    throw new Error(`QA transaction-window target is not part of this transaction: ${targetRel}`);
  }
  const targetAbs = path.resolve(root, targetRel);
  if (!isInside(root, targetAbs)) throw new Error("QA transaction-window target escaped root");
  await writeFile(targetAbs, Buffer.from(encoded, "base64"), { mode: 0o600 });
}

function noClobberConflict(message, cause = null) {
  const error = new Error(message);
  error.code = "ACK_NO_CLOBBER_CONFLICT";
  if (cause) error.cause = cause;
  return error;
}

function isNoClobberConflict(error) {
  return error?.code === "ACK_NO_CLOBBER_CONFLICT";
}

async function assertTransactionTargetSafeAndCurrent(root, targetAbs, expectedHash) {
  const relative = path.relative(root, targetAbs);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("atomic target escaped root");
  const rootReal = await realpath(root);
  const parentReal = await nearestExistingRealParent(path.dirname(targetAbs));
  if (!isInside(rootReal, parentReal)) throw new Error("atomic target parent resolves outside selected root");
  try {
    const targetStats = await lstat(targetAbs);
    if (targetStats.isSymbolicLink()) throw new Error("atomic target is a symbolic link or junction");
    if (!targetStats.isFile()) throw new Error("atomic target is not a regular file");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const current = await readOptionalBuffer(targetAbs);
  const currentHash = current ? sha256(current) : null;
  if (currentHash !== expectedHash) {
    throw new Error(`${relative}: target changed after transaction preparation; no overwrite attempted`);
  }
}

async function validateRecoveryJournal(root, journal, journalPath, lockId = null) {
  const migrationsRoot = path.resolve(root, "dev", "governance_migrations");
  const migrationDir = path.dirname(journalPath);
  if (path.basename(journalPath) !== "transaction.json" || !samePath(path.dirname(migrationDir), migrationsRoot)) {
    throw new Error("upgrade journal is not in one direct transaction directory; no recovery writes attempted");
  }
  if (!journal || typeof journal !== "object" || Array.isArray(journal)) throw new Error("upgrade journal schema is invalid; no recovery writes attempted");
  if (typeof journal.id !== "string" || journal.id !== path.basename(migrationDir) || (lockId && journal.id !== lockId)) {
    throw new Error("upgrade journal identity does not match its lock and directory; no recovery writes attempted");
  }
  if (!Array.isArray(journal.entries) || journal.entries.length === 0) throw new Error("upgrade journal has no valid entries; no recovery writes attempted");
  if (!isStableSemver(journal.attemptedVersion ?? "")) throw new Error("upgrade journal attempted version is invalid; no recovery writes attempted");
  const allowedStates = new Set(["prepared", "committing", "rollback-needed", "manual-recovery-required", "committed", "rolled-back"]);
  if (!allowedStates.has(journal.state)) throw new Error("upgrade journal state is invalid; no recovery writes attempted");

  const seen = new Set();
  const formalWitness = validateFormalUserRulesWitness(journal.formalUserRules);
  if (!["init", "upgrade"].includes(journal.command)) {
    throw new Error("upgrade journal command is not recoverable by this runtime; no recovery writes attempted");
  }
  const hasArchiveMigrationField = journal.archiveMigrations !== undefined;
  const requiresArchiveBackup = journal.command === "upgrade" && hasArchiveMigrationField;
  if (journal.archiveMigrations != null && !Array.isArray(journal.archiveMigrations)) throw new Error("upgrade journal archive migrations are invalid; no recovery writes attempted");
  const archiveMigrations = (journal.archiveMigrations ?? []).length > 0
    ? validateArchiveMigrations(journal.archiveMigrations, { requireMaterialized: journal.state === "committed" })
    : [];
  if (requiresArchiveBackup && archiveMigrations.some((migration) => !migration.stageRel || migration.state === undefined)) {
    throw new Error("upgrade journal archive migration recovery fields are missing; no recovery writes attempted");
  }
  const rootStats = await lstat(root);
  if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) throw new Error("selected recovery root is not a safe directory; no recovery writes attempted");
  const rootReal = await realpath(root);
  const backupRoot = path.join(migrationDir, "backup");
  const stageRoot = path.join(migrationDir, "stage");
  const archiveBackupRoot = path.join(migrationDir, "archive-backup");
  const migrationsStats = await lstat(migrationsRoot).catch(() => null);
  const migrationStats = await lstat(migrationDir).catch(() => null);
  const journalStats = await lstat(journalPath).catch(() => null);
  const backupStats = await lstat(backupRoot).catch(() => null);
  const stageStats = await lstat(stageRoot).catch(() => null);
  const archiveBackupStats = requiresArchiveBackup ? await lstat(archiveBackupRoot).catch(() => null) : null;
  if (!migrationsStats?.isDirectory() || migrationsStats.isSymbolicLink()
    || !migrationStats?.isDirectory() || migrationStats.isSymbolicLink()
    || !journalStats?.isFile() || journalStats.isSymbolicLink()
    || !backupStats?.isDirectory() || backupStats.isSymbolicLink()
    || !stageStats?.isDirectory() || stageStats.isSymbolicLink()
    || (requiresArchiveBackup && (!archiveBackupStats?.isDirectory() || archiveBackupStats.isSymbolicLink()))) {
    throw new Error("upgrade transaction directories or journal are missing or unsafe; no recovery writes attempted");
  }
  const migrationsReal = await realpath(migrationsRoot);
  const migrationReal = await realpath(migrationDir);
  const journalReal = await realpath(journalPath);
  const backupRealRoot = await realpath(backupRoot);
  const stageRealRoot = await realpath(stageRoot);
  const archiveBackupRealRoot = requiresArchiveBackup ? await realpath(archiveBackupRoot) : null;
  if (!isInside(rootReal, migrationsReal) || !isInside(migrationsReal, migrationReal)
    || !isInside(migrationReal, journalReal)
    || !isInside(migrationReal, backupRealRoot) || !isInside(migrationReal, stageRealRoot)
    || !samePath(path.dirname(migrationReal), migrationsReal)
    || !samePath(path.dirname(backupRealRoot), migrationReal) || !samePath(path.dirname(stageRealRoot), migrationReal)
    || (requiresArchiveBackup && !samePath(path.dirname(archiveBackupRealRoot), migrationReal))) {
    throw new Error("upgrade transaction paths resolve outside the selected root or transaction; no recovery writes attempted");
  }
  const validated = [];
  const validHash = (value) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
  for (const entry of journal.entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new Error("upgrade journal entry schema is invalid; no recovery writes attempted");
    const allowedTarget = requiredTargets.includes(entry.targetRel)
      || upgradeStateTargets.includes(entry.targetRel)
      || formalWitness?.contentPaths.has(entry.targetRel);
    if (!allowedTarget || seen.has(entry.targetRel)) throw new Error("upgrade journal target is unknown or duplicated; no recovery writes attempted");
    seen.add(entry.targetRel);
    if (typeof entry.existed !== "boolean" || typeof entry.committed !== "boolean" || !validHash(entry.afterHash)) {
      throw new Error("upgrade journal entry flags or candidate hash are invalid; no recovery writes attempted");
    }
    if (entry.existed ? !validHash(entry.beforeHash) : entry.beforeHash !== null) {
      throw new Error("upgrade journal input hash is invalid; no recovery writes attempted");
    }

    const targetAbs = path.resolve(root, entry.targetRel);
    if (!isInside(root, targetAbs)) throw new Error("upgrade journal target escapes selected root; no recovery writes attempted");
    const targetParent = await nearestExistingRealParent(path.dirname(targetAbs));
    if (!isInside(rootReal, targetParent)) throw new Error("upgrade journal target parent escapes selected root; no recovery writes attempted");
    try {
      if ((await lstat(targetAbs)).isSymbolicLink()) throw new Error("upgrade journal target is a symbolic link; no recovery writes attempted");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }

    const stageAbs = path.resolve(stageRoot, entry.targetRel);
    const stageStats = await lstat(stageAbs).catch(() => null);
    if (!stageStats?.isFile() || stageStats.isSymbolicLink()) throw new Error("upgrade journal stage is missing or unsafe; no recovery writes attempted");
    const stageReal = await realpath(stageAbs);
    if (!isInside(stageRealRoot, stageReal)) throw new Error("upgrade journal stage resolves outside this transaction; no recovery writes attempted");
    if (sha256(await readFile(stageAbs)) !== entry.afterHash) throw new Error("upgrade journal stage hash does not match the recorded candidate; no recovery writes attempted");

    let backup = null;
    if (entry.existed) {
      if (typeof entry.backupRel !== "string" || !entry.backupRel) throw new Error("upgrade journal backup path is missing; no recovery writes attempted");
      const backupAbs = path.resolve(root, entry.backupRel);
      const expectedBackup = path.resolve(backupRoot, entry.targetRel);
      if (!samePath(backupAbs, expectedBackup) || !isInside(backupRoot, backupAbs)) throw new Error("upgrade journal backup path is outside this transaction; no recovery writes attempted");
      const backupFileStats = await lstat(backupAbs).catch(() => null);
      if (!backupFileStats?.isFile() || backupFileStats.isSymbolicLink()) throw new Error("upgrade journal backup is missing or unsafe; no recovery writes attempted");
      const backupReal = await realpath(backupAbs);
      if (!isInside(backupRealRoot, backupReal)) throw new Error("upgrade journal backup resolves outside this transaction; no recovery writes attempted");
      backup = await readFile(backupAbs);
      if (sha256(backup) !== entry.beforeHash) throw new Error("upgrade journal backup hash does not match the recorded input; no recovery writes attempted");
    } else if (entry.backupRel !== null) {
      throw new Error("upgrade journal has an unexpected backup for a created target; no recovery writes attempted");
    }
    validated.push({ entry, targetAbs, backup });
  }
  if (journal.state === "committed" && validated.some(({ entry }) => !entry.committed)) {
    throw new Error("committed upgrade journal contains an uncommitted entry; no recovery writes attempted");
  }
  if (requiresArchiveBackup) {
    for (const migration of archiveMigrations) {
      const stageAbs = path.resolve(migrationDir, migration.stageRel);
      if (!isInside(archiveBackupRoot, stageAbs)) throw new Error("upgrade archive migration backup escapes this transaction; no recovery writes attempted");
      const stageStats = await lstat(stageAbs).catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error));
      if (stageStats) {
        if (!stageStats.isDirectory() || stageStats.isSymbolicLink()) throw new Error("upgrade archive migration backup is unsafe; no recovery writes attempted");
        const stageReal = await realpath(stageAbs);
        if (!isInside(archiveBackupRealRoot, stageReal)) throw new Error("upgrade archive migration backup resolves outside this transaction; no recovery writes attempted");
        await assertDirectorySnapshotAtPath(stageAbs, migration.snapshot, "upgrade archive migration backup hash does not match the recorded input; no recovery writes attempted");
      }
    }
  }
  return validated;
}

async function rollbackTransaction(root, journal, journalPath, lockId = null) {
  const validated = await validateRecoveryJournal(root, journal, journalPath, lockId);
  const conflicts = [];
  const operations = [];
  const archiveRollbackPlans = [];
  // Do not trust the committed flag: the process can stop after replacement
  // but before the journal flag is persisted. Inspect every target hash first.
  for (const item of [...validated].reverse()) {
    const current = await readOptionalBuffer(item.targetAbs);
    const currentHash = current ? sha256(current) : null;
    if (currentHash === item.entry.beforeHash) continue;
    if (currentHash !== item.entry.afterHash) {
      conflicts.push(`${item.entry.targetRel}: current content differs from both transaction input and candidate`);
      continue;
    }
    operations.push(item);
  }
  for (const migration of [...(journal.archiveMigrations ?? [])].reverse()) {
    try {
      archiveRollbackPlans.push(await planArchiveRollback(root, path.dirname(journalPath), migration));
    } catch (error) {
      conflicts.push(safeErrorLabel(error));
    }
  }
  if (conflicts.length > 0) {
    journal.state = "manual-recovery-required";
    journal.committedVersion = null;
    journal.recoveryConflicts = conflicts;
    await writeSecureJson(journalPath, journal);
    return { ok: false, conflicts };
  }

  const rollbackEscrowDir = path.join(path.dirname(journalPath), "no-clobber-escrow");
  for (const { entry, targetAbs, backup } of operations) {
    try {
      await atomicReplaceFromBuffer(root, targetAbs, entry.existed ? backup : null, `${journal.id}-rollback`, entry.afterHash, {
        targetRel: entry.targetRel,
        escrowDir: rollbackEscrowDir,
        phase: "rollback"
      });
    } catch (error) {
      if (!isNoClobberConflict(error)) throw error;
      conflicts.push(safeErrorLabel(error));
      journal.state = "manual-recovery-required";
      journal.committedVersion = null;
      journal.recoveryConflicts = conflicts;
      await writeSecureJson(journalPath, journal);
      return { ok: false, conflicts };
    }
    const restored = await readOptionalBuffer(targetAbs);
    const restoredHash = restored ? sha256(restored) : null;
    if (restoredHash !== entry.beforeHash) throw new Error(`${entry.targetRel}: rollback verification failed; recovery lock retained`);
  }
  for (const plan of archiveRollbackPlans) {
    try {
      await executeArchiveRollback(root, journal, plan, rollbackEscrowDir);
    } catch (error) {
      if (!isNoClobberConflict(error)) throw error;
      conflicts.push(safeErrorLabel(error));
      journal.state = "manual-recovery-required";
      journal.committedVersion = null;
      journal.recoveryConflicts = conflicts;
      await writeSecureJson(journalPath, journal);
      return { ok: false, conflicts };
    }
  }
  journal.state = "rolled-back";
  journal.committedVersion = null;
  journal.rollbackAt = new Date().toISOString();
  journal.recoveryConflicts = [];
  await writeSecureJson(journalPath, journal);
  return { ok: true, conflicts: [] };
}

async function planArchiveRollback(root, migrationDir, migration) {
  const original = await findExactProjectPath(root, migration.originalRel);
  const canonical = await findExactProjectPath(root, migration.canonicalRel);
  const stage = path.join(migrationDir, migration.stageRel);
  const stageExists = await pathExists(stage);
  if (original) {
    await assertDirectorySnapshotAtPath(original, migration.snapshot, `${migration.originalRel}: original archive has concurrent bytes; recovery lock retained`);
    if (canonical) throw noClobberConflict(`${migration.canonicalRel}: both archive paths exist during rollback; recovery lock retained`);
    if (stageExists) throw noClobberConflict(`${migration.originalRel}: both original and backup archive paths exist during rollback; recovery lock retained`);
    return { migration, original, canonical: null, stage: null, restore: false };
  }
  if (!stageExists) throw noClobberConflict(`${migration.originalRel}: transaction archive backup is missing; recovery lock retained`);
  await assertDirectorySnapshotAtPath(stage, migration.snapshot, `${migration.originalRel}: transaction archive backup has concurrent bytes; recovery lock retained`);
  if (canonical) await assertDirectorySnapshotSubsetAtPath(canonical, migration.snapshot, `${migration.canonicalRel}: canonical archive has concurrent bytes; recovery lock retained`);
  return { migration, original: null, canonical, stage, restore: true };
}

async function executeArchiveRollback(root, journal, plan, rollbackEscrowDir) {
  if (!plan.restore) return;
  if (plan.canonical) {
    await removeArchiveSubsetNoClobber(root, plan.migration, plan.canonical, rollbackEscrowDir, journal.id);
    await assertExactProjectDirectoryAbsent(root, plan.migration.canonicalRel, `${plan.migration.canonicalRel}: canonical archive remains after rollback cleanup`);
  }
  await assertExactProjectDirectoryAbsent(root, plan.migration.originalRel, `${plan.migration.originalRel}: original archive appeared during rollback; recovery lock retained`);
  await rename(plan.stage, path.join(root, plan.migration.originalRel));
  await assertExactDirectorySnapshot(root, plan.migration.originalRel, plan.migration.snapshot, `${plan.migration.originalRel}: rollback did not restore original archive bytes`);
}

async function assertDirectorySnapshotSubsetAtPath(absolute, expected, reason) {
  const actual = await snapshotDirectoryTreeAtPath(absolute);
  const expectedFiles = new Map(expected.files.map((file) => [file.path, file]));
  const expectedDirectories = new Set(expected.directories);
  if (actual.directories.some((directory) => !expectedDirectories.has(directory))
    || actual.files.some((file) => {
      const source = expectedFiles.get(file.path);
      return !source || source.bytes !== file.bytes || source.sha256 !== file.sha256;
    })) {
    throw noClobberConflict(reason);
  }
}

async function removeArchiveSubsetNoClobber(root, migration, canonicalAbs, escrowDir, id) {
  const actual = await snapshotDirectoryTreeAtPath(canonicalAbs);
  const expectedFiles = new Map(migration.snapshot.files.map((file) => [file.path, file]));
  for (const file of [...actual.files].reverse()) {
    const expected = expectedFiles.get(file.path);
    if (!expected || expected.sha256 !== file.sha256 || expected.bytes !== file.bytes) {
      throw noClobberConflict(`${migration.canonicalRel}/${file.path}: canonical archive has concurrent bytes; recovery lock retained`);
    }
    await atomicReplaceFromBuffer(root, path.join(canonicalAbs, file.path), null, `${id}-archive-rollback`, file.sha256, {
      targetRel: `${migration.canonicalRel}/${file.path}`,
      escrowDir,
      phase: "archive-rollback"
    });
  }
  for (const directory of [...actual.directories].sort((left, right) => right.localeCompare(left))) {
    const target = directory ? path.join(canonicalAbs, directory) : canonicalAbs;
    try {
      await rmdir(target);
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      if (error?.code === "ENOTEMPTY" || error?.code === "EEXIST") {
        throw noClobberConflict(`${migration.canonicalRel}${directory ? `/${directory}` : ""}: archive directory changed during rollback; recovery lock retained`, error);
      }
      throw error;
    }
  }
}

function assertRecoveryCommandSupported(lock, journal) {
  if (!["init", "upgrade"].includes(lock.command) || !["init", "upgrade"].includes(journal.command)) {
    throw new Error("active transaction command is not supported by this runtime; no automatic recovery attempted");
  }
}

async function recoverInterruptedTransaction(root, options = {}) {
  const lockPath = path.join(root, "dev", "governance_migrations", ".upgrade.lock");
  let lock;
  try {
    lock = JSON.parse(await readFile(lockPath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw new Error("upgrade lock exists but is unreadable or malformed; no writes attempted");
  }
  if (!lock || typeof lock !== "object" || Array.isArray(lock) || typeof lock.id !== "string" || typeof lock.journal !== "string"
    || typeof lock.host !== "string" || !Number.isInteger(lock.pid) || lock.pid <= 0) {
    throw new Error("upgrade lock schema is invalid; no automatic recovery attempted");
  }
  if (lock.host === hostname() && processIsAlive(lock.pid)) throw new Error(`another upgrade process is active (pid ${lock.pid})`);
  if (lock.host && lock.host !== hostname()) throw new Error(`upgrade lock belongs to another host (${lock.host}); no automatic recovery attempted`);
  const journalPath = path.resolve(root, lock.journal ?? "");
  if (!isInside(root, journalPath)) throw new Error("upgrade lock journal path escapes selected root");
  let journal;
  try {
    journal = JSON.parse(await readFile(journalPath, "utf8"));
  } catch {
    throw new Error("incomplete upgrade lock has no readable journal; no automatic recovery attempted");
  }
  assertRecoveryCommandSupported(lock, journal);
  await validateRecoveryJournal(root, journal, journalPath, lock.id);
  if (journal.state === "committed") {
    if (!journal.committedVersion) journal.committedVersion = journal.attemptedVersion;
    let formalRuntimeState = null;
    const doctorStatus = await runDoctor(root, journal.committedVersion, {
      silentCard: true,
      context: "recovered-committed-transaction-health",
      skipVersionRegistryLookup: true,
      allowActiveTransaction: true,
      captureFormalUserRules: (state) => { formalRuntimeState = state; }
    });
    if (doctorStatus !== "passed") throw new Error("committed upgrade recovery failed fresh doctor readback; recovery lock retained");
    if (journal.formalUserRules) {
      if (!formalRuntimeState) throw new Error("committed upgrade recovery has no formal doctor readback; recovery lock retained");
      journal.runtimeReadback = formalUserRulesReadbackFromDoctorState(formalRuntimeState, journal.formalUserRules);
    }
    const migrationDir = path.dirname(journalPath);
    await writeSecureJson(journalPath, journal);
    await writeTransactionReport({ id: journal.id, migrationDir, journal });
    await unlinkIfExists(lockPath);
    console.log("⚠️ recovered committed upgrade: migration report was verified or rebuilt before planning this run");
    return;
  }
  if (journal.state === "rolled-back") {
    await unlinkIfExists(lockPath);
    return;
  }
  const rollback = await rollbackTransaction(root, journal, journalPath, lock.id);
  if (!rollback.ok) throw new Error(`interrupted upgrade has third-state edits: ${rollback.conflicts.join("; ")}`);
  await unlinkIfExists(lockPath);
  console.log("⚠️ recovered interrupted upgrade: transaction-owned changes were safely rolled back before planning this run");
}

async function writeTransactionReport(transaction) {
  const reportPath = path.join(transaction.migrationDir, "migration-report.md");
  const lines = [
    "# Agent Handoff Kit Migration Report",
    "",
    `- Transaction: ${transaction.id}`,
    `- Mode: ${transaction.journal.mode ?? "unknown"}`,
    `- Attempted version: ${transaction.journal.attemptedVersion}`,
    `- Committed version: ${transaction.journal.committedVersion ?? "none"}`,
    `- Transaction state: ${transaction.journal.state}`,
    `- Created at: ${transaction.journal.createdAt}`,
    `- Committed at: ${transaction.journal.committedAt}`,
    "- Credential values: not recorded",
    "",
    "## Actions",
    "",
    ...transaction.journal.entries.map((entry) => `- ${entry.existed ? "merge" : "create"}: ${entry.targetRel}${entry.reason ? ` - ${entry.reason}` : ""}; backup=${entry.backupRel ?? "none"}; committed=${entry.committed}`),
    "",
    `- Planned skips: ${transaction.journal.plannedSkips ?? "unknown"}`,
    "- Conflicts: 0",
    "",
    "## Formal User Rules Acceptance",
    ...renderFormalUserRulesReport(transaction.journal.formalUserRules, transaction.journal.runtimeReadback),
    "",
    "## Historical Authority",
    "- Completed transaction journals are operation receipts only after their lock is cleared.",
    "- Future doctor and upgrade runs validate current contracts rather than this receipt."
  ];
  await writeFile(reportPath, `${lines.join("\n")}\n`, { mode: 0o600 });
  await tightenPermissions(reportPath, 0o600);
  return reportPath;
}

function decodeUtf8(buffer, relative) {
  const bom = buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
  const body = bom ? buffer.subarray(3) : buffer;
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch {
    throw new Error(`${relative}: invalid UTF-8; conflict required`);
  }
  const crlfCount = (text.match(/\r\n/g) ?? []).length;
  const loneLfCount = (text.match(/(^|[^\r])\n/g) ?? []).length;
  return {
    text,
    bom,
    newline: crlfCount > loneLfCount ? "\r\n" : "\n",
    mixed: crlfCount > 0 && loneLfCount > 0
  };
}

function encodeLikeExisting(text, before, relative) {
  if (!before) return Buffer.from(text.replace(/\r\n?/g, "\n"), "utf8");
  const style = decodeUtf8(before, relative);
  const normalized = text.replace(/\r\n?/g, "\n").replace(/\n/g, style.newline);
  return style.bom ? Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(normalized, "utf8")]) : Buffer.from(normalized, "utf8");
}

function detectCredentialValues(items) {
  const findings = [];
  for (const item of items) {
    for (const { pattern, label } of credentialLeakPatterns) {
      const match = item.text.match(pattern);
      if (match) findings.push({ relative: item.relative, line: item.text.slice(0, match.index).split("\n").length, label });
    }
  }
  return findings;
}

async function nearestExistingRealParent(start) {
  let current = path.resolve(start);
  while (true) {
    try { return await realpath(current); } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      const parent = path.dirname(current);
      if (parent === current) throw error;
      current = parent;
    }
  }
}

async function nearestExistingParent(start) {
  let current = path.resolve(start);
  while (true) {
    try { return { lexical: current, real: await realpath(current) }; } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      const parent = path.dirname(current);
      if (parent === current) throw error;
      current = parent;
    }
  }
}

function samePath(left, right) {
  const normalize = (value) => process.platform === "win32" ? path.resolve(value).toLowerCase() : path.resolve(value);
  return normalize(left) === normalize(right);
}

function isInside(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function readOptionalBuffer(filePath) {
  try { return await readFile(filePath); } catch (error) { if (error?.code === "ENOENT") return null; throw error; }
}

async function readOptionalText(filePath) {
  const buffer = await readOptionalBuffer(filePath);
  return buffer ? decodeUtf8(buffer, filePath).text : null;
}

async function checkSessionLogArchiveCasing(root) {
  const devDir = path.join(root, "dev");
  let entries;
  try {
    entries = await readdir(devDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return { ok: true, finding: null };
    throw error;
  }
  const matches = entries
    .filter((entry) => entry.isDirectory() && entry.name.toLowerCase() === "session_log_archive")
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
  if (matches.length === 0) return { ok: true, finding: null };
  if (matches.length === 1 && matches[0] === "SESSION_LOG_archive") return { ok: true, finding: null };
  if (matches.includes("SESSION_LOG_archive")) {
    return { ok: false, finding: `mixed archive casing detected: ${matches.map((name) => `dev/${name}`).join(", ")}` };
  }
  return { ok: false, finding: `legacy archive casing detected: dev/${matches[0]}; use dev/SESSION_LOG_archive` };
}

async function writeSecureJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await tightenPermissions(filePath, 0o600);
}

async function tightenPermissions(filePath, mode) {
  try { await chmod(filePath, mode); } catch { /* best effort on platforms without POSIX modes */ }
}

async function unlinkIfExists(filePath) {
  try { await unlink(filePath); } catch (error) { if (error?.code !== "ENOENT") throw error; }
}

async function publishTransactionLock(root, lockPath, lockRecord) {
  const lockDir = path.dirname(lockPath);
  const tempPath = path.join(lockDir, `.upgrade.lock.${lockRecord.id}.${process.pid}.${randomUUID()}.tmp`);
  await writeSecureJson(tempPath, lockRecord);
  try {
    await link(tempPath, lockPath);
  } catch (error) {
    await unlinkIfExists(tempPath).catch(() => {});
    if (error?.code === "EEXIST") throw new Error("another upgrade transaction or unresolved recovery lock is present");
    throw error;
  }
  await unlinkIfExists(tempPath);
}

function processIsAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

async function assertDryRunHasNoPendingTransaction(root) {
  const lockPath = path.join(root, "dev", "governance_migrations", ".upgrade.lock");
  try {
    await lstat(lockPath);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  throw new Error("dry-run blocked: an unresolved transaction requires a non-dry-run recovery; no files written");
}

function stripMarkdownCommentsAndFences(text) {
  return text.replace(/<!--[\s\S]*?-->/g, "").replace(/```[\s\S]*?```/g, "");
}

function safeErrorLabel(error) {
  return String(error?.message ?? error).slice(0, 500);
}

async function runDoctor(root, version, options = {}) {
  if (options.allowActiveTransaction !== true && await hasActiveTransactionLock(root)) {
    throw new Error("current-state recovery is pending; doctor refuses a partial transaction state");
  }
  // Historical committed transaction journals are operation receipts only.
  // Once the lock is gone, doctor validates current contract structure instead
  // of reusing a receipt as permanent workspace byte authority.
  const formalUserRulesWitness = null;
  const acceptedRuntimeTargets = new Set();
  const rows = [];
  for (const target of requiredTargets) {
    rows.push({ target, ok: await exists(path.join(root, target)) });
  }

  const missing = rows.filter((row) => !row.ok);
  console.log(`root: ${root}`);
  console.log(`required files: ${rows.length}`);
  for (const row of rows) {
    console.log(`${row.ok ? "ok" : "missing"}  ${row.target}`);
  }

  if (missing.length > 0) {
    const misplacedRulePacks = await findMisplacedRulePacks(root, missing);
    printMisplacedRulePackWarnings(misplacedRulePacks);
    printDoctorSummary(version, root, "needs-fix", {
      checked: rows.length,
      failedKind: "missing files",
      failedCount: missing.length,
      nextStep: misplacedRulePacks.length > 0
        ? "同名 rules 檔疑似放錯層。先不要刪除或搬移；請執行 upgrade --dry-run，再正式 upgrade 補回 dev/rules/ 內的正確檔案。"
        : missing.length === rows.length
        ? "這個資料夾未安裝 Kit。若這就是你的項目資料夾，請執行：npx --yes @adamchanadam/agent-handoff-kit@latest init"
        : "這個資料夾只裝了一部分 Kit 檔案。請先確認路徑；如路徑正確，執行：npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run"
    });
    process.exitCode = 1;
    return "failed";
  }

  const archiveCasing = await checkSessionLogArchiveCasing(root);
  console.log(`\nSESSION_LOG archive casing checks: 1`);
  console.log(`${archiveCasing.ok ? "ok" : "missing"}  dev/SESSION_LOG_archive canonical path`);
  if (!archiveCasing.ok) {
    console.log(`  missing: ${archiveCasing.finding}`);
    printDoctorSummary(version, root, "needs-fix", {
      checked: rows.length + 1,
      failedKind: "SESSION_LOG archive casing checks",
      failedCount: 1,
      nextStep: "保留內容，先合併到 canonical dev/SESSION_LOG_archive；不要同時保留大小寫兩套路徑。"
    });
    process.exitCode = 1;
    return "failed";
  }

  const historicalReceiptChecks = 0;
  console.log(`\nhistorical transaction receipt authority checks: 0`);
  console.log("not-applicable  committed transaction journals are receipts only when no active lock exists");

  const anchorRows = await checkRequiredAnchors(root);
  const acceptedPreservedAnchorRows = anchorRows.filter((row) => !row.ok && acceptedRuntimeTargets.has(row.target));
  const anchorFailures = anchorRows.filter((row) => !row.ok && !acceptedRuntimeTargets.has(row.target));
  console.log(`\nrequired anchors: ${anchorRows.length}`);
  for (const row of anchorRows) {
    const acceptedPreservation = !row.ok && acceptedRuntimeTargets.has(row.target);
    console.log(`${row.ok ? "ok" : acceptedPreservation ? "preserved" : "missing"}  ${row.target} (${row.label})`);
    if (!row.ok && row.missing && row.missing.length > 0) {
      console.log(`  missing anchor text: ${row.missing.map((snippet) => JSON.stringify(snippet)).join("; ")}`);
    }
  }
  for (const row of acceptedPreservedAnchorRows) {
    console.log(`  accepted preservation: ${row.target} remains runtime-readable only through the same transaction acceptance witness`);
  }

  if (anchorFailures.length > 0) {
    printAnchorRepairGuidance(anchorFailures, options.context);
    printDoctorSummary(version, root, "needs-fix", {
      checked: rows.length + historicalReceiptChecks + anchorRows.length,
      failedKind: "anchor checks",
      failedCount: anchorFailures.length,
      nextStep: anchorRepairNextStep(options.context)
    });
    process.exitCode = 1;
    return "failed";
  }

  const schemaRows = await checkSchema(root);
  const acceptedPreservedSchemaRows = schemaRows.filter((row) => !row.ok && acceptedRuntimeTargets.has(row.target));
  const schemaFailures = schemaRows.filter((row) => !row.ok && !acceptedRuntimeTargets.has(row.target));
  console.log(`\nschema checks: ${schemaRows.length}`);
  for (const row of schemaRows) {
    const acceptedPreservation = !row.ok && acceptedRuntimeTargets.has(row.target);
    console.log(`${row.ok ? "ok" : acceptedPreservation ? "preserved" : "missing"}  ${row.target} (${row.label})`);
    if (!row.ok && row.missing.length > 0) {
      console.log(`  missing: ${row.missing.join("; ")}`);
    }
  }

  if (schemaFailures.length > 0) {
    printDoctorSummary(version, root, "needs-fix", {
      checked: rows.length + historicalReceiptChecks + anchorRows.length + schemaRows.length,
      failedKind: "schema checks",
      failedCount: schemaFailures.length,
      nextStep: "把這段 doctor 輸出貼給 AI，請它先修交接結構，不要直接重裝覆蓋。"
    });
    process.exitCode = 1;
    return "failed";
  }
  for (const row of acceptedPreservedSchemaRows) {
    console.log(`  accepted preservation: ${row.target} remains runtime-readable only through the same transaction acceptance witness`);
  }

  const userRulesResult = await checkFormalUserRules(root, { ...options, expectedFormalUserRules: formalUserRulesWitness });
  console.log(`\nformal user-rules checks: ${userRulesResult.checked}`);
  console.log(`${userRulesResult.ok ? "ok" : "missing"}  AGENTS.md -> ${USER_RULES_ROUTER_PATH} (accepted user-rule bytes and order)`);
  if (!userRulesResult.ok) console.log(`  missing: ${userRulesResult.finding}`);
  if (!userRulesResult.ok) {
    printDoctorSummary(version, root, "needs-fix", {
      checked: rows.length + historicalReceiptChecks + anchorRows.length + schemaRows.length + userRulesResult.checked,
      failedKind: "formal user-rules checks",
      failedCount: 1,
      nextStep: "不要重跑 upgrade 或覆寫用戶規則；先還原或重新以完整接受紀錄登記 dev/USER_RULES.md 及其 user rule bytes。"
    });
    process.exitCode = 1;
    return "failed";
  }

  const bridgeFailures = await validateBridgeTexts(async (relative) => readOptionalText(path.join(root, relative)));
  console.log(`\nbridge checks: 2`);
  console.log(`${bridgeFailures.length === 0 ? "ok" : "missing"}  CLAUDE.md / GEMINI.md (active one-hop AGENTS.md bridges)`);
  for (const finding of bridgeFailures) console.log(`  missing: ${finding}`);
  if (bridgeFailures.length > 0) {
    printDoctorSummary(version, root, "needs-fix", {
      checked: rows.length + historicalReceiptChecks + anchorRows.length + schemaRows.length + userRulesResult.checked + 2,
      failedKind: "bridge checks",
      failedCount: bridgeFailures.length,
      nextStep: "修正 CLAUDE.md / GEMINI.md 的有效橋接指令；註解、程式碼區塊或重複字樣不能代替真實路由。"
    });
    process.exitCode = 1;
    return "failed";
  }

  const researchTraceResult = await checkResearchDecisionTrace(root);
  console.log(`\nresearch decision trace checks: ${researchTraceResult.checked}`);
  console.log(`${researchTraceResult.ok ? "ok" : "missing"}  dev/PROJECT_DECISIONS.md (research-derived decision evidence chains)`);
  if (!researchTraceResult.ok) {
    for (const finding of researchTraceResult.findings) {
      console.log(`  missing: ${finding}`);
    }
    printDoctorSummary(version, root, "needs-fix", {
      checked: rows.length + historicalReceiptChecks + anchorRows.length + schemaRows.length + userRulesResult.checked + researchTraceResult.checked,
      failedKind: "research decision trace checks",
      failedCount: researchTraceResult.findings.length,
      nextStep: "把 research-derived decision 的 Evidence chain 補齊，並確認 Source=source:<id> token 已登記在 dev/PROJECT_INDEX.md 的 Fact Base 或 External Sources。"
    });
    process.exitCode = 1;
    return "failed";
  }

  const temperatureResult = await checkHandoffTemperatureBoundary(root);
  console.log(`\nhandoff temperature boundary checks: ${temperatureResult.checked}`);
  console.log(`${temperatureResult.ok ? "ok" : "missing"}  dev/SESSION_HANDOFF.md / START_NEXT_SESSION_PROMPT.txt (current-state evidence boundary)`);
  if (!temperatureResult.ok) {
    for (const finding of temperatureResult.findings) {
      console.log(`  missing: ${finding}`);
    }
    printDoctorSummary(version, root, "needs-fix", {
      checked: rows.length + historicalReceiptChecks + anchorRows.length + schemaRows.length + userRulesResult.checked + researchTraceResult.checked + temperatureResult.checked,
      failedKind: "handoff temperature boundary checks",
      failedCount: temperatureResult.findings.length,
      nextStep: "把一次性驗收證據、舊版本狀態、source token 或 Evidence chain 從 Durable Anchors / Next Priorities / opening message 移回 SESSION_LOG、PROJECT_INDEX 或 PROJECT_DECISIONS。"
    });
    process.exitCode = 1;
    return "failed";
  }

  const mirrorRows = await checkPromptMirror(root);
  const mirrorBlockingFailures = mirrorRows.filter((row) => !row.ok && row.reason !== "convenience copy differs from dev/SESSION_HANDOFF.md");
  const mirrorWarnings = mirrorRows.filter((row) => !row.ok && row.reason === "convenience copy differs from dev/SESSION_HANDOFF.md");
  console.log(`\nprompt mirror checks: ${mirrorRows.length}`);
  for (const row of mirrorRows) {
    const status = row.ok ? "ok" : row.reason === "convenience copy differs from dev/SESSION_HANDOFF.md" ? "warn" : "missing";
    console.log(`${status}  ${row.target} (${row.label})`);
    if (!row.ok && row.reason) console.log(`  reason: ${row.reason}`);
  }

  if (mirrorBlockingFailures.length > 0) {
    printDoctorSummary(version, root, "needs-fix", {
      checked: rows.length + historicalReceiptChecks + anchorRows.length + schemaRows.length + userRulesResult.checked + mirrorRows.length,
      failedKind: "prompt mirror checks",
      failedCount: mirrorBlockingFailures.length,
      nextStep: "以 dev/SESSION_HANDOFF.md 的 Next Session Opening Message 為準，重生 START_NEXT_SESSION_PROMPT.txt。"
    });
    process.exitCode = 1;
    return "failed";
  }

  // R-010 SESSION_LOG handoff-role discipline check (warn-only; does not change mode or exit).
  const disciplineResult = await assessSessionLogDiscipline(root);
  console.log(`\nSESSION_LOG 接力角色紀律: ${disciplineResult.ok ? "ok" : "warn"}`);
  if (!disciplineResult.ok) {
    for (const warning of disciplineResult.warnings) {
      console.log(`  warn: ${warning}`);
    }
  }

  // R-030 v0.3.0+: credential leak prevention sweep over governance files.
  const credentialResult = await checkInstalledIntegrationsCredentialLeak(root);
  console.log(`Credential separation sweep: ${credentialResult.ok ? "ok" : "FAILED"}`);
  if (!credentialResult.ok) {
    for (const finding of credentialResult.findings) {
      console.log(`  CRITICAL: ${finding}`);
    }
  }

  // R-031.2 v0.3.2+: 項目狀態速覽 —— 三向 version 對比 + 距上次 closeout 幾耐 +
  // 項目首次安裝距今幾耐。從用戶跑 doctor 嗰刻嘅 mental state 出發（confirm health /
  // suspect drift / curious about version / continuity awareness），唔等用戶 ask AI。
  console.log("");
  console.log("項目狀態速覽：");
  const versionAlignment = await assessVersionAlignment(root, version, {
    skipRegistryLookup: options.skipVersionRegistryLookup === true,
    acceptedVersion: null
  });
  printVersionAlignment(versionAlignment);
  const versionNextStep = getVersionAlignmentNextStep(versionAlignment);
  const lastCloseout = await assessLastCloseout(root);
  printLastCloseout(lastCloseout);
  const projectAge = await assessProjectAge(root);
  printProjectAge(projectAge);
  const onboardingNextStep = options.context === "upgrade-self-check" ? null : getFirstUseNextStep(root, lastCloseout);
  const promptMirrorNextStep = mirrorWarnings.length > 0
    ? "檢查已通過。START_NEXT_SESSION_PROMPT.txt 只是下次開工便利副本；session 進行中不用手動重生，收工 closeout 時 AI 會從 dev/SESSION_HANDOFF.md 重生。"
    : null;
  // A preserved non-exact PROJECT_INDEX may legitimately leave a version
  // alignment note alongside a prompt-copy warning.  Both are actionable;
  // do not let the former hide the latter from the ordinary doctor result.
  const healthyNextStep = [versionNextStep, promptMirrorNextStep, onboardingNextStep]
    .filter(Boolean)
    .join(" ")
    || "檢查已通過。繼續使用你原本的 AI 開工方式；準備結束本輪工作、需要保存交接、或有下一輪必須知道的狀態時，在 AI 對話輸入「收工」。";

  const overallHealthy = credentialResult.ok;
  if (overallHealthy && !options.silentCard) printCard(version, "doctor ready", "o.o");
  printDoctorSummary(version, root, overallHealthy ? "healthy" : "needs-attention", {
    checked: rows.length + historicalReceiptChecks + anchorRows.length + schemaRows.length + userRulesResult.checked + researchTraceResult.checked + temperatureResult.checked + mirrorRows.length + 2,
    failedKind: !credentialResult.ok ? "credential leak" : null,
    failedCount: !credentialResult.ok ? credentialResult.findings.length : 0,
    warningKind: mirrorWarnings.length > 0 ? "prompt mirror warning" : null,
    warningCount: mirrorWarnings.length,
    nextStep: !credentialResult.ok
      ? "立即從相關檔案 redact credential value + rotate 已泄露 token；credential 應該由 AI 工具自身 secure storage 管理，永不寫入 dev/* 任何檔。"
      : disciplineResult.ok
      ? healthyNextStep
      : "繼續使用；下次 closeout 時 AI 應自動執行 SESSION_LOG N 規則推進（見上面 warn 行）。如未動請要求 AI 重做 closeout。"
  });
  return overallHealthy ? "passed" : "failed";
}

function renderFormalUserRulesReport(witness, readback) {
  if (!witness) return ["- not applicable"];
  return [
    `- Acceptance digest: ${witness.acceptanceDigest}`,
    `- Ordered entries: ${witness.entries.map((entry) => `${entry.entryId}:${entry.contentPath}:${entry.accepted.sha256}`).join(", ") || "none"}`,
    `- Kit base: ${witness.state.kitBase.packageVersion}; ${witness.state.kitBase.managedCoreSha256}`,
    `- Router: ${witness.state.router.path}; ${witness.state.router.contentRoot}`,
    `- Fresh runtime readback: ${readback ? `${readback.acceptanceDigest}; AGENTS=${readback.agentsSha256}; router=${readback.routerSha256}` : "missing"}`
  ];
}

function validateFormalUserRulesWitness(value) {
  if (value == null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)
    || typeof value.acceptanceDigest !== "string" || !/^[a-f0-9]{64}$/.test(value.acceptanceDigest)
    || !value.state || typeof value.state !== "object" || Array.isArray(value.state)
    || !Array.isArray(value.entries)) {
    throw new Error("formal user-rules witness is invalid; no recovery writes attempted");
  }
  const { kitBase, router } = value.state;
  if (!kitBase || kitBase.target !== "AGENTS.md" || !isStableSemver(kitBase.packageVersion ?? "")
    || typeof kitBase.managedCoreSha256 !== "string" || !/^[a-f0-9]{64}$/.test(kitBase.managedCoreSha256)
    || !router || router.path !== USER_RULES_ROUTER_PATH || router.contentRoot !== "dev/user_rules/") {
    throw new Error("formal user-rules state witness is invalid; no recovery writes attempted");
  }
  const contentPaths = new Set();
  for (const entry of value.entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)
      || typeof entry.entryId !== "string" || !isFormalUserRulesContentPath(entry.contentPath)
      || !entry.accepted || typeof entry.accepted !== "object" || !/^[a-f0-9]{64}$/.test(entry.accepted.sha256 ?? "") || !Number.isInteger(entry.accepted.bytes) || entry.accepted.bytes < 0
      || !entry.sourceWitness || typeof entry.sourceWitness !== "object" || entry.sourceWitness.sha256 !== entry.accepted.sha256 || entry.sourceWitness.bytes !== entry.accepted.bytes
      || !entry.originalReader || typeof entry.originalReader.reader !== "string" || typeof entry.originalReader.via !== "string"
      || !entry.activeReader || entry.activeReader.reader !== "AGENTS.md" || entry.activeReader.via !== USER_RULES_ROUTER_PATH
      || typeof entry.priorityRelation !== "string" || !entry.priorityRelation.trim()
      || typeof entry.effectDecision !== "string" || !entry.effectDecision.trim()
      || contentPaths.has(entry.contentPath)) {
      throw new Error("formal user-rules entry witness is invalid; no recovery writes attempted");
    }
    contentPaths.add(entry.contentPath);
  }
  return { contentPaths };
}

function resolveFormalUserRulesWitness(outputs) {
  const witnesses = outputs.map((item) => item.formalUserRules).filter(Boolean);
  if (witnesses.length === 0) return null;
  const canonical = JSON.stringify(witnesses[0]);
  if (witnesses.some((witness) => JSON.stringify(witness) !== canonical)) {
    throw new Error("formal user-rules transaction outputs do not share one acceptance witness");
  }
  return witnesses[0];
}

function byteWitness(bytes) {
  return Object.freeze({ sha256: sha256(bytes), bytes: bytes.length });
}

async function hasActiveTransactionLock(root) {
  try {
    await lstat(path.join(root, "dev", "governance_migrations", ".upgrade.lock"));
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function checkFormalUserRules(root, options = {}) {
  const agentsText = await readOptionalText(path.join(root, "AGENTS.md"));
  const routerPresent = await exists(path.join(root, USER_RULES_ROUTER_PATH));
  const declaresFormalEntry = Boolean(agentsText?.includes(FORMAL_USER_RULES_ENTRY_ANCHOR));
  if (!declaresFormalEntry && !routerPresent) {
    return { ok: true, checked: 0, finding: null };
  }
  try {
    const state = await readFormalUserRules({ root, allowActiveTransaction: options.allowActiveTransaction === true });
    if (options.expectedFormalUserRules) assertFormalUserRulesReadback(state, options.expectedFormalUserRules);
    if (typeof options.captureFormalUserRules === "function") options.captureFormalUserRules(state);
    return { ok: true, checked: 1, finding: null, state };
  } catch (error) {
    return { ok: false, checked: 1, finding: String(error?.message ?? error) };
  }
}

function formalUserRulesReadbackFromDoctorState(state, witness) {
  assertFormalUserRulesReadback(state, witness);
  return {
    reader: "doctor formal user-rules check",
    acceptanceDigest: state.acceptanceDigest,
    agentsSha256: state.agentsSha256,
    routerSha256: state.routerSha256,
    entries: state.rules.map((rule) => ({ entryId: rule.entryId, contentPath: rule.path, sha256: rule.sha256, bytes: rule.bytes.length }))
  };
}

function assertFormalUserRulesReadback(actual, witness) {
  if (!witness || actual.acceptanceDigest !== witness.acceptanceDigest
    || JSON.stringify(actual.state) !== JSON.stringify(witness.state)
    || actual.rules.length !== witness.entries.length) {
    throw new Error("formal user-rules runtime readback does not match the transaction acceptance witness");
  }
  for (let index = 0; index < witness.entries.length; index += 1) {
    const expected = witness.entries[index];
    const rule = actual.rules[index];
    if (rule.entryId !== expected.entryId || rule.path !== expected.contentPath
      || rule.sha256 !== expected.accepted.sha256 || rule.bytes.length !== expected.accepted.bytes
      || rule.sourceWitness.sha256 !== expected.sourceWitness.sha256 || rule.sourceWitness.bytes !== expected.sourceWitness.bytes
      || rule.originalReader.reader !== expected.originalReader.reader || rule.originalReader.via !== expected.originalReader.via
      || rule.activeReader.reader !== expected.activeReader.reader || rule.activeReader.via !== expected.activeReader.via
      || rule.priorityRelation !== expected.priorityRelation || rule.effectDecision !== expected.effectDecision) {
      throw new Error("formal user-rules runtime readback order, metadata, or effect differs from the transaction acceptance witness");
    }
  }
}

async function checkResearchDecisionTrace(root) {
  const decisionsPath = path.join(root, "dev/PROJECT_DECISIONS.md");
  const indexPath = path.join(root, "dev/PROJECT_INDEX.md");
  let decisionsText = "";
  let indexText = "";
  try {
    decisionsText = await readFile(decisionsPath, "utf8");
    indexText = await readFile(indexPath, "utf8");
  } catch {
    return { ok: false, checked: 1, findings: ["dev/PROJECT_DECISIONS.md or dev/PROJECT_INDEX.md unreadable"] };
  }

  const findings = [];
  const sourceTokenPattern = /\bsource:[A-Za-z0-9._-]+\b/g;
  const blocks = markdownListBlocks(stripFencedCodeBlocks(decisionsText));
  const researchBlocks = blocks.filter((block) => /\bresearch-derived\b/i.test(block) || /Evidence chain:/i.test(block));

  researchBlocks.forEach((block, index) => {
    const label = `research-derived decision #${index + 1}`;
    if (!/Evidence chain:/i.test(block)) {
      findings.push(`${label} missing Evidence chain`);
    }
    const tokens = [...block.matchAll(sourceTokenPattern)].map((match) => match[0]);
    if (tokens.length === 0) {
      findings.push(`${label} missing source:<id> token`);
    }
    for (const token of tokens) {
      if (!indexText.includes(token)) {
        findings.push(`${label} references ${token}, but dev/PROJECT_INDEX.md does not contain that token`);
      }
    }
  });

  return { ok: findings.length === 0, checked: 1, findings };
}

function stripFencedCodeBlocks(text) {
  return text.replace(/```[\s\S]*?```/g, "");
}

function markdownListBlocks(text) {
  const blocks = [];
  let current = [];
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*[-*]\s+/.test(line)) {
      if (current.length > 0) blocks.push(current.join("\n"));
      current = [line];
    } else if (current.length > 0 && (/^\s{2,}\S/.test(line) || /^\s*$/.test(line))) {
      current.push(line);
    } else if (current.length > 0) {
      blocks.push(current.join("\n"));
      current = [];
    }
  }
  if (current.length > 0) blocks.push(current.join("\n"));
  return blocks;
}

async function checkHandoffTemperatureBoundary(root) {
  const findings = [];
  const sections = [];
  let handoffText = "";

  try {
    handoffText = await readFile(path.join(root, "dev/SESSION_HANDOFF.md"), "utf8");
  } catch {
    return { ok: false, checked: 1, findings: ["dev/SESSION_HANDOFF.md unreadable"] };
  }

  sections.push(
    { label: "Durable Anchors", text: extractHandoffSectionText(handoffText, "durable-anchors", "Durable Anchors") },
    { label: "Next Priorities", text: extractHandoffSectionText(handoffText, "next-priorities", "Next Priorities") },
    { label: "Next Session Opening Message", text: extractHandoffSectionText(handoffText, "next-session-opening-message", "Next Session Opening Message") }
  );

  const requiredReading = extractHandoffSectionText(handoffText, "next-task-required-reading", "Next Task Required Reading");
  sections.push({ label: "Next Task Required Reading", text: requiredReading, allowSourceTokens: true });

  try {
    const promptText = await readFile(path.join(root, "START_NEXT_SESSION_PROMPT.txt"), "utf8");
    sections.push({ label: "START_NEXT_SESSION_PROMPT.txt", text: promptText });
  } catch {
    // Missing prompt mirror is handled by prompt mirror checks; do not duplicate the failure here.
  }

  for (const section of sections) {
    if (!section.text) continue;
    findings.push(...currentStateEvidenceFindings(section.label, section.text, { allowSourceTokens: section.allowSourceTokens }));
  }

  return { ok: findings.length === 0, checked: 1, findings };
}

const rootMismatchGuard = "If this root does not match the expected project root";

function currentStateEvidenceRules() {
  return [
    { pattern: /post-publish artifact smoke/i, label: "post-publish artifact smoke evidence" },
    { pattern: /PASS\s+7\/7/i, label: "historical PASS count" },
    { pattern: /\bfileCount\b/i, label: "published artifact fileCount evidence" },
    { pattern: /\brelease source\b/i, label: "release source evidence" },
    { pattern: /Cross-mind evidence/i, label: "cross-agent review evidence" },
    { pattern: /Evidence chain:/i, label: "research evidence chain" },
    { pattern: /\bnpm latest\s+(?:is|=|v?\d)/i, label: "historical npm latest state" },
    { pattern: /GitHub Release\s+(?:metadata|published|view|`?v?\d)/i, label: "historical GitHub Release state" }
  ];
}

function currentStateEvidenceFindings(sectionLabel, text, options = {}) {
  const findings = [];
  for (const rule of currentStateEvidenceRules()) {
    if (rule.pattern.test(text)) {
      findings.push(`${sectionLabel} contains ${rule.label}; keep it in trace evidence unless it still affects the next action`);
    }
  }
  if (!options.allowSourceTokens && /\bsource:[A-Za-z0-9._-]+\b/.test(text)) {
    findings.push(`${sectionLabel} contains source:<id>; keep source tokens in PROJECT_INDEX / PROJECT_DECISIONS, not hot startup state`);
  }
  return findings;
}

function lineHasCurrentStateEvidence(line, options = {}) {
  return currentStateEvidenceFindings("line", line, options).length > 0;
}

function repairHandoffCurrentStateEvidenceBoundary(text) {
  let repaired = text;
  let changed = false;
  for (const section of [
    { id: "durable-anchors", heading: "Durable Anchors" },
    { id: "next-priorities", heading: "Next Priorities" },
    { id: "next-session-opening-message", heading: "Next Session Opening Message" }
  ]) {
    const bounds = handoffSectionContentBounds(repaired, section.id, section.heading);
    if (!bounds) continue;
    const originalSection = repaired.slice(bounds.start, bounds.end);
    const lines = originalSection.split(/\r?\n/);
    const cleanedLines = lines.filter((line) => !lineHasCurrentStateEvidence(line));
    if (cleanedLines.length !== lines.length) {
      const cleanedSection = cleanedLines.join("\n");
      repaired = `${repaired.slice(0, bounds.start)}${cleanedSection}${repaired.slice(bounds.end)}`;
      changed = true;
    }
  }
  return { changed, text: repaired };
}

function handoffSectionContentBounds(text, id, headingText) {
  const marker = `<!-- ack:section:${id} -->`;
  const markerStart = text.indexOf(marker);
  if (markerStart >= 0) {
    const start = markerStart + marker.length;
    const nextMarker = text.indexOf("<!-- ack:section:", start);
    return { start, end: nextMarker >= 0 ? nextMarker : text.length };
  }

  const headingPattern = new RegExp(`^##\\s+${escapeRegExp(headingText)}\\s*$`, "m");
  const headingMatch = headingPattern.exec(text);
  if (!headingMatch) return null;
  const start = headingMatch.index + headingMatch[0].length;
  const nextHeading = /\n##\s+/g;
  nextHeading.lastIndex = start;
  const nextMatch = nextHeading.exec(text);
  return { start, end: nextMatch ? nextMatch.index : text.length };
}

function extractHandoffSectionText(text, id, headingText) {
  const marker = `<!-- ack:section:${id} -->`;
  const markerStart = text.indexOf(marker);
  if (markerStart >= 0) {
    const afterMarker = markerStart + marker.length;
    const nextMarker = text.indexOf("<!-- ack:section:", afterMarker);
    return text.slice(afterMarker, nextMarker >= 0 ? nextMarker : text.length);
  }

  const headingPattern = new RegExp(`^##\\s+${escapeRegExp(headingText)}\\s*$`, "m");
  const headingMatch = headingPattern.exec(text);
  if (!headingMatch) return "";
  const start = headingMatch.index + headingMatch[0].length;
  const nextHeading = /\n##\s+/g;
  nextHeading.lastIndex = start;
  const nextMatch = nextHeading.exec(text);
  return text.slice(start, nextMatch ? nextMatch.index : text.length);
}

async function regeneratePromptFromHandoffIfHotEvidence(root, backupDir, merged) {
  const handoffPath = path.join(root, "dev/SESSION_HANDOFF.md");
  const promptPath = path.join(root, "START_NEXT_SESSION_PROMPT.txt");
  let handoffText = "";
  let promptText = "";
  try {
    handoffText = await readFile(handoffPath, "utf8");
    promptText = await readFile(promptPath, "utf8");
  } catch {
    return false;
  }

  const opening = extractOpeningMessage(handoffText);
  if (opening == null) return false;

  const promptNeedsRepair = lineHasCurrentStateEvidence(promptText)
    || (!promptText.includes(rootMismatchGuard) && opening.includes(rootMismatchGuard));
  if (!promptNeedsRepair) return false;

  const backupPath = path.join(backupDir, "START_NEXT_SESSION_PROMPT.txt");
  await mkdir(path.dirname(backupPath), { recursive: true });
  await copyFile(promptPath, backupPath);
  await writeFile(promptPath, `${opening}\n`, "utf8");
  if (!merged.some((item) => item.startsWith("START_NEXT_SESSION_PROMPT.txt"))) {
    merged.push("START_NEXT_SESSION_PROMPT.txt - regenerate prompt from repaired handoff opening message");
  }
  return true;
}

function getFirstUseNextStep(root, lastCloseout) {
  if (lastCloseout.date) return null;
  return `檢查已通過。下一步不要再留在終端機；打開能讀寫此資料夾的 AI agent。若 AI 已在此資料夾內，輸入 Start Agent Handoff 或「開工」；若 AI 還未指向此資料夾，才貼：${startupPathBootstrapPrompt(root)}`;
}

// R-030 v0.3.0+: Credential leak prevention sweep. Scans dev/PROJECT_INDEX.md,
// dev/SESSION_HANDOFF.md, dev/SESSION_LOG.md for common credential prefix patterns.
// Credentials must live in OS-level secure storage or AI-tool config, never in dev/*.
async function checkInstalledIntegrationsCredentialLeak(root) {
  const targetFiles = [
    "dev/PROJECT_INDEX.md",
    "dev/SESSION_HANDOFF.md",
    "dev/SESSION_LOG.md"
  ];
  const findings = [];
  for (const relPath of targetFiles) {
    const absPath = path.join(root, relPath);
    let text;
    try {
      text = await readFile(absPath, "utf8");
    } catch {
      continue;
    }
    for (const { pattern, label } of credentialLeakPatterns) {
      const match = text.match(pattern);
      if (match) {
        const line = text.slice(0, match.index).split("\n").length;
        findings.push(`${relPath}:${line} — ${label} pattern matched. Remove value immediately, rotate token, and re-store credential only in AI tool secure storage.`);
      }
    }
  }
  return { ok: findings.length === 0, findings };
}

// R-026 CLI Output Contract: doctor 完成必含四項（版本／模式／剛完成／下一步）。
function printDoctorSummary(version, root, mode, details) {
  console.log("");
  if (mode === "healthy") {
    console.log("status: passed");
    if (details.warningCount > 0) {
      console.log("✅ 檢查通過：必要文件存在，基本結構完整。");
      console.log("⚠️  提醒：下次開工提示便利副本目前落後於 handoff；這只需要在收工 closeout 時重生。");
    } else {
      console.log("✅ 檢查通過：必要文件存在，基本結構完整，下次開工提示副本已與 handoff 一致。");
    }
  } else {
    console.log(`status: failed (${details.failedCount} ${details.failedKind} failed)`);
    console.log(`⚠️  檢查未通過：${details.failedKind === "missing files" ? "有必要檔案不存在。" : details.failedKind === "anchor checks" ? "有檔案存在，但內容缺少必要段落。" : details.failedKind === "schema checks" ? "交接或索引文件結構不完整。" : details.failedKind === "research decision trace checks" ? "研究導向決策缺少可追溯來源鏈。" : details.failedKind === "handoff temperature boundary checks" ? "當前交接內容混入一次性或歷史證據。" : "下次開工提示副本與 handoff 真源不同。"}`);
  }
  console.log("");
  console.log(`📦 版本：v${version}`);
  console.log(`🩺 模式：${mode}`);
  console.log(`🔎 剛完成：檢查 ${details.checked} 項；${mode === "healthy" ? (details.warningCount > 0 ? `0 項未通過；${details.warningCount} 項提醒（${details.warningKind}）` : "全部通過") : `${details.failedCount} 項未通過（${details.failedKind}）`}。`);
  console.log(`🚀 下一步：${details.nextStep}`);
}

// Anchor failures mean a required file is missing fixed Kit text. The fix is a
// content repair the CLI deliberately does NOT perform itself: every anchor-checked
// file outside the bounded upgrade-merge set is preserved verbatim (R-016), so
// re-running upgrade would skip the same file again — the old "run upgrade --dry-run"
// next step was a dead end. Route the repair to the AI as a non-destructive patch,
// and give the novice an explicit, ordered walk-through.
function printAnchorRepairGuidance(anchorFailures, context) {
  console.log("");
  console.log("------------------------------------------------------------");
  console.log("🔧 怎樣修這個「缺少段落」的問題（一步一步）：");
  console.log("------------------------------------------------------------");
  if (context === "upgrade-self-check") {
    console.log("⚠️  升級本身已完成，也沒有覆寫你的檔案。剩下的是個別檔案缺少 Kit 需要的固定段落，需要補回。");
  } else {
    console.log("⚠️  這不是檔案壞掉，工具也沒有覆寫你的檔案。只是有檔案缺少 Kit 需要的固定段落（多數因為該檔較舊或曾被改動）。");
  }
  console.log("缺段的檔案：");
  for (const row of anchorFailures) {
    console.log(`  • ${row.target}（${row.label}）`);
    if (row.missing && row.missing.length > 0) {
      for (const snippet of row.missing) console.log(`      缺：${JSON.stringify(snippet)}`);
    }
  }
  console.log("");
  console.log("步驟：");
  console.log("  1. 不要重跑 upgrade —— 這些是 upgrade 會「保留不動」的檔，重跑不會補回缺段。");
  console.log("  2. 複製上面整段 doctor 輸出。");
  console.log("  3. 打開你的 AI 工具（Claude Code / Claude Cowork / OpenAI Codex 等），貼上並說：");
  console.log("     「請按 doctor 指出的缺失 anchor，非破壞性補回對應檔案的段落，不要覆寫我其他內容。」");
  console.log("  4. AI 補完後，再執行：npx --yes @adamchanadam/agent-handoff-kit@latest doctor 確認轉綠。");
  console.log("------------------------------------------------------------");
}

function anchorRepairNextStep(context) {
  const lead = context === "upgrade-self-check"
    ? "升級已完成且沒有覆寫你的檔；剩下的是內容缺段，需由 AI 補。"
    : "有入口檔存在，但個別檔案缺少 Kit 需要的固定段落。";
  return `${lead}按上面「怎樣修」步驟：把整段 doctor 輸出貼給 AI，請它非破壞性補回缺失 anchor，補完再執行 doctor 確認。不要重跑 upgrade（這些檔會被保留不動，重跑修不到）。`;
}

async function hydrateInitialOpeningPrompt(root, created) {
  if (!created.includes("dev/SESSION_HANDOFF.md") && !created.includes("START_NEXT_SESSION_PROMPT.txt")) return;
  for (const rel of ["dev/SESSION_HANDOFF.md", "START_NEXT_SESSION_PROMPT.txt"]) {
    const filePath = path.join(root, rel);
    try {
      const text = await readFile(filePath, "utf8");
      if (!text.includes("<absolute project root>")) continue;
      await writeFile(filePath, text.replaceAll("<absolute project root>", root), "utf8");
    } catch {
      // Leave template untouched; doctor will warn about convenience-copy drift if any.
    }
  }
}

async function checkPromptMirror(root) {
  const mirror = assessPromptMirrorRoot(root);
  return [{
    target: "START_NEXT_SESSION_PROMPT.txt",
    label: "matches handoff opening message",
    ok: mirror.ok,
    reason: mirror.ok ? "" : mirror.reason
  }];
}

function assessHandoffLifecycleConsistency(text) {
  const fieldValue = fieldValueAfterMarker(text, "lifecycle-conflicts-resolved");
  if (isUnresolvedLifecycleFieldValue(fieldValue)) {
    return { ok: false, reason: "lifecycle field is explicitly unresolved" };
  }
  if (isPlaceholderLifecycleFieldValue(fieldValue) && hasSubstantiveHandoffState(text)) {
    return { ok: false, reason: "lifecycle field is still placeholder after handoff content changed" };
  }
  const contradictions = findHandoffLifecycleContradictions(text);
  if (contradictions.length > 0) {
    return { ok: false, reason: `resolved work overlaps unresolved carry-forward state: ${contradictions[0]}` };
  }
  return { ok: true, reason: "" };
}

function handoffStateLines(text, markerId, headingTitle) {
  const sectionText = markerId === "next-session-opening-message"
    ? (extractOpeningMessage(text) ?? "")
    : extractSectionText(text, markerId, headingTitle);
  return sectionText
    .replace(/```[\s\S]*?```/g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter((line) => line.length > 3 && !line.startsWith("##") && !line.startsWith("<!--") && !/^(TBD|none|n\/a|未適用|無)$/i.test(line))
    .filter((line) => markerId !== "next-session-opening-message" || !isOwnedOpeningLifecycleBoilerplate(line));
}

function isOwnedOpeningLifecycleBoilerplate(line) {
  return /^Resume the current objective\. A plain `Start Agent Handoff` \/ `開工` with no same-message task or explicit long-run instruction only authorizes minimum state recovery/i.test(line)
    || /^A fresh install only makes guidance available; it does not force onboarding\./i.test(line)
    || /^Load onboarding only when I explicitly ask for guidance or no executable objective remains after state reading\./i.test(line);
}

function stripResolvedNegatedActionClauses(line) {
  return line.split(/(?<=[.;；。])\s*/).filter((clause) => {
    const negated = /\b(?:no|not|never|without|did not|has not|have not)\b/i.test(clause);
    const action = /\b(?:commit|push|tag|release|publish|deploy|deployment|sync|write|upgrade)\b/i.test(clause);
    return !(negated && action);
  }).join(" ");
}

const ignoredLifecycleEnglish = new Set([
    "completed", "complete", "finish", "finished", "continue", "incomplete", "passed", "verified", "pending", "blocked", "follow", "scope",
    "monitor", "only", "reopened", "recommended", "next", "step", "session", "current", "work", "task", "with",
    "from", "that", "this", "handoff", "lifecycle", "migration", "regression", "agent", "reason", "condition",
    "the", "and", "for", "into", "still", "remains"
]);

function lifecycleEnglishTokens(line, stripNegated = false) {
  const source = stripNegated ? stripResolvedNegatedActionClauses(line) : line;
  return (source.toLowerCase().match(/[a-z0-9][a-z0-9_-]{2,}/g) ?? [])
    .filter((token) => !ignoredLifecycleEnglish.has(token));
}

function lifecycleTopicWindows(line, stripNegated = false) {
  const source = stripNegated ? stripResolvedNegatedActionClauses(line) : line;
  const englishTokens = lifecycleEnglishTokens(source);
  const english = Array.from({ length: Math.max(0, englishTokens.length - 2) }, (_, index) => englishTokens.slice(index, index + 3).join(" "));
  const chineseRuns = source.match(/[\u3400-\u9fff]{6,}/g) ?? [];
  const chinese = chineseRuns.flatMap((run) => Array.from({ length: Math.max(0, run.length - 5) }, (_, index) => run.slice(index, index + 6)));
  return new Set([...english, ...chinese]);
}

function lifecycleShortChineseCore(line, stripNegated = false) {
  const rawSource = stripNegated ? stripResolvedNegatedActionClauses(line) : line;
  const source = rawSource.split(/(?:\s+[—–-]\s*)?(?:reason|condition)\s*[:：]|(?:原因|條件)\s*[:：]/i)[0];
  const ignored = /(後續追蹤|只監察|尚未完成|已經完成|重新開啟|完成|已驗證|繼續|下一步|待辦|尚未|未完成|通過|風險|受阻|重開|監察|追蹤|修復|修補|修正)/g;
  const core = (source.match(/[\u3400-\u9fff]+/g) ?? []).join("").replace(ignored, "");
  return core.length >= 2 && core.length <= 5 ? core : null;
}

function lifecycleTopicsOverlap(left, right) {
  const leftWindows = lifecycleTopicWindows(left, true);
  if ([...lifecycleTopicWindows(right)].some((window) => leftWindows.has(window))) return true;
  const leftEnglish = lifecycleEnglishTokens(left, true);
  const rightEnglish = lifecycleEnglishTokens(right);
  if (leftEnglish.length === 2 && rightEnglish.length === 2 && leftEnglish.join(" ") === rightEnglish.join(" ")) return true;
  const leftChinese = lifecycleShortChineseCore(left, true);
  return Boolean(leftChinese && leftChinese === lifecycleShortChineseCore(right));
}

function isExplicitLifecycleReclassification(line) {
  const normalized = line
    .replace(/^recommended next step\s*:\s*/i, "")
    .replace(/^[\s—–:-]+/, "")
    .trim();
  if (!/^(?:(?:monitor-only|follow-up scope|blocked|reopened)\b|只監察|後續追蹤|受阻|重開)/i.test(normalized)) return false;
  if (/\b(no condition|without condition|unconditional)\b|無條件|沒有條件/i.test(normalized)) return false;

  const labelled = normalized.match(/(?:\bcondition|\btrigger|\bmissing evidence|條件|觸發條件|缺少證據|證據|原因|\breason)\s*[:：-]\s*([^;；\n]+)/i);
  if (labelled) return isSubstantiveLifecycleCondition(labelled[1]);
  const temporal = normalized.match(/(?:\bwhen|\buntil|待)(?:\s+|：|:)([^;；\n]+)/i);
  return temporal ? isSubstantiveLifecycleCondition(temporal[1]) : false;
}

function isSubstantiveLifecycleCondition(value) {
  const normalized = (value ?? "").trim().replace(/[.。]+$/, "");
  if (normalized.length < 4) return false;
  if (/^(TBD|todo|pending|unknown|unverified|none|n\/a|待定|待確認|未知|無)$/i.test(normalized)) return false;
  if (/\b(no condition|without condition|unconditional)\b|無條件|沒有條件/i.test(normalized)) return false;
  return true;
}

function findHandoffLifecycleContradictions(text) {
  const resolved = [
    ...handoffStateLines(text, "completed-this-session", "Completed This Session"),
    ...handoffStateLines(text, "validation-qc", "Validation / QC").filter((line) => /(pass|passed|verified|complete|success|通過|完成|已驗證|已核對)/i.test(line))
  ];
  const carryForward = [
    ...handoffStateLines(text, "next-priorities", "Next Priorities"),
    ...handoffStateLines(text, "risks-blockers", "Risks / Blockers"),
    ...handoffStateLines(text, "next-session-opening-message", "Next Session Opening Message")
  ];
  const findings = [];
  for (const pending of carryForward) {
    if (isExplicitLifecycleReclassification(pending)) continue;
    for (const done of resolved) {
      if (lifecycleTopicsOverlap(done, pending)) findings.push(`${done} <> ${pending}`);
    }
  }
  return findings;
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

async function findMisplacedRulePacks(root, missingRows) {
  const missingTargets = new Set(missingRows.map((row) => row.target));
  const findings = [];
  for (const target of rulePackTargets) {
    if (!missingTargets.has(target)) continue;
    const fileName = path.basename(target);
    const misplacedRel = path.join("dev", fileName).replaceAll(path.sep, "/");
    if (await exists(path.join(root, misplacedRel))) {
      findings.push({ expected: target, misplaced: misplacedRel });
    }
  }
  return findings;
}

function printMisplacedRulePackWarnings(findings) {
  if (findings.length === 0) return;
  console.log("");
  console.log("misplaced rule pack hints:");
  for (const finding of findings) {
    console.log(`warning  ${finding.expected} missing, but ${finding.misplaced} exists`);
  }
  console.log("  同名 rules 檔疑似放錯層；upgrade 會補回 dev/rules/ 內的正確檔案，但不會自動刪除或搬移 dev/ 根層副本。");
}

async function checkRequiredAnchors(root) {
  const rows = [];
  for (const rule of requiredAnchors) {
    const filePath = path.join(root, rule.target);
    let text = "";
    try {
      text = await readFile(filePath, "utf8");
    } catch {
      rows.push({ target: rule.target, label: rule.label, ok: false, missing: ["file unreadable"] });
      continue;
    }

    // Report which specific anchor snippets are absent or semantically misplaced,
    // not just pass/fail. A naked snippet at file tail must not make doctor green.
    const failures = requiredAnchorFailures(rule, text);
    const missing = failures.map((failure) => failure.kind === "missing"
      ? failure.snippet
      : `misplaced: ${failure.snippet}`);
    rows.push({
      target: rule.target,
      label: rule.label,
      ok: missing.length === 0,
      missing
    });
  }
  return rows;
}

async function checkSchema(root) {
  const rows = [];
  for (const rule of schemaChecks) {
    const filePath = path.join(root, rule.target);
    let text = "";
    try {
      text = await readFile(filePath, "utf8");
    } catch {
      rows.push({ target: rule.target, label: rule.label, ok: false, missing: ["file unreadable"] });
      continue;
    }
    const missing = rule.checks
      .filter((check) => !check.test(text))
      .map((check) => check.explain?.(text) ? `${check.label}: ${check.explain(text)}` : check.label);
    rows.push({
      target: rule.target,
      label: rule.label,
      ok: missing.length === 0,
      missing
    });
  }
  return rows;
}

function includes(snippet) {
  return {
    label: snippet,
    test: (text) => text.includes(snippet)
  };
}

function heading(title) {
  return {
    label: `heading: ${title}`,
    test: (text) => new RegExp(`^## ${escapeRegExp(title)}\\s*$`, "m").test(text)
  };
}

function marker(type, id, legacyText) {
  const semanticMarker = `ack:${type}:${id}`;
  return {
    label: `${type}: ${id}`,
    test: (text) => text.includes(semanticMarker) || (legacyText ? text.includes(legacyText) : false)
  };
}

function section(id, legacyHeading) {
  const check = marker("section", id, null);
  return {
    label: `section: ${id}`,
    test: (text) => check.test(text) || heading(legacyHeading).test(text)
  };
}

function tableHeader(...cells) {
  const line = `| ${cells.join(" | ")} |`;
  return {
    label: `table: ${cells.join(" / ")}`,
    test: (text) => text.includes(line)
  };
}

async function buildPlan(root, command, version = null) {
  const plan = [];
  const planMappings = command === "init" ? freshInstallMappings : [...mappings, ...upgradeStateMappings];
  const context = {
    currentVersion: version,
    rootTemplateVersion: command === "upgrade" ? await readRootTemplateVersion(root) : null,
    officialCatalog: command === "upgrade" ? await loadOfficialOriginCatalog() : null,
    officialOrigins: new Map(),
    trustedBaselineVersion: null,
    historicalOfficialEvidence: false
  };
  if (command === "upgrade") {
    for (const [, targetRel] of planMappings) {
      if (upgradeStateTargets.includes(targetRel)) continue;
      const targetBytes = await readOptionalBuffer(path.join(root, targetRel));
      if (targetBytes == null) continue;
      const targetText = targetBytes.toString("utf8");
      context.officialOrigins.set(targetRel, identifyOfficialOrigin({ targetRel, text: targetText, bytes: targetBytes, catalog: context.officialCatalog }));
    }
    context.trustedBaselineVersion = selectTrustedOfficialBaseline(context);
    context.historicalOfficialEvidence = countHistoricalOfficialSignals(context) >= 2;
  }
  for (const [sourceRel, targetRel] of planMappings) {
    const sourceAbs = path.join(packageRoot, sourceRel);
    const targetAbs = path.join(root, targetRel);
    const sourceText = await readTemplateSource(command, sourceRel, targetRel, sourceAbs);
    if (command === "upgrade" && upgradeStateTargets.includes(targetRel)) {
      const routerText = await readOptionalText(targetAbs);
      const agentsText = await readOptionalText(path.join(root, "AGENTS.md"));
      const declaresFormalEntry = Boolean(agentsText?.includes(FORMAL_USER_RULES_ENTRY_ANCHOR));
      if (!routerText && !declaresFormalEntry) {
        plan.push({
          sourceRel,
          targetRel,
          sourceAbs,
          targetAbs,
          action: "skip",
          reason: "no pre-existing formal user-rules state; router path does not imply legacy ownership"
        });
      } else if (!routerText || !declaresFormalEntry) {
        plan.push({
          sourceRel,
          targetRel,
          sourceAbs,
          targetAbs,
          action: "conflict",
          reason: "formal user-rules entry and router are incomplete; upgrade stops instead of creating, replacing, or inferring ownership"
        });
      } else {
        plan.push({
          sourceRel,
          targetRel,
          sourceAbs,
          targetAbs,
          action: "merge",
          mergedText: routerText,
          reason: "transition verified formal user-rules state atomically with the Kit base"
        });
      }
      continue;
    }
    if (await exists(targetAbs)) {
      const targetBytes = await readOptionalBuffer(targetAbs);
      const targetText = decodeUtf8(targetBytes, targetRel).text;
      plan.push(classifyExistingFile(command, sourceRel, targetRel, sourceAbs, targetAbs, sourceText, targetText, context, targetBytes));
      continue;
    }
    const misplacedRel = targetRel.startsWith("dev/rules/")
      ? path.join("dev", path.basename(targetRel)).replaceAll(path.sep, "/")
      : null;
    const reason = misplacedRel && await exists(path.join(root, misplacedRel))
      ? `same-named rules file appears one level up at ${misplacedRel}; create correct dev/rules/ copy without deleting or moving the misplaced file`
      : undefined;
    plan.push({
      sourceRel,
      targetRel,
      sourceAbs,
      targetAbs,
      action: "create",
      ...(reason ? { reason } : {})
    });
  }
  return plan;
}

async function readTemplateSource(command, sourceRel, targetRel, sourceAbs) {
  return readFile(sourceAbs, "utf8");
}

function countHistoricalOfficialSignals(context) {
  if (!isStableSemver(context.currentVersion)) return 0;
  return [...context.officialOrigins.values()].filter((origin) => (
    origin.rawExactVersions.length > 0
    && !origin.rawExactVersions.includes(context.currentVersion)
    && origin.rawExactVersions.every((version) => isStableSemver(version) && compareSemver(version, context.currentVersion) < 0)
  )).length;
}

function selectTrustedOfficialBaseline(context) {
  const version = context.rootTemplateVersion;
  if (!isStableSemver(version) || !context.officialCatalog?.releases?.[version]) return null;
  const dynamicTargets = new Set(["START_NEXT_SESSION_PROMPT.txt", "dev/SESSION_HANDOFF.md", "dev/PROJECT_INDEX.md"]);
  // Normalized/canonical identity only selects a historical baseline for a
  // preserve decision. It never reaches trustedOfficialOrigin(), which keeps
  // raw byte equality as the sole authority to replace Kit-managed content.
  let baselineSupport = 0;
  let contradiction = false;
  for (const [targetRel, origin] of context.officialOrigins) {
    const candidates = [...new Set([...origin.rawExactVersions, ...origin.exactVersions, ...origin.canonicalVersions])];
    if (candidates.length === 0) continue;
    if (!candidates.includes(version)) contradiction = true;
    else if (!dynamicTargets.has(targetRel) && (origin.rawExactVersions.includes(version) || origin.exactVersions.includes(version))) baselineSupport += 1;
  }
  return !contradiction && baselineSupport >= 2 ? version : null;
}

function trustedOfficialOrigin(targetRel, context) {
  const origin = context.officialOrigins?.get(targetRel);
  if (!origin) return null;
  if (origin.rawExact) return { kind: "raw-exact", versions: origin.rawExactVersions };
  return null;
}

function requiresHistoricalBaselineProof(context) {
  if (!isStableSemver(context.currentVersion)) return false;
  if (!context.rootTemplateVersion) return context.historicalOfficialEvidence;
  return Boolean(
    isStableSemver(context.rootTemplateVersion)
    && context.officialCatalog?.releases?.[context.rootTemplateVersion]
    && compareSemver(context.rootTemplateVersion, context.currentVersion) < 0
  );
}

async function readRootTemplateVersion(root) {
  return await readProjectIndexTemplateVersion(root);
}

function findArtifactBoundManagedCoreSegment(bytes, artifactSegment) {
  const boundary = findUniqueManagedCoreBoundary(bytes, artifactSegment.transform);
  if (!boundary) return null;
  const core = bytes.subarray(boundary.start, boundary.end);
  const witness = byteWitness(core);
  if (witness.sha256 !== artifactSegment.transform.core.sha256 || witness.bytes !== artifactSegment.transform.core.bytes) return null;
  return Object.freeze({ ...boundary, ...witness });
}

function findUniqueManagedCoreBoundary(bytes, transform) {
  const begin = Buffer.from(`${transform.beginMarker}\n`, "utf8");
  const end = Buffer.from(`\n${transform.endMarker}`, "utf8");
  const beginIndex = bytes.indexOf(begin);
  if (beginIndex < 0 || bytes.indexOf(begin, beginIndex + begin.length) >= 0) return null;
  const start = beginIndex + begin.length;
  const endIndex = bytes.indexOf(end, start);
  if (endIndex < 0 || bytes.indexOf(end, endIndex + end.length) >= 0) return null;
  return Object.freeze({ start, end: endIndex });
}

function classifyExistingFile(command, sourceRel, targetRel, sourceAbs, targetAbs, sourceText, targetText, context = {}, targetBytes = null) {
  const base = { sourceRel, targetRel, sourceAbs, targetAbs };
  if (targetText.replace(/\r\n/g, "\n") === sourceText.replace(/\r\n/g, "\n") && targetRel !== "AGENTS.md") return { ...base, action: "skip", reason: "already current" };
  if (targetRel === "AGENTS.md") {
    // Marker shape, titles, and pathname are never ownership evidence. Exact
    // official bytes may be replaced; otherwise current managed-core structure
    // decides whether a bounded merge is possible.
    if (command === "upgrade") {
      const officialOrigin = trustedOfficialOrigin(targetRel, context);
      if (officialOrigin) {
        return {
          ...base,
          action: "merge",
          reason: "replace raw-exact official historical AGENTS.md core",
          mergedText: mergeManagedBlock(targetText, sourceText)
        };
      }
      const artifactSegment = context.trustedBaselineVersion
        ? getArtifactBoundManagedSegment({
          version: context.trustedBaselineVersion,
          targetRel,
          catalog: context.officialCatalog
        })
        : null;
      const sourceSegment = artifactSegment && targetBytes
        ? findArtifactBoundManagedCoreSegment(targetBytes, artifactSegment)
        : null;
      if (artifactSegment && sourceSegment) {
        const replacementCore = Buffer.from(sourceText.trim(), "utf8");
        const mergedBytes = Buffer.concat([
          targetBytes.subarray(0, sourceSegment.start),
          replacementCore,
          targetBytes.subarray(sourceSegment.end)
        ]);
        return {
          ...base,
          action: "merge",
          mergedBytes,
          managedSegmentRuntimeItem: {
            disposition: "replace-managed-segment",
            targetRel,
            conflictDecision: "artifact-bound-exact-managed-core",
            preservationKind: "artifact-bound-managed-core",
            artifactSegment,
            sourceSegment: {
              start: sourceSegment.start,
              end: sourceSegment.end,
              sha256: sourceSegment.sha256,
              bytes: sourceSegment.bytes
            }
          },
          reason: "replace only the artifact-bound exact AGENTS core; reconstruct and preserve every surrounding byte"
        };
      }
    }
    const health = assessAgentsMdHealth(targetText);
    if (health.state === "conflict") {
      return {
        ...base,
        action: "conflict",
        reason: `AGENTS.md managed-core markers are unpaired or duplicated (starts=${health.evidence.managedStart}, ends=${health.evidence.managedEnd})`
      };
    }
    if (health.state === "needs-merge") {
      return {
        ...base,
        action: "merge",
        reason: health.evidence.reason === "sandwich: managed marker + unmarked stale core"
          ? "replace sandwich dup core (managed marker + unmarked stale core present)"
          : health.evidence.reason === "legacy duplicate cores"
            ? "replace duplicated legacy Agent Handoff Kit cores"
            : "add managed core while preserving existing AGENTS.md content",
        mergedText: mergeManagedBlock(targetText, sourceText)
      };
    }
    // state === "clean": may still need legacy-core replacement or anchor catch-up
    if (health.evidence?.upgradeable === "legacy-core") {
      return {
        ...base,
        action: "merge",
        reason: "replace unmarked legacy Agent Handoff Kit core with managed-marker block",
        mergedText: mergeManagedBlock(targetText, sourceText)
      };
    }
    if (hasRequiredAnchor(targetRel, targetText)) {
      return { ...base, action: "skip", reason: "managed core clean and required anchors present" };
    }
    return {
      ...base,
      action: "merge",
      reason: "add managed core while preserving existing AGENTS.md content",
      mergedText: mergeManagedBlock(targetText, sourceText)
    };
  }
  if (targetRel === "dev/PROJECT_INDEX.md" && command === "upgrade") {
    const mergedProjectIndex = mergeProjectIndexGovernanceSections(targetText, sourceText);
    if (!mergedProjectIndex) {
      return {
        ...base,
        action: "conflict",
        reason: "PROJECT_INDEX.md must contain unique real H2 governance sections in the expected order; inline or fenced lookalikes are not sections"
      };
    }
    if (mergedProjectIndex !== targetText) {
      return {
        ...base,
        action: "merge",
        reason: "insert the missing Installed Integrations and Tool Operation References H2 sections while preserving all existing project content",
        mergedText: mergedProjectIndex
      };
    }
    return { ...base, action: "skip", reason: "PROJECT_INDEX.md governance sections current and structurally unique" };
  }
  if (targetRel === "dev/SESSION_HANDOFF.md" && command === "upgrade") {
    const migratedHandoff = migrateSessionHandoff(targetText, sourceText, context);
    if (!migratedHandoff) {
      return { ...base, action: "conflict", reason: "SESSION_HANDOFF.md lacks unique trusted state/opening boundaries; migration stopped without replacing project state" };
    }
    if (migratedHandoff.replace(/\r\n/g, "\n") !== targetText.replace(/\r\n/g, "\n")) {
      return { ...base, action: "merge", reason: "update handoff lifecycle/startup contracts while preserving current project state", mergedText: migratedHandoff };
    }
    return { ...base, action: "skip", reason: "SESSION_HANDOFF.md lifecycle and startup contracts current" };
  }
  if (targetRel === "dev/SESSION_LOG.md" && command === "upgrade") {
    const migratedLog = migrateSessionLog(targetText, sourceText);
    if (!migratedLog) {
      return { ...base, action: "conflict", reason: "SESSION_LOG.md lacks a unique trusted entry-template boundary; migration stopped without replacing trace history" };
    }
    if (migratedLog !== targetText) {
      return { ...base, action: "merge", reason: "update only the trusted current log preamble/template while preserving every historical trace entry", mergedText: migratedLog };
    }
    return { ...base, action: "skip", reason: "SESSION_LOG.md trace/template boundary current" };
  }
  const officialOrigin = command === "upgrade" ? trustedOfficialOrigin(targetRel, context) : null;
  if (officialOrigin) {
    return {
      ...base,
      action: "merge",
      reason: `replace raw-exact official historical ${targetRel} with the current Kit file`,
      mergedText: sourceText
    };
  }
  if (
    command === "upgrade"
    && installedFileContract(targetRel)?.strategy === "rule-pack"
    && requiresHistoricalBaselineProof(context)
    && !context.trustedBaselineVersion
  ) {
    return {
      ...base,
      action: "conflict",
      reason: `${targetRel} has local content but the version row and official file fingerprints do not identify one consistent historical baseline; upgrade stopped instead of guessing`
    };
  }
  // R-029/R-030: RULE_PACKS.md is a routing table, but upgrade still preserves
  // user-added rows. Missing maintainer rows are merged into the existing table
  // instead of replacing the whole file.
  if (targetRel === "dev/RULE_PACKS.md" && command === "upgrade") {
    const mergedRulePacks = mergeRulePacksRows(targetText, sourceText);
    if (!mergedRulePacks) {
      return { ...base, action: "conflict", reason: "RULE_PACKS.md must contain one valid routing table; marked official rows and local rows could not be separated safely" };
    }
    if (mergedRulePacks !== targetText) {
      return {
        ...base,
        action: "merge",
        reason: "update marker-identified official routing rows while preserving every unmarked local row",
        mergedText: mergedRulePacks
      };
    }
    return { ...base, action: "skip", reason: "official marked routes current; local rows preserved" };
  }
  // Governance bridge v0.3.27+: add the triggered review workflow to the
  // agent-governance pack only when the pack still has a trusted Checks section.
  if (targetRel === "dev/rules/agent-governance.md" && command === "upgrade" && (
    !targetText.includes("## Governance Bridge Workflow")
    || !targetText.includes("equivalent Chinese phrases")
    || !targetText.includes("scan for unbridged governance documents")
  )) {
    const mergedGovernancePack = mergeAgentGovernanceBridgeWorkflow(targetText, sourceText);
    if (!mergedGovernancePack) {
      return { ...base, action: "conflict", reason: "agent-governance pack structure was changed; manual merge required to add governance bridge workflow" };
    }
    return {
      ...base,
      action: "merge",
      reason: "insert governance bridge workflow into agent-governance pack without replacing local additions",
      mergedText: mergedGovernancePack
    };
  }
  // R-030 v0.3.0+: dev/rules/onboarding.md gets Scenario F auto-inserted before
  // ## Cross-reference to guide.html on upgrade if missing and the pack is not
  // a legacy pack whose structure cannot accept this bounded insertion safely.
  if (targetRel === "dev/rules/onboarding.md" && command === "upgrade" && !targetText.includes("Scenario F. External-tool governance")) {
    const sourceScenarioFMatch = sourceText.match(/(### Scenario F\. External-tool governance[\s\S]*?)(?=## Cross-reference to guide\.html)/);
    if (sourceScenarioFMatch && hasTrustedOnboardingScenarioLibrary(targetText)) {
      const scenarioFBlock = sourceScenarioFMatch[1];
      return {
        ...base,
        action: "merge",
        reason: "insert ### Scenario F block before ## Cross-reference to guide.html (R-030 onboarding pack migration; existing Scenarios A-E content preserved non-destructively)",
        mergedText: targetText.replace("## Cross-reference to guide.html", scenarioFBlock + "## Cross-reference to guide.html")
      };
    }
  }
  if (targetRel === "dev/rules/onboarding.md" && command === "upgrade" && !targetText.includes("Scenario A. Build systems, tools, platforms, websites, or apps")) {
    const mergedOnboarding = mergeOnboardingScenarioALabel(targetText);
    if (mergedOnboarding !== targetText) {
      return {
        ...base,
        action: "merge",
        reason: "update onboarding Scenario A wording from narrow coding label to broader system/tool/platform/app label",
        mergedText: mergedOnboarding
      };
    }
  }
  if (targetRel === "dev/rules/onboarding.md" && command === "upgrade" && !targetText.includes("Infer when sufficient; ask only when unresolved")) {
    const mergedOnboarding = mergeOnboardingDecisionFirstPolicy(targetText, sourceText);
    if (!mergedOnboarding) {
      return { ...base, action: "conflict", reason: "onboarding decision flow was customized or structurally changed; manual merge required rather than forcing the chooser-policy migration" };
    }
    return {
      ...base,
      action: "merge",
      reason: "replace the trusted mandatory chooser flow with decision-first onboarding while preserving scenario content and local sections",
      mergedText: mergedOnboarding
    };
  }
  if (command !== "upgrade") return { ...base, action: "skip", reason: "init preserves existing files" };
  if (targetRel === "START_NEXT_SESSION_PROMPT.txt" && command === "upgrade") {
    const mergedStartupGuidance = mergeLegacyFirstStartupGuidance(targetText, sourceText);
    if (mergedStartupGuidance && mergedStartupGuidance !== targetText) {
      return {
        ...base,
        action: "merge",
        reason: "replace the exact legacy first-start chooser sentence without changing surrounding project state",
        mergedText: mergedStartupGuidance
      };
    }
  }
  if (command === "upgrade" && hasAnchorRepairMarkerDrift(targetText)) {
    return { ...base, action: "conflict", reason: "legacy anchor repair block markers are incomplete or obsolete; manual semantic cleanup required before upgrade can safely continue" };
  }
  if (command === "upgrade" && (hasMissingRequiredAnchor(targetRel, targetText) || hasMisplacedRequiredAnchor(targetRel, targetText))) {
    const semanticRepair = mergeMissingRequiredAnchorsSemantically(targetRel, targetText, sourceText);
    if (semanticRepair) {
      return { ...base, ...semanticRepair };
    }
    if (hasMisplacedRequiredAnchor(targetRel, targetText)) {
      return { ...base, action: "conflict", reason: "required Kit anchors are present outside trusted semantic sections; upgrade stopped to avoid accepting naked anchor text as valid state" };
    }
    return { ...base, action: "conflict", reason: "required Kit anchors are missing but no safe semantic repair path exists; upgrade stopped without appending naked anchor text" };
  }
  if (targetRel === "CLAUDE.md" || targetRel === "GEMINI.md") {
    const bridgeFailure = bridgeTextFailure(targetRel, targetText);
    if (bridgeFailure) {
      return { ...base, action: "conflict", reason: `existing bridge is not an active one-hop route (${bridgeFailure})` };
    }
  }
  return { ...base, action: "skip", reason: "preserve existing file" };
}

function isUpgradeFromOlderTemplate(context) {
  const { rootTemplateVersion, currentVersion } = context;
  return isStableSemver(rootTemplateVersion)
    && isStableSemver(currentVersion)
    && compareSemver(rootTemplateVersion, currentVersion) < 0;
}

function mergeOnboardingScenarioALabel(targetText) {
  let merged = targetText;
  merged = merged.replace(
    /\*\*A\. 寫 \/ 改代碼項目\*\* —— 你有一個(?: project 的 codebase|程式項目)想長期維護/g,
    "**A. Build systems, tools, platforms, websites, or apps**: the user wants AI help to create or maintain a working project."
  );
  merged = merged.replace(
    /### Scenario A\. 寫 \/ 改代碼項目/g,
    "### Scenario A. Build systems, tools, platforms, websites, or apps"
  );
  merged = merged.replace(
    /### Scenario A\. 建構系統 \/ 工具 \/ 平台 \/ 網站或應用/g,
    "### Scenario A. Build systems, tools, platforms, websites, or apps"
  );
  return merged;
}

function mergeOnboardingDecisionFirstPolicy(targetText, sourceText) {
  const legacySignalLine = "- equivalent Chinese user phrases such as \"新手\", \"教我用\", \"我剛安裝\", \"點開始\", \"開工\", \"能力\", or \"能做甚麼\"";
  const currentSignalBoundary = "- equivalent Chinese user phrases such as \"新手\", \"教我用\", \"我剛安裝\", \"點開始\", \"能力\", or \"能做甚麼\"\n\n### Continuity startup boundary\n\n`Start Agent Handoff` / \"開工\" starts continuity and reads the minimum current handoff state; it is not an onboarding signal. A plain startup stops after its status card and recommended next action; a loaded objective alone does not authorize work. A same-message concrete task may begin normally. Only when no executable objective remains after state reading should the AI ask one concise question or offer the guided onboarding path. Explicit requests such as \"新手，教我用\" enter onboarding directly.";
  let working = targetText;
  let startupBoundaryChanged = false;
  if (working.includes(legacySignalLine) && !working.includes("### Continuity startup boundary")) {
    working = working.replace(legacySignalLine, currentSignalBoundary);
    startupBoundaryChanged = true;
  }

  const legacyStart = "### 2. Offer scenario choice before task execution";
  const legacyEnd = "### 5. Keep the first task small";
  const sourceStart = "### 2. Infer first; offer scenario choice only when needed";
  const sourceEnd = "### 5. Keep the first task small";
  const targetStartIndex = working.indexOf(legacyStart);
  const targetEndIndex = working.indexOf(legacyEnd);
  const sourceStartIndex = sourceText.indexOf(sourceStart);
  const sourceEndIndex = sourceText.indexOf(sourceEnd);
  if (targetStartIndex < 0 || targetEndIndex <= targetStartIndex) {
    return startupBoundaryChanged && working.includes("Infer when sufficient; ask only when unresolved") ? working : null;
  }
  if (sourceStartIndex < 0 || sourceEndIndex <= sourceStartIndex) return null;

  const legacyDecisionBlock = working.slice(targetStartIndex, targetEndIndex);
  const trustedLegacyPhrases = [
    "When onboarding applies, the first visible response must combine the startup card and scenario chooser",
    "After the user picks a scenario, guide one small first task through five steps",
    "Do not run all five steps in one message"
  ];
  if (!trustedLegacyPhrases.every((phrase) => legacyDecisionBlock.includes(phrase))) return null;

  const replacements = [
    [
      "Use this transient pack for first-time Agent Handoff Kit users, vague first messages, or fresh-install sessions where the user has not yet chosen a working scenario.",
      "Use this transient pack for first-time Agent Handoff Kit users who request guidance, or when the user's first-task intent remains genuinely unresolved after reading the available project state."
    ],
    [
      "- The first user message is short and vague.",
      "- The first user message is short and still genuinely vague after available project state is read."
    ],
    [
      "- `SESSION_HANDOFF` Active Objective is empty and Session count is 1.",
      "- `SESSION_HANDOFF` Active Objective is empty and Session count is 1, and the user has not already supplied a concrete objective with enough material facts."
    ],
    [
      "Each scenario keeps the same five-step rhythm. The model may adapt wording, but must preserve the intent, tone, and safety boundaries.",
      "Each scenario is a fallback guidance template, not a mandatory questionnaire. The model may skip answered steps, infer the route when evidence is sufficient, and adapt wording while preserving intent, tone, and safety boundaries."
    ],
    [
      "Step E.1: ask for four facts: objective, existing material or tools, technical comfort level, and the first small result the user wants.",
      "Step E.1: use any facts already provided, then ask only for missing information that materially affects the first safe action. Do not ask about technical comfort unless it changes the delivery approach."
    ],
    [
      "| Treating a vague first message as a specific task | The user may be trying to learn the workflow or choose a scenario. | Offer the A-F scenario chooser first. |",
      "| Treating a genuinely vague first message as a specific task | The user may be trying to learn the workflow or choose a scenario. | Offer the A-F scenario chooser only when the intent remains unresolved. |"
    ],
    [
      "| Running all five steps without waiting | The user loses control of the walk-through. | Pause for confirmation at each step. |",
      "| Forcing the chooser or all five guided steps after the objective is already concrete | The user must repeat known information and the AI shifts technical work back to the user. | Infer the scenario, state the assumption, and begin the first safe action; ask only for missing facts or required risk approval. |"
    ]
  ];
  if (!replacements.every(([before]) => working.includes(before))) return null;

  let merged = `${working.slice(0, targetStartIndex)}${sourceText.slice(sourceStartIndex, sourceEndIndex)}${working.slice(targetEndIndex)}`;
  for (const [before, after] of replacements) merged = merged.replace(before, after);
  return merged.includes("Infer when sufficient; ask only when unresolved")
    && !merged.includes("Offer scenario choice before task execution")
    && !merged.includes("Each scenario keeps the same five-step rhythm")
    ? merged
    : null;
}

function mergeLegacyFirstStartupGuidance(targetText, sourceText) {
  const legacySentence = "This is the first startup after installing Agent Handoff Kit. Load the onboarding guidance from dev/RULE_PACKS.md when appropriate. Help me choose the right working scenario, then guide me through the first task step by step.";
  if (!targetText.includes(legacySentence)) return targetText;
  const sourceSentence = sourceText.split(/\r?\n/).find((line) => (
    line.startsWith("This is the first startup after installing Agent Handoff Kit.")
    && line.includes("If my objective and the available project facts are already concrete")
    && line.includes("Offer the chooser only if my intent is genuinely unresolved")
  ));
  return sourceSentence ? targetText.replace(legacySentence, sourceSentence) : null;
}

function mergeAgentGovernanceBridgeWorkflow(targetText, sourceText) {
  const sourceRuleLine = sourceText.split(/\r?\n/).find((line) => line.startsWith("9. Governance bridge"));
  const workflowMatch = sourceText.match(/\n## Governance Bridge Workflow[\s\S]*?(?=\n## Generated Artifact Governance Workflow|\n## Checks)/);
  const sourceLoadWhenLine = sourceText.split(/\r?\n/).find((line) => line.startsWith("- User asks to bridge governance"));
  if (!sourceRuleLine || !workflowMatch || !targetText.includes("\n## Checks")) return null;

  let merged = targetText;
  const targetLoadWhenLine = merged.split(/\r?\n/).find((line) => line.startsWith("- User asks to bridge governance") || line.startsWith("- User asks to \"治理打通\""));
  if (sourceLoadWhenLine && targetLoadWhenLine && !targetLoadWhenLine.includes("scan for unbridged governance documents")) {
    merged = merged.replace(/- User asks to (?:bridge governance|"治理打通")[^\n]*\n/, `${sourceLoadWhenLine}\n`);
  }
  if (sourceLoadWhenLine && !targetLoadWhenLine && !merged.includes("equivalent Chinese phrases")) {
    const loadWhenMarker = "- A change affects `AGENTS.md`, `dev/*`, rule packs, installer templates, or durable workflow docs.";
    if (merged.includes(loadWhenMarker)) {
      merged = merged.replace(loadWhenMarker, `${loadWhenMarker}\n${sourceLoadWhenLine}`);
    }
  }
  if (/^9\. Governance bridge/m.test(merged)) {
    merged = merged.replace(/^9\. Governance bridge[^\n]*$/m, sourceRuleLine);
  } else if (!merged.includes(sourceRuleLine)) {
    merged = merged.replace(/\n## Governance Bridge Workflow|\n## Checks/, `\n${sourceRuleLine}$&`);
  }
  merged = removeAllSectionsByHeading(merged, "## Governance Bridge Workflow");
  merged = merged.replace(/\n## Checks/, `${workflowMatch[0]}\n## Checks`);
  if (!merged.includes("Governance bridge is a triggered review")) {
    return null;
  }
  if (!merged.includes("For governance bridge work, confirm the target file")) {
    merged = merged.replace(
      "- Confirm reusable operating procedure knowledge is not stored only in `dev/SESSION_HANDOFF.md`, `dev/SESSION_LOG.md`, or a decision narrative when it belongs in a pack or registered reference.",
      "- Confirm reusable operating procedure knowledge is not stored only in `dev/SESSION_HANDOFF.md`, `dev/SESSION_LOG.md`, or a decision narrative when it belongs in a pack or registered reference.\n- For governance bridge work, confirm the target file, project index, sync registry, related workflow, handoff/log role split, and duplicate-source risk were all checked or explicitly marked not applicable."
    );
  }
  return merged;
}

function removeAllSectionsByHeading(text, heading) {
  let result = text;
  while (true) {
    const start = result.indexOf(`\n${heading}`);
    if (start < 0) return result;
    const next = result.indexOf("\n## ", start + heading.length + 1);
    if (next < 0) return result.slice(0, start).trimEnd() + "\n";
    result = result.slice(0, start) + result.slice(next);
  }
}

function hasTrustedOnboardingScenarioLibrary(text) {
  const bounds = textSectionBounds(text, "## Application Scenario Library", "## Cross-reference to guide.html");
  if (!bounds) return false;
  const section = text.slice(bounds.start, bounds.end);
  return [
    "### Scenario A.",
    "### Scenario B.",
    "### Scenario C.",
    "### Scenario D.",
    "### Scenario E."
  ].every((headingText) => section.includes(headingText));
}

function hasMissingRequiredAnchor(targetRel, targetText, label = null) {
  return requiredAnchors
    .filter((rule) => rule.target === targetRel && (!label || rule.label === label))
    .some((rule) => requiredAnchorFailures(rule, targetText).some((failure) => failure.kind === "missing"));
}

function hasMisplacedRequiredAnchor(targetRel, targetText, label = null) {
  return requiredAnchors
    .filter((rule) => rule.target === targetRel && (!label || rule.label === label))
    .some((rule) => requiredAnchorFailures(rule, targetText).some((failure) => failure.kind === "misplaced"));
}

function hasAnchorRepairMarkerDrift(text) {
  const start = countText(text, "<!-- BEGIN Agent Handoff Kit anchor repair -->");
  const end = countText(text, "<!-- END Agent Handoff Kit anchor repair -->");
  return start > 0 || end > 0;
}

function countText(text, needle) {
  return text.split(needle).length - 1;
}

function countRegex(text, pattern) {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  return [...text.matchAll(new RegExp(pattern.source, flags))].length;
}

function missingRequiredAnchorSnippets(targetRel, targetText) {
  return [...new Set(requiredAnchors
    .filter((rule) => rule.target === targetRel)
    .flatMap((rule) => requiredAnchorFailures(rule, targetText)
      .map((failure) => failure.snippet)))];
}

function requiredAnchorFailures(rule, text) {
  return rule.snippets.flatMap((snippet) => {
    if (!text.includes(snippet)) return [{ kind: "missing", snippet }];
    if (!isRequiredAnchorSemanticallyPlaced(rule, snippet, text)) return [{ kind: "misplaced", snippet }];
    return [];
  });
}

function isRequiredAnchorSemanticallyPlaced(rule, snippet, text) {
  return rule.placement ? rule.placement(snippet, text) : true;
}

function sessionLogAnchorPlacement(snippet, text) {
  if (snippet === "ack:section:session-log-preamble") return countText(text, "ack:section:session-log-preamble") === 1;
  if (snippet === "ack:section:session-log-entry-template" || snippet === "## Entry Template") return Boolean(sessionLogEntryTemplateContract(text));
  if (snippet === "ack:log-entry:start" || snippet === "ack:log-entry:end") {
    return sessionLogEntryTemplateContains(text, snippet);
  }
  const preamble = [
    "Record what actually happened in the session",
    "kept, summarized, or archived",
    "Do not remove validation evidence",
    "full opening message never belongs in this log",
    "latest opening message",
    "not current state"
  ];
  if (preamble.includes(snippet)) return sessionLogPreambleContains(text, snippet);
  return sessionLogEntryTemplateContains(text, snippet);
}

function sessionLogPreambleContains(text, snippet) {
  const markerBounds = textSectionBounds(text, "<!-- ack:section:session-log-preamble -->", "<!-- ack:section:session-log-entry-template -->");
  if (markerBounds) return text.slice(markerBounds.start, markerBounds.end).includes(snippet);
  return snippetAppearsBeforeHeading(text, snippet, "## Entry Template");
}

function sessionLogEntryTemplateContains(text, snippet) {
  const contract = sessionLogEntryTemplateContract(text);
  return Boolean(contract && contract.templateText.includes(snippet));
}

function handoffContinuityAnchorPlacement(snippet, text) {
  const suffixContinuityAnchors = [
    "without searching old log history",
    "SESSION_LOG.md` carries recent evidence",
    "do not create an archive directory by default"
  ];
  if (suffixContinuityAnchors.includes(snippet)) {
    return snippetAppearsInSemanticSection(text, snippet, "handoff-sufficiency-check", "Handoff Sufficiency Check", "next-session-opening-message", "Next Session Opening Message");
  }
  return true;
}

function projectIndexAnchorPlacement(snippet, text) {
  if (snippet === "Agent Handoff Kit template version") return Boolean(parseProjectIndexTemplateVersion(text));
  return true;
}

function safetyAnchorPlacement(snippet, text) {
  return safetyAnchorHasTrustedRuleShape(text, snippet);
}

function projectDecisionsAnchorPlacement(snippet, text) {
  const preamble = [
    "Project Decisions Log",
    "warm narrative layer",
    "do not need to read this file at startup",
    "The AI updates it during closeout",
    "Evidence chain: Source=source:<id>; Summary=<source finding>; Inference=<reasoning>; Decision impact=<what changed>; Uncertainty=<limits or none>.",
    "This file does not store raw build / upload / QC evidence"
  ];
  if (preamble.includes(snippet)) return snippetAppearsBeforeHeading(text, snippet, "## Evolution Timeline");
  return true;
}

function onboardingAnchorPlacement(snippet, text) {
  if (snippet === "Continuity startup boundary" || snippet === "starts continuity and reads the minimum current handoff state; it is not an onboarding signal") {
    return snippetAppearsBetweenHeadings(text, snippet, "## Load When", "## Discipline");
  }
  if (snippet === "Infer when sufficient; ask only when unresolved") {
    return snippetAppearsBetweenHeadings(text, snippet, "## Discipline", "## Application Scenario Library");
  }
  if (snippet === "Application Scenario Library") {
    return Boolean(textSectionBounds(text, "## Application Scenario Library", "## Cross-reference to guide.html"));
  }
  if (/^Scenario [A-F]\./.test(snippet)) {
    return snippetAppearsBetweenHeadings(text, snippet, "## Application Scenario Library", "## Cross-reference to guide.html");
  }
  return true;
}

function integrationsAnchorPlacement(snippet, text) {
  if (snippet === "Credential Separation Principle" || snippet === "External Tool Usage Verification Gate" || snippet === "External Tool Resource Lifecycle" || snippet === "do not invent" || snippet === "input schema" || snippet === "official documentation" || snippet === "Source-of-truth Architecture" || snippet === "Cross-session Lifecycle" || snippet === "Runtime-Controlled Tool Operation Variants" || snippet === "Tool Operation References" || snippet === "Do not guess Chrome, Playwright, or DevTools commands" || snippet === "Local HTML / app validation fallback" || snippet === "`file://` rejection alone is not enough evidence to stop") {
    return snippetAppearsBetweenHeadings(text, snippet, "## Discipline", "## Rules");
  }
  if (snippet === "Connector-first default") {
    return snippetAppearsBetweenHeadings(text, snippet, "## Rules", "## Checks");
  }
  if (snippet === "Anti-pattern") return text.includes("## Anti-patterns") || text.includes("## Anti-pattern（不要做的事）");
  return true;
}

function snippetAppearsBeforeHeading(text, snippet, headingText) {
  const headingIndex = text.indexOf(headingText);
  if (headingIndex < 0) return false;
  return text.slice(0, headingIndex).includes(snippet);
}

function snippetAppearsAfterHeading(text, snippet, headingText) {
  const headingIndex = text.indexOf(headingText);
  if (headingIndex < 0) return false;
  return text.slice(headingIndex + headingText.length).includes(snippet);
}

function snippetAppearsBetweenHeadings(text, snippet, startHeading, endHeading) {
  const startIndex = text.indexOf(startHeading);
  const endIndex = text.indexOf(endHeading);
  if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) return false;
  return text.slice(startIndex + startHeading.length, endIndex).includes(snippet);
}

function snippetAppearsInSemanticSection(text, snippet, startId, startHeading, endId, endHeading) {
  const startMarker = `<!-- ack:section:${startId} -->`;
  const endMarker = `<!-- ack:section:${endId} -->`;
  const markerStart = text.indexOf(startMarker);
  const markerEnd = text.indexOf(endMarker, markerStart + startMarker.length);
  if (markerStart >= 0 && markerEnd > markerStart) {
    return text.slice(markerStart + startMarker.length, markerEnd).includes(snippet);
  }
  return snippetAppearsBetweenHeadings(text, snippet, `## ${startHeading}`, `## ${endHeading}`);
}

const semanticAnchorRepairStrategies = {
  "dev/PROJECT_INDEX.md": (targetText, sourceText) => {
    const mergedIndex = mergeProjectIndexTemplateVersionRow(targetText, sourceText);
    return mergedIndex ? {
      action: "merge",
      reason: "restore PROJECT_INDEX template version metadata row in ## Stack table",
      mergedText: mergedIndex
    } : null;
  },
  "dev/SESSION_LOG.md": (targetText, sourceText) => {
    const mergedLog = mergeSessionLogTemplateContract(targetText, sourceText);
    return mergedLog ? {
      action: "merge",
      reason: "restore SESSION_LOG machine boundaries and entry template contract",
      mergedText: mergedLog
    } : null;
  },
  "dev/PROJECT_DECISIONS.md": (targetText, sourceText, missing) => {
    const mergedDecisions = mergeProjectDecisionsPreamble(targetText, sourceText, missing);
    return mergedDecisions ? {
      action: "merge",
      reason: "restore PROJECT_DECISIONS onboarding preamble before ## Evolution Timeline",
      mergedText: mergedDecisions
    } : null;
  },
  "dev/rules/safety.md": (targetText, sourceText, missing) => {
    const mergedSafety = mergeSafetyRulesByMissingAnchors(targetText, sourceText, missing);
    return mergedSafety ? {
      action: "merge",
      reason: "restore safety pack high-risk rules in ## Rules section",
      mergedText: mergedSafety
    } : null;
  },
  "dev/rules/communication.md": (targetText, sourceText, missing) => {
    const mergedCommunication = mergeCommunicationNextStepDiscipline(targetText, sourceText, missing);
    return mergedCommunication ? {
      action: "merge",
      reason: "insert communication pack recommended next-step discipline without replacing local prose",
      mergedText: mergedCommunication
    } : null;
  },
  "dev/rules/onboarding.md": (targetText, sourceText) => {
    const mergedOnboarding = mergeOnboardingDecisionFirstPolicy(targetText, sourceText);
    return mergedOnboarding ? {
      action: "merge",
      reason: "restore decision-first onboarding in its trusted semantic sections",
      mergedText: mergedOnboarding
    } : null;
  },
  "dev/rules/integrations.md": (targetText, sourceText, missing) => {
    const mergedIntegrations = mergeIntegrationsSectionsByMissingAnchors(targetText, sourceText, missing);
    return mergedIntegrations ? {
      action: "merge",
      reason: "restore integrations verification and credential sections in semantic position",
      mergedText: mergedIntegrations
    } : null;
  }
};

function mergeMissingRequiredAnchorsSemantically(targetRel, targetText, sourceText) {
  const missing = missingRequiredAnchorSnippets(targetRel, targetText);
  if (missing.length === 0) return null;

  return semanticAnchorRepairStrategies[targetRel]?.(targetText, sourceText, missing) ?? null;
}

function insertSourcePreambleBeforeHeading(targetText, sourceText, headingText) {
  const targetIndex = targetText.indexOf(headingText);
  const sourceIndex = sourceText.indexOf(headingText);
  if (targetIndex < 0 || sourceIndex < 0) return null;
  const sourcePreamble = sourceText.slice(0, sourceIndex).trim();
  if (!sourcePreamble) return null;
  const targetBefore = targetText.slice(0, targetIndex).trimEnd();
  const targetAfter = targetText.slice(targetIndex);
  return `${targetBefore}\n\n${sourcePreamble}\n\n${targetAfter}`;
}

function mergeProjectDecisionsPreamble(targetText, sourceText, missing) {
  const evidenceSnippet = "Evidence chain: Source=source:<id>; Summary=<source finding>; Inference=<reasoning>; Decision impact=<what changed>; Uncertainty=<limits or none>.";
  const boundarySnippet = "This file does not store raw build / upload / QC evidence";
  const targetIndex = targetText.indexOf("## Evolution Timeline");
  const sourceIndex = sourceText.indexOf("## Evolution Timeline");
  if (targetIndex < 0 || sourceIndex < 0) return null;
  if (targetText.includes("Project Decisions Log")) {
    const sourcePreamble = sourceText.slice(0, sourceIndex).trim();
    const blocks = [];
    if (missing.includes(evidenceSnippet)) {
      const researchBlock = sourcePreamble.match(/Research-derived decisions use[\s\S]*?source map\./)?.[0];
      if (!researchBlock) return null;
      if (!targetText.includes(researchBlock)) blocks.push(researchBlock);
    }
    if (missing.includes(boundarySnippet)) {
      const boundaryBlock = sourcePreamble.match(/This file does not store raw build \/ upload \/ QC evidence[^\r\n]*/)?.[0];
      if (!boundaryBlock) return null;
      if (!targetText.includes(boundaryBlock)) blocks.push(boundaryBlock);
    }
    if (blocks.length > 0) {
      return `${targetText.slice(0, targetIndex).trimEnd()}\n\n${blocks.join("\n\n")}\n\n${targetText.slice(targetIndex)}`;
    }
    if (missing.includes(evidenceSnippet) || missing.includes(boundarySnippet)) return targetText;
  }
  return insertSourcePreambleBeforeHeading(targetText, sourceText, "## Evolution Timeline");
}

function mergeProjectIndexTemplateVersionRow(targetText, sourceText) {
  if (parseProjectIndexTemplateVersion(targetText)) return targetText;
  const sourceRow = projectIndexTemplateVersionRow(sourceText);
  if (!sourceRow) return null;
  const lines = targetText.split(/\r?\n/);
  const stackIndex = lines.findIndex((line) => line.trim() === "## Stack");
  if (stackIndex < 0) return null;
  const tableHeaderIndex = lines.findIndex((line, index) => index > stackIndex && line.trim() === "| Field | Value | Last verified |");
  if (tableHeaderIndex < 0) return null;
  const separatorIndex = tableHeaderIndex + 1;
  if (!lines[separatorIndex]?.startsWith("|---")) return null;
  lines.splice(separatorIndex + 1, 0, sourceRow);
  return lines.join("\n");
}

function mergeCommunicationNextStepDiscipline(targetText, sourceText, missing) {
  if (!missing.some((snippet) => snippet === "recommended next step" || snippet === "state it directly with a short reason" || snippet === "do not turn an already-made technical judgment into an open question")) return null;
  if (!targetText.includes("# Communication Pack")) return null;
  if (countText(targetText, "## Rules") !== 1 || countText(targetText, "## Checks") !== 1 || countText(targetText, "## Closeout") !== 1) return null;

  const sourceRule = sourceText.split(/\r?\n/).find((line) => line.includes("Give a clear recommended next step"));
  const sourceCheck = sourceText.split(/\r?\n/).find((line) => line.includes("Confirm user-facing next-step wording names the recommended action"));
  if (!sourceRule || !sourceCheck) return null;

  let merged = targetText;
  if (!merged.includes("Give a clear recommended next step")) {
    const rulesBounds = textSectionBounds(merged, "## Rules", "## Checks");
    if (!rulesBounds) return null;
    const rulesBlock = merged.slice(rulesBounds.start, rulesBounds.end);
    if (/^6\. /m.test(rulesBlock)) return null;
    merged = `${merged.slice(0, rulesBounds.end).trimEnd()}\n${sourceRule}\n\n${merged.slice(rulesBounds.end).trimStart()}`;
  }

  if (!merged.includes("Confirm user-facing next-step wording names the recommended action")) {
    const checksBounds = textSectionBounds(merged, "## Checks", "## Closeout");
    if (!checksBounds) return null;
    merged = `${merged.slice(0, checksBounds.end).trimEnd()}\n${sourceCheck}\n\n${merged.slice(checksBounds.end).trimStart()}`;
  }

  return merged === targetText ? null : merged;
}

function parseMarkdownH2Sections(text) {
  const sections = [];
  for (const line of markdownVisibleLinesOutsideHiddenBlocks(text)) {
    const headingMatch = /^## ([^#].*?)\s*$/u.exec(line.text);
    if (headingMatch) sections.push({ title: headingMatch[1], start: line.start, end: String(text).length });
  }
  for (let index = 0; index < sections.length - 1; index += 1) {
    sections[index].end = sections[index + 1].start;
  }
  return sections;
}

function uniqueSessionLogEntryTemplateSection(text) {
  const matches = parseMarkdownH2Sections(text).filter((section) => section.title === "Entry Template");
  return matches.length === 1 ? matches[0] : null;
}

function sessionLogTemplateFence(text, section) {
  if (!section) return null;
  const sectionText = text.slice(section.start, section.end);
  const matches = [...sectionText.matchAll(/^````markdown\s*\r?\n([\s\S]*?)\r?\n````\s*$/gm)];
  if (matches.length !== 1) return null;
  const match = matches[0];
  const templateOffset = match.index + match[0].indexOf(match[1]);
  return {
    start: section.start + match.index,
    end: section.start + match.index + match[0].length,
    templateStart: section.start + templateOffset,
    templateEnd: section.start + templateOffset + match[1].length,
    templateText: match[1]
  };
}

function sessionLogEntryTemplateContract(text) {
  const section = uniqueSessionLogEntryTemplateSection(text);
  if (!section) return null;
  const sectionMarker = "<!-- ack:section:session-log-entry-template -->";
  if (countText(text, sectionMarker) !== 1) return null;
  const markerIndex = text.indexOf(sectionMarker);
  if (markerIndex >= section.start || text.slice(markerIndex + sectionMarker.length, section.start).trim() !== "") return null;

  const fence = sessionLogTemplateFence(text, section);
  if (!fence) return null;
  const sectionText = text.slice(section.start, section.end);
  const startMarker = "<!-- ack:log-entry:start -->";
  const endMarker = "<!-- ack:log-entry:end -->";
  if (countText(sectionText, startMarker) !== 1 || countText(sectionText, endMarker) !== 1) return null;
  if (countText(fence.templateText, startMarker) !== 1 || countText(fence.templateText, endMarker) !== 1) return null;
  const relativeStart = fence.templateText.indexOf(startMarker);
  const relativeEnd = fence.templateText.indexOf(endMarker);
  if (relativeStart >= relativeEnd) return null;
  return {
    ...section,
    ...fence,
    entryStart: fence.templateStart + relativeStart,
    entryEnd: fence.templateStart + relativeEnd + endMarker.length
  };
}

function lcsLinePairs(left, right) {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const table = Array.from({ length: rows }, () => new Uint16Array(cols));
  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      table[i][j] = left[i] === right[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const pairs = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      pairs.push([i, j]);
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) i += 1;
    else j += 1;
  }
  return pairs;
}

function lineDiffHunks(base, changed) {
  const pairs = [...lcsLinePairs(base, changed), [base.length, changed.length]];
  const hunks = [];
  let baseCursor = 0;
  let changedCursor = 0;
  for (const [baseMatch, changedMatch] of pairs) {
    if (baseMatch > baseCursor || changedMatch > changedCursor) {
      hunks.push({ baseStart: baseCursor, baseEnd: baseMatch, added: changed.slice(changedCursor, changedMatch) });
    }
    baseCursor = baseMatch + 1;
    changedCursor = changedMatch + 1;
  }
  return hunks;
}

function hunksOverlap(left, right) {
  const leftInsertion = left.baseStart === left.baseEnd;
  const rightInsertion = right.baseStart === right.baseEnd;
  if (leftInsertion && rightInsertion) return false;
  if (leftInsertion) return left.baseStart > right.baseStart && left.baseStart < right.baseEnd;
  if (rightInsertion) return right.baseStart > left.baseStart && right.baseStart < left.baseEnd;
  return left.baseStart < right.baseEnd && right.baseStart < left.baseEnd;
}

function mapBaseBoundaryToChanged(base, changed, boundary) {
  if (boundary === 0) return 0;
  if (boundary === base.length) return changed.length;
  const pairs = lcsLinePairs(base, changed);
  const next = pairs.find(([baseIndex]) => baseIndex >= boundary);
  if (next) return next[1];
  const previous = [...pairs].reverse().find(([baseIndex]) => baseIndex < boundary);
  return previous ? previous[1] + 1 : null;
}

function threeWayPreserveLocalChanges(baseText, localText, currentText) {
  if (localText.replace(/\r\n/g, "\n") === currentText.replace(/\r\n/g, "\n")) return localText;
  const baseHadFinalNewline = /\r?\n$/.test(baseText);
  const localHadFinalNewline = /\r?\n$/.test(localText);
  const base = baseText.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
  const local = localText.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
  const current = currentText.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
  const localHunks = lineDiffHunks(base, local);
  const upstreamHunks = lineDiffHunks(base, current);
  if (localHunks.some((localHunk) => upstreamHunks.some((upstreamHunk) => hunksOverlap(localHunk, upstreamHunk)))) return null;

  const merged = [...current];
  const mapped = [];
  for (const hunk of localHunks) {
    const start = mapBaseBoundaryToChanged(base, current, hunk.baseStart);
    const end = mapBaseBoundaryToChanged(base, current, hunk.baseEnd);
    if (start == null || end == null || end < start) return null;
    mapped.push({ start, end, added: hunk.added });
  }
  for (const hunk of mapped.sort((a, b) => b.start - a.start)) merged.splice(hunk.start, hunk.end - hunk.start, ...hunk.added);
  const newline = localText.includes("\r\n") ? "\r\n" : "\n";
  return `${merged.join(newline)}${localHadFinalNewline || baseHadFinalNewline ? newline : ""}`;
}


function uniqueH2Section(text, title) {
  const matches = parseMarkdownH2Sections(text).filter((section) => section.title === title);
  return matches.length === 1 ? matches[0] : null;
}

function projectIndexGovernanceSectionsAreValid(text) {
  const installed = uniqueH2Section(text, "Installed Integrations");
  const toolRefs = uniqueH2Section(text, "Tool Operation References");
  const localQc = uniqueH2Section(text, "Local QC Commands");
  return Boolean(installed && toolRefs && localQc && installed.start < toolRefs.start && toolRefs.start < localQc.start);
}

function mergeProjectIndexGovernanceSections(targetText, sourceText) {
  const targetSections = parseMarkdownH2Sections(targetText);
  const sourceSections = parseMarkdownH2Sections(sourceText);
  const requiredTitles = ["Installed Integrations", "Tool Operation References", "Local QC Commands"];
  const targetByTitle = new Map(requiredTitles.map((title) => [title, targetSections.filter((section) => section.title === title)]));
  const sourceByTitle = new Map(requiredTitles.map((title) => [title, sourceSections.filter((section) => section.title === title)]));
  if (requiredTitles.some((title) => sourceByTitle.get(title).length !== 1)) return null;
  if (targetByTitle.get("Local QC Commands").length !== 1) return null;
  if (targetByTitle.get("Installed Integrations").length > 1 || targetByTitle.get("Tool Operation References").length > 1) return null;

  const installed = targetByTitle.get("Installed Integrations")[0];
  const toolRefs = targetByTitle.get("Tool Operation References")[0];
  const localQc = targetByTitle.get("Local QC Commands")[0];
  if ((installed && installed.start > localQc.start) || (toolRefs && toolRefs.start > localQc.start)) return null;
  if (installed && toolRefs && installed.start > toolRefs.start) return null;

  const missing = requiredTitles.slice(0, 2).filter((title) => targetByTitle.get(title).length === 0);
  let merged = targetText;
  if (missing.length > 0) {
    const newline = targetText.includes("\r\n") ? "\r\n" : "\n";
    const insertion = missing
      .map((title) => sourceText
        .slice(sourceByTitle.get(title)[0].start, sourceByTitle.get(title)[0].end)
        .replace(/\r\n|\r|\n/g, newline)
        .trimEnd())
      .join(`${newline}${newline}`);
    const prefix = targetText.slice(0, localQc.start);
    const hasExistingBlankLineBeforeInsertion = /(?:\r\n|\r|\n)(?:[ \t]*(?:\r\n|\r|\n))+$/u.test(prefix);
    const hasExistingLineBreakBeforeInsertion = /(?:\r\n|\r|\n)$/u.test(prefix);
    const beforeInsertion = hasExistingBlankLineBeforeInsertion
      ? ""
      : hasExistingLineBreakBeforeInsertion
      ? newline
      : `${newline}${newline}`;
    merged = `${prefix}${beforeInsertion}${insertion}${newline}${newline}${targetText.slice(localQc.start)}`;
  }
  return projectIndexGovernanceSectionsAreValid(merged) ? merged : null;
}

function mergeSafetyRulesByMissingAnchors(targetText, sourceText, missing) {
  if (!hasTrustedSafetyPackShape(targetText)) return null;
  const targetBounds = sectionBounds(targetText, "## Rules", "## Checks");
  const sourceBounds = sectionBounds(sourceText, "## Rules", "## Checks");
  if (!targetBounds || !sourceBounds) return null;
  const targetLines = targetText.split(/\r?\n/);
  const sourceLines = sourceText.split(/\r?\n/);
  const targetRuleStart = targetBounds.start + 1;
  const targetRuleEnd = targetBounds.end;
  const sourceRuleLines = sourceLines.slice(sourceBounds.start + 1, sourceBounds.end);

  let changed = false;
  const remainingMissing = [...missing];
  const appendableRules = [
    { snippet: "parser failure", number: "13" },
    { snippet: "Process termination and cache cleanup boundary", number: "14" },
    { snippet: "task-owned or agent-managed", number: "14" },
    { snippet: "other-agent-owned", number: "14" },
    { snippet: "Short-lived localhost validation services", number: "15" }
  ];
  for (const { snippet, number } of appendableRules) {
    if (!remainingMissing.includes(snippet) || targetText.includes(snippet)) continue;
    const sourceRule = sourceRuleLines.find((line) => line.includes(snippet));
    if (!sourceRule || !sourceRule.startsWith(`${number}. `)) return null;
    if (!targetLines.some((line, index) => index >= targetRuleStart && line.startsWith(`${number}. `))) {
      targetLines.splice(targetRuleEnd, 0, sourceRule);
      changed = true;
      remainingMissing.splice(remainingMissing.indexOf(snippet), 1);
      continue;
    }
    // If the numbered rule already exists, leave it for the same-shape replacement path below.
  }

  if (remainingMissing.includes("parser failure") && !targetText.includes("parser failure")) {
    const parserFailureRule = sourceRuleLines.find((line) => line.includes("parser failure"));
    if (!parserFailureRule || !parserFailureRule.startsWith("13. ")) return null;
    targetLines.splice(targetRuleEnd, 0, parserFailureRule);
    changed = true;
    remainingMissing.splice(remainingMissing.indexOf("parser failure"), 1);
  }

  const rule14Snippets = ["browser profiles", "desktop app sessions", "shared tool servers", "notebook kernels"];
  if (remainingMissing.some((snippet) => rule14Snippets.includes(snippet))) {
    const sourceRule14 = sourceRuleLines.find((line) => line.startsWith("14. ") && line.includes("Process termination and cache cleanup boundary"));
    const targetRule14Index = targetLines.findIndex((line, index) => index >= targetRuleStart && line.startsWith("14. "));
    if (!sourceRule14 || targetRule14Index < 0) return null;
    targetLines[targetRule14Index] = sourceRule14;
    changed = true;
    for (const snippet of rule14Snippets) {
      const index = remainingMissing.indexOf(snippet);
      if (index >= 0) remainingMissing.splice(index, 1);
    }
  }

  for (const snippet of remainingMissing) {
    const sourceLine = sourceRuleLines.find((line) => line.includes(snippet));
    if (!sourceLine) return null;
    const ruleNumber = sourceLine.match(/^(\d+)\. /)?.[1];
    if (!ruleNumber) return null;
    const targetIndex = targetLines.findIndex((line, index) => index >= targetRuleStart && line.startsWith(`${ruleNumber}. `));
    if (targetIndex < 0) return null;
    targetLines[targetIndex] = sourceLine;
    changed = true;
  }

  return changed ? targetLines.join("\n") : targetText;
}

function mergeIntegrationsSectionsByMissingAnchors(targetText, sourceText, missing) {
  let merged = targetText;
  let changed = false;

  if (missing.some((snippet) => snippet === "Credential Separation Principle" || snippet === "機密分離原則")) {
    const withCredential = replaceSectionByHeadingWithinBounds(
      merged,
      sourceText,
      /^### 1\. (Credential Separation Principle|機密分離原則|credential-separation anchor removed from this stale local copy)/m,
      /^### 2\. /m,
      "## Discipline",
      "## Rules"
    );
    if (!withCredential) return null;
    merged = withCredential;
    changed = true;
  }

  if (missing.some((snippet) => snippet === "External Tool Usage Verification Gate" || snippet === "External Tool Resource Lifecycle" || snippet === "other-agent-owned" || snippet === "do not invent" || snippet === "input schema" || snippet === "official documentation" || snippet === "Runtime-Controlled Tool Operation Variants" || snippet === "Tool Operation References" || snippet === "Do not guess Chrome, Playwright, or DevTools commands" || snippet === "Local HTML / app validation fallback" || snippet === "`file://` rejection alone is not enough evidence to stop")) {
    const withVerificationGate = mergeIntegrationsVerificationGateSection(merged, sourceText);
    if (!withVerificationGate) return null;
    merged = withVerificationGate;
    changed = true;
  }

  return changed ? merged : null;
}

function mergeIntegrationsVerificationGateSection(targetText, sourceText) {
  if (countText(targetText, "## Discipline") !== 1 || countText(targetText, "## Rules") !== 1) return null;
  const targetBounds = textSectionBounds(targetText, "## Discipline", "## Rules");
  const sourceBounds = textSectionBounds(sourceText, "## Discipline", "## Rules");
  if (!targetBounds || !sourceBounds) return null;

  const boundedTarget = targetText.slice(targetBounds.start, targetBounds.end);
  const boundedSource = sourceText.slice(sourceBounds.start, sourceBounds.end);
  const sourceSection = extractSection(boundedSource, /^### 2\. External Tool Usage Verification Gate/m, /^### 3\. /m);
  if (!sourceSection) return null;

  const existingTargetSection = extractSection(boundedTarget, /^### 2\. External Tool Usage Verification Gate/m, /^### 3\. /m);
  if (existingTargetSection) {
    return `${targetText.slice(0, targetBounds.start + existingTargetSection.start)}${sourceSection.text}${targetText.slice(targetBounds.start + existingTargetSection.end)}`;
  }

  const oldFourTypesHeading = /^### 2\. 四類整合嘅紀律差異/m.exec(boundedTarget);
  if (oldFourTypesHeading) {
    return `${targetText.slice(0, targetBounds.start + oldFourTypesHeading.index)}${sourceSection.text}${targetText.slice(targetBounds.start + oldFourTypesHeading.index)}`;
  }

  const currentFourTypesHeading = /^### 3\. 四類整合嘅紀律差異/m.exec(boundedTarget);
  if (currentFourTypesHeading) {
    return `${targetText.slice(0, targetBounds.start + currentFourTypesHeading.index)}${sourceSection.text}${targetText.slice(targetBounds.start + currentFourTypesHeading.index)}`;
  }

  const englishTypeHeading = /^### 3\. Integration Type Discipline/m.exec(boundedTarget);
  if (englishTypeHeading) {
    return `${targetText.slice(0, targetBounds.start + englishTypeHeading.index)}${sourceSection.text}${targetText.slice(targetBounds.start + englishTypeHeading.index)}`;
  }

  return null;
}

function hasTrustedSafetyPackShape(text) {
  return text.includes("# Safety Pack")
    && text.includes("## Scope")
    && Boolean(sectionBounds(text, "## Rules", "## Checks"))
    && text.includes("## Closeout");
}

function safetyAnchorHasTrustedRuleShape(text, snippet) {
  const bounds = sectionBounds(text, "## Rules", "## Checks");
  if (!bounds) return false;
  const lines = text.split(/\r?\n/).slice(bounds.start + 1, bounds.end);
  const line = lines.find((candidate) => candidate.includes(snippet));
  if (!line) return false;
  if (snippet === "cmd /c rmdir") {
    return line.includes("cmd /c rd")
      && line.includes("cmd.exe /c")
      && line.includes("combined with `rmdir` or `rd`")
      && line.includes("Prefer native PowerShell cmdlets")
      && line.includes("do not compose filesystem modification commands across shells");
  }
  if (snippet === "git reset --hard") {
    return line.includes("Never run")
      && line.includes("User request does not make these named commands permissible")
      && line.includes("git clean -fdx");
  }
  if (snippet === "secret values") {
    return line.includes("Do not print")
      && line.includes("log")
      && line.includes("commit")
      && line.includes("redacted placeholders");
  }
  if (snippet === "external APIs, SDKs, CLIs") {
    return line.includes("package managers")
      && line.includes("official documentation")
      && line.includes("project-local runbooks");
  }
  if (snippet === "parser failure") {
    return line.includes("same-pattern retries")
      && line.includes("minimal reproducible script")
      && line.includes("syntax-only check")
      && line.includes("read back the affected files");
  }
  return true;
}

function replaceSectionByHeadingWithinBounds(targetText, sourceText, startPattern, nextPattern, boundsStart, boundsEnd) {
  if (countText(targetText, boundsStart) !== 1 || countText(targetText, boundsEnd) !== 1) return null;
  const targetBounds = textSectionBounds(targetText, boundsStart, boundsEnd);
  const sourceBounds = textSectionBounds(sourceText, boundsStart, boundsEnd);
  if (!targetBounds || !sourceBounds) return null;

  const boundedTarget = targetText.slice(targetBounds.start, targetBounds.end);
  const boundedSource = sourceText.slice(sourceBounds.start, sourceBounds.end);
  if (countRegex(boundedTarget, startPattern) > 1 || countRegex(boundedTarget, nextPattern) !== 1) return null;
  const sourceSection = extractSection(boundedSource, startPattern, nextPattern);
  if (!sourceSection) return null;
  const targetSection = extractSection(boundedTarget, startPattern, nextPattern);
  if (targetSection) {
    return `${targetText.slice(0, targetBounds.start + targetSection.start)}${sourceSection.text}${targetText.slice(targetBounds.start + targetSection.end)}`;
  }
  const nextMatch = nextPattern.exec(boundedTarget);
  if (!nextMatch) return null;
  return `${targetText.slice(0, targetBounds.start + nextMatch.index)}${sourceSection.text}${targetText.slice(targetBounds.start + nextMatch.index)}`;
}

function replaceSectionByHeading(targetText, sourceText, startPattern, nextPattern) {
  const sourceSection = extractSection(sourceText, startPattern, nextPattern);
  if (!sourceSection) return null;
  const targetSection = extractSection(targetText, startPattern, nextPattern);
  if (targetSection) {
    return `${targetText.slice(0, targetSection.start)}${sourceSection.text}${targetText.slice(targetSection.end)}`;
  }
  const nextMatch = nextPattern.exec(targetText);
  if (!nextMatch) return null;
  return `${targetText.slice(0, nextMatch.index)}${sourceSection.text}${targetText.slice(nextMatch.index)}`;
}

function extractSection(text, startPattern, nextPattern) {
  const startMatch = startPattern.exec(text);
  if (!startMatch) return null;
  const afterStart = text.slice(startMatch.index + startMatch[0].length);
  const nextMatch = nextPattern.exec(afterStart);
  const end = nextMatch ? startMatch.index + startMatch[0].length + nextMatch.index : text.length;
  return { start: startMatch.index, end, text: text.slice(startMatch.index, end) };
}

function sectionBounds(text, startHeading, endHeading) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === startHeading);
  if (start < 0) return null;
  const end = lines.findIndex((line, index) => index > start && line.trim() === endHeading);
  if (end < 0) return null;
  return { start, end };
}

function textSectionBounds(text, startHeading, endHeading) {
  const startIndex = text.indexOf(startHeading);
  if (startIndex < 0) return null;
  const endIndex = text.indexOf(endHeading, startIndex + startHeading.length);
  if (endIndex < 0) return null;
  return { start: startIndex, end: endIndex };
}

function migrateSessionHandoff(targetText, sourceText, context = {}) {
  if (countText(targetText, "## Next Session Opening Message") !== 1) return null;
  let merged = mergeLegacyFirstStartupGuidance(targetText, sourceText) ?? targetText;

  if (!merged.includes("ack:field:lifecycle-conflicts-resolved")) {
    merged = mergeHandoffLifecycleField(merged);
    if (!merged) return null;
  }
  merged = ensureCurrentHandoffMigrationFields(merged);
  if (!merged) return null;
  if (isUpgradeFromOlderTemplate(context)
    && isPlaceholderLifecycleFieldValue(fieldValueAfterMarker(merged, "lifecycle-conflicts-resolved"))
    && hasSubstantiveHandoffState(merged)) {
    merged = reclassifyExistingHandoffLifecyclePlaceholder(merged);
    if (!merged) return null;
  }

  if (!merged.includes("ack:field:first-use-guidance-state")) {
    const nextMarker = "<!-- ack:section:task-understanding-summary -->";
    if (!merged.includes(nextMarker)) return null;
    const field = "<!-- ack:field:first-use-guidance-state -->\n5. First-use guidance state: not_applicable — added by upgrade; prior use state is preserved and onboarding is not reactivated.\n\n";
    merged = merged.replace(nextMarker, `${field}${nextMarker}`);
  }

  const archiveRule = mergeHandoffArchiveContinuityRule(merged, sourceText);
  if (!archiveRule) return null;
  merged = archiveRule;

  const targetBounds = handoffSectionContentBounds(merged, "next-session-opening-message", "Next Session Opening Message");
  const sourceBounds = handoffSectionContentBounds(sourceText, "next-session-opening-message", "Next Session Opening Message");
  if (!targetBounds || !sourceBounds) return null;
  const targetSection = merged.slice(targetBounds.start, targetBounds.end);
  const sourceSection = sourceText.slice(sourceBounds.start, sourceBounds.end);
  const targetPrompt = targetSection.match(/```text\s*\r?\n([\s\S]*?)\r?\n```/);
  const sourcePrompt = sourceSection.match(/```text\s*\r?\n([\s\S]*?)\r?\n```/);
  if (!targetPrompt || !sourcePrompt) return null;
  const existingRoot = targetPrompt[1].match(/^Work in (.+?)\. Read AGENTS\.md,/m)?.[1] ?? "<absolute project root>";
  const currentPrompt = sourcePrompt[1].replace("<absolute project root>", existingRoot);
  const updatedSection = targetSection.replace(targetPrompt[0], `\`\`\`text\n${currentPrompt}\n\`\`\``);
  merged = `${merged.slice(0, targetBounds.start)}${updatedSection}${merged.slice(targetBounds.end)}`;

  const temperatureRepair = repairHandoffCurrentStateEvidenceBoundary(merged);
  return temperatureRepair.text;
}

function migrateSessionLog(targetText, sourceText) {
  let merged = mergeSessionLogTemplateContract(targetText, sourceText);
  if (!merged) return null;
  merged = mergeSessionLogEvidenceDispositionField(merged);
  if (!merged) return null;

  const targetContract = sessionLogEntryTemplateContract(merged);
  const sourceContract = sessionLogEntryTemplateContract(sourceText);
  if (!targetContract || !sourceContract) return null;
  merged = `${merged.slice(0, targetContract.entryStart)}${sourceText.slice(sourceContract.entryStart, sourceContract.entryEnd)}${merged.slice(targetContract.entryEnd)}`;
  return merged;
}

function mergeHandoffLifecycleField(targetText) {
  const openingMarker = "<!-- ack:field:opening-message-matches-current-state -->";
  if (!targetText.includes(openingMarker)) return null;

  const fieldBlock = "<!-- ack:field:lifecycle-conflicts-resolved -->\n- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: Reclassified at upgrade: field added by v0.3.6+ migration; pre-existing handoff state predates it; reconcile at next closeout.\n";
  let merged = targetText.replace(openingMarker, `${fieldBlock}${openingMarker}`);
  return ensureCurrentHandoffMigrationFields(merged);
}

function reclassifyExistingHandoffLifecyclePlaceholder(targetText) {
  const marker = "ack:field:lifecycle-conflicts-resolved";
  const lines = targetText.split(/\r?\n/);
  const markerIndex = lines.findIndex((line) => line.includes(marker));
  if (markerIndex < 0) return null;

  const nextMarkerIndex = lines.findIndex((line, index) => index > markerIndex && line.includes("<!-- ack:"));
  const searchEnd = nextMarkerIndex < 0 ? lines.length : nextMarkerIndex;
  const fieldIndex = lines.findIndex((line, index) => index > markerIndex && index < searchEnd && line.trim().startsWith("- "));
  if (fieldIndex < 0) return null;

  const colonIndex = lines[fieldIndex].indexOf(":");
  if (colonIndex < 0) return null;
  lines[fieldIndex] = `${lines[fieldIndex].slice(0, colonIndex + 1)} Reclassified at upgrade: existing lifecycle placeholder predates this version; pre-existing handoff state predates this check; reconcile at next closeout.`;

  return ensureHandoffStateReconciliationRules(lines.join("\n"));
}

function mergeHandoffPersistenceRoutingField(targetText) {
  const merged = ensureCurrentHandoffMigrationFields(targetText);
  if (!merged || merged === targetText) return null;
  return merged;
}

function mergeHandoffRecommendedNextStepDiscipline(targetText) {
  const merged = ensureCurrentHandoffMigrationFields(targetText);
  if (!merged || merged === targetText) return null;
  return merged;
}

function ensureCurrentHandoffMigrationFields(targetText) {
  let merged = ensureHandoffCloseoutOutcomeFields(targetText);
  if (!merged) return null;
  merged = ensureHandoffPersistenceRoutingField(merged);
  if (!merged) return null;
  merged = ensureHandoffRecommendedNextStepField(merged);
  if (!merged) return null;
  merged = ensureHandoffRecommendedNextPriorityLine(merged);
  if (!merged) return null;
  return ensureHandoffStateReconciliationRules(merged);
}

function ensureHandoffPersistenceRoutingField(targetText) {
  if (targetText.includes("ack:field:persistence-routing-checked")) return targetText;
  const openingMarker = "<!-- ack:field:opening-message-matches-current-state -->";
  if (!targetText.includes(openingMarker)) return null;
  const fieldBlock = "<!-- ack:field:persistence-routing-checked -->\n- Persistence routing checked: Reclassified at upgrade: field added by template migration; pre-existing handoff state predates it; reconcile at next closeout.\n";
  return targetText.replace(openingMarker, `${fieldBlock}${openingMarker}`);
}

function ensureHandoffRecommendedNextStepField(targetText) {
  if (targetText.includes("ack:field:recommended-next-step-explicit")) return targetText;
  const openingMarker = "<!-- ack:field:opening-message-matches-current-state -->";
  if (!targetText.includes(openingMarker)) return null;
  const fieldBlock = "<!-- ack:field:recommended-next-step-explicit -->\n- Recommended next step is explicit and reasoned: Reclassified at upgrade: field added by template migration; confirm at next closeout.\n";
  return targetText.replace(openingMarker, `${fieldBlock}${openingMarker}`);
}

function ensureHandoffRecommendedNextPriorityLine(targetText) {
  if (/^Recommended next step:/m.test(targetText)) return targetText;
  const marker = "<!-- ack:section:next-priorities -->";
  const markerIndex = targetText.indexOf(marker);
  if (markerIndex < 0) return null;
  const afterMarker = targetText.slice(markerIndex);
  const headingMatch = /^##\s+.+$/m.exec(afterMarker);
  if (!headingMatch) return null;
  const headingIndex = markerIndex + headingMatch.index;
  const headingEnd = targetText.indexOf("\n", headingIndex);
  if (headingEnd < 0) return null;
  return `${targetText.slice(0, headingEnd + 1)}\nRecommended next step: Reclassified at upgrade — reason: confirm at next closeout.\n${targetText.slice(headingEnd + 1)}`;
}

function ensureHandoffStateReconciliationRules(targetText) {
  if (!targetText) return null;
  const rules = [];
  if (!targetText.includes("Lifecycle consistency rule: compare `Completed This Session`")) {
    rules.push("Lifecycle consistency rule: compare `Completed This Session`, `Validation / QC`, `Next Priorities`, `Risks / Blockers`, and `Next Session Opening Message`. A completed or verified item must not remain as an unresolved next priority, active risk, or startup instruction unless it is explicitly reclassified as monitor-only, follow-up scope, blocked, or reopened with the missing evidence or trigger condition stated.");
  }
  if (!targetText.includes("Persistence routing rule: one-time delivery instructions")) {
    rules.push("Persistence routing rule: one-time delivery instructions, historical validation evidence, old hashes, old version facts, and incident notes must stay in trace evidence unless they still affect the next action.");
  }
  if (!targetText.includes("Recommended next-step rule:")) {
    rules.push("Recommended next-step rule: `Next Priorities` must name the single recommended next action and a short reason before listing additional options, unless the next action is blocked or genuinely requires a user decision.");
  }
  if (rules.length === 0) return targetText;
  const ruleBlock = `${rules.join("\n")}\n\n`;
  const sufficiencyMarker = "<!-- ack:section:handoff-sufficiency-check -->";
  if (targetText.includes(sufficiencyMarker)) {
    return targetText.replace(sufficiencyMarker, `${ruleBlock}${sufficiencyMarker}`);
  }
  return `${targetText.trimEnd()}\n\n${ruleBlock}`;
}

function mergeSessionLogEvidenceDispositionField(targetText) {
  const contract = sessionLogEntryTemplateContract(targetText);
  if (!contract) return null;
  if (contract.templateText.includes("- **Evidence disposition:**")) return targetText;
  const qcField = "- **QC:**";
  if (countText(contract.templateText, qcField) !== 1) return null;
  const withEvidenceTemplate = contract.templateText.replace(qcField, `${qcField}\n- **Evidence disposition:** <one-time only / kept as recent trace evidence / absorbed into handoff / indexed in PROJECT_INDEX / promoted to PROJECT_DECISIONS / promoted to rule pack>`);
  return `${targetText.slice(0, contract.templateStart)}${withEvidenceTemplate}${targetText.slice(contract.templateEnd)}`;
}

function mergeSessionLogTemplateContract(targetText, sourceText = null) {
  let merged = targetText;
  let changed = false;

  const initialSection = uniqueSessionLogEntryTemplateSection(merged);
  if (!initialSection) return null;

  if (!merged.includes("ack:section:session-log-preamble")) {
    const titleMatch = /^# Session Log\s*$/m.exec(merged);
    if (titleMatch) {
      const insertAt = titleMatch.index + titleMatch[0].length;
      merged = `${merged.slice(0, insertAt)}\n\n<!-- ack:section:session-log-preamble -->${merged.slice(insertAt)}`;
      changed = true;
    } else if (sourceText?.includes("ack:section:session-log-preamble")) {
      const sourcePreambleMarker = "<!-- ack:section:session-log-preamble -->";
      merged = `${sourcePreambleMarker}\n\n${merged}`;
      changed = true;
    }
  }

  const sectionMarker = "<!-- ack:section:session-log-entry-template -->";
  const sectionMarkerCount = countText(merged, sectionMarker);
  if (sectionMarkerCount > 1) return null;
  if (sectionMarkerCount === 0) {
    const currentSection = uniqueSessionLogEntryTemplateSection(merged);
    if (!currentSection) return null;
    merged = `${merged.slice(0, currentSection.start)}${sectionMarker}\n\n${merged.slice(currentSection.start)}`;
    changed = true;
  } else {
    const currentSection = uniqueSessionLogEntryTemplateSection(merged);
    const markerIndex = merged.indexOf(sectionMarker);
    if (!currentSection || markerIndex >= currentSection.start || merged.slice(markerIndex + sectionMarker.length, currentSection.start).trim() !== "") return null;
  }

  if (sourceText) {
    const restored = restoreMissingSessionLogPreambleLines(merged, sourceText);
    if (restored !== merged) {
      merged = restored;
      changed = true;
    }
  }

  const section = uniqueSessionLogEntryTemplateSection(merged);
  const fence = sessionLogTemplateFence(merged, section);
  if (!section || !fence) return null;
  const startMarker = "<!-- ack:log-entry:start -->";
  const endMarker = "<!-- ack:log-entry:end -->";
  const sectionText = merged.slice(section.start, section.end);
  if (countText(sectionText, startMarker) > 1 || countText(sectionText, endMarker) > 1) return null;
  let templateText = fence.templateText;
  if (!templateText.includes(startMarker)) {
    templateText = `${startMarker}\n${templateText}`;
    changed = true;
  }
  if (!templateText.includes(endMarker)) {
    templateText = `${templateText.trimEnd()}\n${endMarker}`;
    changed = true;
  }
  if (templateText !== fence.templateText) {
    merged = `${merged.slice(0, fence.templateStart)}${templateText}${merged.slice(fence.templateEnd)}`;
  }

  if (!sessionLogEntryTemplateContract(merged)) return null;

  return changed ? merged : targetText;
}

function restoreMissingSessionLogPreambleLines(targetText, sourceText) {
  const sourceEntryIndex = sourceText.search(/^## Entry Template\s*$/m);
  const targetEntryMarkerIndex = targetText.indexOf("<!-- ack:section:session-log-entry-template -->");
  const targetEntryHeadingIndex = targetText.search(/^## Entry Template\s*$/m);
  const insertIndex = targetEntryMarkerIndex >= 0 ? targetEntryMarkerIndex : targetEntryHeadingIndex;
  if (sourceEntryIndex < 0 || insertIndex < 0) return targetText;

  const sourcePreamble = sourceText.slice(0, sourceEntryIndex);
  const missingLines = [
    "Record what actually happened in the session",
    "kept, summarized, or archived",
    "Do not remove validation evidence",
    "full opening message never belongs",
    "latest opening message",
    "not current state"
  ].flatMap((snippet) => {
    if (targetText.includes(snippet)) return [];
    const line = sourcePreamble.split(/\r?\n/).find((candidate) => candidate.includes(snippet));
    return line ? [line] : [];
  });

  if (missingLines.length === 0) return targetText;
  return `${targetText.slice(0, insertIndex).trimEnd()}\n\n${missingLines.join("\n\n")}\n\n${targetText.slice(insertIndex)}`;
}

function mergeHandoffArchiveContinuityRule(targetText, sourceText) {
  const sourceMatch = sourceText.match(/Continuity rule: this file carries current state and next action\.[^\r\n]*/);
  if (!sourceMatch) return null;
  const continuityRule = sourceMatch[0];
  if (targetText.includes(continuityRule)) return targetText;

  const existingRulePattern = /Continuity rule: this file carries current state and next action\.[^\r\n]*/;
  if (existingRulePattern.test(targetText)) {
    return targetText.replace(existingRulePattern, continuityRule);
  }

  const nextSectionMarker = "<!-- ack:section:next-session-opening-message -->";
  if (targetText.includes(nextSectionMarker)) {
    return targetText.replace(nextSectionMarker, `${continuityRule}\n\n${nextSectionMarker}`);
  }

  const sufficiencyMarker = "<!-- ack:section:handoff-sufficiency-check -->";
  if (targetText.includes(sufficiencyMarker)) {
    return `${targetText.trimEnd()}\n\n${continuityRule}\n`;
  }

  return null;
}

function mergeRulePacksRows(targetText, sourceText) {
  const sourceRows = sourceText.split(/\r?\n/).filter((line) => /^\|.*<!-- ack:route:[a-z0-9-]+ -->/.test(line));
  const sourceById = new Map(sourceRows.map((row) => [routeMarkerId(row), row]));
  if (sourceById.size === 0 || sourceById.size !== sourceRows.length) return null;

  const lines = targetText.split(/\r?\n/);
  const headerIndexes = lines.map((line, index) => line.trim() === "| Task signal | Pack | Purpose |" ? index : -1).filter((index) => index >= 0);
  if (headerIndexes.length !== 1) return null;
  const tableStart = headerIndexes[0];
  if (!/^\|[-\s|]+\|$/.test(lines[tableStart + 1]?.trim() ?? "")) return null;
  let tableEnd = tableStart + 2;
  while (tableEnd < lines.length && lines[tableEnd].startsWith("|")) tableEnd += 1;

  const seen = new Set();
  const localRows = [];
  const replacedRows = [];
  for (const row of lines.slice(tableStart + 2, tableEnd)) {
    const markedId = routeMarkerId(row);
    const legacyId = markedId ? null : knownOfficialLegacyRouteId(row);
    const id = markedId ?? legacyId;
    if (id && sourceById.has(id)) {
      if (seen.has(id)) return null;
      seen.add(id);
      replacedRows.push(sourceById.get(id));
      continue;
    }
    localRows.push(row);
  }

  const missingOfficialRows = sourceRows.filter((row) => !seen.has(routeMarkerId(row)));
  const mergedTable = [lines[tableStart], lines[tableStart + 1], ...missingOfficialRows, ...replacedRows, ...localRows];
  const originalTable = lines.slice(tableStart, tableEnd);
  if (mergedTable.join("\n") === originalTable.join("\n")) return targetText;
  return [...lines.slice(0, tableStart), ...mergedTable, ...lines.slice(tableEnd)].join("\n");
}

const knownOfficialLegacyRouteHashes = new Map([
  ["f2c36ac687929b03891b37fe79aace2c806d9d5027c43b7d280c386574e44c14", "onboarding"],
  ["3153da07fb53483eeb4a35cfff013f44c5a75d14b1a44ee536bcd85cbc3219c6", "governance-bridge"],
  ["d3379dc2984fb0f2a8f122c4efbf131b2da320e66845d4c5f1945300431879f3", "long-term-governance"],
  ["2011d8309aaa5d6cc76f7036e990355c472a5ed6ba81fcf8e0078b9a6c5f6ef1", "integration-use"],
  ["3fc0717cc408dbe96e8925a07f6315448abb0f38106dbe844a098d7ab84d37cc", "runtime-tool"],
  ["7cd99dbd30bbf7be9641f6a5fc7bf4c7cbe3efb3ab114fe1f19c254cd110612d", "resource-closeout"]
]);

function routeMarkerId(row) {
  return row.match(/<!-- ack:route:([a-z0-9-]+) -->/)?.[1] ?? null;
}

function knownOfficialLegacyRouteId(row) {
  return knownOfficialLegacyRouteHashes.get(sha256(Buffer.from(row.trim(), "utf8"))) ?? null;
}

// R-031.2 v0.3.2+: Version alignment assessment for doctor "項目狀態速覽".
// Compares CLI version (running), root template metadata version (in dev/PROJECT_INDEX.md),
// and npm latest. Surfaces drift awareness because previous design relied on startup
// maybePrintUpdateNotice which silently fails when npx auto-fetches latest (CLI version
// equals npm latest, so the notice never triggers, leaving user root drift invisible).
async function assessVersionAlignment(root, cliVersion, options = {}) {
  const indexPath = path.join(root, "dev/PROJECT_INDEX.md");
  let rootVersion = null;
  try {
    const text = await readFile(indexPath, "utf8");
    rootVersion = parseProjectIndexTemplateVersion(text);
  } catch {
    // file missing or unreadable; rootVersion stays null
  }

  let npmLatest = null;
  if (!options.skipRegistryLookup && !shouldSkipUpdateCheck()) {
    try {
      npmLatest = await fetchLatestVersion();
    } catch {
      // network failure; npmLatest stays null
    }
  }

  const acceptedVersion = isStableSemver(options.acceptedVersion ?? "")
    ? options.acceptedVersion
    : null;
  return { cliVersion, rootVersion, npmLatest, acceptedVersion };
}

function printVersionAlignment(result) {
  const { cliVersion, rootVersion, npmLatest, acceptedVersion } = result;
  if (acceptedVersion !== null) {
    const metadata = rootVersion === null ? "項目版本記錄缺失" : `項目記錄 v${rootVersion}${rootVersion === acceptedVersion ? "" : "（保留資料）"}`;
    console.log(`  📦 版本：工具 v${cliVersion} / 已接受目前狀態 v${acceptedVersion} / ${metadata} / npm latest ${npmLatest ? "v" + npmLatest : "無法查詢"}`);
    if (compareSemver(acceptedVersion, cliVersion) < 0) {
      console.log(`     項目已接受的狀態是 v${acceptedVersion}，目前工具是 v${cliVersion}；要升級時先執行：npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run`);
    } else if (compareSemver(acceptedVersion, cliVersion) > 0) {
      console.log(`     項目已接受的狀態比目前工具新；請先用較新的工具執行 doctor 或 upgrade，不會用舊工具把項目降級。`);
    }
    if (npmLatest && compareSemver(npmLatest, cliVersion) > 0) {
      console.log(`     npm 有新版（v${npmLatest}）；doctor 只檢查不修改。要使用最新版時先執行：npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run`);
      console.log("     --dry-run 只預覽、不寫入；確認計劃沒問題後，再去掉 --dry-run 正式升級。");
    }
    return;
  }
  if (rootVersion === null) {
    console.log(`  📦 版本：工具 v${cliVersion} / 項目版本記錄缺失（可能曾經手動編輯）/ npm latest ${npmLatest ? "v" + npmLatest : "無法查詢"}`);
    return;
  }
  if (npmLatest === null) {
    console.log(`  📦 版本：工具 v${cliVersion} / 項目記錄 v${rootVersion} / npm latest 無法查詢（網絡可能不通）`);
    return;
  }
  const aligned = cliVersion === rootVersion && rootVersion === npmLatest;
  if (aligned) {
    console.log(`  📦 版本：工具 / 項目記錄 / npm latest 三向對齊 v${cliVersion} ✅`);
    return;
  }
  console.log(`  📦 版本：工具 v${cliVersion} / 項目記錄 v${rootVersion} / npm latest v${npmLatest}`);
  if (npmLatest && compareSemver(npmLatest, cliVersion) > 0) {
    console.log(`     npm 有新版（v${npmLatest}）；doctor 只檢查不修改。要升級時先執行：npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run`);
    console.log("     --dry-run 只預覽、不寫入；確認計劃沒問題後，再去掉 --dry-run 正式升級。");
  } else if (cliVersion !== rootVersion) {
    console.log("     項目內記錄的 Kit 版本與目前工具版本不同；doctor 只檢查不修改。要對齊時先執行：npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run");
    console.log("     --dry-run 只預覽、不寫入；確認計劃沒問題後，再去掉 --dry-run 正式升級。");
  }
}

function getVersionAlignmentNextStep(result) {
  const { cliVersion, rootVersion, npmLatest, acceptedVersion } = result;
  if (acceptedVersion !== null) {
    if (compareSemver(acceptedVersion, cliVersion) > 0) {
      return `檢查已通過，但項目已接受的狀態是 v${acceptedVersion}，比目前工具 v${cliVersion} 新。請先使用較新的工具；doctor 不會用舊工具把項目降級。`;
    }
    if (npmLatest && compareSemver(npmLatest, cliVersion) > 0) {
      return `檢查已通過，npm 有新版 v${npmLatest}。doctor 沒有修改檔案；要升級時先執行 npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run。--dry-run 只預覽、不寫入；確認計劃沒問題後，再去掉 --dry-run 正式升級。`;
    }
    if (compareSemver(acceptedVersion, cliVersion) < 0) {
      return `檢查已通過，但項目已接受的狀態仍是 v${acceptedVersion}，目前工具是 v${cliVersion}。doctor 沒有修改檔案；要升級時先執行 npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run。--dry-run 只預覽、不寫入；確認後再去掉 --dry-run 正式升級。`;
    }
    return null;
  }
  if (npmLatest && compareSemver(npmLatest, cliVersion) > 0) {
    return `檢查已通過，但 npm 有新版 v${npmLatest}。doctor 沒有修改檔案；建議先執行 npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run。--dry-run 只預覽、不寫入；確認計劃沒問題後，再去掉 --dry-run 正式升級。`;
  }
  if (rootVersion === null) {
    return "檢查已通過，但項目版本記錄缺失。doctor 沒有修改檔案；建議先執行 npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run。--dry-run 只預覽、不寫入；確認只會補齊工具維護的版本記錄後，再去掉 --dry-run 正式升級。";
  }
  if (cliVersion !== rootVersion) {
    return "檢查已通過，但項目版本記錄未與目前工具對齊。doctor 沒有修改檔案；建議先執行 npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run。--dry-run 只預覽、不寫入；確認後再去掉 --dry-run 正式升級。";
  }
  return null;
}

// R-031.2 v0.3.2+: Last closeout assessment. Reads dev/SESSION_HANDOFF.md "Last Updated:"
// line (strict format, reliable). Falls back to dev/SESSION_LOG.md first H2 date if
// HANDOFF missing or unparseable.
async function assessLastCloseout(root) {
  const handoffPath = path.join(root, "dev/SESSION_HANDOFF.md");
  let date = null;
  try {
    const text = await readFile(handoffPath, "utf8");
    const m = text.match(/Last Updated:\s*(\d{4}-\d{2}-\d{2})/);
    if (m) date = m[1];
  } catch {
    // ignore
  }

  if (!date) {
    const logPath = path.join(root, "dev/SESSION_LOG.md");
    try {
      const text = await readFile(logPath, "utf8");
      const m = text.match(/^## (\d{4}-\d{2}-\d{2})/m);
      if (m) date = m[1];
    } catch {
      // ignore
    }
  }

  return { date };
}

function printLastCloseout(result) {
  if (!result.date) {
    console.log("  📅 上次收工：尚未收工過。準備結束本輪工作、需要保存交接、或有下一輪必須知道的狀態時，可以在 AI 對話輸入「收工」。");
    return;
  }
  const today = new Date();
  const closeout = new Date(result.date);
  const daysDiff = Math.floor((today - closeout) / (1000 * 60 * 60 * 24));
  if (daysDiff < 0) {
    console.log(`  📅 上次收工：${result.date}（日期超前？檢查系統時鐘）`);
  } else if (daysDiff === 0) {
    console.log(`  📅 上次收工：今日（${result.date}）`);
  } else if (daysDiff <= 30) {
    console.log(`  📅 上次收工：${daysDiff} 日前（${result.date}）`);
  } else {
    console.log(`  📅 上次收工：${daysDiff} 日前（${result.date}）— 建議輸入「收工」整理進度`);
  }
}

// R-031.2 v0.3.2+: Project age assessment. Reads the oldest folder timestamp in
// dev/governance_migrations/ which records the first install date. Read-only; doctor
// remains side-effect-free (no new write logic).
async function assessProjectAge(root) {
  const migrationsDir = path.join(root, "dev/governance_migrations");
  try {
    const entries = await readdir(migrationsDir);
    const dates = entries.map(parseMigrationDirectoryDate).filter(Boolean).sort();
    return { firstInstall: dates[0] ?? null };
  } catch {
    return { firstInstall: null };
  }
}

function parseMigrationDirectoryDate(name) {
  const legacy = /^(\d{4})(\d{2})(\d{2})T\d{6}Z$/.exec(name);
  if (legacy) return `${legacy[1]}-${legacy[2]}-${legacy[3]}`;
  const transaction = /^(\d{4})-(\d{2})-(\d{2})T\d{2}-\d{2}-\d{2}-\d{3}Z-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.exec(name);
  return transaction ? `${transaction[1]}-${transaction[2]}-${transaction[3]}` : null;
}

function printProjectAge(result) {
  if (!result.firstInstall) {
    console.log("  🌱 項目首次安裝距今：未知（dev/governance_migrations/ 未有 timestamp）");
    return;
  }
  const today = new Date();
  const firstInstall = new Date(result.firstInstall);
  const daysDiff = Math.floor((today - firstInstall) / (1000 * 60 * 60 * 24));
  if (daysDiff === 0) {
    console.log(`  🌱 項目首次安裝距今：今日（${result.firstInstall}）`);
  } else {
    console.log(`  🌱 項目首次安裝距今：${daysDiff} 日（自 ${result.firstInstall}）`);
  }
}

// R-010 SESSION_LOG handoff-role discipline (warn-only doctor check).
// Returns { ok, warnings } where:
// - ok: true if no warnings triggered
// - warnings: array of Chinese, actionable warning strings
// Thresholds (all warn-only; doctor exit unaffected):
// - H2 entry count ≥ 11 → warn (archive boundary; AI closeout flow should auto-advance)
// - H2 entry count ≥ 25 → warn (severe drift; suggest AI re-do closeout)
// - line count ≥ 1500 → warn (anomalous entry size; safety net)
async function assessSessionLogDiscipline(root) {
  const logPath = path.join(root, "dev/SESSION_LOG.md");
  let text = "";
  try {
    text = await readFile(logPath, "utf8");
  } catch {
    return { ok: false, warnings: ["dev/SESSION_LOG.md unreadable; discipline check skipped"] };
  }

  const warnings = [];
  const entryMatches = text.match(/^## \d{4}-\d{2}-\d{2}/gm) || [];
  const entryCount = entryMatches.length;
  const lineCount = text.split("\n").length;

  if (entryCount >= 25) {
    warnings.push(`SESSION_LOG entry count = ${entryCount}（嚴重超過 N=11+ archive 邊界；接力角色紀律下，AI closeout flow 應該已自動推進 N 規則，如未動請要求 AI 重做 closeout）`);
  } else if (entryCount >= 11) {
    warnings.push(`SESSION_LOG entry count = ${entryCount}（達 N=11+ archive 邊界；下次 closeout 時 AI 應自動執行 N 規則推進，如未動請提醒）`);
  }

  if (lineCount >= 1500) {
    warnings.push(`SESSION_LOG line count = ${lineCount}（超過 1500 安全網閾值；可能 entry 異常長）`);
  }

  return { ok: warnings.length === 0, warnings };
}

// R-024 唯一真源：AGENTS.md 健康判斷合三為一函數。
// Returns { state, evidence } where state ∈ { clean, needs-merge, conflict }.
// - clean: structurally healthy
//   * exactly one paired managed-core marker block with no unmarked title outside it, OR
//   * no managed marker and exactly one core title (fresh-init legacy form)
// - needs-merge: stale state that upgrade must replace
//   * managed marker pair plus unmarked title outside it (sandwich), or
//   * no managed marker with two or more title duplicates, or
//   * no managed marker and no title at all (file exists but Kit core absent)
// - conflict: structural breakage
//   * managed-core markers unpaired or duplicated
function assessAgentsMdHealth(text) {
  const managedStartCount = countOccurrences(text, managedCoreStart);
  const managedEndCount = countOccurrences(text, managedCoreEnd);

  if (managedStartCount !== managedEndCount || managedStartCount > 1) {
    return {
      state: "conflict",
      evidence: {
        managedStart: managedStartCount,
        managedEnd: managedEndCount,
        reason: "managed-core markers unpaired or duplicated"
      }
    };
  }

  let managedRange = null;
  if (managedStartCount === 1) {
    const start = text.indexOf(managedCoreStart);
    const endStart = text.indexOf(managedCoreEnd, start);
    if (endStart < 0 || endStart < start) {
      return {
        state: "conflict",
        evidence: {
          managedStart: managedStartCount,
          managedEnd: managedEndCount,
          reason: "managed-core end marker missing or before start"
        }
      };
    }
    managedRange = { start, end: endStart + managedCoreEnd.length };
  }

  // Only count real top-level headings (line-anchored), not inline mentions inside backticks.
  const titlePositions = locateCoreTitlePositions(text);

  const titlesOutsideManaged = titlePositions.filter((pos) =>
    !managedRange || pos < managedRange.start || pos >= managedRange.end
  );

  // Case A: managed marker pair present
  if (managedStartCount === 1) {
    if (titlesOutsideManaged.length > 0) {
      const unmarkedRange = computeUnmarkedRange(text, titlesOutsideManaged[0], managedRange);
      return {
        state: "needs-merge",
        evidence: {
          managedStart: 1,
          titleCount: titlePositions.length,
          unmarkedTitleCount: titlesOutsideManaged.length,
          unmarkedRange,
          reason: "sandwich: managed marker + unmarked stale core"
        }
      };
    }
    return {
      state: "clean",
      evidence: {
        managedStart: 1,
        titleCount: titlePositions.length,
        reason: "single managed core, no unmarked dup"
      }
    };
  }

  // Case B: no managed marker
  if (titlePositions.length === 1) {
    // Structurally healthy (single heading, no dup), but upgrade should still replace
    // this legacy core form with a managed-marker block. doctor passes; upgrade merges.
    return {
      state: "clean",
      evidence: {
        managedStart: 0,
        titleCount: 1,
        upgradeable: "legacy-core",
        legacyRange: computeUnmarkedRange(text, titlePositions[0], null),
        reason: "single legacy core, no managed marker"
      }
    };
  }
  if (titlePositions.length > 1) {
    return {
      state: "needs-merge",
      evidence: {
        managedStart: 0,
        titleCount: titlePositions.length,
        unmarkedTitleCount: titlePositions.length,
        unmarkedRange: computeUnmarkedRange(text, titlePositions[0], null),
        reason: "legacy duplicate cores"
      }
    };
  }
  return {
    state: "needs-merge",
    evidence: {
      managedStart: 0,
      titleCount: 0,
      reason: "no Kit core present"
    }
  };
}

// Locate Kit core titles that are real top-level headings (line-anchored).
// This intentionally excludes inline mentions like `# Agent Handoff Kit Core Runtime`
// inside backticks or prose, so the assess function only reacts to real duplicate headings.
function locateCoreTitlePositions(text) {
  const regex = /(^|\n)# Agent Handoff Kit Core Runtime(?=\r?\n|$)/g;
  const positions = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const headingStart = match.index + (match[1] === "\n" ? 1 : 0);
    positions.push(headingStart);
  }
  return positions;
}

function computeUnmarkedRange(text, titleStart, managedRange) {
  const titleNeedle = "# Agent Handoff Kit Core Runtime";
  const terminal = "keep the core within budget.";
  const terminalIndex = text.indexOf(terminal, titleStart);
  if (terminalIndex >= 0 && (!managedRange || terminalIndex < managedRange.start || terminalIndex >= managedRange.end)) {
    return { start: titleStart, end: terminalIndex + terminal.length };
  }
  const afterTitle = titleStart + titleNeedle.length;
  const remainder = text.slice(afterTitle);
  // Find next real top-level heading that is NOT another Kit core heading.
  const nextTopLevel = remainder.search(/\n# (?!Agent Handoff Kit Core Runtime(?=\r?\n|$))/);
  if (nextTopLevel < 0) return { start: titleStart, end: text.length };
  return { start: titleStart, end: afterTitle + nextTopLevel + 1 };
}

function mergeManagedBlock(targetText, sourceText) {
  const block = `${managedCoreStart}\n${sourceText.trim()}\n${managedCoreEnd}`;

  // Strip every unmarked / legacy core range first; iterate to handle multiple legacy stacks.
  let working = targetText;
  for (let i = 0; i < 5; i += 1) {
    const probe = assessAgentsMdHealth(working);
    const range = probe.evidence?.unmarkedRange ?? probe.evidence?.legacyRange;
    if (!range) break;
    const before = working.slice(0, range.start).trimEnd();
    const after = working.slice(range.end).trimStart();
    working = before + (before && after ? "\n\n" : before ? "\n" : "") + after;
  }

  const existingBlock = new RegExp(`${escapeRegExp(managedCoreStart)}[\\s\\S]*?${escapeRegExp(managedCoreEnd)}`);
  if (existingBlock.test(working)) {
    return `${working.replace(existingBlock, block).trimEnd()}\n`;
  }
  if (working.trim().length === 0) return `${block}\n`;
  return `${working.trimEnd()}\n\n${block}\n`;
}

function countOccurrences(text, needle) {
  return text.split(needle).length - 1;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasRequiredAnchor(targetRel, text) {
  return requiredAnchors
    .filter((rule) => rule.target === targetRel)
    .every((rule) => rule.snippets.every((snippet) => text.includes(snippet)));
}

async function detectMode(root) {
  const hasAgents = await exists(path.join(root, "AGENTS.md"));
  const hasProjectIndex = await exists(path.join(root, "dev/PROJECT_INDEX.md"));
  const hasDocSync = await exists(path.join(root, "dev/DOC_SYNC_REGISTRY.md"));
  if (!hasAgents && !hasProjectIndex && !hasDocSync) return "first-install";
  if (hasAgents && hasProjectIndex && hasDocSync) return "upgrade-existing";
  if (hasAgents) {
    const text = await readFile(path.join(root, "AGENTS.md"), "utf8");
    if (text.includes("SESSION_HANDOFF") || text.includes("SESSION_LOG")) return "migrate-monolith";
  }
  return "partial";
}

function printPlan(command, root, mode, plan, version, isDryRun = false, installedVersion = null) {
  console.log(`command: ${command}`);
  console.log(`current directory: ${process.cwd()}`);
  console.log(`selected root: ${root}`);
  console.log(`live project version: ${installedVersion ? `v${installedVersion}` : "unverified"}`);
  console.log(`target CLI version: v${version}`);
  console.log("current transaction: none (historical migration folders are evidence only)");
  console.log(`mode: ${mode}`);
  console.log("");
  const planIntro = planIntroFor(command, mode, isDryRun);
  console.log(planIntro);
  console.log("");
  for (const action of ["create", "merge", "preserve", "skip", "conflict"]) {
    const items = plan.filter((item) => item.action === action);
    console.log(`${action}: ${items.length}`);
    for (const item of items) console.log(`  ${item.targetRel}${item.reason ? ` - ${item.reason}` : ""}`);
  }
  console.log(`\nbackup: ${plan.filter((item) => item.action === "merge" || item.action === "preserve").length}`);
}

function ensureHandoffCloseoutOutcomeFields(targetText) {
  const hasOutcome = targetText.includes("ack:field:closeout-outcome");
  const hasPersistence = targetText.includes("ack:field:project-required-persistence");
  if (hasOutcome && hasPersistence) return targetText;
  const openingMarker = "<!-- ack:field:opening-message-matches-current-state -->";
  if (!targetText.includes(openingMarker)) return null;
  const fields = [
    !hasOutcome ? "<!-- ack:field:closeout-outcome -->\n- Closeout outcome: not_started — added by upgrade; determine it during the next full closeout.\n" : "",
    !hasPersistence ? "<!-- ack:field:project-required-persistence -->\n- Project-required persistence: not_assessed — added by upgrade; determine whether persistence is not required, complete, or blocked at the next full closeout.\n" : ""
  ].join("");
  return targetText.replace(openingMarker, `${fields}${openingMarker}`);
}

function planIntroFor(command, mode, isDryRun) {
  const prefix = isDryRun ? "📋 預演結果：這次不會寫入檔案。" : "📋 寫入前確認：工具準備這樣處理目前資料夾。";
  if (command === "init" && mode === "first-install") {
    return `${prefix} 目前資料夾未見 Kit 檔案；工具會建立交接文件、AI 入口檔與工作規則。沒有既有檔案會被覆寫。`;
  }
  if (command === "init" && mode === "partial") {
    return `${prefix} 目前資料夾已有部分 AI 或 Kit 檔案；工具會補齊缺少檔案，保留既有檔案。安裝後可能仍要用 upgrade 補入口連接。`;
  }
  if (command === "upgrade") {
    return `${prefix} 工具會檢查既有 Kit 檔案；能安全合併才合併，不能判斷時會停手並列為 conflict。`;
  }
  return `${prefix} create 代表建立缺少檔案；merge 代表先備份再合併；skip 代表保留既有檔案；conflict 代表工具零寫入停手並提供技術證據。`;
}

function conflictRepairNextStepLine(icon = "📋", suffix = "") {
  const suffixText = suffix ? ` ${suffix}` : "";
  return `${icon} 下一步：你不用判斷技術差異，也不要重裝或整檔覆寫。請回到能讀寫這個資料夾的 AI，讓 AI 依這段輸出、本地檔案與正式來源做授權合併；合併後重新執行 upgrade --dry-run，再用 doctor 與 hash 讀回驗收。未知本地 hash 只作內容 witness，不代表 Kit 可以理解或覆寫。只有能證明這是 Kit 誤判未改動的正式舊檔時，才把版本、來源與 hash 證據回報 Kit maintainer。${suffixText}`;
}

// R-026 CLI Output Contract: install/upgrade 完成必含四項（版本／模式／剛完成／下一步）。
function printInstallSummary(version, command, mode, root, counts) {
  console.log(`\n✅ created: ${counts.created}`);
  console.log(`🔀 merged: ${counts.merged}`);
  console.log(`⏭️  skipped existing: ${counts.skipped}`);
  console.log(`${counts.conflicts > 0 ? "⚠️ " : "✅ "}conflict: ${counts.conflicts}`);
  if (counts.backupRel) console.log(`💾 backup: ${counts.backupRel}`);
  if (counts.reportRel) console.log(`📄 migration report: ${counts.reportRel}`);
  console.log("");
  console.log(`📦 版本：v${version}`);
  console.log(`🛠️  模式：${mode}`);
  console.log(`🔎 剛完成：${command} 命令；create ${counts.created} / merge ${counts.merged} / skip ${counts.skipped} / conflict ${counts.conflicts}。`);
  if (counts.conflicts > 0) {
    console.log(conflictRepairNextStepLine("🚀", "工具已停手，沒有覆寫 conflict 檔案。"));
  } else if (command === "upgrade") {
    console.log("🚀 下一步：本次提交已先經同一輪正式 doctor 讀回；請留意下方提交與健康結果。");
  } else if (counts.skipped > 0) {
    console.log("🚀 下一步：先看下方提示。若你原本已有 AGENTS.md 或其他 AI 規則，請先執行 upgrade --dry-run 補入口連接，再執行 doctor。");
  } else {
    console.log("🚀 下一步：不用再留在終端機。打開 AI 工具，啟動 Agent Handoff。");
  }
}

function printDryRunExplanation(command, mode, plan) {
  const conflicts = plan.filter((item) => item.action === "conflict");
  console.log("✅ 這次沒有改動任何檔案。");
  if (conflicts.length === 0) {
    if (command === "init") {
      console.log("✅ 沒有發現 conflict。若這是你要安裝 Kit 的資料夾，下一步執行：");
      console.log("   npx --yes @adamchanadam/agent-handoff-kit@latest init");
      return;
    }
    if (mode === "upgrade-existing") {
      console.log("✅ 沒有發現 conflict。若你想正式套用以上升級計劃，下一步執行：");
      console.log("   npx --yes @adamchanadam/agent-handoff-kit@latest upgrade");
      return;
    }
    console.log("✅ 沒有發現 conflict。請按你剛才預演的命令去掉 --dry-run 後正式執行。");
    return;
  }
  console.log(`⚠️  技術核對未完成：有 ${conflicts.length} 個既有檔案，工具目前不能證明可安全合併。`);
  console.log("⚠️  這不是檔案壞掉，也沒有覆寫你的檔案。");
  console.log(conflictRepairNextStepLine());
}

async function confirmWrite() {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question("要按上面計劃寫入 / 合併 Kit 檔案嗎？輸入 yes 繼續：");
    return answer.trim().toLowerCase() === "yes";
  } finally {
    rl.close();
  }
}

function migrationStamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

async function readPackageVersion() {
  try {
    const text = await readFile(path.join(packageRoot, "package.json"), "utf8");
    const packagedVersion = JSON.parse(text).version ?? "version unverified";
    const qaOverride = process.env.AGENT_HANDOFF_KIT_QA_VERSION_OVERRIDE;
    if (process.env.AGENT_HANDOFF_KIT_QA_ALLOW_VERSION_OVERRIDE === "1" && isStableSemver(qaOverride ?? "")) {
      return qaOverride;
    }
    return packagedVersion;
  } catch {
    return "version unverified";
  }
}

async function maybePrintUpdateNotice(currentVersion) {
  if (shouldSkipUpdateCheck()) return;
  if (!isStableSemver(currentVersion)) return;

  const latestVersion = await fetchLatestVersion();
  if (!latestVersion || !isStableSemver(latestVersion)) return;
  if (compareSemver(latestVersion, currentVersion) <= 0) return;

  printUpdateNotice(currentVersion, latestVersion);
}

function shouldSkipUpdateCheck() {
  if (process.env.AGENT_HANDOFF_KIT_NO_UPDATE_CHECK === "1") return true;
  if (process.env.AGENT_HANDOFF_KIT_UPDATE_CHECK_FORCE === "1") return false;
  if (process.env.CI) return true;
  if ((process.env.npm_lifecycle_event ?? "").startsWith("qa:")) return true;
  return false;
}

async function fetchLatestVersion() {
  if (process.env.AGENT_HANDOFF_KIT_UPDATE_MOCK_LATEST) {
    return process.env.AGENT_HANDOFF_KIT_UPDATE_MOCK_LATEST;
  }
  const url = process.env.AGENT_HANDOFF_KIT_UPDATE_REGISTRY_URL
    ?? "https://registry.npmjs.org/@adamchanadam%2Fagent-handoff-kit/latest";
  const timeoutMs = Number.parseInt(process.env.AGENT_HANDOFF_KIT_UPDATE_TIMEOUT_MS ?? "1200", 10);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 1200);
  try {
    const response = await fetch(url, {
      headers: { accept: "application/vnd.npm.install-v1+json, application/json" },
      signal: controller.signal
    });
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data.version === "string" ? data.version : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function isStableSemver(version) {
  return /^\d+\.\d+\.\d+$/.test(version);
}

function compareSemver(left, right) {
  const leftParts = left.split(".").map((part) => Number.parseInt(part, 10));
  const rightParts = right.split(".").map((part) => Number.parseInt(part, 10));
  for (let i = 0; i < 3; i += 1) {
    if (leftParts[i] > rightParts[i]) return 1;
    if (leftParts[i] < rightParts[i]) return -1;
  }
  return 0;
}

function printUpdateNotice(currentVersion, latestVersion) {
  const releaseUrl = "https://github.com/Adamchanadam/agent-handoff-kit/releases/latest";
  const command = "npx --yes @adamchanadam/agent-handoff-kit@latest <command>";
  const lines = [
    `✨ 有新版可用：${currentVersion} -> ${latestVersion}`,
    `如要使用最新版，執行：${command}`,
    "這只讓 npm 取得執行工具；doctor 只檢查，不會安裝項目文件。",
    "",
    "如果你是全域安裝：",
    "npm install -g @adamchanadam/agent-handoff-kit",
    "",
    "完整 release notes：",
    releaseUrl
  ];
  const width = Math.max(...lines.map((line) => visibleLength(line))) + 2;
  console.log(`╭${"─".repeat(width)}╮`);
  for (const line of lines) {
    console.log(`│ ${line}${" ".repeat(width - visibleLength(line) - 1)}│`);
  }
  console.log(`╰${"─".repeat(width)}╯`);
  console.log("");
}

function visibleLength(text) {
  return [...text].length;
}

function printCard(version, status, eyes) {
  console.log(`   /\\_/\\   Agent Handoff Kit v${version}`);
  console.log(`  ( ${eyes} )  ${status}`);
  console.log("   > ^ <");
  console.log("");
}

function printInstallNextSteps(root, conflictCount, mode = "first-install", skippedCount = 0) {
  console.log("");
  console.log("============================================================");
  if (skippedCount > 0) {
    console.log("⚠️  已補齊缺少檔案，但仍要檢查入口連接");
  } else {
    console.log("✅ 安裝完成：下一步請在 AI 對話中操作");
  }
  console.log("============================================================");
  if (conflictCount > 0) {
    console.log("⚠️  狀態：有既有檔案未能證明可安全合併。");
    console.log("⚠️  這不是檔案壞掉；工具已停手，沒有覆寫 conflict 檔案。");
    console.log(conflictRepairNextStepLine());
    console.log("");
  }
  if (skippedCount > 0) {
    console.log("你原本已有部分 AI 記憶檔，工具已保留它們，沒有覆寫。");
    console.log("下一步先不要開始新任務；請在終端機執行以下預演，讓工具檢查能否安全補入口連接：");
    console.log("   npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run");
    console.log("");
    console.log("如預演顯示沒有 conflict，再執行：");
    console.log("   npx --yes @adamchanadam/agent-handoff-kit@latest upgrade");
    console.log("============================================================");
    return;
  }
  console.log("------------------------------------------------------------");
  console.log("⚠️  下面這句不是終端機指令。");
  console.log("📋 請打開能讀寫此資料夾的 AI agent。若 AI 已在此資料夾內，新增對話後輸入：");
  console.log("   例如 Claude Code、OpenAI Codex、Gemini CLI、Google Antigravity。");
  console.log("   普通 web chat AI 若不能讀寫本機資料夾，並不適合使用本工具。");
  console.log("------------------------------------------------------------");
  console.log("Start Agent Handoff");
  console.log("或：開工");
  console.log("------------------------------------------------------------");
  console.log("若 AI 還未指向此資料夾，才貼以下帶路徑啟動句：");
  console.log(startupPathBootstrapPrompt(root));
  console.log("------------------------------------------------------------");
  console.log("");
  console.log("🚀 AI 會依 AGENTS.md 先讀取權威交接狀態。START_NEXT_SESSION_PROMPT.txt 只是給尚未指向此資料夾的 AI 使用的生成鏡像。");
  console.log("   已給出明確任務時，AI 直接開始第一個安全步驟；只有你要求教學或仍無可執行目標時才進入新手引導。");
  console.log("   收工可說「Wrap up Agent Handoff」/「收工」；「開工，繼續 <任務>」會直接接力。");
  console.log("============================================================");
}

// R-031 v0.3.1+: Upgrade substantive next-step block. Distinct from install
// (`printInstallNextSteps`) because the user is not first-time; pushing them through
// the onboarding canonical phrase resets context they already have.
function printUpgradeNextSteps(root, conflictCount) {
  console.log("");
  console.log("============================================================");
  if (conflictCount > 0) {
    console.log("⚠️  升級未完成：有檔案未能證明可安全合併");
    console.log("============================================================");
    console.log("⚠️  狀態：工具已保守停手，沒有建立目前交易或覆寫檔案。");
    console.log("⚠️  這不是檔案壞掉；工具已停手，沒有覆寫 conflict 檔案。");
    console.log(conflictRepairNextStepLine());
    console.log("============================================================");
    return;
  }
  console.log("🛠️  Kit migration 已通過離線遷移驗收；已由正式 doctor 的同輪讀回確認提交與健康使用同一狀態");
  console.log("============================================================");
  console.log("📋 如你正在進行中的工作對話已熟悉 Agent Handoff Kit，繼續使用原本的開工方式即可，無需重新做新手引導。");
  console.log("");
  console.log("💡 版本詳情不在升級流程內展開；如需要，可稍後查看 GitHub Release：");
  console.log("   https://github.com/Adamchanadam/agent-handoff-kit/releases/latest");
  console.log("");
  console.log("🩺 migration committed 與 project health 只會在同一輪 doctor 讀回後顯示；失敗時不會宣稱已提交。");
  console.log("============================================================");
}

// R-031 v0.3.24+: Upgrade no-op may skip file writes, but it must not skip the
// single health authority. If the CLI says a latest root can continue, that claim
// is backed by the same runDoctor() implementation users would invoke manually.
async function assessUpgradeNoopHealth(root, version, options = {}) {
  const originalLog = console.log;
  const originalError = console.error;
  const previousExitCode = process.exitCode;
  const stdout = [];
  const stderr = [];

  try {
    console.log = (...args) => stdout.push(args.join(" "));
    console.error = (...args) => stderr.push(args.join(" "));
    process.exitCode = undefined;
    const status = await runDoctor(root, version, {
      silentCard: true,
      context: "upgrade-noop-health-check",
      skipVersionRegistryLookup: options.skipVersionRegistryLookup === true
    });
    const doctorExitCode = process.exitCode;
    return {
      ok: status === "passed" && !doctorExitCode,
      status,
      stdout: stdout.join("\n"),
      stderr: stderr.join("\n"),
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      status: "failed",
      stdout: stdout.join("\n"),
      stderr: stderr.join("\n"),
      error: error.message
    };
  } finally {
    console.log = originalLog;
    console.error = originalError;
    process.exitCode = previousExitCode;
  }
}

function printUpgradeNoopShortCircuit(version, health = { ok: true }) {
  console.log("");
  console.log(`📦 版本：v${version}`);
  console.log("🛠️  模式：upgrade-existing");
  console.log("🔎 剛完成：檢查所有 Kit 檔案的狀態（含 AGENTS.md、dev/SESSION_HANDOFF.md、dev/PROJECT_INDEX.md 等）。");
  if (health.ok) {
    console.log("✅ 結果：你已經是最新版本，沒有檔案需要建立或合併；用戶填寫的內容全部保留現狀。");
    console.log("");
    console.log("🚀 下一步：回到原本的 AI 對話或開工句即可；準備結束本輪工作、需要保存交接、或有下一輪必須知道的狀態時，在 AI 對話輸入「收工」。");
    console.log("");
    return;
  }
  console.log("⚠️  結果：Kit 檔案已是最新版本，沒有檔案需要建立或合併；但完整 doctor 健康檢查未通過。");
  console.log("");
  console.log("🩺 doctor 輸出：");
  const doctorOutput = [health.stdout, health.stderr, health.error ? `error: ${health.error}` : ""]
    .filter(Boolean)
    .join("\n")
    .trim();
  console.log(doctorOutput || "doctor did not return readable output.");
  console.log("");
  console.log("🚀 下一步：把上方 doctor 輸出貼給能讀寫此資料夾的 AI，請它按失敗項修補；不要重裝或覆寫用戶內容。");
  console.log("");
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function printHelp(version) {
  printCard(version, "continuity ready", "o.o");
  console.log(`Agent Handoff Kit

Usage:
  agent-handoff-kit init [--dry-run] [--yes] [--root <path>]
  agent-handoff-kit upgrade [--dry-run] [--yes] [--root <path>]
  agent-handoff-kit doctor [--root <path>]
  agent-handoff-kit closeout-status [--root <path>]

Commands:
  init      Plan or install missing core files and rule packs.
  upgrade   Preserve existing files; merge safe core updates or report conflicts.
  doctor    Check required installed files.
  closeout-status  Render the state-bound closeout card after a full closeout.

中文速讀：
  ✅ 第一次用：先在項目資料夾執行 init。
  🔄 已裝過：執行 upgrade；若想先預覽，才加 --dry-run。
  🩺 不確定狀態：用 doctor 檢查；doctor 只檢查，不會改檔。

安裝之後：
  不要把顯示出來的 Start Agent Handoff 或 "Work in ..." 文字輸入終端機。
  請打開能讀寫此資料夾的 AI agent。若 AI 已在此資料夾內，新增對話後輸入：
  Start Agent Handoff
  或：開工
  若 AI 還未指向此資料夾，才貼帶路徑啟動句：
  Work in <project root>. Read AGENTS.md first, then Start Agent Handoff. Before changing anything, tell me the current state and your recommended next step.
  例如 Claude Code、OpenAI Codex、Gemini CLI、Google Antigravity。
  普通 web chat AI 若不能讀寫本機資料夾，並不適合使用本工具。
  AI 已在項目根目錄時，依 AGENTS.md 判斷意圖；只有接力、收工或依賴既有狀態的任務才讀交接狀態，
  不會再重讀 START_NEXT_SESSION_PROMPT.txt。第一次安裝只令新手引導可用，不會強制進入教學。
  用「Wrap up Agent Handoff」/「收工」保存交接；「<項目名> 開工」是明確接力。
  只有語句確實可能指現實工作、活動或其他語境時，AI 才問一條精簡確認問題。

終端機範例：
  npx --yes @adamchanadam/agent-handoff-kit@latest init
  npx --yes @adamchanadam/agent-handoff-kit@latest upgrade
  npx --yes @adamchanadam/agent-handoff-kit@latest doctor

  升級前如想先看會改甚麼，才用預演：
  npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run
  --dry-run 只預覽、不寫入；它不是正式升級完成。

  以上才是建議的 npx 用戶路徑。裸寫不帶 --yes / @latest 的 npx doctor
  不是本工具的建議用戶路徑，容易先出現 npm 自己的安裝提示。

  即使資料夾已有 AGENTS.md 或 dev/，電腦也未必已經有可直接執行的工具；
  npx --yes 只是先取得工具，然後才執行你指定的 init / upgrade / doctor。

  放在 package 名稱前的 --yes 只讓 npm 先取得執行工具，避免額外出現
  "Need to install" 提示。真正會建立項目文件的是 init；doctor 只檢查。
`);
  console.log(`📦 版本：v${version}`);
  console.log(`🛠️  模式：help ready`);
  console.log(`🚀 下一步：新項目先執行 init；舊項目執行 upgrade；只想檢查才執行 doctor。`);
}

function startupPathBootstrapPrompt(root) {
  return `Work in ${root}. Read AGENTS.md first, then Start Agent Handoff. Before changing anything, tell me the current state and your recommended next step.`;
}
