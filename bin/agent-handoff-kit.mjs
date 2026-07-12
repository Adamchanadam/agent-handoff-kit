#!/usr/bin/env node

import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { chmod, copyFile, lstat, mkdir, open, readFile, readdir, realpath, rename, stat, unlink, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { hostname } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assessPromptMirrorRoot, assessPromptMirrorTexts, extractOpeningMessage } from "./prompt-mirror-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");

const mappings = [
  ["runtime-core/AGENTS.core.md", "AGENTS.md"],
  ["runtime-core/CLAUDE.md", "CLAUDE.md"],
  ["runtime-core/GEMINI.md", "GEMINI.md"],
  ["runtime-core/START_NEXT_SESSION_PROMPT.txt", "START_NEXT_SESSION_PROMPT.txt"],
  ["runtime-core/SESSION_HANDOFF.md", "dev/SESSION_HANDOFF.md"],
  ["runtime-core/SESSION_LOG.md", "dev/SESSION_LOG.md"],
  ["runtime-core/PROJECT_INDEX.md", "dev/PROJECT_INDEX.md"],
  ["runtime-core/DOC_SYNC_REGISTRY.md", "dev/DOC_SYNC_REGISTRY.md"],
  ["runtime-core/RULE_PACKS.md", "dev/RULE_PACKS.md"],
  ["runtime-core/PROJECT_DECISIONS.md", "dev/PROJECT_DECISIONS.md"],
  ["packs/safety.md", "dev/rules/safety.md"],
  ["packs/coding.md", "dev/rules/coding.md"],
  ["packs/writing.md", "dev/rules/writing.md"],
  ["packs/research.md", "dev/rules/research.md"],
  ["packs/agent-governance.md", "dev/rules/agent-governance.md"],
  ["packs/release.md", "dev/rules/release.md"],
  ["packs/knowledge.md", "dev/rules/knowledge.md"],
  ["packs/communication.md", "dev/rules/communication.md"],
  ["packs/closeout.md", "dev/rules/closeout.md"],
  ["packs/onboarding.md", "dev/rules/onboarding.md"],
  ["packs/integrations.md", "dev/rules/integrations.md"]
];

const requiredTargets = mappings.map(([, target]) => target);
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
      "START_NEXT_SESSION_PROMPT.txt"
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
      "starts continuity and reads the current handoff state; it is not an onboarding signal",
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
      {
        label: "completed work is not carried forward as unresolved next work",
        test: (text) => assessHandoffLifecycleConsistency(text).ok,
        explain: (text) => assessHandoffLifecycleConsistency(text).reason
      }
    ]
  },
  {
    target: "dev/SESSION_LOG.md",
    label: "session log entry fields",
    checks: [
      heading("Entry Template"),
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
      // R-030 v0.3.0+: Installed Integrations subsection table headers
      tableHeader("Tool", "Project Usage", "Access Scope", "Specific Instance", "Credential Reference (no value)", "Declared", "Last Verified"),
      tableHeader("Server", "Source", "Project Usage", "Credential Reference (no value)", "Declared", "Last Verified"),
      tableHeader("Name", "Bundle Content (Skills + MCP + hooks)", "When Triggered", "Last Verified"),
      tableHeader("Name", "Source", "When Triggered", "Last Verified"),
      tableHeader("Layer", "Surface (specific instance)", "Role", "Write Direction"),
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
  const version = await readPackageVersion();
  await maybePrintUpdateNotice(version);
  const { command, options } = parseArgs(process.argv.slice(2));
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

  throw new Error(`unknown command "${command}"`);
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
    else if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--root") options.root = args[++i];
    else throw new Error(`unknown option "${arg}"`);
  }

  return { command, options };
}

// R-031.3 v0.3.4+: Helper to detect if PROJECT_INDEX template version metadata
// row is stale relative to current CLI version. Used by plan-time no-op detection
// guard to ensure metadata-only stale roots still trigger the upgrade ceremony
// (otherwise plan-time short-circuit returns before inject can run).
async function needsProjectIndexVersionInject(root, command, version) {
  if (command !== "upgrade") return false;
  try {
    const indexPath = path.join(root, "dev/PROJECT_INDEX.md");
    const text = await readFile(indexPath, "utf8");
    const m = text.match(/\| Agent Handoff Kit template version \| ([\d.]+) \|/);
    if (m && isStableSemver(m[1]) && compareSemver(m[1], version) < 0) {
      return true;
    }
  } catch {
    // ignore — silent if PROJECT_INDEX missing or unreadable
  }
  return false;
}

