#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { tmpdir as systemTmpdir } from "node:os";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { installedFileContracts, requiredInstalledTargets } from "../bin/installed-file-contract.mjs";
import { canonicalizeOfficialText, loadOfficialOriginCatalog } from "../bin/official-origin-catalog.mjs";
import { markdownVisibleLinesOutsideHiddenBlocks, materializeProjectIndexTemplateVersion, parseProjectIndexTemplateVersion } from "../bin/upgrade-inventory.mjs";

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
  assertCliEnvDisablesUpdateNotice();
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
  checkHistoricalProjectIndexAuthorizedTransforms();
  checkV038HeadedAppendixProtection();
  checkRulePacksMarkerMerge();
  checkProjectIndexRealHeadings();
  checkProjectIndexHiddenGovernanceFalseClose();
  checkHistoricalSessionLogTemplateMigration();
  checkMalformedSessionLogBoundary();
  checkPromptThirdCopy();
  checkFaultRollback();
  checkReplacementBeforeJournalRecovery();
  checkRecoveryArtifactValidation();
  checkCommittedRecoveryRebuildsReport();
  checkLongLivedLifecycleIgnoresHistoricalReceipts();
  checkIdempotency();
  console.log("");
  console.log("Agent Handoff Kit upgrade safety QA passed");
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
  assert(output(result).includes("你不用判斷技術差異"), "formal conflict did not keep technical judgement away from users");
  assert(output(result).includes("能讀寫這個資料夾的 AI"), "formal conflict did not route repair to the project AI");
  assert(output(result).includes("授權合併"), "formal conflict did not require authorized semantic repair");
  assert(output(result).includes("doctor 與 hash 讀回驗收"), "formal conflict did not require doctor plus hash/readback validation");
  assert(output(result).includes("未知本地 hash 只作內容 witness"), "formal conflict did not classify unknown hash as witness only");
  for (const forbidden of ["Kit 開發者", "可讀取專案的 AI", "可讀取檔案的 AI", "support local hash", "支援本地 hash", "maintainer local-hash"]) {
    assert(!output(result).includes(forbidden), `formal conflict retained stale repair route: ${forbidden}`);
  }
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
    assertRequiredFixtureFiles(project, `single-hop ${version} upgrade`, result);
    const doctor = cli(["doctor", "--root", project], `single-hop ${version} doctor`, {
      env: { AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "1" }
    });
    assert(doctor.stdout.includes("status: passed"), `${version} single-hop doctor did not pass\nupgrade output:\n${output(result)}\ndoctor output:\n${output(doctor)}`);
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
  const authorizedLifecycleTargets = new Set([
    "AGENTS.md",
    "START_NEXT_SESSION_PROMPT.txt",
    "dev/SESSION_HANDOFF.md",
    "dev/SESSION_LOG.md",
    "dev/PROJECT_INDEX.md",
    "dev/RULE_PACKS.md",
    "dev/rules/safety.md",
    "dev/rules/communication.md",
    "dev/rules/onboarding.md",
    "dev/rules/integrations.md"
  ]);
  for (const [targetRel, before] of crlfBefore) {
    if (targetRel === "dev/PROJECT_INDEX.md") {
      const afterText = read(path.join(crlfProject, targetRel));
      const beforeText = before.toString("utf8");
      assert(parseProjectIndexTemplateVersion(beforeText) === "0.3.35", "CRLF fixture PROJECT_INDEX did not expose the old Stack version");
      assert(realH2Count(beforeText, "Installed Integrations") === 1, "CRLF fixture PROJECT_INDEX did not start with one Installed Integrations section");
      assert(realH2Count(beforeText, "Tool Operation References") === 0, "CRLF fixture PROJECT_INDEX unexpectedly started with Tool Operation References");
      assert(parseProjectIndexTemplateVersion(afterText) === packageVersion, "CRLF fixture PROJECT_INDEX did not materialize the current Stack version");
      assert(realH2Count(afterText, "Installed Integrations") === 1, "CRLF fixture PROJECT_INDEX lost the Installed Integrations section");
      assert(realH2Count(afterText, "Tool Operation References") === 1, "CRLF fixture PROJECT_INDEX did not insert exactly one Tool Operation References section");
      assert(!afterText.replace(/\r\n/g, "").includes("\n"), "CRLF fixture PROJECT_INDEX contains bare LF after migration");
      const reversed = materializeProjectIndexTemplateVersion(removeH2(afterText, "Tool Operation References"), "0.3.35");
      assert(reversed === beforeText, "CRLF fixture PROJECT_INDEX changed bytes outside the version row and Tool Operation References insertion");
      continue;
    }
    if (authorizedLifecycleTargets.has(targetRel)) {
      assert(readFileSync(path.join(crlfProject, targetRel)).length > 0, `authorized lifecycle target became empty: ${targetRel}`);
      continue;
    }
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
  console.log("ok: CRLF official files upgrade through current lifecycle; forged or missing baselines cannot authorize custom-rule merge");
}

