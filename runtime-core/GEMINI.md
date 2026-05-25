# Antigravity / Gemini Entry Bridge

This file is a bridge only. It exists for Google Antigravity CLI, Gemini CLI during migration, and compatible tools that still read `GEMINI.md`.

Authoritative operating rules remain in `AGENTS.md`.

Do not expand, summarize, replace, or "improve" this file during onboarding, setup, or project documentation work. Do not add command lists, architecture summaries, project state, or handoff notes here.

Antigravity CLI may read both `AGENTS.md` and `GEMINI.md` from the active workspace. If `AGENTS.md` has already been loaded, do not treat this bridge as a second rule source and do not repeat the same instructions.

At session startup:

1. Confirm the current root is the intended project root.
2. Read `AGENTS.md`.
3. Follow the startup read order in `AGENTS.md`.

If the current root does not match the intended project root, stop and ask the user to confirm the workspace before reading or editing project state.
