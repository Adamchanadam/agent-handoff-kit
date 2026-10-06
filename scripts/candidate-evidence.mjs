#!/usr/bin/env node
// Builds and binds candidate-review evidence outside the candidate source tree.
// It deliberately records provenance; it does not create a formal full receipt.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, openSync, closeSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CANDIDATE_EVIDENCE_CONTRACT } from "./qa-assurance-manifest.mjs";
import { FEATURE_DELIVERY_ACCEPTANCE_SCOPE_DIGEST, REQUIRED_OBSERVABLE_OPERATIONS } from "./feature-delivery.mjs";
import { semanticEqual } from "./qa.mjs";

const sourceRoot = realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = /^[a-f0-9]{64}$/i;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(parseArgs(process.argv.slice(2))); }
  catch (error) { console.error(`candidate evidence failed: ${error.message}`); process.exitCode = 1; }
}

function main(options) {
  const runRoot = canonicalDirectory(options.runRoot, "--run-root");
  assert(!inside(sourceRoot, runRoot), "--run-root must be outside the Public source root");
  const candidate = readVerifiedJson(options.candidate, options.candidateSha256, runRoot, "candidate");
  if (options.command === "validate") return validate(candidate, options, runRoot);
  const output = freshOutput(options.out, runRoot);
  if (options.command === "plan") return plan(candidate, options, output);
  if (options.command === "bind-cases") return bindCases(candidate, options, runRoot, output);
  return bindReview(candidate, options, runRoot, output);
}

function plan(input, options, output) {
  const writer = requiredIdentity(options.writer, "--writer");
  const candidate = prepareWaitingCandidate(input.value, writer);
  writeWaitingSet(output, candidate, { schemaVersion: 1, kind: "candidate-case-manifest", sourceOwner: "scripts/feature-delivery.mjs", sourceOwnerDigest: sourceOwnerDigest(), acceptanceScopeDigest: FEATURE_DELIVERY_ACCEPTANCE_SCOPE_DIGEST, candidateInputSha256: input.sha256, cases: caseManifest() });
}

function bindCases(input, options, runRoot, output) {
  const transitionWriter = requiredIdentity(options.transitionWriter, "--transition-writer");
  const decisionInput = readVerifiedJson(options.cases, options.casesSha256, runRoot, "case decisions");
  const decisions = decisionInput.value;
  const candidate = structuredClone(input.value);
  assert(candidate.roleIsolation?.reviewBundle, "bind-cases requires a waiting candidate");
  validateWaitingCandidate(candidate, runRoot);
  const expected = caseManifest();
  const accepted = parseCaseDecisionSource(decisions, candidate, expected, input.sha256, transitionWriter);
  candidate.caseDecisionBinding = { schemaVersion: 1, kind: "candidate-case-decision-binding", sourceOwner: "scripts/feature-delivery.mjs", sourceOwnerDigest: sourceOwnerDigest(), acceptanceScopeDigest: FEATURE_DELIVERY_ACCEPTANCE_SCOPE_DIGEST, candidateInputSha256: input.sha256, cases: expected, decisions: accepted, source: { path: decisionInput.path, sha256: decisionInput.sha256 }, sourceManifest: decisions, transitionWriter: { role: CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.transitionRole, provenanceId: transitionWriter } };
  candidate.reviewReceipt = undefined;
  delete candidate.reviewReceipt;
  writeWaitingSet(output, candidate);
}

function bindReview(input, options, runRoot, output) {
  const transitionWriter = requiredIdentity(options.transitionWriter, "--transition-writer");
  const receiptInput = readVerifiedJson(options.review, options.reviewSha256, runRoot, "review receipt");
  const candidate = structuredClone(input.value);
  const frozen = validateWaitingCandidate(candidate, runRoot);
  validateReviewReceipt(receiptInput.value, candidate, frozen, transitionWriter);
  candidate.roleIsolation.stateHistory = [...CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.fullGateAcceptedPath];
  candidate.roleIsolation.transition = { role: CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.transitionRole, provenanceId: transitionWriter };
  candidate.reviewReceipt = receiptInput.value;
  candidate.reviewReceiptSource = { path: receiptInput.path, sha256: receiptInput.sha256 };
  if (candidate.caseDecisionBinding) assert(semanticEqual(candidate.caseDecisionBinding.transitionWriter, candidate.roleIsolation.transition), "bind-review transition writer does not match the bound case decision transition");
  writeAcceptedSet(output, candidate);
}

