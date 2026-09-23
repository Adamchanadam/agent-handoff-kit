#!/usr/bin/env node

// Direct contract regression for the two real plain-"開工" runaway traces.
// This checks the executable startup surfaces themselves; it does not pretend
// that a text search can measure every external AI runtime.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractOpeningMessage } from "../bin/prompt-mirror-core.mjs";
import { materializeProjectIndexTemplateVersion, parseProjectIndexTemplateVersion } from "../bin/upgrade-inventory.mjs";

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
  assert(surface.includes("the display-only current-thread naming checkpoint when safely supported"), "startup surface does not route the required display-only naming checkpoint");
  assert(surface.includes("project-file writes, network access, other external actions"), "plain startup does not deny writes/network/external actions after title update");
  for (const prohibited of ["at most one bounded", "one permitted bounded", "begin its first safe action in this response"]) {
    assert(!surface.includes(prohibited), `obsolete plain-start authority remains: ${prohibited}`);
  }
}
assert(core.includes("sub-agents, QA, packaging, project-file writes, network access"), "plain startup does not name the heavy operations it must not start");
assertNamingCheckpoint(core);
// Mutation checks reject the omissions that allowed a no-call startup to pass.
// These inspect the prompt contract only; independent consumer replay and real
// host tool/readback evidence are still needed to establish agent behavior.
for (const phrase of [
  "not an optional task",
  "before emitting the final startup card or beginning any same-message authorized task work",
  "use the project name alone",
  "call it directly",
  "successful tool result confirms the title",
  "Only a verified mismatch permits one safe corrective call",
  "On a later user-authorized turn"
]) {
  let rejected = false;
  try { assertNamingCheckpoint(core.replace(phrase, "")); } catch { rejected = true; }
  assert(rejected, `naming contract mutation was accepted: ${phrase}`);
}
assert(!core.includes("one optional display-only current-thread title update"), "optional rename wording returned");
assert(!core.includes("If the loaded facts do not provide both a concrete project name and a concrete primary action, skip the title update"), "completed objectives can still suppress project naming");
assert(core.includes("A direct ordinary task begins without a startup card"), "ordinary direct tasks were accidentally put behind startup ceremony");
assert(core.includes("Render the startup card in a fenced `text` block and preserve spacing"), "startup card can still be rendered outside a fenced text block");
assert(core.includes("the startup card may read only the bounded version evidence from `dev/PROJECT_INDEX.md`"), "bare startup version read is not bounded to display-only evidence");
assert(core.includes("unique stable-semver `| Agent Handoff Kit template version | X.Y.Z | ... |` row inside the unique real `## Stack` section"), "bare startup version source is not the unique Stack row");
assert(core.includes("Do not route on, summarize, or load any other Project Index content"), "bare startup can still route on Project Index content beyond the version row");
assert(core.includes("Missing, unreadable, malformed, duplicate, prerelease, or out-of-Stack-only version evidence prints `version unverified`"), "invalid startup version evidence does not fall back to unverified");
assert(core.includes("A direct ordinary or stateless task does not read the handoff or Project Index merely to fill a card or version"), "direct tasks can still pre-read handoff/index for version display");
assert(!handoff.includes("Agent Handoff Kit template version"), "handoff became a duplicate template-version source");
assert(!prompt.includes("Agent Handoff Kit template version"), "startup prompt became a duplicate template-version source");
assert(onboarding.includes("A plain startup normally stops after its status card and recommended next action"), "onboarding lost the ordinary bare-startup stop");
assert(onboarding.includes("First-use eligible plain startup is the exception") && onboarding.includes("enter onboarding instead of ending status-only"), "fresh install can still skip first-use onboarding");
assert(onboarding.includes("A same-message concrete task may begin normally"), "onboarding does not preserve the explicit-task control path");
assert(parseProjectIndexTemplateVersion(projectIndex("0.3.52")) === "0.3.52", "shared parser rejects the valid Stack version row");
assert(parseProjectIndexTemplateVersion(`# Project Index\n\n${projectIndex("0.3.52")}\n\n| Agent Handoff Kit template version | 9.9.9 | spoof |\n`) === "0.3.52", "shared parser accepted or was confused by an out-of-Stack spoof when Stack was valid");
assert(parseProjectIndexTemplateVersion(`${projectIndex("0.3.52")}\n\n\`\`\`md\n## Stack\n| Agent Handoff Kit template version | 9.9.9 | example |\n\`\`\`\n`) === "0.3.52", "shared parser counted a fenced out-of-Stack H2/version example as real structure");
const commentOnlyProjectIndex = "# Project Index\n\n<!--\n## Stack\n| Agent Handoff Kit template version | 9.9.9 | hidden |\n-->\n";
assert(parseProjectIndexTemplateVersion(commentOnlyProjectIndex) === null, "shared parser accepted a comment-only Stack/version spoof");
assert(materializeProjectIndexTemplateVersion(commentOnlyProjectIndex, "0.3.52") === commentOnlyProjectIndex, "materializer changed a comment-only Stack/version spoof");
assert(parseProjectIndexTemplateVersion(`${projectIndex("0.3.52")}\n\n<!--\n## Stack\n| Agent Handoff Kit template version | 9.9.9 | hidden |\n-->\n`) === "0.3.52", "shared parser counted a commented duplicate Stack as real structure");
assert(parseProjectIndexTemplateVersion("# Project Index\n\n| Agent Handoff Kit template version | 0.3.52 | spoof |\n") === null, "shared parser accepted an out-of-Stack-only spoof");
assert(parseProjectIndexTemplateVersion(projectIndex("0.3.52-alpha.1")) === null, "shared parser accepted a prerelease version");
assert(parseProjectIndexTemplateVersion(projectIndex("03.3.52")) === null, "shared parser accepted malformed semver");
assert(parseProjectIndexTemplateVersion(projectIndex("0.3.52", "| Agent Handoff Kit template version | 0.3.53 | duplicate |")) === null, "shared parser accepted duplicate Stack version rows");
assert(parseProjectIndexTemplateVersion(projectIndex("0.3.52", "~~~md\n| Agent Handoff Kit template version | 0.3.53 | fenced duplicate |\n~~~")) === "0.3.52", "shared parser counted a fenced duplicate row inside the real Stack section");
assert(parseProjectIndexTemplateVersion(projectIndex("0.3.52", "<!--\n| Agent Handoff Kit template version | 0.3.53 | commented duplicate |\n-->")) === "0.3.52", "shared parser counted a commented duplicate row inside the real Stack section");
assert(parseProjectIndexTemplateVersion(`${projectIndex("0.3.52")}\n\n## Stack\n\n| Agent Handoff Kit template version | 0.3.53 | duplicate section |\n`) === null, "shared parser accepted duplicate Stack sections");
for (const hidden of [
  "# Project Index\n\n````md\n## Stack\n| Agent Handoff Kit template version | 9.9.9 | hidden |\n```\n",
  "# Project Index\n\n````md\n## Stack\n| Agent Handoff Kit template version | 9.9.9 | hidden |\n```` trailing text\n",
  "# Project Index\n\n~~~~md\n## Stack\n| Agent Handoff Kit template version | 9.9.9 | hidden |\n~~~\n"
]) {
  assert(parseProjectIndexTemplateVersion(hidden) === null, "shared parser exposed a version row hidden behind an unterminated long fence");
  assert(materializeProjectIndexTemplateVersion(hidden, "0.3.52") === hidden, "materializer changed a version row hidden behind an unterminated long fence");
}
const validAfterClosedFence = "````md\n## Stack\n| Agent Handoff Kit template version | 9.9.9 | hidden |\n````\n\n" + projectIndex("0.3.52");
assert(parseProjectIndexTemplateVersion(validAfterClosedFence) === "0.3.52", "shared parser failed to resume after a valid long-fence close");
assert(parseProjectIndexTemplateVersion(materializeProjectIndexTemplateVersion(validAfterClosedFence, "0.3.53")) === "0.3.53", "materializer failed to update the real Stack row after a valid long-fence close");

