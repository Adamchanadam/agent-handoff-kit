# Continuity regression protocol

These fictional cases test the public handoff contract without private project
data. They are test inputs, not runtime state. The normative procedure remains
in `packs/closeout.md`; the packet structure is `runtime-core/SESSION_HANDOFF.md`.

## Automated lifecycle check

Run `node scripts/check-handoff-continuity.mjs` from the repository. Use a
temporary base outside any Git checkout via `AGENT_HANDOFF_KIT_QA_TMP` when the
system temporary directory inherits a Git root. The test uses the pinned
historical v0.3.64 npm identity in the generated fixture/catalog, verifies the
tarball integrity and init output, then invokes its original CLI to install.
The existing historical-artifact cache is reused; a missing artifact is fetched
with npm scripts disabled. Set `AGENT_HANDOFF_KIT_KEEP_QA_TMP=1` to retain roots.

The executable checks old handoff preservation through upgrade, zero-write
preview and rejection, missing reconstruction evidence, explicit closeout
updates, matching startup mirror, honest blocked-work handoff, fixed field
labels with localized headings, CRLF, duplicates, and repeat-upgrade stability.
It checks fixture structure, not model understanding or the truth of an author's
claim. A structurally accepted dishonest claim can still pass; original-request
and actual-source review remain necessary.

## Blind writer-to-reader rehearsal

The controller reads `cases.json` and `reviewer-oracle.json`, selects the cases
required by the change, and freezes the current public template/closeout pack
and input hashes before execution. Five cases cover a standalone change,
missing parent, source-depth gaps, finished child with pending parent, and a
four-level, three-branch, eight-source task. This is not universal coverage.

1. Give a fresh writer only the selected `writerInput`, current handoff template
   and relevant closeout procedure. Withhold the oracle and negative packet.
   Ask for the smallest sufficient handoff at this fictional interruption.
   It must preserve read limitations and may not invent facts or claim real
   operations. Save its first unedited output.
2. Give a different fresh reader only that raw handoff and this request:
   "Without prior conversation or external tools, reconstruct the parent
   outcome and consumer, current task position, completed and unfinished
   work, exact next bounded action, remaining acceptance, source revisions and
   read coverage, conflicts, blockers and permission boundaries. Distinguish
   what the packet establishes from what requires source reading. If context
   is insufficient or contradictory, identify the dependent work that must
   wait. Do not guess missing facts or claim new checks were executed."
   Withhold original request, sources, rubric, case ID and repository access.
   Plain startup still permits only recovery/status; this explicit request
   authorizes the fictional reconstruction only.
3. Grade writer and reader against the withheld input and oracle. Record each
   requirement as preserved, missing, distorted, or explicitly unavailable;
   locate supporting text and describe each error's practical effect. Keywords
   or a self-declared `Answer: yes` do not prove semantic sufficiency.
4. For each `negativeReaderPacket`, give that packet to another fresh reader
   with the same request. Missing facts must trigger bounded clarification or
   source reading; contradictions must prevent the bad next action. Success
   does not mean recovering information absent from the packet.
5. Preserve raw outputs, prompts, model/runtime and isolation details, hashes,
   rubric results and adjudication in the executing workspace's one-time QA
   evidence area. Do not add machine paths, private data or model transcripts
   to these public fixtures. If reader tools or prior context were available,
   report compromised isolation rather than label the run packet-only.

Run writer then reader in dependency order. Never repair the writer packet
before the reader sees it. Preserve first failures; investigate before a clearly
labeled new run. Do not silently retry until success.

## Real-file reception and authorized continuation

Run this additional exercise when changing continuity reception, recovery,
closeout sufficiency or readiness claims. The packet-only exercise above tests
writing/reconstruction with complete input; it cannot test file-tool delivery.

Use an isolated local fixture root and the candidate core/closeout pack. Freeze
candidate hashes and the writer's first unedited handoff. Give a fresh writer
only the fictional task/history and allowed source files. Give a separate fresh
reader only the root, normal entry instructions and `開工`; do not paste the
handoff, the writer request, previous chat, evaluator notes or expected answers.
The reader may use actual file tools in that root and an already-available
candidate CLI. Linked task sources are available only when the normal intent
route authorizes them. The controller keeps the request/oracle and evidence
outside the reader root; inspect actual tool activity for isolation violations.
Tool use is required here and does not invalidate isolation. The packet-only
exercise's no-tools condition continues to apply only to that exercise.

Use a runnable fixture based on the exhibition case: accepted North equipment
must remain unchanged; a user amendment removes East evening only; an earlier
all-East-removal/public-announcement draft is rejected. Source rows are North
day=3, East evening=9, East day=2, West day=6; access is North approved, East and
West pending. The next authorized local output is a staffing CSV with site,
included_people and access_status. The controller's withheld acceptance is
North=3, East=2, West=6, total=11, pending access preserved, accepted equipment
bytes unchanged and no parent-ready/publication claim. Use distinct values or
entities for holdouts rather than teaching the reader this answer. The writer
must record all consequential obligations and their next use, not calculate the
output during closeout. Actual candidate closeout and mirror readback must pass.

Exercise these transport/decision conditions separately and retain first failures:

