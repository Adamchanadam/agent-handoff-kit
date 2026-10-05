#!/usr/bin/env node

import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  aggregateReleaseReadinessTimeoutMs,
  assertPublicMirrorRequiredSources,
  assertClaimExecutorContract,
  assertQuickExecutorsCoveredByFull,
  CANDIDATE_EVIDENCE_CONTRACT,
  commandDocumentation,
  expectedPublicMirrorFileCount,
  POST_UPGRADE_STATE_COMPOSITIONS,
  PUBLIC_MIRROR_CONTRACT,
  QA_ASSURANCE_MANIFEST,
  QA_ASSURANCE_MANIFEST_DIGEST,
  QA_RELEASE_READINESS_INVENTORY,
  QA_RELEASE_READINESS_INVENTORY_DIGEST,
  QA_RELEASE_READINESS_TIMEOUT_BUFFER_MS,
  RELEASE_PACKAGE_CONTRACT,
  RELEASE_STATE_CONTRACT
} from "./qa-assurance-manifest.mjs";
import { assertRunFailed, invokeAsync, runSync, runSyncChecked, TIMEOUT_EXIT_CODE } from "./qa-runner-core.mjs";
import { checkFeatureDeliveryEvidence } from "./feature-delivery-cases.mjs";
import { NATIVE_UPDATE_METADATA_KEYS, nativeUpdateReviewSubjectDigest } from "./feature-delivery.mjs";
import { readRemoteTagCommit, runClaim, captureCandidateIdentity, verifyCandidateIdentity, finalizeCandidateAcceptance, assertPublishedCandidate, semanticEqual, resolveAcceptanceReceiptPath, validateReviewBundle } from "./qa.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = mkdtempSync(path.join(tmpdir(), "ack-qa-assurance-"));

if (process.argv.includes('--feature-delivery-only')) {
  checkFeatureDeliveryEvidence({root,evidencePath:'scripts/feature-delivery.mjs',evidenceSha256:sha256(readFileSync(path.join(root,'scripts/feature-delivery.mjs')))});
  const runner=readFileSync(path.join(root,'scripts/qa.mjs'),'utf8');
  assert(runner.includes('await validateCandidateFeatureDelivery(evidence, head)'), 'full gate must invoke feature delivery');
  assert(runner.includes('reviewSubject?.featureDelivery'), 'independent review must bind feature evidence');
  assert(runner.includes('validatePostpublishNativeUpdate(evidence.readbacks?.nativeUpdate, receipt)'), 'postpublish must reuse the native update validator');
  assert(runner.includes('await validatePostpublishOfficialOriginCatalog(options.version, npmView, tagCommit)'), 'postpublish must bind official-origin catalog observations');
  rmSync(fixtureRoot,{recursive:true,force:true});
  process.exit(0);
}

