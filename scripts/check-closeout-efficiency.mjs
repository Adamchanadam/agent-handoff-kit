#!/usr/bin/env node

// Isolated green verification.  The matching pre-fix red evidence remains in
// the separate frozen-source clone; this helper stays untracked in integration.
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { installedFileContract } from "../bin/installed-file-contract.mjs";
import { extractOpeningMessage } from "../bin/prompt-mirror-core.mjs";
import { assertRunFailed, assertRunPassed, describeResult, invokeAsync, TIMEOUT_EXIT_CODE } from "./qa-runner-core.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = mkdtempSync(path.join(tmpdir(), "ack-closeout-efficiency-red-"));
const version = JSON.parse(readAt(sourceRoot, "package.json")).version;
let registryRequests = 0;
const registry = createServer((_request, response) => {
  registryRequests += 1;
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify({ version }));
});

try {
  assertFreshRulePackRendererCases();
  const registryUrl = await listen(registry);
  const ordinaryEnv = cleanEnvironment({
    AGENT_HANDOFF_KIT_UPDATE_REGISTRY_URL: registryUrl,
    AGENT_HANDOFF_KIT_UPDATE_TIMEOUT_MS: "2000"
  });
  const noUpdateEnv = { ...ordinaryEnv, AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "1" };

  const init = await invoke(["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", fixtureRoot], noUpdateEnv);
  assert(init.status === 0, `fixture init failed\n${output(init)}`);
  const initNoUpdateLookupCount = registryRequests;
  assert(initNoUpdateLookupCount === 0, `NO_UPDATE_CHECK init contacted the registry ${initNoUpdateLookupCount} time(s)`);
  registryRequests = 0;

  const handoffPath = path.join(fixtureRoot, "dev", "SESSION_HANDOFF.md");
  const initialHandoff = readFileSync(handoffPath, "utf8");
  const declaredColdZoneRoute = extractColdZoneRoute(initialHandoff);
  const closeoutContract = installedFileContract(declaredColdZoneRoute);
  assert(closeoutContract, `installed handoff declares a cold-zone route outside the installed-file contract: ${declaredColdZoneRoute}`);
  assert(closeoutContract.sourceRel === "packs/closeout.md", `installed handoff cold-zone route resolves to ${closeoutContract.sourceRel}, not packs/closeout.md`);
  const installedCloseoutTarget = readFileSync(path.join(fixtureRoot, closeoutContract.targetRel));
  const closeoutSource = readFileSync(path.join(sourceRoot, closeoutContract.sourceRel));
  // Fresh install uses encodeLikeExisting(..., null), whose existing contract
  // canonicalizes source CRLF/CR to LF before the complete target bytes are written.
  // Normalize only the expected source. The actual installed bytes stay exact.
  assertFreshRulePackBytes(installedCloseoutTarget, closeoutSource, `installed cold-zone target ${closeoutContract.targetRel} does not match the fresh-install renderer output for ${closeoutContract.sourceRel}`);
  const installedGovernance = readFileSync(path.join(fixtureRoot, "dev", "rules", "agent-governance.md"), "utf8");
  const installedKnowledge = readFileSync(path.join(fixtureRoot, "dev", "rules", "knowledge.md"), "utf8");
  const installedIntegrations = readFileSync(path.join(fixtureRoot, "dev", "rules", "integrations.md"), "utf8");
  const installedLog = readFileSync(path.join(fixtureRoot, "dev", "SESSION_LOG.md"), "utf8");
  const installedCloseout = readFileSync(path.join(fixtureRoot, "dev", "rules", "closeout.md"), "utf8");
  const installedDecisions = readFileSync(path.join(fixtureRoot, "dev", "PROJECT_DECISIONS.md"), "utf8");
  assert(installedGovernance.includes("installed `AGENTS.md` Persistence Gate") && !installedGovernance.includes("runtime-core/AGENTS.core.md` persistence gate"), "installed governance pack retained source-only persistence owner");
  assert(installedKnowledge.includes("installed `AGENTS.md`") && !installedKnowledge.includes("runtime-core/AGENTS.core.md` Section 1"), "installed knowledge pack retained source-only probe owner");
  assert(installedIntegrations.includes("`dev/rules/safety.md` Rule 10") && installedIntegrations.includes("`dev/PROJECT_INDEX.md` `## Installed Integrations`") && !installedIntegrations.includes("`packs/safety.md` Rule 10"), "installed integrations pack retained source-only cross-reference");
  assert(installedLog.includes("`dev/rules/closeout.md` `## Maintenance Trigger Check`") && !installedLog.includes("N=1–3 keep full"), "installed session-log preamble retained duplicate maintenance thresholds");
  assert(installedCloseout.includes("same session, reuse only evidence already fully received") && installedCloseout.includes("pure `SESSION_LOG` size advisory is not a `closeout-status` blocker") && installedCloseout.includes("Unknown count alone does not force a historical sweep"), "installed closeout pack lost bounded read reuse or advisory-only maintenance contract");
  assert(installedLog.includes("Do not create an entry solely for a size advisory") && installedDecisions.includes("not a reason to invent a decision entry or sweep unknown historical material"), "installed maintenance consumers retained forced no-op historical work");
  assert(installedGovernance.includes("Record only actual maintenance or a current risk") && installedGovernance.includes("A count alone does not force a historical sweep or no-op record") && !installedGovernance.includes("closeout maintenance trigger check was recorded") && !installedGovernance.includes("full maintenance applied where its trigger conditions were met"), "installed governance consumer retained the prior forced maintenance record contract");
  assert(installedDecisions.includes("threshold advisory alone does not force splitting or sweeping unknown material") && !installedDecisions.includes("grows past the maintenance threshold"), "installed decisions consumer retained the prior threshold-forced split contract");
  const completeHandoff = closeoutReadyHandoff(initialHandoff);
  writeFixtureHandoff(completeHandoff);

  const normalDoctor = await invoke(["bin/agent-handoff-kit.mjs", "doctor", "--root", fixtureRoot], ordinaryEnv);
  assert(normalDoctor.status === 0, `ordinary doctor failed\n${output(normalDoctor)}`);
  assert(normalDoctor.stdout.includes("npm latest"), "ordinary doctor no longer reported version alignment");
  assert(registryRequests === 1, `ordinary doctor made ${registryRequests} registry lookups instead of exactly one`);

  const beforeNoUpdateDoctor = registryRequests;
  const noUpdateDoctor = await invoke(["bin/agent-handoff-kit.mjs", "doctor", "--root", fixtureRoot], noUpdateEnv);
  assert(noUpdateDoctor.status === 0, `NO_UPDATE_CHECK doctor failed\n${output(noUpdateDoctor)}`);
  const noUpdateDoctorLookupCount = registryRequests - beforeNoUpdateDoctor;
  assert(noUpdateDoctorLookupCount === 0, `NO_UPDATE_CHECK doctor contacted the registry ${noUpdateDoctorLookupCount} time(s)`);

  const beforeOrdinaryCloseout = registryRequests;
  const ordinaryCloseout = await invoke(["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], ordinaryEnv);
  assert(ordinaryCloseout.status === 0 && ordinaryCloseout.stdout.includes("handoff saved"), `valid ordinary closeout did not succeed\n${output(ordinaryCloseout)}`);
  const ordinaryCloseoutLookupCount = registryRequests - beforeOrdinaryCloseout;
  assert(ordinaryCloseoutLookupCount === 0, `closeout-status contacted the registry ${ordinaryCloseoutLookupCount} time(s)`);

  const beforeCloseout = registryRequests;
  const noUpdateCloseout = await invoke(["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], noUpdateEnv);
  assert(noUpdateCloseout.status === 0 && noUpdateCloseout.stdout.includes("handoff saved"), `valid no-update closeout did not succeed\n${output(noUpdateCloseout)}`);
  const noUpdateLookupCount = registryRequests - beforeCloseout;
  assert(noUpdateLookupCount === 0, `NO_UPDATE_CHECK closeout-status contacted the registry ${noUpdateLookupCount} time(s)`);

  const closeoutPack = readAt(sourceRoot, "packs/closeout.md");
  const handoffTemplate = readAt(sourceRoot, "runtime-core/SESSION_HANDOFF.md");
  assert(closeoutPack.includes("Full closeout is differential and write-minimal"), "full closeout no longer declares a write-minimal contract");
  assert(closeoutPack.includes("Update only fields whose current truth changed"), "full closeout still implies every section must be rewritten");
  assert(closeoutPack.includes("Handoff cold zones are historical / evidence sections"), "full closeout no longer protects cold-zone historical evidence");
  assert(closeoutPack.includes("Do not rewrite, reword, reorder, or refresh cold zones"), "full closeout still permits cold-zone refresh");
  assert(closeoutPack.includes("Stable anchors and decision-changing current facts stay in the packet"), "full closeout no longer preserves current continuity facts while compacting cold history");
  assert(closeoutPack.includes("verify that copy before removing it from the current packet"), "full closeout can remove cold detail before an archive copy is verified");
  assert(closeoutPack.includes("Do not rewrite or archive unchanged material at every closeout"), "full closeout now implies repeated archival work");
  assert(closeoutPack.includes("full reception of the current packet"), "full closeout no longer requires full reception after compaction");
  assert(closeoutPack.includes("Regenerate it only when normalized content differs"), "full closeout still regenerates the startup mirror before checking for drift");
  assert(handoffTemplate.includes("update only sections whose current truth changed"), "handoff template still instructs whole-section rewrite/confirmation at every closeout");
  assert(handoffTemplate.includes("Cold-zone retention and trace/archive handling are owned by `dev/rules/closeout.md`"), "handoff template does not route cold-zone procedure to the installed closeout pack");
  assert(handoffTemplate.includes("current outcome, remaining obligations, decision-changing corrections/rejected reasons, evidence limits and pointers"), "handoff template no longer identifies continuity facts that must survive compaction");
  assert(handoffTemplate.includes("Full reception of the current packet remains mandatory"), "handoff template no longer preserves the reception requirement");
  assert(handoffTemplate.includes("Regenerate only if normalized content differs"), "handoff template still treats prompt mirror regeneration as unconditional");
  assert(closeoutPack.includes("Do not run a separate bundled `doctor`"), "full closeout still instructs a redundant bundled doctor");
  assert(closeoutPack.includes("one required fresh doctor read-back"), "closeout-status is not the declared single fresh doctor authority");
  assert(closeoutPack.includes("same session, reuse only evidence already fully received"), "closeout required reads do not limit reuse to fully received unchanged evidence");
  assert(closeoutPack.includes("A no-op closeout must not create a false work record"), "closeout still requires false durable log work for a no-op");
  assert(closeoutPack.includes("Before shortening an active source, verify the preserved copy"), "closeout does not retain preservation verification before shortening source material");

  // Breaking AGENTS proves closeout-status still performs its one fresh doctor
  // readback rather than trusting only the handoff and mirror fields.
  const agentsPath = path.join(fixtureRoot, "AGENTS.md");
  const agentsBytes = readFileSync(agentsPath);
  writeFileSync(agentsPath, "broken AGENTS for isolated red evidence\n", "utf8");
  const doctorFailure = await invoke(["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], noUpdateEnv);
  assert(doctorFailure.status !== 0 && doctorFailure.stdout.includes("fresh doctor read-back did not pass"), `doctor failure produced a false closeout success\n${output(doctorFailure)}`);
  assert(doctorFailure.stdout.includes("Doctor: status: failed"), `doctor failure omitted the doctor status detail\n${output(doctorFailure)}`);
  assert(doctorFailure.stdout.includes("Doctor first problem:") && doctorFailure.stdout.includes("AGENTS.md"), `doctor failure omitted the first actionable doctor problem\n${output(doctorFailure)}`);
  writeFileSync(agentsPath, agentsBytes);

  const mirrorPath = path.join(fixtureRoot, "START_NEXT_SESSION_PROMPT.txt");
  writeFileSync(mirrorPath, "stale mirror\n", "utf8");
  const mirrorFailure = await invoke(["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], noUpdateEnv);
  assert(mirrorFailure.status !== 0 && mirrorFailure.stdout.includes("opening-message mirror is not current"), `mirror failure produced a false closeout success\n${output(mirrorFailure)}`);
  writeFixtureHandoff(completeHandoff);

  const blockedHandoff = completeHandoff.replace(
    /- Project-required persistence:[^\r\n]*/,
    "- Project-required persistence: blocked — isolated fixture requires a prohibited push."
  );
  writeFixtureHandoff(blockedHandoff);
  const handoffFailure = await invoke(["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], noUpdateEnv);
  assert(handoffFailure.status !== 0 && handoffFailure.stdout.includes("project-required persistence is not complete or not required"), `handoff failure produced a false closeout success\n${output(handoffFailure)}`);

  const differentCwd = await invoke([path.join(sourceRoot, "bin", "agent-handoff-kit.mjs"), "closeout-status", "--root", fixtureRoot], noUpdateEnv, { cwd: tmpdir() });
  assert(differentCwd.status !== 0 && differentCwd.stdout.includes("project-required persistence is not complete or not required"), `explicit --root was not honored from a different cwd\n${output(differentCwd)}`);

  const partialPassTimeout = await invoke(["-e", "console.log('PASS before final state'); setTimeout(() => {}, 10000);"], noUpdateEnv, { timeoutMs: 200 });
  assert(partialPassTimeout.timedOut && partialPassTimeout.status === TIMEOUT_EXIT_CODE, `partial PASS before timeout did not become indeterminate\n${output(partialPassTimeout)}`);
  assertRunFailed(partialPassTimeout, "partial PASS timeout fixture");

  const ignoreSigtermTimeout = await invoke(["-e", "process.on('SIGTERM', () => {}); console.log('PASS before final state'); setInterval(() => {}, 10000);"], noUpdateEnv, {
    timeoutMs: 200,
    killGraceMs: 200,
    settleGraceMs: 800
  });
  assert(ignoreSigtermTimeout.timedOut && ignoreSigtermTimeout.status === TIMEOUT_EXIT_CODE, `child that ignored SIGTERM did not settle as bounded timeout\n${output(ignoreSigtermTimeout)}`);
  assert(ignoreSigtermTimeout.stopped === true || ignoreSigtermTimeout.stopped === false, `ignore-SIGTERM result did not preserve stopped proof state\n${output(ignoreSigtermTimeout)}`);
  assertRunFailed(ignoreSigtermTimeout, "ignore SIGTERM timeout fixture");

  const wrapperFalseGreen = await invoke(["-e", "const {spawnSync}=require('node:child_process'); const r=spawnSync(process.execPath,['-e','process.exit(9)'],{encoding:'utf8'}); console.log(`inner status ${r.status}`); process.exit(0);"], noUpdateEnv, { timeoutMs: 10_000 });
  let wrapperRejected = false;
  try {
    assertRunPassed(wrapperFalseGreen, "wrapper false-green fixture", { requiredStdoutIncludes: "AHK_TERMINAL_SUCCESS" });
  } catch {
    wrapperRejected = true;
  }
  assert(wrapperRejected, `wrapper that swallowed inner exit 9 was accepted as terminal success\n${output(wrapperFalseGreen)}`);

  const spawnError = await invokeCommand("definitely-not-agent-handoff-kit-command", [], noUpdateEnv, { timeoutMs: 10_000 });
  assert(spawnError.errorType === "spawn-error", `spawn/transport error was not classified distinctly\n${output(spawnError)}`);
  assertRunFailed(spawnError, "spawn error fixture");

  const retryPlan = closeoutRetryPlan([
    gate("root identity", "passed", "root-a"),
    gate("tool identity", "passed", "tool-a"),
    gate("task QA", "passed", "qa-a"),
    gate("prompt mirror", "indeterminate", "mirror-a"),
    gate("closeout-status", "required", "closeout-a")
  ], {
    "root identity": "root-a",
    "tool identity": "tool-a",
    "task QA": "qa-a"
  });
  assert(JSON.stringify(retryPlan) === JSON.stringify(["prompt mirror", "closeout-status"]), `identity-stable retry plan reran already-passed gates: ${retryPlan.join(", ")}`);

  console.log("GREEN PASSED: full closeout is write-minimal, delegates its single fresh doctor read-back to closeout-status, whose doctor made zero registry lookups; ordinary doctor made one lookup and retained version alignment; NO_UPDATE_CHECK suppressed lookups for init, doctor, and closeout-status.");
  console.log("SAFETY CONFIRMED: doctor, mirror, handoff, timeout, wrapper, spawn-error, different-cwd, and retry-scope failures remained nonzero or indeterminate and never produced handoff saved.");
} finally {
  registry.close();
  rmSync(fixtureRoot, { recursive: true, force: true });
}

function cleanEnvironment(overrides) {
  const env = { ...process.env, ...overrides, CI: "", npm_lifecycle_event: "" };
  delete env.AGENT_HANDOFF_KIT_NO_UPDATE_CHECK;
  delete env.AGENT_HANDOFF_KIT_UPDATE_CHECK_FORCE;
  delete env.AGENT_HANDOFF_KIT_UPDATE_MOCK_LATEST;
  return env;
}

function invoke(args, env, options = {}) {
  return invokeCommand(process.execPath, args, env, options);
}

function invokeCommand(command, args, env, options = {}) {
  return invokeAsync(command, args, options.label ?? args.join(" "), {
    cwd: options.cwd ?? sourceRoot,
    env,
    timeoutMs: options.timeoutMs ?? 120_000,
    killGraceMs: options.killGraceMs,
    settleGraceMs: options.settleGraceMs
  });
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}/latest`);
    });
  });
}

function closeoutReadyHandoff(text) {
  return text
    .replace("Last Updated: TBD", "Last Updated: 2026-07-16 12:00:00 +01:00")
    .replaceAll("<absolute project root>", fixtureRoot)
    .replaceAll("TBD", "closeout efficiency fixture")
    .replace("Answer: closeout efficiency fixture", "Answer: yes")
    .replace(/^Reconstruction evidence:.*$/m, "Reconstruction evidence: Task Understanding defines this standalone fixture; Active Objective and Next Priorities carry the resume boundary; Next Task Required Reading carries the source coverage.")
    .replace("1. closeout efficiency fixture", "1. Completed isolated closeout evidence and read-back.")
    .replace("1. closeout efficiency fixture", "1. follow-up scope — monitor only if a new reproducible failure occurs.")
    .replace("1. closeout efficiency fixture", "1. none")
    .replace("- Checks run this session: closeout efficiency fixture", "- Checks run this session: isolated closeout state and read-back passed.")
    .replace("- Checks not run and why: closeout efficiency fixture", "- Checks not run and why: none.")
    .replace("Recommended next step: closeout efficiency fixture — reason: closeout efficiency fixture", "Recommended next step: Resume from the opening message — reason: this fixture verifies resumable continuity.")
    .replace("- Stale snapshots left in this handoff: closeout efficiency fixture", "- Stale snapshots left in this handoff: no")
    .replace("- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: closeout efficiency fixture", "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: yes")
    .replace("- Recommended next step is explicit and reasoned: closeout efficiency fixture", "- Recommended next step is explicit and reasoned: yes — action and reason are recorded.")
    .replace("- Opening message matches current state: closeout efficiency fixture", "- Opening message matches current state: yes")
    .replace("- Next AI can continue from `AGENTS.md`, this handoff, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history: closeout efficiency fixture", "- Next AI can continue from `AGENTS.md`, this handoff, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history: yes")
    .replace("Git root: closeout efficiency fixture", "Git root: no Git repository (fixture root)")
    .replace("Branch: closeout efficiency fixture", "Branch: not_applicable - no Git repository")
    .replace("Commit: closeout efficiency fixture", "Commit: not_applicable - no Git repository")
    .replace("Worktree / parallel workspace status: closeout efficiency fixture", "Worktree / parallel workspace status: not_applicable - no Git repository")
    .replace("Uncommitted changes summary: closeout efficiency fixture", "Uncommitted changes summary: not_applicable - no Git repository")
    .replace(/- Closeout outcome:[^\r\n]*/, "- Closeout outcome: complete — all required writes, read-backs, and project-required persistence are complete.")
    .replace(/- Project-required persistence:[^\r\n]*/, "- Project-required persistence: not_required — this fixture has no project-required Git persistence.");
}

function writeFixtureHandoff(text) {
  writeFileSync(path.join(fixtureRoot, "dev", "SESSION_HANDOFF.md"), text, "utf8");
  writeFileSync(path.join(fixtureRoot, "START_NEXT_SESSION_PROMPT.txt"), `${extractOpeningMessage(text)}\n`, "utf8");
}

function extractColdZoneRoute(handoffText) {
  const match = handoffText.match(/Cold-zone retention and trace\/archive handling are owned by `([^`]+)`/);
  if (!match) throw new Error("handoff does not declare a cold-zone owner route");
  return match[1];
}

function readAt(base, relative) {
  return readFileSync(path.join(base, relative), "utf8");
}

function output(result) {
  return describeResult(result);
}

function gate(name, state, identity) {
  return { name, state, identity };
}

function closeoutRetryPlan(gates, unchangedIdentities) {
  const firstUnfinished = gates.findIndex((item) => item.state !== "passed" || unchangedIdentities[item.name] !== undefined && unchangedIdentities[item.name] !== item.identity);
  if (firstUnfinished < 0) return [];
  return gates.slice(firstUnfinished).map((item) => item.name);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function freshRulePackBytes(source) {
  return Buffer.from(source.toString("utf8").replace(/\r\n?/gu, "\n"), "utf8");
}

function assertFreshRulePackBytes(actual, source, message) {
  assert(actual.equals(freshRulePackBytes(source)), message);
}

function assertFreshRulePackRejects(actual, source, label) {
  let rejected = false;
  try {
    assertFreshRulePackBytes(actual, source, label);
  } catch {
    rejected = true;
  }
  assert(rejected, `${label}: fresh rule-pack comparison accepted a changed actual target`);
}

function assertFreshRulePackRendererCases() {
  const expected = Buffer.from("one\ntwo\n", "utf8");
  for (const source of ["one\ntwo\n", "one\r\ntwo\r\n", "one\rtwo\r"]) {
    assertFreshRulePackBytes(expected, Buffer.from(source, "utf8"), "fresh rule-pack renderer did not canonicalize source newlines to LF");
  }
  for (const actual of ["One\ntwo\n", "one\ntwo", "one \ntwo\n", "one\ntwo\nextra\n", "one\r\ntwo\r\n"]) {
    assertFreshRulePackRejects(Buffer.from(actual, "utf8"), Buffer.from("one\r\ntwo\r\n", "utf8"), "fresh rule-pack exact-byte counterexample");
  }
}
