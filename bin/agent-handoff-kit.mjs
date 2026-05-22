#!/usr/bin/env node

import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
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
  ["packs/onboarding.md", "dev/rules/onboarding.md"]
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
      "Do not treat unread sources as absent"
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
      "Tone Discipline"
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
      heading("Local QC Commands"),
      heading("Workspace Identity"),
      heading("Change Hotspots"),
      heading("Maintenance Rule"),
      tableHeader("Path", "Role", "Read when"),
      tableHeader("Source", "Role", "Required before", "Access method", "Last verified"),
      tableHeader("Source", "Role", "Required before", "Access method", "Write-back rule", "Last verified"),
      tableHeader("Check", "Command", "Run before", "Last verified"),
      tableHeader("Change type", "Likely files", "Required checks")
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
      includes("dev/rules/release.md")
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
    label: "onboarding pack structure (R-029)",
    checks: [
      heading("Scope"),
      heading("Load When"),
      heading("Discipline"),
      heading("Application Scenario Library"),
      heading("Cross-reference to guide.html"),
      heading("Tone Discipline"),
      heading("Closeout")
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

async function runInstall(command, root, options, version) {
  const mode = await detectMode(root);
  const plan = await buildPlan(root, command);
  printPlan(command, root, mode, plan, version);

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

  const report = await writeMigrationReport(root, command, mode, plan, created, merged, conflicts, migrationDir, backupDir);
  const skippedCount = plan.filter((item) => item.action === "skip").length;
  printInstallSummary(version, command, mode, root, {
    created: created.length,
    merged: merged.length,
    skipped: skippedCount,
    conflicts: conflicts.length,
    backupRel: merged.length > 0 ? path.relative(root, backupDir) : null,
    reportRel: path.relative(root, report)
  });
  printInstallNextSteps(root, conflicts.length);

  // R-024 upgrade.done self-check: after upgrade writes, run doctor automatically.
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
  console.log(`\nSESSION_LOG discipline (R-010): ${disciplineResult.ok ? "ok" : "warn"}`);
  if (!disciplineResult.ok) {
    for (const warning of disciplineResult.warnings) {
      console.log(`  warn: ${warning}`);
    }
  }

  printDoctorSummary(version, root, "healthy", {
    checked: rows.length + anchorRows.length + schemaRows.length + mirrorRows.length + 1,
    failedKind: null,
    failedCount: 0,
    nextStep: disciplineResult.ok
      ? "繼續日常使用；如要升級到較新版，執行 npx @adamchanadam/agent-handoff-kit@latest upgrade。"
      : "繼續使用；下次 closeout 時 AI 應自動執行 R-010 N 規則推進（見上面 warn 行）。如未動請要求 AI 重做 closeout。"
  });
  return "passed";
}

// R-026 CLI Output Contract: doctor 完成必含四項（版本／模式／剛做咗乜／下一步）。
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
  console.log(`🔎 剛做咗：檢查 ${details.checked} 項；${mode === "healthy" ? "全部通過" : `${details.failedCount} 項未通過（${details.failedKind}）`}。`);
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
  if ((targetRel === "CLAUDE.md" || targetRel === "GEMINI.md") && !targetText.includes("AGENTS.md")) {
    return { ...base, action: "conflict", reason: "existing bridge does not route to AGENTS.md" };
  }
  return { ...base, action: "skip", reason: "preserve existing file" };
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
    warnings.push(`SESSION_LOG entry count = ${entryCount}（嚴重超過 N=11+ archive 邊界；R-010 嘅 AI closeout flow 應該已自動推進，如未動請要求 AI 跟 R-010 重做 closeout）`);
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

function printPlan(command, root, mode, plan, version) {
  printCard(version, "continuity ready", "o.o");
  console.log(`command: ${command}`);
  console.log(`current directory: ${process.cwd()}`);
  console.log(`selected root: ${root}`);
  console.log(`mode: ${mode}`);
  console.log("");
  console.log("📋 計劃預覽：以下未執行。create 新增缺少檔案；merge 在備份後合併；skip 保留既有檔案；conflict 代表工具停手等你確認。");
  console.log("");
  for (const action of ["create", "merge", "skip", "conflict"]) {
    const items = plan.filter((item) => item.action === action);
    console.log(`${action}: ${items.length}`);
    for (const item of items) console.log(`  ${item.targetRel}${item.reason ? ` - ${item.reason}` : ""}`);
  }
  console.log(`\nbackup: ${plan.filter((item) => item.action === "merge").length}`);
}

// R-026 CLI Output Contract: install/upgrade 完成必含四項（版本／模式／剛做咗乜／下一步）。
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
  console.log(`🔎 剛做咗：${command} 命令；create ${counts.created} / merge ${counts.merged} / skip ${counts.skipped} / conflict ${counts.conflicts}。`);
  if (counts.conflicts > 0) {
    console.log("🚀 下一步：把 migration report 或這段輸出貼給 AI，請它判斷 conflict 點處理；工具已停手，沒有覆寫 conflict 檔案。");
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

async function writeMigrationReport(root, command, mode, plan, created, merged, conflicts, migrationDir, backupDir) {
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
    "## Backup",
    merged.length > 0 ? `- ${path.relative(root, backupDir)}` : "- none",
    "",
    "## Notes",
    "- Existing files are preserved unless the installer can perform a bounded merge.",
    "- Files that cannot be safely merged are reported as conflicts and are not overwritten."
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
  console.log("⚠️  請注意：下面文字不是 Terminal 指令。");
  console.log("📋 請打開你要使用的 AI 工具，新增一段對話，貼上下面一句：");
  console.log("------------------------------------------------------------");
  console.log(`Work in ${root}. Read AGENTS.md and follow it. Before changing anything, tell me the current state and your recommended next step.`);
  console.log("------------------------------------------------------------");
  console.log("");
  console.log("🚀 然後直接描述你的任務，例如：");
  console.log("   整理這個專案，先告訴我你讀到的目前狀態與下一步。");
  console.log("");
  console.log("🩺 如要檢查安裝是否完整，可在 Terminal 執行：");
  console.log("   npx @adamchanadam/agent-handoff-kit doctor");
  console.log("============================================================");
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
  Do not type "Follow AGENTS.md" into Terminal.
  Open your AI tool, start a new chat, paste the shown Work in ... message,
  then describe your task in normal language.
`);
  console.log(`📦 版本：v${version}`);
  console.log(`🛠️  模式：help ready`);
  console.log(`🚀 下一步：第一次使用先跑 init；既有專案升級用 upgrade --dry-run；要檢查現狀用 doctor。`);
}
