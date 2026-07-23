#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CANDIDATE_EVIDENCE_CONTRACT,
  expectedPublicMirrorFileCount,
  PUBLIC_MIRROR_CONTRACT,
  QA_ASSURANCE_MANIFEST,
  QA_ASSURANCE_MANIFEST_DIGEST,
  QA_RELEASE_READINESS_INVENTORY,
  QA_RELEASE_READINESS_INVENTORY_DIGEST,
  RELEASE_STATE_CONTRACT
} from "./qa-assurance-manifest.mjs";
import { loadOfficialOriginCatalog } from "../bin/official-origin-catalog.mjs";
import { LONG_QA_TIMEOUT_MS, QaRunError, runChecked, runNodeScriptChecked } from "./qa-runner-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const evidenceContractSelfTest = process.env.AGENT_HANDOFF_KIT_QA_TEST_MODE === "1"
  && process.env.AGENT_HANDOFF_KIT_QA_EVIDENCE_CONTRACT_SELF_TEST === "1";

try {
  await main();
} catch (error) {
  console.error(`QA assurance failed: ${error.message}`);
  process.exitCode = error instanceof QaRunError ? error.exitCode : 1;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.list) {
    console.log(JSON.stringify({
      schemaVersion: QA_ASSURANCE_MANIFEST.schemaVersion,
      digest: QA_ASSURANCE_MANIFEST_DIGEST,
      layers: QA_ASSURANCE_MANIFEST.layers,
      claims: QA_ASSURANCE_MANIFEST.claims,
      releaseReadinessInventoryDigest: QA_RELEASE_READINESS_INVENTORY_DIGEST,
      releaseReadinessInventory: QA_RELEASE_READINESS_INVENTORY
    }, null, 2));
    return;
  }

  if (options.testRunnerFixture) {
    assert(process.env.AGENT_HANDOFF_KIT_QA_TEST_MODE === "1", "--test-runner-fixture is test-only");
    assert(options.testRunnerTimeoutMs === null || Number.isInteger(options.testRunnerTimeoutMs) && options.testRunnerTimeoutMs > 0, "--test-runner-timeout-ms must be a positive integer");
    await runNodeScriptChecked(options.testRunnerFixture, "production runner fixture", {
      cwd: root,
      env: process.env,
      timeoutMs: options.testRunnerTimeoutMs ?? 200,
      killGraceMs: 200,
      settleGraceMs: 800
    });
    return;
  }
  if (options.testCommandShellFixture) {
    assert(process.env.AGENT_HANDOFF_KIT_QA_TEST_MODE === "1", "--test-command-shell-fixture is test-only");
    assert(options.testRunnerTimeoutMs === null || Number.isInteger(options.testRunnerTimeoutMs) && options.testRunnerTimeoutMs > 0, "--test-runner-timeout-ms must be a positive integer");
    const result = await runCommand(options.testCommandShellFixture, [], "production command shell fixture", {
      cwd: path.dirname(path.resolve(options.testCommandShellFixture)),
      shell: true,
      timeoutMs: options.testRunnerTimeoutMs ?? 10_000
    });
    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    return;
  }
  if (options.testCommandSpawnError) {
    assert(process.env.AGENT_HANDOFF_KIT_QA_TEST_MODE === "1", "--test-command-spawn-error is test-only");
    await runCommand("definitely-not-agent-handoff-kit-command", [], "production command spawn-error fixture", {
      timeoutMs: 10_000
    });
    return;
  }

  const layer = options.layer;
  assert(layer && QA_ASSURANCE_MANIFEST.layers[layer], "usage: node scripts/qa.mjs <quick|candidate-preflight|full|postpublish> [options]");
  const claims = QA_ASSURANCE_MANIFEST.claims.filter((claim) => claim.layer === layer);
  assert(claims.length > 0, `manifest has no claims for ${layer}`);

  if (options.testFailClaim) {
    assert(process.env.AGENT_HANDOFF_KIT_QA_TEST_MODE === "1", "--test-fail-claim is test-only");
    assert(claims.some((claim) => claim.id === options.testFailClaim), `test failure claim is not required by ${layer}: ${options.testFailClaim}`);
    throw new Error(`controlled executor failure: ${options.testFailClaim}`);
  }

  if (layer === "candidate-preflight") await validateCandidatePreflight(options);
  if (layer === "full") await validateCandidatePreflight(options, { requireFrozenIdentity: true });
  if (layer === "full") await validateCandidateEvidence(options);
  if (layer === "postpublish") await validatePostpublishEvidence(options);
  if (options.validateOnly) {
    console.log(`ok: ${layer} evidence contract (${QA_ASSURANCE_MANIFEST_DIGEST})`);
    return;
  }

  for (const claim of claims) await runClaim(claim);
  console.log(`Agent Handoff Kit ${layer} QA passed (${QA_ASSURANCE_MANIFEST_DIGEST})`);
}

