#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { tmpdir as systemTmpdir } from "node:os";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { installedFileContracts } from "../bin/installed-file-contract.mjs";
import { canonicalizeOfficialText, loadOfficialOriginCatalog } from "../bin/official-origin-catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const fixturesRoot = path.join(root, "test-fixtures");
const qaTmp = process.env.AGENT_HANDOFF_KIT_QA_TMP || (process.platform === "win32" ? "C:\\tmp" : systemTmpdir());
const packageVersion = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version;
const officialOriginCatalog = await loadOfficialOriginCatalog();
const rootOrVersionGeneratedTargets = new Set([
  "START_NEXT_SESSION_PROMPT.txt",
  "dev/SESSION_HANDOFF.md",
  "dev/PROJECT_INDEX.md"
]);

main();

function main() {
  if (process.argv.includes("--r034-gate5-only")) {
    checkV038HeadedAppendixProtection();
    console.log("R-034 headed-appendix preservation transaction check passed; this is not a Gate 5 item closure");
    return;
  }
  // Keep the product-critical R-034 path first: an interrupted long-running
  // historical matrix must never make an omitted formal-router regression look
  // like a green upgrade QA.
  checkR034VerticalPath();
  checkDryRunNoWrites();
  checkCancelledWriteLeavesMissingRootAbsent();
  checkPartialInstallAndBackup();
  checkConflictZeroWrite();
  checkBridgeSemantics();
  checkOverlayPreflightZeroWrite();
  checkFutureVersionBlock();
  checkJunctionRootBlock();
  checkCredentialPreBackupStop();
  checkHistoricalSingleHopFixtures();
  checkHistoricalCrlfAndBaselineMismatch();
  checkV038HeadedAppendixProtection();
  checkRulePacksMarkerMerge();
  checkProjectIndexRealHeadings();
  checkHistoricalSessionLogTemplateMigration();
  checkMalformedSessionLogBoundary();
  checkLifecycleCrossCheck();
  checkPromptThirdCopy();
  checkFaultRollback();
  checkReplacementBeforeJournalRecovery();
  checkRecoveryArtifactValidation();
  checkCommittedRecoveryRebuildsReport();
  checkIdempotency();
  console.log("");
  console.log("Agent Handoff Kit upgrade safety QA passed");
}