console.log("ok: plain continuity startup resolves its naming checkpoint and stops; explicit continuation and ordinary tasks retain their work paths");
console.log("ok: naming contract rejects seven missing-checkpoint mutations; host behavior requires separate consumer/tool evidence");
console.log("ok: bare startup version display uses only the shared Stack-row parser and falls back to version unverified without adding duplicate sources");

function assertNamingCheckpoint(text) {
  for (const phrase of [
    "### Current-thread naming checkpoint",
    "safe current-thread title control",
    "not an optional task",
    "before emitting the final startup card or beginning any same-message authorized task work",
    "Do not defer the tool call until after the final response",
    "If interrupted before the checkpoint resolves",
    "do not schedule a background rename",
    "the concrete current user task first, then an unresolved current objective",
    "Do not revive a completed child task",
    "use the project name alone",
    "If the project name is unknown, skip without guessing or extra source reads",
    "call it directly",
    "bounded runtime tool-discovery mechanism once",
    "narrow title/rename/current-thread query",
    "not required when the tool safely targets the calling/current thread",
    "keep an informative title",
    "preserve an explicitly user-chosen title",
    "require a verified current-thread identifier",
    "Do not list or inspect unrelated threads solely for naming",
    "do not create, fork, navigate, message, archive, pin",
    "successful tool result confirms the title",
    "kept (relevant or user-chosen title)",
    "unavailable (no safe capability)",
    "skipped (project unknown)",
    "failed/unverified (error or no confirmation)",
    "ambiguous write requires readback before any retry",
    "Only a verified mismatch permits one safe corrective call",
    "never loop or overwrite a later user rename",
    "Do not assume a universal timing window or automatic-title overwrite",
    "An unavailable capability does not block startup; skip silently",
    "brief startup warning, not a success claim",
    "On a later user-authorized turn",
    "do not rename for tests, reviews or small substeps",
    "Titles must not contain progress, completion, status, task/session IDs, absolute paths, secrets or unverified facts",
    "display-only; it is not project state, permission, progress, completion evidence, a health result, or a source of truth",
    "does not authorize project/file writes, network research, external task work, extra startup reads or continuation beyond the startup boundary"
  ]) assert(text.includes(phrase), `naming checkpoint missing: ${phrase}`);
}

function read(relative) {
  return readFileSync(path.join(root, relative), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function projectIndex(version, extraStackRow = "") {
  return [
    "# Project Index",
    "",
    "## Stack",
    "",
    "| Field | Value | Last verified |",
    "|---|---|---|",
    `| Agent Handoff Kit template version | ${version} | current template version |`,
    extraStackRow,
    "",
    "## Directory Map",
    "",
    "| Path | Role | Read when |",
    "|---|---|---|"
  ].filter((line) => line !== "").join("\n");
}
