# Agent Continuity Kit

Status: early public output draft with a prototype CLI scaffold, not a released installer and not requirements-complete.

Agent Continuity Kit is a lightweight agent harness for project memory, handoff, and multi-session continuity. It preserves the original value of stable AI project continuity, file-aware handoff, bounded AI behavior, and doc synchronization, while avoiding a monolithic runtime prompt that overwhelms the AI every session.

## Install

Planned public entry:

```bash
npx agent-continuity-kit init
```

Existing projects will use:

```bash
npx agent-continuity-kit upgrade
```

Health check:

```bash
npx agent-continuity-kit doctor
```

Current prototype status: the CLI can plan installs, create missing files, skip existing files, run doctor checks, and write migration reports. This is enough to validate package shape and template mapping. Section-aware merge and release hardening are intentionally pending while requirements are still open.

Source repo prototype QA:

```bash
npm run qa:prototype
```

This checks install, doctor, package dry-run, stale wording, and public-output contamination markers. It is a source-repository check, not an npm package runtime command.

To end a session, type `收工`, `wrap up`, or `handoff`. The AI will show a short handoff card, update the handoff files, and give you a next-session opening message inside a fenced `text` code block with clear copy/paste markers.

Startup and closeout use a small text card with the full product name and low-key version display:

```text
   /\_/\   Agent Continuity Kit v0.1.0
  ( o.o )  continuity ready
   > ^ <
```

`dev/SESSION_HANDOFF.md` is the short continuity file for the next AI. `dev/SESSION_LOG.md` is recent evidence of what happened. Older detail should be summarized or archived only when needed, so normal startup does not require reading old logs.

Describe the task in plain language. The AI will choose a working mode for coding, research, writing, knowledge sync, release, or mixed tasks, then load only the relevant rule packs instead of every rule every time.

## Design Thesis

The public installer should install a small runtime core plus structured project memory. The core answers only five questions:

1. What must AI read at session start?
2. How must AI think and execute work?
3. What must AI not do?
4. How must AI hand over work at session end?
5. When must AI load an extra rule pack?

Everything else moves into short registries or conditional rule packs.

Safety details are installed as a conditional rule pack. The always-read core keeps only the short safety baseline; high-risk file, shell, Git, API, installer, deploy, release, credential, or permission work loads `dev/rules/safety.md`.

Rule packs are AI working-mode guides, not extra reading for users. At task start, the AI should explain which mode and packs it is using in plain language.

## Proposed Runtime Shape

```text
AGENTS.md
CLAUDE.md
GEMINI.md
dev/SESSION_HANDOFF.md
dev/SESSION_LOG.md
dev/PROJECT_INDEX.md
dev/DOC_SYNC_REGISTRY.md
dev/RULE_PACKS.md
dev/rules/*.md
```

`AGENTS.md` is the primary runtime entry. `CLAUDE.md` and `GEMINI.md` are thin bridges for tools that look for their own project memory files; they route back to the same startup path instead of duplicating the full rules.

## Repository And Package Map

The npm package is intentionally small. It contains the CLI, installable runtime templates, rule packs, README, LICENSE, and package metadata:

- `bin/` contains the prototype CLI.
- `runtime-core/` contains source templates for installed core files.
- `packs/` contains source templates for conditional rule packs, including safety; the installer writes them to `dev/rules/*.md`.

The source repository also contains design and review documents that explain the product direction but are not needed by installed projects:

- `problem-definition.md`, `preservation-map.md`, `core-contract.md`, and `architecture.md` explain the design.
- `pack-loading-contract.md`, `coding-continuity-model.md`, and `scenario-dry-runs.md` explain runtime behavior.
- `installer-design.md` and `migration-plan.md` explain installer and migration design.
- `scripts/` contains source-repository QA checks and is not part of the installable runtime.
- `health-checks.md`, `complexity-budget.schema.md`, `auditor-rubric.md`, and `stop-rules.md` help prevent Agent Continuity Kit from growing into another monolith.

## Non-Destructive Rule

This output draft is independent. It does not modify the existing `ai-session-governance` v1 reference repo. `INIT.md` is not the primary Agent Continuity Kit installer path.
