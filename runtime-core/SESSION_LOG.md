# Session Log

Add new session entries at the top. Record what actually happened in the session; do not copy old completed work forward as new work.

This log carries recent evidence, not current state. Put the current objective, next action, risks, and workspace identity in `dev/SESSION_HANDOFF.md`.

Keep recent entries concise. If older entries no longer affect the next action, reduce them to short dated indexes that point to the durable source of truth. Archive long error output, validation detail, or research trails only when needed; do not create an archive directory by default.

Before closeout, check whether older log detail should be kept, summarized, or archived. Do not remove validation evidence, unresolved risks, or the latest opening message.

## Entry Template

````markdown
## <YYYY-MM-DD> — <short session title>

- **ID:** <agent_or_session_id>
- **Summary:** <one sentence>
- **Changed:** <files changed, or none>
- **Done:** <work completed this session>
- **QC:** <checks run and results, or why not run>
- **Sync:** <doc/external sync status>
- **Pending:** <next work>
- **Risks:** <known risks or none>
- **Log maintenance:** <kept/summarized/archived/not_needed and why>

### Next Session Opening Message

📋 Next session: copy and paste the whole block below

```text
Work in <absolute project root>.

Read in order:
1. AGENTS.md
2. dev/SESSION_HANDOFF.md
3. dev/SESSION_LOG.md
4. dev/PROJECT_INDEX.md
5. dev/RULE_PACKS.md

Read dev/DOC_SYNC_REGISTRY.md before file changes or closeout.

If this root does not match the expected project root, stop and ask for confirmation.

After reading, summarize current objective, confirmed decisions, pending work, risks, and the next recommended action.
```
````