- A short sufficient packet; a large packet with critical decisions in its
  middle and tail; Unicode, CRLF and a long single line. The controller may
  insert clearly historical inert padding without editing the writer's facts.
- Actual output-budget truncation, including a response that preserves both
  header and footer but omits its body middle. A range/digest/footer alone is
  not reception proof; recover missing text or report incomplete without work.
- Native bounded reads when the optional helper is unavailable. No download,
  installation, new receipt file or extra source scan is permitted for startup.
- A file changed between chunks, an omitted middle range, missing tail,
  duplicate/reordered ranges, and an unreadable source. Mixed-version coverage
  cannot pass. Keep transport failure distinct from a task dependency blocker.
- A complete but insufficient packet, conflicting current instructions,
  rejected alternatives, a completed child with remaining parent obligations,
  missing source depth, and changed user intent. Full reception with a plausible
  but wrong next step fails semantic acceptance.
- An honest blocked task with a safe independent next step, a completed
  standalone task, and eligible first-use TBD. Do not convert valid uncertainty
  into blanket failure, invent extra work or break onboarding.

After bare startup, verify zero task writes and no unauthorized linked-source
reads. Then give that reader explicit authorization to continue the bounded
local task. It must read the actual required sources, produce the intended
artifact, read it back, preserve reusable work, and retain outstanding parent
acceptance. Add a distinct two-step holdout with explicit authorization to finish both local outputs; stopping after the first child without a blocker fails that scope. A correct summary followed by the wrong action is FAIL. If the authorized action includes a lightweight checkpoint, freeze its output and send a further fresh reader through bare startup: it must recover completed artifacts and the new next step without stale opening/mirror instructions to redo them. Keep unrelated cold evidence byte-stable; the checkpoint is not full closeout. Independently
grade the writer packet, delivered content, recovered meaning, action and result
against the withheld original request. Report these as separate evidence scopes;
do not turn one green card or served-range transcript into overall acceptance.

`check-handoff-read.mjs`, imported by the existing startup/pack scenario path,
checks bounded transport, snapshot drift, Unicode and unsafe roots, zero writes,
and no network even under forced update settings. Its observed-output evaluator
rejects gaps, tail loss, mixed versions and middle clipping with intact ends.
`check-startup-status-only.mjs` also rejects missing reception-contract clauses.
These are mechanical floors. Retain actual tool-result/reader/action evidence
for the real-file exercise, candidate identities, isolation limits and unresolved
gaps. Never claim universal or cross-model reliability from this bounded run.

## Startup naming consumer replay

For naming changes, give a fresh reader only the candidate core's Intent And
Startup section and `startup-title-cases.json`. Ask for each case's ordered
actions, proposed title or reason to keep/skip, final checkpoint result, and
whether task work begins. Treat the listed tool responses as fictional; do not
let the reader call real task-management tools or see an answer key. Preserve
its first response and grade against the user requirement and actual tool
schema. The cases cover direct/deferred/unsafe/absent capability, completed
objectives, unknown projects, user-chosen titles, later tasks, interruption,
ambiguous writes and bounded correction. These are decision replays, not proof
that an AI app executed or retained a title. Keep real host set/readback evidence
separate, and do not claim a universal post-response auto-title timing guarantee.

`scripts/check-startup-status-only.mjs` owns the mechanical naming contract and
missing-clause mutations; `check-pack-scenarios.mjs` imports it so the existing
quick/full pack checks exercise it. Core remains the runtime rule owner.

## Acceptance and limits

For governance rule-writing changes, additionally run
`node scripts/check-upgrade-safety.mjs --project-rules-only`. Its pinned
published 0.3.64 and 0.3.65 roots cover local appendix writes and edits,
upgrade/repeat preservation, LF/CRLF, and zero-write rejection of interleaved
core/pack rules. It does not grade whether an agent selected or applied a rule.

For the separate live consumer rehearsal, install the candidate in an isolated
root. Give a fresh writer only that root, the matching CLI path and a request
to add this durable local rule: every internal research-summary conclusion
must state source revision, actually read sections and unread coverage;
insufficient evidence stays unverified and no acceptance threshold or formal
approval may be invented. Do not tell the writer where to put it. Retain its
first output and changed files; compare protected bodies with original inputs.
Run an upgrade and retain the rule bytes. Give a different history-free reader
the root and a concrete internal-summary task with incomplete fictional data,
without the original rule request or writer's output. It must discover the
rule through normal routing, use it in the summary, distinguish an unresolved
source gap from a proved finding, and keep the user's draft scope. Record
actual reads and outputs; locating a file or passing a CLI is insufficient.
No real financial/private data or external publication is needed.

All decision-changing requirements and boundaries must survive. Missing or
distorted requirements fail until explicitly resolved. Exposing an absent
source is successful restraint, not completed source validation. Wording may
vary only when meaning, scope and action remain unchanged. Preserve exact terms
when translation changes action: venue access approval is not customs clearance.
The standalone case must not become a multi-stage governance task.

This tests faithful writing and reconstruction from finite fictional inputs.
It does not establish financial accuracy, real-world source validity, repeated
session retention, or reliability across all models. Further cases are justified
by affected behavior or a new failure; volume cannot prove universal correctness.
