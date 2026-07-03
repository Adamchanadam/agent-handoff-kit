# Project Index

Purpose: give a stateless AI a compact map of the project before it reads or edits files.

## Stack

| Field | Value | Last verified |
|---|---|---|
| Agent Handoff Kit template version | 0.1.7 | package prototype |
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
| `START_NEXT_SESSION_PROMPT.txt` | auto-generated stateful startup prompt for the next local-agent session; `dev/SESSION_HANDOFF.md` remains authoritative | next session startup |
| `src/` | application source | coding task |
| `tests/` | tests | coding/QC |
| `docs/` | user or product docs | doc/public behavior change |
| `dev/` | governance state | startup/closeout |
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
| Generated artifact review | `dev/PROJECT_INDEX.md` + `dev/DOC_SYNC_REGISTRY.md` | After creating Markdown docs, generated outputs, specs, runbooks, checklists, or research artifacts, classify each artifact as indexed / synced / temporary / one-time evidence before completion |

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

> Purpose: a new AI session reads this section to understand declared external-tool capabilities and their project roles. Declarations persist across sessions. Every entry must include `Declared` and `Last Verified` fields so stale capability assumptions can be detected.

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

## Local QC Commands

| Check | Command | Run before | Last verified |
|---|---|---|---|
| Agent Handoff Kit doctor | `npx --yes @adamchanadam/agent-handoff-kit@latest doctor --root .` | closeout / governance changes / generated Markdown artifact checks | package latest |
| Project governance check | Check newly created Markdown / durable artifacts against `dev/PROJECT_INDEX.md` and `dev/DOC_SYNC_REGISTRY.md`; register, sync, consolidate, or explicitly classify as temporary / one-time evidence | closeout / durable file changes | unverified until project-specific command exists |

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
| Generated Markdown or durable artifact | `docs/`, `outputs/`, root Markdown files, project-specific reference folders | classify as indexed / synced / temporary / one-time evidence; update `dev/PROJECT_INDEX.md` or `dev/DOC_SYNC_REGISTRY.md` when durable |
| Closeout/startup contract | `AGENTS.md`, `START_NEXT_SESSION_PROMPT.txt`, `dev/SESSION_HANDOFF.md`, `dev/SESSION_LOG.md`, `dev/PROJECT_INDEX.md` | opening message present + workspace identity current + prompt file regenerated from handoff at closeout |

## External Services

| Service | Scope | Verification source | Last verified |
|---|---|---|---|
| TBD | TBD | TBD | TBD |

## Maintenance Rule

Update this file when stack, commands, directory roles, entry points, external services, workspace identity, durable runbooks, or governance file map changes.
