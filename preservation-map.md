# Agent Continuity Kit Preservation Map

This document maps original public value to Agent Continuity Kit treatment.

| Original capability | Agent Continuity Kit treatment | Reason |
|---|---|---|
| Session startup continuity | Keep in core | Main value: AI does not start from zero. |
| `SESSION_HANDOFF.md` | Keep in core | Current state must be immediately available. |
| `SESSION_LOG.md` latest entry | Keep in core | History and prior handoff remain necessary. |
| Project context / file map | Keep as `PROJECT_INDEX.md` | Coding and multi-folder projects need stateless file awareness. |
| Doc sync checklist | Keep as `DOC_SYNC_REGISTRY.md` | Needed for systematic development, but should be a registry not long prose. |
| PLAN -> READ -> CHANGE -> QC -> PERSIST | Keep in core as short execution loop | Fixed AI thinking process is core value. |
| File safety | Keep short baseline in core; move details to safety pack | Public-user safety boundary must always exist, but detailed OS / tools rules should load only for high-risk work. |
| Root safety install checks | Keep in installer, not session core | Critical during install only. |
| Section-aware merge | Keep in installer | Needed for upgrades and user customizations. |
| Multi-AI handoff | Keep in core | Public site value: quota switch and agent handoff. |
| Compact session logs | Keep in core with simple budget | Prevent governance history from becoming context bloat. |
| Wizard system | Split to onboarding pack | Useful but not every session. |
| External knowledge surface | Split to knowledge pack | Only relevant when user uses external notes/specs. |
| External API / SDK / CLI safety | Split to safety pack | Relevant to external systems and data-loss risk, not only coding. |
| Release / publish gate | Split to release pack | Rare for writing/research sessions. |
| Patch-only format | Split to coding/change-delivery pack | Needed for file/spec edits, not every conversation. |
| Detailed reply style rules | Split to communication pack; keep a short plain-language rule in core | Prevents internal codes leaking while avoiding long examples in core. |
| Visual boot/closeout cues | Keep as short core UX | The startup and closeout card helps users recognize continuity state without adding heavy runtime rules. |
| Repo-internal worktree cleanup | Retire from public runtime | Development-only concern for this repo. |
| Harness check IDs and internal regression names | Retire from public runtime | Maintainer-only detail. |

## Hard Preservation Line

Agent Continuity Kit may reduce rule text, but must not remove these outcomes:

1. AI knows current project state at startup.
2. AI knows what files and directories matter.
3. AI knows what not to delete or overwrite.
4. AI verifies work before claiming completion.
5. AI records a useful handoff for the next session.
6. AI updates sync registries when file structure or docs change.