function checkHistoricalProjectIndexAuthorizedTransforms() {
  const v031Project = fresh("v031-project-index-authorized-transforms");
  materializeOfficialInstall("0.3.1", v031Project);
  const v031IndexPath = path.join(v031Project, "dev", "PROJECT_INDEX.md");
  const v031BeforeText = read(v031IndexPath);
  const v031BeforeVersion = parseProjectIndexTemplateVersion(v031BeforeText);
  assert(v031BeforeVersion === "0.1.7", "v0.3.1 fixture PROJECT_INDEX did not expose its historical Stack version");
  assert(realH2Count(v031BeforeText, "Installed Integrations") === 1, "v0.3.1 fixture PROJECT_INDEX did not start with one Installed Integrations section");
  assert(realH2Count(v031BeforeText, "Tool Operation References") === 0, "v0.3.1 fixture PROJECT_INDEX unexpectedly started with Tool Operation References");
  assert(v031BeforeText.includes("### Connectors（Anthropic 官方 vetted）"), "v0.3.1 fixture lacks the legacy connector heading text");
  const v031Upgrade = cli(["upgrade", "--yes", "--root", v031Project], "v0.3.1 PROJECT_INDEX authorized transform upgrade");
  assert(v031Upgrade.stdout.includes("status: passed"), "v0.3.1 authorized PROJECT_INDEX transform did not pass doctor");
  const v031AfterText = read(v031IndexPath);
  assert(parseProjectIndexTemplateVersion(v031AfterText) === packageVersion, "v0.3.1 PROJECT_INDEX did not materialize the current Stack version");
  assert(realH2Count(v031AfterText, "Installed Integrations") === 1, "v0.3.1 PROJECT_INDEX lost Installed Integrations");
  assert(realH2Count(v031AfterText, "Tool Operation References") === 1, "v0.3.1 PROJECT_INDEX did not insert Tool Operation References");
  assert(v031AfterText.includes("### Connectors（Anthropic 官方 vetted）"), "v0.3.1 PROJECT_INDEX normalized a legacy pre-existing connector heading");
  const v031Reversed = materializeProjectIndexTemplateVersion(removeH2(v031AfterText, "Tool Operation References"), v031BeforeVersion);
  assert(v031Reversed === v031BeforeText, "v0.3.1 PROJECT_INDEX changed bytes outside Tool Operation References insertion and Stack version-row materialization");

  const gapProject = fresh("v031-project-index-gap-preservation");
  materializeOfficialInstall("0.3.1", gapProject);
  const gapIndexPath = path.join(gapProject, "dev", "PROJECT_INDEX.md");
  const gapSentinel = "CUSTOM_GAP_SENTINEL  \n\n\n";
  let gapBeforeText = read(gapIndexPath);
  const gapBeforeVersion = parseProjectIndexTemplateVersion(gapBeforeText);
  assert(gapBeforeVersion === "0.1.7", "v0.3.1 gap fixture PROJECT_INDEX did not expose its historical Stack version");
  assert(realH2Count(gapBeforeText, "Tool Operation References") === 0, "v0.3.1 gap fixture unexpectedly started with Tool Operation References");
  gapBeforeText = gapBeforeText.replace("## Local QC Commands", `${gapSentinel}## Local QC Commands`);
  writeFileSync(gapIndexPath, gapBeforeText, "utf8");
  const gapBeforeBytes = readFileSync(gapIndexPath);
  const gapUpgrade = cli(["upgrade", "--yes", "--root", gapProject], "v0.3.1 PROJECT_INDEX gap preservation");
  assert(gapUpgrade.stdout.includes("status: passed"), "v0.3.1 gap preservation PROJECT_INDEX transform did not pass doctor");
  const gapAfterText = read(gapIndexPath);
  assert(gapAfterText.includes(gapSentinel), "v0.3.1 PROJECT_INDEX gap sentinel bytes were not preserved");
  const gapReversed = materializeProjectIndexTemplateVersion(removeH2(gapAfterText, "Tool Operation References"), gapBeforeVersion);
  assert(Buffer.from(gapReversed, "utf8").equals(gapBeforeBytes), "v0.3.1 PROJECT_INDEX gap fixture changed bytes outside Tool Operation References insertion and Stack version-row materialization");

  const customProject = install("project-index-custom-credential-text");
  const customIndexPath = path.join(customProject, "dev", "PROJECT_INDEX.md");
  const customLiteral = "Former normalization literal retained as local content: ### Connectors（Anthropic 官方 vetted）";
  let customBeforeText = materializeProjectIndexTemplateVersion(read(customIndexPath), "0.3.38");
  customBeforeText = customBeforeText.replace("## Workspace Identity", `## Local Project Notes\n\n${customLiteral}\n\n## Workspace Identity`);
  writeFileSync(customIndexPath, customBeforeText, "utf8");
  const customUpgrade = cli(["upgrade", "--yes", "--root", customProject], "PROJECT_INDEX custom credential-normalization literal");
  assert(customUpgrade.stdout.includes("status: passed"), "custom PROJECT_INDEX literal upgrade did not pass doctor");
  const customAfterText = read(customIndexPath);
  assert(customAfterText === materializeProjectIndexTemplateVersion(customBeforeText, packageVersion), "custom PROJECT_INDEX text changed outside the shared Stack version-row materializer");
  assert(customAfterText.includes(customLiteral), "custom former credential-normalization literal was not preserved exactly");

  const mixedFenceProject = install("project-index-mixed-fence-visible");
  const mixedIndexPath = path.join(mixedFenceProject, "dev", "PROJECT_INDEX.md");
  const mixedLine = "```~ mixed invalid fence opener remains ordinary visible text";
  let mixedBeforeText = materializeProjectIndexTemplateVersion(read(mixedIndexPath), "0.3.38");
  mixedBeforeText = mixedBeforeText.replace("## Stack", `${mixedLine}\n\n## Stack`);
  writeFileSync(mixedIndexPath, mixedBeforeText, "utf8");
  assert(markdownVisibleLinesOutsideHiddenBlocks(mixedBeforeText).some((line) => line.text === mixedLine), "mixed backtick/tilde line was treated as a fence opener");
  assert(parseProjectIndexTemplateVersion(mixedBeforeText) === "0.3.38", "mixed invalid fence line hid the real Stack version row");
  assert(realH2Count(mixedBeforeText, "Tool Operation References") === 1 && realH2Count(mixedBeforeText, "Local QC Commands") === 1, "mixed invalid fence line hid real PROJECT_INDEX governance sections");
  const mixedUpgrade = cli(["upgrade", "--yes", "--root", mixedFenceProject], "PROJECT_INDEX mixed invalid fence line");
  assert(mixedUpgrade.stdout.includes("status: passed"), "mixed invalid fence line made upgrade/doctor false-block");
  const mixedAfterText = read(mixedIndexPath);
  assert(mixedAfterText === materializeProjectIndexTemplateVersion(mixedBeforeText, packageVersion), "mixed invalid fence line fixture changed bytes outside the shared Stack version-row materializer");
  assert(mixedAfterText.includes(mixedLine), "mixed invalid fence line bytes were not preserved");
  assert(cli(["doctor", "--root", mixedFenceProject], "PROJECT_INDEX mixed invalid fence doctor").stdout.includes("status: passed"), "mixed invalid fence line made doctor false-block after upgrade");

  console.log("ok: PROJECT_INDEX legal transforms are limited to missing Kit sections plus Stack version row");
}

