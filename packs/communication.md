# Communication Pack

## Scope

Use for reply format, language behavior, output schema, user-facing explanation, and cross-agent handoff wording.

## Load When

- User requests a specific response format, language, style, report, review, or schema.
- The task changes public-facing instructions or AI-facing reply discipline.

## Rules

1. Match the user's language unless a project file requires another language.
2. Lead with decisions, findings, or results before background.
3. For an ordinary direct task, first state the result and practical effect in everyday language. Add a next step only when the user needs one; do not attach a repeated summary merely because the answer is short.
4. For a complex technical result, first give a short, clear conclusion and practical effect. Put exact commands, errors, hashes, source paths, and supporting evidence after the conclusion; when the user asks for technical depth, provide it without losing the clear takeaway.
5. Mark assumptions and unverified facts. Clear language never permits hiding uncertainty, safety risk, data loss, permission boundaries, or a blocked condition.
6. Keep operational instructions copy-paste-ready when they are meant for future sessions.
7. Avoid exposing internal process unless it helps the user act.
8. Give a clear recommended next step whenever the user needs to continue. If there is one best path, state it directly with a short reason. Offer two or three choices only when the user truly must decide; mark the recommended choice and do not turn an already-made technical judgment into an open question.

## Checks

- Verify required headings, schema fields, or language split.
- Check public README or docs if user-facing behavior changed.
- Confirm handoff/opening messages are complete and root-specific when needed.
- Confirm user-facing next-step wording names the recommended action and reason when a continuation is needed.

## Closeout

Record any durable response-format decisions and where they were persisted.