function parseArgs(args) {
  const options = { layer: null, list: false, validateOnly: false, candidate: null, version: null, evidence: null, testFailClaim: null, testRunnerFixture: null, testRunnerTimeoutMs: null, testCommandShellFixture: null, testCommandSpawnError: false };
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--list") options.list = true;
    else if (value === "--validate-only") options.validateOnly = true;
    else if (value === "--candidate") options.candidate = requireValue(args, ++index, value);
    else if (value === "--version") options.version = requireValue(args, ++index, value);
    else if (value === "--evidence") options.evidence = requireValue(args, ++index, value);
    else if (value === "--test-fail-claim") options.testFailClaim = requireValue(args, ++index, value);
    else if (value === "--test-runner-fixture") options.testRunnerFixture = requireValue(args, ++index, value);
    else if (value === "--test-runner-timeout-ms") options.testRunnerTimeoutMs = Number(requireValue(args, ++index, value));
    else if (value === "--test-command-shell-fixture") options.testCommandShellFixture = requireValue(args, ++index, value);
    else if (value === "--test-command-spawn-error") options.testCommandSpawnError = true;
    else if (!options.layer) options.layer = value;
    else throw new Error(`unknown argument: ${value}`);
  }
  return options;
}

async function validateCandidateEvidence(options) {
  assert(options.candidate, "full requires --candidate <version>");
  const evidence = readEvidence(options.evidence, "full requires --evidence <candidate-evidence.json>");
  const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  assert(packageJson.version === options.candidate, "full candidate version does not match package.json");
  const status = await candidateGitStatus();
  assert(status.stdout.trim() === "", "full requires a clean worktree before candidate evidence can be accepted");
  const head = await candidateGitHead();
  assert(evidence.kind === "candidate-assurance" && evidence.schemaVersion === 1, "candidate evidence has the wrong schema");
  assert(evidence.manifestDigest === QA_ASSURANCE_MANIFEST_DIGEST, "candidate evidence manifest digest does not match this source");
  assert(evidence.releaseReadinessInventoryDigest === QA_RELEASE_READINESS_INVENTORY_DIGEST, "candidate evidence release-readiness inventory digest does not match this source");
  assert(evidence.candidate?.version === options.candidate, "candidate evidence version does not match --candidate");
  assert(evidence.candidate?.packageJsonVersion === packageJson.version, "candidate evidence packageJsonVersion does not match package.json");
  assert(evidence.candidate?.commit === head, "candidate evidence commit does not match clean HEAD");
  assert(evidence.candidate?.cleanWorktree === true, "candidate evidence must record cleanWorktree: true");
  assert(isSha256(evidence.candidate?.tarballSha256, 64), "candidate evidence requires tarballSha256");
  assert(await freshCandidateTarballSha256() === evidence.candidate.tarballSha256.toLowerCase(), "candidate evidence tarballSha256 does not match a freshly packed candidate");
  assert(validManualVerdicts(evidence.manualVerdicts), `candidate evidence requires all five full-check verdicts to be passed: ${CANDIDATE_EVIDENCE_CONTRACT.manualVerdictKeys.join(", ")}`);
  validateRoleIsolationEvidence(evidence, head);
  validateCandidateReportSection(options.candidate);
  validateEvidenceRecords(evidence.evidence);
}

