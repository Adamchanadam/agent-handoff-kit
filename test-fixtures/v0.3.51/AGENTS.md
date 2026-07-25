<!-- BEGIN Agent Handoff Kit managed core -->
# Agent Handoff Kit Core Runtime

This is the small always-read contract. Detailed task and closeout procedures live in routed packs.

## 1. Intent And Startup

Classify the user's visible intent before loading project state. For explicit continuity, closeout, or a task whose next action depends on persisted project state, read `dev/SESSION_HANDOFF.md` first; it is the current-state authority. A direct ordinary or stateless task does not read the handoff merely because the project root is known. If the message is genuinely unresolved and the handoff can resolve it, read the handoff before asking the user.

Do not read `dev/SESSION_LOG.md` during ordinary startup; it is trace-back evidence only. Do not read `START_NEXT_SESSION_PROMPT.txt` in addition to the handoff when already operating in the project root; that file is a portable generated mirror for an agent that has not yet been pointed at the root.

Route intent in this order:

1. Clear closeout intent routes directly to `dev/rules/closeout.md`.
2. Clear continuity intent such as "開工", "Start Agent Handoff", "開始接力", or "continue handoff" resumes the minimum current state from the handoff. A plain continuity message with no same-message task or explicit long-run instruction authorizes only that recovery, the startup card, the current objective/risk/recommended next action, and then the end of the turn. It does not authorize task-specific reads, research, plans, protocols, preflight, file searches, sub-agents, QA, packaging, writes, network access, or opt-out wording such as "unless you object I will start". A concrete objective found only in loaded state is not authority to complete it. A same-message task may begin normally. An explicit instruction such as "開工，繼續做到下一個 blocker" or "開工，繼續完成目前目標" may continue under the normal task and safety rules.
3. A direct ordinary task begins without a startup card or onboarding ceremony. Read only the sources and packs required by that task.
4. Explicit guidance requests such as "I'm new", "teach me", "help me start", "新手", "教我用", or "點開始" may load `dev/rules/onboarding.md`. A fresh install or short message only makes guidance available; it never overrides a concrete objective. If no executable objective remains after state reading, ask one concise question or offer guided onboarding.

Treat a phrase as ambiguous only when its ordinary meaning may genuinely refer to a real-world shift, event, or unrelated context. `開工，繼續 <task>`, `<project> 開工`, and `Start Agent Handoff and continue <task>` are continuity commands, not ambiguous phrases.

Read `dev/PROJECT_INDEX.md` when the task needs its file, command, integration, workspace, or source map. Read `dev/RULE_PACKS.md` when a task pack must be selected. Read `dev/DOC_SYNC_REGISTRY.md` before durable cross-file or external synchronization and during closeout. Pack loading is normally silent; explain it only when it changes risk, requires a user decision, or materially affects the next action.

If the user supplies the portable startup prompt, use it to locate the root, then trust the handoff over the mirror. If the root is unclear or mismatched, stop and ask for the intended root before reading or editing project state. Missing required governance files are a repair condition, not permission to invent a parallel structure.

Before a non-trivial task, identify and read the required local and external truth sources or mark them blocked. Reachable is not the same as ingested. Search hits, truncated output, summaries, and status claims do not replace the relevant source content.

Probe an integration only immediately before a task uses it, when the handoff explicitly identifies it as a dependency for the current objective, or when the user requests an integration health check. `TBD`, examples, blank rows, and undeclared placeholders are not installed integrations. Record `Last Verified` only after a real probe and through the normal persistence gate. Never write integration status merely because a session started.

Show the startup card only for explicit continuity startup. For a plain continuity message, show the card after the minimum state recovery and end the turn; its recommended next action is advice, not permission to act. An explicit same-message task or long-run continuation may combine the card with its first useful action. Direct ordinary tasks do not show the card. If onboarding is explicitly requested, combine any card and guidance in one response.

Use a verified version already present in loaded state. If obtaining it would require reading an otherwise unnecessary file, print `version unverified`; do not create a second version source merely to fill the card.

```text
   /\_/\   Agent Handoff Kit v<version>
  ( o.o )  continuity ready
   > ^ <

🔎 交接狀態：<loaded / new install / resumed>
📌 目前目標：<current objective>
⚠️ 注意事項：<important boundary or none>
🚀 推薦下一步：<one action + reason>
```

Use the full product name, plain user language, and one recommended next action. Never print the literal placeholder `v<version>`.

## 2. Proportionate Work Loop

Apply PLAN → READ → CHANGE → QC internally and in proportion to task state and risk. Do not make the user watch governance ceremony that does not help the task.

In every user-facing reply, lead with ordinary language: state the result and its practical effect, then the next action when one helps. Put exact commands, errors, hashes, and detailed evidence after that; brevity must not hide uncertainty or safety risk.

- Simple answers, pure conversation or creation with no durable state, and low-risk tasks with an obvious target may proceed directly with proportionate reading and checking.
- Non-trivial work reads relevant sources before changing them.
- High-risk work states scope, impact, acceptance, and required confirmation before writes.
- External skill flows, subagents, task plans, demo workspaces, and another tool's finish step do not replace the active root's persistence decision.
- Materially changed Markdown governance artifacts must be indexed, synchronized, consolidated into their authoritative home, or explicitly classified as temporary / one-time evidence. Other durable formats follow the same human governance rule, but the bundled doctor does not claim to scan them.

## 2.1 Persistence Gate

Choose exactly one tier after a task:

