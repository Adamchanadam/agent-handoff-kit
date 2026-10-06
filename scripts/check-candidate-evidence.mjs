#!/usr/bin/env node
// Deterministic counterexamples for the external candidate-evidence binder.
// These are fixture checks only: they never claim that a human review happened.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { FEATURE_DELIVERY_ACCEPTANCE_SCOPE_DIGEST, REQUIRED_OBSERVABLE_OPERATIONS } from "./feature-delivery.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "scripts", "candidate-evidence.mjs");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const readHash = (file) => hash(readFileSync(file));
const write = (file, value) => writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");

const work = mkdtempSync(path.join(tmpdir(), "ahk-candidate-evidence-"));
try {
  const input = path.join(work, ".candidate.json"); // dot-file input catches path-extension assumptions.
  write(input, candidate()); const original = readHash(input);
  const planned = path.join(work, "planned");
  invoke(["plan", "--run-root", work, "--candidate", input, "--candidate-sha256", original, "--out", planned, "--writer", "candidate-writer"]);
  assert(readHash(input) === original, "plan mutated the supplied candidate clone");
  const waiting = path.join(planned, "candidate-evidence.json"); const waitingValue = JSON.parse(readFileSync(waiting));
  assert(!waitingValue.reviewReceipt && waitingValue.roleIsolation.stateHistory.at(-1) === "WAITING_INDEPENDENT_REVIEW", "plan did not produce waiting-only evidence");
  invoke(["validate", "--run-root", work, "--candidate", waiting, "--candidate-sha256", readHash(waiting)]);
  const directReceipt = path.join(work, "direct-review.json"); write(directReceipt, finalReceipt(waitingValue, readHash(path.join(planned, "review-bundle.json"))));
  invoke(["validate", "--run-root", work, "--candidate", waiting, "--candidate-sha256", readHash(waiting), "--review", directReceipt, "--review-sha256", readHash(directReceipt), "--transition-writer", "transition-writer"]);
  const invalidSchema = path.join(work, "invalid-schema-review.json"); write(invalidSchema, { ...finalReceipt(waitingValue, readHash(path.join(planned, "review-bundle.json"))), schemaVersion: 999 }); failValidate(invalidSchema, "schema 999", "review receipt schema/version is invalid");
  const rejectedReview = path.join(work, "rejected-review.json"); write(rejectedReview, { ...finalReceipt(waitingValue, readHash(path.join(planned, "review-bundle.json"))), verdict: "rejected" }); failValidate(rejectedReview, "rejected verdict", "review receipt must be accepted");
  const wrongProvenance = path.join(work, "wrong-provenance-review.json"); write(wrongProvenance, { ...finalReceipt(waitingValue, readHash(path.join(planned, "review-bundle.json"))), provenanceBoundary: "wrong" }); failValidate(wrongProvenance, "wrong provenance", "review receipt provenance boundary drifted");
  const writerReview = path.join(work, "writer-review.json"); const writerReviewValue = finalReceipt(waitingValue, readHash(path.join(planned, "review-bundle.json"))); writerReviewValue.reviewer.provenanceId = "candidate-writer"; write(writerReview, writerReviewValue); failValidate(writerReview, "candidate writer review", "candidate writer cannot self-review");
  const directOverlap = path.join(work, "direct-transition-overlap.json"); const directOverlapValue = finalReceipt(waitingValue, readHash(path.join(planned, "review-bundle.json"))); directOverlapValue.reviewer.provenanceId = "transition-writer"; write(directOverlap, directOverlapValue);
  fail(["bind-review", "--run-root", work, "--candidate", waiting, "--candidate-sha256", readHash(waiting), "--review", directOverlap, "--review-sha256", readHash(directOverlap), "--out", path.join(work, "direct-overlap-output"), "--transition-writer", "transition-writer"], "direct transition writer final review", "transition writer cannot self-review");
  const directAccepted = path.join(work, "direct-accepted");
  invoke(["bind-review", "--run-root", work, "--candidate", waiting, "--candidate-sha256", readHash(waiting), "--review", directReceipt, "--review-sha256", readHash(directReceipt), "--out", directAccepted, "--transition-writer", "transition-writer"]);
  const directValue = JSON.parse(readFileSync(path.join(directAccepted, "candidate-evidence.json")));
  assert(directValue.roleIsolation.reviewBundle.sha256 === readHash(path.join(planned, "review-bundle.json")) && directValue.roleIsolation.reviewBundle.path === waitingValue.roleIsolation.reviewBundle.path, "direct review did not preserve the frozen waiting bundle");
  const decision = decisionFile(waiting, waitingValue);
  const bound = path.join(work, "bound");
  invoke(["bind-cases", "--run-root", work, "--candidate", waiting, "--candidate-sha256", readHash(waiting), "--cases", decision, "--cases-sha256", readHash(decision), "--out", bound, "--transition-writer", "transition-writer"]);
  const boundCandidate = path.join(bound, "candidate-evidence.json"); const boundValue = JSON.parse(readFileSync(boundCandidate));
  assert(boundValue.caseDecisionBinding.decisions.length === boundValue.caseDecisionBinding.cases.length, "bind-cases did not cover the exact case set");
  const receipt = path.join(work, "bound-review.json"); write(receipt, finalReceipt(boundValue, readHash(path.join(bound, "review-bundle.json"))));
  const accepted = path.join(work, "accepted");
  invoke(["bind-review", "--run-root", work, "--candidate", boundCandidate, "--candidate-sha256", readHash(boundCandidate), "--review", receipt, "--review-sha256", readHash(receipt), "--out", accepted, "--transition-writer", "transition-writer"]);
  const acceptedValue = JSON.parse(readFileSync(path.join(accepted, "candidate-evidence.json")));
  assert(acceptedValue.reviewReceiptSource.sha256 === readHash(receipt) && acceptedValue.roleIsolation.stateHistory.at(-1) === "REVIEW_ACCEPTED" && acceptedValue.roleIsolation.reviewBundle.sha256 === readHash(path.join(bound, "review-bundle.json")), "bound review did not preserve its frozen source bytes");

  // exact-set, digest, actor and state counterexamples
  const missing = path.join(work, "missing.json"); write(missing, { ...JSON.parse(readFileSync(decision)), decisions: [] }); failBindCases(missing, "missing");
  const duplicate = path.join(work, "duplicate.json"); const duplicateValue = JSON.parse(readFileSync(decision)); duplicateValue.decisions.push(structuredClone(duplicateValue.decisions[0])); write(duplicate, duplicateValue); failBindCases(duplicate, "duplicate");
  fail(["bind-cases", "--run-root", work, "--candidate", waiting, "--candidate-sha256", readHash(waiting), "--cases", decision, "--cases-sha256", "0".repeat(64), "--out", path.join(work, "digest-drift"), "--transition-writer", "transition-writer"], "digest drift");
  const overlap = path.join(work, "overlap.json"); const overlapValue = JSON.parse(readFileSync(decision)); overlapValue.decisions[0].reviewer.provenanceId = "candidate-writer"; write(overlap, overlapValue); failBindCases(overlap, "actor overlap");
  const staleOutcome = path.join(work, "stale-outcome.json"); const staleOutcomeValue = JSON.parse(readFileSync(decision)); staleOutcomeValue.decisions[0].outcome = "not-current"; write(staleOutcome, staleOutcomeValue); failBindCases(staleOutcome, "stale outcome");
  const javascript = path.join(work, "source.js.json"); writeFileSync(javascript, "throw new Error('not JSON');\n", "utf8"); failBindCases(javascript, "non-json source", "case decisions is not JSON");
  const mismatch = path.join(work, "mismatch.json"); const mismatchValue = JSON.parse(readFileSync(decision)); mismatchValue.decisions[0].definitionDigest = "0".repeat(64); write(mismatch, mismatchValue); failBindCases(mismatch, "decision mismatch", "case decision does not bind the current outcome/digest");
  const rejected = path.join(work, "rejected.json"); const rejectedValue = JSON.parse(readFileSync(decision)); rejectedValue.decisions[0].verdict = "rejected"; write(rejected, rejectedValue); failBindCases(rejected, "rejected case");
  const boundBundleSha = readHash(path.join(bound, "review-bundle.json"));
  const badReview = path.join(work, "pending-review.json"); write(badReview, { ...finalReceipt(boundValue, boundBundleSha), verdict: "pending" }); failReview(badReview, "pending review");
  const oldSubject = path.join(work, "old-subject.json"); write(oldSubject, { ...finalReceipt(boundValue, boundBundleSha), reviewSubjectDigest: "0".repeat(64) }); failReview(oldSubject, "old subject receipt");
  const unverified = path.join(work, "unverified.json"); const unverifiedValue = finalReceipt(boundValue, boundBundleSha); unverifiedValue.acceptanceScope = { unverified: "UNVERIFIED" }; write(unverified, unverifiedValue); failReview(unverified, "UNVERIFIED scope mismatch");
  const transitionOverlap = path.join(work, "transition-overlap.json"); const transitionOverlapValue = finalReceipt(boundValue, boundBundleSha); transitionOverlapValue.reviewer.provenanceId = "transition-writer"; write(transitionOverlap, transitionOverlapValue); failReview(transitionOverlap, "transition writer final review", "transition writer cannot self-review");
  fail(["plan", "--run-root", work, "--candidate", input, "--candidate-sha256", original, "--out", planned, "--writer", "candidate-writer"], "output collision/resume");
  const markdown = path.join(work, "candidate.md"); writeFileSync(markdown, readFileSync(input)); fail(["plan", "--run-root", work, "--candidate", markdown, "--candidate-sha256", readHash(markdown), "--out", path.join(work, "markdown-output"), "--writer", "candidate-writer"], "dot-md class input");
  fail(["plan", "--run-root", work, "--candidate", input, "--candidate-sha256", original, "--out", path.join(root, "must-not-write-source"), "--writer", "candidate-writer"], "source-root output escape");
  console.log("ok: candidate-evidence direct, waiting, exact-case and path-boundary fixtures");
} finally { rmSync(work, { recursive: true, force: true }); }

