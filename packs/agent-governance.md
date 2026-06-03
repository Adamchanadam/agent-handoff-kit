# Agent Governance Pack

## Scope

Use for governance rules, prompts, agent instructions, handoff systems, startup/closeout behavior, skills, and rule packs.

## Load When

- User asks to change AI behavior, project governance, prompts, handoff, startup, closeout, or tool-use rules.
- A change affects `AGENTS.md`, `dev/*`, rule packs, installer templates, or durable workflow docs.

## Rules

1. Locate the existing source of truth before adding a rule.
2. Prefer merge, replace, or registry rows over append-only rule growth.
3. Keep public runtime rules generic; project-specific incidents belong in logs, runbooks, or project index.
4. Do not let development-only workspace rules enter public runtime.
5. Check complexity budget before adding default-core behavior.
6. Before creating durable workflow, runbook, or instruction files, first classify the knowledge type and verify whether an existing home can carry it without a new file: current state belongs in `dev/SESSION_HANDOFF.md`; trace evidence belongs in `dev/SESSION_LOG.md`; file / command / reference maps belong in `dev/PROJECT_INDEX.md`; sync obligations belong in `dev/DOC_SYNC_REGISTRY.md`; reusable operating procedures belong in the relevant rule pack or registered reference. New runbooks are last resort only.
7. When a task uses external skills, subagents, demo workspaces, or another tool's closeout, treat those flows as subordinate to the active root's Agent Handoff Kit governance. The active root still needs the `runtime-core/AGENTS.core.md` persistence gate decision; do not duplicate the gate thresholds in this pack.
8. For long-running projects, maintain `dev/PROJECT_DECISIONS.md` per R-028 closeout discipline (see `runtime-core/AGENTS.core.md` closeout maintenance trigger check): capture major decisions when they happen, run the short trigger check at every closeout, and do full long-term maintenance only when a hard trigger, semantic trigger, or 10-closeout backstop applies. Short single-task projects keep this as a no-op default; users are not expected to edit this file manually.

## Checks

- Verify affected files are indexed or intentionally installed templates.
- Check `dev/DOC_SYNC_REGISTRY.md` for governance, closeout/startup, and README sync rows.
- Confirm old overlapping wording was retired or marked legacy.
- Confirm any new durable file is reachable from `dev/PROJECT_INDEX.md` and does not rely only on a one-session handoff note.
- Confirm reusable operating procedure knowledge is not stored only in `dev/SESSION_HANDOFF.md`, `dev/SESSION_LOG.md`, or a decision narrative when it belongs in a pack or registered reference.
- Before claiming completion, apply the active root's core persistence gate and record the result only when that gate selects a checkpoint or full closeout; do not assume child or demo workspaces cover the parent/root workspace.
- For long-running projects, confirm `dev/PROJECT_DECISIONS.md` retains its four H2 sections in order (Evolution Timeline / Decisions Archive / Architecture Choices / Insights & Learnings) and that the closeout maintenance trigger check was recorded, with full maintenance applied where its trigger conditions were met.

## Closeout

Record the changed rule home, reason, complexity impact, retired wording, and follow-up checks.