async function validatePostpublishEvidence(options) {
  assert(options.version, "postpublish requires --version <version>");
  const evidence = readEvidence(options.evidence, "postpublish requires --evidence <postpublish-evidence.json>");
  assert(evidence.kind === "postpublish-assurance" && evidence.schemaVersion === 1, "postpublish evidence has the wrong schema");
  assert(evidence.manifestDigest === QA_ASSURANCE_MANIFEST_DIGEST, "postpublish evidence manifest digest does not match this source");
  assert(evidence.releaseReadinessInventoryDigest === QA_RELEASE_READINESS_INVENTORY_DIGEST, "postpublish evidence release-readiness inventory digest does not match this source");
  assert(evidence.published?.version === options.version, "postpublish evidence version does not match --version");
  assert(evidence.published?.npmPackage === `@adamchanadam/agent-handoff-kit@${options.version}`, "postpublish evidence requires the exact published npm package identity");
  assert(isSha256(evidence.published?.tarballSha256, 64), "postpublish evidence requires tarballSha256");
  assert(isSha256(evidence.published?.gitCommit, 40), "postpublish evidence requires the exact published git commit");
  assert(typeof evidence.published?.githubReleaseUrl === "string" && evidence.published.githubReleaseUrl === `https://github.com/Adamchanadam/agent-handoff-kit/releases/tag/v${options.version}`, "postpublish evidence requires the exact GitHub Release URL");

  const npmView = await readNpmPublishedMetadata(options.version);
  assert(evidence.readbacks?.npm?.version === npmView.version, "postpublish npm evidence version does not match registry readback");
  assert(evidence.readbacks?.npm?.latest === options.version && npmView.latest === options.version, "postpublish npm latest readback does not match the published version");
  assert(evidence.readbacks?.npm?.tarball === npmView.tarball, "postpublish npm tarball URL does not match registry readback");
  assert(evidence.readbacks?.npm?.shasum === npmView.shasum, "postpublish npm shasum does not match registry readback");
  assert(evidence.readbacks?.npm?.integrity === npmView.integrity, "postpublish npm integrity does not match registry readback");

  const packedSha256 = await packPublishedTarballSha256(options.version);
  assert(evidence.published.tarballSha256.toLowerCase() === packedSha256, "postpublish published tarballSha256 does not match npm pack readback");
  assert(evidence.readbacks?.npmPack?.tarballSha256 === packedSha256, "postpublish npm pack readback does not match published tarballSha256");

  const release = await readGithubRelease(options.version);
  assert(evidence.readbacks?.githubRelease?.tagName === release.tagName, "postpublish GitHub tag evidence does not match release readback");
  assert(evidence.readbacks.githubRelease.url === release.url, "postpublish GitHub URL evidence does not match release readback");
  assert(evidence.readbacks.githubRelease.targetCommitish === release.targetCommitish, "postpublish GitHub targetCommitish evidence does not match release readback");
  assert(evidence.readbacks.githubRelease.isDraft === false && release.isDraft === false, "postpublish GitHub Release is draft");
  assert(evidence.readbacks.githubRelease.isPrerelease === false && release.isPrerelease === false, "postpublish GitHub Release is prerelease");

  const tagCommit = await readRemoteTagCommit(options.version);
  assert(evidence.published.gitCommit.toLowerCase() === tagCommit, "postpublish published git commit does not match remote tag readback");
  assert(evidence.readbacks?.gitTag?.commit === tagCommit, "postpublish git tag evidence does not match remote tag readback");

  const helpSha256 = await npxHelpSha256(options.version);
  assert(evidence.readbacks?.npxHelp?.sha256 === helpSha256, "postpublish npx help evidence does not match ordinary consumer readback");
}

async function runClaim(claim) {
  if (claim.executor.kind !== "node-script") return;
  const script = claim.executor.script;
  assert(existsSync(path.join(root, script)), `manifest executor is missing: ${script}`);
  await runNodeScriptChecked(script, claim.id, { cwd: root, env: process.env, timeoutMs: claim.executor.timeoutMs });
}

async function validateCandidatePreflight(options, config = {}) {
  assert(options.candidate, "candidate-preflight requires --candidate <version>");
  assert(QA_ASSURANCE_MANIFEST.layers["candidate-preflight"].command === "node scripts/qa.mjs candidate-preflight --candidate <version>", "candidate-preflight command contract drifted");
  const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  assert(isStableSemver(options.candidate), "candidate-preflight requires a stable semver candidate");
  assert(packageJson.version === options.candidate, "candidate-preflight candidate version does not match package.json");
  assert(/^[a-f0-9]{64}$/.test(QA_ASSURANCE_MANIFEST_DIGEST), "candidate-preflight manifest digest is malformed");
  assert(/^[a-f0-9]{64}$/.test(QA_RELEASE_READINESS_INVENTORY_DIGEST), "candidate-preflight release-readiness inventory digest is malformed");
  validateCandidateReleaseSurfaces(options.candidate);
  validateCandidateMirrorBoundary(options.candidate);
  await validateCandidatePublishedLineage(options.candidate);
  const status = await candidateGitStatus();
  if (config.requireFrozenIdentity) {
    assert(status.stdout.trim() === "", "full requires a clean worktree before candidate evidence can be accepted");
    const head = await candidateGitHead();
    assert(isSha256(head, 40), "full could not read a clean candidate HEAD");
    console.log(`ok: candidate-preflight frozen identity ${options.candidate} ${head}`);
    return;
  }
  const dirty = status.stdout.trim() !== "";
  if (dirty) console.log(`ok: candidate-preflight semantic ${options.candidate} (pre-freeze tracked changes present)`);
  else {
    const head = await candidateGitHead();
    assert(isSha256(head, 40), "candidate-preflight could not read candidate HEAD");
    console.log(`ok: candidate-preflight semantic ${options.candidate} ${head}`);
  }
}

