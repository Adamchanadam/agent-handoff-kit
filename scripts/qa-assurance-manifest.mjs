import { createHash } from "node:crypto";

export const QA_RELEASE_READINESS_TIMEOUT_BUFFER_MS = 120_000;

export const QA_RELEASE_READINESS_INVENTORY = Object.freeze([
  releaseReadinessCheck("qa-assurance-manifest", "check-qa-assurance-manifest.mjs", "QA assurance manifest wiring", 180_000),
  releaseReadinessCheck("public-prototype", "check-public-prototype.mjs", "prototype QA", 120_000),
  releaseReadinessCheck("closeout-card", "check-closeout-card-contract.mjs", "closeout card contract QA", 120_000),
  releaseReadinessCheck("closeout-efficiency", "check-closeout-efficiency.mjs", "closeout efficiency and terminal-state QA", 120_000),
  releaseReadinessCheck("public-mirror", "build-public-mirror.mjs", "public mirror QA", 180_000),
  releaseReadinessCheck("pack-scenarios", "check-pack-scenarios.mjs", "pack scenario QA", 120_000),
  releaseReadinessCheck("r034-inventory", "check-r034-inventory.mjs", "R-034 inventory QA", 120_000),
  releaseReadinessCheck("r034-semantic-candidate", "check-r034-semantic-candidate.mjs", "R-034 semantic candidate QA", 120_000),
  releaseReadinessCheck("official-origin-catalog", "check-official-origin-catalog.mjs", "official-origin catalog QA", 180_000),
  releaseReadinessCheck("r034-gate5-closure", "check-r034-gate5-closure.mjs", "R-034 Gate 5 whole-set closure QA", 240_000),
  releaseReadinessCheck("r034-vertical", "check-r034-vertical.mjs", "artifact-backed R-034 vertical QA", 360_000),
  releaseReadinessCheck("r034-final-closure", "check-r034-final-closure.mjs", "R-034 Phase-0 five-file final closure QA", 240_000),
  releaseReadinessCheck("upgrade-safety", "check-upgrade-safety.mjs", "upgrade safety QA", 360_000),
  releaseReadinessCheck("post-upgrade-closeout-finalize", "check-post-upgrade-closeout-finalize.mjs", "post-upgrade closeout finalize QA", 240_000),
  releaseReadinessCheck("prompt-mirror", "check-prompt-mirror.mjs", "prompt mirror checker", 60_000)
]);

export const QA_ASSURANCE_MANIFEST = Object.freeze({
  schemaVersion: 1,
  layers: Object.freeze({
    quick: Object.freeze({
      purpose: "local engineering signal only; never a release verdict",
      command: "node scripts/qa.mjs quick"
    }),
    full: Object.freeze({
      purpose: "candidate-bound pre-publish decision",
      command: "node scripts/qa.mjs full --candidate <version> --evidence <candidate-evidence.json>"
    }),
    postpublish: Object.freeze({
      purpose: "published-artifact readback; never pre-publish evidence",
      command: "node scripts/qa.mjs postpublish --version <version> --evidence <postpublish-evidence.json>"
    })
  }),
  claims: Object.freeze([
    claim("prototype-install", "quick", "scripts/check-public-prototype.mjs", {
      provenance: "current source tree and isolated fresh-install root",
      stateAxes: ["delivery artifact", "fresh install"],
      readback: "installed CLI and doctor"
    }),
    claim("pack-routing", "quick", "scripts/check-pack-scenarios.mjs", {
      provenance: "current source tree",
      stateAxes: ["task signal", "rule-pack routing"],
      readback: "router and pack contracts"
    }),
    claim("closeout-card", "quick", "scripts/check-closeout-card-contract.mjs", {
      provenance: "current source tree and isolated closeout fixture",
      stateAxes: ["closeout persistence", "lifecycle state"],
      readback: "closeout-status"
    }),
    claim("closeout-efficiency", "quick", "scripts/check-closeout-efficiency.mjs", {
      provenance: "current source tree and isolated closeout fixture",
      stateAxes: ["closeout rerun scope", "tool terminal state", "wrapper propagation"],
      readback: "closeout-status, timeout, wrapper, and retry-scope counterexamples"
    }),
    claim("prompt-mirror", "quick", "scripts/check-prompt-mirror.mjs", {
      provenance: "runtime-core templates",
      stateAxes: ["generated mirror", "line ending"],
      readback: "prompt mirror assessment"
    }),
    claim("release-readiness", "full", "scripts/check-release-readiness.mjs", {
      provenance: "candidate source tree plus declared candidate evidence",
      stateAxes: ["candidate identity", "package boundary", "upgrade safety"],
      readback: "release-readiness output and candidate evidence digest",
      timeoutMs: aggregateReleaseReadinessTimeoutMs()
    }),
    Object.freeze({
      id: "published-artifact-evidence",
      layer: "postpublish",
      required: true,
      executor: Object.freeze({ kind: "evidence-validator" }),
      provenance: "published npm and GitHub artifacts captured after publication",
      stateAxes: Object.freeze(["published version", "registry artifact", "external surfaces"]),
      expected: Object.freeze({ positive: "version-bound external readback is complete", negative: "missing or mismatched evidence blocks the command" }),
      readback: "version, package identity, release URL, and named external observations",
      evidenceOutput: "postpublish evidence JSON",
      failureMode: "blocked; no pre-publish success may be inferred",
      outOfScope: "does not replace pre-publish candidate validation"
    })
  ])
});

