# Agent Continuity Kit Core Contract

The core runtime is not a shortened copy of v1. It is a narrow interface. It answers exactly five questions.

## 1. What Must AI Read At Session Start?

After the core contract is loaded, always read in order:

1. `dev/SESSION_HANDOFF.md`
2. latest entry in `dev/SESSION_LOG.md`
3. `dev/PROJECT_INDEX.md`
4. `dev/RULE_PACKS.md`

Then classify the user's task and load only the required rule pack(s).

If the user did not paste the previous opening message but the current project root is clear, read `AGENTS.md` first as fallback entry, then use this read order. If the root is unclear or mismatched, stop and ask for the intended project root before reading or editing project state.

## 2. How Must AI Think And Execute Work?

Default loop:

1. PLAN: restate intent, scope, risks, acceptance criteria.
2. READ: inspect relevant files from `PROJECT_INDEX.md` before editing.
3. CHANGE: make minimal focused changes.
4. QC: run or state checks, with actual results.
5. PERSIST: update handoff/log and any affected index or registry.

## 3. What Must AI Not Do?

Core prohibitions:

- Do not delete, reset, overwrite, or bulk-move user files without explicit approval.
- Do not guess external API, CLI, SDK, or deployment commands when official or project docs are needed.
- Do not edit files unrelated to the current task.
- Do not claim tests, builds, releases, or syncs passed without evidence.
- Do not add a permanent rule when a registry row, note, or troubleshooting entry is enough.

## 4. How Must AI Hand Over Work?

Detect end-of-session or handoff intent in natural language, such as "收工", "wrap up", or "handoff". If the intent is ambiguous, ask one concise confirmation question.

At full closeout:

1. Update `dev/SESSION_HANDOFF.md` with current state, next priorities, risks, validation, and workspace identity.
2. Add a concise entry to `dev/SESSION_LOG.md` with work actually completed this session and the exact next-session opening message.
3. Update `dev/PROJECT_INDEX.md` if files, stack, commands, entry points, workspace identity, or durable document map changed.
4. Check `dev/DOC_SYNC_REGISTRY.md` and record required sync status.
5. Record unresolved drift risk, active worktree, parallel workspace, uncommitted changes, or blocked verification.
6. Run the handoff sufficiency check: the next AI should be able to continue from `AGENTS.md`, `dev/SESSION_HANDOFF.md`, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history.
7. If the check fails, fix `dev/SESSION_HANDOFF.md` first; do not push current-state responsibility into `dev/SESSION_LOG.md`.
8. Provide a copy-paste-ready next-session opening message.

`dev/SESSION_HANDOFF.md` carries continuity. `dev/SESSION_LOG.md` carries recent evidence. Archive old detail only when needed; do not create an archive directory by default.

## 5. When Must AI Load A Pack?

Use `dev/RULE_PACKS.md` as the routing table. A pack can add task-specific rules, but cannot expand the core by default.

Pack loading must be explicit, minimal, bounded, and persisted only through durable records.

## Core Anti-Bloat Rule

A new rule enters core only if all are true:

1. It applies to most sessions.
2. It protects against meaningful safety, correctness, continuity, or data loss risk.
3. It cannot be handled by a pack, registry, troubleshooting note, or one-time fix.
4. It keeps the core within the complexity budget.
