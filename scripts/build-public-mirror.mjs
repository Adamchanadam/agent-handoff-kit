#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertPublicMirrorRequiredSources, expectedPublicMirrorFileCount, PUBLIC_MIRROR_CONTRACT, RELEASE_PACKAGE_CONTRACT } from "./qa-assurance-manifest.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.resolve(__dirname, "..");

const args = parseArgs(process.argv.slice(2));
const outRoot = args.out
  ? path.resolve(args.out)
  : path.join(tmpdir(), `ack-public-mirror-${Date.now()}`);

const allowFiles = PUBLIC_MIRROR_CONTRACT.allowFiles;
const allowDirs = PUBLIC_MIRROR_CONTRACT.allowDirs;
const forbiddenPathSegments = new Set(PUBLIC_MIRROR_CONTRACT.forbiddenPathSegments);
const forbiddenFileNames = new Set(PUBLIC_MIRROR_CONTRACT.forbiddenFileNames);
const forbiddenText = [
  { label: "docs/qa path", pattern: /docs[\\/]qa/i },
  { label: "test fixture path", pattern: /test-fixtures/i },
  { label: "source scripts path", pattern: /scripts[\\/]/i },
  { label: "maintainer guide link", pattern: /MAINTAINERS\.md/i },
  { label: "full audit material", pattern: /full-audit/i },
  { label: "release-grade QA material", pattern: /release-grade-qa/i },
  { label: "release readiness script", pattern: /check-release-readiness/i },
  { label: "fixture generation script", pattern: /generate-upgrade-fixtures/i },
  { label: "local machine path", pattern: /C:\\Users\\adam|_claude_desktop|ai-session-governance_v2/i }
];

main();

function main() {
  assert(!existsSync(outRoot), `output path already exists; choose a new path: ${outRoot}`);
  assertPublicMirrorRequiredSources(sourceRoot);
  mkdirSync(outRoot, { recursive: true });

  for (const file of allowFiles) {
    const source = path.join(sourceRoot, file);
    if (existsSync(source)) copyFile(source, path.join(outRoot, file));
  }
  for (const dir of allowDirs) {
    const source = path.join(sourceRoot, dir);
    if (existsSync(source)) cpSync(source, path.join(outRoot, dir), { recursive: true });
  }

  transformReadme();
  transformPackageJson();
  checkMirrorShape();
  checkMirrorText();
  checkPackageJson();
  checkNpmDryRun();
  checkCliAndUserFlow();
  checkTarballInstall();

  console.log("");
  console.log("Agent Handoff Kit public mirror QA passed");
  console.log(`public mirror: ${outRoot}`);
}

function transformReadme() {
  const readmePath = path.join(outRoot, "README.md");
  const text = readFileSync(readmePath, "utf8");
  const before = /repo 內的 `scripts\/`、`test-fixtures\/`、`docs\/qa\/` 和部分設計文件，是維護者用來測試升級、安全合併和發佈品質的材料。普通用戶不需要閱讀，也不會被 npm 安裝到你的項目；npm package 只包含實際執行需要的核心檔案。\r?\n\r?\n維護者請看 \[`MAINTAINERS\.md`\]\(MAINTAINERS\.md\)。/;
  const after = "這個公開 repo 保留使用、安裝、入門、GitHub Pages 與 npm 執行所需內容。日常使用時，你只需要從上面四個入口開始。";
  writeFileSync(readmePath, before.test(text) ? text.replace(before, after) : text, "utf8");
}

function transformPackageJson() {
  const packagePath = path.join(outRoot, "package.json");
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  delete packageJson.scripts;
  writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
}