function validateCandidateReleaseSurfaces(version) {
  const surfaceVersion = evidenceContractSelfTest && process.env.AGENT_HANDOFF_KIT_QA_SELF_TEST_SURFACE_VERSION_OVERRIDE
    ? process.env.AGENT_HANDOFF_KIT_QA_SELF_TEST_SURFACE_VERSION_OVERRIDE
    : version;
  const current = `v${surfaceVersion}`;
  const activeSurfaces = RELEASE_STATE_CONTRACT.surfaces.map((surface) => materializeVersionedPath(surface.path, version));
  const forbidden = RELEASE_STATE_CONTRACT.forbiddenPatterns.map((pattern) => new RegExp(pattern.source, pattern.flags));
  const readmeHead = readRepoText("README.md").split(/\r?\n/u).slice(0, 12).join("\n");
  const englishReadmeHead = readRepoText("README.en.md").split(/\r?\n/u).slice(0, 12).join("\n");
  assert(readmeHead.includes(`原始碼套件版本：\`${current}\``), "README.md first screen is not synchronized to the candidate package version");
  assert(readmeHead.includes("npm `@latest` 與 GitHub Release 以發佈後讀回為準"), "README.md must keep npm/GitHub publication as an external readback boundary");
  assert(englishReadmeHead.includes(`Source package version: \`${current}\``), "README.en.md first screen is not synchronized to the candidate package version");
  assert(englishReadmeHead.includes("npm `@latest` and GitHub Release are verified by post-publish readback"), "README.en.md must keep npm/GitHub publication as an external readback boundary");
  for (const file of activeSurfaces) {
    const text = readRepoText(file);
    assert(text.includes(current), `${file} does not expose candidate source version ${current}`);
    for (const pattern of forbidden) {
      const match = pattern.exec(text);
      assert(!match, `${file} still exposes release-state drift: ${match?.[0]}`);
    }
  }
  const changelog = readRepoText("CHANGELOG.md").replace(/\r\n/g, "\n");
  const heading = changelog.match(/^## v\d+\.\d+\.\d+ — .+$/m);
  assert(heading?.[0]?.startsWith(`## ${current} — `), `CHANGELOG.md latest heading must be ${current}`);
  const whatsnewIndex = readRepoText("docs/whatsnew/README.md");
  assert(whatsnewIndex.includes(`[${current} 版本頁]`), `docs/whatsnew/README.md does not list ${current}`);
}

function validateCandidateMirrorBoundary(version) {
  const expectedCount = expectedPublicMirrorFileCount(root);
  assert(Number.isInteger(expectedCount) && expectedCount > 0, "candidate-preflight could not derive public mirror file count from manifest owner");
  assert(PUBLIC_MIRROR_CONTRACT.allowDirs.includes("docs/whatsnew"), "public mirror contract must include versioned whatsnew pages");
  assert(existsSync(path.join(root, "docs", "whatsnew", `v${version}.md`)), `candidate whatsnew page is missing: docs/whatsnew/v${version}.md`);
  assert(expectedPublicMirrorFileCount(root) === expectedCount, "public mirror derived membership is unstable");
}

async function validateCandidatePublishedLineage(candidateVersion) {
  const latestPublishedVersion = await readLatestPublishedVersion();
  assert(isStableSemver(latestPublishedVersion), "published npm latest readback did not return a stable semver");
  assert(compareSemver(candidateVersion, latestPublishedVersion) > 0, `candidate ${candidateVersion} must be newer than latest published ${latestPublishedVersion}`);
  const catalogPath = process.env.AGENT_HANDOFF_KIT_QA_OFFICIAL_CATALOG_PATH
    ? path.resolve(process.env.AGENT_HANDOFF_KIT_QA_OFFICIAL_CATALOG_PATH)
    : undefined;
  const catalog = await loadOfficialOriginCatalog(catalogPath);
  const versions = Object.keys(catalog.releases ?? {});
  assert(versions.includes(latestPublishedVersion), `official-origin catalog does not include latest published v${latestPublishedVersion}`);
  assert(!versions.includes(candidateVersion), `official-origin catalog must not include unpublished candidate v${candidateVersion}`);
  assert(versions.at(-1) === latestPublishedVersion, `official-origin catalog range must end at latest published v${latestPublishedVersion}`);
}

async function readLatestPublishedVersion() {
  if (evidenceContractSelfTest) {
    if (process.env.AGENT_HANDOFF_KIT_QA_SELF_TEST_NPM_LATEST_ERROR) throw new Error(process.env.AGENT_HANDOFF_KIT_QA_SELF_TEST_NPM_LATEST_ERROR);
    return requiredSelfTestValue("AGENT_HANDOFF_KIT_QA_SELF_TEST_NPM_LATEST_VERSION");
  }
  const result = await runNpm(["view", "@adamchanadam/agent-handoff-kit", "version", "--json"], "npm latest published version");
  return JSON.parse(result.stdout);
}

function readEvidence(file, requiredMessage) {
  assert(file, requiredMessage);
  const absolute = path.resolve(file);
  assert(existsSync(absolute), `evidence file does not exist: ${absolute}`);
  try {
    return JSON.parse(readFileSync(absolute, "utf8"));
  } catch (error) {
    throw new Error(`invalid evidence JSON: ${error.message}`);
  }
}

function validManualVerdicts(value) {
  return CANDIDATE_EVIDENCE_CONTRACT.manualVerdictKeys.every((key) => value?.[key] === "passed");
}

function validateRoleIsolationEvidence(evidence, head) {
  const contract = CANDIDATE_EVIDENCE_CONTRACT.roleIsolation;
  assert(evidence.roleIsolation?.provenanceBoundary === contract.provenanceBoundary, "role provenance boundary is missing or drifted");
  assert(evidence.writerProvenance?.role === contract.writerRole, "candidate evidence writer provenance must be workspace-writer");
  assert(typeof evidence.writerProvenance?.provenanceId === "string" && evidence.writerProvenance.provenanceId, "candidate evidence writer provenanceId is required");
  assert(isSha256(evidence.roleIsolation?.reviewSubjectDigest, 64), "candidate evidence requires reviewSubjectDigest");
  assertValidStateHistory(evidence.roleIsolation?.stateHistory, contract.fullGateAcceptedPath);
  assertValidStateHistory(evidence.roleIsolation?.reviewSubjectStateHistory, contract.reviewSubjectPath);
  const bundle = validateReviewBundle(evidence.roleIsolation?.reviewBundle, evidence, head);

  const receipt = evidence.reviewReceipt;
  assert(receipt && typeof receipt === "object" && !Array.isArray(receipt), "full gate requires an independent review receipt");
  assert(receipt.verdict === "accepted", "full gate requires an accepted independent review receipt");
  assert(receipt.provenanceBoundary === contract.provenanceBoundary, "review receipt provenance boundary is missing or drifted");
  assert(receipt.reviewer?.role === contract.reviewerRole, "review receipt reviewer must be independent-readonly-reviewer");
  assert(typeof receipt.reviewer?.provenanceId === "string" && receipt.reviewer.provenanceId, "review receipt reviewer provenanceId is required");
  assert(receipt.reviewer.provenanceId !== evidence.writerProvenance.provenanceId, "writer self-review cannot satisfy independent review");
  assert(receipt.candidate?.version === evidence.candidate.version, "review receipt candidate version does not match evidence");
  assert(receipt.candidate?.commit === evidence.candidate.commit && receipt.candidate.commit === head, "review receipt candidate commit does not match clean HEAD");
  assert(receipt.candidate?.tarballSha256 === evidence.candidate.tarballSha256, "review receipt tarballSha256 does not match evidence");
  assert(receipt.manifestDigest === evidence.manifestDigest, "review receipt manifestDigest does not match evidence");
  assert(receipt.releaseReadinessInventoryDigest === evidence.releaseReadinessInventoryDigest, "review receipt release-readiness inventory digest does not match evidence");
  assert(receipt.reviewBundleSha256 === bundle.sha256, "review receipt reviewBundleSha256 does not match current review bundle");
  assert(receipt.reviewSubjectDigest === evidence.roleIsolation.reviewSubjectDigest, "review receipt reviewSubjectDigest does not match evidence");
  assert(validManualVerdicts(receipt.fiveConclusions), "review receipt must carry the same five passed full-check conclusions");
  assert(JSON.stringify(receipt.fiveConclusions) === JSON.stringify(evidence.manualVerdicts), "review receipt five conclusions do not match candidate evidence");
  assert(typeof receipt.receivedAt === "string" && receipt.receivedAt, "review receipt receivedAt is required");
}

function assertValidStateHistory(history, requiredPath) {
  assert(Array.isArray(history) && history.length > 0, "candidate evidence requires roleIsolation.stateHistory");
  const actual = history.map((entry) => typeof entry === "string" ? entry : entry?.state);
  assert(actual.every((state) => typeof state === "string" && state), "roleIsolation.stateHistory entries must be states");
  assert(JSON.stringify(actual) === JSON.stringify(requiredPath), `full gate requires exact accepted state path: ${requiredPath.join(" -> ")}`);
}

function validateReviewBundle(bundle, evidence, head) {
  assert(bundle && typeof bundle === "object" && !Array.isArray(bundle), "candidate evidence requires reviewBundle binding");
  assert(typeof bundle.path === "string" && bundle.path, "reviewBundle.path is required");
  assert(isSha256(bundle.sha256, 64), "reviewBundle.sha256 is required");
  const absolute = path.resolve(bundle.path);
  assert(existsSync(absolute), `review bundle does not exist: ${absolute}`);
  const bytes = readFileSync(absolute);
  const actualSha256 = sha256(bytes);
  assert(actualSha256 === bundle.sha256.toLowerCase(), "review bundle sha256 does not match file bytes");
  const parsed = parseReviewBundle(bytes, absolute);
  assert(parsed.kind === "role-isolation-review-bundle" && parsed.schemaVersion === 1, "review bundle has the wrong schema");
  assert(parsed.state === "WAITING_INDEPENDENT_REVIEW" || parsed.state === "REVIEW_ACCEPTED", "review bundle state must be waiting or accepted for full evidence");
  assert(parsed.candidate?.version === evidence.candidate.version, "review bundle candidate version does not match evidence");
  assert(parsed.candidate?.commit === evidence.candidate.commit && parsed.candidate.commit === head, "review bundle candidate commit does not match clean HEAD");
  assert(parsed.candidate?.tarballSha256 === evidence.candidate.tarballSha256, "review bundle tarballSha256 does not match evidence");
  assert(parsed.manifestDigest === evidence.manifestDigest, "review bundle manifestDigest does not match evidence");
  assert(parsed.releaseReadinessInventoryDigest === evidence.releaseReadinessInventoryDigest, "review bundle release-readiness inventory digest does not match evidence");
  assert(Array.isArray(parsed.stateHistory), "review bundle requires stateHistory");
  assert(JSON.stringify(parsed.stateHistory) === JSON.stringify(evidence.roleIsolation.reviewSubjectStateHistory), "review bundle stateHistory does not match evidence review subject state");
  assert(validBundleConclusions(parsed, evidence.manualVerdicts), "review bundle five conclusions do not match candidate evidence");
  assert(parsed.reviewSubject && typeof parsed.reviewSubject === "object" && !Array.isArray(parsed.reviewSubject), "review bundle requires reviewSubject");
  const computedSubjectDigest = sha256(Buffer.from(JSON.stringify(parsed.reviewSubject), "utf8"));
  assert(parsed.reviewSubjectDigest === computedSubjectDigest, "review bundle reviewSubjectDigest does not match reviewSubject bytes");
  assert(parsed.reviewSubjectDigest === evidence.roleIsolation.reviewSubjectDigest, "review bundle reviewSubjectDigest does not match evidence");
  assert(parsed.reviewSubject?.candidateCommit === evidence.candidate.commit, "reviewSubject candidateCommit does not match evidence");
  assert(parsed.reviewSubject?.tarballSha256 === evidence.candidate.tarballSha256, "reviewSubject tarballSha256 does not match evidence");
  assert(parsed.reviewSubject?.manifestDigest === evidence.manifestDigest, "reviewSubject manifestDigest does not match evidence");
  assert(parsed.reviewSubject?.releaseReadinessInventoryDigest === evidence.releaseReadinessInventoryDigest, "reviewSubject release-readiness inventory digest does not match evidence");
  assert(JSON.stringify(parsed.reviewSubject?.manualVerdicts) === JSON.stringify(evidence.manualVerdicts), "reviewSubject manualVerdicts do not match evidence");
  assert(JSON.stringify(parsed.reviewSubject?.stateHistory) === JSON.stringify(evidence.roleIsolation.reviewSubjectStateHistory), "reviewSubject stateHistory does not match evidence review subject state");
  return { path: absolute, sha256: actualSha256, value: parsed };
}

function parseReviewBundle(bytes, absolute) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`invalid review bundle JSON (${absolute}): ${error.message}`);
  }
}

