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
  communication: read("packs/communication.md")
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
    snippets: ["audience", "Preserve factual meaning", "terminology consistent"]
  },
  {
    name: "knowledge",
    route: ["External notes", "dev/rules/knowledge.md"],
    pack: "knowledge",
    snippets: ["source of truth", "external surface", "ready-to-paste sync packet", "read back the written record", "Do not treat unread sources as absent"],
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
    snippets: ["source of truth", "append-only", "public runtime", "Before creating durable workflow", "dev/PROJECT_INDEX.md", "external skills", "subagents", "active root's Agent Handoff Kit governance"]
  },
  {
    name: "communication",
    route: ["Reply format, language", "dev/rules/communication.md"],
    pack: "communication",
    snippets: ["language", "unverified facts", "copy-paste-ready"]
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
