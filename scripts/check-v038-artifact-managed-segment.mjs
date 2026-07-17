#!/usr/bin/env node

// Narrow regression evidence for the only legacy mixed AGENTS segment that
// v0.3.42 may replace. It recomputes the old core identity from the pinned
// npm tarball; it does not infer ownership from a marker, heading, language,
// pathname, or the current filesystem.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getArtifactBoundManagedSegment, loadOfficialOriginCatalog } from "../bin/official-origin-catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactPath = process.env.AGENT_HANDOFF_KIT_R034_V038_TGZ
  || (process.platform === "win32"
    ? "C:\\temp\\adamchanadam-agent-handoff-kit-0.3.38.tgz"
    : "/tmp/adamchanadam-agent-handoff-kit-0.3.38.tgz");

if (!existsSync(artifactPath)) throw new Error(`pinned v0.3.38 artifact is missing: ${artifactPath}`);
const catalog = await loadOfficialOriginCatalog();
const segment = getArtifactBoundManagedSegment({ version: "0.3.38", targetRel: "AGENTS.md", catalog });
if (!segment) throw new Error("catalog has no v0.3.38 artifact-bound AGENTS managed segment");

const artifact = readFileSync(artifactPath);
const integrity = `sha512-${createHash("sha512").update(artifact).digest("base64")}`;
if (integrity !== segment.artifact.integrity) throw new Error("pinned v0.3.38 artifact integrity differs from the catalog");
const shasum = createHash("sha1").update(artifact).digest("hex");
if (shasum !== segment.artifact.shasum) throw new Error("pinned v0.3.38 artifact shasum differs from the catalog");

const source = gzipTarFile(artifact, `package/${segment.sourceRel}`);
if (!source) throw new Error(`pinned artifact lacks ${segment.sourceRel}`);
assertIdentity(source, segment.artifactSource, "artifact source");
const transformed = Buffer.from(source.toString("utf8").trim(), "utf8");
assertIdentity(transformed, segment.transform.core, "managed core transform");

console.log("ok: v0.3.38 artifact identity, exact managed-core identity, and transform witness match the sealed catalog");

function gzipTarFile(gzipBytes, wantedPath) {
  const archive = gunzipSync(gzipBytes);
  for (let offset = 0; offset + 512 <= archive.length;) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((value) => value === 0)) return null;
    const name = tarText(header.subarray(0, 100));
    const prefix = tarText(header.subarray(345, 500));
    const relative = prefix ? `${prefix}/${name}` : name;
    const sizeText = tarText(header.subarray(124, 136)).trim();
    const size = sizeText ? Number.parseInt(sizeText, 8) : 0;
    if (!Number.isSafeInteger(size) || size < 0) throw new Error(`invalid tar size for ${relative}`);
    const dataStart = offset + 512;
    const dataEnd = dataStart + size;
    if (dataEnd > archive.length) throw new Error(`truncated tar entry: ${relative}`);
    if ((header[156] === 0 || header[156] === 48) && relative === wantedPath) return Buffer.from(archive.subarray(dataStart, dataEnd));
    offset = dataStart + Math.ceil(size / 512) * 512;
  }
  return null;
}

function tarText(bytes) {
  const end = bytes.indexOf(0);
  return bytes.subarray(0, end < 0 ? bytes.length : end).toString("utf8");
}

function assertIdentity(bytes, expected, label) {
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== expected.sha256 || bytes.length !== expected.bytes) {
    throw new Error(`${label} differs from the catalog witness`);
  }
}
