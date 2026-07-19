import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultCatalogPath = path.join(__dirname, "migration-baselines", "official-origin-catalog.json");
const requiredArtifactBoundManagedSegments = Object.freeze([
  Object.freeze({ version: "0.3.38", targetRel: "AGENTS.md" }),
  Object.freeze({ version: "0.3.41", targetRel: "AGENTS.md" })
]);

export const OFFICIAL_ORIGIN_CATALOG_SCHEMA = 1;

export async function loadOfficialOriginCatalog(catalogPath = defaultCatalogPath) {
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  validateOfficialOriginCatalog(catalog);
  return catalog;
}

export function validateOfficialOriginCatalog(catalog) {
  assertCatalogShape(catalog);
  const digestCopy = { ...catalog };
  delete digestCopy.catalogDigestSha256;
  const expectedDigest = sha256(`${JSON.stringify(digestCopy)}\n`);
  if (catalog.catalogDigestSha256 !== expectedDigest) throw new Error("official origin catalog integrity digest mismatch");

  const targets = catalog.installedTargets.map((item) => item.targetRel);
  const referenced = new Set();
  for (const [version, release] of Object.entries(catalog.releases)) {
    if (JSON.stringify(Object.keys(release.manifest)) !== JSON.stringify(targets)) {
      throw new Error(`official origin catalog manifest coverage mismatch: ${version}`);
    }
    for (const [targetRel, entry] of Object.entries(release.manifest)) {
      if (entry.state === "absent") continue;
      if (entry.state !== "present" || !/^[0-9a-f]{64}$/.test(entry.rawSha256) || !/^[0-9a-f]{64}$/.test(entry.normalizedSha256)) {
        throw new Error(`official origin catalog manifest entry invalid: ${version} ${targetRel}`);
      }
      const content = catalog.contents[entry.contentId];
      if (!content || content.targetRel !== targetRel) {
        throw new Error(`official origin catalog content target mismatch: ${version} ${targetRel}`);
      }
      if (entry.canonicalSha256 !== content.canonicalSha256) {
        throw new Error(`official origin catalog canonical hash mismatch: ${version} ${targetRel}`);
      }
      referenced.add(entry.contentId);
    }
    for (const targetRel of Object.keys(release.managedSegments ?? {})) {
      getArtifactBoundManagedSegment({ version, targetRel, catalog });
    }
  }
  for (const required of requiredArtifactBoundManagedSegments) {
    if (!getArtifactBoundManagedSegment({ ...required, catalog })) {
      throw new Error(`official origin catalog missing required managed segment: ${required.version} ${required.targetRel}`);
    }
  }

  for (const [contentId, content] of Object.entries(catalog.contents)) {
    if (contentId !== sha256(`${content.targetRel}\0${content.text}`)) {
      throw new Error(`official origin catalog content ID mismatch: ${contentId}`);
    }
    if (content.canonicalSha256 !== sha256(canonicalizeOfficialText(content.targetRel, content.text))) {
      throw new Error(`official origin catalog content hash mismatch: ${contentId}`);
    }
    if (!referenced.has(contentId)) throw new Error(`official origin catalog has orphan content: ${contentId}`);
  }
  return true;
}

export function identifyOfficialOrigin({ targetRel, text, bytes = null, catalog }) {
  assertCatalogShape(catalog);
  const sourceText = String(text);
  const rawBytes = bytes == null ? Buffer.from(sourceText, "utf8") : Buffer.from(bytes);
  const rawSha256 = createHash("sha256").update(rawBytes).digest("hex");
  const normalizedSha256 = sha256(normalizeNewlines(sourceText));
  const canonicalSha256 = sha256(canonicalizeOfficialText(targetRel, sourceText));
  const rawExactVersions = [];
  const exactVersions = [];
  const canonicalVersions = [];

  for (const [version, release] of Object.entries(catalog.releases)) {
    const entry = release.manifest[targetRel];
    if (!entry || entry.state !== "present") continue;
    if (entry.rawSha256 === rawSha256) rawExactVersions.push(version);
    if (entry.normalizedSha256 === normalizedSha256) exactVersions.push(version);
    else if (entry.canonicalSha256 === canonicalSha256) canonicalVersions.push(version);
  }

  return {
    targetRel,
    rawSha256,
    rawExact: rawExactVersions.length > 0,
    rawExactVersions,
    normalizedSha256,
    canonicalSha256,
    exact: exactVersions.length > 0,
    exactVersions,
    canonicalVersions
  };
}

export function getOfficialBaseline({ version, targetRel, catalog, root = null }) {
  assertCatalogShape(catalog);
  const release = catalog.releases[stripVersionPrefix(version)];
  if (!release) return null;
  const entry = release.manifest[targetRel];
  if (!entry) return null;
  if (entry.state === "absent") return { state: "absent", version: stripVersionPrefix(version), targetRel };
  const content = catalog.contents[entry.contentId];
  if (!content || content.targetRel !== targetRel) {
    throw new Error(`official origin catalog content mismatch: ${version} ${targetRel}`);
  }
  return {
    state: "present",
    version: stripVersionPrefix(version),
    targetRel,
    text: materializeOfficialText(targetRel, content.text, { version: stripVersionPrefix(version), root }),
    normalizedSha256: entry.normalizedSha256,
    canonicalSha256: entry.canonicalSha256
  };
}

