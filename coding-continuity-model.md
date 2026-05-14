# Agent Continuity Kit Coding Continuity Model

## Problem

Coding projects often have many directories, tools, tests, docs, runbooks, and changing requirements. A stateless AI must not rediscover the whole repository every session, but it also must not rely on stale memory.

## Core Answer

Use `PROJECT_INDEX.md` as the compact project map and update it whenever the map changes. Use `DOC_SYNC_REGISTRY.md` to decide which docs or runbooks need updates after code changes.

## When User Provides Technical Stack

If the user states stack details such as framework, package manager, runtime, database, deployment target, or test command:

1. Treat the statement as user-provided but verify against project files when possible.
2. Update `PROJECT_INDEX.md` Stack and Build/Test sections at closeout if confirmed.
3. If unconfirmed, record as pending verification in handoff, not as fact.

## When User Requests Development Work

1. Read `PROJECT_INDEX.md` to identify likely directories and commands.
2. Load `dev/rules/coding.md`.
3. Read relevant source, tests, configs, and docs before editing.
4. Make scoped changes.
5. Run checks from `PROJECT_INDEX.md` and coding pack.
6. Consult `DOC_SYNC_REGISTRY.md` for docs/runbook impact.
7. Update `SESSION_HANDOFF.md`, `SESSION_LOG.md`, and `PROJECT_INDEX.md` if the project map changed.

## When User Modifies Requirements

Durable requirements belong in one of these places:

- `PROJECT_INDEX.md` for stack, commands, directory map, entry points;
- `PROJECT_MASTER_SPEC.md` if the project uses a long-term spec;
- `RUNBOOK.md` for operational procedure;
- `SESSION_HANDOFF.md` for short-term implementation state.

Do not bury durable requirements only in `SESSION_LOG.md`.

## PROJECT_INDEX Maintenance Triggers

Update `PROJECT_INDEX.md` when stack, test/build command, app entry point, config path, directory role, generated artifact policy, docs/runbook location, or external service integration location changes.

## Why This Works

New sessions read a small map first, then inspect only relevant files. The index prevents blind scanning, while verification prevents stale memory from becoming false fact.
