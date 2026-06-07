#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const router = read("runtime-core/RULE_PACKS.md");
const packs = {
  safety: read("packs/safety.md"),
  coding: read("packs/coding.md"),
  writing: read("packs/writing.md"),
  research: read("packs/research.md"),
  "agent-governance": read("packs/agent-governance.md"),
  release: read("packs/release.md"),
  knowledge: read("packs/knowledge.md"),
  communication: read("packs/communication.md"),
  onboarding: read("packs/onboarding.md"),
  integrations: read("packs/integrations.md")
};

const expectedPackFiles = {
  safety: "dev/rules/safety.md",
  coding: "dev/rules/coding.md",
  writing: "dev/rules/writing.md",
  research: "dev/rules/research.md",
  "agent-governance": "dev/rules/agent-governance.md",
  release: "dev/rules/release.md",
  knowledge: "dev/rules/knowledge.md",
  communication: "dev/rules/communication.md",
  onboarding: "dev/rules/onboarding.md",
  integrations: "dev/rules/integrations.md"
};

const scenarios = [
  {
    name: "coding",
    route: ["Code, tests, build", "dev/rules/coding.md"],
    pack: "coding",
    snippets: ["tests", "dev/PROJECT_INDEX.md", "Do not guess current SDK"],
    safetyEscalators: ["package managers", "SDKs", "CLIs", "APIs"]
  },
  {
    name: "research",
    route: ["Sources, evidence", "dev/rules/research.md"],
    pack: "research",
    snippets: ["primary sources", "Separate verified facts", "Record dates"]
  },
  {
    name: "writing",
    route: ["Draft, edit", "dev/rules/writing.md"],
    pack: "writing",
    snippets: ["audience", "Preserve factual meaning", "terminology consistent", "non-technical readers", "steady written Chinese", "new user journey"]
  },
  {
    name: "knowledge",
    route: ["External notes", "dev/rules/knowledge.md"],
    pack: "knowledge",
    snippets: ["source of truth", "external surface", "Connector-first default", "read back the written record", "Do not treat unread sources as absent"],
    safetyEscalators: ["cloud tools", "external APIs", "data loss"]
  },
  {
    name: "release",
    route: ["Release, publish", "dev/rules/release.md"],
    pack: "release",
    snippets: ["Do not publish", "Verify version", "release notes"],
    safetyEscalators: ["publish", "deploy", "tag"]
  },
  {
    name: "safety",
    route: ["Destructive file operations", "dev/rules/safety.md"],
    pack: "safety",
    snippets: ["deleting, overwriting", "filesystem root, drive root", "git reset --hard", "external APIs, SDKs, CLIs", "secret values"]
  },
  {
    name: "agent governance",
    route: ["Governance, prompts, agents", "dev/rules/agent-governance.md"],
    pack: "agent-governance",
    snippets: ["source of truth", "append-only", "public runtime", "Before creating durable workflow", "reusable operating procedures belong in the relevant rule pack or registered reference", "New runbooks are last resort only", "not stored only in `dev/SESSION_HANDOFF.md`", "external skills", "subagents", "active root's Agent Handoff Kit governance"]
  },
  {
    name: "governance bridge",
    route: ["Governance bridge / 治理打通", "接入 Agent Handoff Kit", "掃描未接入 Agent Handoff Kit 的重要文件", "scan for unbridged governance documents", "dev/rules/agent-governance.md"],
    pack: "agent-governance",
    snippets: ["Governance Bridge Workflow", "接入 Agent Handoff Kit", "掃描未接入 Agent Handoff Kit 的重要文件", "connect this document to governance", "scan for unbridged governance documents", "target file itself", "dev/PROJECT_INDEX.md", "dev/DOC_SYNC_REGISTRY.md", "duplicate source-of-truth risk", "Status: bridged / partially bridged / unbridged / blocked"]
  },
  {
    name: "communication",
    route: ["Reply format, language", "dev/rules/communication.md"],
    pack: "communication",
    snippets: ["language", "unverified facts", "copy-paste-ready"]
  },
  {
    name: "onboarding (R-029)",
    route: ["First-time user signals", "dev/rules/onboarding.md"],
    pack: "onboarding",
    snippets: ["Onboarding Pack", "transient pack", "5-step walk-through pattern", "Scenario A. 建構系統 / 工具 / 平台 / 網站或應用", "Scenario E. 其他", "Scenario F. 審視已裝外部工具", "Tone Discipline", "Anti-pattern"]
  },
  {
    name: "integrations (R-030)",
    route: ["External tool integrations", "dev/rules/integrations.md"],
    pack: "integrations",
    snippets: ["Integrations Pack", "Connectors（Anthropic 官方 vetted）", "MCPs（community / custom）", "Plugins（Claude Code plugin bundle）", "Skills（SKILL.md instruction set）", "機密分離原則", "Source-of-truth Architecture", "Cross-session Lifecycle", "Connector-first default"]
  }
];

const mixedScenarios = [
  {
    name: "market research to website copy",
    phases: [
      ["research"],
      ["research", "writing"],
      ["writing", "communication"]
    ]
  },
  {
    name: "coding to docs to release prep",
    phases: [
      ["coding"],
      ["coding", "writing"],
      ["release", "safety"]
    ]
  },
  {
    name: "knowledge sync with external write risk",
    phases: [
      ["knowledge"],
      ["knowledge", "research"],
      ["knowledge", "safety"]
    ]
  },
  {
    name: "first-time onboarding to first task (R-029)",
    phases: [
      ["onboarding"],
      ["onboarding", "coding"],
      ["coding"]
    ]
  },
  {
    name: "Notion DB Index + 本機真源 + Google Drive 參考檔 multi-source governance (R-030)",
    phases: [
      ["onboarding", "integrations"],
      ["integrations", "knowledge"],
      ["integrations", "knowledge", "writing"]
    ]
  },
  {
    name: "cross-tool Integration drift fallback (R-030)",
    phases: [
      ["integrations"],
      ["integrations", "knowledge"],
      ["integrations", "safety"]
    ]
  }
];