async function runInstall(command, root, options, version) {
  await recoverInterruptedTransaction(root);
  const installedVersion = await readInstalledTemplateVersion(root);
  if (command === "upgrade" && installedVersion && compareSemver(installedVersion, version) > 0) {
    printCard(version, "upgrade blocked", "x.x");
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
  await validateTransactionRoot(root, plan);

  // R-031 v0.3.1+: plan-time upgrade no-op detection. When upgrade has zero
  // create/merge/conflict actions (skip-only), skip the full plan listing +
  // confirmWrite + ceremony. The plan listing in this scenario is pure noise —
  // user is already at latest and just verifying status.
  const planCreateCount = plan.filter((item) => item.action === "create").length;
  const planMergeCount = plan.filter((item) => item.action === "merge").length;
  const planConflictCount = plan.filter((item) => item.action === "conflict").length;
  const planSkipCount = plan.filter((item) => item.action === "skip").length;
  // R-031.3 v0.3.4+: metadata-only stale guard. If PROJECT_INDEX template version
  // row is stale but structure is fully current (all v0.2.0+ files already present),
  // plan create/merge/conflict are all 0 — but inject still needs to run. Without
  // this guard, plan-time short-circuit returns before inject can fire, leaving
  // root on stale version forever.
  const projectIndexVersionNeedsInject = await needsProjectIndexVersionInject(root, command, version);
  const isUpgradeNoopAtPlanTime = command === "upgrade"
    && planCreateCount === 0
    && planMergeCount === 0
    && planConflictCount === 0
    && !projectIndexVersionNeedsInject;

  if (isUpgradeNoopAtPlanTime) {
    const noOpHealth = await assessUpgradeNoopHealth(root, version);
    printCard(version, "continuity ready", "o.o");
    console.log(`command: ${command}`);
    console.log(`current directory: ${process.cwd()}`);
    console.log(`selected root: ${root}`);
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

  printPlan(command, root, mode, plan, version, options.dryRun);

  if (options.dryRun) {
    console.log("\ndry-run: no files written");
    printDryRunExplanation(command, mode, plan);
    if (plan.some((item) => item.action === "conflict")) process.exitCode = 1;
    return;
  }

  if (plan.some((item) => item.action === "conflict")) {
    console.log("");
    console.log("⛔ 升級預檢發現 conflict；治理目標檔、版本與 migration artifact 均沒有寫入。");
    console.log("📋 下一步：根據上方 conflict 資料作非破壞性合併；不要以舊版本資料列當作已完成。");
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

  await executeInstallTransaction(command, root, mode, plan, version);
}

async function readInstalledTemplateVersion(root) {
  try {
    const text = await readFile(path.join(root, "dev/PROJECT_INDEX.md"), "utf8");
    const match = text.match(/\| Agent Handoff Kit template version \| ([\d.]+) \|/);
    return match && isStableSemver(match[1]) ? match[1] : null;
  } catch {
    return null;
  }
}

async function executeInstallTransaction(command, root, mode, plan, version) {
  const outputs = await buildTransactionOutputs(command, root, plan, version);
  if (outputs.length === 0) {
    const health = await assessUpgradeNoopHealth(root, version);
    printUpgradeNoopShortCircuit(version, health);
    if (!health.ok) process.exitCode = 1;
    return;
  }

  const credentialInputs = [];
  for (const relative of requiredTargets) {
    const buffer = await readOptionalBuffer(path.join(root, relative));
    if (buffer) credentialInputs.push({ relative, text: decodeUtf8(buffer, relative).text });
  }
  const credentialFindings = detectCredentialValues(credentialInputs);
  if (credentialFindings.length > 0) {
    console.log("⛔ 升級已停止：待備份的治理檔疑似含有 credential value。");
    console.log("機密值不會顯示或複製；請先移除並輪換機密，再重跑 upgrade。");
    for (const finding of credentialFindings) console.log(`blocked  ${finding.relative}:${finding.line} (${finding.label})`);
    process.exitCode = 1;
    return;
  }

  const transaction = await prepareTransaction(root, command, version, outputs);
  try {
    await validateTransactionOverlay(root, outputs);
    transaction.journal.state = "committing";
    await writeSecureJson(transaction.journalPath, transaction.journal);

    let committedCount = 0;
    const qaFailAfterCommit = Number.parseInt(process.env.AGENT_HANDOFF_KIT_QA_FAIL_AFTER_COMMIT ?? "", 10);
    for (const entry of transaction.journal.entries) {
      const output = outputs.find((item) => item.targetRel === entry.targetRel);
      await atomicReplaceFromBuffer(root, output.targetAbs, output.after, transaction.id);
      entry.committed = true;
      committedCount += 1;
      await writeSecureJson(transaction.journalPath, transaction.journal);
      if (Number.isInteger(qaFailAfterCommit) && qaFailAfterCommit === committedCount) {
        throw new Error(`QA fault injection after committed target ${committedCount}`);
      }
    }

    transaction.journal.state = "committed";
    transaction.journal.committedAt = new Date().toISOString();
    await writeSecureJson(transaction.journalPath, transaction.journal);
    const reportPath = await writeTransactionReport(transaction, mode, plan);
    await unlinkIfExists(transaction.lockPath);

    const created = outputs.filter((item) => !item.before).map((item) => item.targetRel);
    const merged = outputs.filter((item) => item.before).map((item) => item.reason ? `${item.targetRel} - ${item.reason}` : item.targetRel);
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
      console.log("✅ migration committed：離線遷移提交閏已通過，版本代表本次成功提交。");
      console.log("🩺 project health：現在執行完整 doctor；它的結果與 migration committed 分開。");
      const doctorStatus = await runDoctor(root, version, { silentCard: true, context: "post-transaction-project-health" });
      if (doctorStatus === "passed") console.log("✅ project health: passed");
      else console.log("⚠️ project health: needs attention; migration remains committed because the deterministic migration gate passed");
    }
  } catch (error) {
    transaction.journal.state = "rollback-needed";
    transaction.journal.error = safeErrorLabel(error);
    await writeSecureJson(transaction.journalPath, transaction.journal).catch(() => {});
    const rollback = await rollbackTransaction(root, transaction.journal, transaction.journalPath);
    if (rollback.ok) {
      await unlinkIfExists(transaction.lockPath);
      console.log("⚠️ migration rolled back：提交閏或寫入失敗，已復原本次交易所改動的目標。");
    } else {
      console.log("⛔ migration incomplete：現存檔案已出現第三種內容，工具沒有強制回滾以免覆寫後續修改。");
      for (const conflict of rollback.conflicts) console.log(`blocked  ${conflict}`);
    }
    throw error;
  }
}

async function buildTransactionOutputs(command, root, plan, version) {
  const byTarget = new Map();
  for (const item of plan) {
    if (item.action !== "create" && item.action !== "merge") continue;
    const before = await readOptionalBuffer(item.targetAbs);
    let afterText;
    if (item.action === "create") {
      const sourceText = await readFile(item.sourceAbs, "utf8");
      afterText = item.targetRel === "AGENTS.md" ? mergeManagedBlock("", sourceText) : sourceText;
    } else {
      afterText = item.mergedText;
    }
    afterText = afterText.replaceAll("<absolute project root>", root);
    byTarget.set(item.targetRel, {
      targetRel: item.targetRel,
      targetAbs: item.targetAbs,
      before,
      afterText,
      reason: item.reason ?? item.action
    });
  }

  const indexRel = "dev/PROJECT_INDEX.md";
  const indexAbs = path.join(root, indexRel);
  let indexOutput = byTarget.get(indexRel);
  if (!indexOutput && (command === "upgrade" || await exists(indexAbs))) {
    const before = await readOptionalBuffer(indexAbs);
    if (before) indexOutput = { targetRel: indexRel, targetAbs: indexAbs, before, afterText: decodeUtf8(before, indexRel).text, reason: "template version metadata" };
  }
  if (indexOutput) {
    const updated = indexOutput.afterText.replace(/\| Agent Handoff Kit template version \| [\d.]+ \|/, `| Agent Handoff Kit template version | ${version} |`);
    indexOutput.afterText = updated;
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
      byTarget.set(promptRel, {
        targetRel: promptRel,
        targetAbs: promptAbs,
        before: existing?.before ?? promptBefore,
        afterText: opening.replaceAll("<absolute project root>", root),
        reason: "regenerated from authoritative handoff opening message"
      });
    }
  }

  const outputs = [];
  for (const item of byTarget.values()) {
    const after = encodeLikeExisting(item.afterText, item.before, item.targetRel);
    if (item.before && item.before.equals(after)) continue;
    outputs.push({ ...item, after, beforeHash: item.before ? sha256(item.before) : null, afterHash: sha256(after) });
  }
  return outputs;
}

async function prepareTransaction(root, command, version, outputs) {
  const id = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}`;
  const migrationsRoot = path.join(root, "dev", "governance_migrations");
  const migrationDir = path.join(migrationsRoot, id);
  const backupDir = path.join(migrationDir, "backup");
  const stageDir = path.join(migrationDir, "stage");
  const journalPath = path.join(migrationDir, "transaction.json");
  const lockPath = path.join(migrationsRoot, ".upgrade.lock");
  await mkdir(backupDir, { recursive: true });
  await mkdir(stageDir, { recursive: true });
  await tightenPermissions(migrationsRoot, 0o700);
  await tightenPermissions(migrationDir, 0o700);
  const lock = await open(lockPath, "wx", 0o600).catch((error) => {
    if (error?.code === "EEXIST") throw new Error("another upgrade transaction or unresolved recovery lock is present");
    throw error;
  });
  await lock.writeFile(JSON.stringify({ id, host: hostname(), pid: process.pid, journal: path.relative(root, journalPath) }, null, 2));
  await lock.close();

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
    entries.push({ targetRel: output.targetRel, existed: Boolean(output.before), beforeHash: output.beforeHash, afterHash: output.afterHash, backupRel, committed: false });
  }
  const journal = { id, command, attemptedVersion: version, committedVersion: null, host: hostname(), pid: process.pid, state: "prepared", createdAt: new Date().toISOString(), entries };
  await writeSecureJson(journalPath, journal);
  return { id, migrationDir, backupDir, stageDir, journalPath, lockPath, journal };
}

async function validateTransactionRoot(root, plan) {
  let rootStats;
  try {
    rootStats = await lstat(root);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    const parent = await nearestExistingRealParent(path.dirname(root));
    if (path.parse(path.resolve(root)).root === path.resolve(root)) throw new Error("selected root cannot be a filesystem root");
    await mkdir(root, { recursive: true });
    rootStats = await lstat(root);
    if (!isInside(parent, await realpath(root))) throw new Error("created root escaped its verified parent");
  }
  if (rootStats.isSymbolicLink()) throw new Error("selected root is a symbolic link or junction; use the resolved project root");
  const realRoot = await realpath(root);
  for (const item of plan) {
    if (item.action !== "create" && item.action !== "merge") continue;
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
  const outputMap = new Map(outputs.map((item) => [item.targetRel, decodeUtf8(item.after, item.targetRel).text]));
  const finalText = async (relative) => outputMap.get(relative) ?? await readOptionalText(path.join(root, relative));
  const failures = [];
  for (const target of requiredTargets) if ((await finalText(target)) == null) failures.push(`${target}: missing after transaction`);
  for (const rule of requiredAnchors) {
    const text = await finalText(rule.target);
    if (text == null) continue;
    for (const failure of requiredAnchorFailures(rule, text)) failures.push(`${rule.target}: ${failure.kind} ${failure.snippet}`);
  }
  for (const rule of schemaChecks) {
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

async function atomicReplaceFromBuffer(root, targetAbs, buffer, id) {
  const relative = path.relative(root, targetAbs);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("atomic target escaped root");
  await mkdir(path.dirname(targetAbs), { recursive: true });
  const tempPath = path.join(path.dirname(targetAbs), `.${path.basename(targetAbs)}.ack-${id}.tmp`);
  await writeFile(tempPath, buffer, { mode: 0o600 });
  await rename(tempPath, targetAbs);
}

async function rollbackTransaction(root, journal, journalPath) {
  const conflicts = [];
  for (const entry of [...journal.entries].reverse()) {
    if (!entry.committed) continue;
    const targetAbs = path.join(root, entry.targetRel);
    const current = await readOptionalBuffer(targetAbs);
    const currentHash = current ? sha256(current) : null;
    if (currentHash === entry.beforeHash) continue;
    if (currentHash !== entry.afterHash) {
      conflicts.push(`${entry.targetRel}: current content differs from both transaction input and candidate`);
      continue;
    }
    if (entry.existed) {
      const backup = await readFile(path.join(root, entry.backupRel));
      await atomicReplaceFromBuffer(root, targetAbs, backup, `${journal.id}-rollback`);
    } else {
      await unlink(targetAbs);
    }
  }
  journal.state = conflicts.length === 0 ? "rolled-back" : "manual-recovery-required";
  journal.rollbackAt = new Date().toISOString();
  journal.recoveryConflicts = conflicts;
  await writeSecureJson(journalPath, journal).catch(() => {});
  return { ok: conflicts.length === 0, conflicts };
}

async function recoverInterruptedTransaction(root) {
  const lockPath = path.join(root, "dev", "governance_migrations", ".upgrade.lock");
  let lock;
  try {
    lock = JSON.parse(await readFile(lockPath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw new Error("upgrade lock exists but is unreadable; no writes attempted");
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
  if (journal.state === "committed" || journal.state === "rolled-back") {
    await unlinkIfExists(lockPath);
    return;
  }
  const rollback = await rollbackTransaction(root, journal, journalPath);
  if (!rollback.ok) throw new Error(`interrupted upgrade has third-state edits: ${rollback.conflicts.join("; ")}`);
  await unlinkIfExists(lockPath);
  console.log("⚠️ recovered interrupted upgrade: transaction-owned changes were safely rolled back before planning this run");
}

async function writeTransactionReport(transaction, mode, plan) {
  const reportPath = path.join(transaction.migrationDir, "migration-report.md");
  const lines = [
    "# Agent Handoff Kit Migration Report",
    "",
    `- Transaction: ${transaction.id}`,
    `- Mode: ${mode}`,
    `- Attempted version: ${transaction.journal.attemptedVersion}`,
    `- Committed version: ${transaction.journal.attemptedVersion}`,
    `- Transaction state: ${transaction.journal.state}`,
    `- Created at: ${transaction.journal.createdAt}`,
    `- Committed at: ${transaction.journal.committedAt}`,
    "- Credential values: not recorded",
    "",
    "## Actions",
    "",
    ...transaction.journal.entries.map((entry) => `- ${entry.existed ? "merge" : "create"}: ${entry.targetRel}; backup=${entry.backupRel ?? "none"}; committed=${entry.committed}`),
    "",
    `- Planned skips: ${plan.filter((item) => item.action === "skip").length}`,
    "- Conflicts: 0"
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

function processIsAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

function stripMarkdownCommentsAndFences(text) {
  return text.replace(/<!--[\s\S]*?-->/g, "").replace(/```[\s\S]*?```/g, "");
}

function safeErrorLabel(error) {
  return String(error?.message ?? error).slice(0, 500);
}

async function runDoctor(root, version, options = {}) {
  if (!options.silentCard) printCard(version, "doctor ready", "o.o");
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

  const anchorRows = await checkRequiredAnchors(root);
  const anchorFailures = anchorRows.filter((row) => !row.ok);
  console.log(`\nrequired anchors: ${anchorRows.length}`);
  for (const row of anchorRows) {
    console.log(`${row.ok ? "ok" : "missing"}  ${row.target} (${row.label})`);
    if (!row.ok && row.missing && row.missing.length > 0) {
      console.log(`  missing anchor text: ${row.missing.map((snippet) => JSON.stringify(snippet)).join("; ")}`);
    }
  }

  if (anchorFailures.length > 0) {
    printAnchorRepairGuidance(anchorFailures, options.context);
    printDoctorSummary(version, root, "needs-fix", {
      checked: rows.length + anchorRows.length,
      failedKind: "anchor checks",
      failedCount: anchorFailures.length,
      nextStep: anchorRepairNextStep(options.context)
    });
    process.exitCode = 1;
    return "failed";
  }

  const schemaRows = await checkSchema(root);
  const schemaFailures = schemaRows.filter((row) => !row.ok);
  console.log(`\nschema checks: ${schemaRows.length}`);
  for (const row of schemaRows) {
    console.log(`${row.ok ? "ok" : "missing"}  ${row.target} (${row.label})`);
    if (!row.ok && row.missing.length > 0) {
      console.log(`  missing: ${row.missing.join("; ")}`);
    }
  }

  if (schemaFailures.length > 0) {
    printDoctorSummary(version, root, "needs-fix", {
      checked: rows.length + anchorRows.length + schemaRows.length,
      failedKind: "schema checks",
      failedCount: schemaFailures.length,
      nextStep: "把這段 doctor 輸出貼給 AI，請它先修交接結構，不要直接重裝覆蓋。"
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
      checked: rows.length + anchorRows.length + schemaRows.length + 2,
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
      checked: rows.length + anchorRows.length + schemaRows.length + researchTraceResult.checked,
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
      checked: rows.length + anchorRows.length + schemaRows.length + researchTraceResult.checked + temperatureResult.checked,
      failedKind: "handoff temperature boundary checks",
      failedCount: temperatureResult.findings.length,
      nextStep: "把一次性驗收證據、舊版本狀態、source token 或 Evidence chain 從 Durable Anchors / Next Priorities / opening message 移回 SESSION_LOG、PROJECT_INDEX 或 PROJECT_DECISIONS。"
    });
    process.exitCode = 1;
    return "failed";
  }

  const artifactResult = await checkGeneratedMarkdownGovernance(root);
  console.log(`\ngenerated markdown governance checks: ${artifactResult.checked}`);
  console.log(`${artifactResult.ok ? "ok" : "missing"}  dev/PROJECT_INDEX.md (generated Markdown registration; other formats require human review)`);
  if (!artifactResult.ok) {
    for (const finding of artifactResult.findings) {
      console.log(`  missing: ${finding}`);
    }
    printDoctorSummary(version, root, "needs-fix", {
      checked: rows.length + anchorRows.length + schemaRows.length + researchTraceResult.checked + temperatureResult.checked + artifactResult.checked,
      failedKind: "generated markdown governance checks",
      failedCount: artifactResult.findings.length,
      nextStep: "把新生成或新修改的 Markdown 登記到 dev/PROJECT_INDEX.md，或在 SESSION_LOG / task summary 以同一紀錄精確標成 draft、temporary 或 one-time evidence；如內容重複，先合併到單一真源。其他持久格式須由 AI 另作人工治理核對。"
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
      checked: rows.length + anchorRows.length + schemaRows.length + mirrorRows.length,
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
  const versionAlignment = await assessVersionAlignment(root, version);
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

  const overallHealthy = credentialResult.ok;
  printDoctorSummary(version, root, overallHealthy ? "healthy" : "needs-attention", {
      checked: rows.length + anchorRows.length + schemaRows.length + researchTraceResult.checked + temperatureResult.checked + artifactResult.checked + mirrorRows.length + 2,
    failedKind: !credentialResult.ok ? "credential leak" : null,
    failedCount: !credentialResult.ok ? credentialResult.findings.length : 0,
    warningKind: mirrorWarnings.length > 0 ? "prompt mirror warning" : null,
    warningCount: mirrorWarnings.length,
    nextStep: !credentialResult.ok
      ? "立即從相關檔案 redact credential value + rotate 已泄露 token；credential 應該由 AI 工具自身 secure storage 管理，永不寫入 dev/* 任何檔。"
      : disciplineResult.ok
      ? versionNextStep ?? promptMirrorNextStep ?? onboardingNextStep ?? "檢查已通過。繼續使用你原本的 AI 開工方式；準備結束本輪工作、需要保存交接、或有下一輪必須知道的狀態時，在 AI 對話輸入「收工」。"
      : "繼續使用；下次 closeout 時 AI 應自動執行 SESSION_LOG N 規則推進（見上面 warn 行）。如未動請要求 AI 重做 closeout。"
  });
  return overallHealthy ? "passed" : "failed";
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

async function checkGeneratedMarkdownGovernance(root) {
  let indexText = "";
  let logText = "";
  let handoffText = "";
  try {
    indexText = await readFile(path.join(root, "dev/PROJECT_INDEX.md"), "utf8");
  } catch {
    return { ok: false, checked: 1, findings: ["dev/PROJECT_INDEX.md unreadable; cannot verify generated Markdown governance"] };
  }
  try {
    logText = await readFile(path.join(root, "dev/SESSION_LOG.md"), "utf8");
  } catch {
    logText = "";
  }
  try {
    handoffText = await readFile(path.join(root, "dev/SESSION_HANDOFF.md"), "utf8");
  } catch {
    handoffText = "";
  }

  const markdownFiles = await listMarkdownFiles(root);
  const findings = [];
  for (const rel of markdownFiles) {
    if (!isGeneratedArtifactCandidate(rel)) continue;
    if (isArtifactGoverned(rel, { indexText, logText, handoffText })) continue;
    findings.push(`${rel} is not registered in dev/PROJECT_INDEX.md and is not explicitly classified as draft / temporary / one-time evidence`);
  }

  return { ok: findings.length === 0, checked: 1, findings };
}

async function listMarkdownFiles(root) {
  const results = [];
  async function walk(dir) {
    let entries = [];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".md")) continue;
      results.push(path.relative(root, full).split(path.sep).join("/"));
    }
  }
  await walk(root);
  return results.sort();
}

function isGeneratedArtifactCandidate(rel) {
  const normalized = rel.replaceAll("\\", "/");
  const lower = normalized.toLowerCase();
  const kitManaged = new Set([
    "agents.md",
    "claude.md",
    "gemini.md",
    "readme.md",
    "dev/session_handoff.md",
    "dev/session_log.md",
    "dev/project_index.md",
    "dev/doc_sync_registry.md",
    "dev/rule_packs.md",
    "dev/project_decisions.md"
  ]);
  if (kitManaged.has(lower)) return false;
  if (lower.startsWith("dev/rules/")) return false;
  if (lower.startsWith("dev/governance_migrations/")) return false;
  if (lower.startsWith("dev/session_log_archive/")) return false;
  if (lower.startsWith("docs/")) return true;
  if (lower.startsWith("outputs/")) return true;
  if (lower.startsWith("output/")) return true;
  if (lower.startsWith("research/")) return true;
  if (lower.startsWith("references/")) return true;
  if (lower.startsWith("reference/")) return true;
  if (lower.startsWith("runbooks/")) return true;
  if (lower.startsWith("specs/")) return true;
  if (lower.startsWith("requirements/")) return true;
  return !normalized.includes("/");
}

function isArtifactGoverned(rel, { indexText, logText, handoffText }) {
  const normalized = rel.replaceAll("\\", "/");
  if (projectIndexRegistersExactPath(indexText, normalized)) return true;
  return textExplicitlyClassifiesExactArtifact(logText, normalized)
    || textExplicitlyClassifiesExactArtifact(handoffText, normalized);
}

function projectIndexRegistersExactPath(indexText, normalized) {
  const active = stripMarkdownCommentsAndFences(indexText);
  for (const line of active.split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1);
    for (const rawCell of cells) {
      const cell = rawCell.trim().replace(/^`([^`]+)`$/, "$1");
      if (cell === normalized) return true;
      const link = /^\[[^\]]*\]\(([^)]+)\)$/.exec(cell);
      if (link && link[1].replace(/^<|>$/g, "") === normalized) return true;
    }
  }
  return false;
}

