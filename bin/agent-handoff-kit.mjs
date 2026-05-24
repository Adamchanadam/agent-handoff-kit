#!/usr/bin/env node

import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { copyFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
      "continuity ready",
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
      "wrap up",
      "handoff",
      "Reconcile `dev/SESSION_HANDOFF.md`",
      "Add a concise entry to `dev/SESSION_LOG.md`",
      "next-session opening message",
      "fenced `text` code block",
      "handoff saved",
      "📋 Next session: copy and paste the whole block below",
      "State Reconciliation Check",
      "handoff lifecycle consistency",
      "Do not append a new state snapshot",
      "START_NEXT_SESSION_PROMPT.txt"
    ]
  },
  {
    target: "START_NEXT_SESSION_PROMPT.txt",
    label: "next-session prompt convenience copy",
    snippets: [
      "Work in ",
      "Read in order:",
      "dev/PROJECT_INDEX.md",
      "If this root does not match the expected project root"
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
      "📋 Next session: copy and paste the whole block below",
      "```text",
      "Read in order:",
      "dev/DOC_SYNC_REGISTRY.md"
    ]
  },
  {
    target: "dev/SESSION_LOG.md",
    label: "session log event and opening message schema",
    snippets: [
      "Record what actually happened in the session",
      "## Entry Template",
      "- **QC:**",
      "- **Sync:**",
      "- **Log maintenance:**",
      "### Next Session Opening Message",
      "📋 Next session: copy and paste the whole block below",
      "```text",
      "Read in order:",
      "dev/DOC_SYNC_REGISTRY.md"
    ]
  },
  {
    target: "dev/SESSION_HANDOFF.md",
    label: "handoff log archive continuity",
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
    snippets: [
      "Agent Handoff Kit template version"
    ]
  },
  {
    target: "dev/rules/safety.md",
    label: "safety pack high-risk anchors",
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
    snippets: [
      "Project Decisions Log",
      "warm 資料層",
      "AI 開工",
      "不需要讀",
      "AI 在收工時自動 update",
      "Evolution Timeline",
      "Decisions Archive",
      "Architecture Choices",
      "Insights & Learnings"
    ]
  },
  {
    target: "dev/rules/onboarding.md",
    label: "onboarding pack core anchors",
    snippets: [
      "Onboarding Pack",
      "transient pack",
      "明確 onboarding signal keywords",
      "5-step walk-through pattern",
      "Application Scenario Library",
      "Scenario A. 寫 / 改代碼項目",
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
      includes("📋 Next session: copy and paste the whole block below"),
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
      includes("- **ID:**"),
      includes("- **Summary:**"),
      includes("- **Changed:**"),
      includes("- **Done:**"),
      includes("- **QC:**"),
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
  const plan = await buildPlan(root, command);

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
    printUpgradeNoopShortCircuit(version);
    return;
  }

  // R-031.3 v0.3.3+: For upgrade scenarios, capture pre-upgrade root template version
  // before the create/merge/inject loops mutate PROJECT_INDEX. This snapshot is later
  // passed to printWhatsnew so the version range narrative reflects the actual user
  // journey (v{pre-upgrade} → v{current CLI}), not the post-inject state which would
  // make printWhatsnew see fromVersion == toVersion and skip the summary entirely.
  let preUpgradeRootVersion = null;
  if (command === "upgrade") {
    try {
      const indexPath = path.join(root, "dev/PROJECT_INDEX.md");
      const text = await readFile(indexPath, "utf8");
      const m = text.match(/\| Agent Handoff Kit template version \| ([\d.]+) \|/);
      if (m) preUpgradeRootVersion = m[1];
    } catch {
      // ignore
    }
  }

  printPlan(command, root, mode, plan, version, options.dryRun);

  if (options.dryRun) {
    console.log("\ndry-run: no files written");
    printDryRunExplanation(plan);
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

  for (const item of plan) {
    if (item.action !== "merge") continue;
    const backupPath = path.join(backupDir, item.targetRel);
    await mkdir(path.dirname(backupPath), { recursive: true });
    await copyFile(item.targetAbs, backupPath);
    await writeFile(item.targetAbs, item.mergedText, "utf8");
    merged.push(item.targetRel);
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
    printUpgradeNoopShortCircuit(version);
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
  // R-031.2 v0.3.2+: printUpgradeNextSteps async (awaits inline whatsnew print).
  // R-031.3 v0.3.3+: pass preUpgradeRootVersion so whatsnew narrative reflects the
  // actual user journey (v{pre-upgrade} → v{current}), not the post-inject state.
  if (command === "upgrade") {
    await printUpgradeNextSteps(root, conflicts.length, version, preUpgradeRootVersion);
  } else {
    printInstallNextSteps(root, conflicts.length);
  }

  // R-024 upgrade.done self-check: after substantive upgrade writes, run doctor automatically.
  // The user must see whether the merged state actually reaches a clean health state.
  if (command === "upgrade" && conflicts.length === 0) {
    console.log("");
    console.log("------------------------------------------------------------");
    console.log("🩺 upgrade self-check: running doctor against the upgraded root");
    console.log("------------------------------------------------------------");
    const doctorStatus = await runDoctor(root, version, { silentCard: true });
    if (doctorStatus !== "passed") {
      console.log("");
      console.log("⚠️  upgrade self-check did not pass; see doctor output above.");
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
      nextStep: "先確認你是否在正確專案資料夾；如是，執行 init 或 upgrade 補回缺少檔案。"
    });
    process.exitCode = 1;
    return "failed";
  }

  const anchorRows = await checkRequiredAnchors(root);
  const anchorFailures = anchorRows.filter((row) => !row.ok);
  console.log(`\nrequired anchors: ${anchorRows.length}`);
  for (const row of anchorRows) {
    console.log(`${row.ok ? "ok" : "missing"}  ${row.target} (${row.label})`);
  }

  if (anchorFailures.length > 0) {
    printDoctorSummary(version, root, "needs-fix", {
      checked: rows.length + anchorRows.length,
      failedKind: "anchor checks",
      failedCount: anchorFailures.length,
      nextStep: "執行 upgrade --dry-run 查看可否安全補齊；不要手動覆寫既有檔案。"
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

  const mirrorRows = await checkPromptMirror(root);
  const mirrorFailures = mirrorRows.filter((row) => !row.ok);
  console.log(`\nprompt mirror checks: ${mirrorRows.length}`);
  for (const row of mirrorRows) {
    console.log(`${row.ok ? "ok" : "missing"}  ${row.target} (${row.label})`);
    if (!row.ok && row.reason) console.log(`  reason: ${row.reason}`);
  }

  if (mirrorFailures.length > 0) {
    printDoctorSummary(version, root, "needs-fix", {
      checked: rows.length + anchorRows.length + schemaRows.length + mirrorRows.length,
      failedKind: "prompt mirror checks",
      failedCount: mirrorFailures.length,
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

  const overallHealthy = credentialResult.ok;
  printDoctorSummary(version, root, overallHealthy ? "healthy" : "needs-attention", {
    checked: rows.length + anchorRows.length + schemaRows.length + mirrorRows.length + 2,
    failedKind: !credentialResult.ok ? "credential leak" : null,
    failedCount: !credentialResult.ok ? credentialResult.findings.length : 0,
    nextStep: !credentialResult.ok
      ? "立即從相關檔案 redact credential value + rotate 已泄露 token；credential 應該由 AI 工具自身 secure storage 管理，永不寫入 dev/* 任何檔。"
      : disciplineResult.ok
      ? versionNextStep ?? "繼續日常使用即可。如有新版本發佈，啟動本工具時會自動顯示升級通知。"
      : "繼續使用；下次 closeout 時 AI 應自動執行 SESSION_LOG N 規則推進（見上面 warn 行）。如未動請要求 AI 重做 closeout。"
  });
  return overallHealthy ? "passed" : "failed";
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
    console.log("✅ 檢查通過：必要文件存在，基本結構完整，下次開工提示副本也與 handoff 一致。");
  } else {
    console.log(`status: failed (${details.failedCount} ${details.failedKind} failed)`);
    console.log(`⚠️  檢查未通過：${details.failedKind === "missing files" ? "有必要檔案不存在。" : details.failedKind === "anchor checks" ? "有檔案存在，但內容缺少必要段落。" : details.failedKind === "schema checks" ? "交接或索引文件結構不完整。" : "下次開工提示副本與 handoff 真源不同。"}`);
  }
  console.log("");
  console.log(`📦 版本：v${version}`);
  console.log(`🩺 模式：${mode}`);
  console.log(`🔎 剛完成：檢查 ${details.checked} 項；${mode === "healthy" ? "全部通過" : `${details.failedCount} 項未通過（${details.failedKind}）`}。`);
  console.log(`🚀 下一步：${details.nextStep}`);
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
  const openingMessage = extractOpeningMessage(handoffText);
  if (!openingMessage) {
    return [{ target: "START_NEXT_SESSION_PROMPT.txt", label: "matches handoff opening message", ok: false, reason: "handoff opening message missing" }];
  }
  const ok = normalizePrompt(promptText) === normalizePrompt(openingMessage);
  return [{ target: "START_NEXT_SESSION_PROMPT.txt", label: "matches handoff opening message", ok, reason: ok ? "" : "convenience copy differs from dev/SESSION_HANDOFF.md" }];
}

function extractOpeningMessage(text) {
  const marker = "📋 Next session: copy and paste the whole block below";
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) return null;
  const fenceStart = text.indexOf("```text", markerIndex);
  if (fenceStart < 0) return null;
  const contentStart = text.indexOf("\n", fenceStart);
  const fenceEnd = text.indexOf("```", contentStart + 1);
  if (contentStart < 0 || fenceEnd < 0) return null;
  return text.slice(contentStart + 1, fenceEnd).trim();
}

function normalizePrompt(text) {
  return text.replace(/\r\n/g, "\n").trim();
}

function assessHandoffLifecycleConsistency(text) {
  const fieldValue = fieldValueAfterMarker(text, "lifecycle-conflicts-resolved");
  if (fieldValue && /\b(no|blocked|uncertain)\b|否|阻擋|不確定/i.test(fieldValue)) {
    return { ok: false, reason: "lifecycle field is explicitly unresolved" };
  }

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
    if (hasUnresolvedCarryForward(targetText, topic)) {
      return { ok: false, reason: `completed topic carried forward unresolved: ${topic}` };
    }
  }

  return { ok: true, reason: "" };
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
  const escaped = escapeRegExp(topic);
  const pattern = new RegExp(escaped, "ig");
  for (const match of text.matchAll(pattern)) {
    const start = Math.max(0, match.index - 180);
    const end = Math.min(text.length, match.index + topic.length + 180);
    const context = text.slice(start, end);
    if (/\b(monitor-only|follow-up scope|blocked|reopened|re-opened|if new evidence|conditional|no-op)\b|只監察|監察|後續範圍|跟進範圍|阻擋|已重開|明確重開|新證據/i.test(context)) {
      continue;
    }
    if (/\b(investigate|reproduce|pending|todo|unresolved|must start|start with read-only|reliability concern remains open|needs investigation)\b|調查|重查|未解|待辦|仍需|未完成|開始.{0,20}核查|先.{0,20}調查/i.test(context)) {
      return true;
    }
  }
  return false;
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
      rows.push({ target: rule.target, label: rule.label, ok: false });
      continue;
    }

    rows.push({
      target: rule.target,
      label: rule.label,
      ok: rule.snippets.every((snippet) => text.includes(snippet))
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

async function buildPlan(root, command) {
  const plan = [];
  for (const [sourceRel, targetRel] of mappings) {
    const sourceAbs = path.join(packageRoot, sourceRel);
    const targetAbs = path.join(root, targetRel);
    const sourceText = await readFile(sourceAbs, "utf8");
    if (await exists(targetAbs)) {
      const targetText = await readFile(targetAbs, "utf8");
      plan.push(classifyExistingFile(command, sourceRel, targetRel, sourceAbs, targetAbs, sourceText, targetText));
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

function classifyExistingFile(command, sourceRel, targetRel, sourceAbs, targetAbs, sourceText, targetText) {
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
    if (sourceScenarioFMatch && targetText.includes("## Cross-reference to guide.html")) {
      const scenarioFBlock = sourceScenarioFMatch[1];
      return {
        ...base,
        action: "merge",
        reason: "insert ### Scenario F block before ## Cross-reference to guide.html (R-030 onboarding pack migration; existing Scenarios A-E content preserved non-destructively)",
        mergedText: targetText.replace("## Cross-reference to guide.html", scenarioFBlock + "## Cross-reference to guide.html")
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
  if ((targetRel === "CLAUDE.md" || targetRel === "GEMINI.md") && !targetText.includes("AGENTS.md")) {
    return { ...base, action: "conflict", reason: "existing bridge does not route to AGENTS.md" };
  }
  return { ...base, action: "skip", reason: "preserve existing file" };
}

function mergeHandoffLifecycleField(targetText) {
  const openingMarker = "<!-- ack:field:opening-message-matches-current-state -->";
  if (!targetText.includes(openingMarker)) return null;

  const fieldBlock = "<!-- ack:field:lifecycle-conflicts-resolved -->\n- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: TBD\n";
  let merged = targetText.replace(openingMarker, `${fieldBlock}${openingMarker}`);

  if (!merged.includes("Lifecycle consistency rule: compare `Completed This Session`")) {
    const ruleBlock = "Lifecycle consistency rule: compare `Completed This Session`, `Validation / QC`, `Next Priorities`, `Risks / Blockers`, and `Next Session Opening Message`. A completed or verified item must not remain as an unresolved next priority, active risk, or startup instruction unless it is explicitly reclassified as monitor-only, follow-up scope, blocked, or reopened with the missing evidence or trigger condition stated.\n\n";
    const sufficiencyMarker = "<!-- ack:section:handoff-sufficiency-check -->";
    if (merged.includes(sufficiencyMarker)) {
      merged = merged.replace(sufficiencyMarker, `${ruleBlock}${sufficiencyMarker}`);
    } else {
      merged = `${merged.trimEnd()}\n\n${ruleBlock}`;
    }
  }

  return merged;
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
    const m = text.match(/\| Agent Handoff Kit template version \| ([\d.]+) \|/);
    if (m) rootVersion = m[1];
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
    console.log(`     npm 有新版（v${npmLatest}）；doctor 只檢查不修改。要升級時先執行：npx @adamchanadam/agent-handoff-kit@latest upgrade --dry-run`);
    console.log("     --dry-run 只預覽、不寫入；確認計劃沒問題後，再去掉 --dry-run 正式升級。");
  } else if (cliVersion !== rootVersion) {
    console.log("     項目內記錄的 Kit 版本與目前工具版本不同；doctor 只檢查不修改。要對齊時先執行：npx @adamchanadam/agent-handoff-kit@latest upgrade --dry-run");
    console.log("     --dry-run 只預覽、不寫入；確認計劃沒問題後，再去掉 --dry-run 正式升級。");
  }
}

function getVersionAlignmentNextStep(result) {
  const { cliVersion, rootVersion, npmLatest } = result;
  if (npmLatest && compareSemver(npmLatest, cliVersion) > 0) {
    return `檢查已通過，但 npm 有新版 v${npmLatest}。doctor 沒有修改檔案；建議先執行 npx @adamchanadam/agent-handoff-kit@latest upgrade --dry-run。--dry-run 只預覽、不寫入；確認計劃沒問題後，再去掉 --dry-run 正式升級。`;
  }
  if (rootVersion === null) {
    return "檢查已通過，但項目版本記錄缺失。doctor 沒有修改檔案；建議先執行 npx @adamchanadam/agent-handoff-kit@latest upgrade --dry-run。--dry-run 只預覽、不寫入；確認只會補齊工具維護的版本記錄後，再去掉 --dry-run 正式升級。";
  }
  if (cliVersion !== rootVersion) {
    return "檢查已通過，但項目版本記錄未與目前工具對齊。doctor 沒有修改檔案；建議先執行 npx @adamchanadam/agent-handoff-kit@latest upgrade --dry-run。--dry-run 只預覽、不寫入；確認後再去掉 --dry-run 正式升級。";
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
    console.log("  📅 上次 closeout：（仲未 closeout 過。第一次完成 task 後可以講 AI「收工」）");
    return;
  }
  const today = new Date();
  const closeout = new Date(result.date);
  const daysDiff = Math.floor((today - closeout) / (1000 * 60 * 60 * 24));
  if (daysDiff < 0) {
    console.log(`  📅 上次 closeout：${result.date}（日期超前？檢查系統時鐘）`);
  } else if (daysDiff === 0) {
    console.log(`  📅 上次 closeout：今日（${result.date}）`);
  } else if (daysDiff <= 30) {
    console.log(`  📅 上次 closeout：${daysDiff} 日前（${result.date}）`);
  } else {
    console.log(`  📅 上次 closeout：${daysDiff} 日前（${result.date}）— 建議跑下 closeout 整理進度`);
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
  const planIntro = isDryRun
    ? "📋 計劃預覽：以下未執行。create 新增缺少檔案；merge 在備份後合併；skip 保留既有檔案；conflict 代表工具停手等你確認。"
    : "📋 即將執行：以下是本次寫入計劃。create 新增缺少檔案；merge 會先備份再合併；skip 保留既有檔案；conflict 代表工具停手等你確認。";
  console.log(planIntro);
  console.log("");
  for (const action of ["create", "merge", "skip", "conflict"]) {
    const items = plan.filter((item) => item.action === action);
    console.log(`${action}: ${items.length}`);
    for (const item of items) console.log(`  ${item.targetRel}${item.reason ? ` - ${item.reason}` : ""}`);
  }
  console.log(`\nbackup: ${plan.filter((item) => item.action === "merge").length}`);
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
    console.log("🚀 下一步：留意下方 upgrade self-check（自動跑 doctor）；若全綠即升級完成。");
  } else {
    console.log("🚀 下一步：開新 AI 對話，按下方提示貼入 Work in <root> 一句後描述任務。");
  }
}

function printDryRunExplanation(plan) {
  const conflicts = plan.filter((item) => item.action === "conflict");
  console.log("✅ 這次沒有改動任何檔案。");
  if (conflicts.length === 0) {
    console.log("✅ 沒有發現 conflict。你仍應先看清楚 create / merge / skip 清單，再決定是否執行正式 upgrade。");
    return;
  }
  console.log(`⚠️  需要人工確認：有 ${conflicts.length} 個既有檔案，工具不能安全判斷怎樣合併。`);
  console.log("⚠️  這不是檔案壞掉，也沒有覆寫你的檔案。");
  console.log("📋 下一步：把這段輸出貼給 AI，叫它幫你判斷要保留、合併，還是手動修改。");
}

async function confirmWrite() {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question("Write missing Agent Handoff Kit files? Type yes to continue: ");
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
  const command = "npx @adamchanadam/agent-handoff-kit@latest <command>";
  const lines = [
    `✨ 有新版可用：${currentVersion} -> ${latestVersion}`,
    `如要使用最新版，執行：${command}`,
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

function printInstallNextSteps(root, conflictCount) {
  console.log("");
  console.log("============================================================");
  console.log("✅ 安裝完成：下一步請在 AI 對話中操作");
  console.log("============================================================");
  if (conflictCount > 0) {
    console.log("⚠️  狀態：有既有檔案需要人工確認，詳情見 migration report。");
    console.log("⚠️  這不是檔案壞掉；工具已停手，沒有覆寫 conflict 檔案。");
    console.log("📋 下一步：把 migration report 或這段輸出貼給 AI，請它幫你判斷怎樣合併。");
    console.log("");
  }
  // R-031.2 v0.3.2+: first-install checklist. It answers the user's first
  // question: "is this installed and what do I do next?"
  console.log("📋 如何確認安裝完成：");
  console.log("");
  console.log("   1. 在 Terminal 執行 npx @adamchanadam/agent-handoff-kit doctor，應該見到「status: passed」");
  console.log("   2. 你的 dev/ 資料夾應該有規則、交接與工作紀錄等檔案");
  console.log("   3. 在你使用的 AI 工具（Claude Code / Codex / Gemini）開新對話，貼下面起步句");
  console.log("");
  console.log("⚠️  注意：Agent Handoff Kit 是放在項目資料夾內的一組交接檔案。");
  console.log("   它沒有圖形介面，不會啟動伺服器，也不會自動替你做事；你需要在 AI 對話中使用它。");
  console.log("");
  console.log("------------------------------------------------------------");
  console.log("⚠️  請注意：下面文字不是 Terminal 指令。");
  console.log("📋 請打開你要使用的 AI 工具，新增一段對話，貼上下面一句：");
  console.log("------------------------------------------------------------");
  console.log(`Work in ${root}. I just installed agent-handoff-kit. Help me get started.`);
  console.log("------------------------------------------------------------");
  console.log("");
  console.log("🚀 AI 會主動引導你選擇情景（寫代碼 / 研究報告 / 知識庫整理 / 學寫代碼 / 其他），");
  console.log("   一步一步帶你做第一個任務（由新手引導包主動接管）。");
  console.log("");
  console.log("💡 之後你熟悉流程後，可改用更直接的開工句：");
  console.log(`   Work in ${root}. Read AGENTS.md and follow it. Before changing anything, tell me the current state and your recommended next step.`);
  console.log("");
  console.log("🩺 如要檢查安裝是否完整，可在 Terminal 執行：");
  console.log("   npx @adamchanadam/agent-handoff-kit doctor");
  console.log("============================================================");
}

// R-031 v0.3.1+: Upgrade substantive next-step block. Distinct from install
// (`printInstallNextSteps`) because the user is not first-time; pushing them through
// the onboarding canonical phrase resets context they already have.
async function printUpgradeNextSteps(root, conflictCount, version, preUpgradeRootVersion) {
  console.log("");
  console.log("============================================================");
  console.log("✅ 升級完成：Kit 檔案已更新到最新版本");
  console.log("============================================================");
  if (conflictCount > 0) {
    console.log("⚠️  狀態：有既有檔案需要人工確認，詳情見 migration report。");
    console.log("⚠️  這不是檔案壞掉；工具已停手，沒有覆寫 conflict 檔案。");
    console.log("📋 下一步：把 migration report 或這段輸出貼給 AI，請它幫你判斷怎樣合併。");
    console.log("");
  }
  // R-031.2 v0.3.2+: Inline whatsnew summary — directly surface what changed in this
  // version (and any intermediate versions the user skipped).
  // R-031.3 v0.3.3+: fromVersion now uses pre-upgrade snapshot (captured before
  // inject mutated PROJECT_INDEX), so the range narrative reflects actual user
  // journey instead of degenerate v{current} → v{current}.
  await printWhatsnew(root, version, preUpgradeRootVersion);
  console.log("📋 如你正在進行中的工作對話已熟悉 Agent Handoff Kit，繼續使用原本的開工方式即可，無需重新做新手引導。");
  console.log("");
  console.log("💡 如想了解本版本新加了甚麼功能，可選用以下開工句（非強制）：");
  console.log("------------------------------------------------------------");
  console.log(`Work in ${root}. I just upgraded agent-handoff-kit. Brief me on what changed in this version and what I should pay attention to.`);
  console.log("------------------------------------------------------------");
  console.log("");
  console.log("🩺 升級驗收會在下方自動跑 doctor；若全綠即升級完成。");
  console.log("============================================================");
}

// R-031.2 v0.3.2+: Print whatsnew summaries for the version range crossed by this
// upgrade. fromVersion = user root template metadata version (the state before
// upgrade; R-016 preserves this row so it still reflects the prior state after
// upgrade finishes). toVersion = current CLI version. Range is exclusive-fromVersion
// inclusive-toVersion. Limit to first + last when crossing > 3 versions (elide middle).
async function printWhatsnew(root, toVersion, fromVersionOverride) {
  // R-031.3 v0.3.3+: fromVersion sourced from explicit override (pre-upgrade snapshot)
  // when called from upgrade flow; falls back to reading current PROJECT_INDEX
  // template version row otherwise.
  let fromVersion = fromVersionOverride ?? null;
  if (!fromVersion) {
    const indexPath = path.join(root, "dev/PROJECT_INDEX.md");
    try {
      const text = await readFile(indexPath, "utf8");
      const m = text.match(/\| Agent Handoff Kit template version \| ([\d.]+) \|/);
      if (m) fromVersion = m[1];
    } catch {
      return;
    }
  }
  if (!fromVersion || !isStableSemver(fromVersion) || compareSemver(fromVersion, toVersion) >= 0) {
    return;
  }

  const whatsnewDir = path.join(packageRoot, "docs/whatsnew");
  let entries = [];
  try {
    entries = await readdir(whatsnewDir);
  } catch {
    console.log(`💡 本版 release notes：https://github.com/Adamchanadam/agent-handoff-kit/releases/tag/v${toVersion}`);
    console.log("");
    return;
  }

  const relevant = entries
    .filter((name) => /^v\d+\.\d+\.\d+\.md$/.test(name))
    .map((name) => name.replace(/^v/, "").replace(/\.md$/, ""))
    .filter((v) => compareSemver(v, fromVersion) > 0 && compareSemver(v, toVersion) <= 0)
    .sort((a, b) => compareSemver(a, b));

  if (relevant.length === 0) {
    console.log(`💡 本版 release notes：https://github.com/Adamchanadam/agent-handoff-kit/releases`);
    console.log(`   （v${fromVersion} → v${toVersion} 跨版本的完整變更見 GitHub Release 全列表）`);
    console.log("");
    return;
  }

  // R-031.3 v0.3.3+: Deep range narrative — if fromVersion considerably older than
  // the oldest available whatsnew, explicitly tell user this is a multi-version
  // upgrade where older changelog only lives on GitHub Release (not shipped).
  // Heuristic: deep range if fromVersion's major < oldest's major, or same major
  // but minor differs by ≥ 1 (i.e. fromVersion is at least one minor release older
  // than the oldest available whatsnew).
  const oldestAvailable = relevant[0];
  const [fromMajor, fromMinor] = fromVersion.split(".").map((n) => Number.parseInt(n, 10));
  const [oldMajor, oldMinor] = oldestAvailable.split(".").map((n) => Number.parseInt(n, 10));
  const isDeepRange = (fromMajor < oldMajor) || (fromMajor === oldMajor && fromMinor < oldMinor);
  if (isDeepRange) {
    console.log(`💡 注意：本次升級 v${fromVersion} → v${toVersion} 跨度較大；本工具的版本說明只涵蓋由 v${oldestAvailable} 起的 ${relevant.length} 個版本。較舊版本（v${fromVersion} 至 v${oldestAvailable} 之前）的完整變更見：`);
    console.log(`   https://github.com/Adamchanadam/agent-handoff-kit/releases`);
    console.log("");
  }

  console.log(`📰 本次升級涵蓋 ${relevant.length} 個版本的版本說明（${isDeepRange ? `由 v${oldestAvailable} 起` : `v${fromVersion} → v${toVersion}`}）：`);
  console.log("");

  const toShow = relevant.length <= 3 ? relevant : [relevant[0], relevant[relevant.length - 1]];
  const elidedCount = relevant.length > 3 ? relevant.length - 2 : 0;

  for (let i = 0; i < toShow.length; i += 1) {
    const v = toShow[i];
    const filePath = path.join(whatsnewDir, `v${v}.md`);
    try {
      const content = await readFile(filePath, "utf8");
      console.log(content.trimEnd());
      console.log("");
      if (i === 0 && elidedCount > 0) {
        console.log(`   ⋯ 中間 ${elidedCount} 個版本的版本說明略；完整列表見 https://github.com/Adamchanadam/agent-handoff-kit/releases ⋯`);
        console.log("");
      }
    } catch {
      console.log(`(v${v} release notes 檔缺失，見 https://github.com/Adamchanadam/agent-handoff-kit/releases/tag/v${v})`);
      console.log("");
    }
  }
  console.log("------------------------------------------------------------");
  console.log("");
}

// R-031 v0.3.1+: Upgrade no-op short-circuit. When the user runs upgrade on a root
// already at latest version (skip all / create 0 / merge 0 / conflict 0), print a
// short factual message and return. Saves disk (no migration report) + reduces noise
// (no self-check doctor) + avoids misleading "安裝完成" framing for an idempotent
// operation where nothing changed.
function printUpgradeNoopShortCircuit(version) {
  console.log("");
  console.log(`📦 版本：v${version}`);
  console.log("🛠️  模式：upgrade-existing");
  console.log("🔎 剛完成：檢查所有 Kit 檔案的狀態（含 AGENTS.md、dev/SESSION_HANDOFF.md、dev/PROJECT_INDEX.md 等）。");
  console.log("✅ 結果：你已經是最新版本，沒有檔案需要建立或合併；用戶填寫的內容全部保留現狀。");
  console.log("");
  console.log("🚀 下一步：繼續日常使用即可。如要檢查健康狀態，可執行：");
  console.log("   npx @adamchanadam/agent-handoff-kit doctor");
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
  ✅ init      第一次安裝 Kit 文件。
  🔄 upgrade   升級既有 Kit 文件；先用 --dry-run 預演。
  🩺 doctor    檢查必要文件與交接結構是否完整。

After install:
  Do not type the shown "Work in ..." message into Terminal.
  Open your AI tool, start a new chat, and paste it there.
  The default post-install prompt triggers the onboarding pack — AI
  will guide you through scenario selection (coding / research / knowledge /
  learning / other / integrations governance) and walk you through your first task.
`);
  console.log(`📦 版本：v${version}`);
  console.log(`🛠️  模式：help ready`);
  console.log(`🚀 下一步：第一次使用先跑 init；既有專案升級用 upgrade --dry-run；要檢查現狀用 doctor。`);
}