function validate(input, options, runRoot) {
  const frozen = validateWaitingCandidate(input.value, runRoot);
  if (options.review) {
    const receipt = readVerifiedJson(options.review, options.reviewSha256, runRoot, "review receipt").value;
    validateReviewReceipt(receipt, input.value, frozen, requiredIdentity(options.transitionWriter, "--transition-writer"));
  }
  console.log(`ok: candidate evidence validates (${input.sha256})`);
}

function prepareWaitingCandidate(input, writer) {
  assert(input?.kind === "candidate-assurance" && input.schemaVersion === 1, "candidate has the wrong schema");
  const candidate = structuredClone(input);
  candidate.writerProvenance = { role: CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.writerRole, provenanceId: writer };
  candidate.roleIsolation = { provenanceBoundary: CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.provenanceBoundary, stateHistory: [...CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.reviewSubjectPath], reviewSubjectStateHistory: [...CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.reviewSubjectPath] };
  delete candidate.reviewReceipt; delete candidate.reviewReceiptSource;
  return candidate;
}

function writeWaitingSet(output, candidate, manifest = null) {
  const { subject, subjectDigest } = makeSubject(candidate);
  const bundle = makeBundle(candidate, subject, "WAITING_INDEPENDENT_REVIEW");
  candidate.roleIsolation.reviewSubjectDigest = subjectDigest;
  candidate.roleIsolation.reviewBundle = { path: path.join(output, "review-bundle.json"), sha256: digest(Buffer.from(json(bundle))) };
  writeSet(output, candidate, subject, bundle);
  if (manifest) writeExclusive(path.join(output, "case-manifest.json"), json(manifest));
  console.log(`ok: waiting candidate evidence written to ${output}`);
}

function writeAcceptedSet(output, candidate) {
  mkdirSync(output);
  assert(lstatSync(output).isDirectory() && !lstatSync(output).isSymbolicLink() && samePath(realpathSync(output), output), "output changed to a link or junction during creation");
  writeExclusive(path.join(output, "candidate-evidence.json"), json(candidate));
  console.log(`ok: accepted candidate evidence prepared at ${output}`);
}

function writeSet(output, candidate, subject, bundle) {
  mkdirSync(output); // exclusive fresh directory checked immediately before creation
  assert(lstatSync(output).isDirectory() && !lstatSync(output).isSymbolicLink() && samePath(realpathSync(output), output), "output changed to a link or junction during creation");
  writeExclusive(path.join(output, "review-subject.json"), json(subject));
  writeExclusive(path.join(output, "review-bundle.json"), json(bundle));
  writeExclusive(path.join(output, "candidate-evidence.json"), json(candidate));
}

function makeSubject(candidate) {
  const subject = {
    featureDelivery: candidate.featureDelivery,
    acceptanceScope: candidate.featureDelivery?.acceptanceScope,
    acceptanceScopeDigest: candidate.featureDelivery?.acceptanceScopeDigest,
    version: candidate.candidate?.version,
    candidateCommit: candidate.candidate?.commit,
    tarballSha256: candidate.candidate?.tarballSha256,
    manifestDigest: candidate.manifestDigest,
    releaseReadinessInventoryDigest: candidate.releaseReadinessInventoryDigest,
    evidenceRecords: candidate.evidence,
    manualVerdicts: candidate.manualVerdicts,
    stateHistory: [...CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.reviewSubjectPath]
  };
  if (candidate.machineResults) { subject.machineResults = candidate.machineResults; subject.machineResultsDigest = candidate.machineResultsDigest; }
  if (candidate.caseDecisionBinding) subject.caseDecisionBinding = candidate.caseDecisionBinding;
  return { subject, subjectDigest: digest(Buffer.from(JSON.stringify(subject))) };
}