function textExplicitlyClassifiesExactArtifact(text, normalized) {
  const active = stripMarkdownCommentsAndFences(text);
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const exactPath = new RegExp(`(?:^|[\\s\`|([<])${escaped}(?=$|[\\s\`|)\\]>.,;:])`, "i");
  const label = /(draft|temporary|one-time evidence|non-authoritative|not source of truth|草稿|臨時|暫存|一次性|非真源|非權威)/i;
  const markdownPath = /(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.md\b/gi;
  for (const line of active.split(/\r?\n/)) {
    if (!exactPath.test(line) || !label.test(line)) continue;
    const paths = new Set((line.match(markdownPath) ?? []).map((item) => item.replaceAll("\\", "/").toLowerCase()));
    if (paths.size === 1 && paths.has(normalized.toLowerCase())) return true;
  }
  return false;
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
    console.log(`⚠️  檢查未通過：${details.failedKind === "missing files" ? "有必要檔案不存在。" : details.failedKind === "anchor checks" ? "有檔案存在，但內容缺少必要段落。" : details.failedKind === "schema checks" ? "交接或索引文件結構不完整。" : details.failedKind === "research decision trace checks" ? "研究導向決策缺少可追溯來源鏈。" : details.failedKind === "handoff temperature boundary checks" ? "當前交接內容混入一次性或歷史證據。" : details.failedKind === "generated markdown governance checks" ? "有 Markdown 未完成登記、同步或精確臨時分類；其他持久格式須另作人工治理核對。" : "下次開工提示副本與 handoff 真源不同。"}`);
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
  return extractSectionText(text, markerId, headingTitle)
    .replace(/```[\s\S]*?```/g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter((line) => line.length > 3 && !line.startsWith("##") && !line.startsWith("<!--") && !/^(TBD|none|n\/a|未適用|無)$/i.test(line));
}

function lifecycleTopicTokens(line) {
  const latin = (line.toLowerCase().match(/[a-z0-9][a-z0-9_-]{3,}/g) ?? [])
    .filter((token) => !new Set(["completed", "complete", "passed", "verified", "pending", "blocked", "follow-up", "monitor-only", "reopened", "session", "current", "next", "work", "task", "with", "from", "that", "this", "handoff", "lifecycle", "migration", "regression", "agent"]).has(token));
  const chineseRuns = line.match(/[\u3400-\u9fff]{2,}/g) ?? [];
  const chinese = chineseRuns.flatMap((run) => Array.from({ length: Math.max(0, run.length - 1) }, (_, index) => run.slice(index, index + 2)));
  return new Set([...latin, ...chinese]);
}

function lifecycleTopicsOverlap(left, right) {
  const leftCompact = left.toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]+/g, "");
  const rightCompact = right.toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]+/g, "");
  if (leftCompact.length >= 8 && rightCompact.length >= 8 && (leftCompact.includes(rightCompact) || rightCompact.includes(leftCompact))) return true;
  const leftTokens = lifecycleTopicTokens(left);
  const common = [...lifecycleTopicTokens(right)].filter((token) => leftTokens.has(token));
  return common.length >= 2;
}

