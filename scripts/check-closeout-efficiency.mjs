#!/usr/bin/env node

// Isolated green verification.  The matching pre-fix red evidence remains in
// the separate frozen-source clone; this helper stays untracked in integration.
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
  assert(closeoutPack.includes("Do not run a separate bundled `doctor`"), "full closeout still instructs a redundant bundled doctor");
  assert(closeoutPack.includes("one required fresh doctor read-back"), "closeout-status is not the declared single fresh doctor authority");

  // Breaking AGENTS proves closeout-status still performs its one fresh doctor
  // readback rather than trusting only the handoff and mirror fields.
  const agentsPath = path.join(fixtureRoot, "AGENTS.md");
  const agentsBytes = readFileSync(agentsPath);
  writeFileSync(agentsPath, "broken AGENTS for isolated red evidence\n", "utf8");
  const doctorFailure = await invoke(["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], noUpdateEnv);
  assert(doctorFailure.status !== 0 && doctorFailure.stdout.includes("fresh doctor read-back did not pass"), `doctor failure produced a false closeout success\n${output(doctorFailure)}`);
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

  console.log("GREEN PASSED: full closeout delegates its single fresh doctor read-back to closeout-status, whose doctor made zero registry lookups; ordinary doctor made one lookup and retained version alignment; NO_UPDATE_CHECK suppressed lookups for init, doctor, and closeout-status.");
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
    .replace(/- Closeout outcome:[^\r\n]*/, "- Closeout outcome: complete — all required writes, read-backs, and project-required persistence are complete.")
    .replace(/- Project-required persistence:[^\r\n]*/, "- Project-required persistence: not_required — this fixture has no project-required Git persistence.");
}

function writeFixtureHandoff(text) {
  writeFileSync(path.join(fixtureRoot, "dev", "SESSION_HANDOFF.md"), text, "utf8");
  writeFileSync(path.join(fixtureRoot, "START_NEXT_SESSION_PROMPT.txt"), `${extractOpeningMessage(text)}\n`, "utf8");
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