export const RELEASE_STATE_CONTRACT = Object.freeze({
  schemaVersion: 1,
  surfaces: Object.freeze([
    surface("README.md"),
    surface("README.en.md"),
    surface("CHANGELOG.md"),
    surface("docs/whatsnew/README.md"),
    surface("docs/whatsnew/v${version}.md"),
    surface("agent-handoff-kit-intro.html"),
    surface("agent-handoff-kit-intro.en.html"),
    surface("agent-handoff-kit-guide.html"),
    surface("agent-handoff-kit-guide.en.html"),
    surface("agent-handoff-kit-ai-install.html"),
    surface("agent-handoff-kit-ai-install.en.html")
  ]),
  forbiddenPatterns: Object.freeze([
    pattern("目前候選版本", "u"),
    pattern("候選版本（尚未發佈）", "u"),
    pattern("目前正式版本", "u"),
    pattern("Current published release", "iu"),
    pattern("正式可用版本是", "u"),
    pattern("Current source candidate", "u"),
    pattern("currently published npm release", "iu"),
    pattern("v\\d+\\.\\d+\\.\\d+\\s+candidate", "iu"),
    pattern("v\\d+\\.\\d+\\.\\d+\\s+候選版", "u"),
    pattern("本頁版本可能先於 npm 正式發佈", "u"),
    pattern("may describe a candidate before npm publication", "iu"),
    pattern("may be ahead of the npm release", "iu"),
    pattern("source page can be ahead of the published npm package", "iu")
  ])
});

export const RELEASE_PACKAGE_CONTRACT = Object.freeze({
  schemaVersion: 1,
  expectedPackageFileCount: 35
});

export const PUBLIC_MIRROR_CONTRACT = Object.freeze({
  schemaVersion: 1,
  expectedFileCount: 110
});

export const R034_ARTIFACT_CONTRACT = Object.freeze({
  schemaVersion: 1,
  version: "0.3.41",
  packageRootEnv: "AGENT_HANDOFF_KIT_R034_ARTIFACT_ROOT",
  tarballPathEnv: "AGENT_HANDOFF_KIT_R034_ARTIFACT_TGZ",
  windowsDefaultPackageRoot: "C:\\tmp\\agent-handoff-kit-r034-gate4-reopen-artifact\\extract\\package",
  windowsDefaultTarballPath: "C:\\tmp\\agent-handoff-kit-r034-gate4-reopen-artifact\\adamchanadam-agent-handoff-kit-0.3.41.tgz",
  sha1: "8b9238287485ef15208c4c339e8cdfe283ce1c23",
  integrity: "sha512-2DQjMXhLigpW30vE0bb1aa7F5h1YYW5kXSfruzwg6IltyclvV9EBYPLUTOj49p6QIwmPWcetvJIB8zK0LZFH5Q=="
});

