#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir as systemTmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createFreshUserRuleAcceptance, readFormalUserRules, userRulesAcceptanceDigest } from "../bin/user-rules-router.mjs";
import { extractExplicitLocalReferences } from "../bin/upgrade-inventory.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const qaTmp = process.env.AGENT_HANDOFF_KIT_QA_TMP || (process.platform === "win32" ? "C:\\tmp" : systemTmpdir());
const projectRoot = path.join(qaTmp, `ack-r034-vertical-${Date.now()}-${Math.random().toString(16).slice(2)}`);
const artifactPackageRoot = process.env.AGENT_HANDOFF_KIT_R034_ARTIFACT_ROOT
  || (process.platform === "win32" ? "C:\\tmp\\agent-handoff-kit-r034-gate4-reopen-artifact\\extract\\package" : null);
const artifactTarballPath = process.env.AGENT_HANDOFF_KIT_R034_ARTIFACT_TGZ
  || (process.platform === "win32" ? "C:\\tmp\\agent-handoff-kit-r034-gate4-reopen-artifact\\adamchanadam-agent-handoff-kit-0.3.41.tgz" : null);
const routerRel = "dev/USER_RULES.md";
const ruleRel = "dev/user_rules/unheaded-user-rule.txt";
const artifactVersion = "0.3.41";
const artifactCliSha256 = "0af31efbad625c7a6a9582c70dc03c279b7cb31108ddf03c2d034080d9e6520b";
const artifactContractSha256 = "583e21fac678868852540f7aa12b0223e2f3cda8c607e60134513044c952d801";
const artifactPackageJsonSha256 = "80621ab741e75b42c10da3bece07dbcfcd84d9ac2f8a916eabb0a45c347973b8";
const artifactTarballSha1 = "8b9238287485ef15208c4c339e8cdfe283ce1c23";
const artifactTarballIntegrity = "sha512-2DQjMXhLigpW30vE0bb1aa7F5h1YYW5kXSfruzwg6IltyclvV9EBYPLUTOj49p6QIwmPWcetvJIB8zK0LZFH5Q==";
const artifactFileWitness = new Map([
  ["LICENSE", [1073, "3b2d45270c5165777b672011c891596e6803758dd83773c0124a8f52e4ce423f"]],
  ["README.md", [13332, "63f4899e54bc81f0193c8b28ca7f412425ad76a7a1239a879b9a870afe58b91e"]],
  ["bin/agent-handoff-kit.mjs", [234945, "0af31efbad625c7a6a9582c70dc03c279b7cb31108ddf03c2d034080d9e6520b"]],
  ["bin/installed-file-contract.mjs", [2536, "583e21fac678868852540f7aa12b0223e2f3cda8c607e60134513044c952d801"]],
  ["bin/migration-baselines/official-origin-catalog.json", [1623872, "3ba17c827bd555e73a601af6b5d29196c36884754cb6b89ad1acb8612fabe2e6"]],
  ["bin/official-origin-catalog.mjs", [7863, "998c54ef086c50c41ef4ba8c0b7078264092fcc7b16b85e7227ce8bf20b41cc8"]],
  ["bin/prompt-mirror-core.mjs", [6145, "9d6e6e76d787515502ab51b0b068495677c5da225f8de8bb92ca2f6ecccc4480"]],
  ["package.json", [1107, "80621ab741e75b42c10da3bece07dbcfcd84d9ac2f8a916eabb0a45c347973b8"]],
  ["packs/agent-governance.md", [13220, "33baedd735ee7ec83583f37122a7bfea5c986536b4be6e3d14653f66acec0e77"]],
  ["packs/closeout.md", [7017, "5a9e90053acb175cb9594e8f6f3fd13dbc62dab38e579136f64f4701319cda8b"]],
  ["packs/coding.md", [1057, "79e96a709d7e9ccc629a0e35f88fde72522cccb71a0e7bd103b02ab7a5a1e7f4"]],
  ["packs/communication.md", [1402, "e64bb9a986c1f8af694ab78f755b288dda7b2404661d84eb43e2c66ff43f724d"]],
  ["packs/integrations.md", [25418, "cd696ae93f90ccbf0e0ae24f522c9a1a9d6482b0dd7011225096ab771d2c7fae"]],
  ["packs/knowledge.md", [2769, "a6fde862c5be13354ca2b6d3e8d09e4f8e933f2cbc660a4319047826b3be25d8"]],
  ["packs/onboarding.md", [14561, "7f6b1f68b401697b78c6025ad762b21084783b1a5d942af0f53bee98e3849986"]],
  ["packs/release.md", [1014, "30ee60802efde189845caba562b0736afb5f67a2ef5e222513024216a7425895"]],
  ["packs/research.md", [1233, "b282a48392250b570651f5e2e80c59d6c247617d08db35331d1e7538747a2104"]],
  ["packs/safety.md", [8881, "a673a65999ec6c25e244fcf31139596e2265e5f8bac26352cd659fe2b95b7ae6"]],
  ["packs/writing.md", [3006, "9d565ea60680328e973be6e8832048d3f7a7989fa4175bd04613637408d3aab5"]],
  ["runtime-core/AGENTS.core.md", [10853, "ce14562bb0171028ad4808a0ef494e707d726122445806015e80861b9396326f"]],
  ["runtime-core/CLAUDE.md", [1012, "9e326c3c1ab08fbcd23b28cd398561c17d851a59997842e0f4f97ff3473ff0ad"]],
  ["runtime-core/DOC_SYNC_REGISTRY.md", [1719, "56807afee836d3ce19cabb1d020ef37168880a405b5eb8c6d7347e25e94c36e6"]],
  ["runtime-core/GEMINI.md", [957, "b6e8bfc51ba751fec2acd1719c4459b41524f013e0464a5573de7f66d436c986"]],
  ["runtime-core/PROJECT_DECISIONS.md", [2199, "c2fbfb759a36145a92750226d0f7585d49ce0fa4bf1cfde474988ce510dc455e"]],
  ["runtime-core/PROJECT_INDEX.md", [10003, "111e026a9364713f30e592107f25e22e1738cb6504bda734af733239d021b314"]],
  ["runtime-core/RULE_PACKS.md", [5580, "f38b051fd1f3b316e6c38c843cc1256e0b4368b9253328050c5e678d2dab02ca"]],
  ["runtime-core/SESSION_HANDOFF.md", [6829, "5d4dbbaaa4a5be7076f97da96397f5290890dd256046ae7ec55e9fe1e04cba22"]],
  ["runtime-core/SESSION_LOG.md", [2420, "fb6bfd7026a15f87a54cfa64fbd69f032538b0c3193372876a3722fb997a3a47"]],
  ["runtime-core/START_NEXT_SESSION_PROMPT.txt", [710, "be13e53a1d85961a0d666de99f1113661b16a29bc910a33a1550d808a36638bd"]]
]);
const upgradedVersion = "0.3.42";
const firstRecoveryVersion = "0.3.43";
const multiTargetRecoveryVersion = "0.3.44";
const committedRecoveryVersion = "0.3.45";
const raceVersion = "0.3.46";
const rollbackRaceVersion = "0.3.47";

