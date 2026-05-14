# Auditor Rubric

Use this before adding or moving any rule.

## Rule Admission Questions

1. What real failure does this rule prevent?
2. Is the failure common, severe, or recurring?
3. Does this apply to most sessions?
4. Can this be a pack rule instead of a core rule?
5. Can this be a registry row instead of prose?
6. Can this be a project-index fact instead of a governance rule?
7. Can this be a troubleshooting note instead of a permanent rule?
8. Does an existing rule already cover it?
9. What text can be removed if this is added?
10. Will this increase user choice burden?

## Scoring

| Score | Meaning |
|---|---|
| 0 | Do not add. Use log/troubleshooting only. |
| 1 | Add to registry or project index, not rule text. |
| 2 | Add to a conditional pack. |
| 3 | Add to core only if within budget and no existing rule covers it. |

## Core Admission Bar

A rule needs score 3 and must protect safety, correctness, continuity, or data loss; apply broadly; fail to fit in a pack or registry; stay within budget; and replace or consolidate old wording when possible.

## Auditor Output

```text
Decision: core / pack / registry / project-index / runbook / log-only / reject
Reason:
Evidence:
Complexity impact:
Text retired or moved:
Follow-up check:
```
