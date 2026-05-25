# Claude Code Entry Bridge

@AGENTS.md

This file is a bridge only. Claude Code reads `CLAUDE.md` automatically, so this bridge imports `AGENTS.md`, which remains the single authoritative startup file for Agent Handoff Kit.

Do not expand, summarize, replace, or "improve" this file during onboarding, setup, `/init`, or project documentation work. Do not add command lists, architecture summaries, project state, or handoff notes here.

If the user says `I just installed agent-handoff-kit`, `help me get started`, or similar first-use wording, do not run Claude Code `/init` and do not load an `init` skill. Agent Handoff Kit is already installed. Read `AGENTS.md`, load the onboarding rule when appropriate, and guide the user through the first task.

Only edit this file when the user explicitly asks to edit `CLAUDE.md` itself, or when `agent-handoff-kit upgrade` reports a bridge conflict and asks for manual repair.

After loading this bridge, follow `AGENTS.md` and the startup read order defined there.