function candidate() { return { schemaVersion: 1, kind: "candidate-assurance", candidate: { version: "9.9.9", commit: "a".repeat(40), tarballSha256: "b".repeat(64) }, manifestDigest: "c".repeat(64), releaseReadinessInventoryDigest: "d".repeat(64), featureDelivery: { acceptanceScope: { unverifiedAgentSemantics: ["dispatch"] }, acceptanceScopeDigest: "e".repeat(64) }, manualVerdicts: { alpha: "passed" }, evidence: [{ path: "external", sha256: "f".repeat(64) }] }; }
function caseManifest() { return REQUIRED_OBSERVABLE_OPERATIONS.flatMap((operation) => operation.cases.map((item) => { const source = { operation: operation.id, entry: operation.entry, id: item.id, scenario: item.scenario, outcome: item.outcome }; return { ...source, caseKey: `${operation.id}:${operation.entry ?? "lifecycle"}:${item.id}:${item.scenario}`, definitionDigest: hash(JSON.stringify(source)) }; })); }
function sourceOwnerDigest() { return hash(JSON.stringify(REQUIRED_OBSERVABLE_OPERATIONS)); }
function decisionFile(waiting) { const file = path.join(work, "case-decisions.json"); write(file, { schemaVersion: 1, kind: "candidate-case-decisions", candidateSha256: readHash(waiting), sourceOwner: "scripts/feature-delivery.mjs", sourceOwnerDigest: sourceOwnerDigest(), acceptanceScopeDigest: FEATURE_DELIVERY_ACCEPTANCE_SCOPE_DIGEST, decisions: caseManifest().map((entry) => ({ caseKey: entry.caseKey, outcome: entry.outcome, definitionDigest: entry.definitionDigest, evidenceDigest: hash(entry.caseKey), verdict: "accepted", reviewer: { role: "independent-readonly-reviewer", provenanceId: "case-reviewer" }, caseWriter: { role: "workspace-writer", provenanceId: `case-writer-${entry.id}` }, receivedAt: "2026-01-01T00:00:00.000Z" })) }); return file; }
function finalReceipt(candidateValue, bundleSha256) { const subject = subjectFor(candidateValue); return { schemaVersion: 1, verdict: "accepted", provenanceBoundary: candidateValue.roleIsolation.provenanceBoundary, reviewer: { role: "independent-readonly-reviewer", provenanceId: "final-reviewer" }, candidate: candidateValue.candidate, manifestDigest: candidateValue.manifestDigest, releaseReadinessInventoryDigest: candidateValue.releaseReadinessInventoryDigest, reviewBundleSha256: bundleSha256, reviewSubjectDigest: hash(JSON.stringify(subject)), fiveConclusions: candidateValue.manualVerdicts, acceptanceScope: candidateValue.featureDelivery.acceptanceScope, acceptanceScopeDigest: candidateValue.featureDelivery.acceptanceScopeDigest, receivedAt: "2026-01-01T00:00:00.000Z" }; }
function subjectFor(value) { const subject = { featureDelivery: value.featureDelivery, acceptanceScope: value.featureDelivery.acceptanceScope, acceptanceScopeDigest: value.featureDelivery.acceptanceScopeDigest, version: value.candidate.version, candidateCommit: value.candidate.commit, tarballSha256: value.candidate.tarballSha256, manifestDigest: value.manifestDigest, releaseReadinessInventoryDigest: value.releaseReadinessInventoryDigest, evidenceRecords: value.evidence, manualVerdicts: value.manualVerdicts, stateHistory: value.roleIsolation.reviewSubjectStateHistory }; if (value.caseDecisionBinding) subject.caseDecisionBinding = value.caseDecisionBinding; return subject; }
function failBindCases(file, label, reason) { fail(["bind-cases", "--run-root", work, "--candidate", path.join(work, "planned", "candidate-evidence.json"), "--candidate-sha256", readHash(path.join(work, "planned", "candidate-evidence.json")), "--cases", file, "--cases-sha256", readHash(file), "--out", path.join(work, `bad-${label.replace(/\s/g, "-")}`), "--transition-writer", "transition-writer"], label, reason); }
function failReview(file, label, reason) { const candidatePath = path.join(work, "bound", "candidate-evidence.json"); fail(["bind-review", "--run-root", work, "--candidate", candidatePath, "--candidate-sha256", readHash(candidatePath), "--review", file, "--review-sha256", readHash(file), "--out", path.join(work, `bad-review-${label.replace(/\s/g, "-")}`), "--transition-writer", "transition-writer"], label, reason); }
function failValidate(file, label, reason) { const candidatePath = path.join(work, "planned", "candidate-evidence.json"); fail(["validate", "--run-root", work, "--candidate", candidatePath, "--candidate-sha256", readHash(candidatePath), "--review", file, "--review-sha256", readHash(file), "--transition-writer", "transition-writer"], label, reason); }
function invoke(args) { const result = spawnSync(process.execPath, [script, ...args], { encoding: "utf8" }); assert.equal(result.status, 0, `${args[0]} failed: ${result.error?.message ?? result.stderr}`); }
function fail(args, label, reason = null) { const result = spawnSync(process.execPath, [script, ...args], { encoding: "utf8" }); assert.notEqual(result.status, 0, `${label} unexpectedly passed`); if (reason) assert(`${result.stdout}\n${result.stderr}`.includes(reason), `${label} failed for the wrong reason: ${result.stderr}`); }
