#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir as systemTmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { installedFileContracts } from "../bin/installed-file-contract.mjs";
import { buildSemanticCandidate, assertCandidateReadyForDeterministicValidation } from "../bin/semantic-candidate.mjs";
import { buildUpgradeInventory } from "../bin/upgrade-inventory.mjs";
import { getOfficialBaseline, loadOfficialOriginCatalog } from "../bin/official-origin-catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const qaTmp = process.env.AGENT_HANDOFF_KIT_QA_TMP || (process.platform === "win32" ? "C:\\tmp" : systemTmpdir());
const catalog = await loadOfficialOriginCatalog();
const toolVersion = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version;

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});

async function main() {
  const project = fresh("candidate");
  materializeOfficialInstall("0.3.40", project);
  writeFixtureState(project);
  const before = snapshot(project);
  const inventory = await buildUpgradeInventory({ root: project });
  const sourceContents = readInventorySources(project, inventory);
  const managedOrigins = makeManagedOrigins(project, inventory, sourceContents);
  const proposals = makeCompleteProposals(inventory, sourceContents, managedOrigins);
  const candidate = buildSemanticCandidate({ inventory, sourceContents, proposals, managedOrigins, toolVersion, projectRoot: project });
  const reversed = buildSemanticCandidate({ inventory, sourceContents: new Map([...sourceContents].reverse()), proposals: [...proposals].reverse(), managedOrigins: [...managedOrigins].reverse(), toolVersion, projectRoot: project });
  const after = snapshot(project);

  assert(candidate.status === "pending-independent-review", "complete candidate must wait for independent product-quality review");
  assert(candidate.operationAuthority === "none" && candidate.activationStatus === "not-authorized", "candidate claimed data-operation authority");
  assert(candidate.runtimeValidationStatus === "not-run", "candidate claimed runtime validation");
  assert(candidate.candidateSha256 === reversed.candidateSha256, "candidate digest changed when identical inputs were reordered");
  assert(equalSnapshots(before, after), "semantic candidate construction changed the fixture");
  assertCandidateReadyForDeterministicValidation({ candidate, inventory, sourceContents, managedOrigins, toolVersion, projectRoot: project });
  const managedBridge = candidate.items.find((item) => item.sourcePath === "CLAUDE.md");
  assert(managedBridge?.ownership.managedOrigin?.packageEvidence?.installedTemplateVersion === "0.3.40", "exact Kit ownership omitted the installed package version evidence");
  assert(managedBridge.ownership.managedOrigin.packageEvidence.npm.spec === "@adamchanadam/agent-handoff-kit@0.3.40", "exact Kit ownership omitted the npm artifact identity");

  const customItem = candidate.items.find((item) => item.sourcePath === "dev/rules/safety.md");
  assert(customItem?.ownership.kind === "user-or-unknown", "modified package-path rule was incorrectly treated as exact Kit content");
  assert(customItem.sourceByteRanges.length === 1 && customItem.sourceByteRanges[0].kind === "user-or-unknown", "mixed package-path rule was automatically split into managed content");
  assert(customItem.destination.contentBase64 && Buffer.from(customItem.destination.contentBase64, "base64").includes(Buffer.from("R034_CUSTOM_SAFETY")), "mixed custom rule lost its exact source bytes");
  assert(customItem.userOverlay === null && customItem.preservationRoute?.kind === "existing-formal-reader", "candidate moved custom content through an unverified user router");
  assert(customItem.expectedReachability.some((entry) => entry.reader === "AGENTS.md" && entry.via === "dev/rules/safety.md"), "candidate did not derive the current formal reader from the frozen inventory");
  for (const sourcePath of ["dev/rules/safety.md", "dev/rules/research.md", "dev/rules/agent-governance.md", "dev/rules/knowledge.md", "dev/rules/integrations.md", "dev/rules/onboarding.md"]) {
    const item = candidate.items.find((candidateItem) => candidateItem.sourcePath === sourcePath);
    const source = sourceContents.get(sourcePath);
    assert(item?.ownership.kind === "user-or-unknown", `text-shape fixture was incorrectly classified as Kit managed: ${sourcePath}`);
    assert(reconstructSource(item.sourceByteRanges, source).equals(source), `source byte ranges do not reconstruct text-shape fixture: ${sourcePath}`);
    assert(Buffer.from(item.destination.contentBase64, "base64").includes(source), `text-shape fixture lost original bytes: ${sourcePath}`);
  }
  const safetyBaseline = Buffer.from(getOfficialBaseline({ version: "0.3.40", targetRel: "dev/rules/safety.md", catalog, root: project }).text);
  assert(firstLine(sourceContents.get("dev/rules/safety.md")) === firstLine(safetyBaseline), "retained-title fixture did not retain the official-looking title");
  assert(!sourceContents.get("dev/rules/onboarding.md").toString("utf8").startsWith("# "), "deleted-title fixture did not delete its title");
  assert(firstLine(sourceContents.get("dev/rules/integrations.md")) !== firstLine(Buffer.from(getOfficialBaseline({ version: "0.3.40", targetRel: "dev/rules/integrations.md", catalog, root: project }).text)), "overwritten-title fixture did not overwrite its title");
  assert(candidate.items.length === inventory.entries.length, "candidate did not cover every inventory item");

  assertThrows(
    () => buildSemanticCandidate({ inventory, sourceContents, proposals: proposals.slice(1), managedOrigins, toolVersion, projectRoot: project }),
    "semantic candidate proposals do not cover the frozen inventory exactly"
  );
  const changedSources = new Map(sourceContents);
  changedSources.set("dev/rules/safety.md", Buffer.concat([changedSources.get("dev/rules/safety.md"), Buffer.from("changed") ]));
  assertThrows(
    () => buildSemanticCandidate({ inventory, sourceContents: changedSources, proposals, managedOrigins, toolVersion, projectRoot: project }),
    "source content no longer matches inventory: dev/rules/safety.md"
  );
  const inventedEffect = proposals.map((proposal) => proposal.sourcePath === "dev/rules/safety.md"
    ? { ...proposal, expectedEffect: { status: "pending-runtime-validation", decision: "free-form-claim" } }
    : proposal);
  assertThrows(
    () => buildSemanticCandidate({ inventory, sourceContents, proposals: inventedEffect, managedOrigins, toolVersion, projectRoot: project }),
    "semantic candidate effect decision is invalid: dev/rules/safety.md"
  );
  const collisionProposals = proposals.map((proposal) => ({ ...proposal }));
  const first = collisionProposals.find((proposal) => proposal.sourcePath === "AGENTS.md");
  const second = collisionProposals.find((proposal) => proposal.sourcePath === "CLAUDE.md");
  second.destinationPath = first.destinationPath;
  assertThrows(
    () => buildSemanticCandidate({ inventory, sourceContents, proposals: collisionProposals, managedOrigins, toolVersion, projectRoot: project }),
    `candidate destinations disagree on content: ${first.destinationPath}`
  );

  const forceExact = proposals.map((proposal) => proposal.sourcePath === "dev/rules/safety.md"
    ? { ...proposal, ownership: { kind: "kit-managed-exact" } }
    : proposal);
  assertThrows(
    () => buildSemanticCandidate({ inventory, sourceContents, proposals: forceExact, managedOrigins, toolVersion, projectRoot: project }),
    "exact Kit-managed ownership lacks package evidence: dev/rules/safety.md"
  );
  const gapRanges = proposals.map((proposal) => proposal.sourcePath === "dev/rules/safety.md"
    ? { ...proposal, sourceByteRanges: [range("user-or-unknown", sourceContents.get(proposal.sourcePath), 0, proposal.sourceByteRanges[0].bytes - 1)] }
    : proposal);
  assertThrows(
    () => buildSemanticCandidate({ inventory, sourceContents, proposals: gapRanges, managedOrigins, toolVersion, projectRoot: project }),
    "semantic candidate source byte ranges do not reconstruct source exactly: dev/rules/safety.md"
  );
  const reorderedRanges = proposals.map((proposal) => {
    if (proposal.sourcePath !== "dev/rules/safety.md") return proposal;
    const source = sourceContents.get(proposal.sourcePath);
    const midpoint = Math.floor(source.length / 2);
    return {
      ...proposal,
      sourceByteRanges: [
        range("user-or-unknown", source, midpoint, source.length - midpoint),
        range("user-or-unknown", source, 0, midpoint)
      ]
    };
  });
  assertThrows(
    () => buildSemanticCandidate({ inventory, sourceContents, proposals: reorderedRanges, managedOrigins, toolVersion, projectRoot: project }),
    "semantic candidate source byte ranges must be complete, ordered, and non-overlapping: dev/rules/safety.md"
  );
  const prematureOverlay = proposals.map((proposal) => {
    if (proposal.sourcePath !== "dev/rules/safety.md") return proposal;
    const source = sourceContents.get(proposal.sourcePath);
    const entryId = `legacy-${sha(source).slice(0, 16)}`;
    const priorityRelation = "after-kit-base-before-task-packs";
    return {
      ...proposal,
      decision: "move",
      destinationPath: "dev/user_rules/safety.md",
      destinationContent: source,
      userOverlay: {
        entryId,
        routerPath: "dev/USER_RULES.md",
        contentPath: "dev/user_rules/safety.md",
        reader: { reader: "AGENTS.md", via: "dev/USER_RULES.md" },
        priorityRelation,
        sourceRangeWitnesses: [{ sourceOffset: 0, bytes: source.length, sourceSha256: sha(source), destinationOffset: 0 }]
      },
      preservationRoute: {
        kind: "formal-user-overlay",
        entryId,
        routerPath: "dev/USER_RULES.md",
        contentPath: "dev/user_rules/safety.md",
        reader: { reader: "AGENTS.md", via: "dev/USER_RULES.md" },
        priorityRelation
      }
    };
  });
  assertThrows(
    () => buildSemanticCandidate({ inventory, sourceContents, proposals: prematureOverlay, managedOrigins, toolVersion, projectRoot: project }),
    "user overlay router has no verified formal entry path: dev/rules/safety.md"
  );
  const overlayOverlap = prematureOverlay.map((proposal) => {
    if (proposal.sourcePath !== "dev/rules/safety.md") return proposal;
    const source = sourceContents.get(proposal.sourcePath);
    const marker = Buffer.from("R034_CUSTOM_SAFETY");
    const markerOffset = source.indexOf(marker);
    return {
      ...proposal,
      userOverlay: {
        ...proposal.userOverlay,
        sourceRangeWitnesses: [
          { sourceOffset: 0, bytes: source.length, sourceSha256: sha(source), destinationOffset: 0 },
          { sourceOffset: markerOffset, bytes: marker.length, sourceSha256: sha(marker), destinationOffset: markerOffset }
        ]
      }
    };
  });
  assertThrows(
    () => buildSemanticCandidate({ inventory, sourceContents, proposals: overlayOverlap, managedOrigins, toolVersion, projectRoot: project }),
    "user overlay source ranges must be complete, ordered, and non-overlapping: dev/rules/safety.md"
  );
  const inventedReader = proposals.map((proposal) => proposal.sourcePath === "dev/rules/safety.md"
    ? { ...proposal, preservationRoute: { ...proposal.preservationRoute, reader: "invented-reader.md" } }
    : proposal);
  assertThrows(
    () => buildSemanticCandidate({ inventory, sourceContents, proposals: inventedReader, managedOrigins, toolVersion, projectRoot: project }),
    "existing reader route is not in expected reachability: dev/rules/safety.md"
  );
  const inventedPackageIdentity = managedOrigins.map((origin) => ({ ...origin, packageIdentity: "untrusted-package@0.3.40" }));
  assertThrows(
    () => buildSemanticCandidate({ inventory, sourceContents, proposals, managedOrigins: inventedPackageIdentity, toolVersion, projectRoot: project }),
    "managed origin package identity is not an installed Kit release: CLAUDE.md"
  );
  const missingProvenanceRoot = fresh("candidate-missing-installed-package-evidence");
  assertThrows(
    () => buildSemanticCandidate({ inventory, sourceContents, proposals, managedOrigins, toolVersion, projectRoot: missingProvenanceRoot }),
    "managed origin installed project package evidence is missing"
  );
  const mismatchedProvenanceRoot = fresh("candidate-mismatched-installed-package-evidence");
  materializeOfficialInstall("0.3.39", mismatchedProvenanceRoot);
  assertThrows(
    () => buildSemanticCandidate({ inventory, sourceContents, proposals, managedOrigins, toolVersion, projectRoot: mismatchedProvenanceRoot }),
    "managed origin package identity does not match the installed project package"
  );

  write(path.join(project, "dev", "safety.md"), "# Legacy safety location\n\nRetain this legacy source for migration review.\n");
  const legacyInventory = await buildUpgradeInventory({ root: project });
  const legacySources = readInventorySources(project, legacyInventory);
  const legacyOrigins = makeManagedOrigins(project, legacyInventory, legacySources);
  const unresolvedProposals = makeCompleteProposals(legacyInventory, legacySources, legacyOrigins);
  const unresolvedCandidate = buildSemanticCandidate({ inventory: legacyInventory, sourceContents: legacySources, proposals: unresolvedProposals, managedOrigins: legacyOrigins, toolVersion, projectRoot: project });
  assert(unresolvedCandidate.status === "blocked-unresolved", "unresolved item did not block candidate status");
  assertThrows(
    () => assertCandidateReadyForDeterministicValidation({ candidate: unresolvedCandidate, inventory: legacyInventory, sourceContents: legacySources, managedOrigins: legacyOrigins, toolVersion, projectRoot: project }),
    "unresolved semantic items block deterministic validation"
  );

  write(path.join(project, "dev", "governance_migrations", "prior", "transaction.json"), '{\n  "state": "committed"\n}\n');
  write(path.join(project, "dev", "session_log_archive", "archive_001.md"), "# Historical trace\n");
  const dynamicInventory = await buildUpgradeInventory({ root: project });
  const dynamicSources = readInventorySources(project, dynamicInventory);
  const dynamicOrigins = makeManagedOrigins(project, dynamicInventory, dynamicSources);
  const dynamicProposals = makeCompleteProposals(dynamicInventory, dynamicSources, dynamicOrigins);
  const dynamicCandidate = buildSemanticCandidate({ inventory: dynamicInventory, sourceContents: dynamicSources, proposals: dynamicProposals, managedOrigins: dynamicOrigins, toolVersion, projectRoot: project });
  assert(dynamicCandidate.status === "blocked-unresolved", "dynamic state without a verified effect did not block candidate acceptance");
  for (const sourcePath of ["dev/governance_migrations/prior/transaction.json", "dev/session_log_archive/archive_001.md"]) {
    const item = dynamicCandidate.items.find((candidateItem) => candidateItem.sourcePath === sourcePath);
    assert(item?.decision === "unresolved", `dynamic source was silently preserved without a verified effect: ${sourcePath}`);
    assert(reconstructSource(item.sourceByteRanges, dynamicSources.get(sourcePath)).equals(dynamicSources.get(sourcePath)), `dynamic source ranges do not reconstruct raw bytes: ${sourcePath}`);
  }

  console.log("ok: R-034 semantic candidate is complete, source-hash-bound, inert, and deterministic");
  console.log("ok: no-title, multilingual, in-section, retained/overwritten title, mixed old/new, byte-range gaps/reordering/overlap, unverified-router, invented-reader, invented/missing/mismatched package provenance, unresolved legacy and dynamic effect, drift, omission, destination-collision, and free-form-effect negatives passed");
  console.log("Agent Handoff Kit R-034 semantic candidate QA passed");
}

