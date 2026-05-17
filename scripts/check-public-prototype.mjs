#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const tempRoot = path.join(tmpdir(), `ack-prototype-check-${Date.now()}`);

const forbiddenPatterns = [
  { label: "opening-message end marker drift", pattern: /end marker after it/i },
  { label: "external API safety routed to coding pack", pattern: /external api safety\s*\|\s*coding pack/i },
  { label: "old external API SDK safety mapping", pattern: /External API \/ SDK safety\s*\|\s*Split to coding pack/i },
  { label: "local absolute path leak", pattern: /C:\\Users\\adam/i },
  { label: "local workspace name leak", pattern: /_claude_desktop|ai-session-governance_v2_WORK/i },
  { label: "private WORK repo leak", pattern: /agent-handoff-kit_WORK/i },
  { label: "WORK session title leak", pattern: /Session Handoff — v2 WORK/i },
  { label: "common secret assignment", pattern: /(?:SECRET|TOKEN|PASSWORD|API_KEY)\s*[:=]|BEGIN .*PRIVATE/i }
];

const ignoredDirs = new Set([".git", "node_modules", "coverage", "dist"]);
const ignoredFiles = new Set(["package-lock.json"]);

main();

function main() {
  mkdirSync(tempRoot, { recursive: true });

  run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", tempRoot], "install templates");
  const doctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", tempRoot], "doctor installed templates");
  assert(doctor.stdout.includes("status: passed"), "doctor output did not include status: passed");
  assert(!existsSync(path.join(tempRoot, "archive")), "installer created archive directory by default");

  const pack = runNpm(["pack", "--dry-run"], "npm package dry-run");
  assert(outputText(pack).includes("total files: 20"), "npm dry-run did not report expected 20 package files");
  assert(!existsSync(path.join(root, "agent-handoff-kit-0.1.0.tgz")), "npm dry-run left a tarball behind");

  const hits = scanForbiddenText(root);
  assert(hits.length === 0, formatHits(hits));

  console.log("");
  console.log("Agent Handoff Kit prototype QA passed");
  console.log(`temp install root: ${tempRoot}`);
}

function run(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8"
  });

  if (result.error || result.status !== 0) {
    throw new Error(`${label} failed\n${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  }

  console.log(`ok: ${label}`);
  return result;
}

function outputText(result) {
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

function runNpm(args, label) {
  if (process.env.npm_execpath) {
    return run(process.execPath, [process.env.npm_execpath, ...args], label);
  }
  return run(process.platform === "win32" ? "npm.cmd" : "npm", args, label);
}

function scanForbiddenText(startDir) {
  const hits = [];
  for (const filePath of walk(startDir)) {
    const relative = path.relative(root, filePath).replaceAll(path.sep, "/");
    if (ignoredFiles.has(relative)) continue;
    if (relative === "scripts/check-public-prototype.mjs") continue;
    const text = readFileSync(filePath, "utf8");
    for (const rule of forbiddenPatterns) {
      if (rule.pattern.test(text)) hits.push({ file: relative, label: rule.label });
    }
  }
  return hits;
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
      continue;
    }
    if (entry.isFile() && isTextCandidate(fullPath)) yield fullPath;
  }
}

function isTextCandidate(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if ([".md", ".json", ".mjs", ".js", ".txt", ".html", ".gitignore"].includes(ext)) return true;
  return statSync(filePath).size < 1024 * 1024;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function formatHits(hits) {
  return [
    "forbidden source text found:",
    ...hits.map((hit) => `- ${hit.file}: ${hit.label}`)
  ].join("\n");
}
