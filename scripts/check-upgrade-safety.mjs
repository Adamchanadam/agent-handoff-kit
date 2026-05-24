#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const fixturesRoot = path.join(root, "test-fixtures");
const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));

main();

function main() {
  const mergeRoot = path.join(tmpdir(), `ack-upgrade-merge-${Date.now()}`);
  mkdirSync(mergeRoot, { recursive: true });
  writeFileSync(path.join(mergeRoot, "AGENTS.md"), "# Existing Project\n\n## User Local Rules\n\nKeep this local rule.\n", "utf8");

  const upgrade = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", mergeRoot], "upgrade existing AGENTS.md");
  assert(upgrade.stdout.includes("merged: 1"), "upgrade did not report one merged file");
  assert(upgrade.stdout.includes("backup:"), "upgrade did not report backup path");

  const mergedAgents = read(path.join(mergeRoot, "AGENTS.md"));
  assert(mergedAgents.includes("## User Local Rules"), "user local rules were not preserved");
  assert(mergedAgents.includes("Keep this local rule."), "user local rule text was not preserved");
  assert(mergedAgents.includes("BEGIN Agent Handoff Kit managed core"), "managed core block was not added");
  assert(mergedAgents.includes("Agent Handoff Kit Core Runtime"), "core runtime text was not merged");
  assertSingleCore(mergedAgents, "local-rule merge should create one managed core");
  assert(existsSync(path.join(mergeRoot, "dev/PROJECT_DECISIONS.md")), "upgrade did not create dev/PROJECT_DECISIONS.md (R-028)");

  const mergeReport = latestReport(mergeRoot);
  assert(read(mergeReport).includes("## Merged"), "migration report missing merged section");
  assert(read(mergeReport).includes("AGENTS.md"), "migration report missing AGENTS.md");
  const backupAgents = findFile(path.join(path.dirname(mergeReport), "backup"), "AGENTS.md");
  assert(backupAgents, "backup AGENTS.md was not created");
  assert(read(backupAgents).includes("Keep this local rule."), "backup did not preserve original AGENTS.md");

  const doctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", mergeRoot], "doctor after upgrade");
  assert(doctor.stdout.includes("status: passed"), "doctor did not pass after safe upgrade");

  const conflictRoot = path.join(tmpdir(), `ack-upgrade-conflict-${Date.now()}`);
  mkdirSync(conflictRoot, { recursive: true });
  writeFileSync(path.join(conflictRoot, "CLAUDE.md"), "# Existing Claude Memory\n\nDo not replace this custom bridge.\n", "utf8");

  const conflict = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", conflictRoot], "upgrade conflict scenario", { allowFailure: true });
  assert(conflict.status !== 0, "conflict scenario should return non-zero status");
  assert(outputText(conflict).includes("conflict: 1"), "conflict scenario did not report one conflict");
  assert(outputText(conflict).includes("需要人工確認"), "conflict scenario did not explain the conflict in plain language");
  assert(outputText(conflict).includes("這不是檔案壞掉"), "conflict scenario did not reassure that files are not broken");
  assert(read(path.join(conflictRoot, "CLAUDE.md")).includes("Do not replace this custom bridge."), "conflict file was overwritten");
  const conflictReport = latestReport(conflictRoot);
  const conflictText = read(conflictReport);
  assert(conflictText.includes("## Conflicts"), "conflict report missing conflicts section");
  assert(conflictText.includes("CLAUDE.md"), "conflict report missing CLAUDE.md");

  // Regression guard for R-016 + R-031.3: doctor must pass on an older-version
  // install + upgrade. R-016 protects user content rows (External Sources / Fact
  // Base etc.) — those are preserved. R-031.3 v0.3.4+ scopes the template version
  // metadata row as maintainer-owned (not user content): upgrade INJECTS the
  // current CLI version into that row, otherwise doctor's 項目狀態速覽 would
  // contradict the just-completed upgrade. Both invariants are tested here:
  // (a) row gets injected away from stale 0.1.0; (b) doctor passes post-upgrade.
  const staleRoot = path.join(tmpdir(), `ack-upgrade-stalever-${Date.now()}`);
  mkdirSync(staleRoot, { recursive: true });
  run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", staleRoot], "init for stale-version scenario");
  const staleIndexPath = path.join(staleRoot, "dev/PROJECT_INDEX.md");
  const staleIndex = read(staleIndexPath).replace(
    /\| Agent Handoff Kit template version \| [^|]*\|/,
    "| Agent Handoff Kit template version | 0.1.0 |"
  );
  writeFileSync(staleIndexPath, staleIndex, "utf8");
  assert(read(staleIndexPath).includes("| Agent Handoff Kit template version | 0.1.0 |"), "stale version row was not written");
  const staleUpgrade = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", staleRoot], "upgrade with stale version row");
  assert(staleUpgrade.stdout.includes("dev/PROJECT_INDEX.md"), "upgrade did not mention PROJECT_INDEX handling");
  // R-031.3 v0.3.4+: upgrade must INJECT current CLI version into the template
  // version metadata row (not preserve the stale 0.1.0). Without inject, the
  // doctor 項目狀態速覽 would contradict the just-completed upgrade banner.
  const staleAfterUpgrade = read(staleIndexPath);
  assert(!staleAfterUpgrade.includes("| Agent Handoff Kit template version | 0.1.0 |"),
    "upgrade must inject current CLI version into PROJECT_INDEX template version row (R-031.3), not preserve the stale 0.1.0");
  const staleVersionMatch = staleAfterUpgrade.match(/\| Agent Handoff Kit template version \| ([\d.]+) \|/);
  assert(staleVersionMatch && staleVersionMatch[1] !== "0.1.0",
    "upgrade must inject a non-stale version into the template version metadata row (R-031.3)");
  const staleDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", staleRoot], "doctor after stale-version upgrade");
  assert(staleDoctor.stdout.includes("status: passed"), "doctor must pass after stale-version upgrade (R-016 user content preservation + R-031.3 metadata row inject combined)");

  // Regression guard for R-023: older Agent Handoff Kit core files did not
  // include managed-core markers. Upgrade must replace that stale core rather
  // than append a second core below it.
  const oldCoreRoots = [
    ["v0.1.3-style", staleCoreFixture({ skillArbitration: false, promptMirror: false })],
    ["v0.1.4-style", staleCoreFixture({ skillArbitration: true, promptMirror: false })]
  ];
  for (const [label, staleCore] of oldCoreRoots) {
    const oldCoreRoot = path.join(tmpdir(), `ack-upgrade-oldcore-${label}-${Date.now()}`);
    mkdirSync(oldCoreRoot, { recursive: true });
    writeFileSync(path.join(oldCoreRoot, "AGENTS.md"), [
      "# Project Local Preamble",
      "",
      "Keep pre-core local rule.",
      "",
      staleCore,
      "",
      "## User Local Rules",
      "",
      "Keep post-core local rule."
    ].join("\n"), "utf8");
    const oldCoreUpgrade = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", oldCoreRoot], `upgrade ${label} AGENTS core`);
    assert(oldCoreUpgrade.stdout.includes("merged: 1"), `${label} upgrade should report one merged file`);
    const upgradedCore = read(path.join(oldCoreRoot, "AGENTS.md"));
    assertSingleCore(upgradedCore, `${label} upgrade must not leave duplicate core runtimes`);
    assert(upgradedCore.includes("# Project Local Preamble"), `${label} upgrade removed pre-core local heading`);
    assert(upgradedCore.includes("Keep pre-core local rule."), `${label} upgrade removed pre-core local rule`);
    assert(upgradedCore.includes("## User Local Rules"), `${label} upgrade removed post-core local heading`);
    assert(upgradedCore.includes("Keep post-core local rule."), `${label} upgrade removed post-core local rule`);
    assert(upgradedCore.includes("START_NEXT_SESSION_PROMPT.txt"), `${label} upgrade did not add current prompt mirror contract`);
    assert(upgradedCore.includes("External skill flows, subagents, task plans"), `${label} upgrade did not add skill/subagent arbitration`);
    const oldCoreDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", oldCoreRoot], `doctor after ${label} AGENTS core upgrade`);
    assert(oldCoreDoctor.stdout.includes("status: passed"), `${label} doctor did not pass after old core replacement`);
  }

  // Regression guard for R-024 sandwich dup core: a previous upgrade may have
  // added a managed-core marker block while leaving the original unmarked core
  // sitting above or below it. The new assessAgentsMdHealth() function must
  // detect this state as needs-merge, and upgrade must replace (not skip) it.
  // To stage this precondition, start from a stale legacy core (no managed
  // marker), run upgrade once to produce a managed block, then inject another
  // unmarked stale core below it — the sandwich.
  const sandwichRoot = path.join(tmpdir(), `ack-upgrade-sandwich-${Date.now()}`);
  mkdirSync(sandwichRoot, { recursive: true });
  const sandwichLegacyCore = staleCoreFixture({ skillArbitration: false, promptMirror: false });
  writeFileSync(path.join(sandwichRoot, "AGENTS.md"), [
    "# Project Local Preamble",
    "",
    "Keep pre-core local rule.",
    "",
    sandwichLegacyCore,
    "",
    "## User Local Rules",
    "",
    "Keep post-core local rule."
  ].join("\n"), "utf8");
  run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", sandwichRoot], "stage 1 upgrade to managed marker form for R-024 sandwich");
  const sandwichManaged = read(path.join(sandwichRoot, "AGENTS.md"));
  assert(count(sandwichManaged, "BEGIN Agent Handoff Kit managed core") === 1, "stage 1 should leave exactly one managed marker pair");
  assert(countCoreHeadings(sandwichManaged) === 1, "stage 1 should leave exactly one core heading");
  // Now inject an unmarked stale core BELOW the managed block → the sandwich precondition
  const sandwichStale = staleCoreFixture({ skillArbitration: false, promptMirror: false });
  const sandwichInjected = `${sandwichManaged.trimEnd()}\n\n## Legacy Local Notes\n\n${sandwichStale}\n`;
  writeFileSync(path.join(sandwichRoot, "AGENTS.md"), sandwichInjected, "utf8");
  assert(countCoreHeadings(sandwichInjected) === 2, "sandwich precondition: AGENTS.md must contain two core titles before upgrade");
  assert(count(sandwichInjected, "BEGIN Agent Handoff Kit managed core") === 1, "sandwich precondition: AGENTS.md must already contain one managed marker pair");

  const sandwichUpgrade = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", sandwichRoot], "upgrade R-024 sandwich dup core");
  assert(sandwichUpgrade.stdout.includes("merged: 1"), "R-024 sandwich upgrade must report one merged file (not skip)");
  assert(sandwichUpgrade.stdout.includes("sandwich dup core") || sandwichUpgrade.stdout.includes("replace sandwich dup core"), "R-024 sandwich upgrade plan should describe sandwich replacement");

  const sandwichResult = read(path.join(sandwichRoot, "AGENTS.md"));
  assertSingleCore(sandwichResult, "R-024 sandwich upgrade must resolve to exactly one core");
  assert(sandwichResult.includes("BEGIN Agent Handoff Kit managed core"), "R-024 sandwich upgrade must keep one managed marker pair");
  assert(!sandwichResult.includes("This is a stale installed core used to test upgrade replacement."), "R-024 sandwich upgrade must remove the stale core text");

  const sandwichDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", sandwichRoot], "doctor after R-024 sandwich upgrade");
  assert(sandwichDoctor.stdout.includes("status: passed"), "doctor must pass after R-024 sandwich upgrade");
  assert(sandwichUpgrade.stdout.includes("upgrade self-check"), "R-024 upgrade must run doctor self-check automatically (upgrade.done contract)");

  // === Phase 2 R-025 real-fixture scenarios ===
  // Replace hand-typed staleCoreFixture() preconditions with real produced
  // files from older tagged releases (see test-fixtures/ and scripts/generate-upgrade-fixtures.mjs).

  // (A) Real-fixture single-hop upgrade. For each captured version, seed a
  // fresh root with that version's actual init artefacts, then run the
  // current CLI upgrade. The legacy core must be replaced into a managed
  // block, single core, and the automatic doctor self-check must pass.
  const realFixtureRoots = [];
  for (const ver of ["v0.1.4", "v0.1.5", "v0.1.6", "v0.1.7", "v0.1.8"]) {
    const fixtureDir = path.join(fixturesRoot, ver);
    assert(existsSync(path.join(fixtureDir, "AGENTS.md")), `missing fixture: ${ver}/AGENTS.md (re-run npm run qa:fixtures)`);
    assert(existsSync(path.join(fixtureDir, "dev/PROJECT_INDEX.md")), `missing fixture: ${ver}/dev/PROJECT_INDEX.md`);
    const hopRoot = path.join(tmpdir(), `ack-upgrade-realhop-${ver.replace(/\./g, "_")}-${Date.now()}`);
    mkdirSync(path.join(hopRoot, "dev"), { recursive: true });
    copyFileSync(path.join(fixtureDir, "AGENTS.md"), path.join(hopRoot, "AGENTS.md"));
    copyFileSync(path.join(fixtureDir, "dev/PROJECT_INDEX.md"), path.join(hopRoot, "dev/PROJECT_INDEX.md"));
    const hopUpgrade = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", hopRoot], `real-fixture single-hop upgrade ${ver}`);
    // v0.3.0+: upgrade now merges AGENTS.md managed-core (1) + PROJECT_INDEX.md ## Installed Integrations migration (1) = 2 merges.
    assert(hopUpgrade.stdout.includes("merged: 2"), `${ver} real-fixture single-hop must report two merged files (AGENTS.md managed-core + PROJECT_INDEX.md Installed Integrations migration)`);
    assert(hopUpgrade.stdout.includes("upgrade self-check"), `${ver} real-fixture single-hop must run doctor self-check`);
    assert(hopUpgrade.stdout.includes("status: passed"), `${ver} real-fixture single-hop self-check must pass`);
    const hopAgents = read(path.join(hopRoot, "AGENTS.md"));
    assertSingleCore(hopAgents, `${ver} real-fixture single-hop result must be single core`);
    assert(count(hopAgents, "BEGIN Agent Handoff Kit managed core") === 1, `${ver} real-fixture single-hop must produce managed marker pair`);
    realFixtureRoots.push(hopRoot);
  }

  // (B) Real-fixture sandwich: stage 1 upgrade promotes v0.1.4 legacy core
  // into a managed block; then inject v0.1.4 fixture AGENTS.md text as a
  // stale core fragment below the managed block. Current CLI upgrade must
  // strip the stale fragment and leave exactly one core.
  const realSandwichRoot = path.join(tmpdir(), `ack-upgrade-real-sandwich-${Date.now()}`);
  mkdirSync(path.join(realSandwichRoot, "dev"), { recursive: true });
  copyFileSync(path.join(fixturesRoot, "v0.1.4/AGENTS.md"), path.join(realSandwichRoot, "AGENTS.md"));
  copyFileSync(path.join(fixturesRoot, "v0.1.4/dev/PROJECT_INDEX.md"), path.join(realSandwichRoot, "dev/PROJECT_INDEX.md"));
  run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", realSandwichRoot], "real-sandwich stage 1: promote v0.1.4 legacy fixture to managed form");
  const stageOneAgents = read(path.join(realSandwichRoot, "AGENTS.md"));
  assert(count(stageOneAgents, "BEGIN Agent Handoff Kit managed core") === 1, "real-sandwich stage 1 must produce one managed marker pair");
  assert(countCoreHeadings(stageOneAgents) === 1, "real-sandwich stage 1 must leave one core heading");
  const realStaleCoreText = readFileSync(path.join(fixturesRoot, "v0.1.4/AGENTS.md"), "utf8");
  const injectedAgents = `${stageOneAgents.trimEnd()}\n\n## Legacy Notes (real-fixture sandwich)\n\n${realStaleCoreText}\n`;
  writeFileSync(path.join(realSandwichRoot, "AGENTS.md"), injectedAgents, "utf8");
  assert(countCoreHeadings(injectedAgents) === 2, "real-sandwich precondition: must have two core headings before final upgrade");
  const realSandwichUpgrade = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", realSandwichRoot], "real-sandwich final upgrade");
  assert(realSandwichUpgrade.stdout.includes("merged: 1"), "real-sandwich final upgrade must report one merged file");
  assert(realSandwichUpgrade.stdout.includes("upgrade self-check"), "real-sandwich final upgrade must run doctor self-check");
  assert(realSandwichUpgrade.stdout.includes("status: passed"), "real-sandwich self-check must pass");
  const realSandwichResult = read(path.join(realSandwichRoot, "AGENTS.md"));
  assertSingleCore(realSandwichResult, "real-sandwich final result must be single core");

  // (C) Chain upgrade scenario (R-025): simulate a user who installed at
  // v0.1.4 and upgraded through each subsequent release. Each hop uses
  // its own version's CLI from a detached worktree; the corresponding
  // version's doctor must pass after that hop. The final hop uses the
  // current HEAD CLI and its self-check must pass.
  const chainRoot = path.join(tmpdir(), `ack-upgrade-chain-${Date.now()}`);
  mkdirSync(chainRoot, { recursive: true });
  // R-030 v0.3.0+: P1 chain test extension — covers ALL released minor / patch versions.
  // Every release MUST append its new tag here so that upgrade-from-prior-version
  // automated testing accumulates permanently. Closes the v0.2.x state coverage gap that
  // caused v0.3.0 audit to miss 5 upgrade pitfalls.
  const chainSteps = [
    { ref: "v0.1.4", command: "init" },
    { ref: "v0.1.5", command: "upgrade" },
    { ref: "v0.1.6", command: "upgrade" },
    { ref: "v0.1.7", command: "upgrade" },
    { ref: "v0.1.8", command: "upgrade" },
    { ref: "v0.2.0", command: "upgrade" },
    { ref: "v0.2.1", command: "upgrade" },
    { ref: "v0.2.2", command: "upgrade" },
    { ref: "v0.2.3", command: "upgrade" },
    { ref: "v0.3.0", command: "upgrade" },
    { ref: "v0.3.1", command: "upgrade" },
    { ref: "v0.3.2", command: "upgrade" },
    { ref: "v0.3.3", command: "upgrade" },
    { ref: "v0.3.4", command: "upgrade" },
    { ref: "v0.3.5", command: "upgrade" },
    { ref: "v0.3.6", command: "upgrade", source: "current-head" }
  ];
  assertCurrentReleasePatchChainCovered(chainSteps);
  let chainFinal = null;
  for (const step of chainSteps) {
    if (step.source === "current-head") {
      chainFinal = run(process.execPath, ["bin/agent-handoff-kit.mjs", step.command, "--yes", "--root", chainRoot], `chain step: ${step.command} via ${step.ref} current HEAD CLI`);
      const stepDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", chainRoot], `chain doctor: ${step.ref} current HEAD CLI after ${step.command}`);
      assert(stepDoctor.stdout.includes("status: passed"), `chain doctor must pass after ${step.ref} ${step.command}`);
      continue;
    }
    withWorktree(step.ref, (worktreePath) => {
      const cli = path.join(worktreePath, "bin/agent-handoff-kit.mjs");
      run(process.execPath, [cli, step.command, "--yes", "--root", chainRoot], `chain step: ${step.command} via ${step.ref} CLI`);
      const stepDoctor = run(process.execPath, [cli, "doctor", "--root", chainRoot], `chain doctor: ${step.ref} CLI after ${step.command}`);
      assert(stepDoctor.stdout.includes("status: passed"), `chain doctor must pass after ${step.ref} ${step.command}`);
    });
  }
  assert(chainFinal, "chain final current HEAD hop did not run");
  const chainFinalAgents = read(path.join(chainRoot, "AGENTS.md"));
  assertSingleCore(chainFinalAgents, "chain final state must be single core");
  assert(count(chainFinalAgents, "BEGIN Agent Handoff Kit managed core") === 1, "chain final state must have one managed marker pair");
  assert(chainFinal.stdout.includes("upgrade self-check"), "chain final upgrade must run doctor self-check");
  assert(chainFinal.stdout.includes("status: passed"), "chain final self-check must pass (R-025 chain acceptance)");
  const chainFinalHandoff = read(path.join(chainRoot, "dev/SESSION_HANDOFF.md"));
  assert(chainFinalHandoff.includes("ack:field:lifecycle-conflicts-resolved"), "chain final SESSION_HANDOFF.md missing v0.3.6 lifecycle consistency field (handoff migration failed)");
  assert(chainFinalHandoff.includes("Lifecycle consistency rule"), "chain final SESSION_HANDOFF.md missing v0.3.6 lifecycle consistency rule note");

  // v0.2.1 R-029.1: chain test must verify the stale v0.1.X RULE_PACKS.md was force-refreshed
  // to include the v0.2.0+ onboarding signal routing row. Without this assertion, the upgrade
  // flow may silently leave v0.1.X users with a stale routing table (the gap that triggered
  // the v0.2.1 patch).
  const chainFinalRulePacks = read(path.join(chainRoot, "dev/RULE_PACKS.md"));
  assert(chainFinalRulePacks.includes("First-time user signals"), "chain final RULE_PACKS.md missing R-029 onboarding signal routing row (v0.2.1 force-refresh failed)");
  assert(chainFinalRulePacks.includes("dev/rules/onboarding.md"), "chain final RULE_PACKS.md missing onboarding pack reference (v0.2.1 force-refresh failed)");

  // v0.3.0 R-030: chain test must verify the stale v0.2.x RULE_PACKS.md was force-refreshed
  // to include the v0.3.0+ integrations pack routing row, AND the stale v0.2.x PROJECT_INDEX.md
  // was migrated with auto-appended ## Installed Integrations section template. Without these
  // assertions, the upgrade flow may silently leave v0.2.x users without Integration governance
  // discipline support.
  assert(chainFinalRulePacks.includes("dev/rules/integrations.md"), "chain final RULE_PACKS.md missing R-030 integrations pack routing row (v0.3.0 force-refresh failed)");

  // User-added RULE_PACKS rows must survive maintainer row catch-up. Earlier
  // refresh logic replaced the whole routing table, which restored missing Kit
  // rows but silently removed local custom routing rows.
  const customRulePacksRoot = path.join(tmpdir(), `ack-upgrade-rulepacks-custom-${Date.now()}`);
  mkdirSync(customRulePacksRoot, { recursive: true });
  run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", customRulePacksRoot], "rulepacks custom-row bootstrap install");
  const customRulePacksPath = path.join(customRulePacksRoot, "dev/RULE_PACKS.md");
  const customRulePacksBefore = read(customRulePacksPath)
    .replace("First-time user signals", "Legacy first-time signals")
    .replace(/\| External tool integrations[\s\S]*?dev\/rules\/integrations\.md[\s\S]*?\|\r?\n/, "")
    + "\n| Custom user workflow | `dev/rules/custom.md` | keep this user row |\n";
  writeFileSync(customRulePacksPath, customRulePacksBefore, "utf8");
  const customRulePacksUpgrade = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", customRulePacksRoot], "rulepacks custom-row preservation upgrade");
  assert(customRulePacksUpgrade.stdout.includes("merged: 1"), "RULE_PACKS custom-row scenario should merge one routing table file");
  const customRulePacksAfter = read(customRulePacksPath);
  assert(customRulePacksAfter.includes("Custom user workflow"), "RULE_PACKS custom user row was lost during upgrade");
  assert(customRulePacksAfter.includes("First-time user signals"), "RULE_PACKS onboarding routing row was not restored");
  assert(customRulePacksAfter.includes("dev/rules/integrations.md"), "RULE_PACKS integrations routing row was not restored");

  const customSamePathRoot = path.join(tmpdir(), `ack-upgrade-rulepacks-samepath-${Date.now()}`);
  mkdirSync(customSamePathRoot, { recursive: true });
  run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", customSamePathRoot], "rulepacks same-path bootstrap install");
  const customSamePathPath = path.join(customSamePathRoot, "dev/RULE_PACKS.md");
  const customSamePathBefore = read(customSamePathPath)
    .replace("First-time user signals", "Legacy first-time signals")
    .replace(/\| External tool integrations[\s\S]*?dev\/rules\/integrations\.md[\s\S]*?\|\r?\n/, "")
    + "\n| Custom integrations alias | `dev/rules/integrations.md` | keep this alias row |\n";
  writeFileSync(customSamePathPath, customSamePathBefore, "utf8");
  run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", customSamePathRoot], "rulepacks same-path custom-row preservation upgrade");
  const customSamePathAfter = read(customSamePathPath);
  assert(customSamePathAfter.includes("Custom integrations alias"), "RULE_PACKS same-path custom row was lost during upgrade");
  assert(customSamePathAfter.includes("External tool integrations"), "RULE_PACKS official integrations row was not restored when a custom row reused the same pack path");

  const customHeaderRoot = path.join(tmpdir(), `ack-upgrade-rulepacks-header-${Date.now()}`);
  mkdirSync(customHeaderRoot, { recursive: true });
  run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", customHeaderRoot], "rulepacks changed-header bootstrap install");
  const customHeaderPath = path.join(customHeaderRoot, "dev/RULE_PACKS.md");
  const customHeaderBefore = read(customHeaderPath)
    .replace("| Task signal | Pack | Purpose |", "| 自訂任務訊號 | Pack | Purpose |")
    .replace("First-time user signals", "Legacy first-time signals")
    + "\n| Custom user workflow | `dev/rules/custom.md` | keep this user row |\n";
  writeFileSync(customHeaderPath, customHeaderBefore, "utf8");
  const customHeaderUpgrade = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", customHeaderRoot], "rulepacks changed-header conflict upgrade", { allowFailure: true });
  assert(customHeaderUpgrade.status !== 0, "RULE_PACKS changed-header scenario should stop as conflict");
  assert(outputText(customHeaderUpgrade).includes("conflict: 1"), "RULE_PACKS changed-header scenario should report one conflict");
  const customHeaderAfter = read(customHeaderPath);
  assert(customHeaderAfter.includes("自訂任務訊號"), "RULE_PACKS changed header was overwritten");
  assert(customHeaderAfter.includes("Custom user workflow"), "RULE_PACKS custom row was overwritten in changed-header conflict scenario");

  const chainFinalProjectIndex = read(path.join(chainRoot, "dev/PROJECT_INDEX.md"));
  assert(chainFinalProjectIndex.includes("## Installed Integrations"), "chain final PROJECT_INDEX.md missing ## Installed Integrations section (v0.3.0 migration failed)");
  assert(chainFinalProjectIndex.includes("機密分離原則"), "chain final PROJECT_INDEX.md missing credential separation header (v0.3.0 migration failed)");
  assert(chainFinalProjectIndex.includes("Source-of-truth Architecture"), "chain final PROJECT_INDEX.md missing Source-of-truth Architecture sub-table (v0.3.0 migration failed)");
  // R-030 v0.3.0+: `via` reference appears in Installed Integrations 紀律 description blockquote
  // (External Sources stays at user-original schema; via column migration is incremental user choice).
  assert(chainFinalProjectIndex.includes("`via`"), "chain final PROJECT_INDEX.md missing `via` reference in Installed Integrations migration (R-030 migration failed)");
  // Doctor on final state must include integrations pack schema check + credential leak sweep.
  const chainFinalDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", chainRoot], "chain final doctor");
  assert(chainFinalDoctor.stdout.includes("integrations pack structure (外部工具治理)"), "chain final doctor missing R-030 integrations pack schema check");
  assert(chainFinalDoctor.stdout.includes("Credential 機密分離 sweep: ok"), "chain final doctor missing R-030 credential leak sweep");

  // R-030 v0.3.0+: P3 prior-version requiredAnchors propagation test.
  // Verifies that v0.2.x managed-core state's missing v0.3.0 anchors triggers merge (not skip).
  // Without this assertion, future major bumps could silently leave v(N-1) users with stale managed-core
  // content (same pattern as v0.2.1 RULE_PACKS.md propagation gap, generalized to managed-core anchors).
  assert(chainFinalAgents.includes("startup availability probe"), "chain final AGENTS.md missing R-030 startup probe anchor (v0.3.0 propagation gap — managed-core merge did not trigger from v0.2.x state)");
  assert(chainFinalAgents.includes("dev/rules/integrations.md"), "chain final AGENTS.md missing R-030 integrations pack reference (v0.3.0 propagation gap)");
  assert(chainFinalAgents.includes("Credential separation"), "chain final AGENTS.md missing R-030 credential separation discipline (v0.3.0 propagation gap)");
  // Also verify onboarding pack got Scenario F via smart-merge (since v0.2.x onboarding.md exists without F).
  const chainFinalOnboarding = read(path.join(chainRoot, "dev/rules/onboarding.md"));
  assert(chainFinalOnboarding.includes("Scenario F. 審視已裝外部工具"), "chain final onboarding.md missing R-030 Scenario F (smart-merge did not trigger from v0.2.x state)");

  // R-030 v0.3.0+: P2 user-data-preservation regression test.
  // Seeds a fresh root with a fully user-filled PROJECT_INDEX (Notion DB / Drive / Linear declared in
  // External Sources, custom Fact Base rows, project-specific QC commands), runs upgrade, then asserts
  // all user-filled rows preserved. Without this regression test, future migrations could silently
  // overwrite user data (the gap that v0.3.0 audit initially missed before manual catch).
  const userDataFixtureDir = path.join(fixturesRoot, "user-data");
  assert(existsSync(path.join(userDataFixtureDir, "dev/PROJECT_INDEX.md")), "missing fixture: user-data/dev/PROJECT_INDEX.md (P2 regression fixture)");
  const userDataRoot = path.join(tmpdir(), `ack-upgrade-userdata-${Date.now()}`);
  mkdirSync(path.join(userDataRoot, "dev"), { recursive: true });
  // First init from current CLI to bootstrap full installation (gets all other files).
  run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", userDataRoot], "user-data regression bootstrap install");
  // Then overwrite PROJECT_INDEX with user-filled fixture (simulating v0.2.x user state with custom data).
  copyFileSync(path.join(userDataFixtureDir, "dev/PROJECT_INDEX.md"), path.join(userDataRoot, "dev/PROJECT_INDEX.md"));
  // Run upgrade — should trigger PROJECT_INDEX migration (insert Installed Integrations) without overwriting user content.
  const userDataUpgrade = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", userDataRoot], "user-data regression upgrade");
  assert(userDataUpgrade.stdout.includes("status: passed"), "user-data regression upgrade self-check must pass");
  // Verify user-filled rows preserved post-upgrade.
  const userDataPostIndex = read(path.join(userDataRoot, "dev/PROJECT_INDEX.md"));
  assert(userDataPostIndex.includes("Python 3.11"), "P2 regression: user-filled Stack row『Python 3.11』lost after upgrade");
  assert(userDataPostIndex.includes("Notion DB「Project Tasks」"), "P2 regression: user-filled External Sources row『Notion DB「Project Tasks」』lost after upgrade");
  assert(userDataPostIndex.includes("https://notion.so/abc123def456"), "P2 regression: user-filled Notion URL lost after upgrade");
  assert(userDataPostIndex.includes("Google Drive「Project Files/」"), "P2 regression: user-filled External Sources row『Google Drive』lost after upgrade");
  assert(userDataPostIndex.includes("Linear「Project Backlog」"), "P2 regression: user-filled External Sources row『Linear』lost after upgrade");
  assert(userDataPostIndex.includes("~/project/docs/api-spec.md"), "P2 regression: user-filled Fact Base row lost after upgrade");
  assert(userDataPostIndex.includes("pytest tests/unit/"), "P2 regression: user-filled Local QC Commands row lost after upgrade");
  assert(userDataPostIndex.includes("a1b2c3d"), "P2 regression: user-filled Workspace Identity row lost after upgrade");
  // Verify Installed Integrations section was correctly inserted (non-destructive migration).
  assert(userDataPostIndex.includes("## Installed Integrations"), "P2 regression: ## Installed Integrations not inserted after upgrade");
  assert(userDataPostIndex.includes("### Source-of-truth Architecture"), "P2 regression: Source-of-truth Architecture sub-table not inserted");

  console.log("");
  console.log("Agent Handoff Kit upgrade safety QA passed");
  console.log(`merge root: ${mergeRoot}`);
  console.log(`conflict root: ${conflictRoot}`);
  console.log(`stale-version root: ${staleRoot}`);
  console.log(`sandwich root: ${sandwichRoot}`);
  console.log(`real-fixture single-hop roots: ${realFixtureRoots.length}`);
  console.log(`real-sandwich root: ${realSandwichRoot}`);
  console.log(`chain root: ${chainRoot}`);
  console.log(`user-data regression root: ${userDataRoot}`);
}