function checkV038HeadedAppendixProtection() {
  const project = fresh("v038-headed-appendix-protection");
  materializeOfficialInstall("0.3.38", project);
  const target = "dev/rules/integrations.md";
  const localAppendix = Buffer.from("\n## Local Project Rules\n\nPreserve the signed-in user browser profile.\n", "utf8");
  append(path.join(project, target), localAppendix.toString("utf8"));
  const rawBefore = readFileSync(path.join(project, target));
  const result = cli(["upgrade", "--yes", "--root", project], "v0.3.38 headed appendix preservation transaction");
  assert(result.status === 0 && output(result).includes("migration committed") && output(result).includes("project health: passed"), "headed appendix did not complete a same-readback preservation transaction");
  const rawAfter = readFileSync(path.join(project, target));
  assert(rawAfter.indexOf(localAppendix) >= 0, "headed appendix preservation transaction lost local appendix bytes");
  const journal = JSON.parse(read(latestJournal(project)));
  const entry = journal.entries.find((item) => item.targetRel === target);
  assert(entry?.beforeHash === sha(rawBefore) && entry.afterHash === sha(rawAfter) && entry.beforeHash !== entry.afterHash, "headed appendix transaction did not disclose the bounded lifecycle merge identity");
  assert(entry.reason.includes("integrations") || entry.reason.includes("semantic position"), "headed appendix transaction reason did not disclose integrations lifecycle merge");
  assert(!journal.runtimeAcceptance && !journal.currentStateWitness, "headed appendix transaction created future authority witness fields");
  console.log("ok: headed appendix local bytes survive integrations lifecycle merge without future authority");
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

function checkProjectIndexHiddenGovernanceFalseClose() {
  for (const variant of [
    { label: "backtick-short-close", opener: "````", invalidClose: "```" },
    { label: "tilde-trailing-close", opener: "~~~~", invalidClose: "~~~~ trailing text" }
  ]) {
    const project = install(`project-index-${variant.label}`);
    const indexPath = path.join(project, "dev", "PROJECT_INDEX.md");
    const current = read(indexPath);
    const hiddenStart = current.indexOf("\n## Tool Operation References");
    assert(hiddenStart >= 0, `${variant.label} fixture lacks Tool Operation References`);
    const hidden = `${current.slice(0, hiddenStart + 1)}${variant.opener}\n${current.slice(hiddenStart + 1)}\n${variant.invalidClose}\n`;
    writeFileSync(indexPath, hidden, "utf8");
    assert(realH2Count(hidden, "Tool Operation References") === 0 && realH2Count(hidden, "Local QC Commands") === 0, `${variant.label} false close did not hide governance headings`);
    const beforeSnapshot = fullSnapshot(project);
    const beforeBytes = readFileSync(indexPath);
    const doctor = cli(["doctor", "--root", project], `${variant.label} hidden PROJECT_INDEX doctor`, { allowFailure: true });
    assert(doctor.status !== 0 && output(doctor).includes("Installed Integrations and Tool Operation References"), `${variant.label} hidden PROJECT_INDEX doctor did not fail closed`);
    const upgrade = cli(["upgrade", "--yes", "--root", project], `${variant.label} hidden PROJECT_INDEX upgrade`, { allowFailure: true });
    assert(upgrade.status !== 0 && output(upgrade).includes("PROJECT_INDEX.md must contain unique real H2 governance sections"), `${variant.label} hidden PROJECT_INDEX upgrade did not fail closed`);
    assert(readFileSync(indexPath).equals(beforeBytes), `${variant.label} hidden PROJECT_INDEX upgrade changed target bytes`);
    assert(equalSnapshots(beforeSnapshot, fullSnapshot(project)), `${variant.label} hidden PROJECT_INDEX upgrade or doctor wrote files`);
    assert(!output(upgrade).includes("migration committed") && !output(upgrade).includes("project health: passed"), `${variant.label} hidden PROJECT_INDEX upgrade reported success`);
  }
  console.log("ok: PROJECT_INDEX long-fence false closes hide governance sections and fail closed with zero writes");
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

function checkLongLivedLifecycleIgnoresHistoricalReceipts() {
  const project = install("long-lived-lifecycle");
  const indexPath = path.join(project, "dev", "PROJECT_INDEX.md");
  writeFileSync(indexPath, materializeProjectIndexTemplateVersion(read(indexPath), "0.3.53"), "utf8");
  const first = cli(["upgrade", "--yes", "--root", project], "long-lived lifecycle first upgrade");
  assert(first.stdout.includes("migration committed") || first.stdout.includes("沒有檔案需要建立或合併"), "first long-lived lifecycle upgrade did not finish truthfully");
  const migrationsRoot = path.join(project, "dev", "governance_migrations");
  mkdirSync(path.join(migrationsRoot, "old-malformed-committed"), { recursive: true });
  writeFileSync(path.join(migrationsRoot, "old-malformed-committed", "transaction.json"), "{ malformed historical receipt\n", "utf8");

  append(path.join(project, "dev", "SESSION_LOG.md"), "\n<!-- QA long-lived lifecycle mutable state edit -->\n");
  append(path.join(project, "dev", "rules", "agent-governance.md"), "\n<!-- QA valid rule-pack mutable edit -->\n");
  mkdirSync(path.join(project, "docs"), { recursive: true });
  mkdirSync(path.join(project, "outputs"), { recursive: true });
  mkdirSync(path.join(project, "notes", "繁中"), { recursive: true });
  writeFileSync(path.join(project, "docs", "ordinary.md"), "# Ordinary workspace file\n", "utf8");
  writeFileSync(path.join(project, "outputs", "普通輸出.txt"), "ordinary output\n", "utf8");
  writeFileSync(path.join(project, "notes", "繁中", "新檔案.txt"), "unicode ordinary file\n", "utf8");

  const doctor = cli(["doctor", "--root", project], "long-lived lifecycle doctor after normal edits");
  assert(doctor.stdout.includes("status: passed"), `doctor did not ignore malformed historical receipt or ordinary workspace files\n${output(doctor)}`);
  assert(!doctor.stdout.includes("ordinary.md") && !doctor.stdout.includes("普通輸出"), "doctor reported ordinary workspace files");
  const dryRun = cli(["upgrade", "--dry-run", "--root", project], "long-lived lifecycle second dry-run");
  assert(dryRun.stdout.includes("dry-run: no files written"), "second dry-run did not remain read-only");
  const second = cli(["upgrade", "--yes", "--root", project], "long-lived lifecycle second upgrade");
  assert(second.stdout.includes("沒有檔案需要建立或合併") || second.stdout.includes("migration committed"), "second long-lived lifecycle upgrade did not finish truthfully");
  const finalDoctor = cli(["doctor", "--root", project], "long-lived lifecycle final doctor");
  assert(finalDoctor.stdout.includes("status: passed"), "final long-lived lifecycle doctor failed");
  console.log("ok: long-lived lifecycle ignores malformed historical receipt and ordinary workspace files are inert");
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
  const result = cli(["init", "--yes", "--root", project], `${label} bootstrap`);
  assertRequiredFixtureFiles(project, `${label} bootstrap`, result);
  return project;
}

function assertRequiredFixtureFiles(project, label, result = null, required = requiredInstalledTargets) {
  const missing = required.filter((relative) => !existsSync(path.join(project, relative)));
  if (missing.length === 0) return;
  const devDir = path.join(project, "dev");
  const shape = existsSync(devDir) ? readdirSync(devDir).join(", ") : "<no dev>";
  const terminal = result ? `\nterminal output:\n${output(result)}` : "";
  throw new Error(`${label} missing required fixture files before downstream read\nroot: ${project}\nmissing:\n${missing.map((item) => `- ${item}`).join("\n")}\ndev shape: ${shape}${terminal}`);
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
    env: buildCliEnv(options.env)
  });
  if (!options.allowFailure && (result.error || result.status !== 0)) throw new Error(`${label} failed\n${output(result)}`);
  if (!options.allowFailure) assertWriteCommandTerminalResult(args, label, result);
  return result;
}

