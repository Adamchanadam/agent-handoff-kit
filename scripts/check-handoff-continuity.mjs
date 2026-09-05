#!/usr/bin/env node

// Mechanical lifecycle regression. This does not grade an AI's understanding.
// Run the separate blind-reader protocol in test-fixtures/continuity/README.md.
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { installedFileContracts } from "../bin/installed-file-contract.mjs";
import { canonicalizeOfficialText, loadOfficialOriginCatalog } from "../bin/official-origin-catalog.mjs";
import { assessPromptMirrorRoot, extractOpeningMessage } from "../bin/prompt-mirror-core.mjs";
import { createQaTempTracker } from "./qa-temp-cleanup.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...process.env, AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "1" };
const qaTemp = createQaTempTracker("handoff continuity QA");
const qaBase = process.env.AGENT_HANDOFF_KIT_QA_TMP || tmpdir();
const catalog = await loadOfficialOriginCatalog();
const historicalVersion = "0.3.64";
const currentVersion = JSON.parse(readAt(root, "package.json")).version;
let passed = false;
try {
  validateSemanticFixtureShape();
  assert(currentVersion !== historicalVersion, "continuity lifecycle needs a candidate newer than the historical fixture");
  const project = fresh("project");
  const gitProbe = spawnSync("git", ["-C", project, "rev-parse", "--show-toplevel"], { encoding: "utf8", env });
  assert(!gitProbe.error, `cannot verify isolated fixture Git boundary: ${gitProbe.error?.message}`);
  assert(gitProbe.status !== 0, "QA temporary root is inside a Git repository; set AGENT_HANDOFF_KIT_QA_TMP to a non-Git directory");
  const historicalCli = installHistorical(project);
  let handoff = readyHistoricalHandoff(readAt(project, "dev/SESSION_HANDOFF.md"), project);
  saveHandoff(project, handoff);
  writeAt(project, "docs/source.txt", "Revision 2\nSection 1: sample columns.\nSection 2: full-cohort retry exclusions; not yet reviewed.\n");
  invoke(historicalCli, ["closeout-status", "--root", project], "old installation can close out without reconstruction evidence");
  const oldUserSections = ["task-understanding-summary", "active-objective", "completed-this-session", "next-priorities", "next-task-required-reading", "validation-qc", "next-session-opening-message"];
  const oldSections = oldUserSections.map(id => [id, section(handoff, id)]);
  const beforeDryRun = snapshot(project);
  cli(["upgrade", "--dry-run", "--root", project], "old installation upgrade preview");
  assert(snapshot(project) === beforeDryRun, "upgrade preview wrote files");
  cli(["upgrade", "--yes", "--root", project], "old installation upgrade");
  handoff = readAt(project, "dev/SESSION_HANDOFF.md");
  for (const [id, before] of oldSections) assert(section(handoff, id) === before, `upgrade rewrote user-owned ${id}`);
  assert(readAt(project, "docs/source.txt").includes("not yet reviewed"), "upgrade lost ordinary source content");
  cli(["doctor", "--root", project], "upgraded old handoff remains healthy for migration");
  expectBlocked(project, handoff, "old yes without evidence", "sufficiency");

  // Simulate the agent's explicit closeout edit in existing current fields.
  // No automatic migration may invent these facts or the reconstruction claim.
  let repaired = replaceSection(handoff, "task-understanding-summary", "Task Understanding Summary", [
    "<!-- ack:field:user-intent -->", "- User intent: Prepare an internal retention comparison for all cohorts.",
    "<!-- ack:field:task-essence -->", "- Task essence: Continue the evidence-backed report after sample preparation.",
    "- User value: A reviewer can assess the complete cohort comparison.",
    "- Parent outcome / consumer: An internal retention report with retry exclusions and a reviewable evidence table.",
    "- Task position: Report -> cohort preparation -> sample normalization (finished); full-cohort reconciliation remains.",
    "<!-- ack:field:success-criteria -->", "- Success criteria: Cover every cohort, resolve exclusion rules and verify the evidence table before review.",
    "- Key background already read: docs/source.txt revision 2 section 1, relevant range read in the previous session.",
    "- Background still unread or blocked: Section 2 exclusion rules and full-cohort records have not been read.",
    "- Non-goals / boundaries: Internal draft only; no publishing and no invented exclusions."
  ].join("\n"));
  repaired = replaceSection(repaired, "active-objective", "Active Objective", "- Current step: Reconcile the full-cohort data.\n- Resume point: Read docs/source.txt revision 2 section 2 before applying retry exclusions; sample column normalization is already verified.\n- Remaining acceptance: Validate exclusions and all-cohort evidence before calling the parent report complete.");
  repaired = replaceSection(repaired, "next-task-required-reading", "Next Task Required Reading", "| Source | Why required | Status |\n|---|---|---|\n| docs/source.txt, revision 2, sections 1-2 | Exclusion decisions for the full-cohort report | Previous session read section 1 only; section 2 remains unread. Next agent must read section 2 and recheck section 1 before applying rules. |");
  repaired = repaired.replace("Answer: yes", "Answer: yes\nReconstruction evidence: Packet-only read-back recovered the report and reviewer from Task Understanding Summary, the finished sample child and full-cohort resume point from Active Objective, outstanding parent acceptance there, and the section 2 gap from Next Task Required Reading. Checked these against the original request and revision 2 source; the sample result does not finish the report.");
  for (const id of ["completed-this-session", "validation-qc", "next-session-opening-message"]) assert(section(repaired, id) === section(handoff, id), `closeout simulation changed cold section ${id}`);
  saveHandoff(project, repaired);
  assert(assessPromptMirrorRoot(project).ok, "repaired handoff mirror does not match");
  expectComplete(project, repaired, "reconstructed current task");
  expectComplete(project, repaired.replace(/\r?\n/g, "\r\n").replace("## Handoff Sufficiency Check", "## 交接自足核對"), "CRLF and localized section heading");

  const pending = replaceSection(repaired, "active-objective", "Active Objective", "- Current step: Full-cohort reconciliation is blocked pending the missing export.\n- Resume point: Request the complete cohort export; apply revision 2 exclusions only after its arrival. Sample normalization is already verified.\n- Remaining acceptance: All-cohort reconciliation and reviewable report evidence remain pending.");
  const blockedWork = replaceSection(replaceSection(pending, "risks-blockers", "Risks / Blockers", "1. Full-cohort export is unavailable; dependent reconciliation waits for that source. No report-completion claim is permitted."), "next-priorities", "Next Priorities", "Recommended next step: Request the missing cohort export — reason: it is the source needed for reconciliation.\n\n1. Obtain the export before dependent analysis.");
  expectComplete(project, blockedWork, "honestly blocked work can have a complete handoff");

  for (const [label, changed] of [
    ["negative answer", repaired.replace("Answer: yes", "Answer: no")],
    ["unknown answer", repaired.replace("Answer: yes", "Answer: unknown")],
    ["missing answer", repaired.replace("Answer: yes\n", "")],
    ["duplicate answer", repaired.replace("Answer: yes", "Answer: yes\nAnswer: yes")],
    ["missing evidence", repaired.replace(/^Reconstruction evidence:.*\n?/m, "")],
    ["placeholder evidence", repaired.replace(/^Reconstruction evidence:.*$/m, "Reconstruction evidence: TBD")],
    ["duplicate evidence", repaired.replace("Reconstruction evidence:", "Reconstruction evidence: Verified current fields.\nReconstruction evidence:")],
    ["contradictory continuation claim", repaired.replace(/(- Next AI can continue[^\n]*: )yes/, "$1no")],
    ["duplicate section marker", repaired.replace("<!-- ack:section:handoff-sufficiency-check -->", "<!-- ack:section:handoff-sufficiency-check -->\n<!-- ack:section:handoff-sufficiency-check -->")]
  ]) expectBlocked(project, changed, label, "sufficiency");
  saveHandoff(project, repaired);
  const beforeRepeat = snapshot(project);
  const repeated = cli(["upgrade", "--yes", "--root", project], "second upgrade");
  assert(repeated.stdout.includes("沒有檔案需要建立或合併"), "second upgrade was not a no-op");
  assert(snapshot(project) === beforeRepeat, "second upgrade changed the reconstructed handoff or another file");
  console.log("ok: genuine old init -> user handoff -> upgrade preservation -> evidence required -> explicit closeout repair -> complete -> no-op upgrade");
  console.log("ok: negative/duplicate/unknown sufficiency fails without writes; an explicit source blocker does not prevent an honest saved handoff");
  console.log("LIMIT: assertions verify lifecycle structure and preservation, not semantic truth; run the separate blind reconstruction protocol.");
  passed = true;
} finally {
  if (passed) qaTemp.cleanupOnSuccess();
  else qaTemp.reportRetained("continuity QA failed");
}