function validBundleConclusions(bundle, manualVerdicts) {
  if (JSON.stringify(bundle.fiveConclusions) === JSON.stringify(manualVerdicts)) return true;
  const assessment = bundle.writerAssessment;
  return CANDIDATE_EVIDENCE_CONTRACT.manualVerdictKeys.every((key) => assessment?.[key]?.verdict === manualVerdicts?.[key]);
}

function validateCandidateReportSection(version) {
  const reportPath = path.join(root, "docs", "qa", "release-grade-qa.md");
  const report = readFileSync(reportPath, "utf8").replace(/\r\n/g, "\n");
  const heading = `## v${version} candidate status`;
  const start = report.indexOf(heading);
  assert(start >= 0, `candidate report section is missing: ${heading}`);
  const next = report.indexOf("\n## v", start + heading.length);
  const section = report.slice(start, next >= 0 ? next : undefined);
  assert(!/\|\s*[^|\n]+\|\s*(?:yes|no)\s*\|\s*(?:pending|blocked)\s*\|/iu.test(section), "candidate report still contains pending or blocked current-trigger rows");
}

function isSha256(value, exactLength = null) {
  const lengths = exactLength ? [exactLength] : [40, 64];
  return typeof value === "string" && lengths.includes(value.length) && /^[a-f0-9]+$/i.test(value);
}

