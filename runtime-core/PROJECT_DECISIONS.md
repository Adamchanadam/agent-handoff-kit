# Project Decisions Log

This file stores long-term project evolution, decisions, architecture trade-offs, and accumulated learning observations. It is a warm narrative layer. AI agents do not need to read this file at startup unless the current task asks for historical rationale or the closeout maintenance trigger says to update it.

Short single-task projects can leave this file nearly empty. Long-running projects use it when a closeout trigger, semantic trigger, or periodic backstop applies. When the user asks why earlier choices were made, this file is the first long-term narrative reference.

The user is not expected to maintain this file manually. The AI updates it during closeout when required, and may record major decisions when they happen.

Research-derived decisions use this compact evidence-chain format inside the relevant section, without creating a new section:

```text
- YYYY-MM-DD [research-derived] Decision summary. Evidence chain: Source=source:<id>; Summary=<source finding>; Inference=<reasoning>; Decision impact=<what changed>; Uncertainty=<limits or none>.
```

The `source:<id>` token must also appear in `dev/PROJECT_INDEX.md` under `Fact Base` or `External Sources`, so later sessions can trace the decision back to its source map.

This file does not store raw build / upload / QC evidence, current next actions, one-time task results, or reusable operating procedures. Keep those in `dev/SESSION_LOG.md`, `dev/SESSION_HANDOFF.md`, or the relevant rule pack / registered reference.

---

## Evolution Timeline

Long-term narrative of task or product evolution. Newest first. Append when the AI observes substantive task evolution.

(empty)

## Decisions Archive

Older decision entries split from `SESSION_HANDOFF.md` when its confirmed-decisions style section grows past the maintenance threshold. Newest first.

(empty)

## Architecture Choices

Major architecture choices and rationale. Append when planning involves a multi-option trade-off and the selected path has been confirmed.

(empty)

## Insights & Learnings

Accumulated lessons, reflections, and cross-session patterns. Append when the AI observes a recurring pattern across sessions.

(empty)
