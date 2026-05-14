# Scenario Dry-Runs

These dry-runs test whether Agent Continuity Kit preserves original value without loading irrelevant rules.

## Scenario 1: Writing Project

User asks: revise a long article draft and preserve tone.

Expected reads: core, handoff/latest log, project index, rule packs router, writing pack.

Should not read: coding pack, release pack, external knowledge pack unless external notes are referenced.

Expected persistence: update handoff/log; update project index only if document locations or workflow changed.

## Scenario 2: Research Project

User asks: compare sources and produce a conclusion with uncertainty labels.

Expected reads: core, project index, research pack, knowledge pack only if external KB is referenced.

Expected checks: source list captured; unverified claims marked; handoff records open questions.

## Scenario 3: Coding Feature

User asks: add login to a Next.js + Supabase app and update runbook.

Expected reads: core, handoff/latest log, project index, rule packs router, coding pack, doc sync registry, runbook if listed or requested.

Expected persistence: update project index if stack/commands/entry points changed; update doc sync registry only if new change type appears; update handoff/log with files changed and tests run.

## Scenario 4: Agent Governance Change

User asks: adjust AI handoff rules for a multi-agent project.

Expected reads: core, agent-governance pack, communication pack if reply behavior changes, doc sync registry.

Expected checks: no public runtime pollution from repository-only rules; old overlapping wording retired.

## Scenario 5: Release

User asks: publish a new Agent Continuity Kit version.

Expected reads: core, release pack, coding pack if build/tests are involved, doc sync registry.

Expected checks: version docs updated; release evidence recorded; post-release observation captured in handoff.

## Scenario 6: External Knowledge Base

User asks: use my Notion project notes as source of truth.

Expected reads: core, knowledge pack, project index.

Expected checks: access mode recorded; destructive cloud writes require confirmation; sync status recorded at closeout.

## Pass Criteria

Each scenario loads only relevant packs; core stays unchanged; project index carries durable project facts; registry carries sync mappings; handoff/log carry session state and evidence.
