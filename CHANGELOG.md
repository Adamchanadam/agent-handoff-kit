# Changelog

## Unreleased

Status: prototype checkpoint. This is not a release, GitHub Release, npm publish, or requirements-complete build.

### Added

- Prototype `agent-continuity-kit` CLI scaffold with `init`, `upgrade`, and `doctor` commands.
- Lightweight runtime core templates for startup, closeout, project index, doc sync registry, session handoff, session log, and rule-pack routing.
- Thin cross-tool entry templates for `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md`.
- Conditional rule packs for coding, writing, research, agent governance, release, knowledge, communication, and safety.

### Reconciled

- Public product naming uses `Agent Continuity Kit`.
- README separates npm package contents from source-repository design docs.
- Closeout opening-message UX uses a copy marker and fenced `text` block without an extra end marker.
- Safety handling uses a short core baseline plus a conditional safety pack for high-risk file, shell, Git, API, CLI, installer, deploy, release, credential, and permission work.
- Scenario / working-mode guidance is exposed through README, runtime core, installer design, and CLI help without adding profile files.

### Not Release Ready

- Section-aware merge is pending.
- Backup before modifying existing files is pending.
- Conflict reporting for unsafe existing governance content is pending.
- Richer `doctor` schema checks are pending.
- GitHub Release, tags, npm publish, and installer hardening are intentionally not done.