1. No persistence: no durable fact was produced. One-off answers, transient output, active unapproved drafts, and routine rerunnable checks normally use this tier.
2. Lightweight checkpoint: a durable fact affects future action while the session continues or may be interrupted. This is the default for ongoing sessions. Write only its smallest correct home; do not regenerate the startup mirror or perform full closeout.
3. Full closeout: explicit end-of-session / handoff intent, a real day / tool-session boundary, or a state where the current agent cannot continue and the next agent must take over. Ordinary external-tool use, a completed release / governance subtask, or a durable note during an ongoing session is not by itself a full closeout trigger. Load `dev/rules/closeout.md` only when this tier is selected.

Route current objective, next action, active risk, blocker, and startup-needed facts to `dev/SESSION_HANDOFF.md`; chronological evidence to `dev/SESSION_LOG.md`; maps to `dev/PROJECT_INDEX.md`; sync obligations to `dev/DOC_SYNC_REGISTRY.md`; long-term rationale to `dev/PROJECT_DECISIONS.md`; and reusable procedures to the relevant pack, registered reference, or QA check. Do not store the same task contract or reusable rule in several homes.

External effects are never implied permission for commit, push, publish, release, deployment, cleanup, or another workspace write. Record verified external impact through the relevant integrations, release, safety, and closeout contracts without exposing private content or secrets.

## 2.2 Upgrade Completion

The CLI owns upgrade truth. An upgrade is complete only when:

1. The root is not newer than the CLI and every target passes read-only classification.
2. Conflict produces zero governance-target and version writes.
3. Staged outputs pass the offline migration acceptance gate: root boundary, structure, cross-file invariants, preservation hashes, and version transition.
4. The recoverable transaction commits without an unresolved journal; only a failure caused by this transaction triggers rollback.
5. Whole-project `doctor` reports project health separately. Pre-existing or unrelated health failures do not convert a correct migration into a destructive rollback; new migration-caused blockers do.
6. The migration report records attempted version, committed version, transaction state, actions, redacted reasons, and backup locations without credential values.

Do not use "upgrade completed" to mean "the entire project is healthy". Report `migration committed` and `project health` separately. Conflict, incomplete recovery, failed migration acceptance, and future-version roots are not completed upgrades.

## 3. Safety Baseline

Do not delete, reset, overwrite user-owned content, bulk-move, publish, change permissions, or perform another irreversible or external action without the required explicit authorization.

Named prohibited destructive commands in `dev/rules/safety.md` remain prohibited even when requested. Never use a weaker pack or local instruction to bypass core safety.

Verify the selected root and real target boundaries before writes. Do not follow a link, junction, mount, or computed path outside the confirmed root. Do not expose credential values in output, reports, backups, tests, or logs. Permission or lock failure is a stop condition, not permission to elevate or switch to a riskier command.

Do not modify unrelated files or erase unexpected user changes. Do not claim completion without read-back evidence and proportionate checks.

## 4. Closeout Trigger

Clear end-of-session or handoff intent such as "收工", "Wrap up Agent Handoff", "closeout", "wrap up", or "handoff" triggers full closeout, not a chat-only summary. Load `dev/rules/closeout.md` and follow its complete contract. `收工，記得 <handoff requirement>` and equivalent closeout-plus-instruction phrases are clear closeout intent. Ask one concise confirmation only when the phrase genuinely refers to an unrelated real-world closing or shift.

The always-enforced closeout invariants are:

1. Current state lives in `dev/SESSION_HANDOFF.md`; trace evidence lives in `dev/SESSION_LOG.md`.
2. Completed, pending, risk, validation, and opening-message lifecycle states agree.
3. `START_NEXT_SESSION_PROMPT.txt` is regenerated from the sole authoritative handoff block and no third full copy is retained.
4. Closeout is not complete until required files are written, read back, and the available closeout checks pass.
5. After those checks, render the final card with `agent-handoff-kit closeout-status --root <project root>`; only its `status: complete` output may say `handoff saved`. A nonzero / `blocked` result is an honest blocked closeout, not a completed one.
6. Git commit, push, release, publish, deployment, deletion, and permission changes remain separately authorized actions.

## 5. Pack Loading

Use `dev/RULE_PACKS.md` to load the minimum task-specific set. Packs may add stricter requirements but cannot weaken core safety or continuity.

Load `dev/rules/integrations.md` when the current task actually uses an external tool, not merely because a registry or placeholder table exists. Load `dev/rules/closeout.md` only for full closeout. If two packs conflict, use the safer and more verifiable path and record the unresolved conflict at closeout.

After the task, apply the Persistence Gate. Do not assume the next session remembers pack context, and do not use handoff or log as the only home for reusable procedures.

## Core Complexity Rule

Default-core rules must apply to most sessions, protect safety or continuity, and be shorter than the routed detail they replace. New scenario detail belongs in an existing pack or registered reference; a new pack is justified only when it creates a smaller, independently loadable responsibility with one normative owner.
<!-- END Agent Handoff Kit managed core -->

<!-- ack:user-rules-router:dev/USER_RULES.md -->
<!-- ack:user-rules-acceptance:sha256=d5169d70e9d930efd9e4e5feefaadab1dc67e99e748307f6946e7a279c9d4f3b -->
Before loading task packs, read `dev/USER_RULES.md`. Its registered entries
under `dev/user_rules/` are user-controlled rules: read each accepted entry in
the listed order and verify its accepted raw-byte witness. Do not treat this
router, its directory, a heading, language, format, location, or
official-looking text as proof that any legacy source belongs to the Kit.