function makeCompleteProposals(inventory, sourceContents, managedOrigins) {
  const exactPaths = new Set(managedOrigins.map((origin) => origin.sourcePath));
  return inventory.entries.map((entry) => {
    const source = sourceContents.get(entry.path);
    const exact = exactPaths.has(entry.path);
    const legacyWithoutVerifiedEffect = entry.path === "dev/safety.md" || entry.classifications.some((classification) => ["transaction-state", "legacy-session-log-archive"].includes(classification));
    const destinationPath = entry.path;
    const base = {
      sourcePath: entry.path,
      ownership: exact
        ? { kind: "kit-managed-exact", managedOrigin: managedOrigins.find((origin) => origin.sourcePath === entry.path) }
        : { kind: "user-or-unknown" },
      sourceByteRanges: [range(exact ? "kit-managed-exact" : "user-or-unknown", source, 0, source.length)],
      reason: exact
        ? "Exact package identity, managed target, and current bytes prove this replaceable Kit source."
        : "No exact package-byte proof; preserve source bytes and its verified active route or stop.",
      originalObligations: [`preserve:${entry.path}`],
      expectedEffect: { status: "pending-runtime-validation", decision: "preserve-source-obligations-and-priority" }
    };
    if (legacyWithoutVerifiedEffect) {
      return {
        ...base,
        decision: "unresolved",
        reason: "Legacy source has no verifiable active reader or safe priority decision."
      };
    }
    return {
      ...base,
      decision: "preserve",
      destinationPath,
      destinationContent: source,
      preservationRoute: exact
        ? undefined
        : {
          kind: "existing-formal-reader",
          contentPath: destinationPath,
          reader: "AGENTS.md",
          via: entry.path,
          priorityRelation: "preserve-existing-effect-pending-runtime-validation"
        }
    };
  });
}

