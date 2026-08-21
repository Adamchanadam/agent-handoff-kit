#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir as systemTmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { freshInstallMappings, installedMappings, upgradeStateMappings } from "../bin/installed-file-contract.mjs";
import { parseProjectIndexTemplateVersion } from "../bin/upgrade-inventory.mjs";
import { createFreshUserRuleAcceptance, parseUserRulesState, readFormalUserRules, userRulesAcceptanceDigest } from "../bin/user-rules-router.mjs";
import { createQaTempTracker } from "./qa-temp-cleanup.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const tmpdir = () => process.env.AGENT_HANDOFF_KIT_QA_TMP || (process.platform === "win32" ? "D:\\_temp" : systemTmpdir());
const qaTemp = createQaTempTracker("public prototype QA");
const tempRoot = qaTemp.track(path.join(tmpdir(), `ack-prototype-check-${Date.now()}`));

const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const version = packageJson.version;
function nextPatch(v) {
  const [maj, min, p] = v.split(".").map(Number);
  return `${maj}.${min}.${p + 1}`;
}

const forbiddenPatterns = [
  { label: "opening-message end marker drift", pattern: /end marker after it/i },
  { label: "external API safety routed to coding pack", pattern: /external api safety\s*\|\s*coding pack/i },
  { label: "old external API SDK safety mapping", pattern: /External API \/ SDK safety\s*\|\s*Split to coding pack/i },
  { label: "local absolute path leak", pattern: /C:\\Users\\adam/i },
  { label: "local workspace name leak", pattern: /_claude_desktop|ai-session-governance_v2_WORK/i },
  { label: "private WORK repo leak", pattern: /agent-handoff-kit_WORK/i },
  { label: "WORK session title leak", pattern: /Session Handoff — v2 WORK/i },
  { label: "misleading old post-install next line", pattern: /next:\s*Follow AGENTS\.md/i },
  { label: "misleading old post-install tip", pattern: /tip:\s*Describe your task directly/i },
  { label: "common secret assignment", pattern: /(?:SECRET|TOKEN|PASSWORD|API_KEY)\s*[:=]|BEGIN .*PRIVATE/i }
];

const ignoredDirs = new Set([".git", "node_modules", "coverage", "dist"]);
// The generated official-origin catalog contains historical rule examples such
// as placeholder SECRET/TOKEN assignments. Its dedicated checker validates the
// catalog structure, integrity, source artifacts, and high-confidence credential
// values; the broad prose scanner would otherwise mistake examples for secrets.
const ignoredFiles = new Set(["package-lock.json", "bin/migration-baselines/official-origin-catalog.json"]);

main().then(() => {
  qaTemp.cleanupOnSuccess();
}).catch((error) => {
  console.error(error.message);
  qaTemp.reportRetained("QA failed before cleanup");
  process.exitCode = 1;
});

