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
6. Installed Integrations registry: `dev/PROJECT_INDEX.md` `## Installed Integrations` is the declaration source. Probe only immediately before actual use, when the current objective names an integration dependency, or when the user asks for a health check. Credential values never appear in `dev/*`; record references only.

<!-- ack:section:closeout-reconciled-state -->
## Closeout-Reconciled State

This is the current-state area. At every full closeout, rewrite or explicitly confirm every section below. Do not append a new state snapshot under an old one.

<!-- ack:section:current-baseline -->
## Current Baseline

1. Project root: TBD
2. Product/system state: TBD
3. Governance state: TBD
4. Source-of-truth notes: TBD
<!-- ack:field:first-use-guidance-state -->
5. First-use guidance state: eligible

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

Recommended next step: TBD — reason: TBD

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
<!-- ack:field:lifecycle-conflicts-resolved -->
- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: TBD
<!-- ack:field:persistence-routing-checked -->
- Persistence routing checked: TBD
<!-- ack:field:recommended-next-step-explicit -->
- Recommended next step is explicit and reasoned: TBD
<!-- ack:field:opening-message-matches-current-state -->
- Opening message matches current state: TBD
<!-- ack:field:next-ai-can-continue -->
- Next AI can continue from `AGENTS.md`, this handoff, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history: TBD

If any answer is no, blocked, or uncertain, fix this handoff before declaring handoff ready.

Lifecycle consistency rule: compare `Completed This Session`, `Validation / QC`, `Next Priorities`, `Risks / Blockers`, and `Next Session Opening Message` as full content, including renamed or paraphrased work. A completed or verified item must not remain as an unresolved next priority, active risk, or startup instruction unless it is explicitly reclassified as monitor-only, follow-up scope, blocked, or reopened with the missing evidence or trigger condition stated. Doctor catches only mechanical contradictions and unresolved fields; its green result is not semantic proof. Recommended next-step rule: `Next Priorities` must name the single recommended next action and a short reason before listing additional options, unless the next action is blocked or genuinely requires a user decision. Persistence routing rule: one-time delivery instructions, historical validation evidence, old hashes, old version facts, and incident notes must stay in trace evidence unless they still affect the next action.

<!-- ack:section:handoff-sufficiency-check -->
## Handoff Sufficiency Check

Can the next AI continue from `AGENTS.md`, this handoff, and only the project index / rule packs required by the next task, without searching old log history?

Answer: TBD
If no, update this handoff before closeout.

Continuity rule: this file carries current state and next action. `dev/SESSION_LOG.md` carries recent evidence only. Archive old detail only when needed; do not create an archive directory by default.

<!-- ack:section:next-session-opening-message -->
## Next Session Opening Message

This fenced block is the authoritative agent-managed startup content. At closeout, regenerate `START_NEXT_SESSION_PROMPT.txt` from this block. If the two differ, trust this block and rewrite the convenience copy. User-facing closeout output should show `Start Agent Handoff` / `開工` as the primary next-session entry, plus the path-bearing fallback when the next AI is not yet pointed at this project root; do not hand-write a separate stateful prompt in the final response.

📋 Next session: agent-managed startup content below

```text
Work in <absolute project root>. Read AGENTS.md, then dev/SESSION_HANDOFF.md. Trust the handoff over this generated mirror.

If the root does not match the handoff, stop and ask for confirmation. Do not read dev/SESSION_LOG.md during ordinary startup. Read dev/PROJECT_INDEX.md, dev/RULE_PACKS.md, dev/DOC_SYNC_REGISTRY.md, and task packs only when the current task requires them.

Resume the current objective. If my message or the handoff already gives an executable task, begin its first safe action in this response. A fresh install only makes guidance available; it does not force onboarding. Load onboarding only when I explicitly ask for guidance or no executable objective remains after state reading.
```
