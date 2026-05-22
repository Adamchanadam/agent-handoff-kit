#!/usr/bin/env node

// Phase 2 R-025: Real-version upgrade fixture generator.
//
// For each target tag (v0.1.4 / v0.1.5 / v0.1.6), this script:
// 1. Creates a temporary detached worktree at the tag via `git worktree add`.
// 2. Runs that tag's own bin/agent-handoff-kit.mjs `init` into a temp root.
// 3. Copies the key produced files into test-fixtures/<tag>/.
// 4. Removes the worktree and the temp init root.
//
// The fixtures are committed into the repository so upgrade safety QA can
// stage realistic preconditions instead of using hand-typed staleCoreFixture()
// templates that drift from what real users actually have on disk.
//
// Run this manually (not part of qa:* loop) whenever a new tagged release
// should be included in the fixture set. Re-running is idempotent: existing
// fixtures are overwritten with freshly generated content.

import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const TARGETS = ["v0.1.4", "v0.1.5", "v0.1.6", "v0.1.7", "v0.1.8"];

// Key files needed to reproduce older-version core states for R-024 / R-025.
// AGENTS.md carries the core runtime form (with or without managed markers);
// dev/PROJECT_INDEX.md carries the template version metadata row used by
// R-016 stale-version regression. Other installed files are not version-
// sensitive for the current upgrade-safety scenarios.
const FIXTURE_FILES = ["AGENTS.md", "dev/PROJECT_INDEX.md"];

main();

function main() {
  const fixturesDir = path.join(root, "test-fixtures");
  mkdirSync(fixturesDir, { recursive: true });

  for (const tag of TARGETS) {
    const versionDir = path.join(fixturesDir, tag);
    const stamp = `${tag.replace(/[^\w-]/g, "_")}-${Date.now()}`;
    const worktreePath = path.join(tmpdir(), `ack-fixture-wt-${stamp}`);
    const initRoot = path.join(tmpdir(), `ack-fixture-init-${stamp}`);
    mkdirSync(initRoot, { recursive: true });
    let worktreeCreated = false;
    try {
      addWorktree(worktreePath, tag);
      worktreeCreated = true;
      runCLI(worktreePath, ["init", "--yes", "--root", initRoot], `init from ${tag}`);
      mkdirSync(versionDir, { recursive: true });
      for (const rel of FIXTURE_FILES) {
        const src = path.join(initRoot, rel);
        const dest = path.join(versionDir, rel);
        mkdirSync(path.dirname(dest), { recursive: true });
        copyFileSync(src, dest);
      }
      console.log(`ok: generated fixture for ${tag} -> ${path.relative(root, versionDir)}`);
    } finally {
      if (worktreeCreated) removeWorktree(worktreePath);
      rmSync(initRoot, { recursive: true, force: true });
    }
  }

  writeFileSync(
    path.join(fixturesDir, "README.md"),
    [
      "# Agent Handoff Kit Test Fixtures",
      "",
      "Real produced files from older tagged releases of the CLI. These fixtures",
      "exist so `scripts/check-upgrade-safety.mjs` can stage realistic upgrade",
      "preconditions instead of hand-typed templates that drift from what users",
      "actually have on disk (see R-025).",
      "",
      "## How they are generated",
      "",
      "Run `node scripts/generate-upgrade-fixtures.mjs` from the repo root. The",
      "generator creates a detached `git worktree` at each target tag, runs that",
      "tag's own `bin/agent-handoff-kit.mjs init` into a temp directory, copies",
      "the key files into `test-fixtures/<tag>/`, and cleans up the worktree.",
      "",
      "Do **not** edit these files by hand. Re-run the generator when a new",
      "tagged release should be added to the fixture set.",
      "",
      "## Covered versions",
      "",
      ...TARGETS.map((tag) => `- ${tag}`),
      "",
      "## Fixture files per version",
      "",
      ...FIXTURE_FILES.map((rel) => `- ${rel}`),
      "",
      "## npm package boundary",
      "",
      "This directory is excluded from the published npm package via the",
      "`files` whitelist in `package.json`. Fixtures live in the GitHub source",
      "repo only, so end users never download them.",
      ""
    ].join("\n"),
    "utf8"
  );

  console.log("");
  console.log("Agent Handoff Kit upgrade fixtures generated");
  console.log(`fixtures dir: ${path.relative(root, fixturesDir)}`);
}

function addWorktree(targetPath, ref) {
  const result = spawnSync("git", ["worktree", "add", "--detach", targetPath, ref], {
    cwd: root,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(`git worktree add ${ref} failed (exit ${result.status})\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  }
}

function removeWorktree(targetPath) {
  const result = spawnSync("git", ["worktree", "remove", "--force", targetPath], {
    cwd: root,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    // Non-fatal; just warn. The worktree path may already be gone, and the
    // generator should not block subsequent fixtures on cleanup glitches.
    console.error(`warning: git worktree remove failed for ${targetPath} (exit ${result.status})`);
  }
}

function runCLI(worktreePath, args, label) {
  const cliPath = path.join(worktreePath, "bin/agent-handoff-kit.mjs");
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: worktreePath,
    encoding: "utf8",
    env: { ...process.env, AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "1" }
  });
  if (result.status !== 0) {
    throw new Error(`${label} failed (exit ${result.status})\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  }
  console.log(`ok: ${label}`);
  return result;
}
