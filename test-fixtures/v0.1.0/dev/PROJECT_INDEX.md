# Project Index

Purpose: give a stateless AI a compact map of the project before it reads or edits files.

## Stack

| Field | Value | Last verified |
|---|---|---|
| Agent Handoff Kit template version | 0.1.0 | package prototype |
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
| `GEMINI.md` | Gemini CLI bridge to the same startup path | Gemini CLI startup |
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

## Fact Base

Reachable means the source can be found. It does not mean the source has been read in this session.

| Source | Role | Required before | Access method | Last verified |
|---|---|---|---|---|
| TBD | local source of truth / reference / draft / archive | TBD | path or instruction | TBD |

## External Sources

| Source | Role | Required before | Access method | Write-back rule | Last verified |
|---|---|---|---|---|---|
| TBD | source of truth / mirror / index / attachment store | TBD | URL, connector, or manual packet | read-back required / manual only / no write | TBD |

## Local QC Commands

| Check | Command | Run before | Last verified |
|---|---|---|---|
| Agent Handoff Kit doctor | TBD | closeout / governance changes | TBD |
| Project governance check | TBD | closeout / durable file changes | TBD |

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
| Closeout/startup contract | `AGENTS.md`, `dev/SESSION_HANDOFF.md`, `dev/SESSION_LOG.md`, `dev/PROJECT_INDEX.md` | opening message present + workspace identity current |

## External Services

| Service | Scope | Verification source | Last verified |
|---|---|---|---|
| TBD | TBD | TBD | TBD |

## Maintenance Rule

Update this file when stack, commands, directory roles, entry points, external services, workspace identity, durable runbooks, or governance file map changes.
