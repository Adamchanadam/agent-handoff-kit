<!-- BEGIN Agent Handoff Kit managed core -->
# Agent Handoff Kit Core Runtime

This is the lightweight core. It is the always-read contract for AI sessions.

## 1. Startup Reads

After this core is loaded, read in order:

1. `dev/SESSION_HANDOFF.md`
2. the latest entry in `dev/SESSION_LOG.md`
3. `dev/PROJECT_INDEX.md`
4. `dev/RULE_PACKS.md`

Then classify the user's task and read only the required rule pack(s). State which pack(s) you loaded and why, using plain language so the user understands the working mode without needing to know pack names.

Before classifying the task, detect first-time-user signals (R-029): if the user's first message in this session is short, vague, contains onboarding signal keywords such as "I'm new", "help me start", "first time", "I just installed", "how do I start", "show me how", or equivalent Chinese phrases such as "新手", "教我用", "我剛安裝", "點開始", or if the session is a fresh installation (HANDOFF Active Objective empty + Session count 1), load `dev/rules/onboarding.md` proactively before doing the regular task loop. The onboarding pack surfaces the AI's role and offers Scenario A-F selection instead of immediately diving into task execution. Onboarding is a transient pack: after the user completes the first-task walk-through, unload it and load the regular scenario pack (coding / research / writing / knowledge / etc.) for ongoing work.

If the user did not paste the previous opening message but the current project root is clear, read `AGENTS.md` first as fallback entry, then use this read order. If the root is unclear or mismatched, stop and ask for the intended project root before reading or editing project state.

Detect clear startup / handoff-start intent in natural language, such as "開工", "Start Agent Handoff", "開始接力", or "continue handoff". When that intent is clear and the current project root is clear, open `START_NEXT_SESSION_PROMPT.txt` and follow the opening message inside. If `START_NEXT_SESSION_PROMPT.txt` is missing or seems stale, read `dev/SESSION_HANDOFF.md` instead. Before changing anything, tell the user the current state and your recommended next step.

Ambiguous startup phrases need one concise confirmation question before treating them as Agent Handoff Kit startup. In particular, if the user says "<something> 開工", "<something> start", or similar wording that may refer to a real-world shift, event, project phase, or another context, ask whether they mean to start Agent Handoff Kit continuity for this project.

If a required file is missing, create the smallest useful version only after confirming the target project root.

Before acting on a non-trivial task, identify required local source-of-truth files and external sources from the handoff, project index, user request, and sync registry. Read them or mark them blocked. Reachable is not the same as ingested. Do not treat unread sources as absent. If tool output is truncated, paginated, or only a search hit, continue reading the relevant source or mark coverage as partial; do not present a complete conclusion from partial output.

When creating or materially changing Markdown files, generated documents, research outputs, specifications, runbooks, checklists, guides, or other durable artifacts, do not leave them as orphan files. Before claiming the task is complete, classify each new or materially changed artifact as one of: draft / one-time evidence, source of truth, reference, runbook, workflow, public document, generated output, or intentionally temporary. Then either register it in `dev/PROJECT_INDEX.md` with a role and read condition, register a sync obligation in `dev/DOC_SYNC_REGISTRY.md`, point to an existing authoritative home and mark the file as non-authoritative, or explicitly record why it is temporary / one-time evidence. If several files carry the same durable rule or requirement, consolidate or point to the single authoritative home instead of creating parallel truth.

After reading `dev/PROJECT_INDEX.md`, if `## Installed Integrations` is non-empty, run startup availability probe (R-030 Integration governance discipline; see `dev/rules/integrations.md`):

- For each declared Integration under Connectors / MCPs subsection, attempt a minimal capability probe using the active runtime's currently exposed tool name, description, and input schema. Do not invent `mcp__*` names or arguments from examples or memory.
- If probe succeeds: update the corresponding `Last Verified` cell to today's date; proceed normally.
- If probe fails (current AI tool lacks the Connector / auth expired / network issue): print warning in the startup card (`⚠️ Boundary` line) noting which Integration is declared-but-unavailable + that this session will fallback to paste flow when that external surface is touched. Do not attempt to auto-fix auth or credential issues; surface to the user to handle via the AI tool's own settings interface.
- Credential separation: AI must never request, log, or persist credential values (API keys / OAuth tokens / app secrets / refresh tokens). Credentials live in OS-level secure storage or AI-tool-specific config, never in `dev/*` files. Recognize common credential prefixes (`sk-`, `sk-ant-`, `ntn_`, `secret_`, `ya29.`, `1//`, `xoxp-`, `xoxb-`, `ghp_`, `gho_`, `ghs_`, `github_pat_`, `sl.`, `AKIA`, `AIza`) and redact + warn the user to rotate the token if accidentally pasted.

