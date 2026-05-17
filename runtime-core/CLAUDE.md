# Claude Entry Bridge

This file exists so Claude Code can find the Agent Handoff Kit startup path.

Authoritative operating rules remain in `AGENTS.md`. Do not duplicate or fork the rules here.

At session startup:

1. Confirm the current root is the intended project root.
2. Read `AGENTS.md`.
3. Follow the startup read order in `AGENTS.md`.

If the current root does not match the intended project root, stop and ask the user to confirm the workspace before reading or editing project state.