function readyHistoricalHandoff(text, project) {
  const opening = section(text, "next-session-opening-message");
  let result = (text.slice(0, text.length - opening.length).replaceAll("TBD", "not required for this fixture") + opening).replaceAll("<absolute project root>", project);
  result = result.replace("Last Updated: not required for this fixture", "Last Updated: 2026-09-01");
  result = replaceSection(result, "task-understanding-summary", "Task Understanding Summary", "<!-- ack:field:user-intent -->\n- User intent: Prepare an internal retention comparison for all cohorts.\n<!-- ack:field:task-essence -->\n- Task essence: Normalize sample columns before full-cohort reconciliation.\n- User value: A reviewable retention report.\n<!-- ack:field:success-criteria -->\n- Success criteria: All cohorts and retry exclusions must be validated.\n- Key background already read: docs/source.txt.\n- Background still unread or blocked: Full-cohort reconciliation remains.\n- Non-goals / boundaries: Do not publish.");
  result = replaceSection(result, "active-objective", "Active Objective", "Reconcile the full-cohort data after the verified sample preparation.");
  result = replaceSection(result, "completed-this-session", "Completed This Session", "1. Normalized and verified sample columns only.");
  result = replaceSection(result, "next-priorities", "Next Priorities", "Recommended next step: Read the exclusion rules — reason: the full-cohort comparison depends on them.\n\n1. Reconcile the full-cohort data after reading the rules.");
  result = replaceSection(result, "next-task-required-reading", "Next Task Required Reading", "| Source | Why required | Status |\n|---|---|---|\n| docs/source.txt | Exclusion rules for the report | read |");
  result = replaceSection(result, "risks-blockers", "Risks / Blockers", "1. No infrastructure blocker; unfinished full-cohort work is tracked in Active Objective.");
  result = replaceSection(result, "validation-qc", "Validation / QC", "- Checks run this session: Sample column normalization read-back passed.\n- Checks not run and why: Full-cohort reconciliation awaits the next task.\n- Handoff evidence location: This fictional fixture, Completed This Session.");
  result = replaceSection(result, "workspace-identity", "Workspace Identity", `Expected project root: ${project}\nGit root: no Git repository (isolated fixture)\nBranch: not_applicable - no Git repository\nCommit: not_applicable - no Git repository\nWorktree / parallel workspace status: not_applicable - no Git repository\nUncommitted changes summary: not_applicable - no Git repository`);
  return result.replace(/- Closeout outcome:[^\r\n]*/, "- Closeout outcome: complete — required local writes and read-backs are complete.")
    .replace(/- Project-required persistence:[^\r\n]*/, "- Project-required persistence: not_required — this fixture has no Git persistence requirement.")
    .replace(/- Stale snapshots left in this handoff:[^\r\n]*/, "- Stale snapshots left in this handoff: no")
    .replace(/(- (?:Completed \/ pending[^\r\n]*|Recommended next step is explicit and reasoned|Opening message matches current state|Next AI can continue[^\r\n]*):)[^\r\n]*/g, "$1 yes")
    .replace(/^Answer:.*$/m, "Answer: yes");
}

