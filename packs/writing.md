# Writing Pack

## Scope

Use for drafting, editing, style, structure, publication copy, documentation prose, and tone control.

## Load When

- User asks to write, rewrite, summarize, translate, or edit text.
- The task has a target audience, voice, format, or publication surface.

## Rules

1. Identify audience, purpose, and target surface before rewriting.
2. Preserve factual meaning unless the user asks for content changes.
3. Keep terminology consistent with project docs.
4. Mark uncertain claims instead of inventing support.
5. Do not bury durable requirements only in prose; use project index, spec, runbook, or handoff when needed.
6. For public Traditional Chinese docs or HTML aimed at non-technical readers, use steady written Chinese. Keep English only for commands, paths, URLs, file names, product names, and unavoidable tool names. Avoid mixed half-English fragments, internal governance codes, and developer-only wording in reader-facing prose.
7. For public README, onboarding, and other user-facing docs, use the product-journey rule: the user states the goal, the AI handles technical work. Keep one primary user path. Do not make users choose between install, upgrade, doctor, dry-run, or terminal commands when an AI-assisted path exists. Put technical commands in the dedicated AI install page, CLI help, or advanced examples instead of duplicating them in the main README flow.

## Checks

- Verify requested format, language, and tone.
- Check links, commands, names, and version-sensitive claims when relevant.
- Check `dev/DOC_SYNC_REGISTRY.md` if public docs or user-facing instructions changed.
- For public Chinese docs, read the final text as a new user journey: the next action should be clear without technical background.
- For README-style docs, confirm the main path does not become parallel instructions: no repeated manual install section, no competing command table, and no requirement that the reader understand internal files before taking the first action.

## Closeout

Record changed documents, unresolved content questions, and any sync or follow-up needed.