After startup reads are complete, show one short startup card. If onboarding is loaded, combine this card and the onboarding choice list into one first response. Do not print any standalone startup card before the onboarding rule has been read. Do not print a partial card. Do not print the cat banner twice. If you started drafting a card and then discovered onboarding applies, discard the draft and output only the final combined response.

Display version rule: after reading `dev/PROJECT_INDEX.md`, take the card version from the `## Stack` row `Agent Handoff Kit template version`. Print it as `vX.Y.Z`. If that row is missing, unreadable, or not a version, print `version unverified`. Never print the literal placeholder `v<version>` in user-facing startup or closeout output.

```text
   /\_/\   Agent Handoff Kit v<version>
  ( o.o )  continuity ready
   > ^ <

🔎 交接狀態：<loaded / new install / resumed>
📌 目前目標：<current objective>
⚠️ 注意事項：<important boundary or none>
🚀 推薦下一步：<one recommended next action + short reason>
```

Keep the card short. Use plain Traditional Chinese labels in user-facing output. Use the full product name, not an abbreviation. The next-step line must name the recommended action, not only list possible work. If there are several valid paths, state the best first action and the reason; offer choices only when the user must decide.

## 2. Work Loop

Use this loop for every task:

1. PLAN: restate the user's intent, scope, risk, and acceptance criteria.
2. READ: inspect relevant files from `PROJECT_INDEX.md` and search for related definitions before editing.
3. CHANGE: make focused changes only.
4. QC: run available checks or state why they cannot run.
5. PERSISTENCE GATE: decide whether this task produced a durable fact before writing governance files. A durable fact is information the next agent cannot reliably reconstruct and that affects future action.
6. ARTIFACT GOVERNANCE GATE: if the task created or changed Markdown documents or other durable artifacts, verify they are indexed, synced, consolidated, or explicitly classified as temporary / one-time evidence before declaring completion.

External skill flows, subagents, task plans, or another tool's "finish" step do not replace this loop. If you use any of them, the PLAN must include a final Agent Handoff Kit persistence-gate check for the active project root, and completion cannot be claimed until that check is answered at the correct tier.

For high-risk work, pause after PLAN. High-risk means destructive operations, ambiguous target, external systems, release/publish, or broad multi-file change.

## 2.1 Persistence Gate

Use exactly one of these tiers after each task:

1. No persistence: choose this when the task produced no durable fact. Examples: one-off answers, active draft / image iterations not approved as final, routine successful checks that can be rerun, transient tool output, and ordinary progress that remains visible in the current chat.
2. Lightweight checkpoint: choose this when a durable fact exists and the session continues, when the agent may be interrupted before full closeout, or when uncertain whether the fact is durable. Write only the smallest correct home. Lightweight checkpoint is not full closeout: do not regenerate `START_NEXT_SESSION_PROMPT.txt`, do not show a closeout card, do not run full closeout maintenance, and do not reconcile every handoff section unless the fact itself requires it.
3. Full closeout: choose this only for explicit end-of-session / handoff intent, tool or day boundary, user-requested handoff, agent about to stop, or completed release / external sync / governance change that needs the next agent to continue from persisted state.

Task contract changes are durable facts when they affect future action. If the user adds or changes the product goal, requirements, development checklist, acceptance rules, exclusions, priority, or task scope during a long-running task, first reconcile those changes into one current task contract before continuing. If a dedicated spec, backlog, issue, runbook, or project document is already the authoritative home, update that home and cite it from `dev/SESSION_HANDOFF.md`; otherwise merge the current contract into `dev/SESSION_HANDOFF.md` under `Task Understanding Summary`, `Active Objective`, `Next Priorities`, and `Next Task Required Reading`. Do not scatter the same task contract across chat memory, log entries, draft docs, and startup prompts.

Route durable facts by file role:

