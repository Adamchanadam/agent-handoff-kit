#!/usr/bin/env node
// Deterministic counterexamples for the external candidate-evidence binder.
// Fixtures prove contract handling only; they never claim human review occurred.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { checkFeatureDeliveryEvidence } from "./feature-delivery-cases.mjs";
import { FEATURE_DELIVERY_ACCEPTANCE_SCOPE_DIGEST, observableOperationReviewSubjectDigest, validateFeatureDelivery } from "./feature-delivery.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "scripts", "candidate-evidence.mjs");
const hash = value => createHash("sha256").update(value).digest("hex");
const readHash = file => hash(readFileSync(file));
const write = (file, value) => writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
const caseKey = (operation, item) => `${operation.id}:${operation.entry ?? "lifecycle"}:${item.id}:${item.scenario}`;
const work = mkdtempSync(path.join(tmpdir(), "ahk-candidate-evidence-"));

try {
  const featureDelivery = checkFeatureDeliveryEvidence({ root, evidencePath: "scripts/feature-delivery.mjs", evidenceSha256: readHash(path.join(root, "scripts", "feature-delivery.mjs")), fixtureRoot: work });
  for (const item of observableCases(featureDelivery)) item.independentReview = { verdict: "pending", requiredReviewerRole: "independent-readonly-reviewer", subjectDigest: observableOperationReviewSubjectDigest(item) };
  const input = path.join(work, ".candidate.json");
  write(input, candidate(featureDelivery)); const original = readHash(input);
  const planned = path.join(work, "planned");
  invoke(["plan", "--run-root", work, "--candidate", input, "--candidate-sha256", original, "--out", planned, "--writer", "candidate-writer"]);
  assert(readHash(input) === original, "plan mutated the supplied candidate clone");
  const waiting = path.join(planned, "candidate-evidence.json"); const waitingValue = JSON.parse(readFileSync(waiting));
  assert(!waitingValue.reviewReceipt && waitingValue.roleIsolation.stateHistory.at(-1) === "WAITING_INDEPENDENT_REVIEW", "plan did not produce waiting-only evidence");
  invoke(["validate", "--run-root", work, "--candidate", waiting, "--candidate-sha256", readHash(waiting)]);

  // Reproduce the former gap: raw pending operations cannot pass the actual consumer.
  assert.throws(() => validateFeatureDelivery(waitingValue.featureDelivery, featureOptions(featureDelivery)), /observable operation review is not accepted/);
  const sources = writeOperationSources(waiting, waitingValue, planned);
  const bound = path.join(work, "bound");
  invoke(bindArgs(waiting, sources, bound));
  const boundCandidate = path.join(bound, "candidate-evidence.json"); const boundValue = JSON.parse(readFileSync(boundCandidate));
  invoke(["validate", "--run-root", work, "--candidate", boundCandidate, "--candidate-sha256", readHash(boundCandidate)]);
  validateFeatureDelivery(boundValue.featureDelivery, featureOptions(featureDelivery));
  const boundCases = observableCases(boundValue.featureDelivery);
  assert(boundCases.length === 21 && boundCases.every(item => item.independentReview?.verdict === "accepted"), "bind-cases did not incorporate all independently reviewed cases");
  assert(boundCases.every(item => item.independentReview.evidence.length === 1 && item.independentReview.evidence[0].sha256 === readHash(sources.operationReview)), "individual review references do not bind the operation review source");
  assert(!boundValue.reviewReceipt && boundValue.roleIsolation.stateHistory.at(-1) === "WAITING_INDEPENDENT_REVIEW", "bind-cases retained a final receipt or changed waiting state");
  assert.deepEqual(boundValue.featureDelivery.acceptanceScope.unverifiedAgentSemantics, ["agent semantic interpretation", "host auto-discovery", "shortcut-body dispatch"], "bind-cases upgraded unverified semantics");

  const receipt = path.join(work, "bound-review.json"); write(receipt, finalReceipt(boundValue, readHash(path.join(bound, "review-bundle.json"))));
  invoke(["bind-review", "--run-root", work, "--candidate", boundCandidate, "--candidate-sha256", readHash(boundCandidate), "--review", receipt, "--review-sha256", readHash(receipt), "--out", path.join(work, "accepted"), "--transition-writer", "transition-writer"]);

  // Exact matrix, identity, raw evidence and actor counterexamples.
  const missing = cloneSource(sources.operationReview); missing.cases.pop(); failBind(waiting, { ...sources, operationReview: writeVariant("missing-review-case.json", missing) }, "missing review case");
  const duplicate = cloneSource(sources.operationReview); duplicate.cases.push(structuredClone(duplicate.cases[0])); failBind(waiting, { ...sources, operationReview: writeVariant("duplicate-review-case.json", duplicate) }, "duplicate review case");
  const extra = cloneSource(sources.operationReview); extra.cases.push({ ...structuredClone(extra.cases[0]), caseKey: "extra:lifecycle:normal:normal" }); failBind(waiting, { ...sources, operationReview: writeVariant("extra-review-case.json", extra) }, "extra review case");
  const wrongShape = cloneSource(sources.operationReview); wrongShape.cases[0].scenario = "wrong"; failBind(waiting, { ...sources, operationReview: writeVariant("wrong-review-shape.json", wrongShape) }, "wrong review shape");
  const wrongDigest = cloneSource(sources.decisions); wrongDigest.decisions[0].evidenceDigest = "0".repeat(64); failBind(waiting, { ...sources, decisions: writeVariant("wrong-decision-digest.json", wrongDigest) }, "wrong decision digest");
  const reviewerMismatch = cloneSource(sources.decisions); reviewerMismatch.decisions[0].reviewer.provenanceId = "other-reviewer"; failBind(waiting, { ...sources, decisions: writeVariant("reviewer-mismatch.json", reviewerMismatch) }, "reviewer mismatch");
  const writerMismatch = cloneSource(sources.decisions); writerMismatch.decisions[0].caseWriter.provenanceId = "other-writer"; failBind(waiting, { ...sources, decisions: writeVariant("writer-mismatch.json", writerMismatch) }, "case writer mismatch");
  const selfReview = cloneSource(sources.operationReview); selfReview.reviewer.provenanceId = "candidate-writer"; failBind(waiting, { ...sources, operationReview: writeVariant("self-review.json", selfReview) }, "self review");
  const rejected = cloneSource(sources.operationReview); rejected.verdict = "rejected"; failBind(waiting, { ...sources, operationReview: writeVariant("rejected-review.json", rejected) }, "rejected review");
  const pending = cloneSource(sources.operationReview); pending.cases[0].verdict = "pending"; failBind(waiting, { ...sources, operationReview: writeVariant("pending-case-review.json", pending) }, "pending case review");
  const crossCandidate = cloneSource(sources.operationReview); crossCandidate.candidateSha256 = "0".repeat(64); failBind(waiting, { ...sources, operationReview: writeVariant("cross-candidate-review.json", crossCandidate) }, "cross candidate replay");
  const scopeMismatch = cloneSource(sources.operationReview); scopeMismatch.acceptanceScopeDigest = "0".repeat(64); failBind(waiting, { ...sources, operationReview: writeVariant("scope-mismatch-review.json", scopeMismatch) }, "scope mismatch");
  const badManifest = cloneSource(sources.manifest); badManifest.cases.pop(); failBind(waiting, { ...sources, manifest: writeVariant("modified-manifest.json", badManifest) }, "modified manifest");
  fail(["bind-cases", "--run-root", work, "--candidate", waiting, "--candidate-sha256", readHash(waiting), "--cases", sources.decisions, "--cases-sha256", "0".repeat(64), "--operation-review", sources.operationReview, "--operation-review-sha256", readHash(sources.operationReview), "--case-manifest", sources.manifest, "--case-manifest-sha256", readHash(sources.manifest), "--out", path.join(work, "digest-drift"), "--transition-writer", "transition-writer"], "modified source bytes");
  const postIncorporation = structuredClone(boundValue); observableCases(postIncorporation.featureDelivery)[0].actual = "changed after review"; const postIncorporationPath = path.join(work, "post-incorporation.json"); write(postIncorporationPath, postIncorporation); fail(["validate", "--run-root", work, "--candidate", postIncorporationPath, "--candidate-sha256", readHash(postIncorporationPath)], "post incorporation change");
  const oldReceipt = structuredClone(waitingValue); oldReceipt.reviewReceipt = { stale: true }; const oldReceiptPath = path.join(work, "old-final-receipt.json"); write(oldReceiptPath, oldReceipt); fail(bindArgs(oldReceiptPath, sources, path.join(work, "old-receipt-output")), "old final receipt");
  fail(bindArgs(waiting, sources, bound), "output collision/resume");
  fail(["plan", "--run-root", work, "--candidate", input, "--candidate-sha256", original, "--out", path.join(root, "must-not-write-source"), "--writer", "candidate-writer"], "source-root output escape");
  console.log("ok: candidate-evidence independently binds the exact 21 reviewed operation cases, validates feature-delivery consumption, and rejects stale or self-authored review evidence");
} finally { rmSync(work, { recursive: true, force: true }); }

