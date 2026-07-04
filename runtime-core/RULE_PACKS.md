# Rule Packs Router

Read only the packs needed for the current task.

| Task signal | Pack | Purpose |
|---|---|---|
| First-time user signals: "I'm new" / "new user" / "teach me" / "help me start" / "first time" / "I just installed" / "how do I start" / "show me how" / "getting started" / "what can agent handoff kit do" / vague first message <= 30 chars / HANDOFF Active Objective empty + Session count 1 (fresh installation context). Also recognize equivalent Chinese user phrases such as "新手", "教我用", "我剛安裝", "點開始", "開工", and "能力". | `dev/rules/onboarding.md` | first-time user walk-through with 6 scenarios (A build / B research report / C knowledge base / D learning to code / E custom / F external-tool governance) x 5-step pattern (confirm context / explain fit / ask task scope / suggest minimum viable task / confirm + transition); load proactively when signal present; transient pack, unload after onboarding completion |
| Destructive file operations, shell writes, Git state changes, package managers, installers, deploy, release, cloud tools, external APIs, credentials, locked files, permission errors | `dev/rules/safety.md` | safety checks for data loss, external systems, secrets, and high-risk operations |
| Code, tests, build, package manager, SDK, CLI, API | `dev/rules/coding.md` | development workflow and verification |
| Draft, edit, style, publication content | `dev/rules/writing.md` | writing workflow and tone control |
| Sources, evidence, comparison, fact finding | `dev/rules/research.md` | source handling and uncertainty |
| Governance, prompts, agents, handoff, startup/closeout, skills | `dev/rules/agent-governance.md` | governance changes and boundary control |
| Governance bridge / bridge governance / connect this document to governance / scan for unbridged governance documents. Also recognize equivalent Chinese user phrases such as "治理打通", "把文件接入 Agent Handoff Kit", "接入 Agent Handoff Kit", and "掃描未接入 Agent Handoff Kit 的重要文件". | `dev/rules/agent-governance.md` | connect important files, source-of-truth documents, runbooks, workflows, checklists, and guides to the project index, sync registry, handoff/log roles, and related workflows without creating duplicate sources of truth |
| Long-term governance routing / future sessions should remember / always use this API or MCP pattern. Also recognize equivalent Chinese user phrases such as "寫入長期治理", "轉成長期機制", "之後都要遵守", and "跨 session 有效". | `dev/rules/agent-governance.md` | classify durable non-file knowledge by role and store it in the right home: rule pack, registered reference, project index, sync registry, project decisions, or QA check; do not leave reusable governance only in session log or handoff |
| Release, publish, deploy, tag, hotfix, GA | `dev/rules/release.md` | release verification and evidence |
| External notes, knowledge base, Notion, Obsidian, Google Drive | `dev/rules/knowledge.md` | external knowledge source integration |
| External tool integrations (Connector / MCP / Plugin / Skill) — declared in `## Installed Integrations`; tasks involving Notion / Google Drive / Slack / Linear / Dropbox / HubSpot / GitHub / etc. external read-write | `dev/rules/integrations.md` | Connector-first default + credential separation + multi-layer source-of-truth + cross-session resilience |
| Runtime-controlled tool operation / browser UI validation / visual QA / screenshot / Chrome / Playwright / DevTools / desktop app automation / crawler or scraper / notebook or data runtime / raw CLI, SDK, tool server, MCP, plugin, or local helper operation | `dev/rules/integrations.md` + `dev/rules/safety.md` (add `dev/rules/coding.md` only when changing code, tests, or project scripts) | verify the active runtime capability, current schema, official docs, or registered tool operation reference before invocation; block or use a manual packet when unavailable; preserve ownership and cleanup boundaries |
| External tool resource pressure / stale MCP process / plugin service leak / browser automation left running / cache growth after external tools / slowdown after MCP, plugin, browser, crawler, notebook, or local helper services | `dev/rules/integrations.md` + `dev/rules/safety.md` | ownership-based external-tool resource closeout; task-owned cleanup allowed; shared or ambiguous remediation requires exact evidence and confirmation |
| Reply format, language, output schema | `dev/rules/communication.md` | user-facing response rules |

## Routing Rule

Load the minimum set. If uncertain, load the narrower pack first. If a task clearly involves safety risk plus another domain, load `dev/rules/safety.md` with the relevant domain pack and state why. Packs can add stricter rules, but cannot weaken core safety or closeout requirements.
