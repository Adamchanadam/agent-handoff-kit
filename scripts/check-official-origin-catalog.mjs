#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { installedFileContracts } from "../bin/installed-file-contract.mjs";
import {
  OFFICIAL_ORIGIN_CATALOG_SCHEMA,
  canonicalizeOfficialText,
  getOfficialBaseline,
  identifyOfficialOrigin,
  loadOfficialOriginCatalog,
  normalizeNewlines,
  sha256,
  validateOfficialOriginCatalog
} from "../bin/official-origin-catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const fixturesDir = path.join(root, "test-fixtures");
const catalogPath = path.join(root, "bin", "migration-baselines", "official-origin-catalog.json");
const retainedFixtureFiles = new Set(["AGENTS.md", "dev/PROJECT_INDEX.md"]);
const credentialValuePatterns = [
  /sk-ant-[A-Za-z0-9_-]{20,}/,
  /\bsk-[A-Za-z0-9_-]{20,}/,
  /\bntn_[A-Za-z0-9_-]{40,}/,
  /\bsecret_[A-Za-z0-9_-]{40,}/,
  /\bya29\.[A-Za-z0-9_-]{20,}/,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/,
  /\b(?:ghp|gho|ghs)_[A-Za-z0-9]{36}/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}/,
  /\bAKIA[A-Z0-9]{16}/,
  /\bAIza[A-Za-z0-9_-]{35}/
];

const catalog = await loadOfficialOriginCatalog(catalogPath);
const packageVersion = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version;
// Source work can begin after publication, before the next version bump.
// The generator's npm / remote-tag / Release cross-check owns publication proof.
const allowedPublishedTips = new Set([previousPatch(packageVersion), packageVersion]);
assert(catalog.schemaVersion === OFFICIAL_ORIGIN_CATALOG_SCHEMA, "catalog schema mismatch");
assert(catalog.packageName === "@adamchanadam/agent-handoff-kit", "catalog package name mismatch");

const expectedTargets = installedFileContracts.map(({ targetRel, strategy }) => ({ targetRel, strategy }));
assert(JSON.stringify(catalog.installedTargets) === JSON.stringify(expectedTargets), "installed target contract drifted");

const versions = Object.keys(catalog.releases);
assert(versions.length >= 55, `expected at least 55 formal releases, found ${versions.length}`);
assert(versions[0] === "0.1.0" && allowedPublishedTips.has(versions.at(-1)), `formal release range must end at the published current version or its preceding patch: v${packageVersion}`);

