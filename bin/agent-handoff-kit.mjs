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
  ["packs/safety.md", "dev/rules/safety.md"],
  ["packs/coding.md", "dev/rules/coding.md"],
  ["packs/writing.md", "dev/rules/writing.md"],
  ["packs/research.md", "dev/rules/research.md"],
  ["packs/agent-governance.md", "dev/rules/agent-governance.md"],
  ["packs/release.md", "dev/rules/release.md"],
  ["packs/knowledge.md", "dev/rules/knowledge.md"],
  ["packs/communication.md", "dev/rules/communication.md"]
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
  }
];

const schemaChecks = [
  {
    target: "AGENTS.md",
    label: "core runtime uniqueness",
    checks: [
      {
        label: "exactly one Agent Handoff Kit Core Runtime heading",
        test: (text) => countOccurrences(text, "# Agent Handoff Kit Core Runtime") === 1
      },
      {
        label: "managed core markers are paired and not duplicated",
        test: (text) => {
          const starts = countOccurrences(text, managedCoreStart);
          const ends = countOccurrences(text, managedCoreEnd);
          return starts === ends && starts <= 1;
        }
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
  console.log(`\n✅ created: ${created.length}`);
  console.log(`🔀 merged: ${merged.length}`);
  console.log(`⏭️  skipped existing: ${plan.filter((item) => item.action === "skip").length}`);
  console.log(`${conflicts.length > 0 ? "⚠️ " : "✅ "}conflict: ${conflicts.length}`);
  if (merged.length > 0) console.log(`💾 backup: ${path.relative(root, backupDir)}`);
  console.log(`📄 migration report: ${path.relative(root, report)}`);
  printInstallNextSteps(root, conflicts.length);
  if (conflicts.length > 0) process.exitCode = 1;
}

async function runDoctor(root, version) {
  printCard(version, "doctor ready", "o.o");
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
    console.log(`\nstatus: failed (${missing.length} missing)`);
    console.log("⚠️  檢查未通過：有必要檔案不存在。");
    console.log("下一步：先確認你是否在正確專案資料夾；如是，執行 init 或 upgrade 補回缺少檔案。");
    process.exitCode = 1;
    return;
  }

  const anchorRows = await checkRequiredAnchors(root);
  const anchorFailures = anchorRows.filter((row) => !row.ok);
  console.log(`\nrequired anchors: ${anchorRows.length}`);
  for (const row of anchorRows) {
    console.log(`${row.ok ? "ok" : "missing"}  ${row.target} (${row.label})`);
  }

  if (anchorFailures.length > 0) {
    console.log(`\nstatus: failed (${anchorFailures.length} anchor checks failed)`);
    console.log("⚠️  檢查未通過：有檔案存在，但內容缺少必要段落。");
    console.log("下一步：執行 upgrade --dry-run 查看可否安全補齊；不要手動覆寫既有檔案。");
    process.exitCode = 1;
    return;
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
    console.log(`\nstatus: failed (${schemaFailures.length} schema checks failed)`);
    console.log("⚠️  檢查未通過：交接或索引文件結構不完整。");
    console.log("下一步：把這段 doctor 輸出貼給 AI，請它先修交接結構，不要直接重裝覆蓋。");
    process.exitCode = 1;
    return;
  }

  const mirrorRows = await checkPromptMirror(root);
  const mirrorFailures = mirrorRows.filter((row) => !row.ok);
  console.log(`\nprompt mirror checks: ${mirrorRows.length}`);
  for (const row of mirrorRows) {
    console.log(`${row.ok ? "ok" : "missing"}  ${row.target} (${row.label})`);
    if (!row.ok && row.reason) console.log(`  reason: ${row.reason}`);
  }

  if (mirrorFailures.length > 0) {
    console.log(`\nstatus: failed (${mirrorFailures.length} prompt mirror checks failed)`);
    console.log("⚠️  檢查未通過：下次開工提示副本與 handoff 真源不同。");
    console.log("下一步：以 dev/SESSION_HANDOFF.md 的 Next Session Opening Message 為準，重生 START_NEXT_SESSION_PROMPT.txt。");
    process.exitCode = 1;
    return;
  }

  console.log("\nstatus: passed");
  console.log("✅ 檢查通過：必要文件存在，基本結構完整，下次開工提示副本也與 handoff 一致。");
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
    if (hasRequiredAnchor(targetRel, targetText)) return { ...base, action: "skip", reason: "required anchors already present" };
    return {
      ...base,
      action: "merge",
      reason: "replace stale Agent Handoff Kit core or add managed core while preserving existing AGENTS.md content",
      mergedText: mergeManagedBlock(targetText, sourceText)
    };
  }
  if ((targetRel === "CLAUDE.md" || targetRel === "GEMINI.md") && !targetText.includes("AGENTS.md")) {
    return { ...base, action: "conflict", reason: "existing bridge does not route to AGENTS.md" };
  }
  return { ...base, action: "skip", reason: "preserve existing file" };
}

function mergeManagedBlock(targetText, sourceText) {
  const block = `${managedCoreStart}\n${sourceText.trim()}\n${managedCoreEnd}`;
  const existingBlock = new RegExp(`${escapeRegExp(managedCoreStart)}[\\s\\S]*?${escapeRegExp(managedCoreEnd)}`);
  if (existingBlock.test(targetText)) return `${targetText.replace(existingBlock, block).trimEnd()}\n`;
  const unmarkedCore = findUnmarkedCoreRange(targetText);
  if (unmarkedCore) {
    return `${targetText.slice(0, unmarkedCore.start).trimEnd()}${targetText.slice(0, unmarkedCore.start).trimEnd() ? "\n\n" : ""}${block}${targetText.slice(unmarkedCore.end).trimStart() ? `\n\n${targetText.slice(unmarkedCore.end).trimStart()}` : ""}\n`;
  }
  return `${targetText.trimEnd()}\n\n${block}\n`;
}

function findUnmarkedCoreRange(text) {
  const start = text.indexOf("# Agent Handoff Kit Core Runtime");
  if (start < 0) return null;
  const terminal = "keep the core within budget.";
  const terminalIndex = text.indexOf(terminal, start);
  if (terminalIndex >= 0) return { start, end: terminalIndex + terminal.length };
  const afterTitle = start + "# Agent Handoff Kit Core Runtime".length;
  const nextTopLevel = text.slice(afterTitle).search(/\n# (?!Agent Handoff Kit Core Runtime\b)/);
  if (nextTopLevel < 0) return { start, end: text.length };
  return { start, end: afterTitle + nextTopLevel + 1 };
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
  console.log("📋 人話解讀：下面只是計劃。create 會新增缺少檔案，merge 會在備份後安全合併，skip 會保留既有檔案，conflict 代表工具停手等你確認。");
  console.log("");
  for (const action of ["create", "merge", "skip", "conflict"]) {
    const items = plan.filter((item) => item.action === action);
    console.log(`${action}: ${items.length}`);
    for (const item of items) console.log(`  ${item.targetRel}${item.reason ? ` - ${item.reason}` : ""}`);
  }
  console.log(`\nbackup: ${plan.filter((item) => item.action === "merge").length}`);
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
}