function installHistorical(project) {
  const manifest = JSON.parse(readAt(root, `test-fixtures/v${historicalVersion}/fixture-manifest.json`));
  const identity = manifest.source.npm;
  const catalogIdentity = catalog.releases[historicalVersion]?.source?.npm;
  assert(identity.integrity === catalogIdentity?.integrity && identity.shasum === catalogIdentity?.shasum, "historical fixture and catalog npm identities disagree");
  const cache = process.env.AGENT_HANDOFF_KIT_HISTORICAL_ARTIFACT_CACHE || (process.platform === "win32" ? "D:\\_temp\\agent-handoff-kit-historical-artifacts" : path.join(tmpdir(), "agent-handoff-kit-historical-artifacts"));
  mkdirSync(cache, { recursive: true });
  const tarball = path.join(cache, `adamchanadam-agent-handoff-kit-${historicalVersion}.tgz`);
  if (!existsSync(tarball)) {
    const npmCli = [process.env.npm_execpath, path.join(path.dirname(process.execPath), "node_modules/npm/bin/npm-cli.js")].find(item => item && existsSync(item));
    assert(npmCli, "cannot locate npm-cli.js for pinned historical artifact download");
    invoke(npmCli, ["pack", identity.spec, "--json", "--pack-destination", cache, "--ignore-scripts"], "download pinned historical artifact");
  }
  const artifact = readFileSync(tarball);
  assert(`sha512-${createHash("sha512").update(artifact).digest("base64")}` === identity.integrity, "historical artifact integrity mismatch");
  assert(createHash("sha1").update(artifact).digest("hex") === identity.shasum, "historical artifact shasum mismatch");
  const unpacked = fresh("artifact");
  const tar = gunzipSync(artifact);
  const entries = new Set();
  for (let offset = 0; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every(byte => byte === 0)) break;
    const value = bytes => bytes.toString("utf8").split("\0")[0];
    const name = value(header.subarray(0, 100));
    const prefix = value(header.subarray(345, 500));
    const relative = prefix ? `${prefix}/${name}` : name;
    const size = Number.parseInt(value(header.subarray(124, 136)).trim() || "0", 8);
    assert(Number.isSafeInteger(size) && size >= 0 && offset + 512 + size <= tar.length, "invalid historical tar size");
    const type = header[156];
    assert(type === 0 || type === 48 || type === 53, "historical artifact contains a non-regular entry");
    assert(relative.startsWith("package/") && !relative.includes("\\") && !relative.split("/").includes(".."), "historical artifact has unsafe path");
    if (type !== 53) {
      assert(!entries.has(relative), "historical artifact has duplicate entry");
      entries.add(relative);
      const destination = path.resolve(unpacked, relative);
      assert(destination.startsWith(`${unpacked}${path.sep}`), "historical artifact escapes fixture root");
      mkdirSync(path.dirname(destination), { recursive: true });
      writeFileSync(destination, tar.subarray(offset + 512, offset + 512 + size));
    }
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  assert(entries.size === identity.entryCount, "historical artifact entry count mismatch");
  const metadata = JSON.parse(readAt(unpacked, "package/package.json"));
  assert(metadata.name === "@adamchanadam/agent-handoff-kit" && metadata.version === historicalVersion, "historical package identity mismatch");
  const oldCli = path.join(unpacked, "package/bin/agent-handoff-kit.mjs");
  invoke(oldCli, ["init", "--yes", "--root", project], "authentic historical init");
  const generated = new Set(["START_NEXT_SESSION_PROMPT.txt", "dev/SESSION_HANDOFF.md", "dev/PROJECT_INDEX.md"]);
  for (const { targetRel } of installedFileContracts) {
    const record = manifest.installedTargets[targetRel];
    assert(record, `historical fixture omits ${targetRel}`);
    if (record.state === "absent") { assert(!existsSync(path.join(project, targetRel)), `historical init created ${targetRel}`); continue; }
    const bytes = readFileSync(path.join(project, targetRel));
    assert(sha(bytes) === record.rawSha256 || (generated.has(targetRel) && sha(canonicalizeOfficialText(targetRel, bytes.toString("utf8"))) === record.canonicalSha256), `historical init byte identity differs: ${targetRel}`);
  }
  return oldCli;
}

