# Task Persistence Gate Source Candidate Full Audit — 2026-06-03

狀態：PASS for source commit. Not a publish approval.

## Scope

This audit covers the source-only task persistence gate patch on top of public `main` commit `73da09e`. It does not cover a version bump, CHANGELOG update, GitHub Release, npm publish, or post-publish artifact smoke test.

Changed public files:

- `runtime-core/AGENTS.core.md`
- `packs/agent-governance.md`
- `README.md`
- `agent-handoff-kit-intro.html`
- `agent-handoff-kit-guide.html`
- `docs/qa/release-grade-qa.md`
- `scripts/check-release-readiness.mjs`

Audit evidence file:

- `docs/qa/full-audit-task-persistence-gate-2026-06-03.md`

## Machine Evidence

| Check | Result |
|---|---|
| `npm run qa:prototype` | PASS |
| `npm run qa:packs` | PASS |
| `npm run qa:upgrade` | PASS |
| `npm run qa:release` | PASS |
| `task persistence gate contract` inside `qa:release` | PASS |
| stale over-closeout wording sweep | PASS: old misleading phrases returned zero hits |
| `git diff --check` | PASS: CRLF warnings only |

## Governance Health

Overall verdict: tense.

Recommended direction: continue, with no publish until normal release preparation is explicitly opened.

| Dimension | Verdict | Notes |
|---|---|---|
| Startup load | Healthy | No new startup-required file was added. The runtime core adds a bounded gate, while public examples keep only user-facing operation language. |
| Source-of-truth clarity | Healthy | The gate thresholds live only in `runtime-core/AGENTS.core.md`; `packs/agent-governance.md` references the core gate without copying thresholds. |
| Output boundary | Healthy | The patch changes public source docs and QA only. No WORK-only rule or private evidence was exported. |
| Repair pattern | Tense | The change is governance-facing, but it consolidates an existing over-governance failure instead of adding another parallel runbook. |
| Execution gap | Healthy | Positive and negative checks were added to `qa:release`, including routine PASS / draft iteration / closeout wording guards. |
| Onboarding / UX closure | Healthy | README, intro, and guide now avoid presenting ordinary task completion as full closeout and do not expose internal persistence-gate terminology. |
| Upgrade migration safety | Healthy | `qa:upgrade` still passed across the prior-version chain and negative fixtures. |
| CLI scenario branching | Healthy | `qa:release` scenario branching still passed. This patch does not add a new CLI command. |

## Product Journey Matrix

| Scenario | Status | Evidence |
|---|---|---|
| Ordinary task completes, session continues | Manual PASS | Runtime tier says no persistence when no durable fact exists; public examples no longer present task completion as a handoff stage. |
| Draft image / writing iteration not approved | Automated PASS | `qa:release` asserts `active draft / image iterations not approved as final` belongs under no persistence. |
| Routine successful validation | Automated PASS | Runtime says routine successful checks that can be rerun are not durable facts; `qa:release` asserts the sentence. |
| New source URL / local source appears | Manual PASS | Runtime routes source locations to `PROJECT_INDEX`; release QA lists new source as positive checkpoint scenario. |
| User asks to turn an AI mistake into mechanism | Manual PASS | Runtime routes practice-to-mechanism lessons to rule pack, registered reference, or QA check. |
| Explicit `收工` / handoff intent | Automated PASS | Existing closeout intent and prompt mirror checks still pass under `qa:release`. |
| Existing project upgrade | Automated PASS | `qa:upgrade` passed prior-version chain, user-data preservation, and conflict fixtures. |

## Rules And Durable-home Routing

Conclusion: PASS.

The patch keeps one rule in one place:

- Core gate: `runtime-core/AGENTS.core.md`.
- Governance pack: references the core gate and keeps new runbooks as last resort.
- Public README / HTML: user-facing examples only, not threshold sources or internal terminology.
- QA: `scripts/check-release-readiness.mjs` enforces core anchors and anti-regression wording.

Durable-home routing remains clear:

- Current objective / next action / risk: `SESSION_HANDOFF`.
- Evidence: `SESSION_LOG`.
- File and source maps: `PROJECT_INDEX`.
- Sync obligations: `DOC_SYNC_REGISTRY`.
- Long-term rationale: `PROJECT_DECISIONS`.
- Reusable behavior: rule pack, registered reference, or QA check.

## QC Gap Backflow

Original user issue: agents may repeat expensive handoff / governance after each small task, while still sometimes missing genuine durable facts.

Product fix:

- Replace "persist every task" pressure with a three-tier gate.
- Reword public examples so task completion does not imply full closeout, without explaining the internal failure mode to new users.

QC fix:

- Add `checkTaskPersistenceGateContract()` to `scripts/check-release-readiness.mjs`.
- Add `Task Persistence Gate Sweep` and matrix rows to `docs/qa/release-grade-qa.md`.
- Guard both positive and negative scenarios.

Residual risk:

- This audit is source-only. A future publish still needs normal release prep: version bump, CHANGELOG, candidate full audit, explicit release approval, tag / GitHub Release / npm publish, and post-publish artifact smoke.

## Acceptance

Source commit is allowed after this audit.

Publish is not allowed from this audit alone.