function makeBundle(candidate, subject, state) {
  return { schemaVersion: 1, kind: "role-isolation-review-bundle", state, stateHistory: [...CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.reviewSubjectPath], candidate: { version: candidate.candidate?.version, commit: candidate.candidate?.commit, tarballSha256: candidate.candidate?.tarballSha256 }, manifestDigest: candidate.manifestDigest, releaseReadinessInventoryDigest: candidate.releaseReadinessInventoryDigest, fiveConclusions: candidate.manualVerdicts, reviewSubjectDigest: digest(Buffer.from(JSON.stringify(subject))), reviewSubject: subject };
}

function assertReceiptBinds(receipt, candidate, bundleSha256, subjectDigest) {
  assert(receipt.candidate?.version === candidate.candidate?.version && receipt.candidate?.commit === candidate.candidate?.commit && receipt.candidate?.tarballSha256 === candidate.candidate?.tarballSha256, "review receipt candidate identity does not bind the current candidate");
  assert(receipt.manifestDigest === candidate.manifestDigest && receipt.releaseReadinessInventoryDigest === candidate.releaseReadinessInventoryDigest, "review receipt source contract does not bind the current candidate");
  assert(receipt.reviewBundleSha256 === bundleSha256, "review receipt does not bind the exact frozen waiting review bundle bytes");
  assert(receipt.reviewSubjectDigest === subjectDigest, "review receipt does not bind the exact review subject");
  assert(semanticEqual(receipt.fiveConclusions, candidate.manualVerdicts), "review receipt conclusions do not bind the candidate");
  assert(semanticEqual(receipt.acceptanceScope, candidate.featureDelivery?.acceptanceScope) && receipt.acceptanceScopeDigest === candidate.featureDelivery?.acceptanceScopeDigest, "review receipt acceptance scope does not bind the candidate");
  requiredText(receipt.receivedAt, "review receipt receivedAt");
}

function validateReviewReceipt(receipt, candidate, frozen, transitionWriter) {
  assert(receipt && typeof receipt === "object" && !Array.isArray(receipt), "review receipt must be an object");
  assert(receipt.schemaVersion === 1, "review receipt schema/version is invalid");
  assert(receipt.verdict === "accepted", "review receipt must be accepted");
  assert(receipt.provenanceBoundary === CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.provenanceBoundary, "review receipt provenance boundary drifted");
  assert(receipt.reviewer?.role === CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.reviewerRole, "review receipt reviewer role is invalid");
  const reviewerId = requiredIdentity(receipt.reviewer?.provenanceId, "review receipt reviewer");
  assert(reviewerId !== candidate.writerProvenance?.provenanceId, "candidate writer cannot self-review");
  assert(reviewerId !== transitionWriter, "transition writer cannot self-review");
  if (candidate.caseDecisionBinding) assert(semanticEqual(candidate.caseDecisionBinding.transitionWriter, { role: CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.transitionRole, provenanceId: transitionWriter }), "review transition writer does not match the persisted case transition");
  for (const decision of candidate.caseDecisionBinding?.decisions ?? []) assert(reviewerId !== decision.caseWriter.provenanceId, "case writer cannot give the final review");
  assertReceiptBinds(receipt, candidate, frozen.bundleSha256, frozen.subjectDigest);
}

function caseManifest() {
  const cases = REQUIRED_OBSERVABLE_OPERATIONS.flatMap((operation) => operation.cases.map((item) => {
    const source = { operation: operation.id, entry: operation.entry, id: item.id, scenario: item.scenario, outcome: item.outcome };
    return { ...source, caseKey: `${operation.id}:${operation.entry ?? "lifecycle"}:${item.id}:${item.scenario}`, definitionDigest: digest(Buffer.from(JSON.stringify(source))) };
  }));
  const unique = new Set(cases.map((entry) => entry.caseKey)); assert(unique.size === cases.length && cases.length, "feature-delivery source owner must expose a non-empty exact case set");
  return cases;
}
function sourceOwnerDigest() { return digest(Buffer.from(JSON.stringify(REQUIRED_OBSERVABLE_OPERATIONS))); }