function isExplicitLifecycleReclassification(line) {
  const category = /(monitor-only|follow-up scope|blocked|reopened|只監察|後續追蹤|受阻|重開)/i.test(line);
  const condition = /(trigger|until|when|missing evidence|reason|條件|證據|原因|待.+(?:時|後))/i.test(line);
  return category && condition;
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
  const context = {
    currentVersion: version,
    rootTemplateVersion: command === "upgrade" ? await readRootTemplateVersion(root) : null,
    migrationBaselines: new Map()
  };
  if (command === "upgrade" && context.rootTemplateVersion === "0.3.38") {
    for (const relative of ["packs/integrations.md", "packs/onboarding.md", "packs/safety.md"]) {
      const baseline = await readOptionalText(path.join(packageRoot, "bin", "migration-baselines", "v0.3.38", path.basename(relative)));
      if (baseline != null) context.migrationBaselines.set(relative, baseline);
    }
  }
  for (const [sourceRel, targetRel] of mappings) {
    const sourceAbs = path.join(packageRoot, sourceRel);
    const targetAbs = path.join(root, targetRel);
    const sourceText = await readFile(sourceAbs, "utf8");
    if (await exists(targetAbs)) {
      const targetText = await readFile(targetAbs, "utf8");
      plan.push(classifyExistingFile(command, sourceRel, targetRel, sourceAbs, targetAbs, sourceText, targetText, context));
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

async function readRootTemplateVersion(root) {
  try {
    const indexPath = path.join(root, "dev/PROJECT_INDEX.md");
    const text = await readFile(indexPath, "utf8");
    const m = text.match(/\| Agent Handoff Kit template version \| ([\d.]+) \|/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

function classifyExistingFile(command, sourceRel, targetRel, sourceAbs, targetAbs, sourceText, targetText, context = {}) {
  const base = { sourceRel, targetRel, sourceAbs, targetAbs };
  if (targetText.replace(/\r\n/g, "\n") === sourceText.replace(/\r\n/g, "\n") && targetRel !== "AGENTS.md") return { ...base, action: "skip", reason: "already current" };
  if (targetRel === "AGENTS.md") {
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
        reason: "insert or normalize the unique Installed Integrations and Tool Operation References H2 sections while preserving all existing project content",
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
    if (migratedHandoff !== targetText) {
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
      return { ...base, action: "merge", reason: "update only the log preamble/template and remove Kit-shaped full prompt copies while preserving trace entries", mergedText: migratedLog };
    }
    return { ...base, action: "skip", reason: "SESSION_LOG.md trace/template boundary current" };
  }
  if (command === "upgrade" && ["dev/rules/integrations.md", "dev/rules/onboarding.md", "dev/rules/safety.md"].includes(targetRel)) {
    const baseline = context.migrationBaselines?.get(sourceRel);
    if (baseline != null) {
      const mergedPack = threeWayPreserveLocalChanges(baseline, targetText, sourceText);
      if (!mergedPack) {
        return { ...base, action: "conflict", reason: `${targetRel} has local edits that overlap changed Kit rules; upgrade stopped without replacing custom content` };
      }
      if (mergedPack !== targetText) {
        return { ...base, action: "merge", reason: `three-way merge v0.3.38 official rules while preserving non-overlapping local ${path.basename(targetRel)} changes`, mergedText: mergedPack };
      }
      return { ...base, action: "skip", reason: `${targetRel} current after three-way preservation check` };
    }
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
  if (command === "upgrade" && hasMisplacedRequiredAnchor(targetRel, targetText)) {
    return { ...base, action: "conflict", reason: "required Kit anchors are present outside trusted semantic sections; upgrade stopped to avoid accepting naked anchor text as valid state" };
  }
  if (command === "upgrade" && hasMissingRequiredAnchor(targetRel, targetText)) {
    const semanticRepair = mergeMissingRequiredAnchorsSemantically(targetRel, targetText, sourceText);
    if (semanticRepair) {
      return { ...base, ...semanticRepair };
    }
    return { ...base, action: "conflict", reason: "required Kit anchors are missing but no safe semantic repair path exists; upgrade stopped without appending naked anchor text" };
  }
  if (targetRel === "CLAUDE.md" || targetRel === "GEMINI.md") {
    if (looksLikeExpandedKitBridge(targetRel, targetText)) {
      return {
        ...base,
        action: "merge",
        reason: `${targetRel} appears to be an expanded Kit bridge; restore short bridge so AGENTS.md remains the single source of truth`,
        mergedText: sourceText
      };
    }
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

function looksLikeExpandedKitBridge(targetRel, text) {
  if (text.includes("This file is a bridge only")) return false;
  if (targetRel === "CLAUDE.md") {
    return (text.includes("This file provides guidance to Claude Code") && text.includes("## Session Startup"))
      || text.includes("## Architecture")
      || text.includes("## CLI Commands")
      || text.includes("Every non-trivial task follows");
  }
  if (targetRel === "GEMINI.md") {
    return text.includes("## Architecture")
      || text.includes("## CLI Commands")
      || text.includes("Every non-trivial task follows");
  }
  return false;
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
  const currentSignalBoundary = "- equivalent Chinese user phrases such as \"新手\", \"教我用\", \"我剛安裝\", \"點開始\", \"能力\", or \"能做甚麼\"\n\n### Continuity startup boundary\n\n`Start Agent Handoff` / \"開工\" starts continuity and reads the current handoff state; it is not an onboarding signal. If the same message or loaded state contains a concrete objective, infer the working scenario and begin the first safe action. Only when no executable objective remains after state reading should the AI ask one concise question or offer the guided onboarding path. Explicit requests such as \"新手，教我用\" enter onboarding directly.";
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
      .filter((failure) => failure.kind === "missing")
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
  if (snippet === "ack:section:session-log-preamble") return text.includes("ack:section:session-log-preamble");
  if (snippet === "ack:section:session-log-entry-template") return text.includes("ack:section:session-log-entry-template");
  if (snippet === "## Entry Template") return /^## Entry Template\s*$/m.test(text);
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
  const markerIndex = text.indexOf("<!-- ack:section:session-log-entry-template -->");
  if (markerIndex >= 0) return text.slice(markerIndex).includes(snippet);
  return snippetAppearsAfterHeading(text, snippet, "## Entry Template");
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
  if (snippet === "Agent Handoff Kit template version") return Boolean(projectIndexTemplateVersion(text));
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
  if (snippet === "Continuity startup boundary" || snippet === "starts continuity and reads the current handoff state; it is not an onboarding signal") {
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
  if (projectIndexTemplateVersion(targetText)) return targetText;
  const sourceRow = sourceText.match(/^\| Agent Handoff Kit template version \| [\d.]+ \| [^|\n]+ \|$/m)?.[0];
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
  const linePattern = /.*(?:\r?\n|$)/g;
  let fenced = false;
  let fenceDelimiter = null;
  let inComment = false;
  let match;
  while ((match = linePattern.exec(text)) && match[0] !== "") {
    const raw = match[0];
    const line = raw.replace(/\r?\n$/, "");
    const trimmed = line.trim();
    if (inComment) {
      if (trimmed.includes("-->")) inComment = false;
      continue;
    }
    if (trimmed.startsWith("<!--")) {
      if (!trimmed.includes("-->")) inComment = true;
      continue;
    }
    const fence = trimmed.match(/^(`{3,}|~{3,})/);
    if (fence) {
      if (!fenced) {
        fenced = true;
        fenceDelimiter = fence[1][0];
      } else if (fence[1][0] === fenceDelimiter) {
        fenced = false;
        fenceDelimiter = null;
      }
      continue;
    }
    if (fenced) continue;
    const headingMatch = line.match(/^## ([^#].*?)\s*$/);
    if (headingMatch) sections.push({ title: headingMatch[1], start: match.index, end: text.length });
  }
  for (let index = 0; index < sections.length - 1; index += 1) {
    sections[index].end = sections[index + 1].start;
  }
  return sections;
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
    const insertion = missing
      .map((title) => sourceText.slice(sourceByTitle.get(title)[0].start, sourceByTitle.get(title)[0].end).trimEnd())
      .join("\n\n");
    merged = `${targetText.slice(0, localQc.start).trimEnd()}\n\n${insertion}\n\n${targetText.slice(localQc.start)}`;
  }
  merged = mergeProjectIndexCredentialReferences(merged);
  return projectIndexGovernanceSectionsAreValid(merged) ? merged : null;
}

function mergeProjectIndexCredentialReferences(targetText) {
  return targetText
    .replace(
      /`via` column 紀律：每行 External Sources 必引用 `## Installed Integrations`[^\r\n]*/,
      "`via` column discipline: every External Sources row must reference an entry name under `## Installed Integrations`, such as `Notion Connector` or `Google Drive Connector`, so the access path is explicit. Sources without a declared integration use `manual paste`. Doctor and release QA enforce cross-section consistency."
    )
    .replace(
      /⚠️ \*\*機密分離原則\*\*：本 section 只記錄[^\r\n]*/,
      "**Credential Separation Principle**: this section records only project usage and public reference coordinates such as Notion database names, URLs, or folder paths. It must never record API keys, OAuth tokens, or credential values. Credentials belong in AI runtime secure storage, OS credential stores, tool configuration, or user-managed secret stores. If an environment variable is used, record only the variable name, never the value. Before writing this section, self-check that no credential value is being persisted. Doctor scans this section, `SESSION_HANDOFF`, and `SESSION_LOG` for common credential prefixes such as `sk-`, `ntn_`, `ya29.`, `xoxp-`, `ghp_`, `sl.`, `AKIA`, and `AIza`."
    )
    .replace(
      /用途：新 AI session 開工讀本 section 知道[^\r\n]*/,
      "Purpose: a new AI session reads this section to understand declared external-tool capabilities and their project roles. Declarations persist across sessions. Every entry must include `Declared` and `Last Verified` fields so stale capability assumptions can be detected."
    )
    .replace("### Connectors（Anthropic 官方 vetted）", "### Connectors")
    .replace("### MCPs（community / custom）", "### MCPs")
    .replace("### Plugins（Claude Code plugin bundle）", "### Plugins")
    .replace("### Skills（SKILL.md instruction set）", "### Skills")
    .replace("### Source-of-truth Architecture（多層持久化組合）", "### Source-of-truth Architecture")
    .replace(
      /當項目用多個整合構成 source-of-truth 架構[^\r\n]*/,
      "When a project uses several integrations as a source-of-truth system, for example Notion index + local primary sources + Google Drive reference mirror, this table records each layer's role so agents do not cross write boundaries."
    )
    .replace(
      "| TBD | TBD（譬如 DB Index 記真源 path / 持久化參考檔儲存） | read / read+write | TBD（譬如 DB 名 + URL / folder path） | TBD（譬如 `AI tool secure storage` / `OS credential store`） | TBD | TBD |",
      "| TBD | TBD, for example an index of source paths or persistent reference storage | read / read+write | TBD, for example database name + URL or folder path | TBD, for example `AI tool secure storage` / `OS credential store` | TBD | TBD |"
    )
    .replace(
      "| TBD | TBD（譬如 GitHub repo URL） | TBD | TBD（譬如 `tool config + env var name only` / `user-managed secret store`） | TBD | TBD |",
      "| TBD | TBD, for example GitHub repository URL | TBD | TBD, for example `tool config + env var name only` / `user-managed secret store` | TBD | TBD |"
    )
    .replace(
      "| TBD | TBD（譬如 plugin bundle / user-level install） | TBD | TBD |",
      "| TBD | TBD, for example plugin bundle or user-level install | TBD | TBD |"
    )
    .replace(
      "| 真源（source of truth） | TBD（譬如 本機 `~/project/reference/`） | 原始可審計 reference 內容 | 用戶手動置入；AI 不直接寫入 |",
      "| Source of truth | TBD, for example local `~/project/reference/` | Original auditable reference content | User-controlled placement; agent does not write directly unless explicitly authorized |"
    )
    .replace(
      "| Index | TBD（譬如 Notion DB「Project Index」） | 登記每份真源檔 metadata + 摘要 + tag | AI 經 Connector 直接讀寫 |",
      "| Index | TBD, for example Notion database `Project Index` | Metadata, summaries, and tags for each source file | Agent may read/write through a verified Connector |"
    )
    .replace(
      "| 持久化參考檔（mirror） | TBD（譬如 Drive folder「Project Reference/」） | 防本機 disk failure / 跨裝置 access | 用戶手動同步；AI 唔自動 push |",
      "| Persistent mirror | TBD, for example Drive folder `Project Reference/` | Backup or cross-device reference mirror | User-controlled sync by default; agent does not push automatically |"
    )
    .replace(
      "| Working draft | TBD（譬如 本機 `~/project/output/`） | AI 寫 task output | AI 直接 read + write 本機 |",
      "| Working draft | TBD, for example local `~/project/output/` | Agent task output | Agent may read and write local files under normal safety rules |"
    )
    .replace(
      "Credential 應由 AI 工具自身 secure storage 管理（譬如 Claude Desktop Extensions 嘅 OS Keychain / Claude Code MCP config）。",
      "Credential 應由 AI 工具自身 secure storage / OS credential store / tool config / user-managed secret store 管理；若使用 env，只可記錄 env var name，不可讀取、貼出或保存 value。"
    )
    .replaceAll(
      "Credential Location",
      "Credential Reference（no value）"
    )
    .replaceAll(
      "Credential Reference（no value）",
      "Credential Reference (no value)"
    )
    .replaceAll(
      "Bundle Content（Skills + MCP + hooks）",
      "Bundle Content (Skills + MCP + hooks)"
    )
    .replaceAll(
      "Surface（具體 instance）",
      "Surface (specific instance)"
    )
    .replace(
      "`Claude Desktop Extensions`",
      "`AI tool secure storage` / `OS credential store`"
    )
    .replace(
      "`Claude Code MCP config + env var`",
      "`tool config + env var name only` / `user-managed secret store`"
    );
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
    if (!sameRuleShape(targetLines[targetIndex], sourceLine, snippet)) return null;
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

function sameRuleShape(targetLine, sourceLine, snippet) {
  const snippetIndex = sourceLine.indexOf(snippet);
  if (snippetIndex < 0) return false;
  const prefix = sourceLine.slice(0, snippetIndex);
  const suffix = sourceLine.slice(snippetIndex + snippet.length);
  return prefix.length >= 12
    && suffix.length >= 8
    && targetLine.startsWith(prefix)
    && targetLine.endsWith(suffix);
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

function projectIndexTemplateVersion(text) {
  const bounds = textSectionBounds(text, "## Stack", "## Directory Map");
  if (!bounds) return null;
  const stack = text.slice(bounds.start, bounds.end);
  const row = stack.match(/^\| Agent Handoff Kit template version \| ([\d.]+) \| [^|\n]+ \|$/m);
  return row ? row[1] : null;
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
  merged = mergeSessionLogEvidenceDispositionField(merged) ?? merged;

  const startMarker = "<!-- ack:log-entry:start -->";
  const endMarker = "<!-- ack:log-entry:end -->";
  if (countText(merged, startMarker) !== 1 || countText(merged, endMarker) !== 1
    || countText(sourceText, startMarker) !== 1 || countText(sourceText, endMarker) !== 1) return null;
  const targetStart = merged.indexOf(startMarker);
  const targetEnd = merged.indexOf(endMarker, targetStart) + endMarker.length;
  const sourceStart = sourceText.indexOf(startMarker);
  const sourceEnd = sourceText.indexOf(endMarker, sourceStart) + endMarker.length;
  merged = `${merged.slice(0, targetStart)}${sourceText.slice(sourceStart, sourceEnd)}${merged.slice(targetEnd)}`;

  merged = merged.replace(/```(?:text)?\s*\r?\n([\s\S]*?)\r?\n```/g, (block, content) => {
    const signatures = ["Work in ", "Read AGENTS.md", "SESSION_HANDOFF.md", "PROJECT_INDEX.md"];
    return signatures.every((signature) => content.includes(signature))
      ? "Opening-message mirror: migrated; full text omitted by design."
      : block;
  });
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
  let merged = ensureHandoffPersistenceRoutingField(targetText);
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
  if (targetText.includes("- **Evidence disposition:**")) return mergeSessionLogTemplateContract(targetText, null) ?? targetText;
  const qcField = "- **QC:**";
  if (!targetText.includes(qcField)) return null;
  const withEvidence = targetText.replace(qcField, `${qcField}\n- **Evidence disposition:** <one-time only / kept as recent trace evidence / absorbed into handoff / indexed in PROJECT_INDEX / promoted to PROJECT_DECISIONS / promoted to rule pack>`);
  return mergeSessionLogTemplateContract(withEvidence, null) ?? withEvidence;
}

function mergeSessionLogTemplateContract(targetText, sourceText = null) {
  let merged = targetText;
  let changed = false;

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

  if (!merged.includes("ack:section:session-log-entry-template")) {
    const headingMatch = /^## Entry Template\s*$/m.exec(merged);
    if (headingMatch) {
      merged = `${merged.slice(0, headingMatch.index)}<!-- ack:section:session-log-entry-template -->\n\n${merged.slice(headingMatch.index)}`;
      changed = true;
    }
  }

  if (sourceText) {
    const restored = restoreMissingSessionLogPreambleLines(merged, sourceText);
    if (restored !== merged) {
      merged = restored;
      changed = true;
    }
  }

  const entryTemplateIndex = merged.search(/^## Entry Template\s*$/m);
  if (entryTemplateIndex >= 0) {
    const beforeTemplate = merged.slice(0, entryTemplateIndex);
    let templateAndAfter = merged.slice(entryTemplateIndex);
    if (!templateAndAfter.includes("ack:log-entry:start")) {
      const replaced = templateAndAfter.replace(/````markdown(\r?\n)/, "````markdown$1<!-- ack:log-entry:start -->$1");
      if (replaced !== templateAndAfter) {
        templateAndAfter = replaced;
        changed = true;
      }
    }
    if (!templateAndAfter.includes("ack:log-entry:end")) {
      const openingIndex = templateAndAfter.indexOf("````markdown");
      const closingIndex = openingIndex >= 0
        ? templateAndAfter.indexOf("\n````", openingIndex + "````markdown".length)
        : -1;
      if (closingIndex >= 0) {
        templateAndAfter = `${templateAndAfter.slice(0, closingIndex)}\n<!-- ack:log-entry:end -->${templateAndAfter.slice(closingIndex)}`;
        changed = true;
      }
    }
    merged = `${beforeTemplate}${templateAndAfter}`;
  }

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
async function assessVersionAlignment(root, cliVersion) {
  const indexPath = path.join(root, "dev/PROJECT_INDEX.md");
  let rootVersion = null;
  try {
    const text = await readFile(indexPath, "utf8");
    rootVersion = projectIndexTemplateVersion(text);
  } catch {
    // file missing or unreadable; rootVersion stays null
  }

  let npmLatest = null;
  try {
    npmLatest = await fetchLatestVersion();
  } catch {
    // network failure; npmLatest stays null
  }

  return { cliVersion, rootVersion, npmLatest };
}

function printVersionAlignment(result) {
  const { cliVersion, rootVersion, npmLatest } = result;
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
  const { cliVersion, rootVersion, npmLatest } = result;
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
    const timestamps = entries.filter((name) => /^\d{8}T\d{6}Z$/.test(name)).sort();
    if (timestamps.length === 0) return { firstInstall: null };
    const oldest = timestamps[0];
    // Format: 20260423T112233Z → 2026-04-23
    const year = oldest.slice(0, 4);
    const month = oldest.slice(4, 6);
    const day = oldest.slice(6, 8);
    return { firstInstall: `${year}-${month}-${day}` };
  } catch {
    return { firstInstall: null };
  }
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

function printPlan(command, root, mode, plan, version, isDryRun = false) {
  printCard(version, "continuity ready", "o.o");
  console.log(`command: ${command}`);
  console.log(`current directory: ${process.cwd()}`);
  console.log(`selected root: ${root}`);
  console.log(`mode: ${mode}`);
  console.log("");
  const planIntro = planIntroFor(command, mode, isDryRun);
  console.log(planIntro);
  console.log("");
  for (const action of ["create", "merge", "skip", "conflict"]) {
    const items = plan.filter((item) => item.action === action);
    console.log(`${action}: ${items.length}`);
    for (const item of items) console.log(`  ${item.targetRel}${item.reason ? ` - ${item.reason}` : ""}`);
  }
  console.log(`\nbackup: ${plan.filter((item) => item.action === "merge").length}`);
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
  return `${prefix} create 代表建立缺少檔案；merge 代表先備份再合併；skip 代表保留既有檔案；conflict 代表工具停手等你判斷。`;
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
    console.log("🚀 下一步：把 migration report 或這段輸出貼給 AI，請它判斷衝突檔案怎樣處理；工具已停手，沒有覆寫 conflict 檔案。");
  } else if (command === "upgrade") {
    console.log("🚀 下一步：留意下方升級後自動檢查；若全綠即升級完成。");
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
  console.log(`⚠️  需要人工確認：有 ${conflicts.length} 個既有檔案，工具不能安全判斷怎樣合併。`);
  console.log("⚠️  這不是檔案壞掉，也沒有覆寫你的檔案。");
  console.log("📋 下一步：把這段輸出貼給 AI，叫它幫你判斷要保留、合併，還是手動修改。");
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

async function writeMigrationReport(root, command, mode, plan, created, merged, conflicts, migrationDir, backupDir, metadataUpdated = null) {
  const reportPath = path.join(migrationDir, "migration-report.md");
  await mkdir(migrationDir, { recursive: true });
  const skipped = plan.filter((item) => item.action === "skip").map((item) => item.targetRel);
  const text = [
    "# Agent Handoff Kit Migration Report",
    "",
    `Command: ${command}`,
    `Mode: ${mode}`,
    `Root: ${root}`,
    `Created: ${new Date().toISOString()}`,
    "",
    "## Created",
    ...listOrNone(created),
    "",
    "## Merged",
    ...listOrNone(merged),
    "",
    "## Skipped Existing",
    ...listOrNone(skipped),
    "",
    "## Conflicts",
    ...listOrNone(conflicts.map((item) => `${item.targetRel} - ${item.reason}`)),
    "",
    // R-031.3 v0.3.4+: metadata updates are tracked separately from file create/merge
    // because they mutate specific rows inside an otherwise user-owned file rather
    // than replacing or merging the file as a whole. Audit trail completeness
    // requires this section even when create/merge/conflict counts are all 0.
    "## Metadata Updates",
    metadataUpdated
      ? `- ${metadataUpdated.file}: ${metadataUpdated.field} ${metadataUpdated.from} → ${metadataUpdated.to}`
      : "- none",
    "",
    "## Backup",
    merged.length > 0 ? `- ${path.relative(root, backupDir)}` : "- none",
    "",
    "## Notes",
    "- Existing files are preserved unless the installer can perform a bounded merge.",
    "- Files that cannot be safely merged are reported as conflicts and are not overwritten.",
    "- Metadata Updates section tracks row-level mutations (R-031.3) distinct from file-level changes."
  ].join("\n");
  await writeFile(reportPath, `${text}\n`, "utf8");
  return reportPath;
}

function migrationStamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

async function readPackageVersion() {
  try {
    const text = await readFile(path.join(packageRoot, "package.json"), "utf8");
    return JSON.parse(text).version ?? "version unverified";
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
    console.log("⚠️  狀態：有既有檔案需要人工確認，詳情見 migration report。");
    console.log("⚠️  這不是檔案壞掉；工具已停手，沒有覆寫 conflict 檔案。");
    console.log("📋 下一步：把 migration report 或這段輸出貼給 AI，請它幫你判斷怎樣合併。");
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
    console.log("⚠️  升級未完成：有檔案需要人工確認");
    console.log("============================================================");
    console.log("⚠️  狀態：有既有檔案需要人工確認，詳情見 migration report。");
    console.log("⚠️  這不是檔案壞掉；工具已停手，沒有覆寫 conflict 檔案。");
    console.log("📋 下一步：把 migration report 或這段輸出貼給 AI，請它幫你判斷怎樣合併。");
    console.log("============================================================");
    return;
  }
  console.log("🛠️  Kit migration 已通過離線提交閏；下方 doctor 另行回報整體項目健康");
  console.log("============================================================");
  console.log("📋 如你正在進行中的工作對話已熟悉 Agent Handoff Kit，繼續使用原本的開工方式即可，無需重新做新手引導。");
  console.log("");
  console.log("💡 版本詳情不在升級流程內展開；如需要，可稍後查看 GitHub Release：");
  console.log("   https://github.com/Adamchanadam/agent-handoff-kit/releases/latest");
  console.log("");
  console.log("🩺 升級驗收會在下方自動執行 doctor；若全綠即升級完成。");
  console.log("============================================================");
}

// R-031 v0.3.24+: Upgrade no-op may skip file writes, but it must not skip the
// single health authority. If the CLI says a latest root can continue, that claim
// is backed by the same runDoctor() implementation users would invoke manually.
async function assessUpgradeNoopHealth(root, version) {
  const originalLog = console.log;
  const originalError = console.error;
  const previousExitCode = process.exitCode;
  const stdout = [];
  const stderr = [];

  try {
    console.log = (...args) => stdout.push(args.join(" "));
    console.error = (...args) => stderr.push(args.join(" "));
    process.exitCode = undefined;
    const status = await runDoctor(root, version, { silentCard: true, context: "upgrade-noop-health-check" });
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

function listOrNone(items) {
  if (items.length === 0) return ["- none"];
  return items.map((item) => `- ${item}`);
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

Commands:
  init      Plan or install missing core files and rule packs.
  upgrade   Preserve existing files; merge safe core updates or report conflicts.
  doctor    Check required installed files.

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
