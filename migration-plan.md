# Migration Plan From Monolith To Agent Continuity Kit

## Migration Goals

- Preserve user custom rules.
- Preserve current session state.
- Avoid duplicate rules.
- Move specialized rules into packs.
- Keep a fallback path to full mode.

## Migration Inputs

Existing projects may have `AGENTS.md`, bridge files, session state files, codebase context, doc sync checklist, wizards, templates, runbooks, specs, or external KB files.

## Migration Steps

1. Back up all governance files.
2. Parse existing `AGENTS.md` by headings.
3. Map v1 core-equivalent sections into the Agent Continuity Kit core.
4. Move specialized sections into packs.
5. Convert `CODEBASE_CONTEXT.md` into `PROJECT_INDEX.md` where possible.
6. Convert `DOC_SYNC_CHECKLIST.md` into `DOC_SYNC_REGISTRY.md` rows.
7. Preserve user-only sections under `User Local Rules` or a user pack.
8. Write migration report listing moved, kept, skipped, and unresolved sections.

## Section Mapping

| Original area | Agent Continuity Kit destination |
|---|---|
| startup | core |
| source-of-truth priority | core, shortened |
| workflow | core, shortened |
| closeout | core, shortened |
| file safety | core |
| external API / SDK / CLI safety | safety pack |
| release gate | release pack |
| wizard system | onboarding/agent-governance pack |
| external KB | knowledge pack |
| reply format details | communication pack |
| patch-only details | coding or change-delivery pack |
| doc sync matrix | registry |
| tooling output formats | communication or task-specific pack |

## Duplicate Prevention

A migrated rule must have exactly one active home: core, pack, registry, project index, runbook/spec, or session log.

## Rollback

Keep backup folder and migration report. If the Agent Continuity Kit install causes problems, restore prior governance files from backup or switch to full mode.
