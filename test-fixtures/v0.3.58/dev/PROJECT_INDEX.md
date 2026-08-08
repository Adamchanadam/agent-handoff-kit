# Project Index

Purpose: give a stateless AI a compact map of the project before it reads or edits files.

## Stack

| Field | Value | Last verified |
|---|---|---|
| Agent Handoff Kit template version | 0.3.58 | current template version |
| Runtime | TBD | TBD |
| Framework | TBD | TBD |
| Package manager | TBD | TBD |
| Test command | TBD | TBD |
| Build command | TBD | TBD |
| Deploy command | TBD | TBD |

## Directory Map

| Path | Role | Read when |
|---|---|---|
| `AGENTS.md` | primary Agent Handoff Kit entry and startup contract | session startup |
| `CLAUDE.md` | Claude Code bridge to the same startup path | Claude Code startup |
| `GEMINI.md` | Google Antigravity CLI / Gemini CLI migration bridge to the same startup path | Antigravity / Gemini startup |
| `START_NEXT_SESSION_PROMPT.txt` | portable generated mirror of the handoff opening-message block; `dev/SESSION_HANDOFF.md` remains authoritative | fallback when the next agent is not yet operating in this root; not an additional local startup read |
| `src/` | application source | coding task |
| `tests/` | tests | coding/QC |
| `docs/` | user or product docs | doc/public behavior change |
| `dev/` | governance state | read the handoff at startup; other files are task-routed or closeout-routed |
| `dev/rules/closeout.md` | full closeout contract | clear end-of-session or handoff intent only |
| `TBD` | local source-of-truth files | before tasks that depend on project facts |
| `TBD` | external-source indexes or mirrors | before research, writing, or knowledge-sync tasks |

## Entry Points

| Entry | Path | Notes |
|---|---|---|
| App entry | TBD | TBD |
| Main config | TBD | TBD |
| Test suite | TBD | TBD |
| Runbook | TBD | TBD |
| Public docs | TBD | TBD |
| Durable artifact review | `dev/PROJECT_INDEX.md` + `dev/DOC_SYNC_REGISTRY.md` | After creating docs, generated outputs, specs, runbooks, checklists, research notes, or other durable artifacts, classify each file as indexed / synced / temporary / one-time evidence before completion; doctor validates explicit Kit contracts and formal typed user-rule paths only, not arbitrary project artifacts |

## Fact Base

Reachable means the source can be found. It does not mean the source has been read in this session.

| Source | Role | Required before | Access method | Last verified |
|---|---|---|---|---|
| TBD | local source of truth / reference / draft / archive | TBD | path or instruction | TBD |

## External Sources

| Source | Role | Required before | Access method | `via` | Write-back rule | Last verified |
|---|---|---|---|---|---|---|
| TBD | source of truth / mirror / index / attachment store | TBD | URL, connector, or manual packet | `Notion Connector` / `Google Drive Connector` / `manual paste` / etc — must match an entry under `## Installed Integrations` | read-back required / manual only / no write | TBD |

> `via` column discipline: every External Sources row must reference an entry name under `## Installed Integrations`, such as `Notion Connector` or `Google Drive Connector`, so the access path is explicit. Sources without a declared integration use `manual paste`. Doctor and release QA enforce cross-section consistency.

## Installed Integrations

> **Credential Separation Principle**: this section records only project usage and public reference coordinates such as Notion database names, URLs, or folder paths. It must never record API keys, OAuth tokens, or credential values. Credentials belong in AI runtime secure storage, OS credential stores, tool configuration, or user-managed secret stores. If an environment variable is used, record only the variable name, never the value. Before writing this section, self-check that no credential value is being persisted. Doctor scans this section, `SESSION_HANDOFF`, and `SESSION_LOG` for common credential prefixes such as `sk-`, `ntn_`, `ya29.`, `xoxp-`, `ghp_`, `sl.`, `AKIA`, and `AIza`.

> Purpose: tasks that use external tools read this section to understand declared capabilities and project roles. Declarations persist across sessions. A new session does not probe this table merely because it exists. `TBD`, examples, blanks, and placeholder-only rows are not installed integrations. Every real entry includes `Declared` and `Last Verified` so capability assumptions can be checked immediately before use.

### Connectors

| Tool | Project Usage | Access Scope | Specific Instance | Credential Reference (no value) | Declared | Last Verified |
|------|---------------|--------------|-------------------|---------------------|----------|---------------|
| TBD | TBD, for example an index of source paths or persistent reference storage | read / read+write | TBD, for example database name + URL or folder path | TBD, for example `AI tool secure storage` / `OS credential store` | TBD | TBD |

### MCPs