let presentCount = 0;
let absentCount = 0;
for (const version of versions) {
  const release = catalog.releases[version];
  assert(release.source.npm.spec === `${catalog.packageName}@${version}`, `${version}: npm source mismatch`);
  assert(release.source.git.tag === `v${version}`, `${version}: Git tag mismatch`);
  assert(release.source.githubRelease.tag === `v${version}`, `${version}: GitHub Release tag mismatch`);
  assert(/^[0-9a-f]{40}$/.test(release.source.git.commit), `${version}: invalid remote tag commit`);
  assert(/^[0-9a-f]{40}$/.test(release.source.git.directObject), `${version}: invalid remote tag object`);
  assert(release.source.git.peeledCommit === null || /^[0-9a-f]{40}$/.test(release.source.git.peeledCommit), `${version}: invalid peeled tag commit`);
  assert(/^sha512-/.test(release.source.npm.integrity), `${version}: invalid npm integrity`);
  const expectedDivergence = !release.source.npm.gitHead
    ? "npm-gitHead-unavailable"
    : release.source.npm.gitHead === release.source.git.commit
      ? "same-commit"
      : "different-commit";
  assert(release.source.sourceDivergence.status === expectedDivergence, `${version}: source divergence status mismatch`);
  assert(release.source.sourceDivergence.npmGitHead === release.source.npm.gitHead, `${version}: divergence npm gitHead mismatch`);
  assert(release.source.sourceDivergence.remoteTagCommit === release.source.git.commit, `${version}: divergence tag commit mismatch`);

  const manifestKeys = Object.keys(release.manifest);
  assert(JSON.stringify(manifestKeys) === JSON.stringify(installedFileContracts.map((item) => item.targetRel)), `${version}: manifest target order/coverage mismatch`);

  const fixtureRoot = path.join(fixturesDir, `v${version}`);
  const fixtureManifestPath = path.join(fixtureRoot, "fixture-manifest.json");
  assert(existsSync(fixtureManifestPath), `${version}: fixture manifest missing`);
  const fixtureManifest = JSON.parse(readFileSync(fixtureManifestPath, "utf8"));
  assert(fixtureManifest.version === version, `${version}: fixture version mismatch`);
  assert(JSON.stringify(fixtureManifest.source) === JSON.stringify(release.source), `${version}: fixture source metadata drifted`);
  assert(JSON.stringify(fixtureManifest.installedTargets) === JSON.stringify(release.manifest), `${version}: fixture/catalog manifests drifted`);

  for (const { targetRel } of installedFileContracts) {
    const entry = release.manifest[targetRel];
    const fixturePath = path.join(fixtureRoot, targetRel);
    if (entry.state === "absent") {
      absentCount += 1;
      assert(!existsSync(fixturePath), `${version}: absent target exists: ${targetRel}`);
      const baseline = getOfficialBaseline({ version, targetRel, catalog });
      assert(baseline?.state === "absent", `${version}: absent baseline lookup failed: ${targetRel}`);
      continue;
    }

    presentCount += 1;
    assert(entry.state === "present", `${version}: invalid state for ${targetRel}`);
    const content = catalog.contents[entry.contentId];
    assert(content?.targetRel === targetRel, `${version}: missing deduplicated content: ${targetRel}`);
    assert(sha256(content.text) === entry.canonicalSha256, `${version}: canonical content hash mismatch: ${targetRel}`);
    assert(canonicalizeOfficialText(targetRel, content.text) === content.text, `${version}: catalog content is not canonical: ${targetRel}`);
    assert(/^[0-9a-f]{64}$/.test(entry.rawSha256), `${version}: invalid raw hash: ${targetRel}`);
    let identifiedText = content.text;
    if (retainedFixtureFiles.has(targetRel)) {
      assert(existsSync(fixturePath), `${version}: retained fixture missing: ${targetRel}`);
      const raw = readFileSync(fixturePath);
      assert(createHash("sha256").update(raw).digest("hex") === entry.rawSha256, `${version}: retained raw hash mismatch: ${targetRel}`);
      assert(sha256(normalizeNewlines(raw.toString("utf8"))) === entry.normalizedSha256, `${version}: retained normalized hash mismatch: ${targetRel}`);
      assert(canonicalizeOfficialText(targetRel, raw.toString("utf8")) === content.text, `${version}: retained fixture/catalog canonical content drifted: ${targetRel}`);
      identifiedText = raw.toString("utf8");
    } else {
      assert(!existsSync(fixturePath), `${version}: duplicate full fixture blob should be catalog-only: ${targetRel}`);
    }
    const identified = identifyOfficialOrigin({ targetRel, text: identifiedText, catalog });
    assert(
      (identified.exact && identified.exactVersions.includes(version)) || identified.canonicalVersions.includes(version),
      `${version}: official identification failed: ${targetRel}`
    );
    const baseline = getOfficialBaseline({ version: `v${version}`, targetRel, catalog, root: fixtureRoot });
    assert(baseline?.state === "present", `${version}: baseline lookup failed: ${targetRel}`);
    assert(canonicalizeOfficialText(targetRel, baseline.text) === content.text, `${version}: materialized baseline drifted: ${targetRel}`);
  }
}

for (const [contentId, content] of Object.entries(catalog.contents)) {
  assert(contentId === sha256(`${content.targetRel}\0${content.text}`), `content ID mismatch: ${contentId}`);
  assert(content.canonicalSha256 === sha256(canonicalizeOfficialText(content.targetRel, content.text)), `content canonical hash mismatch: ${contentId}`);
  assert(!credentialValuePatterns.some((pattern) => pattern.test(content.text)), `catalog contains a high-confidence credential value: ${content.targetRel}`);
}

const digestCopy = { ...catalog };
delete digestCopy.catalogDigestSha256;
assert(catalog.catalogDigestSha256 === sha256(`${JSON.stringify(digestCopy)}\n`), "catalog integrity digest mismatch");