export const CANDIDATE_EVIDENCE_CONTRACT = Object.freeze({
  schemaVersion: 1,
  manualVerdictKeys: Object.freeze([
    "governanceHealth",
    "productJourney",
    "userJourney",
    "qcBackflow",
    "rulesPacksRouting"
  ]),
  roleIsolation: Object.freeze({
    provenanceBoundary: "role and thread fields are audit provenance only; they are not cryptographic identity proof and never authorize CLI data operations",
    writerRole: "workspace-writer",
    reviewerRole: "independent-readonly-reviewer",
    stateMachine: Object.freeze([
      "PLAN_FROZEN",
      "BASELINE_VERIFIED",
      "GOVERNANCE_CONTRACT_IMPLEMENTED",
      "EXECUTABLE_CONTRACT_IMPLEMENTED",
      "WRITER_QC_PASSED",
      "CANDIDATE_FROZEN",
      "REVIEW_BUNDLE_READY",
      "WAITING_INDEPENDENT_REVIEW",
      "REVIEW_REJECTED",
      "REVIEW_ACCEPTED",
      "FULL_GATE_PASSED",
      "WORK_STATE_SYNCED",
      "PREPUBLISH_DONE"
    ]),
    fullGateAcceptedPath: Object.freeze([
      "PLAN_FROZEN",
      "BASELINE_VERIFIED",
      "GOVERNANCE_CONTRACT_IMPLEMENTED",
      "EXECUTABLE_CONTRACT_IMPLEMENTED",
      "WRITER_QC_PASSED",
      "CANDIDATE_FROZEN",
      "REVIEW_BUNDLE_READY",
      "WAITING_INDEPENDENT_REVIEW",
      "REVIEW_ACCEPTED"
    ]),
    reviewSubjectPath: Object.freeze([
      "PLAN_FROZEN",
      "BASELINE_VERIFIED",
      "GOVERNANCE_CONTRACT_IMPLEMENTED",
      "EXECUTABLE_CONTRACT_IMPLEMENTED",
      "WRITER_QC_PASSED",
      "CANDIDATE_FROZEN",
      "REVIEW_BUNDLE_READY",
      "WAITING_INDEPENDENT_REVIEW"
    ]),
    reviewReceiptBindings: Object.freeze([
      "candidate.commit",
      "candidate.tarballSha256",
      "manifestDigest",
      "releaseReadinessInventoryDigest",
      "reviewBundle.sha256",
      "reviewSubjectDigest",
      "manualVerdicts"
    ])
  }),
  records: Object.freeze({
    "release-readiness": Object.freeze({
      allowedPaths: Object.freeze(["docs/qa/release-grade-qa.md"]),
      requiredReadbackSnippets: Object.freeze([
        "pre-release final audit",
        "full 必須等 clean commit",
        "Full-check role isolation",
        "five-conclusion writer assessment"
      ])
    })
  })
});

export const QA_RELEASE_READINESS_INVENTORY_DIGEST = digest(QA_RELEASE_READINESS_INVENTORY);