| Server | Source | Project Usage | Credential Reference (no value) | Declared | Last Verified |
|--------|--------|---------------|---------------------|----------|---------------|
| TBD | TBD, for example GitHub repository URL | TBD | TBD, for example `tool config + env var name only` / `user-managed secret store` | TBD | TBD |

### Plugins

| Name | Bundle Content (Skills + MCP + hooks) | When Triggered | Last Verified |
|------|----------------------------------------|----------------|---------------|
| TBD | TBD | TBD | TBD |

### Skills

| Name | Source | When Triggered | Last Verified |
|------|--------|----------------|---------------|
| TBD | TBD, for example plugin bundle or user-level install | TBD | TBD |

### Source-of-truth Architecture

> When a project uses several integrations as a source-of-truth system, for example Notion index + local primary sources + Google Drive reference mirror, this table records each layer's role so agents do not cross write boundaries.

| Layer | Surface (specific instance) | Role | Write Direction |
|-------|--------------------------|------|-----------------|
| Source of truth | TBD, for example local `~/project/reference/` | Original auditable reference content | User-controlled placement; agent does not write directly unless explicitly authorized |
| Index | TBD, for example Notion database `Project Index` | Metadata, summaries, and tags for each source file | Agent may read/write through a verified Connector |
| Persistent mirror | TBD, for example Drive folder `Project Reference/` | Backup or cross-device reference mirror | User-controlled sync by default; agent does not push automatically |
| Working draft | TBD, for example local `~/project/output/` | Agent task output | Agent may read and write local files under normal safety rules |

## Tool Operation References

Use this section for project-local runbooks or verified procedures for runtime-controlled tools such as browser validation, screenshots, DevTools, Playwright, crawlers, notebooks, desktop app automation, MCP/plugin helpers, or raw CLI/SDK operations.

Do not store credential values or machine-private paths here. Local machine-only references may be listed only when the project explicitly depends on them, and the scope / limits must say they are not portable.

| Tool / operation | Reference path or URL | Required before | Source and version/date | Scope and known limits | Last verified |
|---|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD | TBD |
| Local HTML / app browser validation | TBD, for example project runbook or official browser-tool docs | Before validating local HTML, static app, generated guide, screenshot, click flow, or visual QA | TBD, include source and date | Prefer short-lived loopback localhost service when `file://` is blocked; record click/text/screenshot evidence and cleanup result; do not mutate user browser profiles or extension state | TBD |

## Local QC Commands

| Check | Command | Run before | Last verified |
|---|---|---|---|
| Agent Handoff Kit doctor | `npx --yes @adamchanadam/agent-handoff-kit@latest doctor --root .` | closeout / Kit contract health / explicit registered-path checks | package latest |
| Project governance check | Check newly created durable artifacts against `dev/PROJECT_INDEX.md` and `dev/DOC_SYNC_REGISTRY.md`; register, sync, consolidate, or explicitly classify as temporary / one-time evidence. This is an AI responsibility, not a root-discovery doctor scan. | closeout / durable file changes | unverified until project-specific command exists |

## Workspace Identity

Record this at closeout so the next AI can detect wrong-root or workspace drift.

| Field | Value | Last verified |
|---|---|---|
| Expected project root | TBD | TBD |
| Git root | TBD | TBD |
| Branch / commit | TBD | TBD |
| Worktree or parallel workspace | TBD | TBD |
| Uncommitted change summary | TBD | TBD |

## Change Hotspots

| Change type | Likely files | Required checks |
|---|---|---|
| API behavior | TBD | tests + docs sync |
| UI behavior | TBD | build + visual/manual check |
| Data model | TBD | migration/checks |
| Governance behavior | `AGENTS.md`, `dev/*` | doc sync registry |
| Durable artifacts | docs, generated outputs, project-specific reference folders, specs, runbooks, checklists, research notes | classify as indexed / synced / temporary / one-time evidence when created or modified by the AI; update `dev/PROJECT_INDEX.md` or `dev/DOC_SYNC_REGISTRY.md` when durable |
| Closeout/startup contract | `AGENTS.md`, `dev/rules/closeout.md`, `START_NEXT_SESSION_PROMPT.txt`, `dev/SESSION_HANDOFF.md`, `dev/SESSION_LOG.md`, `dev/PROJECT_INDEX.md` | hot-path reads stay minimal; lifecycle state agrees; log has no full prompt; prompt mirror regenerated from handoff at closeout |

## External Services

| Service | Scope | Verification source | Last verified |
|---|---|---|---|
| TBD | TBD | TBD | TBD |

## Maintenance Rule

Update this file when stack, commands, directory roles, entry points, external services, runtime-controlled tool operation references, workspace identity, durable runbooks, or governance file map changes.
