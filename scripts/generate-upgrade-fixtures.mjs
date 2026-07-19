#!/usr/bin/env node

// Rebuild the historical upgrade evidence from formal published artifacts.
// npm packages are the installation source of truth. Remote Git tags and
// GitHub Releases are required cross-checks; local tags and guessed commits are
// deliberately not accepted as substitutes.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { installedFileContracts } from "../bin/installed-file-contract.mjs";
import {
  OFFICIAL_ORIGIN_CATALOG_SCHEMA,
  canonicalizeOfficialText,
  normalizeNewlines,
  sha256
} from "../bin/official-origin-catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const packageName = "@adamchanadam/agent-handoff-kit";
const npmCli = path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
const fixturesDir = path.join(root, "test-fixtures");
const catalogPath = path.join(root, "bin", "migration-baselines", "official-origin-catalog.json");
const npmCache = path.join(tmpdir(), "agent-handoff-kit-official-catalog-npm-cache");
const retainedFixtureFiles = new Set(["AGENTS.md", "dev/PROJECT_INDEX.md"]);

main();

function main() {
  const npmVersions = readNpmVersions();
  const remoteTags = readRemoteTags();
  const releases = readGithubReleases();
  assertSameFormalInventory(npmVersions, remoteTags, releases);
  const previousCatalog = readPreviousCatalog();

  const workspace = path.join(tmpdir(), `agent-handoff-kit-official-catalog-${process.pid}-${Date.now()}`);
  const downloadsDir = path.join(workspace, "downloads");
  mkdirSync(downloadsDir, { recursive: true });
  mkdirSync(fixturesDir, { recursive: true });

  const catalog = {
    schemaVersion: OFFICIAL_ORIGIN_CATALOG_SCHEMA,
    packageName,
    sourcePolicy: "npm published package; remote Git tag and public GitHub Release cross-checked",
    installedTargets: installedFileContracts.map(({ targetRel, strategy }) => ({ targetRel, strategy })),
    releases: {},
    contents: {}
  };

  try {
    for (const version of npmVersions) {
      generateVersion({ version, workspace, downloadsDir, remoteTags, releases, catalog, previousCatalog });
    }
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }

  catalog.catalogDigestSha256 = catalogDigest(catalog);
  mkdirSync(path.dirname(catalogPath), { recursive: true });
  writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  writeFixtureReadme(npmVersions);

  console.log("");
  console.log(`Agent Handoff Kit official fixtures generated: ${npmVersions.length} versions`);
  console.log(`catalog: ${path.relative(root, catalogPath)}`);
}

