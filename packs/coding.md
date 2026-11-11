# Coding Pack

## Scope

Use for code changes, tests, builds, package managers, SDKs, CLIs, APIs, or developer tooling.

## Load When

- User asks to write, edit, debug, refactor, test, build, package, or integrate code.
- The task depends on framework, runtime, dependency, or API behavior.

## Rules

1. Read `dev/PROJECT_INDEX.md` for stack, commands, entry points, and directory roles before editing.
2. Inspect relevant source, tests, configs, and docs before changing code.
3. Prefer project-local patterns and helpers over new abstractions.
4. Do not guess current SDK, CLI, package, API, or deployment behavior when docs or project files can verify it.
5. Preserve unrelated user changes.
6. Before first running new or changed code, including your own tests and helper scripts, read its usage text or header comment as a separate step before composing the command, noting how it uses arguments, environment variables, deletion and overwrite. If it can delete or overwrite anything outside a temporary location it created, first confirm the work is already recoverable (committed, backed up, or run against an isolated copy). This rule does not authorize a commit or backup; if the work is not recoverable, ask the user.
7. Tests, fixtures and helper scripts you write that delete or clear must verify the target is a temporary location they created (resolved path, expected name prefix, not the project or working directory or any ancestor of them); otherwise they must stop and report failure, never pass. Product features that delete by design follow `dev/rules/safety.md`.

## Checks

- Run the narrowest relevant test, build, lint, or typecheck available.
- If a check cannot run, record why and what remains unverified.
- Check `dev/DOC_SYNC_REGISTRY.md` if behavior, commands, public docs, or runbooks changed.

## Closeout

Record files changed, commands run, results, remaining risks, and any project index or doc sync updates.