// A managed segment is deliberately narrower than a whole-file catalog
// identity. It exists only when the release is tied to an npm artifact and
// its raw source plus transformed core bytes are recorded in this catalog.
// Markers, filenames, headings, and language never grant this authority.
export function getArtifactBoundManagedSegment({ version, targetRel, catalog }) {
  assertCatalogShape(catalog);
  const normalizedVersion = stripVersionPrefix(version);
  const release = catalog.releases[normalizedVersion];
  const segment = release?.managedSegments?.[targetRel];
  if (!segment) return null;
  const npm = release.source?.npm;
  if (!npm || typeof npm.spec !== "string" || !/^[a-f0-9]{40}$/.test(npm.shasum)
    || typeof npm.integrity !== "string" || !npm.integrity.startsWith("sha512-")) {
    throw new Error(`official origin catalog managed segment has no artifact identity: ${normalizedVersion} ${targetRel}`);
  }
  if (!segment || typeof segment !== "object" || Array.isArray(segment)
    || segment.sourceRel !== "runtime-core/AGENTS.core.md"
    || segment.transform?.kind !== "utf8-trim-wrapped-managed-core"
    || typeof segment.transform.beginMarker !== "string" || !segment.transform.beginMarker
    || typeof segment.transform.endMarker !== "string" || !segment.transform.endMarker
    || !validSegmentByteIdentity(segment.artifactSource)
    || !validSegmentByteIdentity(segment.transform.core)) {
    throw new Error(`official origin catalog managed segment is invalid: ${normalizedVersion} ${targetRel}`);
  }
  return Object.freeze({
    version: normalizedVersion,
    targetRel,
    sourceRel: segment.sourceRel,
    artifact: Object.freeze({ spec: npm.spec, shasum: npm.shasum, integrity: npm.integrity }),
    artifactSource: Object.freeze({ ...segment.artifactSource }),
    transform: Object.freeze({
      kind: segment.transform.kind,
      beginMarker: segment.transform.beginMarker,
      endMarker: segment.transform.endMarker,
      core: Object.freeze({ ...segment.transform.core })
    })
  });
}

export function normalizeNewlines(text) {
  return String(text).replace(/\r\n?/g, "\n");
}

export function canonicalizeOfficialText(targetRel, text) {
  let normalized = normalizeNewlines(text);
  if (targetRel === "dev/PROJECT_INDEX.md") {
    normalized = normalized.replace(
      /^(\|\s*Agent Handoff Kit template version\s*\|)\s*[^|\n]+?(\s*\|.*)$/m,
      "$1 <VERSION>$2"
    );
  }
  if (targetRel === "START_NEXT_SESSION_PROMPT.txt") {
    normalized = canonicalizeOpeningRootLine(normalized);
  }
  if (targetRel === "dev/SESSION_HANDOFF.md") {
    normalized = canonicalizeHandoffOpeningRoot(normalized);
  }
  return normalized;
}

export function materializeOfficialText(targetRel, text, { version = null, root = null } = {}) {
  let materialized = normalizeNewlines(text);
  if (targetRel === "dev/PROJECT_INDEX.md" && version) {
    materialized = materialized.replace(
      /^(\|\s*Agent Handoff Kit template version\s*\|)\s*<VERSION>(\s*\|.*)$/m,
      `$1 ${stripVersionPrefix(version)}$2`
    );
  }
  if (root && targetRel === "START_NEXT_SESSION_PROMPT.txt") {
    materialized = materializeOpeningRootLine(materialized, root);
  }
  if (root && targetRel === "dev/SESSION_HANDOFF.md") {
    materialized = materializeHandoffOpeningRoot(materialized, root);
  }
  return materialized;
}

export function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function canonicalizeOpeningRootLine(text) {
  return text.replace(/^(Work in )[^\n]+?(\.(?: Read AGENTS\.md, then dev\/SESSION_HANDOFF\.md\.)?)$/m, "$1<ROOT>$2");
}

function canonicalizeHandoffOpeningRoot(text) {
  const marker = "<!-- ack:section:next-session-opening-message -->";
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) return text;
  const fenceStart = text.indexOf("```text\n", markerIndex);
  if (fenceStart < 0) return text;
  const contentStart = fenceStart + "```text\n".length;
  const fenceEnd = text.indexOf("\n```", contentStart);
  if (fenceEnd < 0) return text;
  const before = text.slice(0, contentStart);
  const opening = canonicalizeOpeningRootLine(text.slice(contentStart, fenceEnd));
  return `${before}${opening}${text.slice(fenceEnd)}`;
}

function materializeOpeningRootLine(text, root) {
  return text.replace(/^(Work in )<ROOT>(\.(?: Read AGENTS\.md, then dev\/SESSION_HANDOFF\.md\.)?)$/m, `$1${root}$2`);
}

function materializeHandoffOpeningRoot(text, root) {
  const marker = "<!-- ack:section:next-session-opening-message -->";
  const markerIndex = text.indexOf(marker);
  if (markerIndex < 0) return text;
  const fenceStart = text.indexOf("```text\n", markerIndex);
  if (fenceStart < 0) return text;
  const contentStart = fenceStart + "```text\n".length;
  const fenceEnd = text.indexOf("\n```", contentStart);
  if (fenceEnd < 0) return text;
  const before = text.slice(0, contentStart);
  const opening = materializeOpeningRootLine(text.slice(contentStart, fenceEnd), root);
  return `${before}${opening}${text.slice(fenceEnd)}`;
}

function stripVersionPrefix(version) {
  return String(version ?? "").replace(/^v/, "");
}

function validSegmentByteIdentity(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)
    && /^[a-f0-9]{64}$/.test(value.sha256)
    && Number.isInteger(value.bytes) && value.bytes >= 0);
}

function assertCatalogShape(catalog) {
  if (!catalog || catalog.schemaVersion !== OFFICIAL_ORIGIN_CATALOG_SCHEMA) {
    throw new Error(`unsupported official origin catalog schema: ${catalog?.schemaVersion ?? "missing"}`);
  }
  if (!catalog.releases || !catalog.contents || !Array.isArray(catalog.installedTargets)) {
    throw new Error("official origin catalog is incomplete");
  }
}