async function main() {
  mkdirSync(tempRoot, { recursive: true });
  assert(freshInstallMappings.some(([, targetRel]) => targetRel === "dev/USER_RULES.md"), "fresh-install contract omitted the user-rules router");
  assert(!installedMappings.some(([, targetRel]) => targetRel === "dev/USER_RULES.md"), "historical file catalog must not infer user-rules ownership");
  assert(upgradeStateMappings.some(([, targetRel]) => targetRel === "dev/USER_RULES.md"), "formal user-rules router is not included in its state-bound upgrade contract");

  const initResult = run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", tempRoot], "install templates");
  assert(initResult.stdout.includes("Start Agent Handoff"), "post-install CLI output missing primary startup phrase");
  assert(initResult.stdout.includes("Read AGENTS.md first, then Start Agent Handoff"), "post-install CLI output missing path-bearing startup fallback");
  assert(initResult.stdout.includes("普通 web chat AI 若不能讀寫本機資料夾，並不適合使用本工具"), "post-install CLI output missing local-agent support boundary");
  assert(initResult.stdout.includes("Wrap up Agent Handoff"), "post-install CLI output missing short closeout intent phrase");
  assert(initResult.stdout.includes("開工，繼續 <任務>") && initResult.stdout.includes("直接接力"), "post-install CLI output missing concrete continuity fast path");
  const installedPrompt = readFileSync(path.join(tempRoot, "START_NEXT_SESSION_PROMPT.txt"), "utf8");
  assert(installedPrompt.includes("Do not read dev/SESSION_LOG.md during ordinary startup"), "initial START_NEXT_SESSION_PROMPT.txt missing ordinary-startup log boundary");
  assert(installedPrompt.includes("A plain `Start Agent Handoff` / `開工` with no same-message task or explicit long-run instruction"), "initial START_NEXT_SESSION_PROMPT.txt missing the plain-startup stop boundary");
  assert(!installedPrompt.includes("If my message or the handoff already gives an executable task"), "initial START_NEXT_SESSION_PROMPT.txt still promotes a loaded objective into same-turn full-task authority");
  assert(installedPrompt.includes("First-use exception: when this handoff says `First-use guidance state: eligible`"), "initial START_NEXT_SESSION_PROMPT.txt missing first-use onboarding trigger boundary");
  assert(installedPrompt.includes("Upgrade never resets consumed / not_applicable first-use state back to eligible"), "initial START_NEXT_SESSION_PROMPT.txt missing upgrade no-reset onboarding boundary");
  assert(!installedPrompt.includes("Help me choose the right working scenario"), "initial START_NEXT_SESSION_PROMPT.txt still forces the legacy chooser path");
  const installedProjectIndex = readFileSync(path.join(tempRoot, "dev", "PROJECT_INDEX.md"), "utf8");
  assert(parseProjectIndexTemplateVersion(installedProjectIndex) === version, "fresh init PROJECT_INDEX Stack version does not match package version");
  const doctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", tempRoot], "doctor installed templates");
  assert(doctor.stdout.includes("status: passed"), "doctor output did not include status: passed");
  assert(doctor.stdout.includes("✅ 檢查通過"), "doctor output missing beginner-friendly passed message");
  assert(!doctor.stdout.includes("generated markdown governance checks"), "doctor must not claim a generated Markdown root-discovery check");
  const nonGitHealth = run(process.execPath, ["bin/agent-handoff-kit.mjs", "workspace-health", "--root", tempRoot], "workspace health non-git root");
  assert(nonGitHealth.stdout.includes("workspace: verified"), "workspace-health should verify a non-git project without blocking");
  assert(nonGitHealth.stdout.includes("git: no"), "workspace-health should report non-git roots plainly");
  assert(!existsSync(path.join(tempRoot, "dev", "governance_migrations")), "fresh install created governance_migrations before doctor");
  assert(doctor.stdout.includes("fresh install 不建立 migration 交易目錄"), "doctor did not report the fresh-install no-migration boundary");
  mkdirSync(path.join(tempRoot, "dev/governance_migrations/20260423T112233Z"), { recursive: true });
  const legacyAgeDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", tempRoot], "doctor legacy migration timestamp compatibility");
  assert(legacyAgeDoctor.stdout.includes("自 2026-04-23"), "doctor did not preserve legacy migration timestamp compatibility");
  assert(!existsSync(path.join(tempRoot, "archive")), "installer created archive directory by default");
  assert(existsSync(path.join(tempRoot, "dev/PROJECT_DECISIONS.md")), "installer did not create dev/PROJECT_DECISIONS.md (R-028)");
  assert(existsSync(path.join(tempRoot, "dev/rules/onboarding.md")), "installer did not create dev/rules/onboarding.md (R-029)");
  assert(existsSync(path.join(tempRoot, "dev/rules/integrations.md")), "installer did not create dev/rules/integrations.md (R-030 v0.3.0+)");
  assert(existsSync(path.join(tempRoot, "dev/USER_RULES.md")), "fresh install did not create the formal user-rules router");
  const emptyUserRules = await readFormalUserRules({ root: tempRoot });
  assert(emptyUserRules.entryPath === "AGENTS.md" && emptyUserRules.routerPath === "dev/USER_RULES.md", "formal user-rules reader did not start at AGENTS.md");
  assert(emptyUserRules.rules.length === 0, "fresh user-rules router should not invent user content");
  const userRulePath = path.join(tempRoot, "dev", "user_rules", "project-local.md");
  const userRuleBytes = Buffer.from("# Local rule\n\n保留原始位元組。\n", "utf8");
  const laterUserRulePath = path.join(tempRoot, "dev", "user_rules", "later.md");
  const laterUserRuleBytes = Buffer.from("# Later rule\n\n第二條必須排在第一條之後。\n", "utf8");
  mkdirSync(path.dirname(userRulePath), { recursive: true });
  writeFileSync(userRulePath, userRuleBytes);
  writeFileSync(laterUserRulePath, laterUserRuleBytes);
  const routerPath = path.join(tempRoot, "dev", "USER_RULES.md");
  const agentsPath = path.join(tempRoot, "AGENTS.md");
  const acceptedEntries = [
    createFreshUserRuleAcceptance({ entryId: "project-local", contentPath: "dev/user_rules/project-local.md", bytes: userRuleBytes }),
    createFreshUserRuleAcceptance({ entryId: "later", contentPath: "dev/user_rules/later.md", bytes: laterUserRuleBytes })
  ];
  const routerText = replaceUserRuleRegistry(readFileSync(routerPath, "utf8"), acceptedEntries);
  writeFileSync(routerPath, routerText, "utf8");
  writeFileSync(agentsPath, replaceUserRulesAcceptanceDigest(readFileSync(agentsPath, "utf8"), acceptedEntries, routerText), "utf8");
  const routedUserRules = await readFormalUserRules({ root: tempRoot });
  assert(routedUserRules.rules.length === 2, "formal user-rules reader did not load every registered entry");
  assert(routedUserRules.rules.map((rule) => rule.path).join(",") === "dev/user_rules/project-local.md,dev/user_rules/later.md", "formal user-rules reader changed the registered priority order");
  assert(routedUserRules.rules.map((rule) => rule.entryId).join(",") === "project-local,later", "formal user-rules reader changed accepted rule identities");
  assert(routedUserRules.rules[0].bytes.equals(userRuleBytes), "formal user-rules reader changed user-rule bytes");
  assert(routedUserRules.rules[1].bytes.equals(laterUserRuleBytes), "formal user-rules reader changed later user-rule bytes");
  const acceptedDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", tempRoot], "doctor accepted formal user-rules state");
  assert(acceptedDoctor.stdout.includes("formal user-rules checks: 1"), "doctor did not read the formal user-rules path");
  run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", tempRoot], "upgrade preserves formal user-rules state through the transaction");
  const postMergeUserRules = await readFormalUserRules({ root: tempRoot });
  assert(postMergeUserRules.rules.length === 2 && postMergeUserRules.rules[0].bytes.equals(userRuleBytes) && postMergeUserRules.rules[1].bytes.equals(laterUserRuleBytes), "upgrade changed the active accepted user rules");
  assert(readFileSync(agentsPath, "utf8").includes(`<!-- ack:user-rules-acceptance:sha256=${userRulesAcceptanceDigest(acceptedEntries, postMergeUserRules.state)} -->`), "upgrade removed the formal user-rules acceptance entry");
  assert(run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", tempRoot], "doctor upgraded formal user-rules state").stdout.includes("status: passed"), "doctor did not preserve the active formal user-rules state after upgrade");
  const acceptedAgentsBytes = readFileSync(agentsPath);
  const acceptedRouterBytes = readFileSync(routerPath);
  writeFileSync(routerPath, replaceUserRuleRegistry(acceptedRouterBytes.toString("utf8"), [...acceptedEntries].reverse()), "utf8");
  await assertRejects(
    () => readFormalUserRules({ root: tempRoot }),
    "AGENTS.md user-rules acceptance digest does not match the ordered registry state",
    "reordered user-rule registrations were accepted without a matching whole acceptance record"
  );
  const reorderedDoctor = runFailure(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", tempRoot], "doctor reordered user-rules registry");
  assert(outputText(reorderedDoctor).includes("acceptance digest does not match the ordered registry state"), "doctor accepted reordered user-rule registrations without a matching acceptance record");
  writeFileSync(routerPath, acceptedRouterBytes);
  const changedMetadataEntries = acceptedEntries.map((entry, index) => index === 0
    ? { ...entry, originalReader: { ...entry.originalReader, reader: "altered-origin-reader" } }
    : entry);
  writeFileSync(routerPath, replaceUserRuleRegistry(acceptedRouterBytes.toString("utf8"), changedMetadataEntries), "utf8");
  await assertRejects(
    () => readFormalUserRules({ root: tempRoot }),
    "AGENTS.md user-rules acceptance digest does not match the ordered registry state",
    "changed acceptance metadata was accepted without a matching whole acceptance record"
  );
  const metadataDoctor = runFailure(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", tempRoot], "doctor changed user-rules acceptance metadata");
  assert(outputText(metadataDoctor).includes("acceptance digest does not match the ordered registry state"), "doctor accepted changed user-rule metadata without a matching acceptance record");
  writeFileSync(routerPath, acceptedRouterBytes);
  writeFileSync(userRulePath, Buffer.concat([userRuleBytes, Buffer.from("drift", "utf8")]));
  await assertRejects(
    () => readFormalUserRules({ root: tempRoot }),
    "user-rules bytes do not match accepted witness: dev/user_rules/project-local.md",
    "changed user-rule bytes were accepted without a new acceptance record"
  );
  const driftDoctor = runFailure(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", tempRoot], "doctor changed user-rule bytes");
  assert(outputText(driftDoctor).includes("formal user-rules checks") && outputText(driftDoctor).includes("user-rules bytes do not match accepted witness"), "doctor reported health after user-rule byte drift");
  writeFileSync(userRulePath, userRuleBytes);
  const managedCoreAnchorDrift = acceptedAgentsBytes.toString("utf8").replaceAll("Start Agent Handoff", "Start Agent Hand0ff");
  assert(managedCoreAnchorDrift !== acceptedAgentsBytes.toString("utf8"), "managed-core anchor drift fixture did not change AGENTS.md");
  writeFileSync(agentsPath, managedCoreAnchorDrift, "utf8");
  await assertRejects(
    () => readFormalUserRules({ root: tempRoot }),
    "AGENTS.md managed core does not match the accepted current user-rules state",
    "managed-core anchor drift was accepted without a new whole user-rules state"
  );
  const coreDriftDoctor = runFailure(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", tempRoot], "doctor managed-core anchor drift under accepted user-rules state");
  const coreDriftOutput = outputText(coreDriftDoctor);
  assert(coreDriftOutput.includes("formal user-rules checks") && coreDriftOutput.includes("AGENTS.md managed core does not match the accepted current user-rules state"), "doctor did not surface managed-core user-rules drift first");
  assert(!coreDriftOutput.includes("非破壞性補回") && !coreDriftOutput.includes("anchor checks failed"), "doctor must not route accepted managed-core drift to generic anchor repair");
  writeFileSync(agentsPath, acceptedAgentsBytes);
  writeFileSync(agentsPath, acceptedAgentsBytes.toString("utf8").replace("<!-- ack:user-rules-router:dev/USER_RULES.md -->", "<!-- legacy project without user-rules entry -->"), "utf8");
  await assertRejects(
    () => readFormalUserRules({ root: tempRoot }),
    "AGENTS.md must contain one formal user-rules entry",
    "legacy project without a formal router was treated as having an active user-rules path"
  );
  assert(readFileSync(userRulePath).equals(userRuleBytes) && readFileSync(laterUserRulePath).equals(laterUserRuleBytes), "legacy-router rejection changed user-rule bytes");
  const missingEntryDoctor = runFailure(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", tempRoot], "doctor missing formal user-rules entry");
  assert(outputText(missingEntryDoctor).includes("AGENTS.md must contain one formal user-rules entry"), "doctor accepted a router disconnected from AGENTS.md");
  const interruptedEntries = [
    ...acceptedEntries,
    createFreshUserRuleAcceptance({ entryId: "missing-after-interruption", contentPath: "dev/user_rules/missing-after-interruption.md", bytes: Buffer.from("missing", "utf8") })
  ];
  const interruptedRouterText = replaceUserRuleRegistry(acceptedRouterBytes.toString("utf8"), interruptedEntries);
  writeFileSync(agentsPath, replaceUserRulesAcceptanceDigest(acceptedAgentsBytes.toString("utf8"), interruptedEntries, interruptedRouterText), "utf8");
  writeFileSync(routerPath, interruptedRouterText, "utf8");
  await assertRejects(
    () => readFormalUserRules({ root: tempRoot }),
    "user-rules file is missing or unsafe: dev/user_rules/missing-after-interruption.md",
    "interrupted router state was accepted without every registered rule"
  );
  assert(readFileSync(userRulePath).equals(userRuleBytes) && readFileSync(laterUserRulePath).equals(laterUserRuleBytes), "interrupted-router rejection changed user-rule bytes");
  const interruptedDoctor = runFailure(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", tempRoot], "doctor interrupted user-rules router");
  assert(outputText(interruptedDoctor).includes("user-rules file is missing or unsafe: dev/user_rules/missing-after-interruption.md"), "doctor accepted an interrupted user-rules router");
  writeFileSync(agentsPath, acceptedAgentsBytes);
  writeFileSync(routerPath, acceptedRouterBytes);
  const recoveredUserRules = await readFormalUserRules({ root: tempRoot });
  assert(recoveredUserRules.rules.length === 2 && recoveredUserRules.rules[0].bytes.equals(userRuleBytes) && recoveredUserRules.rules[1].bytes.equals(laterUserRuleBytes), "restored router did not recover the exact accepted user rules");
  assert(run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", tempRoot], "doctor restored formal user-rules state").stdout.includes("status: passed"), "doctor did not recover after restoring accepted user-rules state");
  console.log("ok: formal user-rules reader binds ordered acceptance state, preserves fresh routing through core upgrade, rejects bypasses, and recovers exact registered bytes");
  checkUnregisteredMarkdownNonDiscovery();
  await checkUpdateNotice();

  const pack = runNpm(["pack", "--dry-run"], "npm package dry-run");
  const expectedFiles = expectedPackageFileCount();
  assert(outputText(pack).includes(`total files: ${expectedFiles}`), `npm dry-run did not report expected ${expectedFiles} package files`);
  assert(outputText(pack).includes("README.en.md"), "npm package is missing the English README");
  assert(!existsSync(path.join(root, `adamchanadam-agent-handoff-kit-${version}.tgz`)), "npm dry-run left a tarball behind");

  const hits = scanForbiddenText(root);
  assert(hits.length === 0, formatHits(hits));

  console.log("");
  console.log("Agent Handoff Kit prototype QA passed");
  console.log("temp install root: cleaned after PASS unless AGENT_HANDOFF_KIT_KEEP_QA_TMP is set");
}

function checkUnregisteredMarkdownNonDiscovery() {
  const orphanRoot = path.join(tmpdir(), `ack-prototype-nondiscovery-${Date.now()}`);
  qaTemp.track(orphanRoot);
  run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", orphanRoot], "unregistered Markdown non-discovery bootstrap");
  mkdirSync(path.join(orphanRoot, "outputs"), { recursive: true });
  writeFileSync(
    path.join(orphanRoot, "outputs/unregistered_design.md"),
    "# Unregistered Design\n\nThis file remains a human governance responsibility, not a doctor root-scan target.\n",
    "utf8"
  );

  const beforeBytes = readFileSync(path.join(orphanRoot, "outputs/unregistered_design.md"));
  const doctor = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", orphanRoot], {
    cwd: root,
    encoding: "utf8"
  });
  const output = outputText(doctor);
  assert(doctor.status === 0 && output.includes("status: passed"), "doctor should not fail on arbitrary unregistered Markdown");
  assert(!output.includes("generated markdown governance checks"), "doctor still claims a generated Markdown root-discovery check");
  assert(!output.includes("outputs/unregistered_design.md"), "doctor reported an arbitrary unregistered Markdown path");
  assert(readFileSync(path.join(orphanRoot, "outputs/unregistered_design.md")).equals(beforeBytes), "doctor changed arbitrary unregistered Markdown bytes");
  console.log("ok: unregistered Markdown non-discovery");
}

async function checkUpdateNotice() {
  const update = run(
    process.execPath,
    ["bin/agent-handoff-kit.mjs", "--help"],
    "update notice with mock registry",
    {
      AGENT_HANDOFF_KIT_UPDATE_CHECK_FORCE: "1",
      AGENT_HANDOFF_KIT_UPDATE_MOCK_LATEST: nextPatch(version)
    }
  );
  assert(update.stdout.includes(`有新版可用：${version} -> ${nextPatch(version)}`), "update notice did not show newer version");
  assert(update.stdout.includes("https://github.com/Adamchanadam/agent-handoff-kit/releases/latest"), "update notice did not include release notes URL");

  const skipped = run(
    process.execPath,
    ["bin/agent-handoff-kit.mjs", "--help"],
    "update notice disabled",
    {
      AGENT_HANDOFF_KIT_UPDATE_CHECK_FORCE: "1",
      AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "1",
      AGENT_HANDOFF_KIT_UPDATE_MOCK_LATEST: nextPatch(version)
    }
  );
  assert(!skipped.stdout.includes("Update available!"), "disabled update check still printed an update notice");
}

function run(command, args, label, env = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, ...env }
  });

  if (result.error || result.status !== 0) {
    throw new Error(`${label} failed\n${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  }

  console.log(`ok: ${label}`);
  return result;
}

function outputText(result) {
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

function runNpm(args, label) {
  if (process.env.npm_execpath) {
    return run(process.execPath, [process.env.npm_execpath, ...args], label);
  }
  const bundledNpmCli = path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
  if (existsSync(bundledNpmCli)) {
    return run(process.execPath, [bundledNpmCli, ...args], label);
  }
  return run(process.platform === "win32" ? "npm.cmd" : "npm", args, label);
}

function expectedPackageFileCount() {
  return 34;
}

function runFailure(command, args, label, env = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, ...env }
  });
  if (result.error || result.status === 0) {
    throw new Error(`${label} unexpectedly passed\n${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  }
  console.log(`ok: ${label}`);
  return result;
}

function replaceUserRuleRegistry(routerText, entries) {
  const normalizedRouter = routerText.replace(/\r\n/g, "\n");
  const serialized = JSON.stringify(entries, null, 2);
  const start = "<!-- ack:user-rules-registry:start -->";
  const end = "<!-- ack:user-rules-registry:end -->";
  const startIndex = normalizedRouter.indexOf(start);
  const endIndex = normalizedRouter.indexOf(end);
  assert(startIndex >= 0 && endIndex > startIndex, "fresh user-rules router acceptance markers are invalid");
  return `${normalizedRouter.slice(0, startIndex + start.length)}\n\`\`\`json\n${serialized}\n\`\`\`\n${normalizedRouter.slice(endIndex)}`;
}

function replaceUserRulesAcceptanceDigest(agentsText, entries, routerText) {
  const digest = userRulesAcceptanceDigest(entries, parseUserRulesState(routerText));
  const anchor = /<!-- ack:user-rules-acceptance:sha256=[a-f0-9]{64} -->/g;
  const matches = agentsText.match(anchor) || [];
  assert(matches.length === 1, "fresh AGENTS.md user-rules acceptance anchor is invalid");
  return agentsText.replace(anchor, `<!-- ack:user-rules-acceptance:sha256=${digest} -->`);
}

function scanForbiddenText(startDir) {
  const hits = [];
  for (const filePath of walk(startDir)) {
    const relative = path.relative(root, filePath).replaceAll(path.sep, "/");
    if (ignoredFiles.has(relative)) continue;
    if (relative === "scripts/build-public-mirror.mjs") continue;
    if (relative === "scripts/check-public-prototype.mjs") continue;
    if (relative === "scripts/check-release-readiness.mjs") continue;
    const text = readFileSync(filePath, "utf8");
    for (const rule of forbiddenPatterns) {
      if (rule.pattern.test(text)) hits.push({ file: relative, label: rule.label });
    }
  }
  return hits;
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
      continue;
    }
    if (entry.isFile() && isTextCandidate(fullPath)) yield fullPath;
  }
}

function isTextCandidate(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico"].includes(ext)) return false;
  if ([".md", ".json", ".mjs", ".js", ".txt", ".html", ".gitignore"].includes(ext)) return true;
  return statSync(filePath).size < 1024 * 1024;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function assertRejects(action, expectedMessage, failureMessage) {
  try {
    await action();
  } catch (error) {
    assert(error instanceof Error && error.message.includes(expectedMessage), `${failureMessage}: ${error?.message ?? "unknown error"}`);
    return;
  }
  throw new Error(failureMessage);
}

function formatHits(hits) {
  return [
    "forbidden source text found:",
    ...hits.map((hit) => `- ${hit.file}: ${hit.label}`)
  ].join("\n");
}