function validateWaitingCandidate(candidate, runRoot) {
  assert(candidate?.kind === "candidate-assurance" && candidate.schemaVersion === 1, "candidate has the wrong schema");
  assert(candidate.writerProvenance?.role === CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.writerRole && requiredIdentity(candidate.writerProvenance?.provenanceId, "candidate writer"), "candidate writer provenance is invalid");
  assert(!candidate.reviewReceipt && !candidate.reviewReceiptSource, "waiting candidate cannot already carry an accepted receipt");
  assert(semanticEqual(candidate.roleIsolation?.stateHistory, CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.reviewSubjectPath), "candidate is not in the exact waiting state");
  assert(semanticEqual(candidate.roleIsolation?.reviewSubjectStateHistory, CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.reviewSubjectPath), "candidate review subject state is invalid");
  const reference = candidate.roleIsolation?.reviewBundle;
  assert(reference?.path && sha256.test(reference.sha256 ?? ""), "waiting candidate review bundle reference is invalid");
  const bundleInput = readVerifiedJson(reference.path, reference.sha256, runRoot, "waiting review bundle");
  const bundle = bundleInput.value;
  assert(bundle.kind === "role-isolation-review-bundle" && bundle.schemaVersion === 1 && bundle.state === "WAITING_INDEPENDENT_REVIEW", "review bundle is not a frozen waiting bundle");
  const current = makeSubject(candidate);
  assert(bundle.reviewSubjectDigest === current.subjectDigest && candidate.roleIsolation.reviewSubjectDigest === current.subjectDigest, "waiting review subject digest drifted");
  assert(semanticEqual(bundle.reviewSubject, current.subject), "waiting review bundle subject drifted");
  assert(semanticEqual(bundle.stateHistory, candidate.roleIsolation.reviewSubjectStateHistory), "waiting review bundle state history drifted");
  if (candidate.caseDecisionBinding) validateCaseDecisionBinding(candidate.caseDecisionBinding, candidate, runRoot);
  return { bundle, bundleSha256: bundleInput.sha256, subjectDigest: current.subjectDigest };
}

function validateCaseDecisionBinding(binding, candidate, runRoot) {
  assert(binding.kind === "candidate-case-decision-binding" && binding.schemaVersion === 1, "case decision binding has the wrong schema");
  assert(binding.sourceOwner === "scripts/feature-delivery.mjs" && binding.sourceOwnerDigest === sourceOwnerDigest(), "case decision binding source owner drifted");
  assert(binding.acceptanceScopeDigest === FEATURE_DELIVERY_ACCEPTANCE_SCOPE_DIGEST, "case decision binding scope drifted");
  assert(semanticEqual(binding.cases, caseManifest()), "case decision binding does not cover the current exact case set");
  assert(Array.isArray(binding.decisions) && binding.decisions.length === binding.cases.length, "case decision binding is incomplete");
  assert(binding.source?.path && sha256.test(binding.source.sha256 ?? ""), "case decision binding source is invalid");
  const source = readVerifiedJson(binding.source.path, binding.source.sha256, runRoot, "case decision source").value;
  assert(semanticEqual(binding.sourceManifest, source), "case decision binding discarded or changed its parsed source manifest");
  const transition = requiredIdentity(binding.transitionWriter?.provenanceId, "case transition writer");
  assert(binding.transitionWriter?.role === CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.transitionRole, "case transition writer role is invalid");
  assert(semanticEqual(binding.decisions, parseCaseDecisionSource(source, candidate, binding.cases, binding.candidateInputSha256, transition)), "case decision binding does not semantically equal its source manifest");
}

