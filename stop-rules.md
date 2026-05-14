# Stop Rules

These rules define when to stop expanding governance.

## Do Not Add To Core When

1. The issue happened once and caused no meaningful risk.
2. The rule only applies to release, external services, coding, writing, or research.
3. The behavior is already covered by a broader safety rule.
4. A registry row would solve the routing problem.
5. A project index entry would solve the memory problem.
6. A runbook would solve the procedure problem.
7. The rule exists because AI failed to follow an existing rule.
8. The new wording mainly explains examples rather than changing behavior.
9. Adding it breaches complexity budget.
10. It requires duplicating the same standard across multiple installers.

## Move Out Of Core When

1. A rule has not applied in ordinary sessions.
2. It only triggers under one task class.
3. It contains long examples.
4. It names specific tools, vendors, or platforms beyond a routing pointer.
5. It is mostly release, deployment, or repository maintenance detail.

## Retire Or Merge When

1. Two rules protect the same outcome.
2. One rule is a narrower version of another.
3. A newer rule supersedes an older incident-specific patch.
4. A rule tells AI to remember something that belongs in project index.

## Expansion Budget Rule

Any addition over 10 lines must be paired with a removal, a move from core to pack, a conversion from prose to registry row, or a documented exception with hard budget still passing.
