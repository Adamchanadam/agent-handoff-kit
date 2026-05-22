# Project Index

Purpose: give a stateless AI a compact map of the project before it reads or edits files.

## Stack

| Field | Value | Last verified |
|---|---|---|
| Agent Handoff Kit template version | 0.2.3 | 2026-05-22 |
| Runtime | Python 3.11 | 2026-05-22 |
| Framework | FastAPI | 2026-05-22 |
| Package manager | pip + requirements.txt | 2026-05-22 |
| Test command | pytest tests/ | 2026-05-22 |
| Build command | (none, no compile step) | 2026-05-22 |
| Deploy command | docker build + push | 2026-05-22 |

## Directory Map

| Path | Role | Read when |
|---|---|---|
| `AGENTS.md` | primary Agent Handoff Kit entry | session startup |
| `src/api/` | FastAPI app source | coding task |
| `src/models/` | SQLAlchemy ORM models | data layer changes |
| `tests/` | pytest unit + integration tests | coding/QC |
| `docs/` | API documentation (mkdocs) | doc changes |
| `dev/` | governance state | startup/closeout |

## Entry Points

| Entry | Path | Notes |
|---|---|---|
| App entry | src/api/main.py | uvicorn entry |
| Main config | config/settings.yaml | env vars override |
| Test suite | tests/conftest.py | pytest fixtures |
| Runbook | docs/runbook.md | ops procedures |

## Fact Base

Reachable means the source can be found. It does not mean the source has been read in this session.

| Source | Role | Required before | Access method | Last verified |
|---|---|---|---|---|
| ~/project/docs/api-spec.md | source of truth | every API change | local file | 2026-05-22 |
| ~/project/CHANGELOG.md | source of truth | release | local file | 2026-05-22 |
| ~/project/docs/architecture.md | reference | architectural decisions | local file | 2026-05-22 |

## External Sources

| Source | Role | Required before | Access method | Write-back rule | Last verified |
|---|---|---|---|---|---|
| Notion DB「Project Tasks」 | source of truth | sprint planning | https://notion.so/abc123def456 | manual paste back | 2026-05-22 |
| Google Drive「Project Files/」 | mirror | knowledge sync | https://drive.google.com/folder/xyz789 | no write | 2026-05-22 |
| Linear「Project Backlog」 | source of truth | bug triage | linear.app/team/project | API write via linear-cli | 2026-05-22 |

## Local QC Commands

| Check | Command | Run before | Last verified |
|---|---|---|---|
| Agent Handoff Kit doctor | npx @adamchanadam/agent-handoff-kit doctor | closeout / governance changes | 2026-05-22 |
| Pytest unit tests | pytest tests/unit/ -v | commit | 2026-05-22 |
| Mypy type check | mypy src/ | commit | 2026-05-22 |
| Ruff lint | ruff check src/ tests/ | commit | 2026-05-22 |

## Workspace Identity

Record this at closeout so the next AI can detect wrong-root or workspace drift.

| Field | Value | Last verified |
|---|---|---|
| Expected project root | ~/project | 2026-05-22 |
| Git root | ~/project (same) | 2026-05-22 |
| Branch / commit | main / a1b2c3d | 2026-05-22 |
| Worktree or parallel workspace | (none) | 2026-05-22 |
| Uncommitted change summary | no uncommitted changes | 2026-05-22 |

## Change Hotspots

| Change type | Likely files | Required checks |
|---|---|---|
| API behavior | src/api/routes/*.py | pytest + docs sync |
| UI behavior | (no UI in backend project) | n/a |
| Data model | src/models/*.py, migrations/ | pytest migration tests |
| Governance behavior | `AGENTS.md`, `dev/*` | doc sync registry |
| Closeout/startup contract | `AGENTS.md`, `START_NEXT_SESSION_PROMPT.txt`, `dev/SESSION_HANDOFF.md`, `dev/SESSION_LOG.md`, `dev/PROJECT_INDEX.md` | opening message present + prompt convenience copy matches handoff + workspace identity current |

## External Services

| Service | Scope | Verification source | Last verified |
|---|---|---|---|
| OpenAI API | LLM completions for AI features | docs.openai.com | 2026-05-22 |
| PostgreSQL | primary database | postgres docs | 2026-05-22 |

## Maintenance Rule

Update this file when stack, commands, directory roles, entry points, external services, workspace identity, durable runbooks, or governance file map changes.
