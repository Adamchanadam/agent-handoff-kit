#!/usr/bin/env node

// Direct contract regression for the two real plain-"開工" runaway traces.
// This checks the executable startup surfaces themselves; it does not pretend
// that a text search can measure every external AI runtime.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractOpeningMessage } from "../bin/prompt-mirror-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const core = read("runtime-core/AGENTS.core.md");
const handoff = read("runtime-core/SESSION_HANDOFF.md");
const prompt = read("runtime-core/START_NEXT_SESSION_PROMPT.txt");
const onboarding = read("packs/onboarding.md");
const opening = extractOpeningMessage(handoff);

assert(opening && opening.trim() === prompt.trim(), "startup prompt is not the handoff's authoritative opening message");
for (const surface of [core, opening, prompt]) {
  assert(surface.includes("and then the end of the turn"), "plain startup can still continue work after its card");
  assert(surface.includes("It does not authorize task-specific reads"), "plain startup does not deny task-specific work");
  assert(surface.includes("A same-message task may begin normally"), "explicit same-message task no longer has a work path");
  assert(surface.includes("one optional display-only title update when safely supported"), "plain startup does not keep the title update presentation-only and optional");
  assert(surface.includes("project-file writes, network access, other external actions"), "plain startup does not deny writes/network/external actions after title update");
  for (const prohibited of ["at most one bounded", "one permitted bounded", "begin its first safe action in this response"]) {
    assert(!surface.includes(prohibited), `obsolete plain-start authority remains: ${prohibited}`);
  }
}
assert(core.includes("sub-agents, QA, packaging, project-file writes, network access"), "plain startup does not name the heavy operations it must not start");
assert(core.includes("current-title readback and title control"), "dynamic title rule does not require safe readback/control");
assert(core.includes("Replace only a generic or stale title"), "dynamic title rule can still churn informative titles");
assert(core.includes("Use `<project name>｜<primary action>` from facts already loaded for startup"), "dynamic title rule lost its concise derived format/source boundary");
assert(core.includes("Do not read `dev/PROJECT_INDEX.md`, files, network, or other state solely to name the title"), "dynamic title rule permits extra reads only for naming");
assert(core.includes("must not contain progress, completion, status, task/session IDs, absolute paths, secrets, or unverified facts"), "dynamic title rule can leak IDs/paths/status/secrets/unverified facts");
assert(core.includes("skip silently"), "unsupported title control is no longer a silent fallback");
assert(core.includes("display-only; it is not project state, permission, progress, completion evidence, a health result, or a source of truth"), "dynamic title rule became authority or evidence");
assert(core.includes("does not authorize project/file writes, network activity, external task work, or continuation beyond the startup boundary"), "dynamic title rule weakens the no-auto-execute boundary");
assert(core.includes("A direct ordinary task begins without a startup card"), "ordinary direct tasks were accidentally put behind startup ceremony");
assert(onboarding.includes("A plain startup stops after its status card and recommended next action"), "onboarding can still re-authorize a bare startup from loaded state");
assert(onboarding.includes("A same-message concrete task may begin normally"), "onboarding does not preserve the explicit-task control path");

console.log("ok: plain continuity startup is status-only with optional display-only title update; explicit continuation and ordinary direct tasks retain their normal work paths");
console.log("ok: dynamic title is concise, derived from already-loaded facts, silently skipped when unsupported, and never authority/evidence/progress");

function read(relative) {
  return readFileSync(path.join(root, relative), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
