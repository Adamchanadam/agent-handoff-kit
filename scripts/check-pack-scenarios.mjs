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

main();

function main() {
  assertIncludes(router, ["minimum set", "If a task clearly involves safety risk plus another domain", "cannot weaken core safety"], "router minimum loading rule");

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

  console.log("");
  console.log("Agent Handoff Kit pack scenario QA passed");
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