function candidate(featureDelivery) { const version = JSON.parse(readFileSync(path.join(root, "package.json"))).version; const identity = { version, packageJsonVersion: version, commit: "a".repeat(40), cleanWorktree: true, tarballSha256: featureDelivery.tarballSha256 }; return { schemaVersion: 1, kind: "candidate-assurance", candidate: identity, releaseBlockers: { schemaVersion: 1, kind: "candidate-release-blockers", candidate: { version: identity.version, commit: identity.commit, tarballSha256: identity.tarballSha256 }, state: "clear", items: [] }, manifestDigest: "c".repeat(64), releaseReadinessInventoryDigest: "d".repeat(64), featureDelivery, manualVerdicts: { alpha: "passed" }, evidence: [{ path: path.join(root, "scripts", "feature-delivery.mjs"), sha256: readHash(path.join(root, "scripts", "feature-delivery.mjs")) }] }; }
function observableCases(featureDelivery) { return featureDelivery.observableOperations.flatMap(operation => operation.cases); }
function featureOptions(featureDelivery) { return { root, changedFiles: ["bin/commands.mjs"], tarballSha256: featureDelivery.tarballSha256, baseCommit: featureDelivery.baseCommit, candidateVersion: JSON.parse(readFileSync(path.join(root, "package.json"))).version }; }
function writeOperationSources(waiting, value, planned) {
  const manifest = path.join(planned, "case-manifest.json"), bundle = path.join(planned, "review-bundle.json"), receivedAt = "2026-10-06T18:10:13Z";
  const cases = [];
  for (const operation of value.featureDelivery.observableOperations) for (const item of operation.cases) cases.push({ caseKey: caseKey(operation, item), operation: operation.id, id: item.id, scenario: item.scenario, outcome: item.outcome, verdict: "accepted", subjectDigest: observableOperationReviewSubjectDigest(item), reason: "fixture independent review", evidence: item.evidence });
  const operationReview = path.join(work, "operation-review.json");
  write(operationReview, { schemaVersion: 1, kind: "independent-observable-operation-review", verdict: "accepted", reviewer: { role: "independent-readonly-reviewer", provenanceId: "case-reviewer" }, receivedAt, candidate: value.candidate, candidateSha256: readHash(waiting), reviewBundleSha256: readHash(bundle), caseManifestSha256: readHash(manifest), acceptanceScopeDigest: FEATURE_DELIVERY_ACCEPTANCE_SCOPE_DIGEST, accepted: cases.length, rejected: 0, cases });
  const decisions = path.join(work, "case-decisions.json"), manifestValue = JSON.parse(readFileSync(manifest));
  write(decisions, { schemaVersion: 1, kind: "candidate-case-decisions", candidateSha256: readHash(waiting), sourceOwner: "scripts/feature-delivery.mjs", sourceOwnerDigest: manifestValue.sourceOwnerDigest, acceptanceScopeDigest: FEATURE_DELIVERY_ACCEPTANCE_SCOPE_DIGEST, decisions: cases.map(review => ({ caseKey: review.caseKey, outcome: review.outcome, definitionDigest: manifestValue.cases.find(item => item.caseKey === review.caseKey).definitionDigest, evidenceDigest: review.subjectDigest, verdict: "accepted", reviewer: { role: "independent-readonly-reviewer", provenanceId: "case-reviewer" }, caseWriter: structuredClone(observableCases(value.featureDelivery).find(item => observableOperationReviewSubjectDigest(item) === review.subjectDigest).writerProvenance), receivedAt })) });
  return { decisions, operationReview, manifest };
}
function bindArgs(waiting, sources, out) { return ["bind-cases", "--run-root", work, "--candidate", waiting, "--candidate-sha256", readHash(waiting), "--cases", sources.decisions, "--cases-sha256", readHash(sources.decisions), "--operation-review", sources.operationReview, "--operation-review-sha256", readHash(sources.operationReview), "--case-manifest", sources.manifest, "--case-manifest-sha256", readHash(sources.manifest), "--transition-writer", "transition-writer", "--out", out]; }
function cloneSource(file) { return JSON.parse(readFileSync(file)); }
function writeVariant(name, value) { const file = path.join(work, name); write(file, value); return file; }
function finalReceipt(candidateValue, bundleSha256) { const subject = subjectFor(candidateValue); return { schemaVersion: 1, verdict: "accepted", provenanceBoundary: candidateValue.roleIsolation.provenanceBoundary, reviewer: { role: "independent-readonly-reviewer", provenanceId: "final-reviewer" }, candidate: candidateValue.candidate, manifestDigest: candidateValue.manifestDigest, releaseReadinessInventoryDigest: candidateValue.releaseReadinessInventoryDigest, reviewBundleSha256: bundleSha256, reviewSubjectDigest: hash(JSON.stringify(subject)), fiveConclusions: candidateValue.manualVerdicts, releaseBlockers: candidateValue.releaseBlockers, acceptanceScope: candidateValue.featureDelivery.acceptanceScope, acceptanceScopeDigest: candidateValue.featureDelivery.acceptanceScopeDigest, receivedAt: "2026-01-01T00:00:00.000Z" }; }
function subjectFor(value) { const subject = { featureDelivery: value.featureDelivery, acceptanceScope: value.featureDelivery.acceptanceScope, acceptanceScopeDigest: value.featureDelivery.acceptanceScopeDigest, version: value.candidate.version, candidateCommit: value.candidate.commit, tarballSha256: value.candidate.tarballSha256, manifestDigest: value.manifestDigest, releaseReadinessInventoryDigest: value.releaseReadinessInventoryDigest, evidenceRecords: value.evidence, manualVerdicts: value.manualVerdicts, releaseBlockers: value.releaseBlockers, stateHistory: value.roleIsolation.reviewSubjectStateHistory }; if (value.caseDecisionBinding) subject.caseDecisionBinding = value.caseDecisionBinding; return subject; }
function invoke(args) { const result = spawnSync(process.execPath, [script, ...args], { encoding: "utf8" }); assert.equal(result.status, 0, `${args[0]} failed: ${result.error?.message ?? result.stderr}`); }
function fail(args, label) { const result = spawnSync(process.execPath, [script, ...args], { encoding: "utf8" }); assert.notEqual(result.status, 0, `${label} unexpectedly passed`); }
function failBind(waiting, sources, label) { fail(bindArgs(waiting, sources, path.join(work, `bad-${label.replace(/\s/g, "-")}`)), label); }
