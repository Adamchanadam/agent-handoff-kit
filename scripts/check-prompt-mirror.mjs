#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { assessPromptMirrorRoot, assessPromptMirrorTexts } from "../bin/prompt-mirror-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.resolve(__dirname, "..");
const targetRoot = resolveTargetRoot();

const result = assessTarget(targetRoot);

console.log(`root: ${targetRoot}`);
console.log(`prompt mirror status: ${result.status}`);
if (result.reason) console.log(`reason: ${result.reason}`);

if (result.status === "mismatch" && result.firstDiff) {
  console.log(`first diff line: ${result.firstDiff.line}`);
  console.log(`handoff: ${result.firstDiff.handoff}`);
  console.log(`prompt : ${result.firstDiff.prompt}`);
}

if (!result.ok) process.exitCode = 1;

function resolveTargetRoot() {
  const rootIndex = process.argv.indexOf("--root");
  if (rootIndex >= 0) {
    const value = process.argv[rootIndex + 1];
    if (!value) {
      console.error("--root requires a path");
      process.exit(1);
    }
    return path.resolve(value);
  }
  return sourceRoot;
}

function assessTarget(root) {
  if (root === sourceRoot) {
    const handoffText = readFileSync(path.join(sourceRoot, "runtime-core", "SESSION_HANDOFF.md"), "utf8");
    const promptText = readFileSync(path.join(sourceRoot, "runtime-core", "START_NEXT_SESSION_PROMPT.txt"), "utf8");
    const otherTexts = [
      "AGENTS.core.md",
      "CLAUDE.md",
      "GEMINI.md",
      "SESSION_LOG.md",
      "PROJECT_INDEX.md",
      "DOC_SYNC_REGISTRY.md",
      "RULE_PACKS.md",
      "PROJECT_DECISIONS.md"
    ].map((name) => ({ relative: `runtime-core/${name}`, text: readFileSync(path.join(sourceRoot, "runtime-core", name), "utf8") }));
    return assessPromptMirrorTexts(handoffText, promptText, otherTexts);
  }
  return assessPromptMirrorRoot(root);
}
