#!/usr/bin/env node

// Final R-034 closure is intentionally one fixed reproduction of the original
// five-file failure.  It is not a new historical matrix or a generic fixture
// framework: it rebuilds a v0.3.40 project from its pinned npm artifact, then
// imports only the five hash-frozen Phase-0 bytes.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir as systemTmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { canonicalizeOfficialText, loadOfficialOriginCatalog } from "../bin/official-origin-catalog.mjs";
import { installedFileContracts } from "../bin/installed-file-contract.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const candidateRoot = path.resolve(__dirname, "..");
const candidateVersion = JSON.parse(readFileSync(path.join(candidateRoot, "package.json"), "utf8")).version;
const forcedRecoveryVersion = nextPatch(candidateVersion);
const qaTmp = process.env.AGENT_HANDOFF_KIT_QA_TMP || (process.platform === "win32" ? "C:\\tmp" : systemTmpdir());
const phaseZeroRoot = process.env.AGENT_HANDOFF_KIT_R034_PHASE0_FIXTURE
  || (process.platform === "win32" ? "C:\\tmp\\ack-r034-phase0-v040-five-conflict-20260714" : null);
const phaseZeroFiles = new Map([
  ["dev/rules/safety.md", "c9532b36af1ad8202655076bba8985fedcbcc5e8f440d71ce0265e336dabd054"],
  ["dev/rules/research.md", "4926882521f5b5c350bd67730e3e57e7ec70a1c34873f377ca6689ce7f5be5f0"],
  ["dev/rules/agent-governance.md", "114295c578a49c6b26f5ec7c87218a09d9f5c39187406f1f5c129cab14cf6f62"],
  ["dev/rules/knowledge.md", "23a7d0759ff0108a446120ff9540d54ebc95ab1c58e721b62a52bc2943466acd"],
  ["dev/rules/integrations.md", "37302a0e10540159b786f3905e3a599404f8fc92dfff66d4ca0dd71f05dab249"]
]);
const phaseZeroObligations = [
  "本專案自訂：涉及本專案資料清除前，先保存可讀回的本地決策紀錄。",
  "Project-specific evidence rule: preserve the local evidence trail until its replacement is independently verified.",
  "このプロジェクト固有の規則：外部連携の変更前に、現在の責任者と復元手順を確認する。",
  "LOCAL_KNOWLEDGE_OBLIGATION: retain project-specific source provenance with every preserved conclusion.",
  "本地整合約束：變更目前連接器設定前，保留原有可驗證的讀取途徑。"
];

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});

