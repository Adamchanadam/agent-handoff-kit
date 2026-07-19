#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractOpeningMessage } from "../bin/prompt-mirror-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = mkdtempSync(path.join(tmpdir(), "ack-closeout-card-"));
const env = { ...process.env, AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "1" };

try {
  const packageJson = JSON.parse(readAt(root, "package.json"));
  const version = packageJson.version;
  invoke(["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", fixtureRoot], "closeout-card fixture init");

  const handoffPath = path.join(fixtureRoot, "dev", "SESSION_HANDOFF.md");
  const initial = readFileSync(handoffPath, "utf8");
  assert(initial.includes("ack:field:closeout-outcome"), "installed handoff missing closeout outcome field");
  assert(initial.includes("ack:field:project-required-persistence"), "installed handoff missing project-required persistence field");

  const complete = closeoutReadyHandoff(initial);
  writeFixtureHandoff(complete);
  const passed = invoke(["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], "complete closeout card");
  assert(passed.stdout.includes(`Agent Handoff Kit v${version}`), "complete closeout card omitted verified version");
  assert(passed.stdout.includes("handoff saved"), "complete closeout card omitted success state");
  assert(passed.stdout.includes("status: complete"), "complete closeout card omitted machine-readable complete state");
  assert(!passed.stdout.includes("handoff blocked"), "complete closeout card showed a blocked state");

  const blocked = complete.replace(
    /- Project-required persistence:[^\r\n]*/,
    "- Project-required persistence: blocked — project policy requires a Git push that is not authorized."
  );
  writeFixtureHandoff(blocked);
  const rejected = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", "closeout-status", "--root", fixtureRoot], { cwd: root, encoding: "utf8", env });
  assert(!rejected.error && rejected.status !== 0, "blocked project-required persistence produced a successful closeout card");
  assert(rejected.stdout.includes("handoff blocked"), "blocked closeout card did not identify the blocked state");
  assert(rejected.stdout.includes("status: blocked"), "blocked closeout card omitted machine-readable blocked state");
  assert(
    rejected.stdout.includes("這不是失敗；只是還有事未保存、未提交、未驗證或需要處理"),
    "blocked closeout card omitted the human next-step explanation"
  );
  assert(!rejected.stdout.includes("handoff saved"), "blocked closeout card falsely claimed handoff saved");

  console.log("ok: closeout card is bound to persistence outcome");
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

function closeoutReadyHandoff(text) {
  return text
    .replace("Last Updated: TBD", "Last Updated: 2026-07-16 12:00:00 +01:00")
    .replaceAll("<absolute project root>", fixtureRoot)
    .replaceAll("TBD", "closeout fixture")
    .replace("1. closeout fixture", "1. Completed fixture closeout and read-back.")
    .replace("1. closeout fixture", "1. follow-up scope — monitor only if a new reproducible failure occurs.")
    .replace("1. closeout fixture", "1. none")
    .replace("- Checks run this session: closeout fixture", "- Checks run this session: fixture closeout state and read-back passed.")
    .replace("- Checks not run and why: closeout fixture", "- Checks not run and why: none.")
    .replace("Recommended next step: closeout fixture — reason: closeout fixture", "Recommended next step: Resume from the opening message — reason: this fixture verifies resumable continuity.")
    .replace("- Stale snapshots left in this handoff: closeout fixture", "- Stale snapshots left in this handoff: no")
    .replace("- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: closeout fixture", "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: yes")
    .replace("- Recommended next step is explicit and reasoned: closeout fixture", "- Recommended next step is explicit and reasoned: yes — action and reason are recorded.")
    .replace("- Opening message matches current state: closeout fixture", "- Opening message matches current state: yes")
    .replace("- Next AI can continue from `AGENTS.md`, this handoff, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history: closeout fixture", "- Next AI can continue from `AGENTS.md`, this handoff, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history: yes")
    .replace(/- Closeout outcome:[^\r\n]*/, "- Closeout outcome: complete — all required writes, read-backs, and project-required persistence are complete.")
    .replace(/- Project-required persistence:[^\r\n]*/, "- Project-required persistence: not_required — this fixture has no project-required Git persistence.");
}

function writeFixtureHandoff(text) {
  writeFileSync(path.join(fixtureRoot, "dev", "SESSION_HANDOFF.md"), text, "utf8");
  writeFileSync(path.join(fixtureRoot, "START_NEXT_SESSION_PROMPT.txt"), `${extractOpeningMessage(text)}\n`, "utf8");
}

function invoke(args, label) {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", env });
  if (result.error || result.status !== 0) throw new Error(`${label} failed\n${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  return result;
}

function readAt(base, relative) {
  return readFileSync(path.join(base, relative), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