function generateVersion({ version, workspace, downloadsDir, remoteTags, releases, catalog, previousCatalog }) {
  const versionKey = `v${version}`;
  const extractDir = path.join(workspace, "extract", versionKey);
  const initRoot = path.join(workspace, "init", versionKey);
  const fixtureDir = path.join(fixturesDir, versionKey);
  mkdirSync(extractDir, { recursive: true });
  mkdirSync(initRoot, { recursive: true });

  const packMetadata = npmPack(version, downloadsDir);
  extractPackage(path.join(downloadsDir, packMetadata.filename), extractDir);
  const packageRoot = path.join(extractDir, "package");
  runCliInit(packageRoot, initRoot, version);

  rmSync(fixtureDir, { recursive: true, force: true });
  mkdirSync(fixtureDir, { recursive: true });

  const manifest = {};
  for (const contract of installedFileContracts) {
    const sourcePath = path.join(initRoot, contract.targetRel);
    if (!existsSync(sourcePath)) {
      manifest[contract.targetRel] = { state: "absent" };
      continue;
    }

    const raw = readFileSync(sourcePath);
    const text = raw.toString("utf8");
    const normalizedText = normalizeNewlines(text);
    const normalizedSha256 = sha256(normalizedText);
    const canonicalText = canonicalizeOfficialText(contract.targetRel, normalizedText);
    const canonicalSha256 = sha256(canonicalText);
    const contentId = sha256(`${contract.targetRel}\0${canonicalText}`);
    const entry = {
      state: "present",
      contentId,
      rawSha256: createHash("sha256").update(raw).digest("hex"),
      normalizedSha256,
      canonicalSha256
    };
    manifest[contract.targetRel] = entry;
    if (!catalog.contents[contentId]) {
      catalog.contents[contentId] = {
        targetRel: contract.targetRel,
        canonicalSha256,
        text: canonicalText
      };
    }

    if (retainedFixtureFiles.has(contract.targetRel)) {
      const fixturePath = path.join(fixtureDir, contract.targetRel);
      mkdirSync(path.dirname(fixturePath), { recursive: true });
      copyFileSync(sourcePath, fixturePath);
    }
  }

  const npmGitHead = readNpmGitHead(version);
  const remoteTag = remoteTags.get(version);
  const divergenceStatus = !npmGitHead
    ? "npm-gitHead-unavailable"
    : npmGitHead === remoteTag.commit
      ? "same-commit"
      : "different-commit";
  const source = {
    npm: {
      spec: `${packageName}@${version}`,
      shasum: packMetadata.shasum,
      integrity: packMetadata.integrity,
      entryCount: packMetadata.entryCount,
      gitHead: npmGitHead
    },
    git: {
      tag: versionKey,
      directObject: remoteTag.directObject,
      peeledCommit: remoteTag.peeledCommit,
      commit: remoteTag.commit
    },
    githubRelease: {
      tag: versionKey,
      publishedAt: releases.get(version).publishedAt
    },
    sourceDivergence: {
      status: divergenceStatus,
      npmGitHead,
      remoteTagCommit: remoteTag.commit
    }
  };

  const fixtureManifest = {
    schemaVersion: 1,
    version,
    source,
    installedTargets: manifest
  };
  writeFileSync(path.join(fixtureDir, "fixture-manifest.json"), `${JSON.stringify(fixtureManifest, null, 2)}\n`, "utf8");
  const priorManagedSegments = reusableManagedSegments(previousCatalog, version, source);
  catalog.releases[version] = priorManagedSegments
    ? { source, manifest, managedSegments: priorManagedSegments }
    : { source, manifest };
  console.log(`ok: ${versionKey} (${Object.values(manifest).filter((item) => item.state === "present").length} installed files)`);
}

function readPreviousCatalog() {
  if (!existsSync(catalogPath)) return null;
  try {
    return JSON.parse(readFileSync(catalogPath, "utf8"));
  } catch {
    return null;
  }
}

function reusableManagedSegments(previousCatalog, version, source) {
  const previous = previousCatalog?.releases?.[version];
  if (!previous?.managedSegments) return null;
  const previousNpm = previous.source?.npm;
  if (!previousNpm
    || previousNpm.spec !== source.npm.spec
    || previousNpm.shasum !== source.npm.shasum
    || previousNpm.integrity !== source.npm.integrity) {
    return null;
  }
  return previous.managedSegments;
}

function readNpmVersions() {
  const output = run(process.execPath, [npmCli, "view", packageName, "versions", "--json"], "read npm version inventory", {
    ...process.env,
    npm_config_cache: npmCache,
    NPM_CONFIG_UPDATE_NOTIFIER: "false"
  });
  const versions = JSON.parse(output);
  if (!Array.isArray(versions) || versions.length === 0) throw new Error("npm returned no published versions");
  return versions;
}

function readRemoteTags() {
  const output = run("git", ["ls-remote", "--tags", "origin"], "read remote Git tags");
  const direct = new Map();
  const peeled = new Map();
  for (const line of output.trim().split(/\r?\n/)) {
    const match = line.match(/^([0-9a-f]{40})\s+refs\/tags\/v([^\s^]+)(\^\{\})?$/);
    if (!match) continue;
    (match[3] ? peeled : direct).set(match[2], match[1]);
  }
  return new Map([...direct].map(([version, sha]) => [version, {
    directObject: sha,
    peeledCommit: peeled.get(version) ?? null,
    commit: peeled.get(version) ?? sha
  }]));
}