async function main() {
  const catalog = await loadOfficialOriginCatalog();
  const project = fresh("final-phase0-five-file");
  const artifact = materializeV040FreshInit(project, catalog);
  const before = importFrozenPhaseZeroBytes(project);
  assert(phaseZeroObligations.every((text) => [...before.values()].some((bytes) => bytes.toString("utf8").includes(text))), "Phase-0 fixture no longer contains the frozen unheaded Traditional Chinese, English, and Japanese obligations");

  const upgrade = cli(["upgrade", "--yes", "--root", project], "Phase-0 five-file candidate upgrade");
  const upgradeText = output(upgrade);
  assert(upgradeText.includes("migration committed") && upgradeText.includes("project health: passed"), "Phase-0 five-file upgrade did not submit a safe Kit update with fresh health readback");

  const transaction = latestTransaction(project);
  const accepted = transaction.journal.runtimeAcceptance;
  const current = transaction.journal.currentStateWitness;
  const conservation = current?.sourceConservation;
  assert(accepted?.entries?.length > 0 && conservation?.entries?.length > 0, "Phase-0 five-file transaction omitted shared acceptance/current-state evidence");
  assert(current.runtimeAcceptance?.acceptanceDigest === accepted.acceptanceDigest, "Phase-0 five-file current-state witness does not bind the runtime acceptance digest");
  assert(transaction.journal.currentStateReadback?.currentStateDigest === current.currentStateDigest, "Phase-0 five-file doctor readback does not use the same current-state witness");
  assert(transaction.journal.currentStateReadback?.runtimeAcceptanceDigest === accepted.acceptanceDigest, "Phase-0 five-file doctor readback does not use the same runtime acceptance digest");

  // The frozen input covers the original five-file failure. Do not invent
  // unrelated template mutations merely to make this test busier: committed
  // independent stateful entries prove preservation did not block a safe
  // version/state transition.
  const safeTransactionEntries = transaction.journal.entries.filter((entry) => !phaseZeroFiles.has(entry.targetRel));
  assert(safeTransactionEntries.length > 0 && safeTransactionEntries.every((entry) => entry.committed), "Phase-0 five-file preservation prevented the independent safe transaction state from committing");
  for (const [targetRel, bytes] of before) {
    const hash = sha256(bytes);
    assert(readBuffer(path.join(project, targetRel)).equals(bytes), `Phase-0 five-file upgrade changed original bytes: ${targetRel}`);
    const acceptedEntry = accepted.entries.find((entry) => entry.targetRel === targetRel);
    assert(acceptedEntry?.disposition === "preserve" && acceptedEntry.conflictDecision === "non-exact-package-bytes", `Phase-0 five-file runtime acceptance did not preserve ${targetRel}`);
    assert(acceptedEntry.accepted?.sha256 === hash && acceptedEntry.sourceWitness?.sha256 === hash && acceptedEntry.accepted?.bytes === bytes.length, `Phase-0 five-file runtime acceptance lost the raw identity of ${targetRel}`);
    assert(acceptedEntry.originalReader?.reader === "AGENTS.md" && acceptedEntry.originalReader.via === "dev/RULE_PACKS.md" && acceptedEntry.activeReader?.reader === "AGENTS.md" && acceptedEntry.activeReader.via === "dev/RULE_PACKS.md", `Phase-0 five-file acceptance lost the AGENTS -> RULE_PACKS reader for ${targetRel}`);
    assert(acceptedEntry.originalReader.routeWitness?.routes?.length > 0 && acceptedEntry.activeReader.routeWitness?.routes?.length > 0, `Phase-0 five-file acceptance lost the active route/effect witness for ${targetRel}`);
    const conserved = conservation.entries.find((entry) => entry.sourcePath === targetRel);
    assert(conserved?.sourceWitness?.sha256 === hash && conserved.accepted?.sha256 === hash && conserved.accepted?.bytes === bytes.length, `Phase-0 five-file current-state conservation lost ${targetRel}`);
    assert(conserved.sourceByteRanges?.length === 1 && conserved.sourceByteRanges[0].start === 0 && conserved.sourceByteRanges[0].end === bytes.length && conserved.sourceByteRanges[0].sha256 === hash, `Phase-0 five-file conservation does not reconstruct ${targetRel} from one complete byte range`);
  }
  assert(transaction.report.includes(accepted.acceptanceDigest) && transaction.report.includes(current.currentStateDigest), "Phase-0 five-file report does not consume the same acceptance/current-state identity");

  const doctor = cli(["doctor", "--root", project], "Phase-0 five-file ordinary doctor");
  const doctorText = output(doctor);
  assert(doctorText.includes("status: passed") && doctorText.includes("AGENTS -> RULE_PACKS routes (accepted whole-file bytes, readers, priority, and effect)"), "ordinary doctor did not fresh-read the effective AGENTS -> RULE_PACKS acceptance state");

  const beforeRecovery = new Map([...before].map(([targetRel]) => [targetRel, readBuffer(path.join(project, targetRel))]));
  const interrupted = cli(["upgrade", "--yes", "--root", project], "Phase-0 five-file interrupted upgrade", {
    AGENT_HANDOFF_KIT_QA_ALLOW_VERSION_OVERRIDE: "1",
    AGENT_HANDOFF_KIT_QA_VERSION_OVERRIDE: forcedRecoveryVersion,
    AGENT_HANDOFF_KIT_QA_INTERRUPT_AFTER_REPLACE_COUNT: "1"
  }, { allowFailure: true });
  assert(interrupted.status !== 0 && existsSync(path.join(project, "dev", "governance_migrations", ".upgrade.lock")), "Phase-0 interruption did not retain a recovery lock");
  assert(!output(interrupted).includes("migration committed") && !output(interrupted).includes("project health: passed") && !output(interrupted).includes("/\\_/\\"), "Phase-0 interruption printed success before recovery");
  const lockedDoctor = cli(["doctor", "--root", project], "Phase-0 interrupted ordinary doctor", {}, { allowFailure: true });
  assert(lockedDoctor.status !== 0 && !output(lockedDoctor).includes("status: passed"), "ordinary doctor accepted a partial Phase-0 transaction state");
  const recovery = cli(["upgrade", "--yes", "--root", project], "Phase-0 five-file recovery", {
    AGENT_HANDOFF_KIT_QA_ALLOW_VERSION_OVERRIDE: "1",
    AGENT_HANDOFF_KIT_QA_VERSION_OVERRIDE: forcedRecoveryVersion,
    AGENT_HANDOFF_KIT_QA_RECOVER_ONLY: "1"
  });
  assert(output(recovery).includes("recovered interrupted upgrade"), "Phase-0 recovery did not report its complete old-state restoration");
  for (const [targetRel, bytes] of beforeRecovery) {
    assert(readBuffer(path.join(project, targetRel)).equals(bytes), `Phase-0 recovery did not restore complete prior bytes: ${targetRel}`);
  }
  const recoveredDoctor = cli(["doctor", "--root", project], "Phase-0 recovered ordinary doctor");
  assert(output(recoveredDoctor).includes("status: passed") && !existsSync(path.join(project, "dev", "governance_migrations", ".upgrade.lock")), "Phase-0 recovery did not return one complete readable state");

  console.log(`ok: v0.3.40 npm artifact ${artifact.integrity} rebuilt and verified the five Phase-0 raw inputs`);
  console.log("ok: Phase-0 five-file bytes, active AGENTS -> RULE_PACKS effect, shared current-state readback, and representative interruption/recovery closure");
}

