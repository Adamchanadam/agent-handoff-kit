#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  CANDIDATE_EVIDENCE_CONTRACT,
  commandDocumentation,
  POST_UPGRADE_STATE_COMPOSITIONS,
  PUBLIC_MIRROR_CONTRACT,
  QA_ASSURANCE_MANIFEST,
  QA_ASSURANCE_MANIFEST_DIGEST,
  QA_RELEASE_READINESS_INVENTORY,
  QA_RELEASE_READINESS_INVENTORY_DIGEST,
  R034_ARTIFACT_CONTRACT,
  RELEASE_PACKAGE_CONTRACT,
  RELEASE_STATE_CONTRACT
} from "./qa-assurance-manifest.mjs";

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
  validateFailurePropagation();
  validateEvidenceContracts();
  console.log("ok: QA assurance manifest and runner wiring");
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

function validateManifest() {
  assert(QA_ASSURANCE_MANIFEST.schemaVersion === 1, "unexpected QA assurance manifest schema version");
  assert(Object.keys(QA_ASSURANCE_MANIFEST.layers).join(",") === "quick,full,postpublish", "QA layers drifted");
  const ids = new Set();
  for (const claim of QA_ASSURANCE_MANIFEST.claims) {
    assert(!ids.has(claim.id), `duplicate QA claim id: ${claim.id}`);
    ids.add(claim.id);
    assert(QA_ASSURANCE_MANIFEST.layers[claim.layer], `claim uses unknown layer: ${claim.id}`);
    for (const field of ["provenance", "readback", "evidenceOutput", "failureMode", "outOfScope"]) assert(typeof claim[field] === "string" && claim[field], `claim ${claim.id} missing ${field}`);
    assert(Array.isArray(claim.stateAxes) && claim.stateAxes.length > 0, `claim ${claim.id} has no state axes`);
    if (claim.executor.kind === "node-script") assert(claim.executor.script && path.resolve(root, claim.executor.script).startsWith(`${root}${path.sep}`), `claim ${claim.id} has an unsafe script path`);
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
  const releaseReadiness = CANDIDATE_EVIDENCE_CONTRACT.records["release-readiness"];
  assert(releaseReadiness, "release-readiness evidence contract is missing");
  assert(JSON.stringify(releaseReadiness.allowedPaths) === JSON.stringify(["docs/qa/release-grade-qa.md"]), "release-readiness evidence path contract drifted");
  for (const snippet of ["pre-release final audit", "full 必須等 clean commit", "Verdict: **PASS**"]) {
    assert(releaseReadiness.requiredReadbackSnippets.includes(snippet), `release-readiness evidence readback snippet missing: ${snippet}`);
  }
}

function validateReleasePackageContract() {
  assert(RELEASE_PACKAGE_CONTRACT.schemaVersion === 1, "unexpected release package contract schema version");
  assert(RELEASE_PACKAGE_CONTRACT.expectedPackageFileCount === 35, "release package file count contract drifted");
}

function validatePublicMirrorContract() {
  assert(PUBLIC_MIRROR_CONTRACT.schemaVersion === 1, "unexpected public mirror contract schema version");
  assert(PUBLIC_MIRROR_CONTRACT.expectedFileCount === 109, "public mirror file count contract drifted");
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
  }

  const releaseChecker = readFileSync(path.join(root, "scripts", "check-release-readiness.mjs"), "utf8");
  assert(releaseChecker.includes("for (const qaCheck of QA_RELEASE_READINESS_INVENTORY)"), "release readiness no longer iterates over the manifest-owned inventory");
  assert(!/runQaScript\s*\(\s*["']/.test(releaseChecker), "release readiness still contains hard-coded QA member calls");
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
    const result = spawnSync(process.execPath, ["scripts/qa.mjs", claim.layer, "--test-fail-claim", claim.id], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, AGENT_HANDOFF_KIT_QA_TEST_MODE: "1" }
    });
    assert(!result.error && result.status !== 0, `controlled failure did not block ${claim.id}`);
    assert(`${result.stdout}\n${result.stderr}`.includes(`controlled executor failure: ${claim.id}`), `controlled failure was not attributed to ${claim.id}`);
  }
}

function validateEvidenceContracts() {
  const version = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version;
  const head = invoke(["-e", "const {spawnSync}=require('node:child_process'); const r=spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}); if(r.status) process.exit(r.status); process.stdout.write(r.stdout.trim());"], "git HEAD readback").stdout;
  const releaseQaPath = "docs/qa/release-grade-qa.md";
  const releaseQaSha256 = sha256(readFileSync(path.join(root, releaseQaPath)));
  const candidateTarballSha256 = "a".repeat(64);
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
    AGENT_HANDOFF_KIT_QA_SELF_TEST_NPM_METADATA: JSON.stringify(npmMetadata),
    AGENT_HANDOFF_KIT_QA_SELF_TEST_GITHUB_RELEASE: JSON.stringify(githubRelease)
  };
  const validCandidate = {
    schemaVersion: 1,
    kind: "candidate-assurance",
    manifestDigest: QA_ASSURANCE_MANIFEST_DIGEST,
    releaseReadinessInventoryDigest: QA_RELEASE_READINESS_INVENTORY_DIGEST,
    candidate: { version, packageJsonVersion: version, commit: head, tarballSha256: candidateTarballSha256 },
    manualVerdicts: { governanceHealth: "passed", productJourney: "passed", userJourney: "passed", qcBackflow: "passed" },
    evidence: [{
      claimId: "release-readiness",
      path: releaseQaPath,
      sha256: releaseQaSha256,
      readback: "self-test pre-release final audit readback; full 必須等 clean commit; Verdict: **PASS**"
    }]
  };
  const candidate = path.join(fixtureRoot, "candidate.json");
  writeEvidence(candidate, validCandidate);
  invoke(["scripts/qa.mjs", "full", "--candidate", version, "--evidence", candidate, "--validate-only"], "near-valid candidate evidence", { env: selfTestEnv });

  writeEvidence(candidate, { ...validCandidate, candidate: { ...validCandidate.candidate, tarballSha256: "f".repeat(64) } });
  invokeFailure(["scripts/qa.mjs", "full", "--candidate", version, "--evidence", candidate, "--validate-only"], "candidate tarball mismatch", { env: selfTestEnv });

  writeEvidence(candidate, { ...validCandidate, evidence: [{ ...validCandidate.evidence[0], sha256: "0".repeat(64) }] });
  invokeFailure(["scripts/qa.mjs", "full", "--candidate", version, "--evidence", candidate, "--validate-only"], "candidate evidence file hash mismatch", { env: selfTestEnv });

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
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", env: options.env ?? process.env });
  assert(!result.error && result.status === 0, `${label} failed\n${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  return result;
}

function invokeFailure(args, label, options = {}) {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", env: options.env ?? process.env });
  assert(!result.error && result.status !== 0, `${label} unexpectedly passed`);
  return result;
}

function writeEvidence(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
