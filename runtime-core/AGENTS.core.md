# Agent Handoff Kit Core Runtime

This is the lightweight core. It is the always-read contract for AI sessions.

## 1. Startup Reads

After this core is loaded, read in order:

1. `dev/SESSION_HANDOFF.md`
2. the latest entry in `dev/SESSION_LOG.md`
3. `dev/PROJECT_INDEX.md`
4. `dev/RULE_PACKS.md`

Then classify the user's task and read only the required rule pack(s). State which pack(s) you loaded and why, using plain language so the user understands the working mode without needing to know pack names.

If the user did not paste the previous opening message but the current project root is clear, read `AGENTS.md` first as fallback entry, then use this read order. If the root is unclear or mismatched, stop and ask for the intended project root before reading or editing project state.

If a required file is missing, create the smallest useful version only after confirming the target project root.

Before acting on a non-trivial task, identify required local source-of-truth files and external sources from the handoff, project index, user request, and sync registry. Read them or mark them blocked. Reachable is not the same as ingested. Do not treat unread sources as absent.

After startup reads are complete, show a short startup card:

```text
   /\_/\   Agent Handoff Kit v<version>
  ( o.o )  continuity ready
   > ^ <

🔎 Handoff: loaded
📌 Objective: <current objective>
⚠️ Boundary: <important boundary or none>
🚀 Next: <next action>
```

Keep the card short. Use the full product name, not an abbreviation. If the installed template or CLI version is unknown, write `version unverified` instead of guessing.

## 2. Work Loop

Use this loop for every task:

1. PLAN: restate the user's intent, scope, risk, and acceptance criteria.
2. READ: inspect relevant files from `PROJECT_INDEX.md` and search for related definitions before editing.
3. CHANGE: make focused changes only.
4. QC: run available checks or state why they cannot run.
5. PERSIST: update handoff/log and any affected project index or sync registry.

For high-risk work, pause after PLAN. High-risk means destructive operations, ambiguous target, external systems, release/publish, or broad multi-file change.

## 3. Safety Boundaries

Do not delete, reset, overwrite, bulk-move, or publish without explicit user approval.

Do not guess commands, APIs, SDK behavior, deployment steps, or file ownership when project docs or official docs are needed. Mark unverified facts as unverified.

Do not modify unrelated files. If unexpected user changes appear, work with them or ask before touching them.

Do not claim completion without evidence from checks, inspection, or a clear explanation of what could not be verified.

## 4. Closeout And Handoff

Detect end-of-session or handoff intent in natural language, such as "收工", "wrap up", or "handoff". If intent is ambiguous, ask one concise confirmation question.

At full closeout:

1. Reconcile `dev/SESSION_HANDOFF.md`. Do not append a new state snapshot under old state. Verify `Durable Anchors`, then rewrite or explicitly confirm every section under `Closeout-Reconciled State`.
2. Add a concise entry to `dev/SESSION_LOG.md` with work actually completed this session and the exact next-session opening message.
3. Update `dev/PROJECT_INDEX.md` if files, stack, commands, entry points, workspace identity, or durable document map changed.
4. Check `dev/DOC_SYNC_REGISTRY.md` and record required sync status.
5. Record unresolved drift risk, active worktree, parallel workspace, uncommitted changes, or blocked verification.
6. Complete the `State Reconciliation Check`: it must state when reconciliation happened, which state sections were rewritten or confirmed current, whether stale snapshots remain, and whether the opening message matches current state.
7. Run the handoff sufficiency check: the next AI should be able to continue from `AGENTS.md`, `dev/SESSION_HANDOFF.md`, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history.
8. If either check fails, fix `dev/SESSION_HANDOFF.md` first; do not push current-state responsibility into `dev/SESSION_LOG.md`.
9. Show a short closeout card, then provide a copy-paste-ready next-session opening message inside a fenced `text` code block, so the user can clearly copy and paste it into the next session.

Installed handoff templates use English headings by default for cross-tool stability, but project teams may translate `dev/SESSION_HANDOFF.md` section headings and visible field labels into the project's working language. Keep the `ack:section:*` and `ack:field:*` semantic markers intact; `doctor` validates those markers so localized handoff notes remain supported.

Use this closeout card:

```text
   /\_/\   Agent Handoff Kit v<version>
  ( -.- )  handoff saved
   > ^ <

✅ Done: <completed summary>
🔎 QC: <validation summary>
📌 Handoff: opening message ready
⚠️ Boundary: <important boundary or none>
```

Immediately before the fenced opening message, write:

```text
📋 Next session: copy and paste the whole block below
```

Record only work actually performed in the current session. Do not copy old completed work forward as new work.
`dev/SESSION_HANDOFF.md` carries continuity. `dev/SESSION_LOG.md` carries recent evidence. Archive old detail only when needed; do not create an archive directory by default.
Do not declare handoff ready if `dev/SESSION_HANDOFF.md` still contains stale state, unreconciled placeholders in current-state sections, or an opening message that no longer matches the reconciled state.

## 5. Pack Loading

Use `dev/RULE_PACKS.md` to decide which pack to read.

A pack may add task-specific requirements. A pack cannot weaken core safety. If two packs conflict, choose the safer and more verifiable path, then record the conflict in closeout.

After the task, persist durable facts into handoff/log/index/registry. Do not assume the next session remembers pack context unless it is recorded.

## Core Complexity Rule

New default-core rules are allowed only when they apply to most sessions, protect safety or continuity, cannot live in a pack or registry, and keep the core within budget.
