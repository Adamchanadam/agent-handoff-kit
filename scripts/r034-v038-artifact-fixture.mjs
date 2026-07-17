// Gate 5 QA input helper. It never participates in installation or upgrade
// decisions. It derives every installed fresh-init byte directly from the
// integrity-pinned published v0.3.38 tarball, then uses the old isolated
// artifact-init fixture only as corroborating evidence of that derivation.
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir as systemTmpdir } from "node:os";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import { installedFileContracts } from "../bin/installed-file-contract.mjs";
import { loadOfficialOriginCatalog } from "../bin/official-origin-catalog.mjs";

export const V038_NPM_SPEC = "@adamchanadam/agent-handoff-kit@0.3.38";

export async function materializeVerifiedV038ArtifactFixture({ project, fixtureRoot = defaultFixtureRoot(), artifactPath = defaultArtifactPath(), catalog = null } = {}) {
  if (!project || !existsSync(project)) throw new Error("v0.3.38 artifact fixture requires an existing empty destination project path");
  if (!fixtureRoot || !existsSync(fixtureRoot)) {
    throw new Error("v0.3.38 artifact-init fixture is missing; set AGENT_HANDOFF_KIT_R034_V038_FIXTURE to an existing verified isolated fresh-init fixture");
  }
  const sourceCatalog = catalog ?? await loadOfficialOriginCatalog();
  const verified = verifyArtifactFixture({ fixtureRoot, artifactPath, catalog: sourceCatalog });
  // Never clone the prior fixture into a new test root: every target below is
  // reconstructed from the pinned artifact and the published init transforms.
  const artifactBytes = readFileSync(artifactPath);
  for (const contract of v038InstalledContracts(artifactBytes)) {
    const expected = expectedV038InitBytes({ artifactBytes, contract, targetRel: contract.targetRel, root: path.resolve(project), version: "0.3.38" });
    mkdirSync(path.dirname(path.join(project, contract.targetRel)), { recursive: true });
    writeFileSync(path.join(project, contract.targetRel), expected);
  }
  // A fresh init also leaves its generated migration report. It is not a
  // package-owned template: preserve the existing verified artifact-init
  // witness as historical transaction state, with its own explicit identity.
  const historical = verified.initialTransactionWitness;
  mkdirSync(path.dirname(path.join(project, historical.sourcePath)), { recursive: true });
  writeFileSync(path.join(project, historical.sourcePath), historical.bytes);
  return verified;
}

export function verifyArtifactFixture({ fixtureRoot, artifactPath = defaultArtifactPath(), catalog }) {
  const release = catalog?.releases?.["0.3.38"];
  if (!release?.source?.npm?.integrity) {
    throw new Error("official catalog has no v0.3.38 npm artifact identity");
  }
  if (!existsSync(artifactPath)) throw new Error(`v0.3.38 artifact is missing: ${artifactPath}`);
  const artifactBytes = readFileSync(artifactPath);
  const actualIntegrity = `sha512-${createHash("sha512").update(artifactBytes).digest("base64")}`;
  if (actualIntegrity !== release.source.npm.integrity) {
    throw new Error(`v0.3.38 artifact integrity mismatch: expected ${release.source.npm.integrity}, got ${actualIntegrity}`);
  }
  const resolvedFixtureRoot = path.resolve(fixtureRoot);
  const freshInitOutputs = [];
  const contracts = v038InstalledContracts(artifactBytes);
  for (const contract of contracts) {
    const targetPath = path.join(fixtureRoot, contract.targetRel);
    if (!existsSync(targetPath)) throw new Error(`v0.3.38 artifact-init fixture omitted contract target ${contract.targetRel}`);
    const bytes = readFileSync(targetPath);
    const expected = expectedV038InitBytes({ artifactBytes, contract, targetRel: contract.targetRel, root: resolvedFixtureRoot, version: "0.3.38" });
    if (!bytes.equals(expected)) {
      throw new Error(`v0.3.38 artifact-init derivation mismatch for ${contract.targetRel}: existing fixture is not the pinned artifact's exact fresh-init output`);
    }
    freshInitOutputs.push(Object.freeze({
      targetRel: contract.targetRel,
      sourceRel: contract.sourceRel,
      sha256: sha256(expected),
      bytes: bytes.length,
      identity: "exact-fresh-init-artifact-output",
      transform: v038InitTransform(contract.targetRel)
    }));
  }
  if (freshInitOutputs.length !== contracts.length || freshInitOutputs.length === 0) throw new Error("v0.3.38 fixture fresh-init derivation coverage mismatch");
  const initialTransactionWitness = verifyInitialTransactionWitness({ fixtureRoot: resolvedFixtureRoot, contracts });
  return Object.freeze({
    package: V038_NPM_SPEC,
    integrity: actualIntegrity,
    fixtureRoot,
    freshInitOutputs: Object.freeze(freshInitOutputs),
    freshInitOutputDigest: sha256(Buffer.from(`${JSON.stringify(freshInitOutputs)}\n`, "utf8")),
    initialTransactionWitness
  });
}