export const POST_UPGRADE_STATE_COMPOSITIONS = Object.freeze([
  composition("adjacent-published-pristine-upgrade-closeout", {
    baseline: "previous published npm artifact",
    ownershipDelta: "none",
    transactionPhase: "committed upgrade",
    filesystemSemantics: "canonical archive or absent archive",
    postUpgradeAction: "normal closeout, finalize-closeout, and restart",
    deliveryArtifact: "packed candidate tarball",
    requiredTriples: ["published lineage x packed candidate artifact x closeout/finalize"],
    expected: "upgrade, normal closeout, finalize-closeout, and re-run remain healthy"
  }),
  composition("v045-accepted-witness-legacy-archive-upgrade-closeout", {
    baseline: "published v0.3.41 npm artifact upgraded by published v0.3.45 npm artifact",
    ownershipDelta: "v0.3.45 accepted current-state witness plus legacy lowercase archive",
    transactionPhase: "dry-run then committed upgrade",
    filesystemSemantics: "legacy dev/session_log_archive to canonical dev/SESSION_LOG_archive",
    postUpgradeAction: "normal closeout, finalize-closeout, and restart",
    deliveryArtifact: "packed candidate tarball",
    requiredTriples: [
      "transaction phase x ownership delta x post-upgrade action",
      "published lineage x packed candidate artifact x closeout/finalize",
      "filesystem semantics x path/casing migration x recovery",
      "archive migration history x later source-conservation rebind x doctor authority"
    ],
    expected: "dry-run is non-mutating; transaction canonicalizes nested archive bytes without clobber; a later real upgrade without a new archive migration can retire the schema 3 witness through fresh source-conservation rebind; rollback and pre-durable crash recovery retry; closeout/finalize/restart remain healthy"
  }),
  composition("schema2-state-only-supersession-closeout", {
    baseline: "published v0.3.41 npm artifact upgraded by published v0.3.45 npm artifact and packed candidate",
    ownershipDelta: "source-conservation schema 2 witness followed by a multi-hop state-only schema 1 supersession chain",
    transactionPhase: "committed upgrade plus committed state-only witness chain",
    filesystemSemantics: "normal closeout changes only closeout-finalize state paths",
    postUpgradeAction: "doctor blocks before finalize, finalize rebinds through the stronger witness, doctor and closeout-status pass after finalize",
    deliveryArtifact: "packed candidate tarball",
    requiredTriples: [
      "witness schema x supersession x closeout/finalize",
      "published lineage x packed candidate artifact x stale witness bridge",
      "failure semantics x ambiguous witness x non-closeout drift"
    ],
    expected: "schema 1 cannot become doctor authority over an unretired stronger witness; existing multi-hop downgraded closeout-only roots get a hash-bound transitive finalize bridge; non-closeout drift fails before writes until an authorized repair lets upgrade create a fresh strong rebind; branching, missing links, invalid cycles, ambiguity, and non-closeout drift remain fail-closed"
  })
]);

export const QA_ASSURANCE_MANIFEST_DIGEST = digest({
  assuranceManifest: QA_ASSURANCE_MANIFEST,
  candidateEvidenceContract: CANDIDATE_EVIDENCE_CONTRACT,
  publicMirrorContract: PUBLIC_MIRROR_CONTRACT,
  releasePackageContract: RELEASE_PACKAGE_CONTRACT,
  releaseStateContract: RELEASE_STATE_CONTRACT,
  r034ArtifactContract: R034_ARTIFACT_CONTRACT,
  releaseReadinessInventory: QA_RELEASE_READINESS_INVENTORY,
  postUpgradeStateCompositions: POST_UPGRADE_STATE_COMPOSITIONS
});

export function commandDocumentation() {
  return [
    "<!-- qa-assurance-command:block:start -->",
    "```text",
    QA_ASSURANCE_MANIFEST.layers.quick.command,
    QA_ASSURANCE_MANIFEST.layers.full.command,
    QA_ASSURANCE_MANIFEST.layers.postpublish.command,
    "```",
    "<!-- qa-assurance-command:block:end -->"
  ].join("\n");
}

function claim(id, layer, script, details) {
  return Object.freeze({
    id,
    layer,
    required: true,
    executor: Object.freeze({ kind: "node-script", script, timeoutMs: details.timeoutMs ?? 120_000 }),
    provenance: details.provenance,
    stateAxes: Object.freeze(details.stateAxes),
    expected: Object.freeze({ positive: "executor exits 0", negative: "executor exits nonzero" }),
    readback: details.readback,
    evidenceOutput: "command output",
    failureMode: "parent command exits nonzero",
    outOfScope: "does not establish claims assigned to another layer"
  });
}

function releaseReadinessCheck(id, script, label, timeoutMs) {
  return Object.freeze({ id, script, label, timeoutMs });
}

export function aggregateReleaseReadinessTimeoutMs(inventory = QA_RELEASE_READINESS_INVENTORY, bufferMs = QA_RELEASE_READINESS_TIMEOUT_BUFFER_MS) {
  return inventory.reduce((total, item) => total + item.timeoutMs, bufferMs);
}

function surface(path) {
  return Object.freeze({ path });
}

function pattern(source, flags) {
  return Object.freeze({ source, flags });
}

function composition(id, details) {
  return Object.freeze({ id, ...details, requiredTriples: Object.freeze(details.requiredTriples) });
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
