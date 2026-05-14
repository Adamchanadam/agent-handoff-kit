# Agent Continuity Kit Problem Definition

## Problem

The original public installer successfully creates a durable AI governance harness, but the installed runtime can become too large for routine sessions. The issue is not only line count. It is the mix of installer logic, always-on rules, rare release procedures, optional wizards, external knowledge integration, output formatting rules, and development-only safeguards in one mental surface.

A stateless AI needs enough structure to continue work safely, but not a full governance encyclopedia on every task.

## Confirmed Signals From v1

- The public `INIT.md` is a single large installer plus embedded runtime template.
- Installed `AGENTS.md` contains the full operating system for every session.
- Public documentation already warns that startup reads add overhead and are only worthwhile for projects that continue across sessions.
- Earlier wizard work proved that cold, form-like governance can overload users and AI; it was replaced by draft-and-iterate behavior.
- The same pattern now appears at the overall runtime level.

## Overload Definition

Overload exists when any of these happen:

1. AI spends more attention interpreting governance than doing the user's task.
2. A routine task triggers rules intended only for rare scenarios.
3. Startup requires reading large sections that do not apply to the current task.
4. The user must choose between many installer variants before seeing value.
5. New rules keep accumulating because there is no stop rule.
6. The active runtime exceeds common tool context limits or slows every session.

## Root Cause

The core issue is role mixing: installer instructions, runtime core, conditional packs, data registries, public-user rules, repository-development rules, and exceptional recovery procedures are all compressed into one surface.

## Non-Goals

- Do not remove governance continuity.
- Do not remove file index or doc sync capability.
- Do not create many full `INIT_X.md` files that duplicate the same rules.
- Do not move this repo's internal development rules into public runtime.
- Do not optimize only for line count while losing safety.
- Do not make the user manually manage complex rule loading.

## Success Definition

Agent Continuity Kit succeeds if a new session can read a short core, understand the project map, load only relevant packs, complete work safely, update handoff records, and avoid expanding the default runtime without passing a complexity gate.
