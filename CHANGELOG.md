# Changelog

## Unreleased

Status: prototype checkpoint. This is not a release, GitHub Release, npm publish, or requirements-complete build.

### Added

- Prototype `agent-continuity-kit` CLI scaffold with `init`, `upgrade`, and `doctor` commands.
- Source-repository `npm run qa:prototype` check for install, doctor, package dry-run, stale wording, and public-output contamination markers.
- Source-repository `npm run qa:packs` check for pack routing, safety escalation, and mixed-scenario phased loading.
- Source-repository `npm run qa:upgrade` check for upgrade merge, backup, and conflict behavior.
- Source-repository release-grade QA plan under `docs/qa/`.
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

- Richer section-aware merge remains pending beyond the initial safe `AGENTS.md` managed-core merge.
- Backup before modifying merged files has an initial implementation.
- Conflict reporting for unsafe bridge files has an initial implementation.
- Richer `doctor` schema checks are pending.
- GitHub Release, tags, npm publish, and installer hardening are intentionally not done.
