# Agent Continuity Kit Architecture

## Overview

Agent Continuity Kit separates three layers:

1. Core runtime: short always-read behavior contract.
2. Project memory: compact data files that tell AI what the project is.
3. Conditional packs: task-specific rules loaded only when needed.

## Target Installed Layout

```text
<project>/
  AGENTS.md
  CLAUDE.md
  GEMINI.md
  dev/
    SESSION_HANDOFF.md
    SESSION_LOG.md
    PROJECT_INDEX.md
    DOC_SYNC_REGISTRY.md
    RULE_PACKS.md
    rules/
      safety.md
      coding.md
      writing.md
      research.md
      agent-governance.md
      release.md
      knowledge.md
      communication.md
```

## Source Template Layout

```text
runtime-core/
  AGENTS.core.md
  CLAUDE.md
  GEMINI.md
  SESSION_HANDOFF.md
  SESSION_LOG.md
  PROJECT_INDEX.md
  DOC_SYNC_REGISTRY.md
  RULE_PACKS.md
packs/
  safety.md
  coding.md
  writing.md
  research.md
  agent-governance.md
  release.md
  knowledge.md
  communication.md
```

The installer maps `runtime-core/*` into the target project core files and maps `packs/*.md` into `dev/rules/*.md`.

## File Roles

| File | Always read | Purpose |
|---|---:|---|
| `AGENTS.md` | yes | Core contract and startup routing. |
| `CLAUDE.md` | bridge only | Claude Code entry bridge to `AGENTS.md`. |
| `GEMINI.md` | bridge only | Gemini CLI entry bridge to `AGENTS.md`. |
| `SESSION_HANDOFF.md` | yes | Current state. |
| `SESSION_LOG.md` | latest only | Recent history and last handoff. |
| `PROJECT_INDEX.md` | yes | Stack, directory map, entry points, checks. |
| `RULE_PACKS.md` | yes | Routes task types to packs. |
| `DOC_SYNC_REGISTRY.md` | when files change | Maps change type to docs/checks. |
| `dev/rules/*.md` | conditional | Task-specific behavior. |

## Startup Flow

1. Read core.
2. Read handoff, latest log, project index, and pack router.
3. Classify task type.
4. Load required pack(s).
5. Plan work using the project index and current handoff.

## Change Flow

1. Use `PROJECT_INDEX.md` to identify likely files.
2. Read target files and related files.
3. Apply scoped change.
4. Run checks listed in project index and pack.
5. Consult doc sync registry if docs, commands, public behavior, or file map changed.

## Closeout Flow

1. Record what changed this session only.
2. Update current state and next steps.
3. Update project index if structure, stack, commands, or entry points changed.
4. Update doc sync registry only when a new change category appears.
5. Run the handoff sufficiency check; fix `SESSION_HANDOFF.md` if the next AI would need to search old logs to continue.
6. Keep active logs compact; summarize older detail first and archive only when needed.

## Why This Is Lighter

The AI always reads the information needed to orient itself, but heavy rules are lazy-loaded by task. The default runtime becomes a router plus safety contract, not a full manual.