function validateEvidenceRecords(records) {
  assert(Array.isArray(records) && records.length > 0, "candidate evidence requires at least one evidence record");
  const claimIds = new Set(QA_ASSURANCE_MANIFEST.claims.filter((claim) => claim.layer === "full").map((claim) => claim.id));
  for (const record of records) {
    assert(record && typeof record === "object" && !Array.isArray(record), "candidate evidence record must be an object");
    assert(claimIds.has(record.claimId), `candidate evidence record has unknown full claimId: ${record.claimId}`);
    const contract = CANDIDATE_EVIDENCE_CONTRACT.records[record.claimId];
    assert(contract, `candidate evidence record has no manifest-owned contract: ${record.claimId}`);
    assert(contract.allowedPaths.includes(record.path), `candidate evidence record path is not allowed for ${record.claimId}: ${record.path}`);
    assert(typeof record.path === "string" && record.path && !path.isAbsolute(record.path), "candidate evidence record path must be repo-relative");
    const absolute = path.resolve(root, record.path);
    assert(isInside(root, absolute), `candidate evidence record escapes the source tree: ${record.path}`);
    assert(existsSync(absolute), `candidate evidence record path does not exist: ${record.path}`);
    assert(isSha256(record.sha256, 64), `candidate evidence record has invalid sha256: ${record.path}`);
    assert(sha256(readFileSync(absolute)) === record.sha256.toLowerCase(), `candidate evidence record hash does not match file bytes: ${record.path}`);
    assert(typeof record.readback === "string" && record.readback, `candidate evidence record lacks readback: ${record.path}`);
    assert(!/\|\s*[^|\n]+\|\s*(?:yes|no)\s*\|\s*(?:pending|blocked)\s*\|/iu.test(record.readback), `candidate evidence record readback contains pending or blocked status: ${record.claimId}`);
    for (const snippet of contract.requiredReadbackSnippets) {
      assert(record.readback.includes(snippet), `candidate evidence record readback for ${record.claimId} lacks required snippet: ${snippet}`);
    }
  }
}

