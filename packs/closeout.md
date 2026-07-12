# Closeout Pack

## Scope

This pack is the single detailed contract for full Agent Handoff Kit closeout. Load it only for clear end-of-session or handoff intent. It does not authorize Git, release, publish, deployment, deletion, permission, or cleanup actions.

## Required Reads

Read the current `dev/SESSION_HANDOFF.md`, `dev/SESSION_LOG.md`, `dev/PROJECT_INDEX.md`, and `dev/DOC_SYNC_REGISTRY.md`. Read `dev/PROJECT_DECISIONS.md`, integration rules, or another pack only when its closeout trigger or the session's actual work requires it.

## Write Contract

Use Kit markers as machine boundaries: `ack:section:*`, `ack:field:*`, `ack:log-entry:start/end`, and managed-core BEGIN/END. Human headings may be localized; markers may not be removed or translated.

- Current state, objective, recommended next action, active risk, blocker, required reading, workspace identity, and sync status belong in `dev/SESSION_HANDOFF.md`.
- Chronological work and evidence disposition belong in `dev/SESSION_LOG.md`.
- File / command / source / capability maps belong in `dev/PROJECT_INDEX.md`.
- Recurring sync obligations belong in `dev/DOC_SYNC_REGISTRY.md`.
- Long-term evolution, architectural rationale, and accumulated learning belong in `dev/PROJECT_DECISIONS.md` when triggered.
- Reusable procedures belong in the relevant pack, registered reference, or QA check.
- `START_NEXT_SESSION_PROMPT.txt` is generated only from the handoff opening-message block.

Do not copy the full opening message into `dev/SESSION_LOG.md` or any third current governance file. The log records that the mirror was regenerated and verified, plus an evidence reference when useful.

## Full Closeout

1. Reconcile `dev/SESSION_HANDOFF.md`; never append a new current-state snapshot beneath an old one. Verify durable anchors, then rewrite or explicitly confirm every closeout-reconciled section.
2. Reconcile lifecycle state across `Completed This Session`, `Validation / QC`, `Next Priorities`, `Risks / Blockers`, and `Next Session Opening Message`. Completed or verified work cannot remain unresolved unless explicitly reclassified as monitor-only, follow-up scope, blocked, or reopened with its missing evidence or trigger.
   The bundled doctor is a mechanical floor for obvious overlap and unresolved fields; it cannot prove that renamed or paraphrased work is semantically consistent. Read all five sections as a whole before marking the lifecycle field resolved. For governance, release, or another project-defined high-risk completion, use the project's independent semantic review gate in addition to doctor.
3. Make `Next Priorities` name one recommended next action and a short reason unless blocked or a real user decision is required.
4. Complete the persistence-routing and handoff-sufficiency fields. The next agent must be able to continue from `AGENTS.md`, the handoff, the project index when needed, and routed packs without searching old log history.
5. Add one concise log entry for work actually performed. Record evidence disposition and the prompt-mirror verification result; omit the full opening message by design.
6. Update the project index and sync registry only when their owned maps or obligations changed. Record each applicable sync target as `confirmed`, `unverified`, `pending`, `blocked`, or `not_applicable`.
7. Record the actual root, Git root, branch, commit, worktrees / parallel workspaces, uncommitted changes, and unresolved drift. Do not clean or change them without separate authorization.
8. If the session used external tools or helper processes, apply the integrations and safety ownership rules. Close only task-owned resources. Retain shared, user-owned, other-agent-owned, system, or ambiguous resources unless separately authorized; state visibility limits.
9. Run the short maintenance trigger check below and record its result in the log.
10. Mark first-use guidance `consumed` after the first successfully completed task or first full closeout. Upgrade must never reset `consumed` or `not_applicable` to `eligible`.
11. Regenerate `START_NEXT_SESSION_PROMPT.txt` from the sole fenced handoff opening-message block. Run the project's fixed prompt-mirror checker or perform an equivalent anchored read-back that verifies marker, heading, fence, full-copy uniqueness, and normalized content equality.
12. Run available project closeout / doctor checks. Do not treat an external update-check failure as local closeout failure. Fix state or mirror failures before claiming handoff ready.

## Maintenance Trigger Check

Every full closeout runs this short check; full maintenance runs only when triggered.

- SESSION_LOG: trigger when the main log reaches at least 11 entries, exceeds 1500 lines, or the 10-closeout backstop is due. Keep recent safety-buffer entries; collapse only content already absorbed by an authoritative home. Archive older raw entries to `dev/SESSION_LOG_archive/archive_<batch>_<low_date>_to_<high_date>.md` and maintain `INDEX.md`. Port unique narrative before collapsing it.
- PROJECT_DECISIONS: trigger when a decisions-like handoff section has at least 30 entries; retain the newest 8–22 in the hot tier and move older decisions into the decisions archive. Also write substantive task evolution, a multi-option architectural choice with rationale, or a cross-session learning when observed.
- Backstop: every 10 closeouts, run the full long-term maintenance pass even when no semantic trigger is obvious. If the count cannot be determined confidently at the boundary, treat the backstop as due.

If no trigger applies, record one no-op reason. Handoff carries continuity; log and project decisions carry trace and long-term narrative.

## Opening Message And Card

The handoff opening-message block is authoritative. It must name the absolute root, route the agent through `AGENTS.md` and the handoff, state the current objective and boundary, and avoid instructing the next agent to redo completed work. It must not require SESSION_LOG as an ordinary startup read.

Use a verified version already present in the closeout reads; otherwise show `version unverified`. Never print the literal placeholder `v<version>`.

```text
   /\_/\   Agent Handoff Kit v<version>
  ( -.- )  handoff saved
   > ^ <

✅ Done: <completed summary>
🔎 QC: <validation summary>
📌 Handoff: opening message ready
⚠️ Boundary: <important boundary or none>
```

Then give the short local-root entry `Start Agent Handoff` / `開工` and the path-bearing fallback for an agent not yet pointed at the root. Do not hand-compose a third stateful prompt in the final response.

## Stop Conditions

Do not claim closeout complete when any required write or read-back failed, lifecycle state conflicts remain, the mirror is stale or duplicated, the root is uncertain, mandatory sync is unclassified, or required Git persistence was explicitly part of the project's closeout contract but did not succeed. State the exact blocker and leave the project in an honest resumable state.