function verifyInitialTransactionWitness({ fixtureRoot, contracts }) {
  const root = path.join(fixtureRoot, "dev", "governance_migrations");
  const reports = collectRegularFiles(root)
    .filter((relative) => relative.endsWith("/migration-report.md") || relative === "migration-report.md");
  if (reports.length !== 1) throw new Error("v0.3.38 artifact-init fixture must contain exactly one generated migration report witness");
  const nested = reports[0];
  const absolute = path.join(root, nested);
  const bytes = readFileSync(absolute);
  const text = bytes.toString("utf8");
  const createdMatch = /\r?\n## Created\r?\n([\s\S]*?)\r?\n## Merged\r?\n/.exec(text);
  const created = createdMatch ? createdMatch[1].split(/\r?\n/).filter(Boolean).map((line) => /^- (.+)$/.exec(line)?.[1] ?? null) : null;
  const expected = contracts.map((contract) => contract.targetRel);
  if (!text.startsWith("# Agent Handoff Kit Migration Report\n\nCommand: init\nMode: first-install\n")
    || !text.includes(`Root: ${fixtureRoot}\n`)
    || !/^Created: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/m.test(text)
    || JSON.stringify(created) !== JSON.stringify(expected)) {
    throw new Error("v0.3.38 artifact-init migration report does not witness the pinned artifact's complete fresh-init transform");
  }
  return Object.freeze({
    sourcePath: `dev/governance_migrations/${nested.replaceAll("\\", "/")}`,
    sha256: sha256(bytes),
    bytes: Buffer.from(bytes),
    byteLength: bytes.length,
    identity: "artifact-init-generated-historical-transaction-witness"
  });
}

function collectRegularFiles(root, relative = "") {
  const absolute = relative ? path.join(root, relative) : root;
  if (!existsSync(absolute)) throw new Error("v0.3.38 artifact-init fixture omitted its migration-report witness");
  const files = [];
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
    const child = path.join(root, childRelative);
    const metadata = lstatSync(child);
    if (metadata.isSymbolicLink()) throw new Error(`v0.3.38 artifact-init witness contains a symlink: ${child}`);
    if (metadata.isDirectory()) files.push(...collectRegularFiles(root, childRelative));
    else if (metadata.isFile()) files.push(childRelative);
    else throw new Error(`v0.3.38 artifact-init witness contains an unsupported entry: ${child}`);
  }
  return files;
}

function v038InstalledContracts(artifactBytes) {
  // The current contract intentionally keeps later additions such as
  // closeout.md. Historical fixture identity must use what the pinned old
  // artifact actually shipped, not what a newer path list happens to contain.
  return installedFileContracts.filter((contract) => Boolean(gzipTarFile(artifactBytes, `package/${contract.sourceRel}`)));
}

function defaultFixtureRoot() {
  return process.env.AGENT_HANDOFF_KIT_R034_V038_FIXTURE
    || (process.platform === "win32"
      ? "C:\\tmp\\ack-r034-v038-artifact-init-probe"
      : path.join(systemTmpdir(), "ack-r034-v038-artifact-init-probe"));
}

function defaultArtifactPath() {
  return process.env.AGENT_HANDOFF_KIT_R034_V038_TGZ
    || (process.platform === "win32"
      ? "C:\\temp\\adamchanadam-agent-handoff-kit-0.3.38.tgz"
      : path.join(systemTmpdir(), "adamchanadam-agent-handoff-kit-0.3.38.tgz"));
}

function expectedV038InitBytes({ artifactBytes, contract, targetRel, root, version }) {
  const sourceBytes = gzipTarFile(artifactBytes, `package/${contract.sourceRel}`);
  if (!sourceBytes) throw new Error(`v0.3.38 artifact lacks ${contract.sourceRel}`);
  if (targetRel === "AGENTS.md") {
    // v0.3.38 init ran mergeManagedBlock("", sourceText) instead of copying
    // AGENTS.core.md raw. Keep this transform explicit so a path match cannot
    // be mistaken for raw ownership evidence.
    return Buffer.from(`<!-- BEGIN Agent Handoff Kit managed core -->\n${sourceBytes.toString("utf8").trim()}\n<!-- END Agent Handoff Kit managed core -->\n`, "utf8");
  }
  let text = sourceBytes.toString("utf8");
  if (targetRel === "START_NEXT_SESSION_PROMPT.txt" || targetRel === "dev/SESSION_HANDOFF.md") {
    if (!text.includes("<absolute project root>")) throw new Error(`v0.3.38 root placeholder marker missing for ${contract.sourceRel}`);
    text = text.replaceAll("<absolute project root>", root);
  } else if (targetRel === "dev/PROJECT_INDEX.md") {
    const before = text;
    text = text.replace(
      /\| Agent Handoff Kit template version \| [\d.]+ \|/,
      `| Agent Handoff Kit template version | ${version} |`
    );
    if (text === before) throw new Error("v0.3.38 PROJECT_INDEX source lacks its template-version row");
  }
  return targetRel === "START_NEXT_SESSION_PROMPT.txt" || targetRel === "dev/SESSION_HANDOFF.md" || targetRel === "dev/PROJECT_INDEX.md"
    ? Buffer.from(text, "utf8")
    : sourceBytes;
}

function v038InitTransform(targetRel) {
  if (targetRel === "AGENTS.md") return "managed-core-wrap";
  if (targetRel === "START_NEXT_SESSION_PROMPT.txt" || targetRel === "dev/SESSION_HANDOFF.md") return "absolute-project-root";
  if (targetRel === "dev/PROJECT_INDEX.md") return "template-version";
  return "raw-copy";
}

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
    if (dataEnd > archive.length) throw new Error(`truncated v0.3.38 tar entry: ${relative}`);
    if ((header[156] === 0 || header[156] === 48) && relative === wantedPath) return Buffer.from(archive.subarray(dataStart, dataEnd));
    offset = dataStart + Math.ceil(size / 512) * 512;
  }
  return null;
}

function tarText(bytes) {
  const end = bytes.indexOf(0);
  return bytes.subarray(0, end < 0 ? bytes.length : end).toString("utf8");
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