- Current objective, recommended next action with reason, unresolved risk, blocker, or a fact needed at startup belongs in `dev/SESSION_HANDOFF.md`.
- Chronological evidence, command output, validation result, and research trace belongs in `dev/SESSION_LOG.md` when it affects future action or cannot be cheaply rerun. Routine successful checks that can be rerun are not durable facts.
- File maps, command maps, reference maps, source locations, and installed capability maps belong in `dev/PROJECT_INDEX.md`.
- Sync obligations across repositories, docs, mirrors, or external surfaces belong in `dev/DOC_SYNC_REGISTRY.md`.
- Long-term decisions, architecture trade-offs, durable rationale, and research-derived decisions belong in `dev/PROJECT_DECISIONS.md`. Use project decisions for long-term decisions that future agents may need to explain or revisit.
- Reusable operating procedures and practice-to-mechanism lessons belong in the relevant rule pack, registered reference, or QA check. Do not store reusable procedure knowledge only in handoff or log.

External Impact Note: if a task reads from, writes to, generates artifacts for, pushes, publishes, or updates anything outside the expected project root confirmed at startup, record one concise note per external target as soon as the external effect is complete; full closeout later reconciles the note. The note must state the target, action, status, read-back verification, what the next AI must not assume, and a safe evidence reference. Status must describe verified facts only: read-only, local impact, external sync with sync type, or unverified known impact. Do not scan sibling folders, infer unscanned targets are clean, write another workspace's handoff without explicit authorization, or use the note as permission to clean, stash, commit, push, publish, or release. If the target handoff was not updated, say so; if read-only material was summarized or persisted, say so without leaking secrets or private content.

Do not persist one-time delivery instructions, old hashes, old version facts, incident notes, routine green validation, or unapproved draft status as current state, next priorities, durable anchors, or startup instructions. If an involuntary stop is likely and a durable fact has not yet been written, make a lightweight checkpoint before stopping. If uncertain whether a fact is durable, choose lightweight checkpoint.

## 2.2 Upgrade Done Contract

`agent-handoff-kit upgrade` is considered complete only when all of the following hold. The CLI enforces this contract; do not declare upgrade success without it.

1. `AGENTS.md` health state is `clean`: exactly one `# Agent Handoff Kit Core Runtime` heading, exactly one paired managed-core marker block, and no unmarked stale core ranges. Sandwich states (managed marker plus an unmarked stale core) are not clean; the installer must replace the stale ranges, not skip.
2. The CLI runs `doctor` automatically against the upgraded root after writes complete. `doctor` must report `status: passed` across required files, anchors, schema checks, handoff lifecycle checks, and credential separation checks. A `START_NEXT_SESSION_PROMPT.txt` convenience-copy warning does not block upgrade health; that file is regenerated at full closeout.
3. The migration report records every action taken, with backup paths for merged files.

If any check fails, the upgrade did not finish; resolve the failure (or hand the failure output to the user) before reporting completion. This contract is the single source of truth for upgrade success; downstream QA scripts and release-grade QA derive their assertions from it.

## 3. Safety Boundaries

Do not delete, reset, overwrite, bulk-move, or publish without explicit user approval.

Do not guess commands, APIs, SDK behavior, deployment steps, or file ownership when project docs or official docs are needed. Mark unverified facts as unverified.

Do not modify unrelated files. If unexpected user changes appear, work with them or ask before touching them.

Do not claim completion without evidence from checks, inspection, or a clear explanation of what could not be verified.

## 4. Closeout And Handoff

Detect end-of-session or handoff intent in natural language, such as "收工", "Wrap up Agent Handoff", "closeout", "wrap up", or "handoff". If intent is ambiguous, ask one concise confirmation question.

Ambiguous closeout phrases need one concise confirmation question before full closeout. In particular, if the user says "<something> 收工", "<something> close", or similar wording that may refer to a real-world shift, event, project phase, or another context, ask whether they mean to wrap up Agent Handoff Kit and write the project handoff.

If the user sends only a clear closeout phrase such as "收工", "wrap up", "handoff", or "Wrap up Agent Handoff", do not answer with a summary-only message. Enter full closeout immediately: announce that Agent Handoff Kit closeout is starting, read the current handoff/log/index, reconcile state, write the required files, run the available checks, and only then show the closeout card. A final chat summary without updated handoff/log/prompt evidence is not closeout.

At full closeout:

Closeout Write Contract: before writing `dev/SESSION_HANDOFF.md`, `dev/SESSION_LOG.md`, or `START_NEXT_SESSION_PROMPT.txt`, classify each fact by role and write it to the matching structured area. Use one Agent Handoff Kit marker standard as the machine boundary: `ack:section:*` for sections, `ack:field:*` for fields, `ack:log-entry:start/end` for log entries, and managed-core BEGIN/END for the installed AGENTS core. Do not remove or translate these markers. New closeout writes must use this marker standard; natural-language headings are only human labels, and legacy heading fallback is only for migration / repair of older installs. Current state and next action go only in `dev/SESSION_HANDOFF.md`. Trace evidence, one-time tasks, old build / release / hash facts, and completed delivery details go only in `dev/SESSION_LOG.md` unless promoted to `dev/PROJECT_INDEX.md`, `dev/PROJECT_DECISIONS.md`, `dev/DOC_SYNC_REGISTRY.md`, or a rule pack. `START_NEXT_SESSION_PROMPT.txt` is regenerated from the handoff opening-message block; do not hand-write separate startup state there.

1. Reconcile `dev/SESSION_HANDOFF.md`. Do not append a new state snapshot under old state. Verify `Durable Anchors`, then rewrite or explicitly confirm every section under `Closeout-Reconciled State`.
2. Add a concise entry to `dev/SESSION_LOG.md` with work actually completed this session and the exact next-session opening message.
3. Update `dev/PROJECT_INDEX.md` if files, stack, commands, entry points, workspace identity, or durable document map changed.
4. Check `dev/DOC_SYNC_REGISTRY.md` and record required sync status.
5. Record unresolved drift risk, active worktree, parallel workspace, uncommitted changes, or blocked verification.
6. Complete the `State Reconciliation Check`: it must state when reconciliation happened, which state sections were rewritten or confirmed current, whether stale snapshots remain, whether the `Persistence routing checked` field is complete, whether completed / pending / risk / opening-message lifecycle conflicts were resolved, whether the recommended next step is explicit and reasoned, and whether the opening message matches current state. In the same step, run the handoff lifecycle consistency check before declaring handoff ready: compare `Completed This Session`, `Validation / QC`, `Next Priorities`, `Risks / Blockers`, and `Next Session Opening Message`. A completed or verified item must not remain as an unresolved next priority, active risk, or startup instruction unless it is explicitly reclassified as monitor-only, follow-up scope, blocked, or reopened with the missing evidence or trigger condition stated.
7. Run the handoff sufficiency check: the next AI should be able to continue from `AGENTS.md`, `dev/SESSION_HANDOFF.md`, `dev/PROJECT_INDEX.md`, and needed rule packs without searching old log history.
8. If either check fails, fix `dev/SESSION_HANDOFF.md` first; do not push current-state responsibility into `dev/SESSION_LOG.md`.
9. Regenerate `START_NEXT_SESSION_PROMPT.txt` from the fenced opening message in `dev/SESSION_HANDOFF.md`, then read it back or run the project's prompt mirror check before declaring closeout ready. `dev/SESSION_HANDOFF.md` is authoritative; `START_NEXT_SESSION_PROMPT.txt` is the stateful startup prompt that the next local agent must read. During an active session, do not regenerate it just to silence `doctor`; normal `doctor` may warn about drift, but closeout must make the copy match before handoff is declared ready.
10. Show a short closeout card, then provide the next-session startup entry in a fenced `text` code block. Primary entry, when the next local AI agent is already opened at this project root: `Start Agent Handoff` / `開工`. Fallback entry, when the next AI agent is not yet pointed at the project root: `Work in <project root>. Read AGENTS.md first, then Start Agent Handoff. Before changing anything, tell me the current state and your recommended next step.` Do not compose a separate stateful final-response prompt; the final response points to the persisted prompt file, not a third source of truth.
11. Run the closeout maintenance trigger check. This is a short required check, not a full maintenance pass every time. Record the result in the new `dev/SESSION_LOG.md` entry under `Log maintenance`.

    Hard triggers:

    (a) Advance the SESSION_LOG N-rule (R-010 SESSION_LOG handoff-role discipline) when `dev/SESSION_LOG.md` reaches N ≥ 11 entries, or when the main log exceeds 1500 lines. If triggered, move N ≥ 11 entries into `dev/SESSION_LOG_archive/archive_<batch>_<low_date>_to_<high_date>.md` with raw content preserved, maintain `dev/SESSION_LOG_archive/INDEX.md`, collapse absorbed N=4–10 entries to short-index lines, and port any unique narrative into the relevant durable source before collapsing it. If a research trail affected a long-term decision, public claim, strategy, governance rule, or material selection, port its evidence chain into `dev/PROJECT_DECISIONS.md` using that file's research-derived decision format before collapsing the log. Handoff capability rests on `dev/SESSION_HANDOFF.md`; `dev/SESSION_LOG.md` is trace-back / audit trail and does not carry handoff responsibility.

    (b) Maintain `dev/PROJECT_DECISIONS.md` per R-028 project narrative discipline when `dev/SESSION_HANDOFF.md` contains a decisions-like H2 section, for example `## Confirmed Decisions`, `## Decisions`, or a localized equivalent, with a numbered list of at least 30 entries. If triggered, split the oldest entries, retaining the most recent 8-22 in the handoff hot tier, into `dev/PROJECT_DECISIONS.md` `## Decisions Archive`, newest first.

    (c) Append to `dev/PROJECT_DECISIONS.md` immediately, or at closeout, when the current session includes substantive task evolution, a multi-option architectural trade-off with recorded rationale, a cross-session accumulated pattern, or a user retrospective question. Use `## Evolution Timeline`, `## Architecture Choices`, or `## Insights & Learnings` as appropriate. If the decision is research-derived, use that file's evidence-chain format so the source, summary, inference, decision impact, and uncertainty survive future compression.

    (d) Run a full long-term maintenance pass every 10 closeouts as a backstop, even if no trigger seems obvious. Count closeouts from the main `dev/SESSION_LOG.md` entries plus archive index entry counts when an archive exists; if the count cannot be determined confidently, treat the current N=10 boundary as the backstop trigger.

    If none of the hard triggers, semantic triggers, or 10-closeout backstop applies, write a one-line no-op reason and do not perform full long-term maintenance. This keeps routine closeout fast while still preventing silent drift.