const governanceBridgeUseCases = [
  {
    name: "new stock list source-of-truth",
    route: ["Governance bridge / 治理打通", "接入 Agent Handoff Kit", "dev/rules/agent-governance.md"],
    pack: ["stock list", "target file itself", "dev/PROJECT_INDEX.md", "dev/DOC_SYNC_REGISTRY.md", "duplicate source-of-truth risk"],
    publicDocs: ["把 docs/stock-list.md 接入 Agent Handoff Kit", "治理打通 docs/stock-list.md", "bridge governance for docs/stock-list.md"]
  },
  {
    name: "production guide / runbook",
    route: ["把文件接入 Agent Handoff Kit", "connect this document to governance", "dev/rules/agent-governance.md"],
    pack: ["production guide", "runbook", "related workflows, guides, runbooks, or rule packs", "Acceptance: give one concrete check"],
    publicDocs: ["把 docs/production-guide.md 接入 Agent Handoff Kit", "我剛建立了 <code>docs/production-guide.md</code>,把這份文件接入 Agent Handoff Kit"]
  },
  {
    name: "repo-wide unbridged document scan",
    route: ["掃描未接入 Agent Handoff Kit 的重要文件", "scan for unbridged governance documents", "dev/rules/agent-governance.md"],
    pack: ["bounded repo scan", "For repo-wide scans, report candidates as candidates", "Do not fail ordinary docs merely because they are not indexed"],
    publicDocs: ["掃描未接入 Agent Handoff Kit 的重要文件", "scan for unbridged governance documents", "這個掃描只列出候選與缺口"]
  },
  {
    name: "duplicate source-of-truth risk",
    route: ["Governance bridge / 治理打通", "dev/rules/agent-governance.md"],
    pack: ["duplicate source-of-truth risk", "recommend merge, reference, or retire options", "do not delete, rename, or move files without explicit approval"],
    publicDocs: ["不會自動刪除、改名或合併文件", "不亂改"]
  }
];

main();

function main() {
  assertIncludes(router, ["minimum set", "If a task clearly involves safety risk plus another domain", "cannot weaken core safety"], "router minimum loading rule");
  assertPackStructure();

  for (const scenario of scenarios) {
    assertIncludes(router, scenario.route, `${scenario.name} router`);
    assertIncludes(packs[scenario.pack], scenario.snippets, `${scenario.name} pack`);
    if (scenario.safetyEscalators) {
      assertIncludes(packs.safety, scenario.safetyEscalators, `${scenario.name} safety escalation`);
    }
    console.log(`ok: ${scenario.name} routing`);
  }

  for (const scenario of mixedScenarios) {
    for (const phase of scenario.phases) {
      assert(phase.length <= 3, `${scenario.name} phase loads too many packs: ${phase.join(", ")}`);
      for (const pack of phase) assert(packs[pack], `${scenario.name} references unknown pack: ${pack}`);
    }
    const flattened = new Set(scenario.phases.flat());
    assert(flattened.size < Object.keys(packs).length, `${scenario.name} loads every pack`);
    console.log(`ok: ${scenario.name} phased loading`);
  }

  assertGovernanceBridgeUseCaseMatrix();

  console.log("");
  console.log("Agent Handoff Kit pack scenario QA passed");
}

function assertPackStructure() {
  for (const [packName, installedPath] of Object.entries(expectedPackFiles)) {
    assert(router.includes(installedPath), `router missing installed path for ${packName}: ${installedPath}`);
    if (packName === "onboarding") {
      assertIncludes(packs[packName], ["## Scope", "## Load When", "## Discipline", "## Application Scenario Library", "## Closeout", "## Anti-pattern"], `${packName} pack structure`);
    } else {
      assertIncludes(packs[packName], ["## Scope", "## Load When", "## Rules", "## Checks", "## Closeout"], `${packName} pack structure`);
    }
  }

  assertIncludes(packs["agent-governance"], [
    "Before creating durable workflow",
    "first classify the knowledge type",
    "reusable operating procedures belong in the relevant rule pack or registered reference",
    "New runbooks are last resort only",
    "not stored only in `dev/SESSION_HANDOFF.md`",
    "Governance Bridge Workflow",
    "For repo-wide scans, report candidates as candidates"
  ], "agent governance durable-home routing");

  console.log("ok: rule pack structure and durable-home routing");
}

function assertGovernanceBridgeUseCaseMatrix() {
  const publicDocs = [
    read("README.md"),
    read("agent-handoff-kit-intro.html"),
    read("agent-handoff-kit-guide.html")
  ].join("\n");

  assertIncludes(packs["agent-governance"], [
    "Governance bridge is a triggered review, not a default startup scan",
    "Status: bridged / partially bridged / unbridged / blocked",
    "Already bridged",
    "Gaps",
    "Suggested patches",
    "Manual decisions",
    "Acceptance"
  ], "governance bridge output contract");

  for (const useCase of governanceBridgeUseCases) {
    assertIncludes(router, useCase.route, `${useCase.name} governance bridge route`);
    assertIncludes(packs["agent-governance"], useCase.pack, `${useCase.name} governance bridge pack`);
    assertIncludes(publicDocs, useCase.publicDocs, `${useCase.name} public docs`);
    console.log(`ok: governance bridge use case - ${useCase.name}`);
  }
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function assertIncludes(text, snippets, label) {
  for (const snippet of snippets) {
    assert(text.includes(snippet), `${label} missing snippet: ${snippet}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
