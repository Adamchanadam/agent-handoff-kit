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

## Acceptance and limits

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