Installed handoff templates use English headings by default for cross-tool stability, but project teams may translate `dev/SESSION_HANDOFF.md` section headings and visible field labels into the project's working language. Keep the `ack:section:*` and `ack:field:*` semantic markers intact; `doctor` validates those markers so localized handoff notes remain supported.

Use this closeout card:

Use the same display version rule as startup: take the version from `dev/PROJECT_INDEX.md` `## Stack` row `Agent Handoff Kit template version`, print it as `vX.Y.Z`, and fall back to `version unverified` only when it cannot be verified. Never print the literal placeholder `v<version>`.

```text
   /\_/\   Agent Handoff Kit v<version>
  ( -.- )  handoff saved
   > ^ <

✅ Done: <completed summary>
🔎 QC: <validation summary>
📌 Handoff: opening message ready
⚠️ Boundary: <important boundary or none>
```

In `dev/SESSION_HANDOFF.md`, immediately before the fenced `Next Session Opening Message` content, write:

```text
📋 Next session: agent-managed startup content below
```

Record only work actually performed in the current session. Do not copy old completed work forward as new work.
`dev/SESSION_HANDOFF.md` carries continuity. `dev/SESSION_LOG.md` carries recent evidence. Archive old detail only when needed; do not create an archive directory by default.
Do not declare handoff ready if `dev/SESSION_HANDOFF.md` still contains stale state, unreconciled placeholders in current-state sections, or an opening message that no longer matches the reconciled state.

## 5. Pack Loading

Use `dev/RULE_PACKS.md` to decide which pack to read.

A pack may add task-specific requirements. A pack cannot weaken core safety. If two packs conflict, choose the safer and more verifiable path, then record the conflict in closeout.

When a task references external tools (Notion / Google Drive / Slack / Linear / GitHub / Dropbox / HubSpot / Atlassian / etc.) or `dev/PROJECT_INDEX.md` `## Installed Integrations` is non-empty, load `dev/rules/integrations.md` together with the relevant domain pack. The integrations pack covers Connector-first defaults, credential separation, multi-layer source-of-truth architecture, and cross-session resilience for declared integrations.

After the task, apply the Persistence Gate in Section 2.1. Do not assume the next session remembers pack context unless it is recorded, and do not treat handoff/log persistence as sufficient for reusable procedure knowledge.

If a pack, skill, subagent plan, demo workspace, or external workflow produces its own closeout, treat it as subordinate evidence. The active project root still needs the Section 2.1 persistence-gate decision before the task is complete.

## Core Complexity Rule

New default-core rules are allowed only when they apply to most sessions, protect safety or continuity, cannot live in a pack or registry, and keep the core within budget.
<!-- END Agent Handoff Kit managed core -->