try {
  await validateAcceptanceBoundaries();
  if (process.argv.includes("--runner-contracts-only")) {
    console.log("ok: focused QA acceptance boundaries (local fixtures; not full/native assurance)");
  } else {
  validateManifest();
  validateCandidateEvidenceContract();
  validatePublicMirrorContract();
  validateReleasePackageContract();
  validateReleaseStateContract();
  validateStateCompositions();
  validateCommandDocumentation();
  validateRunnerInventory();
  validateReleaseReadinessInventory();
  validateRunnerTerminalStateContract();
  await validateProductionRunnerTerminalStateContract();
  validateFailurePropagation();
  await validateRemoteTagCommitReadback();
  validateEvidenceContracts();
  console.log("ok: QA assurance manifest and runner wiring");
  }
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

async function validateAcceptanceBoundaries() {
  const rejects = async (fn, text) => {
    let error;
    try { await fn(); } catch (caught) { error = caught; }
    assert(error && error.message.includes(text), `expected rejection ${text}, received ${error?.message ?? "success"}`);
  };
  assertQuickExecutorsCoveredByFull();
  const quickOnly = structuredClone(QA_ASSURANCE_MANIFEST);
  quickOnly.claims.push({ ...quickOnly.claims[0], id: "future-quick-only", executor: { ...quickOnly.claims[0].executor, script: "scripts/future-only.mjs" } });
  await rejects(() => assertQuickExecutorsCoveredByFull(quickOnly), "absent from the full");
  quickOnly.claims.at(-1).required = false;
  await rejects(() => assertQuickExecutorsCoveredByFull(quickOnly), "absent from the full");
  const noFullRunner = structuredClone(QA_ASSURANCE_MANIFEST);
  noFullRunner.claims = noFullRunner.claims.filter((claim) => claim.id !== "release-readiness");
  await rejects(() => assertQuickExecutorsCoveredByFull(noFullRunner), "does not execute");
  const normalized = structuredClone(QA_ASSURANCE_MANIFEST);
  normalized.claims[0].executor.script = "scripts/./check-install-lock-smoke.mjs";
  assertQuickExecutorsCoveredByFull(normalized);
  const wrong = { id: "wrong", layer: "full", required: true, executor: { kind: "node-scritp" } };
  await rejects(() => assertClaimExecutorContract(wrong), "unknown executor kind");
  await rejects(() => runClaim(wrong), "unknown executor kind");
  await rejects(() => runClaim({ ...wrong, executor: { kind: "internal-validator" } }), "not allowed for layer");
  for (const kind of ["node-script", "internal-validator", "evidence-validator"]) {
    const claim = QA_ASSURANCE_MANIFEST.claims.find((item) => item.executor.kind === kind);
    const seen = [];
    await runClaim(claim, {}, { [kind]: async (item) => seen.push(item.id) });
    assert(semanticEqual(seen, [claim.id]), `dispatch did not execute ${kind}`);
    await rejects(() => runClaim(claim, {}, { [kind]: async () => { throw Error("executor body failed"); } }), "executor body failed");
  }
  // Default production handlers must reach their validators, not silently return.
  await rejects(() => runClaim(QA_ASSURANCE_MANIFEST.claims.find((item) => item.layer === "candidate-preflight")), "requires --candidate");
  await rejects(() => runClaim(QA_ASSURANCE_MANIFEST.claims.find((item) => item.layer === "postpublish")), "requires --version");
  await runClaim({ id: "local-node-dispatch", layer: "quick", executor: { kind: "node-script", script: "scripts/check-prompt-mirror.mjs", timeoutMs: 30000 } });
  const verdicts = Object.fromEntries(CANDIDATE_EVIDENCE_CONTRACT.manualVerdictKeys.map((key) => [key, "passed"]));
  assert(semanticEqual(verdicts, Object.fromEntries(Object.entries(verdicts).reverse())), "object key order changed verdict equality");
  assert(!semanticEqual(verdicts, { ...verdicts, extra: "passed" }), "extra verdict accepted");
  assert(!semanticEqual(verdicts, { ...verdicts, userJourney: "failed" }), "wrong verdict accepted");
  const missing = { ...verdicts }; delete missing.userJourney;
  assert(!semanticEqual(verdicts, missing), "missing verdict accepted");
  assert(!semanticEqual(["first", "second"], ["second", "first"]), "state history order was relaxed");

  const stagePath = path.join(fixtureRoot, "accepted-stage.txt");
  const subjectPath = path.join(fixtureRoot, "accepted-subject-only.txt");
  const bundlePath = path.join(fixtureRoot, "accepted-bundle.json");
  const evidencePath = path.join(fixtureRoot, "accepted-candidate.json");
  const receiptPath = path.join(fixtureRoot, "accepted-receipt.json");
  writeFileSync(stagePath, "stage A"); writeFileSync(subjectPath, "subject A");
  writeEvidence(bundlePath, { reviewSubject: { evidence: [{ path: subjectPath, sha256: sha256(readFileSync(subjectPath)) }] } });
  const data = { candidate: { version: "1.2.3", commit: "a".repeat(40), tarballSha256: "b".repeat(64) },
    manifestDigest: QA_ASSURANCE_MANIFEST_DIGEST, releaseReadinessInventoryDigest: QA_RELEASE_READINESS_INVENTORY_DIGEST,
    roleIsolation: { reviewBundle: { path: bundlePath, sha256: sha256(readFileSync(bundlePath)) } },
    featureDelivery: { evidence: [{ path: stagePath, sha256: sha256(readFileSync(stagePath)) }] } };
  writeEvidence(evidencePath, data);
  const accepted = captureCandidateIdentity(evidencePath, data);
  const readers = { head: async () => data.candidate.commit, status: async () => ({ stdout: "" }), tarball: async () => data.candidate.tarballSha256 };
  await verifyCandidateIdentity(accepted, readers);
  const candidateRoot = path.join(fixtureRoot, "candidate-root"); mkdirSync(candidateRoot);
  const sourceAlias = path.join(fixtureRoot, "candidate-alias");
  symlinkSync(candidateRoot, sourceAlias, process.platform === "win32" ? "junction" : "dir");
  const outside = path.join(fixtureRoot, "receipt-outside.json");
  const scoped = captureCandidateIdentity(evidencePath, data, candidateRoot);
  assert(resolveAcceptanceReceiptPath(outside, candidateRoot) === outside, "outside receipt path changed unexpectedly");
  for (const output of [path.join(candidateRoot, "receipt.json"), path.join(sourceAlias, "receipt.json")]) {
    await rejects(() => resolveAcceptanceReceiptPath(output, candidateRoot), "outside the candidate");
    await rejects(() => finalizeCandidateAcceptance(scoped, output, readers), "outside the candidate");
    assert(!existsSync(output), "rejected in-source receipt was written");
  }
  const outsideDir = path.join(fixtureRoot, "outside-dir"); mkdirSync(outsideDir);
  const insideAlias = path.join(candidateRoot, "outside-alias");
  symlinkSync(outsideDir, insideAlias, process.platform === "win32" ? "junction" : "dir");
  await rejects(() => resolveAcceptanceReceiptPath(path.join(insideAlias, "receipt.json"), candidateRoot), "outside the candidate");
  await rejects(() => finalizeCandidateAcceptance(scoped, path.join(fixtureRoot, "missing-parent", "receipt.json"), readers), "ENOENT");
  assert(!existsSync(path.join(fixtureRoot, "missing-parent")), "failed receipt output created a directory");
  const outsideAlias = path.join(fixtureRoot, "outside-alias");
  symlinkSync(outsideDir, outsideAlias, process.platform === "win32" ? "junction" : "dir");
  const linkedOutput = path.join(outsideAlias, "receipt.json");
  assert(resolveAcceptanceReceiptPath(linkedOutput, candidateRoot) === path.join(outsideDir, "receipt.json"), "outside directory alias was not resolved");
  await finalizeCandidateAcceptance(scoped, linkedOutput, readers);
  assert(existsSync(path.join(outsideDir, "receipt.json")), "external canonical receipt was not written");

  const caller = path.join(fixtureRoot, "bundle-caller"); mkdirSync(caller);
  const subject = { candidateCommit: data.candidate.commit, tarballSha256: data.candidate.tarballSha256,
    manifestDigest: data.manifestDigest, releaseReadinessInventoryDigest: data.releaseReadinessInventoryDigest,
    manualVerdicts: verdicts, featureDelivery: {}, stateHistory: CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.reviewSubjectPath };
  const bundle = { schemaVersion: 1, kind: "role-isolation-review-bundle", state: "WAITING_INDEPENDENT_REVIEW",
    candidate: data.candidate, manifestDigest: data.manifestDigest, releaseReadinessInventoryDigest: data.releaseReadinessInventoryDigest,
    stateHistory: subject.stateHistory, fiveConclusions: verdicts, reviewSubject: subject, reviewSubjectDigest: sha256(JSON.stringify(subject)) };
  const consumed = path.join(caller, "review.json");
  writeEvidence(consumed, bundle); writeEvidence(path.join(candidateRoot, "review.json"), bundle);
  const relativeData = { ...data, manualVerdicts: verdicts, featureDelivery: {}, roleIsolation: {
    reviewBundle: { path: "review.json", sha256: sha256(readFileSync(consumed)) },
    reviewSubjectStateHistory: subject.stateHistory, reviewSubjectDigest: bundle.reviewSubjectDigest } };
  const relativeEvidence = path.join(fixtureRoot, "relative-candidate.json"); writeEvidence(relativeEvidence, relativeData);
  const originalCwd = process.cwd();
  try {
    process.chdir(caller);
    const captured = captureCandidateIdentity(relativeEvidence, relativeData, candidateRoot);
    const validated = validateReviewBundle(relativeData.roleIsolation.reviewBundle, relativeData, data.candidate.commit);
    assert(validated.path === consumed && captured.references.some((ref) => ref.path === consumed), "capture and validator used different bundles");
    await verifyCandidateIdentity(captured, readers);
    const absoluteData = structuredClone(relativeData); absoluteData.roleIsolation.reviewBundle.path = consumed;
    writeEvidence(relativeEvidence, absoluteData);
    const absoluteCaptured = captureCandidateIdentity(relativeEvidence, absoluteData, candidateRoot);
    validateReviewBundle(absoluteData.roleIsolation.reviewBundle, absoluteData, data.candidate.commit);
    await verifyCandidateIdentity(absoluteCaptured, readers);
    writeEvidence(relativeEvidence, relativeData);
    writeFileSync(consumed, readFileSync(consumed, "utf8") + " ");
    await rejects(() => verifyCandidateIdentity(captured, readers), "accepted evidence changed during claims");
  } finally { process.chdir(originalCwd); }
  console.log("ok: receipt source/link boundaries and no-write failures; same relative/absolute review bundle; optional quick coverage");

  for (const [key, read, error] of [["head", async () => "c".repeat(40), "HEAD changed"], ["status", async () => ({ stdout: " M package.json" }), "worktree changed"], ["tarball", async () => "d".repeat(64), "tarball changed"]]) {
    await rejects(() => finalizeCandidateAcceptance(accepted, receiptPath, { ...readers, [key]: read }), error);
    assert(!existsSync(receiptPath), "failed final identity check wrote receipt");
  }
  for (const file of [stagePath, subjectPath, bundlePath, evidencePath]) {
    const before = readFileSync(file); writeFileSync(file, Buffer.concat([before, Buffer.from(" ")]));
    await rejects(() => finalizeCandidateAcceptance(accepted, receiptPath, readers), "changed during claims");
    assert(!existsSync(receiptPath), "changed evidence wrote receipt"); writeFileSync(file, before);
  }
  await finalizeCandidateAcceptance(accepted, receiptPath, readers);
  const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
  assert(receipt.kind === "accepted-candidate-receipt" && receipt.candidateEvidenceSha256 === sha256(readFileSync(evidencePath)), "accepted receipt did not bind source evidence");
  const originalReceipt = readFileSync(receiptPath);
  await rejects(() => finalizeCandidateAcceptance(accepted, receiptPath, readers), "EEXIST");
  assert(originalReceipt.equals(readFileSync(receiptPath)), "old receipt was overwritten");
  assertPublishedCandidate(receipt, data.candidate);
  await rejects(() => assertPublishedCandidate(receipt, { ...data.candidate, commit: "c".repeat(40), tarballSha256: "d".repeat(64) }), "differs from the full accepted candidate");
  console.log("ok: A5 final identity/evidence drift; A6 real dispatch; A9 exclusive accepted receipt and A/B binding; A10 exact object semantics; A11 required quick/full coverage");
}

async function validateRemoteTagCommitReadback() {
  const tagRoot = path.join(fixtureRoot, "remote-tag-readback");
  mkdirSync(tagRoot);
  const git = (args) => runSyncChecked("git", args, "local tag fixture", { cwd: tagRoot });
  git(["init", "--quiet"]);
  git(["-c", "user.name=QA Fixture", "-c", "user.email=qa@example.invalid", "commit", "--allow-empty", "-m", "fixture", "--quiet"]);
  git(["remote", "add", "origin", tagRoot]);
  const commit = git(["rev-parse", "HEAD"]).stdout.trim();
  git(["tag", "v1.2.3"]);
  git(["-c", "user.name=QA Fixture", "-c", "user.email=qa@example.invalid", "tag", "-a", "v2.3.4", "-m", "annotated fixture"]);
  const annotated = git(["rev-parse", "v2.3.4"]).stdout.trim();
  assert(annotated !== commit, "annotated fixture must differ from the commit object");
  const execute = (command, args, label) => runSyncChecked(command, args, label, { cwd: tagRoot });
  assert(await readRemoteTagCommit("1.2.3", execute) === commit, "lightweight tag must resolve to its commit");
  assert(await readRemoteTagCommit("2.3.4", execute) === commit, "annotated tag must resolve to its peeled commit, not its tag object");
  let missingRejected = false;
  try { await readRemoteTagCommit("9.9.9", execute); } catch { missingRejected = true; }
  assert(missingRejected, "missing remote tag must fail closed");
  console.log("ok: real Git lightweight, annotated and missing tag readbacks");
}

function validateManifest() {
  assert(QA_ASSURANCE_MANIFEST.schemaVersion === 1, "unexpected QA assurance manifest schema version");
  assert(Object.keys(QA_ASSURANCE_MANIFEST.layers).join(",") === "quick,candidate-preflight,full,postpublish", "QA layers drifted");
  const ids = new Set();
  for (const claim of QA_ASSURANCE_MANIFEST.claims) {
    assert(!ids.has(claim.id), `duplicate QA claim id: ${claim.id}`);
    ids.add(claim.id);
    assert(QA_ASSURANCE_MANIFEST.layers[claim.layer], `claim uses unknown layer: ${claim.id}`);
    for (const field of ["provenance", "readback", "evidenceOutput", "failureMode", "outOfScope"]) assert(typeof claim[field] === "string" && claim[field], `claim ${claim.id} missing ${field}`);
    assert(Array.isArray(claim.stateAxes) && claim.stateAxes.length > 0, `claim ${claim.id} has no state axes`);
    assertClaimExecutorContract(claim);
    if (claim.executor.kind === "node-script") {
      assert(claim.executor.script && path.resolve(root, claim.executor.script).startsWith(`${root}${path.sep}`), `claim ${claim.id} has an unsafe script path`);
      assert(Number.isInteger(claim.executor.timeoutMs) && claim.executor.timeoutMs >= 30_000, `claim ${claim.id} lacks a reasonable per-command timeout`);
    } else if (claim.executor.kind === "internal-validator") {
      assert(Number.isInteger(claim.executor.timeoutMs) && claim.executor.timeoutMs >= 30_000, `claim ${claim.id} lacks a reasonable internal-validator timeout`);
    }
  }
  assert(ids.has("install-lock-smoke"), "quick QA omits install-lock-smoke");
  assertQuickExecutorsCoveredByFull();
  assert(/^[a-f0-9]{64}$/.test(QA_ASSURANCE_MANIFEST_DIGEST), "manifest digest is malformed");
  const candidateRunner = readFileSync(path.join(root, "scripts", "qa.mjs"), "utf8");
  const releaseReadiness = readFileSync(path.join(root, "scripts", "check-release-readiness.mjs"), "utf8").replace(/\r\n/g, "\n");
  assert(candidateRunner.includes("validateCandidatePreFreezeEvidence(options.candidate)"), "candidate-preflight does not run pre-freeze evidence validation");
  assert(releaseReadiness.includes("--pre-freeze-evidence"), "release readiness has no pre-freeze evidence entrypoint");
  assert(releaseReadiness.includes("checkScenarioBranchingDocAlignment();\n    await checkChangedBilingualCandidateEvidence(version, { allowDirty: true });"), "pre-freeze evidence does not validate current runtime-to-scenario-to-QA-doc alignment before freeze");
  assert(releaseReadiness.includes("checkChangedBilingualCandidateEvidence(version, { allowDirty: true })"), "pre-freeze evidence does not validate changed bilingual pairs before freeze");
  assert(releaseReadiness.includes("assertLatestCrossMindTableComplete(version)"), "pre-freeze evidence does not validate the current cross-mind table before freeze");
}

function validateReleaseStateContract() {
  assert(RELEASE_STATE_CONTRACT.schemaVersion === 1, "unexpected release-state contract schema version");
  const surfaces = new Set();
  for (const surface of RELEASE_STATE_CONTRACT.surfaces) {
    assert(typeof surface.path === "string" && surface.path && !path.isAbsolute(surface.path), "release-state surface path is unsafe");
    assert(!surfaces.has(surface.path), `duplicate release-state surface: ${surface.path}`);
    surfaces.add(surface.path);
  }
  assert(surfaces.has("docs/whatsnew/v${version}.md"), "current whatsnew release body is missing from release-state surfaces");
  assert(surfaces.has("CHANGELOG.md"), "CHANGELOG is missing from release-state surfaces");
  for (const pattern of RELEASE_STATE_CONTRACT.forbiddenPatterns) {
    assert(typeof pattern.source === "string" && pattern.source, "release-state forbidden pattern missing source");
    assert(typeof pattern.flags === "string", "release-state forbidden pattern missing flags");
    new RegExp(pattern.source, pattern.flags);
  }
}

function validateCandidateEvidenceContract() {
  assert(CANDIDATE_EVIDENCE_CONTRACT.schemaVersion === 1, "unexpected candidate evidence contract schema version");
  const nativeUpdate = CANDIDATE_EVIDENCE_CONTRACT.featureDelivery.nativeUpdate;
  assert(nativeUpdate?.entry === "handoff-kit-update", "native update evidence owner drifted");
  assert(nativeUpdate.prepublishRegistryMode === "controlled" && nativeUpdate.postpublishRegistryMode === "official-live", "native update registry modes drifted");
  assert(nativeUpdate.metadataKeys === NATIVE_UPDATE_METADATA_KEYS, "native update metadata contract must bind the feature-delivery owner");
  assert(JSON.stringify(CANDIDATE_EVIDENCE_CONTRACT.manualVerdictKeys) === JSON.stringify([
    "governanceHealth",
    "productJourney",
    "userJourney",
    "qcBackflow",
    "rulesPacksRouting"
  ]), "candidate evidence manual verdict contract drifted");
  const roleIsolation = CANDIDATE_EVIDENCE_CONTRACT.roleIsolation;
  assert(roleIsolation.writerRole === "workspace-writer", "writer role contract drifted");
  assert(roleIsolation.reviewerRole === "independent-readonly-reviewer", "reviewer role contract drifted");
  assert(roleIsolation.provenanceBoundary.includes("audit provenance only"), "role provenance boundary must not become an identity trust root");
  assert(roleIsolation.provenanceBoundary.includes("never authorize CLI data operations"), "role provenance boundary must not become a CLI data-operation trust root");
  assert(roleIsolation.stateMachine.includes("WAITING_INDEPENDENT_REVIEW"), "role-isolation state machine missing waiting state");
  assert(roleIsolation.stateMachine.includes("REVIEW_REJECTED"), "role-isolation state machine missing rejected branch");
  assert(JSON.stringify(roleIsolation.fullGateAcceptedPath) === JSON.stringify([
    "PLAN_FROZEN",
    "BASELINE_VERIFIED",
    "GOVERNANCE_CONTRACT_IMPLEMENTED",
    "EXECUTABLE_CONTRACT_IMPLEMENTED",
    "WRITER_QC_PASSED",
    "CANDIDATE_FROZEN",
    "REVIEW_BUNDLE_READY",
    "WAITING_INDEPENDENT_REVIEW",
    "REVIEW_ACCEPTED"
  ]), "full gate accepted path drifted");
  assert(JSON.stringify(roleIsolation.reviewSubjectPath) === JSON.stringify([
    "PLAN_FROZEN",
    "BASELINE_VERIFIED",
    "GOVERNANCE_CONTRACT_IMPLEMENTED",
    "EXECUTABLE_CONTRACT_IMPLEMENTED",
    "WRITER_QC_PASSED",
    "CANDIDATE_FROZEN",
    "REVIEW_BUNDLE_READY",
    "WAITING_INDEPENDENT_REVIEW"
  ]), "review subject path drifted");
  for (const binding of ["candidate.commit", "candidate.tarballSha256", "manifestDigest", "releaseReadinessInventoryDigest", "reviewBundle.sha256", "reviewSubjectDigest", "manualVerdicts", "machineResultsDigest"]) {
    assert(roleIsolation.reviewReceiptBindings.includes(binding), `review receipt binding missing: ${binding}`);
  }
  const releaseReadiness = CANDIDATE_EVIDENCE_CONTRACT.records["release-readiness"];
  assert(releaseReadiness, "release-readiness evidence contract is missing");
  assert(JSON.stringify(releaseReadiness.allowedPaths) === JSON.stringify(["docs/qa/release-grade-qa.md"]), "release-readiness evidence path contract drifted");
  for (const snippet of ["pre-release final audit", "full 必須等 clean commit", "Full-check role isolation", "five-conclusion writer assessment"]) {
    assert(releaseReadiness.requiredReadbackSnippets.includes(snippet), `release-readiness evidence readback snippet missing: ${snippet}`);
  }
}

function validateReleasePackageContract() {
  assert(RELEASE_PACKAGE_CONTRACT.schemaVersion === 1, "unexpected release package contract schema version");
  assert(Number.isInteger(RELEASE_PACKAGE_CONTRACT.expectedPackageFileCount) && RELEASE_PACKAGE_CONTRACT.expectedPackageFileCount > 0, "release package file count must be a positive integer; actual packed membership is checked against the manifest owner");
}

function validatePublicMirrorContract() {
  assert(PUBLIC_MIRROR_CONTRACT.schemaVersion === 1, "unexpected public mirror contract schema version");
  assert(Array.isArray(PUBLIC_MIRROR_CONTRACT.allowFiles) && PUBLIC_MIRROR_CONTRACT.allowFiles.includes("README.md"), "public mirror allowFiles contract drifted");
  assert(Array.isArray(PUBLIC_MIRROR_CONTRACT.allowDirs) && PUBLIC_MIRROR_CONTRACT.allowDirs.includes("docs/whatsnew"), "public mirror allowDirs must include versioned whatsnew pages");
  assert(Array.isArray(PUBLIC_MIRROR_CONTRACT.requiredAllowFiles) && PUBLIC_MIRROR_CONTRACT.requiredAllowFiles.includes("README.md"), "public mirror required files contract drifted");
  assert(Array.isArray(PUBLIC_MIRROR_CONTRACT.requiredAllowDirs) && PUBLIC_MIRROR_CONTRACT.requiredAllowDirs.includes("docs/whatsnew"), "public mirror required dirs contract drifted");
  assert(!("expectedFileCount" in PUBLIC_MIRROR_CONTRACT), "public mirror file count must be derived from the manifest-owned membership, not a fixed number");
  assert(Number.isInteger(expectedPublicMirrorFileCount(root)) && expectedPublicMirrorFileCount(root) > 0, "public mirror derived file count is invalid");
  validatePublicMirrorRequiredSourceFixtures();
  const mirrorBuilder = readFileSync(path.join(root, "scripts", "build-public-mirror.mjs"), "utf8");
  assert(mirrorBuilder.includes("assertPublicMirrorRequiredSources(sourceRoot)"), "public mirror builder does not assert required source presence before copy/count");
  assert(mirrorBuilder.includes("expectedPublicMirrorFileCount(sourceRoot)"), "public mirror builder does not derive file count from the manifest owner");
  assert(!mirrorBuilder.includes("expected 110"), "public mirror builder still hard-codes the prior file count");
}

function validatePublicMirrorRequiredSourceFixtures() {
  const contract = Object.freeze({
    allowFiles: Object.freeze(["required-root.md", "optional-root.md"]),
    allowDirs: Object.freeze(["required-dir", "optional-dir"]),
    requiredAllowFiles: Object.freeze(["required-root.md"]),
    requiredAllowDirs: Object.freeze(["required-dir"])
  });
  const positiveRoot = path.join(fixtureRoot, "mirror-required-positive");
  mkdirSync(path.join(positiveRoot, "required-dir"), { recursive: true });
  writeFileSync(path.join(positiveRoot, "required-root.md"), "required\n", "utf8");
  writeFileSync(path.join(positiveRoot, "optional-root.md"), "optional\n", "utf8");
  writeFileSync(path.join(positiveRoot, "required-dir", "entry.txt"), "entry\n", "utf8");
  assertPublicMirrorRequiredSources(positiveRoot, contract);
  assert(expectedPublicMirrorFileCount(positiveRoot, contract) === 3, "public mirror fixture count did not include required sources");

  const missingFileRoot = path.join(fixtureRoot, "mirror-missing-file");
  mkdirSync(path.join(missingFileRoot, "required-dir"), { recursive: true });
  writeFileSync(path.join(missingFileRoot, "required-dir", "entry.txt"), "entry\n", "utf8");
  assertRequiredSourceFailure(missingFileRoot, contract, "required-root.md: required file missing");

  const missingDirRoot = path.join(fixtureRoot, "mirror-missing-dir");
  mkdirSync(missingDirRoot, { recursive: true });
  writeFileSync(path.join(missingDirRoot, "required-root.md"), "required\n", "utf8");
  assertRequiredSourceFailure(missingDirRoot, contract, "required-dir: required directory missing");
}

function validateRunnerInventory() {
  const result = invoke(["scripts/qa.mjs", "--list"], "runner inventory");
  const inventory = JSON.parse(result.stdout);
  assert(inventory.digest === QA_ASSURANCE_MANIFEST_DIGEST, "runner inventory digest drifted");
  assert(inventory.claims.length === QA_ASSURANCE_MANIFEST.claims.length, "runner inventory omitted manifest claims");
  assert(inventory.releaseReadinessInventoryDigest === QA_RELEASE_READINESS_INVENTORY_DIGEST, "runner release-readiness inventory digest drifted");
  assert(JSON.stringify(inventory.releaseReadinessInventory) === JSON.stringify(QA_RELEASE_READINESS_INVENTORY), "runner release-readiness inventory omitted manifest members");
}

function validateReleaseReadinessInventory() {
  assert(/^[a-f0-9]{64}$/.test(QA_RELEASE_READINESS_INVENTORY_DIGEST), "release-readiness inventory digest is malformed");
  const ids = new Set();
  const scripts = new Set();
  for (const item of QA_RELEASE_READINESS_INVENTORY) {
    assert(typeof item.id === "string" && item.id, "release-readiness inventory item missing id");
    assert(!ids.has(item.id), `duplicate release-readiness inventory id: ${item.id}`);
    ids.add(item.id);
    assert(typeof item.script === "string" && item.script && !path.isAbsolute(item.script), `release-readiness inventory item has unsafe script: ${item.id}`);
    assert(!scripts.has(item.script), `duplicate release-readiness inventory script: ${item.script}`);
    scripts.add(item.script);
    assert(existsSync(path.join(root, "scripts", item.script)), `release-readiness inventory script is missing: ${item.script}`);
    assert(typeof item.label === "string" && item.label, `release-readiness inventory item missing label: ${item.id}`);
    assert(Number.isInteger(item.timeoutMs) && item.timeoutMs >= 30_000, `release-readiness inventory item lacks a reasonable per-command timeout: ${item.id}`);
  }
  assert(ids.has("install-lock-smoke"), "release-readiness inventory omits install-lock-smoke");
  assert(ids.has("closeout-efficiency"), "release-readiness inventory omits closeout-efficiency");
  const inventoryBudgetMs = QA_RELEASE_READINESS_INVENTORY.reduce((total, item) => total + item.timeoutMs, 0);
  const aggregateBudgetMs = aggregateReleaseReadinessTimeoutMs();
  const releaseReadinessClaim = QA_ASSURANCE_MANIFEST.claims.find((claim) => claim.id === "release-readiness");
  assert(releaseReadinessClaim.executor.timeoutMs === aggregateBudgetMs, "release-readiness claim timeout is not derived from the manifest inventory");
  assert(aggregateBudgetMs === inventoryBudgetMs + QA_RELEASE_READINESS_TIMEOUT_BUFFER_MS, "release-readiness aggregate timeout drifted from inventory plus startup buffer");
  assertOuterTimeoutCoversInventory(aggregateBudgetMs, QA_RELEASE_READINESS_INVENTORY);
  let shortOuterRejected = false;
  try {
    assertOuterTimeoutCoversInventory(inventoryBudgetMs - 1, QA_RELEASE_READINESS_INVENTORY);
  } catch {
    shortOuterRejected = true;
  }
  assert(shortOuterRejected, "release-readiness accepted an outer timeout shorter than the sequential inventory budget");

  const releaseChecker = readFileSync(path.join(root, "scripts", "check-release-readiness.mjs"), "utf8");
  assert(releaseChecker.includes("for (const qaCheck of QA_RELEASE_READINESS_INVENTORY)"), "release readiness no longer iterates over the manifest-owned inventory");
  assert(!/runQaScript\s*\(\s*["']/.test(releaseChecker), "release readiness still contains hard-coded QA member calls");
  assert(releaseChecker.includes("runNodeScriptChecked"), "release readiness inventory loop is not using the bounded checked runner");
  assert(!/\brunNodeScript\s*\(/.test(releaseChecker), "release readiness inventory loop still uses the sync node-script runner");
  const qaRunner = readFileSync(path.join(root, "scripts", "qa.mjs"), "utf8");
  assert(qaRunner.includes("runNodeScriptChecked"), "qa.mjs claims are not using the bounded checked runner");
  assert(!/\brunNodeScript\s*\(/.test(qaRunner) && !/\brunSyncChecked\b/.test(qaRunner), "qa.mjs claims still depend on the sync checked runner");
  invoke(["scripts/check-release-readiness.mjs", "--qa-inventory-self-test"], "release-readiness inventory negative self-test", {
    env: { ...process.env, AGENT_HANDOFF_KIT_QA_TEST_MODE: "1" }
  });
  invoke(["scripts/check-release-readiness.mjs", "--scenario-contract-self-test"], "pre-freeze scenario-contract negative self-test");
}

function validateCommandDocumentation() {
  const publicQa = readFileSync(path.join(root, "docs", "qa", "release-grade-qa.md"), "utf8").replace(/\r\n/g, "\n");
  assert(publicQa.includes(commandDocumentation()), "public QA command block does not match the manifest");
}

function validateStateCompositions() {
  const ids = new Set();
  for (const scenario of POST_UPGRADE_STATE_COMPOSITIONS) {
    assert(!ids.has(scenario.id), `duplicate state-composition id: ${scenario.id}`);
    ids.add(scenario.id);
    for (const field of ["baseline", "ownershipDelta", "transactionPhase", "filesystemSemantics", "postUpgradeAction", "deliveryArtifact", "expected"]) assert(typeof scenario[field] === "string" && scenario[field], `state composition ${scenario.id} missing ${field}`);
    assert(Array.isArray(scenario.requiredTriples) && scenario.requiredTriples.length > 0, `state composition ${scenario.id} has no mandatory triples`);
    assert(scenario.deliveryArtifact === "packed candidate tarball", `state composition ${scenario.id} is not a packed-artifact journey`);
  }
  assert(ids.has("published-lifecycle-upgrade-doctor-noop"), "published lifecycle regression is absent from state compositions");
}

function validateFailurePropagation() {
  for (const claim of QA_ASSURANCE_MANIFEST.claims.filter((item) => item.required)) {
    const result = runSync(process.execPath, ["scripts/qa.mjs", claim.layer, "--test-fail-claim", claim.id], "controlled failure propagation", {
      cwd: root,
      env: { ...process.env, AGENT_HANDOFF_KIT_QA_TEST_MODE: "1" }
    });
    assert(!result.errorType && result.status !== 0, `controlled failure did not block ${claim.id}`);
    assert(`${result.stdout}\n${result.stderr}`.includes(`controlled executor failure: ${claim.id}`), `controlled failure was not attributed to ${claim.id}`);
  }
  console.log("ok: required QA claim failures propagate");
}

function validateRunnerTerminalStateContract() {
  const partialPassTimeout = runSync(process.execPath, ["-e", "console.log('PASS before final state'); setTimeout(() => {}, 10000);"], "partial PASS timeout self-test", { cwd: root, timeoutMs: 200 });
  assert(partialPassTimeout.timedOut && partialPassTimeout.status === TIMEOUT_EXIT_CODE, "partial PASS output before timeout must be blocked as indeterminate");

  const selfSigterm = runSync(process.execPath, ["-e", "process.kill(process.pid, 'SIGTERM');"], "self SIGTERM self-test", { cwd: root, timeoutMs: 10_000 });
  assert(!selfSigterm.timedOut && selfSigterm.status !== TIMEOUT_EXIT_CODE, "child self-SIGTERM must not be reported as the runner timeout exit code");

  const exitNine = runSync(process.execPath, ["-e", "process.exit(9);"], "exit 9 propagation self-test", { cwd: root, timeoutMs: 10_000 });
  assert(exitNine.status === 9, "runner did not preserve child exit code 9");

  const spawnError = runSync("definitely-not-agent-handoff-kit-command", [], "spawn error self-test", { cwd: root, timeoutMs: 10_000 });
  assert(spawnError.errorType === "spawn-error" && spawnError.status === null, "spawn error must be distinguished from ordinary nonzero exit");

  assertRunFailed(partialPassTimeout, "partial PASS timeout self-test");
  assertRunFailed(selfSigterm, "self SIGTERM self-test");
  assertRunFailed(exitNine, "exit 9 propagation self-test");
  assertRunFailed(spawnError, "spawn error self-test");
  console.log("ok: QA runner terminal-state contract");
}

async function validateProductionRunnerTerminalStateContract() {
  const ignoreSigterm = await runQaRunnerFixture("ignore-sigterm.mjs", [
    "process.on('SIGTERM', () => {});",
    "console.log('PASS before final state');",
    "setInterval(() => {}, 10000);"
  ], { timeoutMs: 200, label: "qa.mjs production runner ignore-SIGTERM fixture" });
  assert(ignoreSigterm.status === TIMEOUT_EXIT_CODE && !ignoreSigterm.timedOut, `qa.mjs production runner did not return bounded child timeout status\n${ignoreSigterm.stdout}\n${ignoreSigterm.stderr}`);
  assert(ignoreSigterm.elapsedMs < 5_000, `qa.mjs production runner ignore-SIGTERM fixture exceeded bounded wall-clock: ${ignoreSigterm.elapsedMs}ms`);
  assert(`${ignoreSigterm.stdout}\n${ignoreSigterm.stderr}`.includes("PASS before final state"), "qa.mjs production runner fixture did not preserve partial stdout for readback");
  assertRunFailed(ignoreSigterm, "qa.mjs production runner ignore-SIGTERM fixture");

  const partialPass = await runQaRunnerFixture("partial-pass.mjs", [
    "console.log('PASS before final state');",
    "setTimeout(() => {}, 10000);"
  ], { timeoutMs: 200, label: "qa.mjs production runner partial-PASS fixture" });
  assert(partialPass.status === TIMEOUT_EXIT_CODE && !partialPass.timedOut, `qa.mjs production runner partial-PASS fixture did not return child timeout status\n${partialPass.stdout}\n${partialPass.stderr}`);
  assert(`${partialPass.stdout}\n${partialPass.stderr}`.includes("PASS before final state"), "qa.mjs production runner partial-PASS fixture did not preserve partial stdout");
  assertRunFailed(partialPass, "qa.mjs production runner partial-PASS fixture");

  const selfSigterm = await runQaRunnerFixture("self-sigterm.mjs", [
    "process.kill(process.pid, 'SIGTERM');"
  ], { timeoutMs: 10_000, label: "qa.mjs production runner self-SIGTERM fixture" });
  assert(selfSigterm.status !== TIMEOUT_EXIT_CODE && !selfSigterm.timedOut, `qa.mjs production runner self-SIGTERM was misreported as timeout\n${selfSigterm.stdout}\n${selfSigterm.stderr}`);
  assertRunFailed(selfSigterm, "qa.mjs production runner self-SIGTERM fixture");

  const exitNine = await runQaRunnerFixture("exit-nine.mjs", [
    "process.exit(9);"
  ], { timeoutMs: 10_000, label: "qa.mjs production runner exit-9 fixture" });
  assert(exitNine.status === 9, `qa.mjs production runner did not preserve exit 9\n${exitNine.stdout}\n${exitNine.stderr}`);
  assertRunFailed(exitNine, "qa.mjs production runner exit-9 fixture");

  const commandSpawnError = await invokeAsync(process.execPath, [
    "scripts/qa.mjs",
    "--test-command-spawn-error"
  ], "qa.mjs production command spawn-error fixture", {
    cwd: root,
    env: { ...process.env, AGENT_HANDOFF_KIT_QA_TEST_MODE: "1" },
    timeoutMs: 10_000
  });
  assert(commandSpawnError.status !== 0 && `${commandSpawnError.stdout}\n${commandSpawnError.stderr}`.includes("spawn-error"), `qa.mjs production command wrapper did not preserve spawn-error\n${commandSpawnError.stdout}\n${commandSpawnError.stderr}`);
  assertRunFailed(commandSpawnError, "qa.mjs production command spawn-error fixture");

  const shellFixture = process.platform === "win32" ? path.join(fixtureRoot, "shell-fixture.cmd") : path.join(fixtureRoot, "shell-fixture.sh");
  writeFileSync(shellFixture, process.platform === "win32"
    ? "@echo AHK_SHELL_FIXTURE_OK\r\n"
    : "echo AHK_SHELL_FIXTURE_OK\n", "utf8");
  if (process.platform !== "win32") {
    chmodSync(shellFixture, 0o700);
    assert((statSync(shellFixture).mode & 0o111) !== 0, "POSIX shell fixture is not executable after chmod readback");
  }
  const shellResult = await invokeAsync(process.execPath, [
    "scripts/qa.mjs",
    "--test-command-shell-fixture",
    shellFixture,
    "--test-runner-timeout-ms",
    "10000"
  ], "qa.mjs production command shell fixture", {
    cwd: root,
    env: { ...process.env, AGENT_HANDOFF_KIT_QA_TEST_MODE: "1" },
    timeoutMs: 10_000
  });
  assert(shellResult.status === 0 && shellResult.stdout.includes("AHK_SHELL_FIXTURE_OK"), `qa.mjs production command wrapper did not propagate shell:true\n${shellResult.stdout}\n${shellResult.stderr}`);
  console.log("ok: qa.mjs production runner and command-wrapper terminal-state contract");
}

async function runQaRunnerFixture(fileName, lines, options) {
  const fixture = path.join(fixtureRoot, fileName);
  writeFileSync(fixture, lines.join("\n"), "utf8");
  const startedAt = Date.now();
  const result = await invokeAsync(process.execPath, [
    "scripts/qa.mjs",
    "--test-runner-fixture",
    fixture,
    "--test-runner-timeout-ms",
    String(options.timeoutMs)
  ], options.label, {
    cwd: root,
    env: { ...process.env, AGENT_HANDOFF_KIT_QA_TEST_MODE: "1" },
    timeoutMs: 5_000,
    killGraceMs: 500,
    settleGraceMs: 2_000
  });
  return { ...result, elapsedMs: Date.now() - startedAt };
}

function validateEvidenceContracts() {
  const version = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version;
  const latestCatalogVersion = latestCatalogVersionBeforeCandidate(version);
  const head = invoke(["-e", "const {spawnSync}=require('node:child_process'); const r=spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}); if(r.status) process.exit(r.status); process.stdout.write(r.stdout.trim());"], "git HEAD readback").stdout;
  const releaseQaPath = "docs/qa/release-grade-qa.md";
  const releaseQaSha256 = sha256(readFileSync(path.join(root, releaseQaPath)));
  const candidateTarballSha256 = "a".repeat(64);
  const reviewBundle = path.join(fixtureRoot, "review-bundle.json");
  const manualVerdicts = {
    governanceHealth: "passed",
    productJourney: "passed",
    userJourney: "passed",
    qcBackflow: "passed",
    rulesPacksRouting: "passed"
  };
  const roleStateHistory = CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.fullGateAcceptedPath;
  const reviewSubjectStateHistory = CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.reviewSubjectPath;
  const featureDelivery = checkFeatureDeliveryEvidence({root,evidencePath:releaseQaPath,evidenceSha256:releaseQaSha256});
  const reviewSubject = {
    featureDelivery,
    version,
    candidateCommit: head,
    tarballSha256: candidateTarballSha256,
    manifestDigest: QA_ASSURANCE_MANIFEST_DIGEST,
    releaseReadinessInventoryDigest: QA_RELEASE_READINESS_INVENTORY_DIGEST,
    releaseQa: { path: releaseQaPath, sha256: releaseQaSha256 },
    manualVerdicts,
    stateHistory: reviewSubjectStateHistory
  };
  const reviewSubjectDigest = sha256(JSON.stringify(reviewSubject));
  writeEvidence(reviewBundle, {
    schemaVersion: 1,
    kind: "role-isolation-review-bundle",
    state: "WAITING_INDEPENDENT_REVIEW",
    stateHistory: reviewSubjectStateHistory,
    candidate: { version, commit: head, tarballSha256: candidateTarballSha256 },
    manifestDigest: QA_ASSURANCE_MANIFEST_DIGEST,
    releaseReadinessInventoryDigest: QA_RELEASE_READINESS_INVENTORY_DIGEST,
    fiveConclusions: manualVerdicts,
    reviewSubjectDigest,
    reviewSubject
  });
  const reviewBundleSha256 = sha256(readFileSync(reviewBundle));
  const publishedTarballSha256 = "b".repeat(64);
  const gitCommit = "4".repeat(40);
  const npxHelpEvidence = {
    packageSpec: `@adamchanadam/agent-handoff-kit@${version}`,
    packageName: "@adamchanadam/agent-handoff-kit",
    cli: "agent-handoff-kit",
    productName: "Agent Handoff Kit",
    mode: "help",
    version,
    requiredCommands: ["init", "upgrade", "doctor", "workspace-health", "closeout-status"]
  };
  const npmMetadata = {
    version,
    latest: version,
    tarball: `https://registry.npmjs.org/@adamchanadam/agent-handoff-kit/-/agent-handoff-kit-${version}.tgz`,
    shasum: "d".repeat(40),
    integrity: `sha512-${"e".repeat(88)}`
  };
  const githubRelease = {
    tagName: `v${version}`,
    url: `https://github.com/Adamchanadam/agent-handoff-kit/releases/tag/v${version}`,
    targetCommitish: gitCommit,
    isDraft: false,
    isPrerelease: false
  };
  const postpublishCatalog = writeCatalogFixture("postpublish-catalog.json", (catalog, latest) => {
    const release = structuredClone(catalog.releases[latest]);
    release.source.npm = { ...release.source.npm, spec: `@adamchanadam/agent-handoff-kit@${version}`, shasum: npmMetadata.shasum, integrity: npmMetadata.integrity };
    release.source.git = { ...release.source.git, tag: `v${version}`, directObject: gitCommit, peeledCommit: gitCommit, commit: gitCommit };
    release.source.githubRelease = { ...release.source.githubRelease, tag: `v${version}` };
    release.source.sourceDivergence = { ...release.source.sourceDivergence, remoteTagCommit: gitCommit };
    catalog.releases[version] = release;
  });
  const selfTestEnv = {
    ...process.env,
    AGENT_HANDOFF_KIT_QA_TEST_MODE: "1",
    AGENT_HANDOFF_KIT_QA_EVIDENCE_CONTRACT_SELF_TEST: "1",
    AGENT_HANDOFF_KIT_QA_SELF_TEST_CANDIDATE_TARBALL_SHA256: candidateTarballSha256,
    AGENT_HANDOFF_KIT_QA_SELF_TEST_PUBLISHED_TARBALL_SHA256: publishedTarballSha256,
    AGENT_HANDOFF_KIT_QA_SELF_TEST_NPX_HELP_EVIDENCE: JSON.stringify(npxHelpEvidence),
    AGENT_HANDOFF_KIT_QA_SELF_TEST_GIT_TAG_COMMIT: gitCommit,
    AGENT_HANDOFF_KIT_QA_SELF_TEST_NPM_LATEST_VERSION: latestCatalogVersion,
    AGENT_HANDOFF_KIT_QA_SELF_TEST_NPM_METADATA: JSON.stringify(npmMetadata),
    AGENT_HANDOFF_KIT_QA_SELF_TEST_GITHUB_RELEASE: JSON.stringify(githubRelease)
  };
  const postpublishSelfTestEnv = { ...selfTestEnv, AGENT_HANDOFF_KIT_QA_OFFICIAL_CATALOG_PATH: postpublishCatalog };
  invokeFailure(["scripts/qa.mjs", "candidate-preflight", "--candidate", "9.9.9", "--validate-only"], "candidate-preflight package version mismatch", { env: selfTestEnv });
  invokeFailure(["scripts/qa.mjs", "candidate-preflight", "--candidate", version, "--validate-only"], "candidate-preflight surface version mismatch", {
    env: { ...selfTestEnv, AGENT_HANDOFF_KIT_QA_SELF_TEST_SURFACE_VERSION_OVERRIDE: "9.9.9" }
  });
  invokeFailure(["scripts/qa.mjs", "candidate-preflight", "--candidate", version, "--validate-only"], "candidate-preflight external readback indeterminate", {
    env: { ...selfTestEnv, AGENT_HANDOFF_KIT_QA_SELF_TEST_NPM_LATEST_ERROR: "npm latest readback spawn-error" }
  });
  const missingLatestCatalog = writeCatalogFixture("missing-latest-catalog.json", (catalog, latest) => {
    delete catalog.releases[latest];
  });
  invokeFailure(["scripts/qa.mjs", "candidate-preflight", "--candidate", version, "--validate-only"], "candidate-preflight catalog missing latest published", {
    env: { ...selfTestEnv, AGENT_HANDOFF_KIT_QA_OFFICIAL_CATALOG_PATH: missingLatestCatalog }
  });
  const candidateInCatalog = writeCatalogFixture("candidate-in-catalog.json", (catalog, latest) => {
    catalog.releases[version] = JSON.parse(JSON.stringify(catalog.releases[latest]));
  });
  invokeFailure(["scripts/qa.mjs", "candidate-preflight", "--candidate", version, "--validate-only"], "candidate-preflight candidate treated as catalog member", {
    env: { ...selfTestEnv, AGENT_HANDOFF_KIT_QA_OFFICIAL_CATALOG_PATH: candidateInCatalog }
  });
  console.log("ok: candidate-preflight positive and negative fixtures");

  if (!releaseSurfacesMatchCandidate(version)) {
    console.log("ok: full/postpublish positive evidence self-test deferred until release surfaces are synchronized to the candidate version");
    return;
  }

  const validCandidate = {
    schemaVersion: 1,
    kind: "candidate-assurance",
    featureDelivery,
    manifestDigest: QA_ASSURANCE_MANIFEST_DIGEST,
    releaseReadinessInventoryDigest: QA_RELEASE_READINESS_INVENTORY_DIGEST,
    candidate: { version, packageJsonVersion: version, commit: head, cleanWorktree: true, tarballSha256: candidateTarballSha256 },
    writerProvenance: { role: "workspace-writer", provenanceId: "self-test-writer-thread" },
    manualVerdicts,
    roleIsolation: {
      provenanceBoundary: CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.provenanceBoundary,
      stateHistory: roleStateHistory,
      reviewSubjectStateHistory,
      reviewSubjectDigest,
      reviewBundle: { path: reviewBundle, sha256: reviewBundleSha256 }
    },
    reviewReceipt: {
      schemaVersion: 1,
      verdict: "accepted",
      provenanceBoundary: CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.provenanceBoundary,
      reviewer: { role: "independent-readonly-reviewer", provenanceId: "self-test-reviewer-thread" },
      candidate: { version, commit: head, tarballSha256: candidateTarballSha256 },
      manifestDigest: QA_ASSURANCE_MANIFEST_DIGEST,
      releaseReadinessInventoryDigest: QA_RELEASE_READINESS_INVENTORY_DIGEST,
      reviewBundleSha256,
      reviewSubjectDigest,
      fiveConclusions: manualVerdicts,
      receivedAt: "2026-07-20T00:00:00.000Z"
    },
    evidence: [{
      claimId: "release-readiness",
      path: releaseQaPath,
      sha256: releaseQaSha256,
      readback: "self-test pre-release final audit readback; full 必須等 clean commit; Full-check role isolation; five-conclusion writer assessment"
    }]
  };
  const candidate = path.join(fixtureRoot, "candidate.json");
  writeEvidence(candidate, validCandidate);
  invokeFailure(["scripts/qa.mjs", "full", "--candidate", version, "--evidence", candidate, "--validate-only"], "full rejects dirty candidate before evidence acceptance", {
    env: { ...selfTestEnv, AGENT_HANDOFF_KIT_QA_SELF_TEST_GIT_STATUS: " M package.json\n" }
  });
  invoke(["scripts/qa.mjs", "full", "--candidate", version, "--evidence", candidate, "--validate-only"], "near-valid candidate evidence", { env: selfTestEnv });
  const validationReceipt = path.join(fixtureRoot, "validation-must-not-accept.json");
  invoke(["scripts/qa.mjs", "full", "--candidate", version, "--evidence", candidate, "--receipt", validationReceipt, "--validate-only"], "validate-only cannot issue acceptance", { env: selfTestEnv });
  assert(!existsSync(validationReceipt), "validate-only issued a formal acceptance receipt");
  const diffMachineResults = {
    schemaVersion: 1,
    kind: "release-readiness-machine-results",
    outcome: "completed",
    inventoryDigest: QA_RELEASE_READINESS_INVENTORY_DIGEST,
    records: [{ id: "prompt-mirror" }]
  };
  const diffMachineResultsDigest = sha256(JSON.stringify(diffMachineResults));
  const diffReviewSubject = { ...reviewSubject, machineResults: diffMachineResults, machineResultsDigest: diffMachineResultsDigest };
  const diffReviewSubjectDigest = sha256(JSON.stringify(diffReviewSubject));
  writeEvidence(reviewBundle, {
    schemaVersion: 1,
    kind: "role-isolation-review-bundle",
    state: "WAITING_INDEPENDENT_REVIEW",
    stateHistory: reviewSubjectStateHistory,
    candidate: { version, commit: head, tarballSha256: candidateTarballSha256 },
    manifestDigest: QA_ASSURANCE_MANIFEST_DIGEST,
    releaseReadinessInventoryDigest: QA_RELEASE_READINESS_INVENTORY_DIGEST,
    fiveConclusions: manualVerdicts,
    reviewSubjectDigest: diffReviewSubjectDigest,
    reviewSubject: diffReviewSubject
  });
  const diffReviewBundleSha256 = sha256(readFileSync(reviewBundle));
  const validDiffCandidate = {
    ...validCandidate,
    executionMode: "diff",
    machineResults: diffMachineResults,
    machineResultsDigest: diffMachineResultsDigest,
    roleIsolation: { ...validCandidate.roleIsolation, reviewSubjectDigest: diffReviewSubjectDigest, reviewBundle: { path: reviewBundle, sha256: diffReviewBundleSha256 } },
    reviewReceipt: { ...validCandidate.reviewReceipt, reviewBundleSha256: diffReviewBundleSha256, reviewSubjectDigest: diffReviewSubjectDigest, machineResultsDigest: diffMachineResultsDigest }
  };
  writeEvidence(candidate, validDiffCandidate);
  invoke(["scripts/qa.mjs", "full", "--mode", "diff", "--candidate", version, "--evidence", candidate, "--validate-only"], "diff child validates the review subject machine-results binding", { env: selfTestEnv });
  console.log("ok: diff qa validator accepts machine-results bound at the review-subject level");
  writeEvidence(candidate, { ...validDiffCandidate, reviewReceipt: { ...validDiffCandidate.reviewReceipt, machineResultsDigest: "0".repeat(64) } });
  invokeFailure(["scripts/qa.mjs", "full", "--mode", "diff", "--candidate", version, "--evidence", candidate, "--validate-only"], "diff child rejects a tampered receipt machine-results digest", { env: selfTestEnv });
  console.log("ok: diff qa validator rejects a tampered review receipt binding");
  const failedMachineResults = { ...diffMachineResults, outcome: "failed" };
  const failedMachineResultsDigest = sha256(JSON.stringify(failedMachineResults));
  const failedReviewSubject = { ...reviewSubject, machineResults: failedMachineResults, machineResultsDigest: failedMachineResultsDigest };
  const failedReviewSubjectDigest = sha256(JSON.stringify(failedReviewSubject));
  writeEvidence(reviewBundle, {
    schemaVersion: 1, kind: "role-isolation-review-bundle", state: "WAITING_INDEPENDENT_REVIEW", stateHistory: reviewSubjectStateHistory,
    candidate: { version, commit: head, tarballSha256: candidateTarballSha256 }, manifestDigest: QA_ASSURANCE_MANIFEST_DIGEST,
    releaseReadinessInventoryDigest: QA_RELEASE_READINESS_INVENTORY_DIGEST, fiveConclusions: manualVerdicts,
    reviewSubjectDigest: failedReviewSubjectDigest, reviewSubject: failedReviewSubject
  });
  const failedReviewBundleSha256 = sha256(readFileSync(reviewBundle));
  writeEvidence(candidate, {
    ...validDiffCandidate,
    machineResults: failedMachineResults,
    machineResultsDigest: failedMachineResultsDigest,
    roleIsolation: { ...validDiffCandidate.roleIsolation, reviewSubjectDigest: failedReviewSubjectDigest, reviewBundle: { path: reviewBundle, sha256: failedReviewBundleSha256 } },
    reviewReceipt: { ...validDiffCandidate.reviewReceipt, reviewBundleSha256: failedReviewBundleSha256, reviewSubjectDigest: failedReviewSubjectDigest, machineResultsDigest: failedMachineResultsDigest }
  });
  invokeFailure(["scripts/qa.mjs", "full", "--mode", "diff", "--candidate", version, "--evidence", candidate, "--validate-only"], "diff child rejects an incomplete machine-results capture", { env: selfTestEnv });
  console.log("ok: diff qa validator rejects an incomplete machine-results capture");
  writeEvidence(reviewBundle, {
    schemaVersion: 1,
    kind: "role-isolation-review-bundle",
    state: "WAITING_INDEPENDENT_REVIEW",
    stateHistory: reviewSubjectStateHistory,
    candidate: { version, commit: head, tarballSha256: candidateTarballSha256 },
    manifestDigest: QA_ASSURANCE_MANIFEST_DIGEST,
    releaseReadinessInventoryDigest: QA_RELEASE_READINESS_INVENTORY_DIGEST,
    fiveConclusions: manualVerdicts,
    reviewSubjectDigest,
    reviewSubject
  });
  writeEvidence(candidate, validCandidate);
  writeEvidence(candidate, { ...validCandidate, manualVerdicts: Object.fromEntries(Object.entries(manualVerdicts).reverse()), reviewReceipt: { ...validCandidate.reviewReceipt, fiveConclusions: Object.fromEntries(Object.entries(manualVerdicts).reverse()) } });
  invoke(["scripts/qa.mjs", "full", "--candidate", version, "--evidence", candidate, "--validate-only"], "equivalent verdict key order is accepted without relaxing byte digests", { env: selfTestEnv });
  writeEvidence(candidate, validCandidate);


  writeEvidence(candidate, { ...validCandidate, candidate: { ...validCandidate.candidate, tarballSha256: "f".repeat(64) } });
  invokeFailure(["scripts/qa.mjs", "full", "--candidate", version, "--evidence", candidate, "--validate-only"], "candidate tarball mismatch", { env: selfTestEnv });

  writeEvidence(candidate, { ...validCandidate, evidence: [{ ...validCandidate.evidence[0], sha256: "0".repeat(64) }] });
  invokeFailure(["scripts/qa.mjs", "full", "--candidate", version, "--evidence", candidate, "--validate-only"], "candidate evidence file hash mismatch", { env: selfTestEnv });

  writeEvidence(candidate, { ...validCandidate, reviewReceipt: undefined });
  invokeFailure(["scripts/qa.mjs", "full", "--candidate", version, "--evidence", candidate, "--validate-only"], "writer self-filled verdict without reviewer receipt", { env: selfTestEnv });

  writeEvidence(candidate, {
    ...validCandidate,
    reviewReceipt: {
      ...validCandidate.reviewReceipt,
      reviewer: { role: "independent-readonly-reviewer", provenanceId: validCandidate.writerProvenance.provenanceId }
    }
  });
  invokeFailure(["scripts/qa.mjs", "full", "--candidate", version, "--evidence", candidate, "--validate-only"], "writer self-review rejected", { env: selfTestEnv });

  const fourVerdicts = { governanceHealth: "passed", productJourney: "passed", userJourney: "passed", qcBackflow: "passed" };
  writeEvidence(candidate, { ...validCandidate, manualVerdicts: fourVerdicts, reviewReceipt: { ...validCandidate.reviewReceipt, fiveConclusions: fourVerdicts } });
  invokeFailure(["scripts/qa.mjs", "full", "--candidate", version, "--evidence", candidate, "--validate-only"], "missing fifth full-check conclusion", { env: selfTestEnv });

  writeEvidence(candidate, {
    ...validCandidate,
    roleIsolation: { ...validCandidate.roleIsolation, stateHistory: roleStateHistory.filter((state) => state !== "BASELINE_VERIFIED") }
  });
  invokeFailure(["scripts/qa.mjs", "full", "--candidate", version, "--evidence", candidate, "--validate-only"], "role isolation skipped state", { env: selfTestEnv });

  writeEvidence(candidate, { ...validCandidate, roleIsolation: { ...validCandidate.roleIsolation, reviewBundle: { path: reviewBundle, sha256: "0".repeat(64) } } });
  invokeFailure(["scripts/qa.mjs", "full", "--candidate", version, "--evidence", candidate, "--validate-only"], "review bundle digest drift", { env: selfTestEnv });

  const replacedReviewSubject = { ...reviewSubject, postReviewSubstitution: true };
  const replacedReviewSubjectDigest = sha256(JSON.stringify(replacedReviewSubject));
  writeEvidence(reviewBundle, {
    schemaVersion: 1,
    kind: "role-isolation-review-bundle",
    state: "WAITING_INDEPENDENT_REVIEW",
    stateHistory: reviewSubjectStateHistory,
    candidate: { version, commit: head, tarballSha256: candidateTarballSha256 },
    manifestDigest: QA_ASSURANCE_MANIFEST_DIGEST,
    releaseReadinessInventoryDigest: QA_RELEASE_READINESS_INVENTORY_DIGEST,
    fiveConclusions: manualVerdicts,
    reviewSubjectDigest: replacedReviewSubjectDigest,
    reviewSubject: replacedReviewSubject
  });
  const replacedReviewBundleSha256 = sha256(readFileSync(reviewBundle));
  writeEvidence(candidate, {
    ...validCandidate,
    roleIsolation: {
      ...validCandidate.roleIsolation,
      reviewSubjectDigest: replacedReviewSubjectDigest,
      reviewBundle: { path: reviewBundle, sha256: replacedReviewBundleSha256 }
    }
  });
  invokeFailure(["scripts/qa.mjs", "full", "--candidate", version, "--evidence", candidate, "--validate-only"], "post-review bundle substitution with old receipt", { env: selfTestEnv });

  writeEvidence(reviewBundle, {
    schemaVersion: 1,
    kind: "role-isolation-review-bundle",
    state: "WAITING_INDEPENDENT_REVIEW",
    stateHistory: reviewSubjectStateHistory,
    candidate: { version, commit: head, tarballSha256: candidateTarballSha256 },
    manifestDigest: QA_ASSURANCE_MANIFEST_DIGEST,
    releaseReadinessInventoryDigest: QA_RELEASE_READINESS_INVENTORY_DIGEST,
    fiveConclusions: manualVerdicts,
    reviewSubjectDigest: "8".repeat(64),
    reviewSubject
  });
  const arbitraryDigestBundleSha256 = sha256(readFileSync(reviewBundle));
  writeEvidence(candidate, {
    ...validCandidate,
    roleIsolation: {
      ...validCandidate.roleIsolation,
      reviewSubjectDigest: "8".repeat(64),
      reviewBundle: { path: reviewBundle, sha256: arbitraryDigestBundleSha256 }
    },
    reviewReceipt: {
      ...validCandidate.reviewReceipt,
      reviewBundleSha256: arbitraryDigestBundleSha256,
      reviewSubjectDigest: "8".repeat(64)
    }
  });
  invokeFailure(["scripts/qa.mjs", "full", "--candidate", version, "--evidence", candidate, "--validate-only"], "arbitrary reviewSubjectDigest not backed by bundle subject", { env: selfTestEnv });

  writeEvidence(reviewBundle, {
    schemaVersion: 1,
    kind: "role-isolation-review-bundle",
    state: "WAITING_INDEPENDENT_REVIEW",
    stateHistory: reviewSubjectStateHistory,
    candidate: { version, commit: head, tarballSha256: candidateTarballSha256 },
    manifestDigest: QA_ASSURANCE_MANIFEST_DIGEST,
    releaseReadinessInventoryDigest: QA_RELEASE_READINESS_INVENTORY_DIGEST,
    fiveConclusions: manualVerdicts,
    reviewSubjectDigest,
    reviewSubject
  });

  writeEvidence(candidate, { ...validCandidate, manifestDigest: "1".repeat(64) });
  invokeFailure(["scripts/qa.mjs", "full", "--candidate", version, "--evidence", candidate, "--validate-only"], "candidate manifest digest drift", { env: selfTestEnv });

  writeEvidence(candidate, { ...validCandidate, candidate: { ...validCandidate.candidate, commit: "9".repeat(40) } });
  invokeFailure(["scripts/qa.mjs", "full", "--candidate", version, "--evidence", candidate, "--validate-only"], "review after tracked candidate commit drift", { env: selfTestEnv });

  writeEvidence(candidate, {
    ...validCandidate,
    evidence: [{
      ...validCandidate.evidence[0],
      readback: "self-test pre-release final audit readback; full 必須等 clean commit; Full-check role isolation; five-conclusion writer assessment\n| Trigger | Applies | Status | Notes |\n|---|---|---|---|\n| 6. Semantic runtime effect | yes | pending | self-test false green |"
    }]
  });
  invokeFailure(["scripts/qa.mjs", "full", "--candidate", version, "--evidence", candidate, "--validate-only"], "pending or blocked status cannot be filled as PASS", { env: selfTestEnv });

  writeEvidence(candidate, {
    ...validCandidate,
    roleIsolation: {
      ...validCandidate.roleIsolation,
      stateHistory: roleStateHistory.slice(0, roleStateHistory.indexOf("WAITING_INDEPENDENT_REVIEW") + 1)
    },
    reviewReceipt: undefined
  });
  invokeFailure(["scripts/qa.mjs", "full", "--candidate", version, "--evidence", candidate, "--validate-only"], "full gate before independent review accepted", { env: selfTestEnv });

  writeEvidence(candidate, { ...validCandidate, candidate: { ...validCandidate.candidate, cleanWorktree: false } });
  invokeFailure(["scripts/qa.mjs", "full", "--candidate", version, "--evidence", candidate, "--validate-only"], "dirty or concurrent candidate rejected", { env: selfTestEnv });

  const validPostpublish = {
    schemaVersion: 1,
    kind: "postpublish-assurance",
    manifestDigest: QA_ASSURANCE_MANIFEST_DIGEST,
    releaseReadinessInventoryDigest: QA_RELEASE_READINESS_INVENTORY_DIGEST,
    published: {
      version,
      npmPackage: `@adamchanadam/agent-handoff-kit@${version}`,
      tarballSha256: publishedTarballSha256,
      gitCommit,
      githubReleaseUrl: githubRelease.url
    },
    readbacks: {
      npm: npmMetadata,
      npmPack: { tarballSha256: publishedTarballSha256 },
      githubRelease,
      gitTag: { commit: gitCommit },
      npxHelp: npxHelpEvidence,
      nativeUpdate: {
        status: "passed",
        observation: "Actual official-live native update completed",
        evidence: [{ path: releaseQaPath, sha256: releaseQaSha256 }],
        scenario: "normal",
        kind: "native-invocation",
        outcome: "matched",
        input: "$handoff-kit-update",
        expected: "Upgrade the prior published install to the accepted live package",
        actual: "The native update transaction committed the accepted live package",
        readback: "Installed version, health and preserved custom content were read back",
        tarballSha256: publishedTarballSha256,
        execution: { mode: "fresh-session", prompt: { path: releaseQaPath, sha256: releaseQaSha256 }, context: { path: releaseQaPath, sha256: releaseQaSha256 }, trace: { path: releaseQaPath, sha256: releaseQaSha256 } },
        update: { registryMode: "official-live", registryVersion: version, cliVersion: version, fromVersion: featureDelivery.baseVersion, toVersion: version },
        writerProvenance: { role: CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.writerRole, provenanceId: "postpublish-native-writer" }
      }
    }
  };
  validPostpublish.readbacks.nativeUpdate.nativeReview = {
    verdict: "accepted",
    provenanceBoundary: CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.provenanceBoundary,
    reviewer: { role: CANDIDATE_EVIDENCE_CONTRACT.roleIsolation.reviewerRole, provenanceId: "postpublish-native-reviewer" },
    evidence: [{ path: releaseQaPath, sha256: releaseQaSha256 }],
    subjectDigest: nativeUpdateReviewSubjectDigest(validPostpublish.readbacks.nativeUpdate)
  };
  const fullReceipt = path.join(fixtureRoot, "synthetic-full-receipt.json");
  writeEvidence(fullReceipt, {
    ...CANDIDATE_EVIDENCE_CONTRACT.fullAcceptanceReceipt, version, commit: gitCommit,
    tarballSha256: publishedTarballSha256, manifestDigest: QA_ASSURANCE_MANIFEST_DIGEST,
    releaseReadinessInventoryDigest: QA_RELEASE_READINESS_INVENTORY_DIGEST, baseVersion: featureDelivery.baseVersion,
    candidateEvidenceSha256: sha256(readFileSync(candidate))
  });
  const postpublish = path.join(fixtureRoot, "postpublish.json");
  writeEvidence(postpublish, validPostpublish);
  invoke(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "near-valid postpublish evidence", { env: postpublishSelfTestEnv });

  const missingPostpublishCatalog = writeCatalogFixture("missing-postpublish-catalog.json", (catalog) => {
    delete catalog.releases[version];
  });
  const missingCatalogResult = invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish missing official-origin catalog entry", {
    env: { ...postpublishSelfTestEnv, AGENT_HANDOFF_KIT_QA_OFFICIAL_CATALOG_PATH: missingPostpublishCatalog }
  });
  assert(`${missingCatalogResult.stdout}\n${missingCatalogResult.stderr}`.includes("run `node scripts/generate-upgrade-fixtures.mjs`"), "postpublish catalog absence did not return the catalog-sync action");
  const mismatchedPostpublishCatalog = writeCatalogFixture("mismatched-postpublish-catalog.json", (catalog) => {
    catalog.releases[version] = structuredClone(catalog.releases[latestCatalogVersionBeforeCandidate(version)]);
    catalog.releases[version].source.npm = { ...catalog.releases[version].source.npm, spec: `@adamchanadam/agent-handoff-kit@${version}`, shasum: "0".repeat(40), integrity: npmMetadata.integrity };
    catalog.releases[version].source.git = { ...catalog.releases[version].source.git, tag: `v${version}`, commit: gitCommit };
  });
  const mismatchedCatalogResult = invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish mismatched official-origin catalog entry", {
    env: { ...postpublishSelfTestEnv, AGENT_HANDOFF_KIT_QA_OFFICIAL_CATALOG_PATH: mismatchedPostpublishCatalog }
  });
  assert(`${mismatchedCatalogResult.stdout}\n${mismatchedCatalogResult.stderr}`.includes("run `node scripts/generate-upgrade-fixtures.mjs`"), "postpublish catalog mismatch did not return the catalog-sync action");

  const nativeUpdateInput = path.join(fixtureRoot, "completed-native-update.json");
  writeEvidence(nativeUpdateInput, { readbacks: { nativeUpdate: validPostpublish.readbacks.nativeUpdate } });
  const nativeUpdateInputBytes = readFileSync(nativeUpdateInput);
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--collect", path.join(fixtureRoot, "missing-native-input.json"), "--validate-only"], "collector requires completed native update evidence", { env: postpublishSelfTestEnv });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", nativeUpdateInput, "--collect", nativeUpdateInput, "--validate-only"], "collector refuses to overwrite supplied native update evidence", { env: postpublishSelfTestEnv });
  assert(nativeUpdateInputBytes.equals(readFileSync(nativeUpdateInput)), "collector overwrote supplied native update evidence on rejection");
  const collectedPostpublish = path.join(fixtureRoot, "postpublish-collected.json");
  invoke(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", nativeUpdateInput, "--collect", collectedPostpublish, "--validate-only"], "postpublish collector evidence", { env: postpublishSelfTestEnv });
  const collected = JSON.parse(readFileSync(collectedPostpublish, "utf8"));
  assert(collected.kind === "postpublish-assurance", "postpublish collector wrote the wrong evidence kind");
  assert(collected.published?.version === version, "postpublish collector wrote the wrong version");
  assert(collected.readbacks?.npm?.shasum === npmMetadata.shasum, "postpublish collector did not capture npm readback evidence");
  assert(collected.readbacks?.gitTag?.commit === gitCommit, "postpublish collector did not capture Git tag readback evidence");
  assert(semanticEqual(collected.readbacks?.nativeUpdate, validPostpublish.readbacks.nativeUpdate), "postpublish collector changed supplied native update evidence");
  assert(nativeUpdateInputBytes.equals(readFileSync(nativeUpdateInput)), "postpublish collector overwrote supplied native update evidence");

  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, nativeUpdate: undefined } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish missing native update", { env: postpublishSelfTestEnv });
  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, nativeUpdate: { ...validPostpublish.readbacks.nativeUpdate, update: { ...validPostpublish.readbacks.nativeUpdate.update, registryMode: "controlled" } } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish controlled update cannot prove official-live success", { env: postpublishSelfTestEnv });
  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, nativeUpdate: { ...validPostpublish.readbacks.nativeUpdate, tarballSha256: "3".repeat(64) } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish native update accepted artifact mismatch", { env: postpublishSelfTestEnv });
  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, nativeUpdate: { ...validPostpublish.readbacks.nativeUpdate, outcome: "expected-stop" } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish refused native update", { env: postpublishSelfTestEnv });
  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, nativeUpdate: { ...validPostpublish.readbacks.nativeUpdate, update: { ...validPostpublish.readbacks.nativeUpdate.update, fromVersion: version } } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish no-op native update", { env: postpublishSelfTestEnv });
  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, nativeUpdate: { ...validPostpublish.readbacks.nativeUpdate, execution: { ...validPostpublish.readbacks.nativeUpdate.execution, trace: undefined } } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish native update missing raw trace", { env: postpublishSelfTestEnv });
  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, nativeUpdate: { ...validPostpublish.readbacks.nativeUpdate, nativeReview: undefined } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish native update requires independent review receipt", { env: postpublishSelfTestEnv });
  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, nativeUpdate: { ...validPostpublish.readbacks.nativeUpdate, nativeReview: { ...validPostpublish.readbacks.nativeUpdate.nativeReview, verdict: "rejected" } } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish rejected native review cannot pass", { env: postpublishSelfTestEnv });
  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, nativeUpdate: { ...validPostpublish.readbacks.nativeUpdate, nativeReview: { ...validPostpublish.readbacks.nativeUpdate.nativeReview, reviewer: { ...validPostpublish.readbacks.nativeUpdate.nativeReview.reviewer, provenanceId: validPostpublish.readbacks.nativeUpdate.writerProvenance.provenanceId } } } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish native update self-review cannot pass", { env: postpublishSelfTestEnv });
  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, nativeUpdate: { ...validPostpublish.readbacks.nativeUpdate, update: { ...validPostpublish.readbacks.nativeUpdate.update, registryMode: "controlled" } } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish relabeled native update invalidates its review binding", { env: postpublishSelfTestEnv });

  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, npm: { ...npmMetadata, shasum: "1".repeat(40) } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish npm shasum mismatch", { env: postpublishSelfTestEnv });

  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, npmPack: { tarballSha256: "2".repeat(64) } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish npm pack mismatch", { env: postpublishSelfTestEnv });

  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, githubRelease: { ...githubRelease, url: `${githubRelease.url}-wrong` } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish GitHub URL mismatch", { env: postpublishSelfTestEnv });

  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, githubRelease: { ...githubRelease, targetCommitish: "5".repeat(40) } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish GitHub targetCommitish mismatch", { env: postpublishSelfTestEnv });

  writeEvidence(postpublish, { ...validPostpublish, published: { ...validPostpublish.published, gitCommit: "6".repeat(40) } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish published git commit mismatch", { env: postpublishSelfTestEnv });

  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, gitTag: { commit: "7".repeat(40) } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish git tag mismatch", { env: postpublishSelfTestEnv });

  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, npxHelp: { ...npxHelpEvidence, packageSpec: "@adamchanadam/agent-handoff-kit@0.0.0", version: "0.0.0" } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish npx help version/package mismatch", { env: postpublishSelfTestEnv });

  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, npxHelp: { ...npxHelpEvidence, requiredCommands: npxHelpEvidence.requiredCommands.filter((command) => command !== "doctor") } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish npx help missing required command", { env: postpublishSelfTestEnv });
  writeEvidence(postpublish, validPostpublish);
  const receiptA = JSON.parse(readFileSync(fullReceipt, "utf8"));
  writeEvidence(fullReceipt, { ...receiptA, commit: "a".repeat(40), tarballSha256: "a".repeat(64) });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", postpublish, "--validate-only"], "accepted candidate A rejects mutually consistent live B", { env: postpublishSelfTestEnv });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--receipt", fullReceipt, "--version", version, "--evidence", nativeUpdateInput, "--collect", path.join(fixtureRoot, "rejected-collection.json"), "--validate-only"], "collector rejects live B against accepted A", { env: postpublishSelfTestEnv });
  assert(!existsSync(path.join(fixtureRoot, "rejected-collection.json")), "collector wrote mismatched evidence");
  console.log("ok: near-valid full/postpublish evidence mismatches are rejected");
}

