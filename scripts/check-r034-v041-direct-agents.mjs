import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const candidateRoot = path.resolve(__dirname, "..");
const artifactRoot = "C:/tmp/agent-handoff-kit-r034-gate4-reopen-artifact/extract/package";
const artifactTgz = "C:/tmp/agent-handoff-kit-r034-gate4-reopen-artifact/adamchanadam-agent-handoff-kit-0.3.41.tgz";
const artifactSha1 = "8b9238287485ef15208c4c339e8cdfe283ce1c23";
const artifactIntegrity = "sha512-2DQjMXhLigpW30vE0bb1aa7F5h1YYW5kXSfruzwg6IltyclvV9EBYPLUTOj49p6QIwmPWcetvJIB8zK0LZFH5Q==";
const begin = "<!-- BEGIN Agent Handoff Kit managed core -->\n";
const end = "\n<!-- END Agent Handoff Kit managed core -->";
const expectation = process.argv[2] ?? "green";

function fail(message) {
  throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function managedCore(bytes) {
  const start = bytes.indexOf(Buffer.from(begin, "utf8"));
  const endAt = bytes.indexOf(Buffer.from(end, "utf8"), start + begin.length);
  if (start !== 0 || endAt < 0 || bytes.indexOf(Buffer.from(begin, "utf8"), begin.length) >= 0) fail("AGENTS managed-core boundary is not unique");
  return bytes.subarray(begin.length, endAt);
}

function run(cli, cwd, args, extraEnv = {}) {
  try {
    return { status: 0, stdout: execFileSync(process.execPath, [cli, ...args], {
      cwd,
      encoding: "utf8",
      env: { ...process.env, AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "1", ...extraEnv }
    }) };
  } catch (error) {
    return { status: error.status ?? 1, stdout: error.stdout ?? "", stderr: error.stderr ?? String(error) };
  }
}

function transactionNames(rootPath) {
  const migrations = path.join(rootPath, "dev", "governance_migrations");
  return existsSync(migrations)
    ? readdirSync(migrations).filter((name) => existsSync(path.join(migrations, name, "transaction.json"))).sort()
    : [];
}

function assertDoctorAcceptsCurrentState(output, witness, cliVersion, label) {
  const acceptedVersion = witness?.transaction?.attemptedVersion;
  if (acceptedVersion !== cliVersion) fail(`${label} fixture does not bind the accepted current state to the running CLI version`);
  if (!output.includes("status: passed")) fail(`${label} doctor did not report a passed health result`);
  if (/項目版本記錄未與目前工具對齊|建議先執行 .*upgrade --dry-run/u.test(output)) {
    fail(`${label} doctor told the user to repeat upgrade despite the verified accepted current state`);
  }
  if (!output.includes(`已接受目前狀態 v${acceptedVersion}`)) {
    fail(`${label} doctor did not display the verified accepted current-state version`);
  }
  if (!/🚀 下一步[:：][\s\S]*(?:Start Agent Handoff|開工|繼續使用)/u.test(output)) {
    fail(`${label} doctor did not provide a normal, non-upgrade next step for an accepted current state`);
  }
}

function assertSegmentReconstruction(entry, beforeBytes, afterBytes, candidateCoreBytes, suffixBytes) {
  if (entry?.disposition !== "replace-managed-segment" || entry.conflictDecision !== "artifact-bound-exact-managed-core"
    || entry.effectDecision !== "replace-artifact-bound-managed-core-through-direct-formal-entry"
    || entry.activeReader?.reader !== "AGENTS.md" || entry.activeReader?.via !== "direct-formal-entry") {
    fail("green runtime acceptance lacks the direct artifact-bound AGENTS reader/effect decision");
  }
  const ranges = entry.sourceByteRanges;
  const source = entry.managedSegment?.source;
  const accepted = entry.managedSegment?.accepted;
  if (!Array.isArray(ranges) || ranges.length !== 3 || !source || !accepted
    || ranges[0].start !== 0 || ranges[0].end !== source.start
    || ranges[1].start !== source.start || ranges[1].end !== source.end
    || ranges[2].start !== source.end || ranges[2].end !== beforeBytes.length) {
    fail("green runtime acceptance has incomplete, overlapping, or reordered AGENTS source ranges");
  }
  const sourceParts = ranges.map((range) => beforeBytes.subarray(range.start, range.end));
  if (!Buffer.concat(sourceParts).equals(beforeBytes) || sourceParts.some((part, index) => sha256(part) !== ranges[index].sha256)) {
    fail("green runtime acceptance source ranges do not exactly reconstruct pre-upgrade AGENTS.md");
  }
  const acceptedParts = [
    afterBytes.subarray(0, accepted.start),
    afterBytes.subarray(accepted.start, accepted.end),
    afterBytes.subarray(accepted.end)
  ];
  if (!Buffer.concat(acceptedParts).equals(afterBytes)
    || !acceptedParts[0].equals(sourceParts[0])
    || !acceptedParts[1].equals(candidateCoreBytes)
    || !acceptedParts[2].equals(sourceParts[2])
    || !acceptedParts[2].subarray(acceptedParts[2].length - suffixBytes.length).equals(suffixBytes)) {
    fail("green runtime acceptance did not reconstruct active AGENTS.md with only its exact core changed");
  }
}

function snapshotTree(rootPath, relative = "") {
  const result = {};
  for (const item of readdirSync(path.join(rootPath, relative), { withFileTypes: true })) {
    const next = path.join(relative, item.name);
    if (next.split(path.sep).join("/") === "dev/governance_migrations") continue;
    const absolute = path.join(rootPath, next);
    if (item.isDirectory()) Object.assign(result, snapshotTree(rootPath, next));
    else if (item.isFile()) result[next.split(path.sep).join("/")] = sha256(readFileSync(absolute));
  }
  return result;
}

if (!existsSync(artifactTgz) || !existsSync(artifactRoot)) fail("pinned v0.3.41 artifact input is unavailable");
const tgz = readFileSync(artifactTgz);
if (createHash("sha1").update(tgz).digest("hex") !== artifactSha1) fail("pinned v0.3.41 tarball SHA-1 drifted");
if (`sha512-${createHash("sha512").update(tgz).digest("base64")}` !== artifactIntegrity) fail("pinned v0.3.41 tarball integrity drifted");

const root = mkdtempSync(path.join(tmpdir(), "ahk-v041-plain-agents-red-"));
const artifactCli = path.join(artifactRoot, "bin", "agent-handoff-kit.mjs");
const candidateCli = path.join(candidateRoot, "bin", "agent-handoff-kit.mjs");
const init = run(artifactCli, artifactRoot, ["init", "--yes", "--root", root]);
if (init.status !== 0) fail(`artifact init failed\n${init.stdout}\n${init.stderr ?? ""}`);

const agentsPath = path.join(root, "AGENTS.md");
const artifactAgents = readFileSync(agentsPath);
const exactArtifactCore = managedCore(artifactAgents);
const suffix = Buffer.from("\n\n這是一條沒有標題的舊用戶規則。\n普通 AI 入口讀取 AGENTS.md 時必須仍然看見它。\n", "utf8");
if (suffix.toString("utf8").includes("#")) fail("fixture user rule must remain unheaded");
const before = Buffer.concat([artifactAgents, suffix]);
writeFileSync(agentsPath, before);

const candidateCore = readFileSync(path.join(candidateRoot, "runtime-core", "AGENTS.core.md"), "utf8").trim();
const upgrade = run(candidateCli, candidateRoot, ["upgrade", "--yes", "--root", root]);
const after = readFileSync(agentsPath);
const afterCore = managedCore(after);
const doctor = run(candidateCli, candidateRoot, ["doctor", "--root", root]);
const migrations = path.join(root, "dev", "governance_migrations");
const transactions = transactionNames(root);
const journal = transactions.length > 0
  ? JSON.parse(readFileSync(path.join(migrations, transactions.at(-1), "transaction.json"), "utf8"))
  : null;

const result = {
  fixtureRoot: root,
  artifactAgents: { sha256: sha256(artifactAgents), bytes: artifactAgents.length },
  preUpgradeAgents: { sha256: sha256(before), bytes: before.length },
  userSuffix: { sha256: sha256(suffix), bytes: suffix.length, preserved: after.subarray(after.length - suffix.length).equals(suffix) },
  cores: {
    artifact: sha256(exactArtifactCore),
    candidate: sha256(Buffer.from(candidateCore, "utf8")),
    after: sha256(afterCore),
    candidateCoreActivated: afterCore.equals(Buffer.from(candidateCore, "utf8"))
  },
  upgrade: { status: upgrade.status, successSignal: upgrade.stdout.includes("migration committed") && upgrade.stdout.includes("project health: passed") },
  doctor: {
    status: doctor.status,
    statusPassed: doctor.stdout.includes("status: passed"),
    reportsStaleMetadata: doctor.stdout.includes("項目版本記錄未與目前工具對齊"),
    advisesRepeatUpgrade: doctor.stdout.includes("建議先執行 npx --yes @adamchanadam/agent-handoff-kit@latest upgrade --dry-run")
  },
  transaction: journal ? { state: journal.state, currentStateDigest: journal.currentStateWitness?.currentStateDigest ?? null, reportPresent: existsSync(path.join(migrations, transactions.at(-1), "migration-report.md")) } : null,
  formalRouterInjected: after.includes(Buffer.from("ack:user-rules-router", "utf8"))
};
console.log(JSON.stringify(result, null, 2));

if (!result.userSuffix.preserved) fail("red fixture lost a user byte");
if (expectation === "red") {
  if (!afterCore.equals(exactArtifactCore) || afterCore.equals(Buffer.from(candidateCore, "utf8"))) {
    fail("red was not reproduced: the clean candidate did not preserve the old v0.3.41 core as expected");
  }
} else if (expectation === "green") {
  if (!afterCore.equals(Buffer.from(candidateCore, "utf8")) || afterCore.equals(exactArtifactCore)) {
    fail("green did not replace only the artifact-bound v0.3.41 core");
  }
  if (result.formalRouterInjected) fail("green injected a future USER_RULES contract into a real v0.3.41 fixture");
  if (upgrade.status !== 0 || !result.upgrade.successSignal || doctor.status !== 0 || !result.doctor.statusPassed || !journal?.currentStateWitness || !result.transaction?.reportPresent) {
    fail("green did not produce one successful transaction and fresh doctor/report readback");
  }
  const report = readFileSync(path.join(migrations, transactions.at(-1), "migration-report.md"), "utf8");
  const entry = journal.runtimeAcceptance?.entries?.find((item) => item.targetRel === "AGENTS.md");
  assertSegmentReconstruction(entry, before, after, Buffer.from(candidateCore, "utf8"), suffix);
  if (journal.currentStateReadback?.currentStateDigest !== journal.currentStateWitness.currentStateDigest
    || !report.includes(journal.currentStateWitness.currentStateDigest)) {
    fail("doctor/report current-state readback is detached from the transaction witness");
  }
  const cliVersion = JSON.parse(readFileSync(path.join(candidateRoot, "package.json"), "utf8")).version;
  assertDoctorAcceptsCurrentState(doctor.stdout, journal.currentStateWitness, cliVersion, "first");
  const [major, minor, patch] = cliVersion.split(".").map(Number);
  const newerVersion = `${major}.${minor}.${patch + 1}`;
  const olderVersion = `${major}.${minor}.${patch - 1}`;

  const newerToolDoctor = run(candidateCli, candidateRoot, ["doctor", "--root", root], {
    AGENT_HANDOFF_KIT_QA_ALLOW_VERSION_OVERRIDE: "1",
    AGENT_HANDOFF_KIT_QA_VERSION_OVERRIDE: newerVersion
  });
  if (newerToolDoctor.status !== 0
    || !newerToolDoctor.stdout.includes(`已接受目前狀態 v${cliVersion}`)
    || !newerToolDoctor.stdout.includes("項目已接受的狀態仍是")
    || !newerToolDoctor.stdout.includes("upgrade --dry-run")) {
    fail("newer tool did not advise upgrade from the verified older accepted current state");
  }
  const olderToolDoctor = run(candidateCli, candidateRoot, ["doctor", "--root", root], {
    AGENT_HANDOFF_KIT_QA_ALLOW_VERSION_OVERRIDE: "1",
    AGENT_HANDOFF_KIT_QA_VERSION_OVERRIDE: olderVersion
  });
  if (olderToolDoctor.status !== 0
    || !olderToolDoctor.stdout.includes("項目已接受的狀態比目前工具新")
    || !olderToolDoctor.stdout.includes("不會用舊工具把項目降級")) {
    fail("older tool did not warn against treating the verified newer current state as a downgrade target");
  }
  const npmNewerDoctor = run(candidateCli, candidateRoot, ["doctor", "--root", root], {
    AGENT_HANDOFF_KIT_NO_UPDATE_CHECK: "0",
    AGENT_HANDOFF_KIT_UPDATE_CHECK_FORCE: "1",
    AGENT_HANDOFF_KIT_UPDATE_MOCK_LATEST: newerVersion
  });
  if (npmNewerDoctor.status !== 0 || !npmNewerDoctor.stdout.includes(`npm 有新版（v${newerVersion}）`)) {
    fail("newer npm version was not still surfaced after accepted current-state readback");
  }

  const beforeSecond = transactionNames(root).length;
  const second = run(candidateCli, candidateRoot, ["upgrade", "--yes", "--root", root]);
  const afterSecond = transactionNames(root).length;
  const secondDoctor = run(candidateCli, candidateRoot, ["doctor", "--root", root]);
  if (second.status !== 0 || second.stdout.includes("migration committed") || afterSecond !== beforeSecond
    || secondDoctor.status !== 0 || !secondDoctor.stdout.includes("status: passed")) {
    fail("same-version upgrade created a phantom transaction or skipped its fresh whole-state doctor readback");
  }
  assertDoctorAcceptsCurrentState(secondDoctor.stdout, journal.currentStateWitness, cliVersion, "second");

  const drifted = Buffer.from(readFileSync(agentsPath));
  drifted[begin.length] = drifted[begin.length] === 35 ? 33 : 35;
  writeFileSync(agentsPath, drifted);
  const driftDoctor = run(candidateCli, candidateRoot, ["doctor", "--root", root]);
  const driftUpgrade = run(candidateCli, candidateRoot, ["upgrade", "--yes", "--root", root]);
  if (driftDoctor.status === 0 || driftUpgrade.status === 0 || readFileSync(agentsPath).compare(drifted) !== 0) {
    fail("one-byte managed-core drift was accepted or overwritten instead of stopping safely");
  }

  const recoveryRoot = mkdtempSync(path.join(tmpdir(), "ahk-v041-plain-agents-recovery-"));
  const recoveryInit = run(artifactCli, artifactRoot, ["init", "--yes", "--root", recoveryRoot]);
  if (recoveryInit.status !== 0) fail("recovery fixture artifact init failed");
  const recoveryAgentsPath = path.join(recoveryRoot, "AGENTS.md");
  const recoveryBefore = Buffer.concat([readFileSync(recoveryAgentsPath), suffix]);
  writeFileSync(recoveryAgentsPath, recoveryBefore);
  const recoverySnapshot = snapshotTree(recoveryRoot);
  const interrupted = run(candidateCli, candidateRoot, ["upgrade", "--yes", "--root", recoveryRoot], { AGENT_HANDOFF_KIT_QA_INTERRUPT_AFTER_REPLACE: "1" });
  const lockPath = path.join(recoveryRoot, "dev", "governance_migrations", ".upgrade.lock");
  if (interrupted.status === 0 || !existsSync(lockPath)) fail("recovery fixture did not stop behind its transaction lock");
  const recovered = run(candidateCli, candidateRoot, ["upgrade", "--yes", "--root", recoveryRoot], { AGENT_HANDOFF_KIT_QA_RECOVER_ONLY: "1" });
  if (recovered.status !== 0 || existsSync(lockPath) || JSON.stringify(snapshotTree(recoveryRoot)) !== JSON.stringify(recoverySnapshot)) {
    fail("interruption recovery did not restore one complete old state");
  }
} else {
  fail(`unknown expectation ${expectation}`);
}
