#!/usr/bin/env node

import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  aggregateReleaseReadinessTimeoutMs,
  assertPublicMirrorRequiredSources,
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
  R034_ARTIFACT_CONTRACT,
  RELEASE_PACKAGE_CONTRACT,
  RELEASE_STATE_CONTRACT
} from "./qa-assurance-manifest.mjs";
import { assertRunFailed, invokeAsync, runSync, runSyncChecked, TIMEOUT_EXIT_CODE } from "./qa-runner-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = mkdtempSync(path.join(tmpdir(), "ack-qa-assurance-"));

try {
  validateManifest();
  validateCandidateEvidenceContract();
  validatePublicMirrorContract();
  validateReleasePackageContract();
  validateR034ArtifactContract();
  validateReleaseStateContract();
  validateStateCompositions();
  validateCommandDocumentation();
  validateRunnerInventory();
  validateReleaseReadinessInventory();
  validateRunnerTerminalStateContract();
  await validateProductionRunnerTerminalStateContract();
  validateFailurePropagation();
  validateEvidenceContracts();
  console.log("ok: QA assurance manifest and runner wiring");
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
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
    if (claim.executor.kind === "node-script") {
      assert(claim.executor.script && path.resolve(root, claim.executor.script).startsWith(`${root}${path.sep}`), `claim ${claim.id} has an unsafe script path`);
      assert(Number.isInteger(claim.executor.timeoutMs) && claim.executor.timeoutMs >= 30_000, `claim ${claim.id} lacks a reasonable per-command timeout`);
    } else if (claim.executor.kind === "internal-validator") {
      assert(Number.isInteger(claim.executor.timeoutMs) && claim.executor.timeoutMs >= 30_000, `claim ${claim.id} lacks a reasonable internal-validator timeout`);
    }
  }
  assert(/^[a-f0-9]{64}$/.test(QA_ASSURANCE_MANIFEST_DIGEST), "manifest digest is malformed");
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
  for (const binding of ["candidate.commit", "candidate.tarballSha256", "manifestDigest", "releaseReadinessInventoryDigest", "reviewBundle.sha256", "reviewSubjectDigest", "manualVerdicts"]) {
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
  assert(RELEASE_PACKAGE_CONTRACT.expectedPackageFileCount === 34, "release package file count contract drifted");
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

function validateR034ArtifactContract() {
  assert(R034_ARTIFACT_CONTRACT.schemaVersion === 1, "unexpected R-034 artifact contract schema version");
  assert(R034_ARTIFACT_CONTRACT.version === "0.3.41", "R-034 artifact version drifted");
  assert(R034_ARTIFACT_CONTRACT.packageRootEnv === "AGENT_HANDOFF_KIT_R034_ARTIFACT_ROOT", "R-034 package-root env contract drifted");
  assert(R034_ARTIFACT_CONTRACT.tarballPathEnv === "AGENT_HANDOFF_KIT_R034_ARTIFACT_TGZ", "R-034 tarball env contract drifted");
  assert(/^[a-f0-9]{40}$/.test(R034_ARTIFACT_CONTRACT.sha1), "R-034 artifact sha1 is malformed");
  assert(/^sha512-/.test(R034_ARTIFACT_CONTRACT.integrity), "R-034 artifact integrity is malformed");
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
  assert(ids.has("v045-accepted-witness-legacy-archive-upgrade-closeout"), "legacy archive regression is absent from state compositions");
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
  const reviewSubject = {
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
  const npxHelpSha256 = "c".repeat(64);
  const gitCommit = "4".repeat(40);
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
  const selfTestEnv = {
    ...process.env,
    AGENT_HANDOFF_KIT_QA_TEST_MODE: "1",
    AGENT_HANDOFF_KIT_QA_EVIDENCE_CONTRACT_SELF_TEST: "1",
    AGENT_HANDOFF_KIT_QA_SELF_TEST_CANDIDATE_TARBALL_SHA256: candidateTarballSha256,
    AGENT_HANDOFF_KIT_QA_SELF_TEST_PUBLISHED_TARBALL_SHA256: publishedTarballSha256,
    AGENT_HANDOFF_KIT_QA_SELF_TEST_NPX_HELP_SHA256: npxHelpSha256,
    AGENT_HANDOFF_KIT_QA_SELF_TEST_GIT_TAG_COMMIT: gitCommit,
    AGENT_HANDOFF_KIT_QA_SELF_TEST_NPM_LATEST_VERSION: previousPatch(version),
    AGENT_HANDOFF_KIT_QA_SELF_TEST_NPM_METADATA: JSON.stringify(npmMetadata),
    AGENT_HANDOFF_KIT_QA_SELF_TEST_GITHUB_RELEASE: JSON.stringify(githubRelease)
  };
  invoke(["scripts/qa.mjs", "candidate-preflight", "--candidate", version, "--validate-only"], "near-valid candidate preflight", { env: selfTestEnv });
  invoke(["scripts/qa.mjs", "candidate-preflight", "--candidate", version, "--validate-only"], "pre-freeze dirty candidate preflight", {
    env: { ...selfTestEnv, AGENT_HANDOFF_KIT_QA_SELF_TEST_GIT_STATUS: " M package.json\n" }
  });
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

  const validCandidate = {
    schemaVersion: 1,
    kind: "candidate-assurance",
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
      npxHelp: { sha256: npxHelpSha256 }
    }
  };
  const postpublish = path.join(fixtureRoot, "postpublish.json");
  writeEvidence(postpublish, validPostpublish);
  invoke(["scripts/qa.mjs", "postpublish", "--version", version, "--evidence", postpublish, "--validate-only"], "near-valid postpublish evidence", { env: selfTestEnv });

  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, npm: { ...npmMetadata, shasum: "1".repeat(40) } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish npm shasum mismatch", { env: selfTestEnv });

  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, npmPack: { tarballSha256: "2".repeat(64) } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish npm pack mismatch", { env: selfTestEnv });

  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, githubRelease: { ...githubRelease, url: `${githubRelease.url}-wrong` } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish GitHub URL mismatch", { env: selfTestEnv });

  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, githubRelease: { ...githubRelease, targetCommitish: "5".repeat(40) } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish GitHub targetCommitish mismatch", { env: selfTestEnv });

  writeEvidence(postpublish, { ...validPostpublish, published: { ...validPostpublish.published, gitCommit: "6".repeat(40) } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish published git commit mismatch", { env: selfTestEnv });

  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, gitTag: { commit: "7".repeat(40) } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish git tag mismatch", { env: selfTestEnv });

  writeEvidence(postpublish, { ...validPostpublish, readbacks: { ...validPostpublish.readbacks, npxHelp: { sha256: "3".repeat(64) } } });
  invokeFailure(["scripts/qa.mjs", "postpublish", "--version", version, "--evidence", postpublish, "--validate-only"], "postpublish npx help mismatch", { env: selfTestEnv });
  console.log("ok: near-valid full/postpublish evidence mismatches are rejected");
}

function invoke(args, label, options = {}) {
  return runSyncChecked(process.execPath, args, label, { cwd: root, env: options.env ?? process.env });
}

function writeCatalogFixture(name, mutate) {
  const file = path.join(fixtureRoot, name);
  const catalog = JSON.parse(readFileSync(path.join(root, "bin", "migration-baselines", "official-origin-catalog.json"), "utf8"));
  const latest = previousPatch(JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version);
  mutate(catalog, latest);
  const digestCopy = { ...catalog };
  delete digestCopy.catalogDigestSha256;
  catalog.catalogDigestSha256 = sha256(`${JSON.stringify(digestCopy)}\n`);
  writeEvidence(file, catalog);
  return file;
}

function previousPatch(version) {
  const parts = version.split(".").map((part) => Number.parseInt(part, 10));
  assert(parts.length === 3 && parts.every(Number.isInteger) && parts[2] > 0, `cannot derive previous patch from ${version}`);
  parts[2] -= 1;
  return parts.join(".");
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