function parseCaseDecisionSource(source, candidate, expected, candidateSha256, transitionWriter) {
  assert(source && typeof source === "object" && !Array.isArray(source), "case decision source must be a JSON object");
  assert(semanticEqual(Object.keys(source).sort(), ["acceptanceScopeDigest", "candidateSha256", "decisions", "kind", "schemaVersion", "sourceOwner", "sourceOwnerDigest"]), "case decision source has an unsupported schema");
  assert(source.kind === "candidate-case-decisions" && source.schemaVersion === 1, "case decisions have the wrong schema");
  assert(source.candidateSha256 === candidateSha256, "case decisions do not bind the supplied candidate bytes");
  assert(source.sourceOwner === "scripts/feature-delivery.mjs" && source.sourceOwnerDigest === sourceOwnerDigest(), "case decisions do not bind the feature-delivery source owner");
  assert(source.acceptanceScopeDigest === FEATURE_DELIVERY_ACCEPTANCE_SCOPE_DIGEST && Array.isArray(source.decisions), "case decisions acceptance scope or list drifted");
  const byKey = new Map();
  for (const decision of source.decisions) {
    assert(decision && typeof decision === "object" && !Array.isArray(decision), "case decision must be an object");
    assert(semanticEqual(Object.keys(decision).sort(), ["caseKey", "caseWriter", "definitionDigest", "evidenceDigest", "outcome", "receivedAt", "reviewer", "verdict"]), "case decision has an unsupported schema");
    assert(typeof decision.caseKey === "string" && !byKey.has(decision.caseKey), "case decisions must be unique"); byKey.set(decision.caseKey, decision);
  }
  assert(byKey.size === expected.length, "case decisions must cover the exact current case set once");
  return expected.map((match) => {
    const decision = byKey.get(match.caseKey); assert(decision, `case decision is not current: ${match.caseKey}`);
    assert(decision.verdict === "accepted" && decision.outcome === match.outcome && decision.definitionDigest === match.definitionDigest && sha256.test(decision.evidenceDigest ?? ""), `case decision does not bind the current outcome/digest: ${match.caseKey}`);
    assert(decision.reviewer?.role === CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.reviewerRole && decision.caseWriter?.role === CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.writerRole, `case decision provenance roles are invalid: ${match.caseKey}`);
    const reviewer = requiredIdentity(decision.reviewer?.provenanceId, `case decision ${match.caseKey} reviewer`); const caseWriter = requiredIdentity(decision.caseWriter?.provenanceId, `case decision ${match.caseKey} caseWriter`);
    assert(reviewer !== candidate.writerProvenance?.provenanceId && reviewer !== caseWriter && reviewer !== transitionWriter, "case decision actor isolation drifted");
    return { caseKey: match.caseKey, outcome: match.outcome, definitionDigest: match.definitionDigest, evidenceDigest: decision.evidenceDigest.toLowerCase(), verdict: "accepted", reviewer: { role: decision.reviewer.role, provenanceId: reviewer }, caseWriter: { role: decision.caseWriter.role, provenanceId: caseWriter }, receivedAt: requiredText(decision.receivedAt, "case decision receivedAt") };
  });
}