function withWorktree(ref, callback) {
  const worktreePath = path.join(tmpdir(), `ack-chain-wt-${ref.replace(/\./g, "_")}-${Date.now()}`);
  const addResult = spawnSync("git", ["worktree", "add", "--detach", worktreePath, ref], {
    cwd: root,
    encoding: "utf8"
  });
  if (addResult.status !== 0) {
    throw new Error(`git worktree add ${ref} failed (exit ${addResult.status})\n${addResult.stdout ?? ""}\n${addResult.stderr ?? ""}`);
  }
  try {
    callback(worktreePath);
  } finally {
    const rmResult = spawnSync("git", ["worktree", "remove", "--force", worktreePath], {
      cwd: root,
      encoding: "utf8"
    });
    if (rmResult.status !== 0) {
      console.error(`warning: chain worktree cleanup failed for ${worktreePath}`);
    }
  }
}

function run(command, args, label, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8"
  });

  if (!options.allowFailure && (result.error || result.status !== 0)) {
    throw new Error(`${label} failed\n${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  }

  console.log(`ok: ${label}`);
  return result;
}

function latestReport(projectRoot) {
  const dir = path.join(projectRoot, "dev/governance_migrations");
  const entries = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert(entries.length > 0, "no migration report directory found");
  return path.join(dir, entries.at(-1), "migration-report.md");
}

function findFile(startDir, targetName) {
  if (!existsSync(startDir)) return null;
  for (const entry of readdirSync(startDir, { withFileTypes: true })) {
    const fullPath = path.join(startDir, entry.name);
    if (entry.isDirectory()) {
      const found = findFile(fullPath, targetName);
      if (found) return found;
      continue;
    }
    if (entry.isFile() && entry.name === targetName) return fullPath;
  }
  return null;
}

function read(filePath) {
  return readFileSync(filePath, "utf8");
}

function outputText(result) {
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

function assertSingleCore(text, label) {
  assert(countCoreHeadings(text) === 1, `${label}: duplicate Agent Handoff Kit core runtime heading`);
  assert(count(text, "BEGIN Agent Handoff Kit managed core") <= 1, `${label}: duplicate managed core start marker`);
  assert(count(text, "BEGIN Agent Handoff Kit managed core") === count(text, "END Agent Handoff Kit managed core"), `${label}: managed core markers are not paired`);
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

// Count real top-level Kit core headings (line-anchored), not inline mentions inside backticks/prose.
function countCoreHeadings(text) {
  const regex = /(^|\n)# Agent Handoff Kit Core Runtime(?=\r?\n|$)/g;
  let n = 0;
  while (regex.exec(text) !== null) n += 1;
  return n;
}

// R-025 boundary: this synthesized fixture is retained ONLY for schema-boundary
// tests where the production state cannot be captured from a real tag (e.g.
// toggling the skillArbitration / promptMirror flags to cover the v0.1.3 vs
// v0.1.4 era distinction in one place). Production-state preconditions must
// use test-fixtures/<version>/ generated by scripts/generate-upgrade-fixtures.mjs.
// Do NOT extend this function with new production scenarios; add a real
// fixture instead.
function staleCoreFixture({ skillArbitration, promptMirror }) {
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
${skillArbitration ? "\nExternal skill flows, subagents, task plans, or another tool's \"finish\" step do not replace this loop.\n" : ""}
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
9. Show a short closeout card, then provide a fenced opening message.
${promptMirror ? "\n10. Regenerate `START_NEXT_SESSION_PROMPT.txt`.\n" : ""}
## 5. Pack Loading

Use \`dev/RULE_PACKS.md\` to decide which pack to read.

## Core Complexity Rule

New default-core rules are allowed only when they apply to most sessions, protect safety or continuity, cannot live in a pack or registry, and keep the core within budget.
`;
}

function assertCurrentReleasePatchChainCovered(chainSteps) {
  const version = packageJson.version;
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  assert(match, `package.json version must be semver, got ${version}`);

  const finalStep = chainSteps[chainSteps.length - 1];
  assert(finalStep.source === "current-head", "chainSteps final hop must use current HEAD CLI");
  assert(finalStep.ref === `v${version}`, `chainSteps final hop must be labeled v${version}`);

  const patch = Number(match[3]);
  if (patch === 0) return;

  const previousPatchTag = `v${match[1]}.${match[2]}.${patch - 1}`;
  const releasedRefs = new Set(chainSteps.filter((step) => step.source !== "current-head").map((step) => step.ref));
  assert(releasedRefs.has(previousPatchTag), `chainSteps missing previous released patch ${previousPatchTag} before current v${version}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
