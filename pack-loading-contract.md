# Pack Loading Contract

## Purpose

Rule packs let Agent Continuity Kit support specialized work without making every session pay the cost of every rule.

## Trigger Model

| Pack | Trigger examples |
|---|---|
| `coding.md` | code changes, tests, build, package manager, API/SDK/CLI work |
| `writing.md` | drafting, editing, style, publication text |
| `research.md` | source gathering, evidence comparison, fact synthesis |
| `agent-governance.md` | modifying governance, prompts, skills, handoff systems |
| `release.md` | publish, deploy, tag, release note, GA, hotfix |
| `knowledge.md` | external notes, knowledge base, Notion, Obsidian, Drive |
| `communication.md` | reply style, output schema, language behavior |

## Loading Rules

1. Load the minimum pack set.
2. State which pack was loaded and why.
3. Pack rules apply only to the current task unless persisted into project files.
4. A pack may require reading more files, but must not force all packs to load.
5. A pack may not redefine core safety rules; it can only add stricter task-specific rules.
6. If two packs conflict, choose the stricter safety/verifiability rule and record the conflict in closeout.

## Pack Exit

After task completion, do not carry pack context forward implicitly. Persist only durable facts: changed files, updated commands, new risks, new docs to sync, next steps, and check evidence.

## Anti-Bloat Rule

If a proposed pack rule applies to fewer than two task classes, it must remain in a pack. If it applies to one project only, it belongs in `PROJECT_INDEX.md`, a runbook, or troubleshooting notes, not in reusable governance.