function parseArgs(args) {
  const [command, ...rest] = args;
  const options = { command };
  for (let i = 0; i < rest.length; i += 1) { const flag = rest[i]; assert(flag.startsWith("--"), `unknown argument: ${flag}`); options[flag.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = requiredText(rest[++i], flag); }
  assert(["plan", "bind-cases", "bind-review", "validate"].includes(command), "usage: candidate-evidence.mjs <plan|bind-cases|bind-review|validate> ...");
  for (const key of ["runRoot", "candidate", "candidateSha256"]) requiredText(options[key], `--${key}`);
  if (command !== "validate") requiredText(options.out, "--out");
  assert(sha256.test(options.candidateSha256), "--candidate-sha256 must be SHA-256");
  if (command === "plan") requiredText(options.writer, "--writer");
  if (command === "bind-cases") { requiredText(options.cases, "--cases"); assert(sha256.test(options.casesSha256 ?? ""), "--cases-sha256 must be SHA-256"); requiredText(options.transitionWriter, "--transition-writer"); }
  if (command === "bind-review") { requiredText(options.review, "--review"); assert(sha256.test(options.reviewSha256 ?? ""), "--review-sha256 must be SHA-256"); requiredText(options.transitionWriter, "--transition-writer"); }
  if (command === "validate" && options.review) { assert(sha256.test(options.reviewSha256 ?? ""), "--review-sha256 must be SHA-256"); requiredText(options.transitionWriter, "--transition-writer"); }
  return options;
}

function readVerifiedJson(file, expected, runRoot, label) {
  const absolute = canonicalFileInside(file, runRoot, label);
  assert(path.extname(absolute).toLowerCase() === ".json", `${label} must be a .json file`);
  const before = readFileSync(absolute); const actual = digest(before); assert(actual === expected.toLowerCase(), `${label} SHA-256 does not match the same-read bytes`);
  let value; try { value = JSON.parse(before.toString("utf8")); } catch (error) { throw Error(`${label} is not JSON: ${error.message}`); }
  const after = readFileSync(absolute); assert(digest(after) === actual, `${label} changed while being read`);
  return { path: absolute, sha256: actual, value };
}

function canonicalDirectory(value, label) { const absolute = path.resolve(value); rejectAds(absolute, label); assert(existsSync(absolute) && lstatSync(absolute).isDirectory() && !lstatSync(absolute).isSymbolicLink(), `${label} must be an existing non-link directory`); return realpathSync(absolute); }
function canonicalFileInside(value, root, label) { const absolute = path.resolve(value); rejectAds(absolute, label); assert(inside(root, absolute), `${label} must be under --run-root`); assert(existsSync(absolute) && lstatSync(absolute).isFile() && !lstatSync(absolute).isSymbolicLink(), `${label} must be an existing regular non-link file`); const real = realpathSync(absolute); assert(inside(root, real) && statSync(real).isFile(), `${label} escapes --run-root through a link or junction`); return real; }
function freshOutput(value, root) { const absolute = path.resolve(value); rejectAds(absolute, "--out"); assert(inside(root, absolute) && !inside(sourceRoot, absolute), "--out must be outside Public source root and under --run-root"); assert(!existsSync(absolute), "--out must be a fresh non-existing directory; resume is refused"); const parent = canonicalDirectory(path.dirname(absolute), "--out parent"); assert(inside(root, parent) && !inside(sourceRoot, parent), "--out parent escapes through a link or junction"); const output = path.join(parent, path.basename(absolute)); assert(!existsSync(output), "--out collided before creation"); return output; }
function writeExclusive(file, value) { const parent = path.dirname(file); assert(lstatSync(parent).isDirectory() && !lstatSync(parent).isSymbolicLink() && samePath(realpathSync(parent), parent), "output changed before exclusive write"); const fd = openSync(file, "wx"); try { writeFileSync(fd, value, "utf8"); } finally { closeSync(fd); } }
function requiredIdentity(value, label) { assert(typeof value === "string" && value.trim() && !/[\r\n]/u.test(value), `${label} is required`); return value; }
function requiredText(value, label) { assert(typeof value === "string" && value.trim(), `${label} requires a value`); return value; }
function inside(parent, child) { const relative = path.relative(parent, child); return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative)); }
function samePath(left, right) { return process.platform === "win32" ? left.toLocaleLowerCase("en-US") === right.toLocaleLowerCase("en-US") : left === right; }
function escapePointer(value) { return value.replace(/~/g, "~0").replace(/\//g, "~1"); }
function rejectAds(value, label) { if (process.platform !== "win32") return; const tail = value.slice(2); assert(!tail.split(/[\\/]/u).some((part) => part.includes(":")), `${label} must not use an alternate data stream`); }