function makeManagedOrigins(project, inventory, sourceContents) {
  return inventory.entries.flatMap((entry) => {
    const baseline = getOfficialBaseline({ version: "0.3.40", targetRel: entry.path, catalog, root: project });
    const source = sourceContents.get(entry.path);
    if (!baseline || baseline.state !== "present" || !Buffer.from(baseline.text).equals(source)) return [];
    return [{
      sourcePath: entry.path,
      packageIdentity: "@adamchanadam/agent-handoff-kit@0.3.40",
      targetPath: entry.path,
      sourceSha256: sha(source)
    }];
  });
}

function range(kind, source, sourceOffset, bytes) {
  return {
    kind,
    sourceOffset,
    bytes,
    sourceSha256: sha(source.subarray(sourceOffset, sourceOffset + bytes))
  };
}

function reconstructSource(ranges, source) {
  return Buffer.concat(ranges.map((entry) => source.subarray(entry.sourceOffset, entry.sourceOffset + entry.bytes)));
}

function firstLine(buffer) { return buffer.toString("utf8").split(/\r?\n/, 1)[0]; }

function writeFixtureState(project) {
  const markers = [
    ["dev/rules/safety.md", "請保留專案的人工覆核門檻。"],
    ["dev/rules/research.md", "Keep the local evidence-retention exception."],
    ["dev/rules/agent-governance.md", "プロジェクト固有の承認条件を保持する。"],
    ["dev/rules/knowledge.md", "Keep the project knowledge ownership marker."],
    ["dev/rules/integrations.md", "保留本機整合的可用性檢查規則。"]
  ];
  for (const [targetRel, content] of markers) {
    const marker = `R034_CUSTOM_${path.basename(targetRel, ".md").toUpperCase()}`;
    const target = path.join(project, targetRel);
    if (targetRel === "dev/rules/agent-governance.md") {
      const original = readFileSync(target);
      const offset = Math.floor(original.length / 2);
      writeFileSync(target, Buffer.concat([original.subarray(0, offset), Buffer.from(`\n${marker}\n${content}\n`, "utf8"), original.subarray(offset)]));
    } else {
      append(target, `\n${marker}\n${content}\n`);
    }
  }
  const onboarding = path.join(project, "dev", "rules", "onboarding.md");
  write(onboarding, readFileSync(onboarding, "utf8").replace(/^# .*\r?\n/, ""));
  const integrations = path.join(project, "dev", "rules", "integrations.md");
  write(integrations, readFileSync(integrations, "utf8").replace(/^# .*$/m, "# Retained official-looking title with user-rewritten body"));
  append(path.join(project, "AGENTS.md"), "\n## Local project references\n\n- [Custom policy](docs/custom-policy.json)\n- `資料/附加規則.md`\n");
  write(path.join(project, "docs", "custom-policy.json"), '{\n  "retention": "local"\n}\n');
  write(path.join(project, "資料", "附加規則.md"), "# 附加規則\n\n僅供此專案使用。\n");
}

function materializeOfficialInstall(version, project) {
  assert(catalog.releases[version], `v${version} missing from official origin catalog`);
  for (const { targetRel } of installedFileContracts) {
    const baseline = getOfficialBaseline({ version, targetRel, catalog, root: project });
    if (!baseline || baseline.state === "absent") continue;
    write(path.join(project, targetRel), baseline.text);
  }
}

function readInventorySources(project, inventory) {
  return new Map(inventory.entries.map((entry) => [entry.path, readFileSync(path.join(project, entry.path))]));
}

function fresh(label) {
  const project = path.join(qaTmp, `ack-r034-${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  assert(!existsSync(project), `QA fixture already exists: ${project}`);
  mkdirSync(project, { recursive: true });
  return project;
}

function snapshot(project) {
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

function write(file, content) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content, "utf8");
}

function append(file, content) { write(file, `${readFileSync(file, "utf8")}${content}`); }
function sha(buffer) { return createHash("sha256").update(buffer).digest("hex"); }
function equalSnapshots(left, right) { return left.size === right.size && [...left].every(([key, value]) => right.get(key) === value); }
function assertThrows(action, expected) {
  try { action(); } catch (error) { assert(String(error.message).includes(expected), `expected error ${JSON.stringify(expected)}, got ${String(error.message)}`); return; }
  throw new Error(`expected error: ${expected}`);
}
function assert(condition, message) { if (!condition) throw new Error(message); }
