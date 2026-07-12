# Session Log

<!-- ack:section:session-log-preamble -->

> **Handoff role**: This log is the trace-back / audit trail layer. Handoff capability rests on `dev/SESSION_HANDOFF.md`. The next AI session can continue by reading `AGENTS.md` + `dev/SESSION_HANDOFF.md` + `dev/PROJECT_INDEX.md` + needed rule packs; reading this log is not required for continuity. Each closeout must run the maintenance trigger check per `AGENTS.md` `## Closeout And Handoff` step 11 (R-010 SESSION_LOG handoff-role discipline): N=1–3 keep full, N=4–10 may short-index after absorbed-source check when triggered, N=11+ archive into `dev/SESSION_LOG_archive/`.

Add new session entries at the top. Record what actually happened in the session; do not copy old completed work forward as new work.

This log carries recent evidence, not current state. Put the current objective, next action, risks, and workspace identity in `dev/SESSION_HANDOFF.md`.

Keep recent entries concise. If older entries no longer affect the next action and the maintenance trigger check says cleanup is due, reduce them to short dated indexes that point to the durable source of truth. Archive long error output, validation detail, or research trails only when triggered; do not create an archive directory by default.

Before closeout, record whether older log detail was kept, summarized, or archived, and whether the maintenance trigger check was no-op, triggered, or backstop-driven. Do not remove validation evidence or unresolved risks. The full opening message never belongs in this log.

<!-- ack:section:session-log-entry-template -->

## Entry Template

````markdown
<!-- ack:log-entry:start -->
## <YYYY-MM-DD> — <short session title>

- **ID:** <agent_or_session_id>
- **Summary:** <one sentence>
- **Changed:** <files changed, or none>
- **Done:** <work completed this session>
- **QC:** <checks run and results, or why not run>
- **Evidence disposition:** <one-time only / kept as recent trace evidence / absorbed into handoff / indexed in PROJECT_INDEX / promoted to PROJECT_DECISIONS / promoted to rule pack>
- **Sync:** <doc/external sync status>
- **Pending:** <next work>
- **Risks:** <known risks or none>
- **Log maintenance:** <trigger check result; full maintenance action if triggered, otherwise no-op reason>
- **Opening-message mirror:** <regenerated and verified / blocked; full text omitted by design>
<!-- ack:log-entry:end -->
````
