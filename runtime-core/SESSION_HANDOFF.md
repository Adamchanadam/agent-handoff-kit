# Session Handoff

Last Updated: TBD

<!-- ack:section:durable-anchors -->
## Durable Anchors

Stable facts that should survive across sessions. Update only when they change, but verify they still match reality at closeout.

1. Project root and boundary: TBD
2. Product/system identity: TBD
3. Governance model: TBD
4. Source-of-truth ownership: TBD
5. Release / publish boundary: TBD

<!-- ack:section:closeout-reconciled-state -->
## Closeout-Reconciled State

This is the current-state area. At every full closeout, rewrite or explicitly confirm every section below. Do not append a new state snapshot under an old one.

<!-- ack:section:current-baseline -->
## Current Baseline

1. Project root: TBD
2. Product/system state: TBD
3. Governance state: TBD
4. Source-of-truth notes: TBD

<!-- ack:section:task-understanding-summary -->
## Task Understanding Summary

<!-- ack:field:user-intent -->
- User intent: TBD
<!-- ack:field:task-essence -->
- Task essence: TBD
- User value: TBD
<!-- ack:field:success-criteria -->
- Success criteria: TBD
- Key background already read: TBD
- Background still unread or blocked: TBD
- Non-goals / boundaries: TBD

<!-- ack:section:active-objective -->
## Active Objective

TBD

<!-- ack:section:completed-this-session -->
## Completed This Session

Record only work actually completed in the current session.

1. TBD

<!-- ack:section:next-priorities -->
## Next Priorities

1. TBD

<!-- ack:section:next-task-required-reading -->
## Next Task Required Reading

Before acting on the next task, read or mark blocked:

| Source | Why required | Status |
|---|---|---|
| TBD | TBD | pending |

<!-- ack:section:risks-blockers -->
## Risks / Blockers

1. TBD

<!-- ack:section:validation-qc -->
## Validation / QC

- Checks run this session: TBD
- Checks not run and why: TBD
- Handoff evidence location: TBD

<!-- ack:section:workspace-identity -->
## Workspace Identity

Expected project root: TBD
Git root: TBD
Branch: TBD
Commit: TBD
Worktree / parallel workspace status: TBD
Uncommitted changes summary: TBD

<!-- ack:section:sync-status -->
## Sync Status

Use statuses from `dev/DOC_SYNC_REGISTRY.md`: `confirmed`, `unverified`, `pending`, `blocked`, `not_applicable`.

- Project index: TBD
- Doc sync registry: TBD
- Public docs / README: TBD
- External knowledge tools: TBD

<!-- ack:section:state-reconciliation-check -->
## State Reconciliation Check

At full closeout, complete this check after updating the state sections above.

- Reconciled at: TBD
<!-- ack:field:state-sections-rewritten-or-confirmed -->
- State sections rewritten or confirmed current: TBD
<!-- ack:field:stale-snapshots-left -->
- Stale snapshots left in this handoff: TBD
<!-- ack:field:opening-message-matches-current-state -->
- Opening message matches current state: TBD
<!-- ack:field:next-ai-can-continue -->
- Next AI can continue from `AGENTS.md`, this handoff, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history: TBD

If any answer is no, blocked, or uncertain, fix this handoff before declaring handoff ready.

<!-- ack:section:handoff-sufficiency-check -->
## Handoff Sufficiency Check

Can the next AI continue from `AGENTS.md`, this handoff, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history?

Answer: TBD
If no, update this handoff before closeout.

Continuity rule: this file carries current state and next action. `dev/SESSION_LOG.md` carries recent evidence only. Archive old detail only when needed; do not create an archive directory by default.

<!-- ack:section:next-session-opening-message -->
## Next Session Opening Message

📋 Next session: copy and paste the whole block below

```text
Work in <absolute project root>.

Read in order:
1. AGENTS.md
2. dev/SESSION_HANDOFF.md
3. dev/SESSION_LOG.md
4. dev/PROJECT_INDEX.md
5. dev/RULE_PACKS.md

Read dev/DOC_SYNC_REGISTRY.md before file changes or closeout.

If this root does not match the expected project root, stop and ask for confirmation.

After reading, summarize current objective, task understanding, confirmed decisions, pending work, risks, and the next recommended action.
```
