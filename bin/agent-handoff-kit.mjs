#!/usr/bin/env node

import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { copyFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assessPromptMirrorTexts, extractOpeningMessage } from "./prompt-mirror-core.mjs";

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
  ["packs/onboarding.md", "dev/rules/onboarding.md"],
  ["packs/integrations.md", "dev/rules/integrations.md"]
];

const requiredTargets = mappings.map(([, target]) => target);
const managedCoreStart = "<!-- BEGIN Agent Handoff Kit managed core -->";
const managedCoreEnd = "<!-- END Agent Handoff Kit managed core -->";

const requiredAnchors = [
  {
    target: "AGENTS.md",
    label: "startup read order",
    snippets: [
      "## 1. Startup Reads",
      "dev/SESSION_HANDOFF.md",
      "dev/SESSION_LOG.md",
      "dev/PROJECT_INDEX.md",
      "dev/RULE_PACKS.md",
      "Agent Handoff Kit v<version>",
      "Display version rule",
      "Agent Handoff Kit template version",
      "continuity ready",
      "Start Agent Handoff",
      "Ambiguous startup phrases",
      "Reachable is not the same as ingested",
      "Do not treat unread sources as absent",
      // R-030 v0.3.0+: forces managed-core merge on v0.2.x → v0.3.0 upgrade to propagate
      // startup availability probe + integrations pack reference + credential separation discipline.
      "startup availability probe",
      "dev/rules/integrations.md",
      "Credential separation"
    ]
  },
  {
    target: "AGENTS.md",
    label: "closeout intent and full handoff",
    snippets: [
      "Detect end-of-session or handoff intent",
      "收工",
      "Wrap up Agent Handoff",
      "Ambiguous closeout phrases",
      "wrap up",
      "handoff",
      "Reconcile `dev/SESSION_HANDOFF.md`",
      "Add a concise entry to `dev/SESSION_LOG.md`",
      "Closeout Write Contract",
      "ack:log-entry:start/end",
      "next-session opening message",
      "fenced `text` code block",
      "handoff saved",
      "Use the same display version rule as startup",
      "Never print the literal placeholder `v<version>`",
      "next-session startup entry",
      "State Reconciliation Check",
      "handoff lifecycle consistency",
      "Do not append a new state snapshot",
      "START_NEXT_SESSION_PROMPT.txt"
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
      "ack:field:lifecycle-conflicts-resolved",
      "ack:field:persistence-routing-checked",
      "📋 Next session:",
      "```text",
      "Read in order:",
      "dev/DOC_SYNC_REGISTRY.md"
    ]
  },
  {
    target: "dev/SESSION_LOG.md",
    label: "session log event and opening message schema",
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
      "### Next Session Opening Message",
      "📋 Next session:",
      "```text",
      "Read in order:",
      "dev/DOC_SYNC_REGISTRY.md"
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
      "latest opening message",
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
    target: "dev/rules/safety.md",
    label: "safety pack high-risk anchors",
    placement: safetyAnchorPlacement,
    snippets: [
      "deleting, overwriting, moving, renaming",
      "filesystem root, drive root",
      "cmd /c rmdir",
      "git reset --hard",
      "external APIs, SDKs, CLIs",
      "secret values"
    ]
  },
  {
    target: "dev/PROJECT_DECISIONS.md",
    label: "project decisions narrative anchors",
    placement: projectDecisionsAnchorPlacement,
    snippets: [
      "Project Decisions Log",
      "warm 資料層",
      "AI 開工",
      "不需要讀",
      "AI 在收工時自動 update",
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
      "明確 onboarding signal keywords",
      "5-step walk-through pattern",
      "Application Scenario Library",
      "Scenario A. 建構系統 / 工具 / 平台 / 網站或應用",
      "Scenario B. 整理研究資料",
      "Scenario C. 整理電腦檔案",
      "Scenario D. 學寫代碼",
      "Scenario E. 其他",
      "Scenario F. 審視已裝外部工具",
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
      "機密分離原則",
      "Source-of-truth Architecture",
      "Cross-session Lifecycle",
      "Connector-first default",
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
      marker("field", "opening-message-matches-current-state", "Opening message matches current state"),
      marker("field", "state-sections-rewritten-or-confirmed", "State sections rewritten or confirmed current"),
      marker("field", "user-intent", "User intent:"),
      marker("field", "task-essence", "Task essence:"),
      marker("field", "success-criteria", "Success criteria:")
    ]
  },
  {
    target: "dev/SESSION_HANDOFF.md",
    label: "handoff opening message structure",
    checks: [
      includes("📋 Next session:"),
      includes("```text"),
      includes("Work in "),
      includes("Read in order:"),
      includes("If this root does not match the expected project root")
    ]
  },
  {
    target: "dev/SESSION_HANDOFF.md",
    label: "handoff lifecycle consistency",
    checks: [
      {
        label: "completed work is not carried forward as unresolved next work",
        test: (text) => assessHandoffLifecycleConsistency(text).ok
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
      includes("- **Log maintenance:**")
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
      heading("Local QC Commands"),
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
      tableHeader("Tool", "Project Usage", "Access Scope", "Specific Instance", "Credential Location", "Declared", "Last Verified"),
      tableHeader("Server", "Source", "Project Usage", "Credential Location", "Declared", "Last Verified"),
      tableHeader("Name", "Bundle Content（Skills + MCP + hooks）", "When Triggered", "Last Verified"),
      tableHeader("Name", "Source", "When Triggered", "Last Verified"),
      tableHeader("Layer", "Surface（具體 instance）", "Role", "Write Direction")
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
      includes("First-time user signals"),
      includes("dev/rules/onboarding.md"),
      // R-030 v0.3.0+: routing table must include integrations pack row.
      includes("dev/rules/integrations.md")
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
    label: "onboarding pack structure (新手引導包)",
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
    label: "integrations pack structure (外部工具治理)",
    checks: [
      heading("Scope"),
      heading("Load When"),
      heading("Discipline"),
      heading("Rules"),
      heading("Checks"),
      heading("Closeout"),
      heading("Anti-pattern（不要做的事）"),
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
  const mode = await detectMode(root);
  const plan = await buildPlan(root, command, version);

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

  if (!options.yes) {
    const ok = await confirmWrite();
    if (!ok) {
      console.log("cancelled: no files written");
      return;
    }
  }

  const created = [];
  const merged = [];
  const conflicts = plan.filter((item) => item.action === "conflict");
  const stamp = migrationStamp();
  const migrationDir = path.join(root, "dev/governance_migrations", stamp);
  const backupDir = path.join(migrationDir, "backup");

  for (const item of plan) {
    if (item.action !== "create") continue;
    await mkdir(path.dirname(item.targetAbs), { recursive: true });
    await copyFile(item.sourceAbs, item.targetAbs);
    created.push(item.targetRel);
  }

  await hydrateInitialOpeningPrompt(root, created);

  for (const item of plan) {
    if (item.action !== "merge") continue;
    const backupPath = path.join(backupDir, item.targetRel);
    await mkdir(path.dirname(backupPath), { recursive: true });
    await copyFile(item.targetAbs, backupPath);
    await writeFile(item.targetAbs, item.mergedText, "utf8");
    merged.push(item.reason ? `${item.targetRel} - ${item.reason}` : item.targetRel);
  }

  const promptRegenerated = await regeneratePromptFromHandoffIfHotEvidence(root, backupDir, merged);
  if (promptRegenerated) {
    console.log("auto-repair: START_NEXT_SESSION_PROMPT.txt - regenerate prompt from repaired handoff opening message");
  }

  // R-031.3 v0.3.4+: Inject current CLI version into PROJECT_INDEX template version
  // metadata row — placed AFTER the merge loop to avoid the ordering bug where merge
  // overwrites inject. Merge writes item.mergedText computed at plan-build phase
  // (which contains the pre-inject stale version row); if inject ran before merge,
  // merge would silently revert it. R-016 still protected: only the metadata row
  // mutates, user content rows (External Sources / Fact Base etc.) preserved.
  // The captured metadataUpdated object is passed to writeMigrationReport so the
  // audit trail records this mutation alongside file create/merge operations.
  let metadataUpdated = null;
  if (command === "upgrade" || created.includes("dev/PROJECT_INDEX.md")) {
    const indexPath = path.join(root, "dev/PROJECT_INDEX.md");
    try {
      const text = await readFile(indexPath, "utf8");
      const m = text.match(/\| Agent Handoff Kit template version \| ([\d.]+) \|/);
      if (m && isStableSemver(m[1]) && compareSemver(m[1], version) < 0) {
        const updated = text.replace(
          /\| Agent Handoff Kit template version \| [\d.]+ \|/,
          `| Agent Handoff Kit template version | ${version} |`
        );
        await writeFile(indexPath, updated, "utf8");
        metadataUpdated = {
          file: "dev/PROJECT_INDEX.md",
          field: "Agent Handoff Kit template version",
          from: m[1],
          to: version
        };
      }
    } catch {
      // ignore — doctor anchor (R-016) only checks row existence, not specific value.
    }
  }

  const skippedCount = plan.filter((item) => item.action === "skip").length;

  // R-031 v0.3.1+: scenario branching. Upgrade no-op (零改動) short-circuits — skip
  // migration report, self-check doctor, install banner, onboarding canonical phrase.
  // Prevents misleading "安裝完成" framing when user is just verifying they are latest.
  // R-031.3 v0.3.4+: also short-circuit only when metadata is current. If only the
  // metadata row was stale (counts 0/0/0 but metadataUpdated truthy), user just
  // received a substantive upgrade — proceed through full ceremony so doctor
  // self-check confirms the inject result.
  const isUpgradeNoop = command === "upgrade"
    && created.length === 0
    && merged.length === 0
    && conflicts.length === 0
    && !metadataUpdated;

  if (isUpgradeNoop) {
    const noOpHealth = await assessUpgradeNoopHealth(root, version);
    printUpgradeNoopShortCircuit(version, noOpHealth);
    if (!noOpHealth.ok) process.exitCode = 1;
    return;
  }

  const report = await writeMigrationReport(root, command, mode, plan, created, merged, conflicts, migrationDir, backupDir, metadataUpdated);
  printInstallSummary(version, command, mode, root, {
    created: created.length,
    merged: merged.length,
    skipped: skippedCount,
    conflicts: conflicts.length,
    backupRel: merged.length > 0 ? path.relative(root, backupDir) : null,
    reportRel: path.relative(root, report)
  });

  // R-031 v0.3.1+: install vs upgrade narrative split.
  if (command === "upgrade") {
    printUpgradeNextSteps(root, conflicts.length);
  } else {
    printInstallNextSteps(root, conflicts.length, mode, skippedCount);
  }

  // R-024 upgrade.done self-check: after substantive upgrade writes, run doctor automatically.
  // The user must see whether the merged state actually reaches a clean health state.
  if (command === "upgrade" && conflicts.length === 0) {
    console.log("");
    console.log("------------------------------------------------------------");
    console.log("🩺 升級後自動檢查：正在檢查升級後的資料夾");
    console.log("------------------------------------------------------------");
    const doctorStatus = await runDoctor(root, version, { silentCard: true, context: "upgrade-self-check" });
    if (doctorStatus !== "passed") {
      console.log("");
      console.log("⚠️  升級後自動檢查未通過；請看上方檢查輸出。");
      console.log("📋 下一步：把上面 doctor 輸出貼給 AI，請它先按提示修補後再宣稱 upgrade 完成。");
      process.exitCode = 1;
    } else {
      console.log("");
      console.log("✅ 升級驗收完成：doctor 已通過；可以繼續使用這個項目。");
    }
  }

  if (conflicts.length > 0) process.exitCode = 1;
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
    printDoctorSummary(version, root, "needs-fix", {
      checked: rows.length,
      failedKind: "missing files",
      failedCount: missing.length,
      nextStep: missing.length === rows.length
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
  console.log(`Credential 機密分離 sweep: ${credentialResult.ok ? "ok" : "FAILED"}`);
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
    checked: rows.length + anchorRows.length + schemaRows.length + researchTraceResult.checked + temperatureResult.checked + mirrorRows.length + 2,
    failedKind: !credentialResult.ok ? "credential leak" : null,
    failedCount: !credentialResult.ok ? credentialResult.findings.length : 0,
    warningKind: mirrorWarnings.length > 0 ? "prompt mirror warning" : null,
    warningCount: mirrorWarnings.length,
    nextStep: !credentialResult.ok
      ? "立即從相關檔案 redact credential value + rotate 已泄露 token；credential 應該由 AI 工具自身 secure storage 管理，永不寫入 dev/* 任何檔。"
      : disciplineResult.ok
      ? versionNextStep ?? promptMirrorNextStep ?? onboardingNextStep ?? "檢查已通過。繼續使用你原本的 AI 開工方式；如剛完成一個任務，記得在 AI 對話輸入「收工」保存交接。"
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

function repairHandoffOpeningRootGuard(text) {
  if (text.includes(rootMismatchGuard)) return { changed: false, text };
  const bounds = handoffSectionContentBounds(text, "next-session-opening-message", "Next Session Opening Message");
  if (!bounds) return { changed: false, text };
  const section = text.slice(bounds.start, bounds.end);
  if (!section.includes("```text")) return { changed: false, text };

  let repairedSection = section;
  if (/^Before changing anything,/m.test(repairedSection)) {
    repairedSection = repairedSection.replace(/^Before changing anything,/m, `${rootMismatchGuard}, stop and ask for confirmation.\n\nBefore changing anything,`);
  } else if (/\n```/.test(repairedSection)) {
    repairedSection = repairedSection.replace(/\n```/, `\n${rootMismatchGuard}, stop and ask for confirmation.\n\n\`\`\``);
  } else {
    return { changed: false, text };
  }

  return {
    changed: repairedSection !== section,
    text: `${text.slice(0, bounds.start)}${repairedSection}${text.slice(bounds.end)}`
  };
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
  const credentialPatterns = [
    { pattern: /sk-ant-[A-Za-z0-9_-]{20,}/, label: "Anthropic API key (sk-ant-)" },
    { pattern: /\bsk-[A-Za-z0-9_-]{20,}/, label: "OpenAI / generic sk- prefix" },
    { pattern: /\bntn_[A-Za-z0-9_-]{40,}/, label: "Notion Integration Token (ntn_)" },
    { pattern: /\bsecret_[A-Za-z0-9_-]{40,}/, label: "Notion legacy secret_ token" },
    { pattern: /\bya29\.[A-Za-z0-9_-]{20,}/, label: "Google OAuth access token (ya29.)" },
    { pattern: /\b1\/\/[A-Za-z0-9_-]{30,}/, label: "Google refresh token (1//)" },
    { pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}/, label: "Slack token (xoxp-/xoxb-/etc)" },
    { pattern: /\bghp_[A-Za-z0-9]{36}/, label: "GitHub Personal Access Token (ghp_)" },
    { pattern: /\bgho_[A-Za-z0-9]{36}/, label: "GitHub OAuth token (gho_)" },
    { pattern: /\bghs_[A-Za-z0-9]{36}/, label: "GitHub server token (ghs_)" },
    { pattern: /\bgithub_pat_[A-Za-z0-9_]{20,}/, label: "GitHub fine-grained PAT (github_pat_)" },
    { pattern: /\bsl\.[A-Za-z0-9_-]{50,}/, label: "Dropbox token (sl.)" },
    { pattern: /\bAKIA[A-Z0-9]{16}/, label: "AWS access key (AKIA)" },
    { pattern: /\bAIza[A-Za-z0-9_-]{35}/, label: "Google API key (AIza)" }
  ];
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
    for (const { pattern, label } of credentialPatterns) {
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
  const handoffPath = path.join(root, "dev/SESSION_HANDOFF.md");
  const promptPath = path.join(root, "START_NEXT_SESSION_PROMPT.txt");
  let handoffText = "";
  let promptText = "";
  try {
    handoffText = await readFile(handoffPath, "utf8");
  } catch {
    return [{ target: "START_NEXT_SESSION_PROMPT.txt", label: "matches handoff opening message", ok: false, reason: "handoff unreadable" }];
  }
  try {
    promptText = await readFile(promptPath, "utf8");
  } catch {
    return [{ target: "START_NEXT_SESSION_PROMPT.txt", label: "matches handoff opening message", ok: false, reason: "prompt copy unreadable" }];
  }
  const mirror = assessPromptMirrorTexts(handoffText, promptText);
  return [{
    target: "START_NEXT_SESSION_PROMPT.txt",
    label: "matches handoff opening message",
    ok: mirror.ok,
    reason: mirror.ok ? "" : mirror.reason
  }];
}

function assessHandoffLifecycleConsistency(text) {
  const fieldValue = fieldValueAfterMarker(text, "lifecycle-conflicts-resolved");
  if (isAffirmativeLifecycleFieldValue(fieldValue)) {
    return { ok: true, reason: "" };
  }
  if (isUnresolvedLifecycleFieldValue(fieldValue)) {
    return { ok: false, reason: "lifecycle field is explicitly unresolved" };
  }
  if (isPlaceholderLifecycleFieldValue(fieldValue) && hasSubstantiveHandoffState(text)) {
    return { ok: false, reason: "lifecycle field is still placeholder after handoff content changed" };
  }
  return { ok: true, reason: "" };
}

function isAffirmativeLifecycleFieldValue(value) {
  const trimmed = (value || "").trim();
  return /^(yes|resolved|confirmed|complete|completed|ok|passed|all clear)\b|^(是|已|完成|已完成|已解決|已核對|已確認|通過)\b/i.test(trimmed);
}

function isUnresolvedLifecycleFieldValue(value) {
  return /\b(no|blocked|uncertain)\b|否|阻擋|不確定/i.test(value || "");
}

function isPlaceholderLifecycleFieldValue(value) {
  return !value || /\b(TBD|todo|pending|unverified|unknown|needs-review)\b|待核對|待確認|未核對|未確認/i.test(value);
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
      .map((check) => check.label);
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
    rootTemplateVersion: command === "upgrade" ? await readRootTemplateVersion(root) : null
  };
  for (const [sourceRel, targetRel] of mappings) {
    const sourceAbs = path.join(packageRoot, sourceRel);
    const targetAbs = path.join(root, targetRel);
    const sourceText = await readFile(sourceAbs, "utf8");
    if (await exists(targetAbs)) {
      const targetText = await readFile(targetAbs, "utf8");
      plan.push(classifyExistingFile(command, sourceRel, targetRel, sourceAbs, targetAbs, sourceText, targetText, context));
      continue;
    }
    plan.push({
      sourceRel,
      targetRel,
      sourceAbs,
      targetAbs,
      action: "create"
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
  if (targetText === sourceText) return { ...base, action: "skip", reason: "already current" };
  if (command !== "upgrade") return { ...base, action: "skip", reason: "init preserves existing files" };
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
  if (targetRel === "dev/RULE_PACKS.md" && command === "upgrade" && !targetText.includes("First-time user signals")) {
    const mergedRulePacks = mergeRulePacksRows(targetText, sourceText);
    if (!mergedRulePacks) {
      return { ...base, action: "conflict", reason: "RULE_PACKS.md routing table header was changed; manual merge required to preserve custom rows" };
    }
    return {
      ...base,
      action: "merge",
      reason: "merge missing v0.2.0+ routing rows while preserving existing custom rows (新手引導 signal routing)",
      mergedText: mergedRulePacks
    };
  }
  // R-030 v0.3.0+: dev/RULE_PACKS.md must also include integrations pack routing row.
  if (targetRel === "dev/RULE_PACKS.md" && command === "upgrade" && !targetText.includes("External tool integrations")) {
    const mergedRulePacks = mergeRulePacksRows(targetText, sourceText);
    if (!mergedRulePacks) {
      return { ...base, action: "conflict", reason: "RULE_PACKS.md routing table header was changed; manual merge required to preserve custom rows" };
    }
    return {
      ...base,
      action: "merge",
      reason: "merge missing v0.3.0+ routing rows while preserving existing custom rows (Integration governance routing)",
      mergedText: mergedRulePacks
    };
  }
  // R-030 v0.3.0+: dev/PROJECT_INDEX.md gets ## Installed Integrations section auto-inserted before
  // ## Local QC Commands on upgrade if missing. NON-DESTRUCTIVE: existing ## External Sources content
  // is fully preserved (including any user-filled rows). User can later manually add the `via` column
  // to External Sources rows (or AI can guide that incremental migration during a later session).
  if (targetRel === "dev/PROJECT_INDEX.md" && command === "upgrade" && !targetText.includes("## Installed Integrations")) {
    // Extract just the ## Installed Integrations block from source (not touching External Sources).
    const sourceInstalledMatch = sourceText.match(/(## Installed Integrations[\s\S]*?)(?=## Local QC Commands)/);
    if (sourceInstalledMatch && targetText.includes("## Local QC Commands")) {
      const installedBlock = sourceInstalledMatch[1];
      return {
        ...base,
        action: "merge",
        reason: "insert ## Installed Integrations section template before ## Local QC Commands (R-030 Integration governance migration; existing External Sources content preserved non-destructively)",
        mergedText: targetText.replace("## Local QC Commands", installedBlock + "## Local QC Commands")
      };
    }
  }
  // R-030 v0.3.0+: dev/rules/onboarding.md gets ### Scenario F block auto-inserted before
  // ## Cross-reference to guide.html on upgrade if missing. NON-DESTRUCTIVE: existing Scenarios A-E
  // content and any user customization preserved. Step 1 micro-question additions to Scenarios A-E
  // are NOT auto-migrated (user-customizable inline sample wording, not anchor-enforced); users get
  // those on fresh install only or can manually patch following CHANGELOG migration guidance.
  if (targetRel === "dev/rules/onboarding.md" && command === "upgrade" && !targetText.includes("Scenario F. 審視已裝外部工具")) {
    const sourceScenarioFMatch = sourceText.match(/(### Scenario F\. 審視已裝外部工具[\s\S]*?)(?=## Cross-reference to guide\.html)/);
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
  if (targetRel === "dev/rules/onboarding.md" && command === "upgrade" && !targetText.includes("Scenario A. 建構系統 / 工具 / 平台 / 網站或應用")) {
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
  // v0.3.6+: SESSION_HANDOFF.md gains a non-destructive lifecycle consistency
  // field. Existing handoff content stays intact; only the missing field and
  // rule note are inserted around stable ack markers.
  if (targetRel === "dev/SESSION_HANDOFF.md" && command === "upgrade" && !targetText.includes("ack:field:lifecycle-conflicts-resolved")) {
    const mergedHandoff = mergeHandoffLifecycleField(targetText);
    if (!mergedHandoff) {
      return { ...base, action: "conflict", reason: "SESSION_HANDOFF.md state reconciliation markers were changed; manual merge required to add lifecycle consistency field" };
    }
    return {
      ...base,
      action: "merge",
      reason: "insert lifecycle consistency field into State Reconciliation Check (completed work must not carry forward as unresolved next work)",
      mergedText: mergedHandoff
    };
  }
  if (targetRel === "dev/SESSION_HANDOFF.md" && command === "upgrade" && !targetText.includes("ack:field:persistence-routing-checked")) {
    const mergedHandoff = mergeHandoffPersistenceRoutingField(targetText);
    if (!mergedHandoff) {
      return { ...base, action: "conflict", reason: "SESSION_HANDOFF.md state reconciliation markers were changed; manual merge required to add persistence routing field" };
    }
    return {
      ...base,
      action: "merge",
      reason: "insert persistence routing field into State Reconciliation Check (one-time evidence must not drive next-session state)",
      mergedText: mergedHandoff
    };
  }
  if (targetRel === "dev/SESSION_HANDOFF.md" && command === "upgrade" && isUpgradeFromOlderTemplate(context)) {
    const lifecycleValue = fieldValueAfterMarker(targetText, "lifecycle-conflicts-resolved");
    if (isPlaceholderLifecycleFieldValue(lifecycleValue) && hasSubstantiveHandoffState(targetText)) {
      const mergedHandoff = reclassifyExistingHandoffLifecyclePlaceholder(targetText);
      if (!mergedHandoff) {
        return { ...base, action: "conflict", reason: "SESSION_HANDOFF.md lifecycle field exists but could not be safely reclassified; manual closeout required" };
      }
      return {
        ...base,
        action: "merge",
        reason: "reclassify stale lifecycle placeholder from earlier template version so upgrade self-check can validate pre-existing handoff content",
        mergedText: mergedHandoff
      };
    }
  }
  if (targetRel === "dev/SESSION_HANDOFF.md" && command === "upgrade" && hasMisplacedRequiredAnchor(targetRel, targetText, "handoff log archive continuity")) {
    return { ...base, action: "conflict", reason: "required Kit anchors are present outside trusted semantic sections; upgrade stopped to avoid accepting naked anchor text as valid state" };
  }
  if (targetRel === "dev/SESSION_HANDOFF.md" && command === "upgrade" && hasMissingRequiredAnchor(targetRel, targetText, "handoff log archive continuity")) {
    const mergedHandoff = mergeHandoffArchiveContinuityRule(targetText, sourceText);
    if (!mergedHandoff) {
      return { ...base, action: "conflict", reason: "SESSION_HANDOFF.md handoff sufficiency markers were changed; manual merge required to add archive continuity rule" };
    }
    return {
      ...base,
      action: "merge",
      reason: "insert handoff archive continuity rule so upgrade self-check can pass without requiring manual anchor repair",
      mergedText: mergedHandoff
    };
  }
  if (targetRel === "dev/SESSION_HANDOFF.md" && command === "upgrade") {
    const repairedOpening = repairHandoffOpeningRootGuard(targetText);
    if (repairedOpening.changed) {
      return {
        ...base,
        action: "merge",
        reason: "restore root mismatch guard in Next Session Opening Message",
        mergedText: repairedOpening.text
      };
    }
  }
  if (targetRel === "dev/SESSION_HANDOFF.md" && command === "upgrade") {
    const repairedTemperature = repairHandoffCurrentStateEvidenceBoundary(targetText);
    if (repairedTemperature.changed) {
      return {
        ...base,
        action: "merge",
        reason: "move historical evidence out of hot handoff state",
        mergedText: repairedTemperature.text
      };
    }
  }
  if (targetRel === "dev/SESSION_LOG.md" && command === "upgrade" && !targetText.includes("- **Evidence disposition:**")) {
    const mergedLog = mergeSessionLogEvidenceDispositionField(targetText);
    if (!mergedLog) {
      return { ...base, action: "conflict", reason: "SESSION_LOG.md entry template markers were changed; manual merge required to add evidence disposition field" };
    }
    return {
      ...base,
      action: "merge",
      reason: "insert SESSION_LOG evidence disposition field into Entry Template",
      mergedText: mergedLog
    };
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
    if (!targetText.includes("AGENTS.md")) {
      return { ...base, action: "conflict", reason: "existing bridge does not route to AGENTS.md" };
    }
    if (looksLikeExpandedKitBridge(targetRel, targetText)) {
      return {
        ...base,
        action: "merge",
        reason: `${targetRel} appears to be an expanded Kit bridge; restore short bridge so AGENTS.md remains the single source of truth`,
        mergedText: sourceText
      };
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
    "**A. 建構系統 / 工具 / 平台 / 網站或應用** —— 你想由 AI 協助建立或長期維護一個可運作的項目"
  );
  merged = merged.replace(
    /### Scenario A\. 寫 \/ 改代碼項目/g,
    "### Scenario A. 建構系統 / 工具 / 平台 / 網站或應用"
  );
  return merged;
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
    "warm 資料層",
    "AI 開工",
    "不需要讀",
    "AI 在收工時自動 update",
    "Evidence chain: Source=source:<id>; Summary=<source finding>; Inference=<reasoning>; Decision impact=<what changed>; Uncertainty=<limits or none>.",
    "This file does not store raw build / upload / QC evidence"
  ];
  if (preamble.includes(snippet)) return snippetAppearsBeforeHeading(text, snippet, "## Evolution Timeline");
  return true;
}

function onboardingAnchorPlacement(snippet, text) {
  if (snippet === "Application Scenario Library") {
    return Boolean(textSectionBounds(text, "## Application Scenario Library", "## Cross-reference to guide.html"));
  }
  if (/^Scenario [A-F]\./.test(snippet)) {
    return snippetAppearsBetweenHeadings(text, snippet, "## Application Scenario Library", "## Cross-reference to guide.html");
  }
  return true;
}

function integrationsAnchorPlacement(snippet, text) {
  if (snippet === "機密分離原則" || snippet === "Source-of-truth Architecture" || snippet === "Cross-session Lifecycle") {
    return snippetAppearsBetweenHeadings(text, snippet, "## Discipline", "## Rules");
  }
  if (snippet === "Connector-first default") {
    return snippetAppearsBetweenHeadings(text, snippet, "## Rules", "## Checks");
  }
  if (snippet === "Anti-pattern") return text.includes("## Anti-pattern（不要做的事）");
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
  "dev/rules/integrations.md": (targetText, sourceText, missing) => {
    const mergedIntegrations = mergeIntegrationsCredentialSection(targetText, sourceText, missing);
    return mergedIntegrations ? {
      action: "merge",
      reason: "restore integrations credential-separation section in semantic position",
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
  for (const snippet of missing) {
    const sourceLine = sourceRuleLines.find((line) => line.includes(snippet));
    if (!sourceLine) return null;
    const ruleNumber = sourceLine.match(/^(\d+)\. /)?.[1];
    if (!ruleNumber) return null;
    const targetIndex = targetLines.findIndex((line, index) => index >= targetRuleStart && index < targetRuleEnd && line.startsWith(`${ruleNumber}. `));
    if (targetIndex < 0) return null;
    if (!sameRuleShape(targetLines[targetIndex], sourceLine, snippet)) return null;
    targetLines[targetIndex] = sourceLine;
    changed = true;
  }

  return changed ? targetLines.join("\n") : targetText;
}

function mergeIntegrationsCredentialSection(targetText, sourceText, missing) {
  if (!missing.some((snippet) => snippet === "機密分離原則")) return null;
  return replaceSectionByHeadingWithinBounds(
    targetText,
    sourceText,
    /^### 1\. 機密分離原則/m,
    /^### 2\. 四類整合嘅紀律差異/m,
    "## Discipline",
    "## Rules"
  );
}

function hasTrustedSafetyPackShape(text) {
  return text.includes("# Safety Pack")
    && text.includes("## Scope")
    && text.includes("## Load When")
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
    return line.includes("branch deletion")
      && line.includes("force push")
      && line.includes("history rewrite");
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

function mergeHandoffLifecycleField(targetText) {
  const openingMarker = "<!-- ack:field:opening-message-matches-current-state -->";
  if (!targetText.includes(openingMarker)) return null;

  const fieldBlock = "<!-- ack:field:lifecycle-conflicts-resolved -->\n- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: Reclassified at upgrade: field added by v0.3.6+ migration; pre-existing handoff state predates it; reconcile at next closeout.\n";
  let merged = targetText.replace(openingMarker, `${fieldBlock}${openingMarker}`);
  return ensureHandoffStateReconciliationRules(ensureHandoffPersistenceRoutingField(merged));
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
  const merged = ensureHandoffPersistenceRoutingField(targetText);
  if (!merged || merged === targetText) return null;
  return ensureHandoffStateReconciliationRules(merged);
}

function ensureHandoffPersistenceRoutingField(targetText) {
  if (targetText.includes("ack:field:persistence-routing-checked")) return targetText;
  const openingMarker = "<!-- ack:field:opening-message-matches-current-state -->";
  if (!targetText.includes(openingMarker)) return null;
  const fieldBlock = "<!-- ack:field:persistence-routing-checked -->\n- Persistence routing checked: Reclassified at upgrade: field added by template migration; pre-existing handoff state predates it; reconcile at next closeout.\n";
  return targetText.replace(openingMarker, `${fieldBlock}${openingMarker}`);
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
  const requiredPacks = [
    "dev/rules/onboarding.md",
    "dev/rules/integrations.md"
  ];
  const sourceRows = sourceText
    .split(/\r?\n/)
    .filter((line) => line.startsWith("|") && requiredPacks.some((pack) => line.includes(pack)));
  if (sourceRows.length === 0) return targetText;

  const lines = targetText.split(/\r?\n/);
  const tableStart = lines.findIndex((line) => line.trim() === "| Task signal | Pack | Purpose |");
  if (tableStart < 0) return null;

  let tableEnd = tableStart;
  while (tableEnd < lines.length && lines[tableEnd].startsWith("|")) tableEnd++;

  const before = lines.slice(0, tableStart);
  const table = lines.slice(tableStart, tableEnd);
  const after = lines.slice(tableEnd);
  const sourceRowsToApply = sourceRows.filter((row) => {
    if (row.includes("dev/rules/onboarding.md")) return !targetText.includes("First-time user signals");
    if (row.includes("dev/rules/integrations.md")) return !targetText.includes("External tool integrations");
    return false;
  });
  if (sourceRowsToApply.length === 0) return targetText;

  const merged = [
    ...before,
    ...table,
    ...sourceRowsToApply,
    ...after
  ];
  return merged.join("\n");
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
    console.log("  📅 上次收工：尚未收工過。第一次完成任務後，可以在 AI 對話輸入「收工」。");
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
  } else if (mode === "partial" || counts.skipped > 0) {
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
  if (mode === "partial" || skippedCount > 0) {
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
  if (mode === "partial" || skippedCount > 0) {
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
  console.log("🚀 AI 會依 AGENTS.md 讀取 START_NEXT_SESSION_PROMPT.txt。第一次安裝後，該檔案會觸發新手引導；收工後，該檔案會承載下一次接力狀態。");
  console.log("   收工可說「Wrap up Agent Handoff」/「收工」；「某某開工 / 某某收工」會先確認是否指本工具交接。");
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
  console.log("🛠️  Kit 檔案已更新：等待下方 doctor 驗收");
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
    console.log("🚀 下一步：回到原本的 AI 對話或開工句即可；如果剛完成任務，記得在 AI 對話輸入「收工」保存交接。");
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
  AI 會依 AGENTS.md 讀取 START_NEXT_SESSION_PROMPT.txt；第一次安裝後該檔案會啟動新手引導，
  收工後該檔案會承載下一次接力狀態。
  用「Wrap up Agent Handoff」/「收工」保存交接；「某某開工 / 某某收工」
  會先確認是否指本工具交接。

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