function validateSemanticFixtureShape() {
  const cases = JSON.parse(readAt(root, "test-fixtures/continuity/cases.json"));
  const oracle = JSON.parse(readAt(root, "test-fixtures/continuity/reviewer-oracle.json"));
  assert(cases.length === 5 && new Set(cases.map(item => item.id)).size === 5, "semantic case inventory must contain five unique cases");
  for (const item of cases) {
    assert(item.writerInput?.request && item.writerInput?.sources?.length && item.writerInput?.progress, `${item.id}: missing source task`);
    assert(oracle[item.id]?.required?.length && oracle[item.id]?.mustNot?.length, `${item.id}: missing withheld assessment rubric`);
  }
  console.log("ok: five reusable fictional source/rubric cases have valid structure (semantic outcomes not asserted)");
}
function section(text, id) {
  const marker = `<!-- ack:section:${id} -->`;
  const start = text.indexOf(marker);
  assert(start >= 0 && text.indexOf(marker, start + marker.length) < 0, `missing or duplicate fixture section ${id}`);
  const next = text.indexOf("<!-- ack:section:", start + marker.length);
  return text.slice(start, next < 0 ? text.length : next);
}
function replaceSection(text, id, heading, body) { return text.replace(section(text, id), `<!-- ack:section:${id} -->\n## ${heading}\n\n${body}\n\n`); }
function saveHandoff(project, text) { writeAt(project, "dev/SESSION_HANDOFF.md", text); writeAt(project, "START_NEXT_SESSION_PROMPT.txt", `${extractOpeningMessage(text)}\n`); }
function expectComplete(project, text, label) { saveHandoff(project, text); const before = snapshot(project); const result = cli(["closeout-status", "--root", project], label); assert(result.stdout.includes("status: complete"), `${label}: missing complete card`); assert(snapshot(project) === before, `${label}: read-only command changed files`); }
function expectBlocked(project, text, label, reason) { saveHandoff(project, text); const before = snapshot(project); const result = invoke(path.join(root, "bin/agent-handoff-kit.mjs"), ["closeout-status", "--root", project], label, false); assert(result.status !== 0 && result.stdout.includes("status: blocked") && !result.stdout.includes("handoff saved"), `${label}: falsely passed\n${result.stdout}`); assert(`${result.stdout}\n${result.stderr}`.toLowerCase().includes(reason), `${label}: omitted ${reason} reason\n${result.stdout}`); assert(snapshot(project) === before, `${label}: read-only rejection changed files`); }
function fresh(label) { mkdirSync(qaBase, { recursive: true }); return qaTemp.track(mkdtempSync(path.join(qaBase, `ack-continuity-${label}-`))); }
function readAt(base, relative) { return readFileSync(path.join(base, relative), "utf8"); }
function writeAt(base, relative, content) { const target = path.join(base, relative); mkdirSync(path.dirname(target), { recursive: true }); writeFileSync(target, content, "utf8"); }
function sha(value) { return createHash("sha256").update(value).digest("hex"); }
function snapshot(base) { const records = []; function visit(directory) { for (const item of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) { const target = path.join(directory, item.name); assert(!item.isSymbolicLink(), "unexpected link in isolated fixture"); if (item.isDirectory()) visit(target); else records.push([path.relative(base, target), sha(readFileSync(target))]); } } visit(base); return JSON.stringify(records); }
function cli(args, label) { return invoke(path.join(root, "bin/agent-handoff-kit.mjs"), args, label); }
function invoke(script, args, label, requireSuccess = true) { const result = spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: "utf8", env, timeout: 120000 }); assert(!result.error && (!requireSuccess || result.status === 0), `${label} failed\n${result.error?.message || ""}\n${result.stdout || ""}\n${result.stderr || ""}`); return result; }
function assert(condition, message) { if (!condition) throw new Error(message); }