function checkR034VerticalPath() {
  const result = spawnSync(process.execPath, ["scripts/check-r034-vertical.mjs"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, CI: "1" }
  });
  if (result.error || result.status !== 0) {
    throw new Error(`R-034 vertical upgrade QA failed\n${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  }
  process.stdout.write(result.stdout);
  console.log("ok: upgrade QA includes the formal user-rules vertical path");
}

function checkDryRunNoWrites() {
  const project = path.join(qaTmp, `ack-v039-dry-run-missing-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  assert(!existsSync(project), "dry-run missing-root fixture already exists");
  const result = cli(["init", "--dry-run", "--root", project], "missing-root dry-run");
  assert(result.stdout.includes("dry-run: no files written"), "missing-root dry-run did not report zero writes");
  assert(!existsSync(project), "init --dry-run created the selected root");
  console.log("ok: init dry-run leaves a missing root absent");
}

function checkCancelledWriteLeavesMissingRootAbsent() {
  const project = path.join(qaTmp, `ack-v041-cancel-missing-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  assert(!existsSync(project), "cancelled missing-root fixture already exists");
  const result = cli(["init", "--root", project], "missing-root cancellation", { input: "no\n" });
  assert(result.stdout.includes("cancelled: no files written"), "cancelled init did not report zero writes");
  assert(!existsSync(project), "cancelled init created the selected root before confirmation");
  console.log("ok: cancelled init leaves a missing root absent");
}

function checkPartialInstallAndBackup() {
  const project = fresh("partial");
  writeFileSync(path.join(project, "AGENTS.md"), "# Existing Project\n\n## User Local Rules\n\nKeep this local rule.\n", "utf8");
  const result = cli(["upgrade", "--yes", "--root", project], "partial upgrade");
  const agents = read(path.join(project, "AGENTS.md"));
  assert(result.stdout.includes("migration committed"), "partial upgrade did not commit transaction");
  assert(agents.includes("Keep this local rule."), "partial upgrade removed local AGENTS content");
  assert(count(agents, "BEGIN Agent Handoff Kit managed core") === 1, "partial upgrade did not create exactly one managed core");
  const report = latestReport(project);
  const reportText = read(report);
  const journal = JSON.parse(read(path.join(path.dirname(report), "transaction.json")));
  assert(reportText.includes("- merge: AGENTS.md"), "transaction report missing AGENTS merge");
  assert(journal.state === "committed" && journal.committedVersion === packageVersion, "successful transaction journal did not record the committed version");
  assert(reportText.includes(`- Committed version: ${packageVersion}`), "transaction report did not use the journal committed version");
  assert(existsSync(path.join(path.dirname(report), "backup", "AGENTS.md")), "transaction backup missing original AGENTS");
  const partialDoctor = cli(["doctor", "--root", project], "partial doctor");
  assert(partialDoctor.stdout.includes("status: passed"), `partial upgrade doctor failed\n${output(partialDoctor)}`);
  console.log("ok: partial install, backup, report, doctor");
}

function checkConflictZeroWrite() {
  const project = fresh("conflict");
  const claude = "# Local Claude bridge\n\nDo not replace this custom bridge.\n";
  writeFileSync(path.join(project, "CLAUDE.md"), claude, "utf8");
  const result = cli(["upgrade", "--yes", "--root", project], "formal conflict", { allowFailure: true });
  assert(result.status !== 0 && output(result).includes("升級預檢發現 conflict"), "formal conflict was not blocked");
  assert(read(path.join(project, "CLAUDE.md")) === claude, "formal conflict overwrote the custom bridge");
  assert(!existsSync(path.join(project, "dev")), "formal conflict wrote governance targets or migration artifacts");
  console.log("ok: formal conflict has zero governance writes");
}

function checkBridgeSemantics() {
  const planProject = fresh("bridge-plan-lookalike");
  const lookalike = "# Local Claude note\n\nPlease consult AGENTS.md before work.\n";
  writeFileSync(path.join(planProject, "CLAUDE.md"), lookalike, "utf8");
  const dryRun = cli(["upgrade", "--dry-run", "--root", planProject], "bridge lookalike dry-run", { allowFailure: true });
  assert(dryRun.status !== 0 && output(dryRun).includes("conflict: 1"), "bridge prose lookalike was not a dry-run conflict");
  const apply = cli(["upgrade", "--yes", "--root", planProject], "bridge lookalike apply", { allowFailure: true });
  assert(apply.status !== 0 && output(apply).includes("治理目標檔、版本與 migration artifact 均沒有寫入"), "bridge prose lookalike reached the transaction phase");
  assert(read(path.join(planProject, "CLAUDE.md")) === lookalike && !existsSync(path.join(planProject, "dev")), "bridge prose conflict changed files or created migration artifacts");

  const commonHeadingProject = fresh("bridge-common-heading");
  const commonHeading = "# Project instructions\n\n## Architecture\n\nACME_CUSTOM_ARCHITECTURE_TOKEN\n\nNever remove this project-owned instruction.\n";
  writeFileSync(path.join(commonHeadingProject, "CLAUDE.md"), commonHeading, "utf8");
  const commonHeadingDryRun = cli(["upgrade", "--dry-run", "--root", commonHeadingProject], "custom CLAUDE common heading dry-run", { allowFailure: true });
  assert(commonHeadingDryRun.status !== 0 && output(commonHeadingDryRun).includes("conflict: 1"), "common CLAUDE heading was mistaken for an official expanded bridge");
  const commonHeadingApply = cli(["upgrade", "--yes", "--root", commonHeadingProject], "custom CLAUDE common heading apply", { allowFailure: true });
  assert(commonHeadingApply.status !== 0, "common CLAUDE heading reached a committed upgrade");
  assert(read(path.join(commonHeadingProject, "CLAUDE.md")) === commonHeading && !existsSync(path.join(commonHeadingProject, "dev")), "custom CLAUDE content was changed or migration evidence was created");

  const project = install("bridge");
  writeFileSync(path.join(project, "CLAUDE.md"), "# Claude\n\n```text\n@AGENTS.md\n```\n\n<!-- @AGENTS.md -->\n", "utf8");
  const doctor = cli(["doctor", "--root", project], "bridge false-positive doctor", { allowFailure: true });
  assert(doctor.status !== 0 && output(doctor).includes("expected one active @AGENTS.md import, found 0"), "comment/fence bridge lookalike made doctor pass");
  writeFileSync(path.join(project, "CLAUDE.md"), "# Claude Code Bridge\n\n@AGENTS.md\n", "utf8");
  assert(cli(["doctor", "--root", project], "bridge repaired doctor").stdout.includes("status: passed"), "valid one-hop bridge did not pass");
  console.log("ok: bridge dry-run and apply require the same active one-hop instructions");
}

function checkOverlayPreflightZeroWrite() {
  const project = fresh("overlay-preflight");
  const registryPath = path.join(project, "dev", "DOC_SYNC_REGISTRY.md");
  mkdirSync(path.dirname(registryPath), { recursive: true });
  const customRegistry = "# Project sync notes\n\nThis is project-owned content without the Kit registry schema.\n";
  writeFileSync(registryPath, customRegistry, "utf8");

  const dryRun = cli(["upgrade", "--dry-run", "--root", project], "overlay preflight dry-run", { allowFailure: true });
  assert(dryRun.status !== 0 && output(dryRun).includes("transaction preflight") && output(dryRun).includes("conflict: 1"), "dry-run did not expose the transaction acceptance failure");
  assert(read(registryPath) === customRegistry && !existsSync(path.join(project, "dev", "governance_migrations")), "dry-run wrote migration evidence or changed the custom registry");

  const apply = cli(["upgrade", "--yes", "--root", project], "overlay preflight apply", { allowFailure: true });
  assert(apply.status !== 0 && output(apply).includes("transaction preflight") && output(apply).includes("均沒有寫入"), "formal upgrade did not stop at the same preflight gate");
  assert(read(registryPath) === customRegistry && !existsSync(path.join(project, "dev", "governance_migrations")), "formal preflight failure created migration evidence or changed the custom registry");
  console.log("ok: dry-run and formal upgrade share the overlay gate before transaction writes");
}

function checkFutureVersionBlock() {
  const project = install("future-version");
  const index = path.join(project, "dev", "PROJECT_INDEX.md");
  writeFileSync(index, read(index).replace(/\| Agent Handoff Kit template version \| [\d.]+ \|/, "| Agent Handoff Kit template version | 9.0.0 |"), "utf8");
  const before = governanceSnapshot(project);
  const result = cli(["upgrade", "--yes", "--root", project], "future-version block", { allowFailure: true });
  assert(result.status !== 0 && output(result).includes("newer than this CLI"), "future project version was not blocked");
  assert(equalSnapshots(before, governanceSnapshot(project)), "future-version block changed governance files");
  console.log("ok: newer project version blocks downgrade with zero writes");
}

function checkJunctionRootBlock() {
  const target = install("junction-target");
  const link = path.join(qaTmp, `ack-v039-junction-link-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  try {
    symlinkSync(target, link, process.platform === "win32" ? "junction" : "dir");
  } catch (error) {
    if (["EPERM", "EACCES", "ENOTSUP"].includes(error?.code)) {
      console.log(`skip: junction/symlink root rejection (${error.code}; runtime cannot create test link)`);
      return;
    }
    throw error;
  }
  const before = governanceSnapshot(target);
  const result = cli(["upgrade", "--yes", "--root", link], "junction root block", { allowFailure: true });
  assert(result.status !== 0 && output(result).includes("symbolic link or junction"), "junction/symlink root was not blocked");
  assert(equalSnapshots(before, governanceSnapshot(target)), "junction/symlink rejection changed target governance files");
  console.log("ok: junction/symlink root is rejected with zero target changes");
}

function checkCredentialPreBackupStop() {
  const project = install("credential-stop");
  const fakePattern = `sk-${"A".repeat(28)}`;
  append(path.join(project, "dev", "SESSION_LOG.md"), `\nSynthetic QA credential pattern: ${fakePattern}\n`);
  const indexPath = path.join(project, "dev", "PROJECT_INDEX.md");
  writeFileSync(indexPath, read(indexPath).replace(`| Agent Handoff Kit template version | ${packageVersion} |`, "| Agent Handoff Kit template version | 0.3.38 |"), "utf8");
  const migrationRoot = path.join(project, "dev", "governance_migrations");
  const beforeDirs = readdirSync(migrationRoot).length;
  const before = governanceSnapshot(project);
  const result = cli(["upgrade", "--yes", "--root", project], "credential pre-backup stop", { allowFailure: true });
  assert(result.status !== 0 && output(result).includes("credential value"), "credential pattern did not stop upgrade before backup");
  assert(!output(result).includes(fakePattern), "credential value was echoed in upgrade output");
  assert(readdirSync(migrationRoot).length === beforeDirs, "credential stop created a migration artifact");
  assert(equalSnapshots(before, governanceSnapshot(project)), "credential stop changed governance files");
  console.log("ok: credential pattern stops before backup without value disclosure");
}

function checkHistoricalSingleHopFixtures() {
  const versions = readdirSync(fixturesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^v\d+\.\d+\.\d+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort(compareVersions);
  assert(versions.length >= 30, "historical fixture coverage unexpectedly small");
  for (const version of versions) {
    const project = fresh(`fixture-${version}`);
    const versionNumber = version.replace(/^v/, "");
    materializeOfficialInstall(versionNumber, project);
    const result = cli(["upgrade", "--yes", "--root", project], `single-hop ${version}`);
    assert(result.stdout.includes("status: passed"), `${version} single-hop doctor did not pass\n${output(result)}`);
    assert(count(read(path.join(project, "AGENTS.md")), "BEGIN Agent Handoff Kit managed core") === 1, `${version} did not end with one managed core`);
  }
  console.log(`ok: ${versions.length} committed historical fixtures single-hop upgrade`);
}

function materializeOfficialInstall(version, project) {
  // Catalog text is normalized for discovery, not raw-byte source material.
  // Every existing committed historical fixture has a pinned npm identity, so
  // construct it through its own verified artifact and old fresh-init CLI.
  return materializeVerifiedArtifactInit(version, project);
}

function materializeVerifiedArtifactInit(version, project) {
  const fixtureManifestPath = path.join(fixturesRoot, `v${version}`, "fixture-manifest.json");
  assert(existsSync(fixtureManifestPath), `v${version} single-hop fixture manifest is missing`);
  const fixtureManifest = JSON.parse(readFileSync(fixtureManifestPath, "utf8"));
  const release = officialOriginCatalog.releases[version];
  const npmIdentity = fixtureManifest?.source?.npm;
  assert(release?.source?.npm && npmIdentity, `v${version} catalog or fixture npm identity is missing`);
  assert(release.source.npm.integrity === npmIdentity.integrity && release.source.npm.shasum === npmIdentity.shasum, `v${version} catalog and fixture npm identity disagree`);
  const artifactPath = resolveHistoricalArtifact(version, npmIdentity);

  const artifact = readFileSync(artifactPath);
  const actualIntegrity = `sha512-${createHash("sha512").update(artifact).digest("base64")}`;
  const actualShasum = createHash("sha1").update(artifact).digest("hex");
  assert(actualIntegrity === npmIdentity.integrity, `v${version} npm artifact integrity mismatch`);
  assert(actualShasum === npmIdentity.shasum, `v${version} npm artifact shasum mismatch`);

  const entries = gzipTarEntries(artifact, `v${version} npm artifact`);
  const packageEntries = [...entries.keys()].filter((relative) => relative.startsWith("package/"));
  assert(packageEntries.length === npmIdentity.entryCount, `v${version} npm artifact entry count mismatch`);
  const packageJson = entries.get("package/package.json");
  assert(packageJson, `v${version} npm artifact lacks package/package.json`);
  const metadata = JSON.parse(packageJson.toString("utf8"));
  assert(metadata.name === "@adamchanadam/agent-handoff-kit" && metadata.version === version, `v${version} npm artifact package identity mismatch`);

  for (const contract of installedFileContracts) {
    const record = fixtureManifest.installedTargets?.[contract.targetRel];
    assert(record, `v${version} fixture manifest lacks ${contract.targetRel}`);
    if (record.state !== "present") continue;
    assert(entries.has(`package/${contract.sourceRel}`), `v${version} artifact omits source ${contract.sourceRel} for a present fresh-init target`);
  }

  const artifactRoot = fresh(`v${version}-artifact-package`);
  for (const [relative, bytes] of entries) {
    if (!relative.startsWith("package/")) continue;
    const destination = path.resolve(artifactRoot, relative);
    assert(destination.startsWith(`${path.resolve(artifactRoot)}${path.sep}`), `v${version} artifact entry escapes isolated fixture: ${relative}`);
    mkdirSync(path.dirname(destination), { recursive: true });
    writeFileSync(destination, bytes);
  }
  const artifactCli = path.join(artifactRoot, "package", "bin", "agent-handoff-kit.mjs");
  const init = spawnSync(process.execPath, [artifactCli, "init", "--yes", "--root", project], {
    cwd: path.join(artifactRoot, "package"),
    encoding: "utf8",
    env: { ...process.env, AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "1" }
  });
  assert(!init.error && init.status === 0, `v${version} official artifact fresh init failed\n${output(init)}`);
  for (const contract of installedFileContracts) {
    const record = fixtureManifest.installedTargets[contract.targetRel];
    const target = path.join(project, contract.targetRel);
    if (record.state === "absent") {
      assert(!existsSync(target), `v${version} artifact fresh init created absent target ${contract.targetRel}`);
      continue;
    }
    assert(existsSync(target), `v${version} artifact fresh init omitted present target ${contract.targetRel}`);
    const actual = readFileSync(target);
    const rawMatch = sha(actual) === record.rawSha256;
    const canonicalMatch = rootOrVersionGeneratedTargets.has(contract.targetRel)
      && sha(Buffer.from(canonicalizeOfficialText(contract.targetRel, actual.toString("utf8")), "utf8")) === record.canonicalSha256;
    assert(rawMatch || canonicalMatch, `v${version} artifact fresh-init bytes drifted for ${contract.targetRel}`);
  }
}

function resolveHistoricalArtifact(version, npmIdentity) {
  const explicit = version === "0.1.0" ? process.env.AGENT_HANDOFF_KIT_V010_TGZ : null;
  if (explicit) return explicit;
  const cacheRoot = process.env.AGENT_HANDOFF_KIT_HISTORICAL_ARTIFACT_CACHE
    || (process.platform === "win32" ? "C:\\tmp\\agent-handoff-kit-historical-artifacts" : path.join(systemTmpdir(), "agent-handoff-kit-historical-artifacts"));
  mkdirSync(cacheRoot, { recursive: true });
  const expectedName = `adamchanadam-agent-handoff-kit-${version}.tgz`;
  const cached = path.join(cacheRoot, expectedName);
  if (existsSync(cached)) return cached;
  const bundledNpmCli = path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
  const npmCli = [process.env.npm_execpath, bundledNpmCli].find((candidate) => candidate && existsSync(candidate));
  assert(npmCli, `v${version} cannot locate npm-cli.js to retrieve its pinned official artifact`);
  const packed = spawnSync(process.execPath, [npmCli, "pack", npmIdentity.spec, "--json", "--pack-destination", cacheRoot], {
    cwd: cacheRoot,
    encoding: "utf8",
    env: { ...process.env, NPM_CONFIG_IGNORE_SCRIPTS: "true", NPM_CONFIG_UPDATE_NOTIFIER: "false" }
  });
  assert(!packed.error && packed.status === 0, `v${version} official npm artifact download failed\n${packed.error?.message ?? ""}\n${output(packed)}`);
  let records;
  try {
    records = JSON.parse(packed.stdout);
  } catch {
    throw new Error(`v${version} official npm artifact download returned invalid JSON\n${output(packed)}`);
  }
  const filename = records?.[0]?.filename;
  assert(typeof filename === "string" && filename === expectedName, `v${version} npm artifact filename mismatch`);
  const artifactPath = path.join(cacheRoot, filename);
  assert(existsSync(artifactPath), `v${version} npm artifact download did not create its tarball`);
  return artifactPath;
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
    const sizeText = tarText(header.subarray(124, 136)).trim();
    const size = sizeText ? Number.parseInt(sizeText, 8) : 0;
    assert(Number.isSafeInteger(size) && size >= 0, `${label} has invalid tar size for ${relative}`);
    const dataStart = offset + 512;
    const dataEnd = dataStart + size;
    assert(dataEnd <= archive.length, `${label} is truncated at ${relative}`);
    const type = header[156];
    if (type === 0 || type === 48) {
      assert(relative && !relative.includes("\\") && !relative.split("/").includes(".."), `${label} has unsafe tar entry ${relative}`);
      assert(!entries.has(relative), `${label} has duplicate tar entry ${relative}`);
      entries.set(relative, Buffer.from(archive.subarray(dataStart, dataEnd)));
    } else if (type !== 53) {
      throw new Error(`${label} has unsupported non-regular tar entry ${relative}`);
    }
    offset = dataStart + Math.ceil(size / 512) * 512;
  }
  return entries;
}

function tarText(bytes) {
  const end = bytes.indexOf(0);
  return bytes.subarray(0, end < 0 ? bytes.length : end).toString("utf8");
}

function checkHistoricalCrlfAndBaselineMismatch() {
  const crlfProject = fresh("v035-crlf");
  materializeOfficialInstall("0.3.35", crlfProject);
  for (const { targetRel } of installedFileContracts) {
    const targetPath = path.join(crlfProject, targetRel);
    if (!existsSync(targetPath)) continue;
    writeFileSync(targetPath, read(targetPath).replace(/\r?\n/g, "\r\n"), "utf8");
  }
  const crlfBefore = new Map(installedFileContracts
    .map(({ targetRel }) => [targetRel, readOptionalBuffer(path.join(crlfProject, targetRel))])
    .filter(([, bytes]) => bytes != null));
  const crlfUpgrade = cli(["upgrade", "--yes", "--root", crlfProject], "v0.3.35 CRLF official upgrade");
  assert(crlfUpgrade.stdout.includes("status: passed"), "newline-only official variation did not upgrade cleanly");
  for (const [targetRel, before] of crlfBefore) {
    assert(readFileSync(path.join(crlfProject, targetRel)).equals(before), `newline-only non-exact ${targetRel} was rewritten instead of preserved`);
  }

  for (const mode of ["forged", "missing"]) {
    const project = fresh(`v035-${mode}-baseline`);
    materializeOfficialInstall("0.3.35", project);
    const safetyPath = path.join(project, "dev", "rules", "safety.md");
    append(safetyPath, "\n## Local Project Rules\n\nKeep the project-specific protected branch list.\n");
    const indexPath = path.join(project, "dev", "PROJECT_INDEX.md");
    const index = read(indexPath);
    writeFileSync(
      indexPath,
      mode === "forged"
        ? index.replace(/\| Agent Handoff Kit template version \| [^|]+ \|/, "| Agent Handoff Kit template version | 0.3.38 |")
        : index.replace(/^\| Agent Handoff Kit template version \|.*\r?\n/m, ""),
      "utf8"
    );
    const before = governanceSnapshot(project);
    const result = cli(["upgrade", "--dry-run", "--root", project], `v0.3.35 ${mode} baseline`, { allowFailure: true });
    assert(result.status !== 0 && output(result).includes("do not identify one consistent historical baseline"), `${mode} baseline did not stop safely`);
    assert(equalSnapshots(before, governanceSnapshot(project)), `${mode} baseline dry-run changed governance files`);
  }
  console.log("ok: CRLF official files upgrade; forged or missing baselines cannot authorize custom-rule merge");
}

function checkV038HeadedAppendixProtection() {
  const project = fresh("v038-headed-appendix-protection");
  materializeOfficialInstall("0.3.38", project);
  const target = "dev/rules/integrations.md";
  append(path.join(project, target), "\n## Local Project Rules\n\nPreserve the signed-in user browser profile.\n");
  const rawBefore = readFileSync(path.join(project, target));
  const result = cli(["upgrade", "--yes", "--root", project], "v0.3.38 headed appendix preservation transaction");
  assert(result.status === 0 && output(result).includes("migration committed") && output(result).includes("project health: passed"), "headed appendix did not complete a same-readback preservation transaction");
  assert(readFileSync(path.join(project, target)).equals(rawBefore), "headed appendix preservation transaction changed original bytes");
  const journal = JSON.parse(read(latestJournal(project)));
  const accepted = journal.runtimeAcceptance?.entries.find((entry) => entry.targetRel === target);
  assert(accepted?.disposition === "preserve" && accepted.conflictDecision === "non-exact-package-bytes", "headed appendix was inferred as managed from its heading rather than preserved as non-exact bytes");
  assert(accepted.accepted.sha256 === sha(rawBefore) && accepted.sourceWitness.sha256 === sha(rawBefore), "headed appendix preservation lost its raw-byte witnesses");
  assert(journal.currentStateWitness?.runtimeAcceptance?.acceptanceDigest === journal.runtimeAcceptance.acceptanceDigest, "headed appendix runtime component was not bound into the shared current-state witness");
  console.log("ok: headed appendix bytes preserve through a transaction without heading-based ownership inference");
}

function checkRulePacksMarkerMerge() {
  const project = install("rulepacks-custom");
  const routerPath = path.join(project, "dev", "RULE_PACKS.md");
  const before = read(routerPath)
    .split(/\r?\n/)
    .filter((line) => !line.includes("ack:route:governance-bridge"))
    .join("\n") + "\n| Local custom governance route | `dev/rules/agent-governance.md` | preserve this unmarked local row |\n";
  writeFileSync(routerPath, before, "utf8");
  const result = cli(["upgrade", "--yes", "--root", project], "governance bridge RULE_PACKS marker migration");
  const after = read(routerPath);
  assert(result.stdout.includes("status: passed"), "governance bridge RULE_PACKS marker migration doctor failed");
  assert(after.includes("ack:route:governance-bridge"), "official governance bridge marked route was not restored");
  assert(after.includes("Local custom governance route"), "unmarked local RULE_PACKS row was not preserved");
  console.log("ok: governance bridge RULE_PACKS marker migration preserves local route");
}

function checkProjectIndexRealHeadings() {
  const project = install("project-index-h2");
  const indexPath = path.join(project, "dev", "PROJECT_INDEX.md");
  let text = read(indexPath);
  text = removeH2(text, "Installed Integrations");
  text = removeH2(text, "Tool Operation References");
  text = text.replace("## Local QC Commands", "A table mentions `## Installed Integrations` and `## Tool Operation References`, but these are not headings.\n\n```md\n## Installed Integrations\n## Tool Operation References\n```\n\n## Local QC Commands");
  writeFileSync(indexPath, text, "utf8");
  const result = cli(["upgrade", "--yes", "--root", project], "PROJECT_INDEX real-H2 migration");
  assert(result.stdout.includes("status: passed"), "real-H2 migration doctor failed");
  const after = read(indexPath);
  assert(realH2Count(after, "Installed Integrations") === 1 && realH2Count(after, "Tool Operation References") === 1, "lookalike headings blocked real section insertion");
  console.log("ok: PROJECT_INDEX ignores inline/fenced heading lookalikes");
}

function checkLifecycleCrossCheck() {
  const project = install("lifecycle");
  const handoff = path.join(project, "dev", "SESSION_HANDOFF.md");
  let text = read(handoff)
    .replace("1. TBD", "1. Completed the login redirect repair and verified the login redirect regression.")
    .replace("Recommended next step: TBD — reason: TBD", "Recommended next step: finish the login redirect repair — reason: the login redirect remains incomplete.")
    .replace("- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: TBD", "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: resolved");
  writeFileSync(handoff, text, "utf8");
  const negative = cli(["doctor", "--root", project], "lifecycle contradiction", { allowFailure: true });
  assert(negative.status !== 0 && output(negative).includes("resolved work overlaps unresolved carry-forward state"), "self-asserted resolution bypassed lifecycle cross-check");
  text = read(handoff).replace("Recommended next step: finish the login redirect repair — reason: the login redirect remains incomplete.", "Recommended next step: follow-up scope — monitor the login redirect when the production telemetry trigger fires; reason: the repair is complete.");
  writeFileSync(handoff, text, "utf8");
  assert(cli(["doctor", "--root", project], "lifecycle reclassification").stdout.includes("status: passed"), "explicit follow-up reclassification did not pass");

  const invalidConditions = [
    "follow-up scope — condition:",
    "follow-up scope — condition: TBD",
    "follow-up scope — no condition recorded",
    "follow-up scope — without condition",
    "follow-up scope — unconditional"
  ];
  for (const invalid of invalidConditions) {
    const invalidText = read(handoff).replace(/Recommended next step: follow-up scope[^\r\n]+/, `Recommended next step: ${invalid}; monitor the login redirect repair.`);
    writeFileSync(handoff, invalidText, "utf8");
    const invalidDoctor = cli(["doctor", "--root", project], `invalid lifecycle condition ${invalid}`, { allowFailure: true });
    assert(invalidDoctor.status !== 0 && output(invalidDoctor).includes("resolved work overlaps unresolved carry-forward state"), `${invalid} made lifecycle contradiction pass`);
    writeFileSync(handoff, text, "utf8");
  }

  text = read(handoff).replace(/Recommended next step: follow-up scope[^\r\n]+/, "Recommended next step: follow-up scope — condition: only if production telemetry regresses; monitor the login redirect repair.");
  writeFileSync(handoff, text, "utf8");
  assert(cli(["doctor", "--root", project], "literal condition reclassification").stdout.includes("status: passed"), "literal substantive condition did not pass");

  const openingConflict = read(handoff).replace("Resume the current objective.", "Resume the login redirect repair and finish the login redirect regression.");
  writeFileSync(handoff, openingConflict, "utf8");
  syncOpeningPrompt(project);
  const openingDoctor = cli(["doctor", "--root", project], "fenced opening lifecycle contradiction", { allowFailure: true });
  assert(openingDoctor.status !== 0 && output(openingDoctor).includes("resolved work overlaps unresolved carry-forward state"), "authoritative fenced opening-message contradiction made doctor pass");

  const scatterProject = install("lifecycle-scatter");
  const scatterHandoff = path.join(scatterProject, "dev", "SESSION_HANDOFF.md");
  const scatterText = read(scatterHandoff)
    .replace("1. TBD", "1. Completed the public audit and independent release review for the guide HTML.")
    .replace("Recommended next step: TBD — reason: TBD", "Recommended next step: prepare a public version page and HTML guide — reason: this is a separate productization task.")
    .replace("1. TBD", "1. Review the public page owner before release approval.")
    .replace("- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: TBD", "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: resolved");
  writeFileSync(scatterHandoff, scatterText, "utf8");
  assert(cli(["doctor", "--root", scatterProject], "large handoff scattered words").stdout.includes("status: passed"), "scattered generic words caused a lifecycle false positive");

  const shortCases = [
    ["two-character Chinese lifecycle", "完成部署", "Recommended next step: 繼續部署 — reason: 尚未完成"],
    ["three-character Chinese lifecycle", "完成發佈包", "Recommended next step: 繼續發佈包 — reason: 尚未完成"],
    ["short Chinese lifecycle", "完成登入修復", "Recommended next step: 繼續登入修復 — reason: 尚未完成"],
    ["short Chinese synonym and word-order lifecycle", "完成登入修復", "Recommended next step: 繼續修補登入 — reason: 登入問題仍未完成"],
    ["two-word English lifecycle", "Completed login repair", "Recommended next step: finish login repair — reason: still incomplete"]
  ];
  for (const [label, completed, pending] of shortCases) {
    const shortProject = install(label.replaceAll(" ", "-"));
    configureLifecycleFixture(shortProject, completed, pending);
    const shortDoctor = cli(["doctor", "--root", shortProject], label, { allowFailure: true });
    assert(shortDoctor.status !== 0 && output(shortDoctor).includes("resolved work overlaps unresolved carry-forward state"), `${label} contradiction made doctor pass`);
  }

  const unrelatedShortProject = install("unrelated-short-lifecycle");
  configureLifecycleFixture(unrelatedShortProject, "完成部署", "Recommended next step: 繼續備份 — reason: 尚未完成");
  assert(cli(["doctor", "--root", unrelatedShortProject], "unrelated short lifecycle").stdout.includes("status: passed"), "different short Chinese tasks caused a lifecycle false positive");

  const unrelatedRepairProject = install("unrelated-short-repair-lifecycle");
  configureLifecycleFixture(unrelatedRepairProject, "完成登入修復", "Recommended next step: 繼續修補備份 — reason: 備份仍未完成");
  assert(cli(["doctor", "--root", unrelatedRepairProject], "unrelated short repair lifecycle").stdout.includes("status: passed"), "repair synonym normalization merged different short Chinese tasks");

  const unrelatedEnglishProject = install("unrelated-two-word-lifecycle");
  configureLifecycleFixture(unrelatedEnglishProject, "Completed login repair", "Recommended next step: finish index cleanup — reason: still incomplete");
  assert(cli(["doctor", "--root", unrelatedEnglishProject], "unrelated two-word lifecycle").stdout.includes("status: passed"), "different two-word English tasks caused a lifecycle false positive");

  const shortFollowUpProject = install("short-follow-up-lifecycle");
  configureLifecycleFixture(shortFollowUpProject, "Completed login repair", "Recommended next step: follow-up scope — condition: only if production telemetry regresses; monitor login repair.");
  assert(cli(["doctor", "--root", shortFollowUpProject], "short follow-up lifecycle").stdout.includes("status: passed"), "substantive short-task follow-up reclassification did not pass");

  const largeBoundaryProject = install("large-boundary-lifecycle");
  const largeBoundaryHandoff = path.join(largeBoundaryProject, "dev", "SESSION_HANDOFF.md");
  const largeBoundaryText = read(largeBoundaryHandoff)
    .replace("1. TBD", "1. Completed the first EXP-014 implementation slice and rendered a populated project picture and first safe action without claiming persistence.")
    .replace("Recommended next step: TBD — reason: TBD", "Recommended next step: prepare the next data import — reason: it is the next independent task.")
    .replace("1. TBD", "1. Prepare only the next data import.")
    .replace("1. TBD", "1. Agent Handoff Kit candidate boundary: the gap is repaired, but no commit, public mirror update, release, or npm publish has occurred; released 0.3.38 remains unchanged until separately authorized.")
    .replace("- Checks run this session: TBD", "- Checks run this session: Passed release readiness and packed-package smoke tests. No commit, push, tag, release, npm publish, or mirror sync occurred.")
    .replace("- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: TBD", "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: resolved");
  writeFileSync(largeBoundaryHandoff, largeBoundaryText, "utf8");
  assert(cli(["doctor", "--root", largeBoundaryProject], "large boundary and owned opening boilerplate").stdout.includes("status: passed"), "negated release boundary or owned opening boilerplate caused a lifecycle false positive");
  console.log("ok: lifecycle high-confidence matching, substantive conditions, and fenced opening-message checks");
}

function configureLifecycleFixture(project, completed, pending) {
  const handoff = path.join(project, "dev", "SESSION_HANDOFF.md");
  const text = read(handoff)
    .replace("1. TBD", `1. ${completed}`)
    .replace("Recommended next step: TBD — reason: TBD", pending)
    .replace("- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: TBD", "- Completed / pending / risk / opening-message lifecycle conflicts resolved or explicitly reclassified: resolved");
  writeFileSync(handoff, text, "utf8");
}

function checkHistoricalSessionLogTemplateMigration() {
  const project = install("historical-session-log");
  const indexPath = path.join(project, "dev", "PROJECT_INDEX.md");
  writeFileSync(indexPath, read(indexPath).replace(`| Agent Handoff Kit template version | ${packageVersion} |`, "| Agent Handoff Kit template version | 0.3.38 |"), "utf8");
  const logPath = path.join(project, "dev", "SESSION_LOG.md");
  const historical = [
    "<!-- ack:log-entry:start -->\n## 2026-07-12 — Historical entry A\n\n- **QC:** passed\n\n```text\nWork in C:\\historical-project.\nRead AGENTS.md, then SESSION_HANDOFF.md and PROJECT_INDEX.md.\nThis is historical evidence, not the current opening message.\n```\n<!-- ack:log-entry:end -->",
    "<!-- ack:log-entry:start -->\n## 2026-07-11 — Historical entry B\n\n- **QC:** retained\n<!-- ack:log-entry:end -->"
  ].join("\n\n");
  const before = read(logPath).replace("<!-- ack:section:session-log-entry-template -->", `${historical}\n\n<!-- ack:section:session-log-entry-template -->`);
  writeFileSync(logPath, before, "utf8");
  const result = cli(["upgrade", "--yes", "--root", project], "historical SESSION_LOG template migration");
  const after = read(logPath);
  assert(result.stdout.includes("migration committed") && result.stdout.includes("status: passed"), "historical SESSION_LOG upgrade did not commit healthy");
  assert(after.includes(historical), "historical SESSION_LOG blocks were not preserved byte-for-byte");
  assert(count(after, "<!-- ack:log-entry:start -->") === 3 && count(after, "<!-- ack:log-entry:end -->") === 3, "historical SESSION_LOG marker pairs were removed or duplicated");
  assert(cli(["doctor", "--root", project], "historical SESSION_LOG doctor").stdout.includes("status: passed"), "doctor rejected legal historical log marker pairs");
  console.log("ok: historical SESSION_LOG marker blocks survive v0.3.38 upgrade byte-for-byte");
}

function checkMalformedSessionLogBoundary() {
  const project = install("malformed-session-log");
  const logPath = path.join(project, "dev", "SESSION_LOG.md");
  writeFileSync(logPath, `${read(logPath)}\n\n## Entry Template\n\n\`\`\`\`markdown\n<!-- ack:log-entry:start -->\n## fake\n<!-- ack:log-entry:end -->\n\`\`\`\`\n`, "utf8");
  const doctor = cli(["doctor", "--root", project], "malformed SESSION_LOG doctor", { allowFailure: true });
  assert(doctor.status !== 0 && output(doctor).includes("dev/SESSION_LOG.md"), "doctor accepted ambiguous current SESSION_LOG template sections");
  const before = governanceSnapshot(project);
  const upgrade = cli(["upgrade", "--yes", "--root", project], "malformed SESSION_LOG upgrade", { allowFailure: true });
  assert(upgrade.status !== 0 && output(upgrade).includes("SESSION_LOG.md lacks a unique trusted entry-template boundary"), "ambiguous SESSION_LOG template did not stop upgrade");
  assert(equalSnapshots(before, governanceSnapshot(project)), "ambiguous SESSION_LOG upgrade changed governance files");
  console.log("ok: malformed SESSION_LOG boundary fails doctor and upgrade with zero governance writes");
}

function syncOpeningPrompt(project) {
  const handoff = read(path.join(project, "dev", "SESSION_HANDOFF.md"));
  const markerIndex = handoff.indexOf("<!-- ack:section:next-session-opening-message -->");
  assert(markerIndex >= 0, "opening-message marker missing in test fixture");
  const match = /```text[^\r\n]*(?:\r\n?|\n)([\s\S]*?)(?:\r\n?|\n)```/.exec(handoff.slice(markerIndex));
  assert(match, "opening-message fence missing in test fixture");
  writeFileSync(path.join(project, "START_NEXT_SESSION_PROMPT.txt"), `${match[1]}\n`, "utf8");
}

function checkPromptThirdCopy() {
  const project = install("third-copy");
  const prompt = read(path.join(project, "START_NEXT_SESSION_PROMPT.txt")).trim();
  append(path.join(project, "dev", "SESSION_LOG.md"), `\n\n\`\`\`text\n${prompt}\n\`\`\`\n`);
  const doctor = cli(["doctor", "--root", project], "third prompt copy", { allowFailure: true });
  assert(doctor.status !== 0 && /third full copy|full opening-message copy/i.test(output(doctor)), "third full prompt copy made doctor pass");
  console.log("ok: third full prompt copy is rejected");
}

function exactHistoricalSafetyBytes() {
  const artifactFreshRoot = fresh("v038-exact-safety");
  materializeOfficialInstall("0.3.38", artifactFreshRoot);
  return readFileSync(path.join(artifactFreshRoot, "dev", "rules", "safety.md"));
}

function checkFaultRollback() {
  const project = install("fault-rollback");
  writeFileSync(path.join(project, "dev", "rules", "safety.md"), exactHistoricalSafetyBytes());
  const indexPath = path.join(project, "dev", "PROJECT_INDEX.md");
  writeFileSync(indexPath, read(indexPath).replace(`| Agent Handoff Kit template version | ${packageVersion} |`, "| Agent Handoff Kit template version | 0.3.38 |"), "utf8");
  const before = governanceSnapshot(project);
  const result = cli(["upgrade", "--yes", "--root", project], "fault rollback", { allowFailure: true, env: { AGENT_HANDOFF_KIT_QA_FAIL_AFTER_COMMIT: "1" } });
  assert(result.status !== 0 && output(result).includes("migration rolled back"), "fault injection did not trigger rollback");
  assert(equalSnapshots(before, governanceSnapshot(project)), "rollback did not restore exact governance target bytes");
  const journal = JSON.parse(read(latestJournal(project)));
  assert(journal.state === "rolled-back" && journal.committedVersion === null, "rolled-back journal retained a committed version");
  console.log("ok: mid-commit fault rolls back exact target bytes");
}

function prepareInterruptedReplacement(label) {
  const project = install(label);
  writeFileSync(path.join(project, "dev", "rules", "safety.md"), exactHistoricalSafetyBytes());
  const indexPath = path.join(project, "dev", "PROJECT_INDEX.md");
  writeFileSync(indexPath, read(indexPath).replace(`| Agent Handoff Kit template version | ${packageVersion} |`, "| Agent Handoff Kit template version | 0.3.38 |"), "utf8");
  const before = governanceSnapshot(project);
  const interrupted = cli(["upgrade", "--yes", "--root", project], `${label} replacement interruption`, {
    allowFailure: true,
    env: { AGENT_HANDOFF_KIT_QA_INTERRUPT_AFTER_REPLACE: "1" }
  });
  assert(interrupted.status !== 0 && output(interrupted).includes("before journal update"), "replacement/journal interruption did not stop in the intended window");
  const journalPath = latestJournal(project);
  const journal = JSON.parse(read(journalPath));
  const lockPath = path.join(project, "dev", "governance_migrations", ".upgrade.lock");
  assert(journal.state === "committing" && journal.entries.every((entry) => entry.committed === false), "interruption fixture unexpectedly persisted a committed flag");
  assert(existsSync(lockPath), "replacement interruption did not retain the recovery lock");
  assert(!equalSnapshots(before, governanceSnapshot(project)), "replacement interruption did not leave the intended candidate-hash target");
  return { project, before, journalPath, journal, lockPath };
}

function checkReplacementBeforeJournalRecovery() {
  const fixture = prepareInterruptedReplacement("replace-before-journal");
  const changedEntry = fixture.journal.entries.find((entry) => {
    const target = readOptionalBuffer(path.join(fixture.project, entry.targetRel));
    return target && sha(target) === entry.afterHash;
  });
  assert(changedEntry, "could not identify the target replaced before journal persistence");
  const link = path.join(qaTmp, `ack-v041-pending-junction-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  try {
    symlinkSync(fixture.project, link, process.platform === "win32" ? "junction" : "dir");
    const beforeJunctionAttempt = fullSnapshot(fixture.project);
    const junctionAttempt = cli(["upgrade", "--yes", "--root", link], "pending transaction through junction", { allowFailure: true });
    assert(junctionAttempt.status !== 0 && output(junctionAttempt).includes("symbolic link or junction"), "pending recovery through a junction was not blocked before recovery");
    assert(equalSnapshots(beforeJunctionAttempt, fullSnapshot(fixture.project)) && existsSync(fixture.lockPath), "junction-root rejection recovered or changed the pending transaction before root validation");
  } catch (error) {
    if (!["EPERM", "EACCES", "ENOTSUP"].includes(error?.code)) throw error;
    console.log(`skip: pending transaction junction pre-recovery guard (${error.code}; runtime cannot create test link)`);
  }
  writeFileSync(path.join(fixture.project, "CLAUDE.md"), "# Project-owned Claude instructions\n\nStop the next plan after recovery.\n", "utf8");
  const recovered = cli(["upgrade", "--yes", "--root", fixture.project], "replacement-window recovery", { allowFailure: true });
  assert(recovered.status !== 0 && output(recovered).includes("recovered interrupted upgrade"), "normal upgrade did not report interrupted replacement recovery");
  const restored = readOptionalBuffer(path.join(fixture.project, changedEntry.targetRel));
  assert(restored && sha(restored) === fixture.before.get(changedEntry.targetRel), "replacement-window recovery did not restore the pre-transaction target");
  assert(!existsSync(fixture.lockPath), "successful replacement-window recovery retained the transaction lock");
  console.log("ok: replacement before journal update is recovered by hashes, not the committed flag");
}

function checkRecoveryArtifactValidation() {
  const escaped = prepareInterruptedReplacement("recovery-path-escape");
  escaped.journal.entries[0].targetRel = path.join("..", "outside-governance.md");
  writeFileSync(escaped.journalPath, `${JSON.stringify(escaped.journal, null, 2)}\n`, "utf8");
  const escapedBefore = governanceSnapshot(escaped.project);
  const escapedResult = cli(["upgrade", "--yes", "--root", escaped.project], "recovery path escape", { allowFailure: true });
  assert(escapedResult.status !== 0 && /unknown or duplicated|escapes selected root/.test(output(escapedResult)), "recovery accepted an escaping journal target");
  assert(existsSync(escaped.lockPath) && equalSnapshots(escapedBefore, governanceSnapshot(escaped.project)), "invalid recovery path changed targets or removed the lock");

  const corrupted = prepareInterruptedReplacement("recovery-backup-corrupt");
  const backedEntry = corrupted.journal.entries.find((entry) => entry.existed && entry.backupRel);
  assert(backedEntry, "backup-corruption fixture has no existing target entry");
  writeFileSync(path.join(corrupted.project, backedEntry.backupRel), "CORRUPTED BACKUP\n", "utf8");
  const corruptedBefore = governanceSnapshot(corrupted.project);
  const corruptedResult = cli(["upgrade", "--yes", "--root", corrupted.project], "recovery backup corruption", { allowFailure: true });
  assert(corruptedResult.status !== 0 && output(corruptedResult).includes("backup hash does not match"), "recovery accepted a corrupted backup");
  assert(existsSync(corrupted.lockPath) && equalSnapshots(corruptedBefore, governanceSnapshot(corrupted.project)), "corrupted-backup recovery changed targets or removed the lock");

  const staged = prepareInterruptedReplacement("recovery-stage-corrupt");
  const stagedEntry = staged.journal.entries[0];
  writeFileSync(path.join(path.dirname(staged.journalPath), "stage", stagedEntry.targetRel), "CORRUPTED STAGE\n", "utf8");
  const stagedBefore = governanceSnapshot(staged.project);
  const stagedResult = cli(["upgrade", "--yes", "--root", staged.project], "recovery stage corruption", { allowFailure: true });
  assert(stagedResult.status !== 0 && output(stagedResult).includes("stage hash does not match"), "recovery accepted a corrupted stage");
  assert(existsSync(staged.lockPath) && equalSnapshots(stagedBefore, governanceSnapshot(staged.project)), "corrupted-stage recovery changed targets or removed the lock");

  for (const kind of ["stage", "backup"]) {
    const linked = prepareInterruptedReplacement(`recovery-${kind}-junction`);
    const originalDir = path.join(path.dirname(linked.journalPath), kind);
    const movedDir = path.join(qaTmp, `ack-v041-${kind}-outside-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    try {
      renameSync(originalDir, movedDir);
      symlinkSync(movedDir, originalDir, process.platform === "win32" ? "junction" : "dir");
    } catch (error) {
      if (["EPERM", "EACCES", "ENOTSUP"].includes(error?.code)) {
        console.log(`skip: ${kind} root junction recovery guard (${error.code}; runtime cannot create test link)`);
        continue;
      }
      throw error;
    }
    const linkedBefore = governanceSnapshot(linked.project);
    const linkedResult = cli(["upgrade", "--yes", "--root", linked.project], `${kind} root junction recovery`, { allowFailure: true });
    assert(linkedResult.status !== 0 && output(linkedResult).includes("transaction directories or journal are missing or unsafe"), `recovery accepted a ${kind} root junction`);
    assert(existsSync(linked.lockPath) && equalSnapshots(linkedBefore, governanceSnapshot(linked.project)), `${kind} root junction recovery changed targets or removed the lock`);
  }

  const thirdState = prepareInterruptedReplacement("recovery-third-state");
  const changed = thirdState.journal.entries.find((entry) => {
    const target = readOptionalBuffer(path.join(thirdState.project, entry.targetRel));
    return target && sha(target) === entry.afterHash;
  });
  assert(changed, "third-state fixture could not identify the replaced target");
  writeFileSync(path.join(thirdState.project, changed.targetRel), "USER THIRD-STATE CONTENT\n", "utf8");
  const thirdBefore = governanceSnapshot(thirdState.project);
  const thirdResult = cli(["upgrade", "--yes", "--root", thirdState.project], "recovery third state", { allowFailure: true });
  assert(thirdResult.status !== 0 && output(thirdResult).includes("third-state edits"), "recovery did not stop on third-state target content");
  assert(existsSync(thirdState.lockPath) && equalSnapshots(thirdBefore, governanceSnapshot(thirdState.project)), "third-state recovery changed targets or removed the lock");
  console.log("ok: recovery rejects junction roots, escaping targets, corrupted stage/backup, and third-state content with zero target writes");
}

function checkCommittedRecoveryRebuildsReport() {
  const project = install("committed-recovery");
  writeFileSync(path.join(project, "dev", "rules", "safety.md"), exactHistoricalSafetyBytes());
  const indexPath = path.join(project, "dev", "PROJECT_INDEX.md");
  writeFileSync(indexPath, read(indexPath).replace(`| Agent Handoff Kit template version | ${packageVersion} |`, "| Agent Handoff Kit template version | 0.3.38 |"), "utf8");
  const interrupted = cli(["upgrade", "--yes", "--root", project], "committed journal interruption", {
    allowFailure: true,
    env: { AGENT_HANDOFF_KIT_QA_INTERRUPT_AFTER_JOURNAL_COMMIT: "1" }
  });
  assert(interrupted.status !== 0 && output(interrupted).includes("QA interruption after committed journal"), "committed-journal interruption did not stop in the intended window");
  const journalPath = latestJournal(project);
  const migrationDir = path.dirname(journalPath);
  const lockPath = path.join(project, "dev", "governance_migrations", ".upgrade.lock");
  const journal = JSON.parse(read(journalPath));
  assert(journal.state === "committed" && journal.committedVersion === packageVersion, "interrupted committed journal lost its committed version");
  assert(existsSync(lockPath) && !existsSync(path.join(migrationDir, "migration-report.md")), "fault fixture did not preserve the committed-journal/report gap");

  const beforeDryRun = fullSnapshot(project);
  const dryRun = cli(["upgrade", "--dry-run", "--root", project], "pending-transaction dry-run", { allowFailure: true });
  assert(dryRun.status !== 0 && output(dryRun).includes("dry-run blocked") && output(dryRun).includes("no files written"), "dry-run did not block read-only on a pending transaction");
  assert(equalSnapshots(beforeDryRun, fullSnapshot(project)), "dry-run recovered or changed a pending transaction");

  const recovered = cli(["upgrade", "--yes", "--root", project], "committed report recovery");
  assert(recovered.stdout.includes("recovered committed upgrade"), "normal upgrade did not report committed transaction recovery");
  assert(!existsSync(lockPath), "committed recovery did not remove the transaction lock");
  const reportText = read(path.join(migrationDir, "migration-report.md"));
  assert(reportText.includes(`- Committed version: ${packageVersion}`) && reportText.includes("- Transaction state: committed"), "committed recovery did not rebuild a truthful report");
  assert(cli(["doctor", "--root", project], "committed recovery doctor").stdout.includes("status: passed"), "committed recovery project health failed");
  console.log("ok: committed recovery rebuilds the report while dry-run remains read-only");
}

function checkIdempotency() {
  const project = install("idempotent");
  const first = cli(["upgrade", "--yes", "--root", project], "idempotent first upgrade");
  const before = governanceSnapshot(project);
  const second = cli(["upgrade", "--yes", "--root", project], "idempotent second upgrade");
  assert(first.status === 0 && second.stdout.includes("沒有檔案需要建立或合併"), "second upgrade was not a no-op");
  assert(equalSnapshots(before, governanceSnapshot(project)), "idempotent no-op changed governance targets");
  console.log("ok: repeated upgrade is idempotent");
}

function install(label) {
  const project = fresh(label);
  cli(["init", "--yes", "--root", project], `${label} bootstrap`);
  return project;
}

function fresh(label) {
  const project = path.join(qaTmp, `ack-v039-${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(project, { recursive: true });
  return project;
}

function cli(args, label, options = {}) {
  const result = spawnSync(process.execPath, ["bin/agent-handoff-kit.mjs", ...args], {
    cwd: root,
    encoding: "utf8",
    input: options.input,
    env: { ...process.env, ...(options.env ?? {}) }
  });
  if (!options.allowFailure && (result.error || result.status !== 0)) throw new Error(`${label} failed\n${output(result)}`);
  return result;
}

function readOptionalBuffer(file) { try { return readFileSync(file); } catch { return null; } }

function governanceSnapshot(project) {
  const files = [];
  walk(project, project, files);
  return new Map(files.filter((relative) => /^(AGENTS\.md|CLAUDE\.md|GEMINI\.md|START_NEXT_SESSION_PROMPT\.txt|dev\/(?!governance_migrations\/).*)$/.test(relative)).map((relative) => [relative, sha(readFileSync(path.join(project, relative)))]));
}

function fullSnapshot(project) {
  const files = [];
  walk(project, project, files);
  return new Map(files.map((relative) => [relative, sha(readFileSync(path.join(project, relative)))]));
}

function walk(base, current, files) {
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) walk(base, absolute, files);
    else if (entry.isFile()) files.push(path.relative(base, absolute).replaceAll(path.sep, "/"));
  }
}

function latestReport(project) {
  const rootDir = path.join(project, "dev", "governance_migrations");
  const reports = [];
  collectReports(rootDir, reports);
  assert(reports.length > 0, "migration report missing");
  return reports.sort((a, b) => statSync(a).mtimeMs - statSync(b).mtimeMs).at(-1);
}

function latestJournal(project) {
  const rootDir = path.join(project, "dev", "governance_migrations");
  const journals = [];
  collectNamedFiles(rootDir, "transaction.json", journals);
  assert(journals.length > 0, "transaction journal missing");
  return journals.sort((a, b) => statSync(a).mtimeMs - statSync(b).mtimeMs).at(-1);
}

function collectNamedFiles(dir, name, files) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) collectNamedFiles(absolute, name, files);
    else if (entry.isFile() && entry.name === name) files.push(absolute);
  }
}

function collectReports(dir, reports) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) collectReports(absolute, reports);
    else if (entry.isFile() && entry.name === "migration-report.md") reports.push(absolute);
  }
}

function removeH2(text, title) {
  const pattern = new RegExp(`^## ${escapeRegExp(title)}\\s*$`, "m");
  const match = pattern.exec(text);
  if (!match) return text;
  const next = /^## [^#].*$/m.exec(text.slice(match.index + match[0].length));
  const end = next ? match.index + match[0].length + next.index : text.length;
  return `${text.slice(0, match.index)}${text.slice(end)}`;
}

function realH2Count(text, title) {
  const withoutFences = text.replace(/```[\s\S]*?```/g, "").replace(/<!--[\s\S]*?-->/g, "");
  return (withoutFences.match(new RegExp(`^## ${escapeRegExp(title)}\\s*$`, "gm")) ?? []).length;
}

function compareVersions(left, right) {
  const a = left.slice(1).split(".").map(Number);
  const b = right.slice(1).split(".").map(Number);
  for (let index = 0; index < 3; index += 1) if (a[index] !== b[index]) return a[index] - b[index];
  return 0;
}

function append(file, text) { writeFileSync(file, `${read(file)}${text}`, "utf8"); }
function read(file) { return readFileSync(file, "utf8"); }
function sha(buffer) { return createHash("sha256").update(buffer).digest("hex"); }
function count(text, needle) { return text.split(needle).length - 1; }
function output(result) { return `${result.stdout ?? ""}\n${result.stderr ?? ""}`; }
function equalSnapshots(left, right) { return left.size === right.size && [...left].every(([key, value]) => right.get(key) === value); }
function escapeRegExp(text) { return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function assert(condition, message) { if (!condition) throw new Error(message); }