function invoke(args, label, options = {}) {
  return runSyncChecked(process.execPath, args, label, { cwd: root, env: options.env ?? process.env });
}

function writeCatalogFixture(name, mutate) {
  const file = path.join(fixtureRoot, name);
  const catalog = JSON.parse(readFileSync(path.join(root, "bin", "migration-baselines", "official-origin-catalog.json"), "utf8"));
  const latest = latestCatalogVersionBeforeCandidate(JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version);
  mutate(catalog, latest);
  const digestCopy = { ...catalog };
  delete digestCopy.catalogDigestSha256;
  catalog.catalogDigestSha256 = sha256(`${JSON.stringify(digestCopy)}\n`);
  writeEvidence(file, catalog);
  return file;
}

function latestCatalogVersionBeforeCandidate(candidateVersion) {
  const catalog = JSON.parse(readFileSync(path.join(root, "bin", "migration-baselines", "official-origin-catalog.json"), "utf8"));
  const versions = Object.keys(catalog.releases ?? {})
    .filter((version) => /^\d+\.\d+\.\d+$/.test(version) && compareSemver(version, candidateVersion) < 0)
    .sort(compareSemver);
  const latest = versions.at(-1);
  assert(latest, `official-origin catalog has no published version below ${candidateVersion}`);
  return latest;
}