function materializeV040FreshInit(project, catalog) {
  const version = "0.3.40";
  const manifest = JSON.parse(read(path.join(candidateRoot, "test-fixtures", "v0.3.40", "fixture-manifest.json")));
  const npmIdentity = manifest?.source?.npm;
  const releaseIdentity = catalog.releases?.[version]?.source?.npm;
  assert(npmIdentity && releaseIdentity && npmIdentity.integrity === releaseIdentity.integrity && npmIdentity.shasum === releaseIdentity.shasum, "v0.3.40 catalog and fixture package identities disagree");
  const artifactPath = resolveArtifact(version, npmIdentity);
  const artifactBytes = readBuffer(artifactPath);
  const integrity = `sha512-${createHash("sha512").update(artifactBytes).digest("base64")}`;
  assert(integrity === npmIdentity.integrity && sha1(artifactBytes) === npmIdentity.shasum, "v0.3.40 artifact integrity or shasum mismatch");
  const entries = gzipTarEntries(artifactBytes, "v0.3.40 npm artifact");
  assert([...entries.keys()].filter((entry) => entry.startsWith("package/")).length === npmIdentity.entryCount, "v0.3.40 artifact package entry count mismatch");
  const metadata = JSON.parse(entries.get("package/package.json")?.toString("utf8") ?? "");
  assert(metadata.name === "@adamchanadam/agent-handoff-kit" && metadata.version === version, "v0.3.40 artifact package identity mismatch");

  const extracted = fresh("final-phase0-v040-package");
  for (const [relative, bytes] of entries) {
    if (!relative.startsWith("package/")) continue;
    const target = path.resolve(extracted, relative);
    assert(target.startsWith(`${path.resolve(extracted)}${path.sep}`), `v0.3.40 artifact entry escapes extraction root: ${relative}`);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, bytes);
  }
  const artifactCli = path.join(extracted, "package", "bin", "agent-handoff-kit.mjs");
  const init = spawnSync(process.execPath, [artifactCli, "init", "--yes", "--root", project], {
    cwd: path.join(extracted, "package"), encoding: "utf8", env: { ...process.env, AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "1" }
  });
  assert(!init.error && init.status === 0, `v0.3.40 artifact fresh init failed\n${output(init)}`);
  for (const contract of installedFileContracts) {
    const record = manifest.installedTargets?.[contract.targetRel];
    assert(record, `v0.3.40 fixture manifest lacks ${contract.targetRel}`);
    const target = path.join(project, contract.targetRel);
    if (record.state === "absent") {
      assert(!existsSync(target), `v0.3.40 fresh init created absent target ${contract.targetRel}`);
      continue;
    }
    const bytes = readBuffer(target);
    const rawMatch = sha256(bytes) === record.rawSha256;
    const canonicalMatch = ["START_NEXT_SESSION_PROMPT.txt", "dev/SESSION_HANDOFF.md", "dev/PROJECT_INDEX.md"].includes(contract.targetRel)
      && sha256(Buffer.from(canonicalizeOfficialText(contract.targetRel, bytes.toString("utf8")), "utf8")) === record.canonicalSha256;
    assert(rawMatch || canonicalMatch, `v0.3.40 artifact fresh-init output drifted: ${contract.targetRel}`);
  }
  return { integrity, artifactPath };
}

function importFrozenPhaseZeroBytes(project) {
  assert(phaseZeroRoot && existsSync(phaseZeroRoot), "Phase-0 five-file witness root is unavailable; refusing to invent replacement inputs");
  const imported = new Map();
  for (const [targetRel, expectedHash] of phaseZeroFiles) {
    const source = path.join(phaseZeroRoot, targetRel);
    assert(existsSync(source), `Phase-0 witness omits ${targetRel}; refusing to invent replacement input`);
    const bytes = readBuffer(source);
    assert(sha256(bytes) === expectedHash, `Phase-0 frozen SHA-256 mismatch for ${targetRel}; refusing to use a re-created fixture`);
    writeFileSync(path.join(project, targetRel), bytes);
    imported.set(targetRel, bytes);
  }
  return imported;
}