async function freshCandidateTarballSha256() {
  if (evidenceContractSelfTest) return requiredSelfTestValue("AGENT_HANDOFF_KIT_QA_SELF_TEST_CANDIDATE_TARBALL_SHA256");
  const packDir = mkdtempSync(path.join(tmpdir(), "ahk-candidate-pack-"));
  try {
    const result = await runNpm(["pack", "--pack-destination", packDir, "--json"], "npm pack candidate");
    const parsed = JSON.parse(result.stdout);
    assert(Array.isArray(parsed) && parsed.length === 1, "npm pack candidate returned an unexpected response");
    const tarball = path.join(packDir, parsed[0].filename);
    assert(existsSync(tarball), "npm pack candidate did not create the expected tarball");
    return sha256(readFileSync(tarball));
  } finally {
    rmSync(packDir, { recursive: true, force: true });
  }
}

async function readNpmPublishedMetadata(version) {
  if (evidenceContractSelfTest) {
    const parsed = readSelfTestJson("AGENT_HANDOFF_KIT_QA_SELF_TEST_NPM_METADATA");
    assert(parsed.version === version, "self-test npm metadata version drifted");
    return parsed;
  }
  const result = await runNpm(["view", `@adamchanadam/agent-handoff-kit@${version}`, "version", "dist-tags.latest", "dist.tarball", "dist.shasum", "dist.integrity", "--json"], "npm published metadata");
  const parsed = JSON.parse(result.stdout);
  return {
    version: parsed.version,
    latest: parsed["dist-tags"]?.latest ?? parsed["dist-tags.latest"],
    tarball: parsed.dist?.tarball ?? parsed["dist.tarball"],
    shasum: parsed.dist?.shasum ?? parsed["dist.shasum"],
    integrity: parsed.dist?.integrity ?? parsed["dist.integrity"]
  };
}

async function packPublishedTarballSha256(version) {
  if (evidenceContractSelfTest) return requiredSelfTestValue("AGENT_HANDOFF_KIT_QA_SELF_TEST_PUBLISHED_TARBALL_SHA256");
  const packDir = mkdtempSync(path.join(tmpdir(), "ahk-published-pack-"));
  try {
    const result = await runNpm(["pack", `@adamchanadam/agent-handoff-kit@${version}`, "--pack-destination", packDir, "--json"], "npm pack published");
    const parsed = JSON.parse(result.stdout);
    assert(Array.isArray(parsed) && parsed.length === 1, "npm pack published returned an unexpected response");
    const tarball = path.join(packDir, parsed[0].filename);
    assert(existsSync(tarball), "npm pack published did not create the expected tarball");
    return sha256(readFileSync(tarball));
  } finally {
    rmSync(packDir, { recursive: true, force: true });
  }
}

async function readGithubRelease(version) {
  if (evidenceContractSelfTest) {
    const parsed = readSelfTestJson("AGENT_HANDOFF_KIT_QA_SELF_TEST_GITHUB_RELEASE");
    assert(parsed.tagName === `v${version}`, "self-test GitHub Release tag drifted");
    return parsed;
  }
  const result = await runCommand("gh", ["release", "view", `v${version}`, "--json", "tagName,url,targetCommitish,isDraft,isPrerelease"], "GitHub Release readback");
  return JSON.parse(result.stdout);
}

