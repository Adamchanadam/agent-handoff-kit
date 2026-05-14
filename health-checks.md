# Health Checks

## Purpose

Health checks prevent Agent Continuity Kit from becoming another monolith. They are for repository development and release review, not for public users to run manually.

## Metrics

| Metric | Target | Hard stop |
|---|---:|---:|
| Core runtime lines | <= 350 | > 450 |
| Core runtime UTF-8 bytes | <= 24576 | > 32768 |
| Always-read governance files | <= 4 | > 5 |
| Rule packs installed by default | <= 8 | > 10 |
| Mandatory terms in core | <= 15 | > 25 |
| Must terms in core | <= 40 | > 60 |
| Trigger terms in core | <= 15 | > 25 |
| Pack lines each | <= 180 | > 250 |
| Registry prose paragraphs | <= 5 | > 8 |

## Checks

1. Count lines and bytes for core and packs.
2. Count `mandatory`, `must`, `trigger`, and `hard rule` terms.
3. Verify core contains only five contract areas.
4. Verify no release-only text appears in core.
5. Verify no external-KB procedure appears in core beyond pointer loading.
6. Verify doc sync exists as registry rows, not long prose in core.
7. Verify all packs have trigger and exit sections.
8. Verify every new file is listed in project index or architecture.

## Release Gate

Agent Continuity Kit cannot claim lightweight release status if the core exceeds hard budget, any pack becomes always-read without rationale, a new rule duplicates an existing core rule, a single incident produces a permanent core rule without passing stop rules, or scenario dry-runs show irrelevant packs loading.