function resolveArtifact(version, identity) {
  const cache = process.env.AGENT_HANDOFF_KIT_HISTORICAL_ARTIFACT_CACHE
    || (process.platform === "win32" ? "C:\\tmp\\agent-handoff-kit-historical-artifacts" : path.join(systemTmpdir(), "agent-handoff-kit-historical-artifacts"));
  const name = `adamchanadam-agent-handoff-kit-${version}.tgz`;
  const cached = path.join(cache, name);
  if (existsSync(cached)) return cached;
  mkdirSync(cache, { recursive: true });
  const npmCli = [process.env.npm_execpath, path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js")].find((candidate) => candidate && existsSync(candidate));
  assert(npmCli, "cannot locate npm-cli.js to retrieve the pinned v0.3.40 artifact");
  const packed = spawnSync(process.execPath, [npmCli, "pack", identity.spec, "--json", "--pack-destination", cache], {
    cwd: cache, encoding: "utf8", env: { ...process.env, NPM_CONFIG_IGNORE_SCRIPTS: "true", NPM_CONFIG_UPDATE_NOTIFIER: "false" }
  });
  assert(!packed.error && packed.status === 0, `v0.3.40 official artifact download failed\n${output(packed)}`);
  const filename = JSON.parse(packed.stdout)?.[0]?.filename;
  assert(filename === name && existsSync(cached), "v0.3.40 artifact download returned an unexpected file");
  return cached;
}

function gzipTarEntries(gzipBytes, label) {
  const archive = gunzipSync(gzipBytes);
  const entries = new Map();
  for (let offset = 0; offset + 512 <= archive.length;) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((value) => value === 0)) break;
    const name = tarText(header.subarray(0, 100));
    const prefix = tarText(header.subarray(345, 500));
    const relative = prefix ? `${prefix}/${name}` : name;
    const size = Number.parseInt(tarText(header.subarray(124, 136)).trim() || "0", 8);
    const start = offset + 512;
    const end = start + size;
    assert(Number.isSafeInteger(size) && size >= 0 && end <= archive.length, `${label} has an invalid or truncated entry: ${relative}`);
    if (header[156] === 0 || header[156] === 48) {
      assert(relative && !relative.includes("\\") && !relative.split("/").includes("..") && !entries.has(relative), `${label} has an unsafe or duplicate entry: ${relative}`);
      entries.set(relative, Buffer.from(archive.subarray(start, end)));
    } else if (header[156] !== 53) {
      throw new Error(`${label} has an unsupported entry type: ${relative}`);
    }
    offset = start + Math.ceil(size / 512) * 512;
  }
  return entries;
}

function tarText(bytes) { const end = bytes.indexOf(0); return bytes.subarray(0, end < 0 ? bytes.length : end).toString("utf8"); }
function nextPatch(version) { const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version); assert(match, `candidate package version is not semver: ${version}`); return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`; }
function fresh(label) { const target = path.join(qaTmp, `ack-r034-${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`); assert(!existsSync(target), `QA root already exists: ${target}`); mkdirSync(target, { recursive: true }); return target; }
function cli(args, label, env = {}, { allowFailure = false } = {}) { const result = spawnSync(process.execPath, [path.join(candidateRoot, "bin", "agent-handoff-kit.mjs"), ...args], { cwd: candidateRoot, encoding: "utf8", env: { ...process.env, CI: "1", ...env } }); if (result.error || (!allowFailure && result.status !== 0)) throw new Error(`${label} failed\n${output(result)}`); console.log(`ok: ${label}`); return result; }
function latestTransaction(project) { const root = path.join(project, "dev", "governance_migrations"); const journalPath = readdirSync(root).map((name) => path.join(root, name, "transaction.json")).filter((file) => existsSync(file)).sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0]; assert(journalPath, "Phase-0 five-file fixture has no committed transaction journal"); const transactionRoot = path.dirname(journalPath); return { journal: JSON.parse(read(journalPath)), report: read(path.join(transactionRoot, "migration-report.md")) }; }
function read(file) { return readFileSync(file, "utf8"); }
function readBuffer(file) { return readFileSync(file); }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function sha1(bytes) { return createHash("sha1").update(bytes).digest("hex"); }
function output(result) { return `${result.stdout ?? ""}\n${result.stderr ?? ""}`; }
function assert(condition, message) { if (!condition) throw new Error(message); }