function checkMirrorShape() {
  const files = walk(outRoot);
  const pathHits = [];
  for (const file of files) {
    const relative = slash(path.relative(outRoot, file));
    const parts = relative.split("/");
    for (const part of parts) {
      if (forbiddenPathSegments.has(part)) {
        pathHits.push(`${relative}: forbidden path segment ${part}`);
      }
    }
    if (forbiddenFileNames.has(path.basename(relative))) {
      pathHits.push(`${relative}: forbidden file`);
    }
  }
  assert(pathHits.length === 0, formatHits("forbidden public mirror paths", pathHits));
  const expectedCount = expectedPublicMirrorFileCount(sourceRoot);
  assert(files.length === expectedCount, `public mirror file count drifted: expected ${expectedCount}, got ${files.length}`);
  console.log("ok: public mirror shape");
}

function checkMirrorText() {
  const hits = [];
  for (const file of walk(outRoot)) {
    if (!isTextCandidate(file)) continue;
    const relative = slash(path.relative(outRoot, file));
    const text = readFileSync(file, "utf8");
    for (const rule of forbiddenText) {
      if (rule.pattern.test(text)) hits.push(`${relative}: ${rule.label}`);
    }
  }
  assert(hits.length === 0, formatHits("forbidden public mirror text", hits));
  console.log("ok: public mirror text boundary");
}

function checkPackageJson() {
  const packageJson = JSON.parse(readFileSync(path.join(outRoot, "package.json"), "utf8"));
  assert(packageJson.name === "@adamchanadam/agent-handoff-kit", "package name drifted in public mirror");
  assert(!("scripts" in packageJson), "public mirror package.json must not expose dev scripts");
  assert(
    JSON.stringify(packageJson.files) === JSON.stringify(["bin/", "runtime-core/", "packs/", "README.md", "LICENSE"]),
    "public mirror npm package files boundary drifted"
  );
  assert(packageJson.bin?.["agent-handoff-kit"] === "bin/agent-handoff-kit.mjs", "public mirror bin entry drifted");
  console.log("ok: public mirror package metadata");
}

