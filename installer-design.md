# Installer Design

## Goal

The public installer should install Agent Continuity Kit as a lightweight governance harness without embedding the entire runtime manual in one monolithic prompt.

## Public Entry

Keep one default public entry:

```bash
npx agent-continuity-kit init
```

Existing projects use:

```bash
npx agent-continuity-kit upgrade
```

Health checks use:

```bash
npx agent-continuity-kit doctor
```

The default installer installs the lightweight core. A full or legacy fallback can exist for maintainers or emergency use, but it must not compete with the `npx` path in public onboarding.

## Installer Responsibilities

The installer does only these jobs:

1. Confirm root path.
2. Show create/merge/skip plan.
3. Back up existing governance files.
4. Merge or create core files.
5. Install rule packs as separate files.
6. Run post-install verification.
7. Print quick start.

The installer does not make every rule always-loaded.

## Current Prototype Status

The current CLI is a scaffold for validating command shape and template mapping. It is not release-ready and should not be hardened further until remaining product requirements are collected.

Implemented:

1. `init --dry-run`
2. `init --yes`
3. `upgrade --dry-run`
4. `doctor`
5. template mapping from `runtime-core/*` and `packs/*.md`, including `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and the safety pack
6. create missing files only
7. skip existing files without modification
8. migration report generation

Pending:

1. section-aware merge
2. backup before modifying existing files
3. conflict report for unsafe existing content
4. richer doctor schema checks

## Continuity Template Behavior

The installed templates keep continuity in `dev/SESSION_HANDOFF.md` and recent evidence in `dev/SESSION_LOG.md`. The installer must not create an archive directory by default. Archive support is only needed later if a project has long validation output, research trails, or audit detail that should not stay in the startup path.

## Upgrade Behavior

| File type | Behavior |
|---|---|
| `AGENTS.md` | section-aware merge into lightweight core, preserving user custom sections |
| `CLAUDE.md` / `GEMINI.md` | create or preserve thin bridges that route to `AGENTS.md` without duplicating core rules |
| `dev/rules/safety.md` | install as the conditional safety pack for high-risk file, shell, Git, API, install, deploy, release, credential, and permission work |
| session files | keep existing, add missing schema fields only if safe |
| `PROJECT_INDEX.md` | create if missing; merge stack/commands if present |
| `DOC_SYNC_REGISTRY.md` | preserve custom rows; add missing universal rows |
| rule packs | install versioned pack files; preserve user-local additions |

## Thin Scenario Wrappers

Do not create full duplicated `INIT_WRITING.md`, `INIT_RESEARCH.md`, etc. If scenario wrappers are needed, they should only select default packs or profile defaults and then call the same core installer.

## Legacy / Full Mode

An `INIT_FULL.md` or equivalent fallback may exist for maintainers or advanced governance projects. It must be labeled as full/advanced or legacy, not recommended default.

## Installer Success Output

The final output should be brief: confirmed root, files created/merged/skipped, backup location, packs installed, verification result, and next command: `Follow AGENTS.md`.

It should also tell users they can describe their task directly. The AI will choose a working mode for coding, research, writing, knowledge sync, release, or mixed tasks and load only the relevant rule packs.

Startup and closeout output should use the small Agent Continuity Kit ASCII card with full product name and low-key version display. Closeout output should place the next-session opening message inside a fenced `text` code block, with a clear copy/paste marker before the block and no extra end marker after the block.