function readNpmGitHead(version) {
  const output = run(
    process.execPath,
    [npmCli, "view", `${packageName}@${version}`, "gitHead", "--json"],
    `read npm gitHead ${version}`,
    { ...process.env, npm_config_cache: npmCache, NPM_CONFIG_UPDATE_NOTIFIER: "false" }
  ).trim();
  if (!output) return null;
  const value = JSON.parse(output);
  return typeof value === "string" && /^[0-9a-f]{40}$/.test(value) ? value : null;
}

function readGithubReleases() {
  const output = run(
    platformCommand("gh"),
    ["release", "list", "--repo", "Adamchanadam/agent-handoff-kit", "--limit", "100", "--json", "tagName,isDraft,isPrerelease,publishedAt"],
    "read GitHub Release inventory"
  );
  const releases = JSON.parse(output).filter((item) => !item.isDraft && !item.isPrerelease);
  return new Map(releases.map((item) => [item.tagName.replace(/^v/, ""), item]));
}

function assertSameFormalInventory(npmVersions, remoteTags, releases) {
  const npmSet = new Set(npmVersions);
  const problems = [];
  for (const version of npmVersions) {
    if (!remoteTags.has(version)) problems.push(`${version}: missing remote tag`);
    if (!releases.has(version)) problems.push(`${version}: missing public GitHub Release`);
  }
  for (const version of remoteTags.keys()) if (!npmSet.has(version)) problems.push(`${version}: remote tag is not published on npm`);
  for (const version of releases.keys()) if (!npmSet.has(version)) problems.push(`${version}: GitHub Release is not published on npm`);
  if (problems.length > 0) throw new Error(`formal release inventory mismatch:\n${problems.join("\n")}`);
}

function npmPack(version, downloadsDir) {
  const output = run(
    process.execPath,
    [npmCli, "pack", `${packageName}@${version}`, "--json", "--pack-destination", downloadsDir],
    `download npm package ${version}`,
    { ...process.env, npm_config_cache: npmCache, NPM_CONFIG_UPDATE_NOTIFIER: "false" }
  );
  const parsed = JSON.parse(output);
  if (!Array.isArray(parsed) || parsed.length !== 1) throw new Error(`unexpected npm pack response for ${version}`);
  return parsed[0];
}

function extractPackage(tarballPath, extractDir) {
  run("tar", ["-xf", tarballPath, "-C", extractDir], `extract ${path.basename(tarballPath)}`);
}

function runCliInit(packageRoot, initRoot, version) {
  const cliPath = path.join(packageRoot, "bin", "agent-handoff-kit.mjs");
  run(process.execPath, [cliPath, "init", "--yes", "--root", initRoot], `init ${version}`, {
    ...process.env,
    AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "1"
  }, packageRoot);
}

function run(command, args, label, env = process.env, cwd = root) {
  const result = spawnSync(command, args, { cwd, env, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error(`${label} failed (exit ${result.status})\n${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  }
  return result.stdout;
}

function platformCommand(command) {
  if (process.platform !== "win32") return command;
  if (command === "gh") return "gh.exe";
  return command;
}

function catalogDigest(catalog) {
  const copy = { ...catalog };
  delete copy.catalogDigestSha256;
  return sha256(`${JSON.stringify(copy)}\n`);
}

function writeFixtureReadme(versions) {
  writeFileSync(
    path.join(fixturesDir, "README.md"),
    [
      "# Agent Handoff Kit Test Fixtures",
      "",
      "Complete installed outputs produced by every formal npm release. Remote",
      "Git tags and public GitHub Releases are cross-checked before generation.",
      "Local tags and guessed commits are not accepted as release sources.",
      "",
      "Run `npm run qa:fixtures` to rebuild. Each version directory keeps the two",
      "legacy files used by focused tests plus `fixture-manifest.json`. The manifest",
      "marks all current managed targets as `present` or `absent`; full historical",
      "install trees are reconstructed from the deduplicated catalog during QA.",
      "",
      "Do not edit generated fixtures or the official-origin catalog by hand.",
      "The fixtures stay outside the npm package; the deduplicated runtime catalog",
      "is published under `bin/migration-baselines/`.",
      "",
      `Covered formal releases: ${versions.length}`,
      "",
      ...versions.map((version) => `- v${version}`),
      ""
    ].join("\n"),
    "utf8"
  );
}
