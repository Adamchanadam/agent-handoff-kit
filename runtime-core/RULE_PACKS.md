# Rule Packs Router

Read only the packs needed for the current task.

| Task signal | Pack | Purpose |
|---|---|---|
| Destructive file operations, shell writes, Git state changes, package managers, installers, deploy, release, cloud tools, external APIs, credentials, locked files, permission errors | `dev/rules/safety.md` | safety checks for data loss, external systems, secrets, and high-risk operations |
| Code, tests, build, package manager, SDK, CLI, API | `dev/rules/coding.md` | development workflow and verification |
| Draft, edit, style, publication content | `dev/rules/writing.md` | writing workflow and tone control |
| Sources, evidence, comparison, fact finding | `dev/rules/research.md` | source handling and uncertainty |
| Governance, prompts, agents, handoff, startup/closeout, skills | `dev/rules/agent-governance.md` | governance changes and boundary control |
| Release, publish, deploy, tag, hotfix, GA | `dev/rules/release.md` | release verification and evidence |
| External notes, knowledge base, Notion, Obsidian, Drive | `dev/rules/knowledge.md` | external knowledge source integration |
| Reply format, language, output schema | `dev/rules/communication.md` | user-facing response rules |

## Routing Rule

Load the minimum set. If uncertain, load the narrower pack first. If a task clearly involves safety risk plus another domain, load `dev/rules/safety.md` with the relevant domain pack and state why. Packs can add stricter rules, but cannot weaken core safety or closeout requirements.