function compareSemver(left, right) {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) return leftParts[index] - rightParts[index];
  }
  return 0;
}

function releaseSurfacesMatchCandidate(version) {
  const current = `v${version}`;
  const readText = (relativePath) => {
    try {
      return readFileSync(path.join(root, relativePath), "utf8");
    } catch {
      return null;
    }
  };
  const readmeHead = readText("README.md")?.split(/\r?\n/u).slice(0, 12).join("\n") ?? "";
  const englishReadmeHead = readText("README.en.md")?.split(/\r?\n/u).slice(0, 12).join("\n") ?? "";
  if (!readmeHead.includes(`文件對應程式版本：\`${current}\``)) return false;
  if (!englishReadmeHead.includes(`Code version covered: \`${current}\``)) return false;
  for (const surface of RELEASE_STATE_CONTRACT.surfaces) {
    const text = readText(surface.path.replace("${version}", version));
    if (!text?.includes(current)) return false;
  }
  return true;
}

function invokeFailure(args, label, options = {}) {
  const result = runSync(process.execPath, args, label, { cwd: root, env: options.env ?? process.env });
  assert(!result.errorType && result.status !== 0, `${label} unexpectedly passed`);
  return result;
}

function assertRequiredSourceFailure(sourceRoot, contract, expectedText) {
  let failed = false;
  try {
    expectedPublicMirrorFileCount(sourceRoot, contract);
  } catch (error) {
    failed = String(error.message).includes(expectedText);
  }
  assert(failed, `public mirror required-source fixture did not fail with ${expectedText}`);
}

function writeEvidence(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assertOuterTimeoutCoversInventory(outerTimeoutMs, inventory) {
  const inventoryBudgetMs = inventory.reduce((total, item) => total + item.timeoutMs, 0);
  assert(Number.isInteger(outerTimeoutMs) && outerTimeoutMs >= inventoryBudgetMs, `outer timeout ${outerTimeoutMs}ms is shorter than sequential inventory budget ${inventoryBudgetMs}ms`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