checkCanonicalizationBoundaries();
checkRequiredManagedSegmentInvariant();
assert(catalog.releases["0.3.35"].source.sourceDivergence.status === "different-commit", "v0.3.35 npm/tag divergence was not recorded");
assert(catalog.releases["0.3.38"].source.sourceDivergence.status === "different-commit", "v0.3.38 npm/tag divergence was not recorded");
assert(catalog.releases["0.3.35"].source.npm.shasum === "c299f48882d358be3dfbb2461d04cacc5f0a5fdb", "v0.3.35 npm shasum drifted");
assert(catalog.releases["0.3.35"].source.npm.integrity === "sha512-9Kg6dmc7OLqa/e8wWiagiXjxxoLPGed14gvrTv2pbnFDtUEmzmGWsi+PgSf8aUwB4PnFQh+mCwT2U8yzIrBscw==", "v0.3.35 npm integrity drifted");
assert(catalog.releases["0.3.38"].source.npm.shasum === "48236321bd3ff28dfbd58f453bb1380ba1a8fb91", "v0.3.38 npm shasum drifted");
assert(catalog.releases["0.3.38"].source.npm.integrity === "sha512-ZVfmT+zXBpm5L8uDbkpf5foYA6PgqxVn5AEVi3lfjaOyzxwdUih8aVDAdtRJ1PNXs/8DBi5O2O1d3rSfMPocdQ==", "v0.3.38 npm integrity drifted");
assert(catalog.releases["0.3.41"].source.npm.shasum === "8b9238287485ef15208c4c339e8cdfe283ce1c23", "v0.3.41 npm shasum drifted");
assert(catalog.releases["0.3.41"].source.npm.integrity === "sha512-2DQjMXhLigpW30vE0bb1aa7F5h1YYW5kXSfruzwg6IltyclvV9EBYPLUTOj49p6QIwmPWcetvJIB8zK0LZFH5Q==", "v0.3.41 npm integrity drifted");
assert(catalog.releases["0.3.45"].source.npm.shasum === "5ef03d41180676344c3c14872a4a86ccdef5e7bd", "v0.3.45 npm shasum drifted");
assert(catalog.releases["0.3.45"].source.npm.integrity === "sha512-eEUi3maroqLlnSHcrBJyJ5P1a27iDcr6ATYVOKSbx8gW/1fvuJWdvBzB+HU0ri6PlvFhJCvb2eea67iFjyd4Zg==", "v0.3.45 npm integrity drifted");

console.log(`ok: official origin catalog schema/integrity (${versions.length} releases, ${Object.keys(catalog.contents).length} deduplicated contents)`);
console.log(`ok: complete installed manifests (${presentCount} present, ${absentCount} absent)`);

function checkCanonicalizationBoundaries() {
  const indexA = "| Agent Handoff Kit template version | 0.3.35 | package prototype |\nUnrelated 0.3.35";
  const indexB = "| Agent Handoff Kit template version | 0.3.38 | package prototype |\nUnrelated 0.3.35";
  assert(canonicalizeOfficialText("dev/PROJECT_INDEX.md", indexA) === canonicalizeOfficialText("dev/PROJECT_INDEX.md", indexB), "PROJECT_INDEX version row was not structurally normalized");
  assert(canonicalizeOfficialText("dev/PROJECT_INDEX.md", indexA).includes("Unrelated 0.3.35"), "PROJECT_INDEX canonicalizer replaced unrelated version text");

  const prompt = "Work in C:\\project. Read AGENTS.md, then dev/SESSION_HANDOFF.md.\nKeep C:\\project here.";
  const promptCanonical = canonicalizeOfficialText("START_NEXT_SESSION_PROMPT.txt", prompt);
  assert(promptCanonical.startsWith("Work in <ROOT>. Read"), "opening root was not normalized");
  assert(promptCanonical.endsWith("Keep C:\\project here."), "opening root canonicalizer replaced unrelated path text");

  const handoff = [
    "Work in C:\\outside. Read AGENTS.md, then dev/SESSION_HANDOFF.md.",
    "<!-- ack:section:next-session-opening-message -->",
    "## Next Session Opening Message",
    "```text",
    "Work in C:\\inside. Read AGENTS.md, then dev/SESSION_HANDOFF.md.",
    "```"
  ].join("\n");
  const handoffCanonical = canonicalizeOfficialText("dev/SESSION_HANDOFF.md", handoff);
  assert(handoffCanonical.includes("Work in C:\\outside."), "handoff canonicalizer changed content outside the authoritative opening block");
  assert(handoffCanonical.includes("Work in <ROOT>. Read AGENTS.md"), "handoff authoritative opening root was not normalized");
}

function checkRequiredManagedSegmentInvariant() {
  for (const version of ["0.3.38", "0.3.41"]) {
    assert(catalog.releases[version].managedSegments?.["AGENTS.md"], `${version}: AGENTS.md managed segment missing`);
    const mutated = JSON.parse(JSON.stringify(catalog));
    delete mutated.releases[version].managedSegments;
    const digestCopy = { ...mutated };
    delete digestCopy.catalogDigestSha256;
    mutated.catalogDigestSha256 = sha256(`${JSON.stringify(digestCopy)}\n`);
    assertThrows(
      () => validateOfficialOriginCatalog(mutated),
      `${version}: catalog validator accepted missing required AGENTS.md managed segment`
    );
  }
}

function previousPatch(version) {
  const parts = version.split(".").map(Number);
  assert(parts.length === 3 && parts.every(Number.isInteger) && parts[2] > 0, `cannot derive previous patch from ${version}`);
  parts[2] -= 1;
  return parts.join(".");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertThrows(fn, message) {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(message);
}
