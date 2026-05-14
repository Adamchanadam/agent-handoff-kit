# Release-Grade QA Plan

Status: source-repository QA plan. This file is not part of the npm package and is not installed into user projects.

## Purpose

This plan defines the checks required before Agent Continuity Kit can move from prototype checkpoint to release candidate. The installable package must stay small: QA docs and source-only scripts remain outside the npm package unless `package.json` `files` is intentionally changed.

## QA Layers

| Layer | Command | Scope | Required before release |
|---|---|---|---|
| Prototype QA | `npm run qa:prototype` | Template install, `doctor`, package dry-run, stale wording, and contamination markers. | Yes |
| Pack Scenario QA | `npm run qa:packs` | Coding, research, writing, knowledge, release, safety, governance, communication, and mixed-scenario pack routing. | Yes |
| Upgrade Safety QA | Planned: `npm run qa:upgrade` | Existing-project upgrade, backup, merge, and conflict behavior. | Yes |
| Release QA | Planned: `npm run qa:release` | Full pre-release gate, version, package contents, docs consistency, tag/release/npm readiness. | Yes |
| User Flow QA | Planned as part of release QA | Install, start a session, do a small task, close out, and resume from handoff. | Yes |

## Pack Scenario Coverage

| Scenario | Expected pack behavior |
|---|---|
| Coding | Load coding; add safety only for risky file, Git, API, install, deploy, release, credential, or permission work. |
| Research | Load research; require sources, dates, and clear separation between evidence and inference. |
| Writing | Load writing and communication only when tone, audience, or delivery format matters. |
| Knowledge | Load knowledge for source-of-truth and sync work; add safety for external writes, permissions, or destructive operations. |
| Release | Load release and safety; do not tag, create GitHub Release, publish npm, or close release without explicit approval. |
| Safety | Escalate to safety for deletion, overwrite, move, reset, Git history changes, package manager, API, deploy, release, credentials, or permission errors. |
| Mixed scenario | Split work into phases and load the smallest relevant pack set per phase instead of loading every pack. |

## Package Boundary

The npm package is controlled by `package.json` `files`:

```json
[
  "bin/",
  "runtime-core/",
  "packs/",
  "README.md",
  "LICENSE"
]
```

`docs/qa/`, source design docs, and `scripts/` are source-repository assets. They should not appear in `npm pack --dry-run` output unless a future release explicitly changes the package boundary.

## Current Baseline

- `npm run qa:prototype` exists and passes.
- `npm run qa:packs` exists and checks static pack routing, safety escalation, and mixed-scenario phased loading.
- The package dry-run currently reports 20 package files.
- Installer merge, backup, conflict reporting, richer `doctor` schema checks, upgrade QA, and release QA are still pending.

## Release Blockers

Agent Continuity Kit must not be tagged, released on GitHub, published to npm, or described as requirements-complete until all release-required layers pass and the user explicitly approves the release action.
