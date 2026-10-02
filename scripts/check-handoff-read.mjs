#!/usr/bin/env node
// Transport and contract regressions, not a grade of model understanding.
// Actual writer -> tool -> reader -> action cases live in continuity/README.md.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, statSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readHandoffChunk, formatHandoffChunk } from "../bin/handoff-read.mjs";
import { createQaTempTracker } from "./qa-temp-cleanup.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(sourceRoot, "bin/agent-handoff-kit.mjs");
const tracker = createQaTempTracker("handoff read QA");
const temp = tracker.track(mkdtempSync(path.join(process.env.AGENT_HANDOFF_KIT_QA_TMP || tmpdir(), "ack-handoff-read-")));
const project = path.join(temp, "project");
mkdirSync(path.join(project, "dev"), { recursive: true });
const file = path.join(project, "dev/SESSION_HANDOFF.md");
let passed = false;
try {
  const packet = "\uFEFF# Handoff\r\n" + "Long line: 混合 Unicode 🐈 e\u0301. ".repeat(900) + "\r\nMiddle: rejected plan R-17 must not be used.\r\n" + "preserved history\n".repeat(180) + "Tail: internal draft only; parent acceptance pending.\r\n";
  writeFileSync(file, packet);
  const initial = snapshot(project);
  const chunks = [];
  let offset = 0;
  let sha256;
  do {
    const chunk = readHandoffChunk(project, { offset, maxChars: 511, sha256 });
    assert.equal(chunk.offset, offset);
    assert.ok(Array.from(chunk.text).length <= 511);
    assert.equal(chunk.end - chunk.offset, Array.from(chunk.text).length);
    assert.equal(chunk.sha256, sha256 ?? digest(Buffer.from(packet)));
    chunks.push(formatHandoffChunk(chunk));
    sha256 = chunk.sha256;
    offset = chunk.nextOffset;
  } while (offset !== null);
  assert.equal(observedText(chunks), packet);
  assert.equal(snapshot(project), initial, "read sequence wrote project files");
  assert.throws(() => observedText([chunks[0], ...chunks.slice(2)]), /gap/);
  assert.throws(() => observedText([chunks[0], chunks[0], ...chunks.slice(1)]), /gap/);
  assert.throws(() => observedText([chunks[1], chunks[0], ...chunks.slice(2)]), /gap/);
  assert.throws(() => observedText(chunks.slice(0, -1)), /EOF/);
  assert.throws(() => observedText([chunks[0].slice(0, -80), ...chunks.slice(1)]), /footer/);
  const frame = parseFrame(chunks[2]);
  const clippedMiddle = chunks[2].replace(frame.body, frame.body.slice(0, 70) + "... tokens truncated ..." + frame.body.slice(-70));
  assert.throws(() => observedText([...chunks.slice(0, 2), clippedMiddle, ...chunks.slice(3)]), /body/);
  assert.throws(() => observedText([...chunks.slice(0, 2), chunks[2].replace(frame.header.sha256, "0".repeat(64)), ...chunks.slice(3)]), /snapshot|footer/);

  for (const opts of [{ offset: 1 }, { offset: -1 }, { offset: "1.5" }, { offset: "01" }, { maxChars: 63 }, { maxChars: 8193 }, { sha256: "fake" }, { offset: Array.from(packet).length, sha256 }]) {
    assert.throws(() => readHandoffChunk(project, opts));
  }
  writeFileSync(file, packet.replace("R-17", "R-18"));
  assert.throws(() => readHandoffChunk(project, { offset: 511, sha256 }), /snapshot changed/);
  writeFileSync(file, Buffer.from([0xc3, 0x28]));
  assert.throws(() => readHandoffChunk(project), /UTF-8/);
  writeFileSync(file, "");
  assert.equal(readHandoffChunk(project).total, 0); // Empty transport is not a sufficient task packet.
  writeFileSync(file, packet);
  mkdirSync(path.join(project, "dev/governance_migrations"));
  const lock = path.join(project, "dev/governance_migrations/.upgrade.lock");
  writeFileSync(lock, "fixture");
  const locked = snapshot(project);
  assert.throws(() => readHandoffChunk(project), /upgrade lock/);
  assert.equal(snapshot(project), locked);
  unlinkSync(lock);
  const outside = path.join(temp, "outside");
  mkdirSync(outside);
  writeFileSync(path.join(outside, "SESSION_HANDOFF.md"), "must not read this target");
  const linkedRoot = path.join(temp, "linked-root");
  mkdirSync(linkedRoot);
  symlinkSync(outside, path.join(linkedRoot, "dev"), process.platform === "win32" ? "junction" : "dir");
  assert.throws(() => readHandoffChunk(linkedRoot), /not a link/);
  const aliasRoot = path.join(temp, "root-alias");
  symlinkSync(project, aliasRoot, process.platform === "win32" ? "junction" : "dir");
  const aliased = readHandoffChunk(aliasRoot);
  assert.equal(aliased.requestedRoot, aliasRoot);
  assert.equal(aliased.root, realpathSync(project));
  assert.equal(aliased.sha256, sha256);
  const aliasParent = path.join(temp, "parent-alias");
  symlinkSync(temp, aliasParent, process.platform === "win32" ? "junction" : "dir");
  const parentAliased = readHandoffChunk(path.join(aliasParent, path.basename(project)));
  assert.equal(parentAliased.requestedRoot, path.join(aliasParent, path.basename(project)));
  assert.equal(parentAliased.root, realpathSync(project));
  assert.equal(parentAliased.sha256, sha256);
  assert.throws(() => readHandoffChunk(path.join(temp, "missing-root")), /ENOENT/);

  // Force the real update path on, intercept network, and prove the interceptor
  // detects a normal help update before testing every read-only command path.
  const preload = path.join(temp, "network-observer.cjs");
  writeFileSync(preload, 'globalThis.fetch = async () => { process.stderr.write("NETWORK_ATTEMPT\\n"); throw new Error("network disabled by test"); };');
  const env = { ...process.env, AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "", AGENT_HANDOFF_KIT_UPDATE_CHECK_FORCE: "1", AGENT_HANDOFF_KIT_UPDATE_MOCK_LATEST: "" };
  const invoke = args => spawnSync(process.execPath, ["--require", preload, cli, ...args], { encoding: "utf8", env, timeout: 10_000 });
  assert.match(invoke(["--help"]).stderr, /NETWORK_ATTEMPT/, "network observer did not exercise update path");
  const cliBefore = snapshot(project);
  for (const args of [
    ["--root", project, "--max-chars", "128"],
    ["--root", project, "--offset", "128", "--sha256", sha256, "--max-chars", "128"],
    ["--help"], ["--root", project, "--offset", "1"], ["--unknown"], ["--root"],
    ["--root", project, "--root", project], ["--max-chars"], ["--sha256"], ["--yes"], ["--manifest"]
  ]) {
    const result = invoke(["handoff-read", ...args]);
    assert.equal(result.error, undefined);
    assert.doesNotMatch(result.stderr + result.stdout, /NETWORK_ATTEMPT|continuity ready|handoff saved/);
    if (args.includes("--max-chars") && args.includes("128") || args.includes("--help")) assert.equal(result.status, 0, result.stderr);
    else { assert.notEqual(result.status, 0); assert.doesNotMatch(result.stdout, /AHK_HANDOFF_BEGIN/); }
  }
  writeFileSync(lock, "fixture");
  const denied = invoke(["handoff-read", "--root", project]);
  assert.notEqual(denied.status, 0);
  assert.equal(denied.stdout, "");
  assert.doesNotMatch(denied.stderr, /NETWORK_ATTEMPT/);
  unlinkSync(lock);
  assert.equal(snapshot(project), cliBefore);
  console.log("ok: bounded handoff transport preserves Unicode/BOM/CRLF/long lines, rejects drift/unsafe roots, and remains read-only/offline");
  console.log("ok: observed-output evaluator rejects missing/reordered/duplicate ranges, tail loss and middle truncation with an intact footer");
  console.log("LIMIT: served ranges and transcript coverage do not grade recovery or authorize task work; run the separate real-file consumer rehearsal");
  passed = true;
} finally {
  if (passed) tracker.cleanupOnSuccess(); else tracker.reportRetained("failed");
}