function checkNpmDryRun() {
  const result = runNpm(["pack", "--dry-run", "--json"], "public mirror npm dry-run", outRoot);
  const pack = parseNpmJson(result.stdout, "npm dry-run");
  const files = pack.files.map((entry) => entry.path);
  assert(files.length === RELEASE_PACKAGE_CONTRACT.expectedPackageFileCount, `public mirror npm package file count drifted: expected ${RELEASE_PACKAGE_CONTRACT.expectedPackageFileCount}, got ${files.length}`);
  assert(files.includes("README.en.md"), "English README is missing from the public npm package");
  assert(!files.some((file) => /docs\/qa|test-fixtures|scripts\//i.test(file)), "internal files entered public mirror npm package");
}

function checkCliAndUserFlow() {
  run(process.execPath, ["bin/agent-handoff-kit.mjs", "--help"], "public mirror CLI help", outRoot);

  const userRoot = path.join(tmpdir(), `ack-public-mirror-user-flow-${Date.now()}`);
  const init = run(process.execPath, ["bin/agent-handoff-kit.mjs", "init", "--yes", "--root", userRoot], "public mirror fresh init", outRoot);
  assert(init.stdout.includes("安裝完成"), "public mirror fresh init output missing completion line");
  const doctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", userRoot], "public mirror doctor after init", outRoot);
  assert(doctor.stdout.includes("status: passed"), "public mirror doctor after init did not pass");
  const upgrade = run(process.execPath, ["bin/agent-handoff-kit.mjs", "upgrade", "--yes", "--root", userRoot], "public mirror upgrade no-op", outRoot);
  assert(
    upgrade.stdout.includes("你已經是最新版本") || upgrade.stdout.includes("升級完成"),
    "public mirror upgrade output did not show a safe terminal state"
  );
  assert(/\bconflict:?\s*0\b/.test(upgrade.stdout), "public mirror upgrade reported conflicts");
  const postDoctor = run(process.execPath, ["bin/agent-handoff-kit.mjs", "doctor", "--root", userRoot], "public mirror doctor after upgrade", outRoot);
  assert(postDoctor.stdout.includes("status: passed"), "public mirror doctor after upgrade did not pass");
}

function checkTarballInstall() {
  const packageDir = path.join(tmpdir(), `ack-public-mirror-pack-${Date.now()}`);
  const consumerDir = path.join(tmpdir(), `ack-public-mirror-consumer-${Date.now()}`);
  mkdirSync(packageDir, { recursive: true });
  mkdirSync(consumerDir, { recursive: true });
  writeFileSync(
    path.join(consumerDir, "package.json"),
    `${JSON.stringify({ private: true, type: "module", dependencies: {} }, null, 2)}\n`,
    "utf8"
  );

  const packResult = runNpm(["pack", "--json", "--pack-destination", packageDir], "public mirror real npm pack", outRoot);
  const pack = parseNpmJson(packResult.stdout, "real npm pack");
  const tarballPath = path.join(packageDir, pack.filename);
  assert(existsSync(tarballPath), `public mirror tarball missing: ${tarballPath}`);

  const cacheDir = path.join(tmpdir(), `ack-public-mirror-npm-cache-${Date.now()}`);
  runNpm(["install", "--no-audit", "--no-fund", "--cache", cacheDir, tarballPath], "public mirror local tarball install", consumerDir);
  const installedRoot = path.join(consumerDir, "node_modules", "@adamchanadam", "agent-handoff-kit");
  const installedFiles = walk(installedRoot).map((file) => slash(path.relative(installedRoot, file)));
  assert(installedFiles.length === RELEASE_PACKAGE_CONTRACT.expectedPackageFileCount, `installed package file count drifted: expected ${RELEASE_PACKAGE_CONTRACT.expectedPackageFileCount}, got ${installedFiles.length}`);
  assert(installedFiles.includes("README.en.md"), "installed package is missing the English README");
  assert(!installedFiles.some((file) => /docs\/qa|test-fixtures|scripts\/|MAINTAINERS/i.test(file)), "installed package contains internal files");
  run(process.execPath, [path.join(installedRoot, "bin", "agent-handoff-kit.mjs"), "--help"], "installed tarball CLI help", consumerDir);
}

function copyFile(source, target) {
  mkdirSync(path.dirname(target), { recursive: true });
  cpSync(source, target);
}

function parseArgs(rawArgs) {
  const parsed = {};
  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i];
    if (arg === "--out") {
      parsed.out = rawArgs[++i];
      assert(parsed.out, "--out requires a path");
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return parsed;
}

function parseNpmJson(stdout, label) {
  const parsed = JSON.parse(stdout);
  const first = Array.isArray(parsed) ? parsed[0] : parsed;
  assert(first, `${label} returned empty JSON`);
  return first;
}

function runNpm(args, label, cwd) {
  if (process.env.npm_execpath) {
    return run(process.execPath, [process.env.npm_execpath, ...args], label, cwd);
  }
  return run(process.platform === "win32" ? "npm.cmd" : "npm", args, label, cwd);
}

function run(command, args, label, cwd) {
  const useShell = process.platform === "win32" && command.endsWith(".cmd");
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: useShell,
    env: {
      ...process.env,
      npm_config_cache: process.env.npm_config_cache ?? path.join(tmpdir(), "ack-public-mirror-npm-cache")
    }
  });
  if (result.error || result.status !== 0) {
    throw new Error(`${label} failed\n${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  }
  console.log(`ok: ${label}`);
  return result;
}

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

function isTextCandidate(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico"].includes(ext)) return false;
  if ([".md", ".json", ".mjs", ".js", ".txt", ".html", ".gitignore", ".xml"].includes(ext)) return true;
  return statSync(filePath).size < 1024 * 1024;
}

function slash(value) {
  return value.replaceAll(path.sep, "/");
}

function formatHits(title, hits) {
  return [title, ...hits.map((hit) => `- ${hit}`)].join("\n");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