function buildCliEnv(overrides = {}) {
  return { ...process.env, AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "1", ...overrides };
}

function assertCliEnvDisablesUpdateNotice() {
  const env = buildCliEnv();
  assert(env.AGENT_HANDOFF_KIT_NO_UPDATE_CHECK === "1", "cli wrapper did not disable update notice by default");
  const overridden = buildCliEnv({ AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "0" });
  assert(overridden.AGENT_HANDOFF_KIT_NO_UPDATE_CHECK === "0", "cli wrapper does not preserve explicit env overrides");
}

function assertWriteCommandTerminalResult(args, label, result) {
  const command = args[0];
  if (!["init", "upgrade"].includes(command) || args.includes("--dry-run")) return;
  const text = output(result);
  if (!args.includes("--yes")) {
    if (text.includes("cancelled: no files written")) return;
    throw new Error(`${label} completed without explicit cancellation or write terminal output\n${text}`);
  }
  const hasDoctorSuccess = text.includes("status: passed");
  const hasAcceptedCurrentStateSuccess = text.includes("mode: accepted-current-state")
    && text.includes("結果：你已經是最新版本");
  const hasUpgradeNoopSuccess = text.includes("mode: upgrade-existing")
    && text.includes("結果：你已經是最新版本")
    && text.includes("沒有檔案需要建立或合併");
  const hasWriteSuccess = command === "init"
    ? (text.includes("安裝完成") || text.includes("init 命令") || text.includes("created:"))
    : (text.includes("migration committed") || text.includes("upgrade 命令") || text.includes("upgrade verified") || hasAcceptedCurrentStateSuccess || hasUpgradeNoopSuccess);
  if (command === "init" && hasDoctorSuccess && hasWriteSuccess) return;
  if (command === "upgrade" && hasWriteSuccess) return;
  throw new Error(`${label} completed without explicit terminal success output\n${text}`);
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
  const match = markdownH2Sections(text).find((section) => section.title === title);
  if (!match) return text;
  return `${text.slice(0, match.start)}${text.slice(match.end)}`;
}

function realH2Count(text, title) {
  return markdownH2Sections(text).filter((section) => section.title === title).length;
}

function markdownH2Sections(text) {
  const sections = [];
  for (const line of markdownVisibleLinesOutsideHiddenBlocks(text)) {
    const match = /^## ([^#].*?)\s*$/u.exec(line.text);
    if (match) sections.push({ title: match[1], start: line.start, end: String(text).length });
  }
  for (let index = 0; index < sections.length - 1; index += 1) sections[index].end = sections[index + 1].start;
  return sections;
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