function digest(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function snapshot(root) {
  const files = [];
  const walk = dir => { for (const name of readdirSync(dir).sort()) { const file = path.join(dir, name); if (statSync(file).isDirectory()) walk(file); else files.push([path.relative(root, file), digest(readFileSync(file))]); } };
  walk(root); return JSON.stringify(files);
}
function parseFrame(text) {
  const firstBreak = text.indexOf("\n");
  assert.ok(text.startsWith("AHK_HANDOFF_BEGIN "), "missing header");
  const header = JSON.parse(text.slice("AHK_HANDOFF_BEGIN ".length, firstBreak));
  const footer = `\nAHK_HANDOFF_END ${header.sha256} ${header.offset}:${header.end}/${header.total}\n`;
  assert.ok(text.endsWith(footer), "missing/mismatched footer");
  const body = text.slice(firstBreak + 1, -footer.length);
  assert.equal(Array.from(body).length, header.end - header.offset, "body was omitted or clipped");
  return { header, body };
}
function observedText(frames) {
  let end = 0; let identity; let total; let text = "";
  for (const frame of frames) {
    const { header, body } = parseFrame(frame);
    const current = JSON.stringify([header.root, header.file, header.sha256, header.total]);
    assert.equal(current, identity ?? current, "mixed snapshot"); identity = current;
    assert.equal(header.offset, end, "gap, duplicate or out-of-order range");
    end = header.end; total = header.total; text += body;
  }
  assert.equal(end, total, "missing EOF");
  assert.equal(digest(Buffer.from(text)), JSON.parse(identity)[2], "body digest mismatch");
  return text;
}