async function readRemoteTagCommit(version) {
  if (evidenceContractSelfTest) return requiredSelfTestValue("AGENT_HANDOFF_KIT_QA_SELF_TEST_GIT_TAG_COMMIT").toLowerCase();
  const result = await runCommand("git", ["ls-remote", "--tags", "origin", `v${version}`], "Git tag readback");
  const lines = result.stdout.trim().split(/\r?\n/u).filter(Boolean);
  const direct = lines.find((line) => line.endsWith(`refs/tags/v${version}`))?.split(/\s+/u)[0];
  const peeled = lines.find((line) => line.endsWith(`refs/tags/v${version}^{}`))?.split(/\s+/u)[0];
  const commit = peeled ?? direct;
  assert(isSha256(commit, 40), "Git tag readback did not return a commit");
  return commit.toLowerCase();
}

async function npxHelpSha256(version) {
  if (evidenceContractSelfTest) return requiredSelfTestValue("AGENT_HANDOFF_KIT_QA_SELF_TEST_NPX_HELP_SHA256");
  const cache = mkdtempSync(path.join(tmpdir(), "ahk-postpublish-npx-cache-"));
  const cwd = mkdtempSync(path.join(tmpdir(), "ahk-postpublish-npx-cwd-"));
  try {
    const result = await runNpx(["--cache", cache, "--yes", `@adamchanadam/agent-handoff-kit@${version}`, "--help"], "npx published help", cwd);
    const text = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    assert(text.includes(`v${version}`), "npx help readback does not contain the published version");
    return sha256(Buffer.from(text, "utf8"));
  } finally {
    rmSync(cache, { recursive: true, force: true });
    rmSync(cwd, { recursive: true, force: true });
  }
}

function runGit(args, label) {
  return runCommand("git", args, label);
}

function isStableSemver(version) {
  return typeof version === "string" && /^\d+\.\d+\.\d+$/.test(version);
}

function compareSemver(left, right) {
  const leftParts = left.split(".").map((part) => Number.parseInt(part, 10));
  const rightParts = right.split(".").map((part) => Number.parseInt(part, 10));
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] > rightParts[index]) return 1;
    if (leftParts[index] < rightParts[index]) return -1;
  }
  return 0;
}

function materializeVersionedPath(template, version) {
  return template.replace("${version}", version);
}

function readRepoText(relative) {
  const absolute = path.join(root, relative);
  assert(isInside(root, absolute), `repo path escaped root: ${relative}`);
  assert(existsSync(absolute), `required candidate surface is missing: ${relative}`);
  return readFileSync(absolute, "utf8");
}

function candidateGitStatus() {
  if (evidenceContractSelfTest) return { stdout: process.env.AGENT_HANDOFF_KIT_QA_SELF_TEST_GIT_STATUS ?? "" };
  return runGit(["status", "--porcelain"], "git status");
}

async function candidateGitHead() {
  return (await runGit(["rev-parse", "HEAD"], "git HEAD")).stdout.trim();
}

function runNpm(args, label) {
  const env = { ...process.env, NPM_CONFIG_UPDATE_NOTIFIER: "false" };
  if (process.env.npm_execpath) {
    return runCommand(process.execPath, [process.env.npm_execpath, ...args], label, { env });
  }
  if (process.platform === "win32") {
    return runCommand("npm.cmd", args, label, { env, shell: true });
  }
  return runCommand("npm", args, label, { env });
}

function runNpx(args, label, cwd) {
  const env = { ...process.env, NPM_CONFIG_UPDATE_NOTIFIER: "false" };
  const candidates = [
    process.env.npm_execpath ? path.join(path.dirname(process.env.npm_execpath), "npx-cli.js") : null,
    path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js")
  ].filter(Boolean);
  const npxCli = candidates.find((candidate) => existsSync(candidate));
  if (npxCli) return runCommand(process.execPath, [npxCli, ...args], label, { env, cwd });
  if (process.platform === "win32") return runCommand("npx.cmd", args, label, { env, cwd, shell: true });
  return runCommand("npx", args, label, { env, cwd });
}

function runCommand(command, args, label, options = {}) {
  return runChecked(command, args, label, {
    cwd: options.cwd ?? root,
    env: options.env ?? process.env,
    shell: options.shell ?? false,
    timeoutMs: options.timeoutMs ?? LONG_QA_TIMEOUT_MS
  });
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function requiredSelfTestValue(name) {
  const value = process.env[name];
  assert(typeof value === "string" && value, `${name} is required for QA evidence contract self-test`);
  return value;
}

function readSelfTestJson(name) {
  try {
    return JSON.parse(requiredSelfTestValue(name));
  } catch (error) {
    throw new Error(`${name} is invalid JSON: ${error.message}`);
  }
}

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function requireValue(args, index, flag) {
  const value = args[index];
  assert(value && !value.startsWith("--"), `${flag} requires a value`);
  return value;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
