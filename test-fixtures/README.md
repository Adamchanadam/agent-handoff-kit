# Agent Handoff Kit Test Fixtures

Real produced files from older tagged releases of the CLI. These fixtures
exist so `scripts/check-upgrade-safety.mjs` can stage realistic upgrade
preconditions instead of hand-typed templates that drift from what users
actually have on disk (see R-025).

## How they are generated

Run `node scripts/generate-upgrade-fixtures.mjs` from the repo root. The
generator creates a detached `git worktree` at each target tag, runs that
tag's own `bin/agent-handoff-kit.mjs init` into a temp directory, copies
the key files into `test-fixtures/<tag>/`, and cleans up the worktree.

Do **not** edit these files by hand. Re-run the generator when a new
tagged release should be added to the fixture set.

## Covered versions

- v0.1.4
- v0.1.5
- v0.1.6
- v0.1.7
- v0.1.8
- v0.2.0
- v0.2.1
- v0.2.2
- v0.2.3
- v0.3.0
- v0.3.1
- v0.3.2
- v0.3.3
- v0.3.4
- v0.3.5
- v0.3.6
- v0.3.7
- v0.3.8
- v0.3.9
- v0.3.10
- v0.3.11
- v0.3.12
- v0.3.13
- v0.3.14
- v0.3.15
- v0.3.16

## Fixture files per version

- AGENTS.md
- dev/PROJECT_INDEX.md

## npm package boundary

This directory is excluded from the published npm package via the
`files` whitelist in `package.json`. Fixtures live in the GitHub source
repo only, so end users never download them.