try {
  if (process.env.AGENT_HANDOFF_KIT_QA_INCLUDE_HYBRID_FUTURE_ROUTER === "1") await mainHybrid();
  else await import("./check-r034-v041-direct-agents.mjs");
  console.log("ok: R-034 vertical QA");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

// v0.3.41 never shipped the v0.3.42 USER_RULES router.  Its real upgrade
// journey is checked by the direct-AGENTS fixture above.  Keep the former
// future-contract construction only as an opt-in compatibility experiment;
// it is not a release gate for historical v0.3.41 projects.
async function mainHybrid() {
  const artifact = unpackVerifiedArtifact();
  mkdirSync(projectRoot, { recursive: true });
  artifactCli(artifact, ["init", "--yes", "--root", projectRoot], "v0.3.41 artifact fresh install");
  const artifactDoctor = artifactCli(artifact, ["doctor", "--root", projectRoot], "v0.3.41 artifact fresh doctor");
  assert(artifactDoctor.stdout.includes("status: passed"), "v0.3.41 artifact fresh doctor did not pass before user content was added");
  await assertTransactionPathSafety(artifact);

  const ruleBytes = Buffer.from("保留這條沒有標題的用戶規則。\n優先於 task packs。\n", "utf8");
  assert(!ruleBytes.toString("utf8").includes("#"), "vertical fixture must be an unheaded user rule");
  const rulePath = path.join(projectRoot, ruleRel);
  mkdirSync(path.dirname(rulePath), { recursive: true });
  writeFileSync(rulePath, ruleBytes);

  const routerPath = path.join(projectRoot, routerRel);
  const agentsPath = path.join(projectRoot, "AGENTS.md");
  const artifactAgents = read(agentsPath);
  assert(!artifactAgents.includes("<!-- ack:user-rules-router:dev/USER_RULES.md -->"), "published v0.3.41 artifact unexpectedly already contains the future user-rules router");
  const entry = createFreshUserRuleAcceptance({ entryId: "unheaded-user-rule", contentPath: ruleRel, bytes: ruleBytes });
  const routerTemplate = readFileSync(path.join(packageRoot, "runtime-core", "USER_RULES.md"), "utf8");
  const preRepairRouter = stripState(replaceRegistry(routerTemplate, [entry]));
  const userOwnedRouterEntry = readFileSync(path.join(packageRoot, "runtime-core", "USER_RULES_ENTRY.md"), "utf8");
  const preRepairAgents = replaceAcceptanceDigest(appendUserRouterEntry(artifactAgents, userOwnedRouterEntry), userRulesAcceptanceDigest([entry]));
  assert(preRepairAgents.startsWith(artifactAgents), "fresh-user setup rewrote published artifact AGENTS.md bytes before the appended user router entry");
  writeFileSync(routerPath, preRepairRouter, "utf8");
  writeFileSync(agentsPath, replaceAcceptanceDigest(preRepairAgents, userRulesAcceptanceDigest([entry])), "utf8");
  const directRouterReferences = extractExplicitLocalReferences(read(agentsPath));
  assert(directRouterReferences.some((reference) => reference.path === routerRel), "formal AGENTS router was not discoverable as its complete file path");
  assert(!directRouterReferences.some((reference) => reference.path === "dev/USER_RULES"), "formal AGENTS router path was truncated into an ambiguous directory reference");

  const preRepairRead = await readFormalUserRules({ root: projectRoot });
  assert(preRepairRead.state === null && preRepairRead.rules.length === 1 && preRepairRead.rules[0].bytes.equals(ruleBytes), "pre-repair fresh router fixture does not expose the exact unheaded rule through AGENTS.md");

  const handoffBeforeFirst = read(path.join(projectRoot, "dev", "SESSION_HANDOFF.md"));
  const first = cli(["upgrade", "--yes", "--root", projectRoot], "first state-bound upgrade", qaVersion(upgradedVersion));
  assert(first.stdout.includes("migration committed") && first.stdout.includes("project health: passed"), "first vertical upgrade claimed neither commit nor the required fresh health readback");
  const firstRead = await readFormalUserRules({ root: projectRoot });
  assert(firstRead.state?.kitBase.packageVersion === upgradedVersion, "first vertical upgrade did not activate the new Kit state");
  assert(firstRead.rules.length === 1 && firstRead.rules[0].bytes.equals(ruleBytes), "first vertical upgrade changed the unheaded user-rule bytes or removed its formal effect");
  assert(read(agentsPath).includes("<!-- BEGIN Agent Handoff Kit managed core -->") && read(agentsPath).includes("<!-- ack:user-rules-router:dev/USER_RULES.md -->"), "old Kit core upgrade did not retain the formal user-router entry outside the replaced base");
  const firstTransaction = latestTransaction(projectRoot);
  assertFormalWitness(firstTransaction.journal, firstRead, "first vertical upgrade");
  assert(firstTransaction.report.includes("## Formal User Rules Acceptance"), "migration report omitted the formal user-rules acceptance section");
  assert(firstTransaction.report.includes(firstRead.acceptanceDigest) && firstTransaction.report.includes(firstTransaction.journal.runtimeReadback.agentsSha256), "migration report did not record the same fresh runtime readback as the transaction");
  const upgradedHandoff = read(path.join(projectRoot, "dev", "SESSION_HANDOFF.md"));
  assert(upgradedHandoff === handoffBeforeFirst, "historical upgrade overwrote non-exact SESSION_HANDOFF.md bytes");
  const handoffAcceptance = firstTransaction.journal.runtimeAcceptance?.entries.find((entry) => entry.targetRel === "dev/SESSION_HANDOFF.md");
  assert(handoffAcceptance?.disposition === "preserve" && handoffAcceptance.sourceWitness.sha256 === handoffAcceptance.accepted.sha256, "historical handoff lacks a same-byte runtime acceptance decision");
  assert(firstTransaction.journal.runtimeAcceptanceReadback?.entries.some((entry) => entry.targetRel === "dev/SESSION_HANDOFF.md" && entry.disposition === "preserve"), "ordinary doctor did not read back the preserved historical handoff through runtime acceptance");
  assert(firstTransaction.journal.currentStateReadback?.currentStateDigest === firstTransaction.journal.currentStateWitness?.currentStateDigest, "historical handoff preservation is detached from the shared current-state readback");
  const prematureCloseout = cli(["closeout-status", "--root", projectRoot], "historical upgrade incomplete closeout card", {}, { allowFailure: true });
  assert(prematureCloseout.status !== 0 && output(prematureCloseout).includes("handoff blocked") && !output(prematureCloseout).includes("handoff saved"), "historical upgrade reported a completed closeout before persistence was assessed");

  const routerAfterFirst = read(routerPath);
  const agentsAfterFirst = read(agentsPath);
  const ruleAfterFirst = readBuffer(rulePath);
  const transactionCountBeforeSecond = countTransactions(projectRoot);
  const second = cli(["upgrade", "--yes", "--root", projectRoot], "second no-op state-bound upgrade", qaVersion(upgradedVersion));
  assert(second.stdout.includes("你已經是最新版本，沒有檔案需要建立或合併") && !second.stdout.includes("migration committed"), "second no-op upgrade did not distinguish a fresh health readback from a new commit");
  assert(countTransactions(projectRoot) === transactionCountBeforeSecond, "second no-op upgrade created a phantom transaction");
  const secondDoctor = cli(["doctor", "--root", projectRoot], "second no-op ordinary doctor", qaVersion(upgradedVersion));
  assert(secondDoctor.stdout.includes("status: passed") && secondDoctor.stdout.includes("formal user-rules checks: 1"), "second no-op upgrade did not leave the same accepted user-rule state readable by ordinary doctor");
  const secondRead = await readFormalUserRules({ root: projectRoot });
  assert(read(routerPath) === routerAfterFirst && readBuffer(rulePath).equals(ruleAfterFirst) && secondRead.rules[0].bytes.equals(ruleBytes), "second upgrade deleted, rewrote, or bypassed formal user-rule bytes");

  // A candidate-only green check remains local evidence. The installed project's
  // ordinary entry and top-level commands must still reject a broken router.
  runScript("scripts/check-r034-semantic-candidate.mjs", "candidate-only local QA");
  const reportCountBeforeBrokenRouter = countTransactions(projectRoot);
  unlinkSync(routerPath);
  assertFailureWithoutSuccess(["doctor", "--root", projectRoot], "missing formal router doctor", {}, ["status: passed"]);
  assertFailureWithoutSuccess(["upgrade", "--yes", "--root", projectRoot], "missing formal router upgrade", qaVersion(upgradedVersion), ["migration committed", "project health: passed", "migration report:"]);
  assert(countTransactions(projectRoot) === reportCountBeforeBrokenRouter, "router-missing upgrade created a transaction or report despite an incomplete formal state");
  writeFileSync(routerPath, routerAfterFirst, "utf8");

  // A literal anchor in a code fence is documentation, not the live runtime
  // entry.  The whole acceptance line may still look valid to a superficial
  // checker, so the ordinary entry must reject it before doctor or upgrade can
  // produce a success signal.
  const entryStart = agentsAfterFirst.indexOf("<!-- ack:user-rules-router:dev/USER_RULES.md -->");
  assert(entryStart >= 0, "active AGENTS.md has no formal router entry to fence for the negative case");
  const fencedAgents = `${agentsAfterFirst.slice(0, entryStart).trimEnd()}\n\n\`\`\`md\n${agentsAfterFirst.slice(entryStart).trim()}\n\`\`\`\n`;
  writeFileSync(agentsPath, fencedAgents, "utf8");
  assertFailureWithoutSuccess(["doctor", "--root", projectRoot], "code-fenced router-entry doctor", {}, ["status: passed"]);
  assertFailureWithoutSuccess(["upgrade", "--yes", "--root", projectRoot], "code-fenced router-entry upgrade", qaVersion(upgradedVersion), ["migration committed", "project health: passed", "migration report:"]);
  writeFileSync(agentsPath, agentsAfterFirst, "utf8");

  // These cases recompute the whole acceptance digest.  They prove that the
  // formal reader validates the promised runtime effect, rather than merely
  // noticing a changed hash.
  for (const [field, value] of [["priorityRelation", "after-task-packs"], ["effectDecision", "documentation-only"]]) {
    const semanticEntry = { ...entry, [field]: value };
    writeFileSync(routerPath, replaceRegistry(routerAfterFirst, [semanticEntry]), "utf8");
    writeFileSync(agentsPath, replaceAcceptanceDigest(agentsAfterFirst, unsafeWholeAcceptanceDigest([semanticEntry], secondRead.state)), "utf8");
    assertFailureWithoutSuccess(["doctor", "--root", projectRoot], `${field}-semantic-drift doctor`, {}, ["status: passed"]);
    assertFailureWithoutSuccess(["upgrade", "--yes", "--root", projectRoot], `${field}-semantic-drift upgrade`, qaVersion(upgradedVersion), ["migration committed", "project health: passed", "migration report:"]);
    writeFileSync(routerPath, routerAfterFirst, "utf8");
    writeFileSync(agentsPath, agentsAfterFirst, "utf8");
  }

  const tamperedMetadataRouter = replaceRegistry(routerAfterFirst, [{ ...entry, effectDecision: "tampered-effect" }]);
  writeFileSync(routerPath, tamperedMetadataRouter, "utf8");
  assertFailureWithoutSuccess(["doctor", "--root", projectRoot], "metadata-drift doctor", {}, ["status: passed"]);
  assertFailureWithoutSuccess(["upgrade", "--yes", "--root", projectRoot], "metadata-drift upgrade", qaVersion(upgradedVersion), ["migration committed", "project health: passed", "migration report:"]);
  writeFileSync(routerPath, routerAfterFirst, "utf8");

  writeFileSync(rulePath, Buffer.concat([ruleBytes, Buffer.from("drift", "utf8")]));
  assertFailureWithoutSuccess(["doctor", "--root", projectRoot], "content-hash-drift doctor", {}, ["status: passed"]);
  assertFailureWithoutSuccess(["upgrade", "--yes", "--root", projectRoot], "content-hash-drift upgrade", qaVersion(upgradedVersion), ["migration committed", "project health: passed", "migration report:"]);
  writeFileSync(rulePath, ruleBytes);

  const interrupted = cli(["upgrade", "--yes", "--root", projectRoot], "interrupted router replacement", {
    ...qaVersion(firstRecoveryVersion),
    AGENT_HANDOFF_KIT_QA_INTERRUPT_AFTER_REPLACE: "1"
  }, { allowFailure: true });
  assert(interrupted.status !== 0 && existsSync(path.join(projectRoot, "dev/governance_migrations/.upgrade.lock")), "interrupted router replacement did not retain its recovery lock");
  assert(!output(interrupted).includes("/\\_/\\"), "interrupted router replacement printed the success cat before recovery completed");
  await assertRejects(
    () => readFormalUserRules({ root: projectRoot }),
    "activation is pending recovery",
    "ordinary formal entry read a transaction-owned partial state"
  );
  const rolledBackFirst = cli(["upgrade", "--yes", "--root", projectRoot], "router-replacement recovery only", {
    ...qaVersion(firstRecoveryVersion),
    AGENT_HANDOFF_KIT_QA_RECOVER_ONLY: "1"
  });
  assert(rolledBackFirst.stdout.includes("recovered interrupted upgrade"), "router-replacement recovery did not report its rollback");
  const afterFirstRollback = await readFormalUserRules({ root: projectRoot });
  assert(afterFirstRollback.state?.kitBase.packageVersion === upgradedVersion && afterFirstRollback.rules[0].bytes.equals(ruleBytes), "router-replacement recovery did not return the complete old router state and original user bytes");
  assert(!existsSync(path.join(projectRoot, "dev/governance_migrations/.upgrade.lock")), "router-replacement recovery lock remained after returning the old state");

  const recovered = cli(["upgrade", "--yes", "--root", projectRoot], "recovered formal-state upgrade", qaVersion(firstRecoveryVersion));
  assert(recovered.stdout.includes("migration committed") && recovered.stdout.includes("project health: passed"), "resubmitted recovery path did not prove a full transaction state before claiming success");
  const recoveredRead = await readFormalUserRules({ root: projectRoot });
  assert(recoveredRead.state?.kitBase.packageVersion === firstRecoveryVersion && recoveredRead.rules[0].bytes.equals(ruleBytes), "recovery did not leave one complete, formally effective state");
  assert(!existsSync(path.join(projectRoot, "dev/governance_migrations/.upgrade.lock")), "recovery lock remained after the verified complete state");
  assertFormalWitness(latestTransaction(projectRoot).journal, recoveredRead, "recovered vertical upgrade");

  // The fourth write is the force-preserved raw user file.  Interrupt after it
  // to cover the router, AGENTS.md, and raw user bytes in one rollback proof.
  const routerBeforeMultiTargetInterrupt = read(routerPath);
  const ruleBeforeMultiTargetInterrupt = readBuffer(rulePath);
  const multiInterrupted = cli(["upgrade", "--yes", "--root", projectRoot], "interrupted multi-target formal-state upgrade", {
    ...qaVersion(multiTargetRecoveryVersion),
    AGENT_HANDOFF_KIT_QA_INTERRUPT_AFTER_REPLACE_COUNT: "4"
  }, { allowFailure: true });
  assert(multiInterrupted.status !== 0 && existsSync(path.join(projectRoot, "dev/governance_migrations/.upgrade.lock")), "multi-target interruption did not retain its recovery lock");
  assert(!output(multiInterrupted).includes("/\\_/\\"), "multi-target interruption printed the success cat before recovery completed");
  await assertRejects(() => readFormalUserRules({ root: projectRoot }), "activation is pending recovery", "formal entry read a multi-target partial state");
  const multiRollback = cli(["upgrade", "--yes", "--root", projectRoot], "multi-target recovery only", {
    ...qaVersion(multiTargetRecoveryVersion),
    AGENT_HANDOFF_KIT_QA_RECOVER_ONLY: "1"
  });
  assert(multiRollback.stdout.includes("recovered interrupted upgrade"), "multi-target recovery did not report its rollback");
  const afterMultiRollback = await readFormalUserRules({ root: projectRoot });
  assert(afterMultiRollback.state?.kitBase.packageVersion === firstRecoveryVersion && afterMultiRollback.rules[0].bytes.equals(ruleBytes), "multi-target recovery did not restore one complete old state with original user bytes");
  assert(read(routerPath) === routerBeforeMultiTargetInterrupt && readBuffer(rulePath).equals(ruleBeforeMultiTargetInterrupt), "multi-target recovery changed the preserved router or raw user bytes");
  assert(!existsSync(path.join(projectRoot, "dev/governance_migrations/.upgrade.lock")), "multi-target recovery lock remained after returning the old state");
  const multiRecovered = cli(["upgrade", "--yes", "--root", projectRoot], "multi-target resubmitted upgrade", qaVersion(multiTargetRecoveryVersion));
  assert(multiRecovered.stdout.includes("migration committed") && multiRecovered.stdout.includes("project health: passed"), "multi-target resubmitted upgrade did not reach the normal commit boundary");
  const multiRecoveredRead = await readFormalUserRules({ root: projectRoot });
  assert(multiRecoveredRead.state?.kitBase.packageVersion === multiTargetRecoveryVersion && multiRecoveredRead.rules[0].bytes.equals(ruleBytes), "multi-target resubmission did not leave one complete new state");

  // A journal can be complete while its report and success output were never
  // produced.  Recovery must fresh-read that committed state before it writes
  // the report and unlocks it.
  const committedInterrupted = cli(["upgrade", "--yes", "--root", projectRoot], "interrupted committed-before-report upgrade", {
    ...qaVersion(committedRecoveryVersion),
    AGENT_HANDOFF_KIT_QA_INTERRUPT_AFTER_JOURNAL_COMMIT: "1"
  }, { allowFailure: true });
  assert(committedInterrupted.status !== 0 && existsSync(path.join(projectRoot, "dev/governance_migrations/.upgrade.lock")), "committed-before-report interruption did not retain its recovery lock");
  assert(!output(committedInterrupted).includes("/\\_/\\"), "committed-before-report interruption printed the success cat before report recovery");
  await assertRejects(() => readFormalUserRules({ root: projectRoot }), "activation is pending recovery", "formal entry read a committed-but-locked state");
  const committedRecovered = cli(["upgrade", "--yes", "--root", projectRoot], "committed-before-report recovery only", {
    ...qaVersion(committedRecoveryVersion),
    AGENT_HANDOFF_KIT_QA_RECOVER_ONLY: "1"
  });
  assert(committedRecovered.stdout.includes("recovered committed upgrade"), "committed-before-report recovery did not report its verified report rebuild");
  const committedRead = await readFormalUserRules({ root: projectRoot });
  assert(committedRead.state?.kitBase.packageVersion === committedRecoveryVersion && committedRead.rules[0].bytes.equals(ruleBytes), "committed-before-report recovery did not leave one complete formally effective state");
  assert(!existsSync(path.join(projectRoot, "dev/governance_migrations/.upgrade.lock")), "committed-before-report recovery lock remained after report rebuild");
  const committedTransaction = latestTransaction(projectRoot);
  assertFormalWitness(committedTransaction.journal, committedRead, "committed-before-report recovered upgrade");
  assert(committedTransaction.report.includes("## Formal User Rules Acceptance"), "committed-before-report recovery did not rebuild the formal acceptance report");

  // This injection runs inside the shared writer after it has completed its
  // last validation and detached the expected target, but before it publishes
  // the replacement name.  A competing target must win without being clobbered.
  const raceBytes = Buffer.from("EXTERNAL WRITER: preserve these exact bytes.\n", "utf8");
  const raced = cli(["upgrade", "--yes", "--root", projectRoot], "forward final-window no-clobber race", {
    ...qaVersion(raceVersion),
    AGENT_HANDOFF_KIT_QA_MUTATE_TARGET_AFTER_FINAL_VALIDATION: routerRel,
    AGENT_HANDOFF_KIT_QA_MUTATE_TARGET_AFTER_FINAL_VALIDATION_PHASE: "forward",
    AGENT_HANDOFF_KIT_QA_MUTATE_TARGET_AFTER_FINAL_VALIDATION_BASE64: raceBytes.toString("base64")
  }, { allowFailure: true });
  assert(raced.status !== 0 && output(raced).includes("final no-clobber replacement"), "forward final-window race overwrote the external bytes instead of stopping");
  assert(!output(raced).includes("migration committed") && !output(raced).includes("project health: passed") && !output(raced).includes("/\\_/\\"), "forward final-window race printed a false success signal");
  assert(readBuffer(routerPath).equals(raceBytes) && readBuffer(rulePath).equals(ruleBytes), "forward final-window race did not preserve the external router bytes and raw user-rule bytes");
  assert(existsSync(path.join(projectRoot, "dev/governance_migrations/.upgrade.lock")), "forward final-window race did not retain the recovery lock");
  await assertRejects(() => readFormalUserRules({ root: projectRoot }), "activation is pending recovery", "formal entry accepted the forward final-window race state");
  const racedRecovery = cli(["upgrade", "--yes", "--root", projectRoot], "forward final-window race recovery", {
    ...qaVersion(raceVersion),
    AGENT_HANDOFF_KIT_QA_RECOVER_ONLY: "1"
  }, { allowFailure: true });
  assert(racedRecovery.status !== 0 && output(racedRecovery).includes("third-state edits"), "forward final-window race recovery overwrote third-party bytes instead of stopping");
  assert(readBuffer(routerPath).equals(raceBytes) && existsSync(path.join(projectRoot, "dev/governance_migrations/.upgrade.lock")), "forward final-window race recovery changed third-party bytes or removed its safety lock");

  await assertRollbackFinalWindowRace(artifact);

  console.log("ok: R-034 artifact-fresh-init vertical upgrade preserves an unheaded user rule, rejects false-green states, and holds both final no-clobber race windows behind the recovery lock");
}

function unpackVerifiedArtifact() {
  assert(artifactPackageRoot && artifactTarballPath, "set AGENT_HANDOFF_KIT_R034_ARTIFACT_ROOT and AGENT_HANDOFF_KIT_R034_ARTIFACT_TGZ to the verified v0.3.41 artifact on this platform");
  assert(existsSync(artifactTarballPath), "verified v0.3.41 artifact tarball is missing");
  const tarball = readBuffer(artifactTarballPath);
  assert(createHash("sha1").update(tarball).digest("hex") === artifactTarballSha1, "verified v0.3.41 tarball SHA-1 drifted");
  assert(`sha512-${createHash("sha512").update(tarball).digest("base64")}` === artifactTarballIntegrity, "verified v0.3.41 tarball SHA-512 integrity drifted");
  const metadataPath = path.join(artifactPackageRoot, "package.json");
  const artifactCliPath = path.join(artifactPackageRoot, "bin", "agent-handoff-kit.mjs");
  const artifactContractPath = path.join(artifactPackageRoot, "bin", "installed-file-contract.mjs");
  assert(existsSync(metadataPath) && existsSync(artifactCliPath) && existsSync(artifactContractPath), "verified artifact extraction is missing required package files");
  const actualPaths = listFiles(artifactPackageRoot).map((relative) => relative.split(path.sep).join("/")).sort();
  assert(actualPaths.length === artifactFileWitness.size, "verified artifact package file count drifted");
  assert(actualPaths.join("\n") === [...artifactFileWitness.keys()].sort().join("\n"), "verified artifact package path set drifted");
  for (const [relative, [bytes, digest]] of artifactFileWitness) {
    const filePath = path.join(artifactPackageRoot, ...relative.split("/"));
    assert(statSync(filePath).size === bytes, `verified artifact byte size drifted: ${relative}`);
    assert(sha256(readBuffer(filePath)) === digest, `verified artifact SHA-256 drifted: ${relative}`);
  }
  assert(sha256(readBuffer(artifactCliPath)) === artifactCliSha256, "verified artifact CLI hash drifted");
  assert(sha256(readBuffer(artifactContractPath)) === artifactContractSha256, "verified artifact installed-file contract hash drifted");
  assert(sha256(readBuffer(metadataPath)) === artifactPackageJsonSha256, "verified artifact package.json hash drifted");
  const metadata = JSON.parse(read(metadataPath));
  assert(metadata.name === "@adamchanadam/agent-handoff-kit" && metadata.version === artifactVersion, "extracted artifact package identity drifted");
  return { cliPath: artifactCliPath, root: artifactPackageRoot };
}

async function assertTransactionPathSafety(artifact) {
  const rootTarget = freshArtifactProject(artifact, "root-target");
  const rootLink = path.join(qaTmp, `ack-r034-vertical-root-link-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  try {
    symlinkSync(rootTarget, rootLink, process.platform === "win32" ? "junction" : "dir");
  } catch (error) {
    throw new Error(`Gate 4 requires a real root-junction negative fixture, but this isolated runtime cannot create one: ${error.code ?? error.message}`);
  }
  const rootBefore = fileSnapshot(rootTarget);
  const rootLinkAttempt = cli(["upgrade", "--yes", "--root", rootLink], "junction root upgrade", qaVersion(upgradedVersion), { allowFailure: true });
  assert(rootLinkAttempt.status !== 0 && output(rootLinkAttempt).includes("symbolic link or junction"), "junction root was not rejected before transaction processing");
  assert(sameSnapshot(rootBefore, fileSnapshot(rootTarget)), "junction-root rejection changed the artifact-fresh project");

  const nestedTarget = freshArtifactProject(artifact, "nested-path-target");
  const originalDev = path.join(nestedTarget, "dev");
  const outsideDev = path.join(qaTmp, `ack-r034-vertical-outside-dev-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(outsideDev, { recursive: true });
  writeFileSync(path.join(outsideDev, "outside-sentinel.txt"), "OUTSIDE BYTES MUST NOT CHANGE\n", "utf8");
  renameSync(originalDev, path.join(nestedTarget, "dev-original"));
  try {
    symlinkSync(outsideDev, originalDev, process.platform === "win32" ? "junction" : "dir");
  } catch (error) {
    throw new Error(`Gate 4 requires a real transaction-target junction fixture, but this isolated runtime cannot create one: ${error.code ?? error.message}`);
  }
  const outsideBefore = fileSnapshot(outsideDev);
  const nestedAttempt = cli(["upgrade", "--yes", "--root", nestedTarget], "transaction target junction", qaVersion(upgradedVersion), { allowFailure: true });
  assert(nestedAttempt.status !== 0 && output(nestedAttempt).includes("target parent resolves outside selected root"), "transaction target parent junction was not rejected before writes");
  assert(sameSnapshot(outsideBefore, fileSnapshot(outsideDev)), "transaction target junction wrote outside the selected root");
  assert(!existsSync(path.join(outsideDev, "governance_migrations")), "transaction target junction created migration state outside the selected root");

  const recoveryTarget = freshArtifactProject(artifact, "recovery-path-target");
  establishFreshUnheadedUserRule(recoveryTarget);
  const interrupted = cli(["upgrade", "--yes", "--root", recoveryTarget], "path-escape interrupted upgrade", {
    ...qaVersion(upgradedVersion),
    AGENT_HANDOFF_KIT_QA_INTERRUPT_AFTER_REPLACE: "1"
  }, { allowFailure: true });
  assert(
    interrupted.status !== 0 && existsSync(path.join(recoveryTarget, "dev/governance_migrations/.upgrade.lock")),
    `path-escape fixture did not create a recoverable interrupted transaction (status=${interrupted.status})\n${output(interrupted)}`
  );
  const journalPath = latestJournalPath(recoveryTarget);
  const journal = JSON.parse(read(journalPath));
  const escapedName = `ack-r034-vertical-escaped-${Date.now()}-${Math.random().toString(16).slice(2)}.md`;
  journal.entries[0].targetRel = `../${escapedName}`;
  writeFileSync(journalPath, `${JSON.stringify(journal, null, 2)}\n`, "utf8");
  const escapedTarget = path.join(path.dirname(recoveryTarget), escapedName);
  writeFileSync(escapedTarget, "ESCAPED SENTINEL BYTES\n", "utf8");
  const recoveryBefore = fileSnapshot(recoveryTarget);
  const escapedBytes = readBuffer(escapedTarget);
  const recoveryAttempt = cli(["upgrade", "--yes", "--root", recoveryTarget], "path-escape recovery", {
    ...qaVersion(upgradedVersion),
    AGENT_HANDOFF_KIT_QA_RECOVER_ONLY: "1"
  }, { allowFailure: true });
  assert(recoveryAttempt.status !== 0 && /unknown or duplicated|escapes selected root/.test(output(recoveryAttempt)), "recovery accepted an escaping transaction target");
  assert(sameSnapshot(recoveryBefore, fileSnapshot(recoveryTarget)) && readBuffer(escapedTarget).equals(escapedBytes), "path-escape recovery changed project or escaped bytes");
  assert(existsSync(path.join(recoveryTarget, "dev/governance_migrations/.upgrade.lock")), "path-escape recovery removed the safety lock");
  console.log("ok: artifact-fresh transaction root, target-path, and recovery path-escape guards");
}

function freshArtifactProject(artifact, label) {
  const root = path.join(qaTmp, `ack-r034-vertical-${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(root, { recursive: true });
  artifactCli(artifact, ["init", "--yes", "--root", root], `v0.3.41 artifact ${label} init`);
  return root;
}

function establishFreshUnheadedUserRule(root) {
  const bytes = Buffer.from("保留這條沒有標題的用戶規則。\n優先於 task packs。\n", "utf8");
  const rulePath = path.join(root, ruleRel);
  mkdirSync(path.dirname(rulePath), { recursive: true });
  writeFileSync(rulePath, bytes);
  const entry = createFreshUserRuleAcceptance({ entryId: "unheaded-user-rule", contentPath: ruleRel, bytes });
  const routerTemplate = readFileSync(path.join(packageRoot, "runtime-core", "USER_RULES.md"), "utf8");
  const routerPath = path.join(root, routerRel);
  writeFileSync(routerPath, stripState(replaceRegistry(routerTemplate, [entry])), "utf8");
  const agentsPath = path.join(root, "AGENTS.md");
  const originalAgents = read(agentsPath);
  const entryText = readFileSync(path.join(packageRoot, "runtime-core", "USER_RULES_ENTRY.md"), "utf8");
  const agents = replaceAcceptanceDigest(appendUserRouterEntry(originalAgents, entryText), userRulesAcceptanceDigest([entry]));
  assert(agents.startsWith(originalAgents), "isolated fresh-user fixture rewrote artifact AGENTS.md bytes before the appended router entry");
  writeFileSync(agentsPath, agents, "utf8");
}

async function assertRollbackFinalWindowRace(artifact) {
  const rollbackRoot = freshArtifactProject(artifact, "rollback-final-window");
  establishFreshUnheadedUserRule(rollbackRoot);
  const rollbackRouterPath = path.join(rollbackRoot, routerRel);
  const rollbackRulePath = path.join(rollbackRoot, ruleRel);
  const rollbackRuleBytes = readBuffer(rollbackRulePath);
  const raceBytes = Buffer.from("EXTERNAL ROLLBACK WRITER: preserve these exact bytes.\n", "utf8");
  const rollbackRace = cli(["upgrade", "--yes", "--root", rollbackRoot], "rollback final-window no-clobber race", {
    ...qaVersion(rollbackRaceVersion),
    AGENT_HANDOFF_KIT_QA_FAIL_AFTER_COMMIT_TARGET: routerRel,
    AGENT_HANDOFF_KIT_QA_MUTATE_TARGET_AFTER_FINAL_VALIDATION: routerRel,
    AGENT_HANDOFF_KIT_QA_MUTATE_TARGET_AFTER_FINAL_VALIDATION_PHASE: "rollback",
    AGENT_HANDOFF_KIT_QA_MUTATE_TARGET_AFTER_FINAL_VALIDATION_BASE64: raceBytes.toString("base64")
  }, { allowFailure: true });
  assert(rollbackRace.status !== 0, "rollback final-window race unexpectedly reported success");
  assert(!output(rollbackRace).includes("migration committed") && !output(rollbackRace).includes("project health: passed") && !output(rollbackRace).includes("/\\_/\\"), "rollback final-window race printed a false success signal");
  assert(readBuffer(rollbackRouterPath).equals(raceBytes), "rollback final-window race overwrote the external router bytes");
  assert(readBuffer(rollbackRulePath).equals(rollbackRuleBytes), "rollback final-window race changed the unheaded raw user-rule bytes");
  assert(existsSync(path.join(rollbackRoot, "dev/governance_migrations/.upgrade.lock")), "rollback final-window race removed the recovery lock");
  await assertRejects(() => readFormalUserRules({ root: rollbackRoot }), "activation is pending recovery", "formal entry accepted the rollback final-window race state");
  const rollbackRecovery = cli(["upgrade", "--yes", "--root", rollbackRoot], "rollback final-window race recovery", {
    ...qaVersion(rollbackRaceVersion),
    AGENT_HANDOFF_KIT_QA_RECOVER_ONLY: "1"
  }, { allowFailure: true });
  assert(rollbackRecovery.status !== 0 && output(rollbackRecovery).includes("third-state edits"), "rollback final-window recovery overwrote third-party bytes instead of stopping");
  assert(readBuffer(rollbackRouterPath).equals(raceBytes) && existsSync(path.join(rollbackRoot, "dev/governance_migrations/.upgrade.lock")), "rollback final-window recovery changed external bytes or removed its safety lock");
  console.log("ok: rollback final-window no-clobber race");
}

function appendUserRouterEntry(agentsText, entryText) {
  return `${agentsText}${agentsText.endsWith("\n") ? "\n" : "\n\n"}${entryText.trim()}\n`;
}

function listFiles(root, current = root) {
  const files = [];
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const entryPath = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(root, entryPath));
    else if (entry.isFile()) files.push(path.relative(root, entryPath));
  }
  return files;
}

function qaVersion(version) {
  return { AGENT_HANDOFF_KIT_QA_ALLOW_VERSION_OVERRIDE: "1", AGENT_HANDOFF_KIT_QA_VERSION_OVERRIDE: version };
}

function artifactCli(artifact, args, label, env = {}, options = {}) {
  return runCli(artifact.cliPath, artifact.root, args, label, env, options);
}

function cli(args, label, env = {}, { allowFailure = false } = {}) {
  return runCli(path.join(packageRoot, "bin", "agent-handoff-kit.mjs"), packageRoot, args, label, env, { allowFailure });
}

function runCli(cliPath, cwd, args, label, env = {}, { allowFailure = false } = {}) {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, CI: "1", ...env }
  });
  if (result.error || (!allowFailure && result.status !== 0)) {
    throw new Error(`${label} failed\n${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  }
  console.log(`ok: ${label}`);
  return result;
}

function runScript(relative, label) {
  const result = spawnSync(process.execPath, [relative], {
    cwd: packageRoot,
    encoding: "utf8",
    env: { ...process.env, CI: "1" }
  });
  if (result.error || result.status !== 0) {
    throw new Error(`${label} failed\n${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  }
  console.log(`ok: ${label}`);
}

function assertFailureWithoutSuccess(args, label, env, forbidden) {
  const result = cli(args, label, env, { allowFailure: true });
  const text = output(result);
  assert(result.status !== 0, `${label} unexpectedly passed`);
  for (const phrase of forbidden) assert(!text.includes(phrase), `${label} printed false success: ${phrase}`);
  assert(!text.includes("/\\_/\\"), `${label} printed the success cat before the failed formal entry was rejected`);
}

function latestJournalPath(root) {
  const migrations = path.join(root, "dev", "governance_migrations");
  const candidates = readdirSync(migrations)
    .filter((name) => name !== ".upgrade.lock")
    .map((name) => path.join(migrations, name))
    .filter((candidate) => statSync(candidate).isDirectory() && existsSync(path.join(candidate, "transaction.json")))
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs);
  assert(candidates.length > 0, "vertical QA found no transaction journal");
  return path.join(candidates[0], "transaction.json");
}

function latestTransaction(root) {
  const journalPath = latestJournalPath(root);
  const directory = path.dirname(journalPath);
  return {
    journal: JSON.parse(read(journalPath)),
    report: read(path.join(directory, "migration-report.md"))
  };
}

function countTransactions(root) {
  const migrations = path.join(root, "dev", "governance_migrations");
  return readdirSync(migrations).filter((name) => existsSync(path.join(migrations, name, "transaction.json"))).length;
}

function assertFormalWitness(journal, readback, label) {
  const witness = journal.formalUserRules;
  assert(witness && witness.acceptanceDigest === readback.acceptanceDigest, `${label} did not persist the current ordered acceptance digest`);
  assert(witness.entries.length === readback.rules.length && witness.entries[0].contentPath === ruleRel && witness.entries[0].accepted.sha256 === readback.rules[0].sha256, `${label} did not persist the ordered content identity and destination`);
  assert(witness.entries[0].activeReader.reader === "AGENTS.md" && witness.entries[0].activeReader.via === routerRel && witness.entries[0].priorityRelation && witness.entries[0].effectDecision, `${label} omitted reader, priority, or effect from the common witness`);
  assert(journal.runtimeReadback?.reader === "doctor formal user-rules check" && journal.runtimeReadback?.acceptanceDigest === readback.acceptanceDigest && journal.runtimeReadback?.routerSha256 === readback.routerSha256, `${label} success record did not use the same formal doctor readback`);
}

function replaceRegistry(routerText, entries) {
  const start = "<!-- ack:user-rules-registry:start -->";
  const end = "<!-- ack:user-rules-registry:end -->";
  const startIndex = routerText.indexOf(start);
  const endIndex = routerText.indexOf(end);
  assert(startIndex >= 0 && endIndex > startIndex, "router registry markers are invalid");
  return `${routerText.slice(0, startIndex + start.length)}\n\`\`\`json\n${JSON.stringify(entries, null, 2)}\n\`\`\`\n${routerText.slice(endIndex)}`;
}

function stripState(routerText) {
  const start = "<!-- ack:user-rules-state:start -->";
  const end = "<!-- ack:user-rules-state:end -->";
  const startIndex = routerText.indexOf(start);
  const endIndex = routerText.indexOf(end);
  assert(startIndex >= 0 && endIndex > startIndex, "fresh router state markers are invalid");
  return `${routerText.slice(0, startIndex)}${routerText.slice(endIndex + end.length).replace(/^\r?\n/, "")}`;
}

function replaceAcceptanceDigest(agentsText, digest) {
  const anchor = /<!-- ack:user-rules-acceptance:sha256=[a-f0-9]{64} -->/g;
  assert((agentsText.match(anchor) ?? []).length === 1, "AGENTS.md acceptance marker is invalid");
  return agentsText.replace(anchor, `<!-- ack:user-rules-acceptance:sha256=${digest} -->`);
}

// Deliberately mirrors the serialized whole witness without validating the
// semantic enumerations. It lets this negative test prove that a malicious
// actor cannot make an invalid priority/effect look acceptable merely by
// recomputing the aggregate digest.
function unsafeWholeAcceptanceDigest(entries, state) {
  return createHash("sha256").update(`${JSON.stringify({ schemaVersion: 2, state, entries })}\n`, "utf8").digest("hex");
}

async function assertRejects(action, expected, label) {
  try {
    await action();
  } catch (error) {
    assert(String(error?.message ?? error).includes(expected), `${label}: expected ${expected}, got ${error?.message ?? error}`);
    return;
  }
  throw new Error(`${label}: action unexpectedly succeeded`);
}

function read(filePath) {
  return readFileSync(filePath, "utf8");
}

function readBuffer(filePath) {
  return readFileSync(filePath);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fileSnapshot(root) {
  return new Map(listFiles(root).sort().map((relative) => [relative, sha256(readBuffer(path.join(root, relative)))]));
}

function sameSnapshot(left, right) {
  return left.size === right.size && [...left].every(([relative, digest]) => right.get(relative) === digest);
}

function output(result) {
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
