#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const router = read("runtime-core/RULE_PACKS.md");
const core = read("runtime-core/AGENTS.core.md");
const projectIndex = read("runtime-core/PROJECT_INDEX.md");
const packs = {
  safety: read("packs/safety.md"),
  coding: read("packs/coding.md"),
  writing: read("packs/writing.md"),
  research: read("packs/research.md"),
  "agent-governance": read("packs/agent-governance.md"),
  release: read("packs/release.md"),
  knowledge: read("packs/knowledge.md"),
  communication: read("packs/communication.md"),
  closeout: read("packs/closeout.md"),
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
  closeout: "dev/rules/closeout.md",
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
    snippets: ["audience", "Preserve factual meaning", "terminology consistent", "non-technical readers", "steady written Chinese", "new user journey", "the user states the goal, the AI handles technical work", "one primary user path", "dedicated AI install page", "main README flow", "source-language document is the sole content authority", "source-to-target section map", "independent reviewer who did not draft the target", "semantic acceptance, not just mechanical checks", "only when that language pair changed", "Unchanged language pairs do not require a new review"]
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
    snippets: ["Do not publish", "Verify version", "release notes", "changes a public language counterpart", "unchanged pairs"],
    safetyEscalators: ["publish", "deploy", "tag"]
  },
  {
    name: "safety",
    route: ["Destructive file operations", "dev/rules/safety.md"],
    pack: "safety",
    snippets: ["deleting, overwriting", "filesystem root, drive root", "git reset --hard", "external APIs, SDKs, CLIs", "parser failure", "minimal reproducible script", "syntax-only check", "read back the affected files", "secret values", "Process termination and cache cleanup boundary", "task-owned or agent-managed", "Generic process names such as `node`, `python`, or `chrome` are never enough ownership evidence", "another AI agent running on the same machine"]
  },
  {
    name: "agent governance",
    route: ["Governance, prompts, agents", "dev/rules/agent-governance.md"],
    pack: "agent-governance",
    snippets: ["source of truth", "append-only", "public runtime", "Before creating durable workflow", "reusable operating procedures belong in the relevant rule pack or registered reference", "New runbooks are last resort only", "not stored only in `dev/SESSION_HANDOFF.md`", "recommended next action with reason", "external skills", "subagents", "active root's Agent Handoff Kit governance"]
  },
  {
    name: "governance bridge",
    route: ["Governance bridge / bridge governance", "equivalent Chinese user phrases", "scan for unbridged governance documents", "dev/rules/agent-governance.md"],
    pack: "agent-governance",
    snippets: ["Governance Bridge Workflow", "equivalent Chinese phrases", "connect this document to governance", "scan for unbridged governance documents", "target file itself", "dev/PROJECT_INDEX.md", "dev/DOC_SYNC_REGISTRY.md", "duplicate source-of-truth risk", "Status: bridged / partially bridged / unbridged / blocked", "Not applicable: list skipped layers with a reason"]
  },
  {
    name: "long-term governance routing",
    route: ["Long-term governance routing", "寫入長期治理", "轉成長期機制", "future sessions should remember", "dev/rules/agent-governance.md"],
    pack: "agent-governance",
    snippets: ["Long-term Governance Routing", "Content-based trigger", "future sessions must follow it", "recurring AI mistake", "reusable API / MCP / tool-use pattern", "Do not persist long-term governance knowledge only in", "promote it to the correct durable home"]
  },
  {
    name: "communication",
    route: ["Reply format, language", "dev/rules/communication.md"],
    pack: "communication",
    snippets: ["language", "unverified facts", "copy-paste-ready", "recommended next step", "short reason", "do not turn an already-made technical judgment into an open question"]
  },
  {
    name: "onboarding (R-029)",
    route: ["Explicit onboarding requests", "dev/rules/onboarding.md"],
    pack: "onboarding",
    snippets: ["Onboarding Pack", "transient pack", "Infer when sufficient; ask only when unresolved", "Guided 5-step walk-through pattern", "Scenario A. Build systems, tools, platforms, websites, or apps", "Scenario E. Custom scenario", "Scenario F. External-tool governance", "Tone Discipline", "Anti-patterns"]
  },
  {
    name: "integrations (R-030)",
    route: ["actually uses an external Connector", "External tool resource pressure", "dev/rules/integrations.md"],
    pack: "integrations",
    snippets: ["Integrations Pack", "Connectors", "MCPs", "Plugins", "Skills", "Credential Separation Principle", "External Tool Usage Verification Gate", "External Tool Resource Lifecycle", "task-owned", "agent-managed", "Shared / user-owned / other-agent-owned / system-level", "shared, user-owned, system-level, other-agent-owned, or unknown", "another AI agent's active tools", "do not invent", "input schema", "official documentation", "blocked", "unverified", "Source-of-truth Architecture", "Cross-session Lifecycle", "Connector-first default"]
  },
  {
    name: "runtime-controlled tool operation",
    route: ["Runtime-controlled tool operation", "browser UI validation", "Chrome", "Playwright", "DevTools", "crawler", "notebook", "dev/rules/integrations.md", "dev/rules/safety.md"],
    pack: "integrations",
    snippets: ["Runtime-Controlled Tool Operation Variants", "Browser / UI validation", "Tool Operation References", "Do not guess Chrome, Playwright, or DevTools commands", "registered tool operation reference", "Local HTML / app validation fallback", "`file://` rejection alone is not enough evidence to stop", "short-lived localhost service", "blocked", "unverified"],
    safetyEscalators: ["browser profiles", "desktop app sessions", "shared tool servers", "notebook kernels", "Short-lived localhost validation services", "Generic process names such as `node`, `python`, or `chrome` are never enough ownership evidence"]
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
    name: "Notion index + local source of truth + Google Drive mirror multi-source governance (R-030)",
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
  },
  {
    name: "external tool resource pressure closeout (R-030)",
    phases: [
      ["integrations"],
      ["integrations", "safety"],
      ["integrations", "safety"]
    ]
  },
  {
    name: "browser and runtime tool validation",
    phases: [
      ["integrations", "safety"],
      ["integrations", "safety", "coding"],
      ["integrations", "safety"]
    ]
  }
];

const runtimeToolUseCases = [
  {
    name: "browser validation and screenshot",
    route: ["browser UI validation", "visual QA", "screenshot", "dev/rules/integrations.md", "dev/rules/safety.md"],
    pack: ["Browser / UI validation", "screenshot", "Do not guess Chrome, Playwright, or DevTools commands", "short-lived localhost service", "manual packet"],
    projectIndex: ["## Tool Operation References", "browser validation", "screenshots", "Source and version/date", "Local HTML / app browser validation"]
  },
  {
    name: "file URL blocked local HTML fallback",
    route: ["local HTML validation", "file:// blocked", "localhost fallback", "dev/rules/integrations.md", "dev/rules/safety.md"],
    pack: ["Local HTML / app validation fallback", "A blocked browser surface is not the same as a blocked validation task", "do not try to bypass that policy", "short-lived localhost service", "Only mark local HTML / app validation as `blocked`"],
    projectIndex: ["Local HTML / app browser validation", "short-lived loopback localhost service", "cleanup result"]
  },
  {
    name: "Chrome DevTools or Playwright operation",
    route: ["Chrome", "Playwright", "DevTools", "dev/rules/integrations.md", "dev/rules/safety.md"],
    pack: ["Chrome", "Playwright", "DevTools", "Active runtime", "current official docs"],
    projectIndex: ["DevTools", "Playwright", "Scope and known limits"]
  },
  {
    name: "crawler or notebook runtime",
    route: ["crawler", "notebook", "dev/rules/integrations.md", "dev/rules/safety.md"],
    pack: ["Crawler / scraper / local helper", "Notebook / data runtime", "Classify kernels and servers by ownership before cleanup"],
    projectIndex: ["crawlers", "notebooks", "MCP/plugin helpers"]
  },
  {
    name: "unknown tool retry and cleanup boundary",
    route: ["raw CLI, SDK, tool server, MCP, plugin", "dev/rules/integrations.md", "dev/rules/safety.md"],
    pack: ["unknown tool", "invalid arguments", "Stop same-pattern retries", "Shared or ambiguous resources require explicit user confirmation"],
    projectIndex: ["raw CLI/SDK operations", "Last verified"]
  }
];

const governanceBridgeUseCases = [
  {
    name: "new stock list source-of-truth",
    route: ["Governance bridge / bridge governance", "equivalent Chinese user phrases", "dev/rules/agent-governance.md"],
    pack: ["stock list", "target file itself", "dev/PROJECT_INDEX.md", "dev/DOC_SYNC_REGISTRY.md", "duplicate source-of-truth risk"],
    publicDocs: ["把 docs/stock-list.md 接入 Agent Handoff Kit", "治理打通 docs/stock-list.md", "bridge governance for docs/stock-list.md"]
  },
  {
    name: "production guide / runbook",
    route: ["equivalent Chinese user phrases", "connect this document to governance", "dev/rules/agent-governance.md"],
    pack: ["production guide", "runbook", "related workflows, guides, runbooks, or rule packs", "Acceptance: give one concrete check"],
    publicDocs: ["把 docs/production-guide.md 接入 Agent Handoff Kit", "我剛建立了 <code>docs/production-guide.md</code>,把這份文件接入 Agent Handoff Kit"]
  },
  {
    name: "repo-wide unbridged document scan",
    route: ["equivalent Chinese user phrases", "scan for unbridged governance documents", "dev/rules/agent-governance.md"],
    pack: ["bounded repo scan", "For repo-wide scans, report candidates as candidates", "Do not fail ordinary docs merely because they are not indexed"],
    publicDocs: ["掃描未接入 Agent Handoff Kit 的重要文件", "scan for unbridged governance documents", "AI 只會先列出可能需要接入的文件與原因"]
  },
  {
    name: "duplicate source-of-truth risk",
    route: ["Governance bridge / bridge governance", "dev/rules/agent-governance.md"],
    pack: ["duplicate source-of-truth risk", "recommend merge, reference, or retire options", "do not delete, rename, or move files without explicit approval"],
    publicDocs: ["不會自動刪除、改名或合併文件", "不亂改"]
  }
];

const longTermGovernanceUseCases = [
  {
    name: "recurring AI mistake becomes mechanism",
    route: ["寫入長期治理", "轉成長期機制", "dev/rules/agent-governance.md"],
    pack: ["recurring AI mistake", "the relevant rule pack, registered reference, or QA check", "Do not persist long-term governance knowledge only in"],
    publicDocs: ["把今次錯誤整理成日後工作規則", "讓下次 AI 知道要怎樣避免"]
  },
  {
    name: "API MCP tool pattern survives sessions",
    route: ["always use this API or MCP pattern", "future sessions should remember", "dev/rules/agent-governance.md"],
    pack: ["API / MCP / tool-use pattern", "project index / registered reference", "promote it to the correct durable home"],
    publicDocs: ["以後都用這個 API 調用方式", "之後開新對話也要沿用"]
  },
  {
    name: "content-based classification without exact trigger",
    route: ["之後都要遵守", "跨 session 有效", "dev/rules/agent-governance.md"],
    pack: ["Content-based trigger", "Even if the user does not use explicit governance-routing phrases", "future sessions must follow it"],
    publicDocs: ["需要長期保留的規則", "不是只留在當次對話摘要"]
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
  assertLongTermGovernanceUseCaseMatrix();
  assertRuntimeToolUseCaseMatrix();
  assertOnboardingDecisionCases();

  console.log("");
  console.log("Agent Handoff Kit pack scenario QA passed");
}

function assertPackStructure() {
  for (const [packName, installedPath] of Object.entries(expectedPackFiles)) {
    assert(router.includes(installedPath), `router missing installed path for ${packName}: ${installedPath}`);
    if (packName === "onboarding") {
      assertIncludes(packs[packName], ["## Scope", "## Load When", "## Discipline", "## Application Scenario Library", "## Closeout", "## Anti-pattern"], `${packName} pack structure`);
    } else if (packName === "closeout") {
      assertIncludes(packs[packName], ["## Scope", "## Required Reads", "## Write Contract", "## Full Closeout", "Reconcile lifecycle state", "## Opening Message And Card", "## Stop Conditions"], `${packName} pack structure`);
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
    "For repo-wide scans, report candidates as candidates",
    "Long-term Governance Routing",
    "Content-based trigger",
    "Do not persist long-term governance knowledge only in",
    "doctor does not discover unregistered ordinary workspace files",
    "cannot replace explicit changed-artifact review"
  ], "agent governance durable-home routing");

  assertIncludes(core, [
    "Before changing `AGENTS.md` or adding a durable governance rule",
    "use `dev/RULE_PACKS.md` to load `dev/rules/agent-governance.md`",
    "locate the existing normative owner",
    "Default-core rules must apply to most sessions",
    "protect safety or continuity",
    "be shorter than the routed detail they replace",
    "Do not copy the agent-governance classification table or workflow into the core"
  ], "core governance pre-edit routing gate");

  console.log("ok: rule pack structure and durable-home routing");
}

function assertOnboardingDecisionCases() {
  assertIncludes(router, [
    "Explicit onboarding requests",
    "A fresh install or \"I just installed\" is eligibility context, not a forced route",
    "is continuity",
    "infer when sufficient and begin a concrete task directly",
    "no executable objective remains"
  ], "onboarding decision-first router");
  assertIncludes(packs.onboarding, [
    "Continuity startup boundary",
    "starts continuity and reads the minimum current handoff state; it is not an onboarding signal",
    "Explicit requests such as \"新手，教我用\" enter onboarding directly",
    "When the user has already supplied a concrete, actionable objective and enough material facts",
    "Only show the scenario chooser when the user's intent remains genuinely unresolved",
    "High-risk, external, permission, cost, publishing, and irreversible actions still require"
  ], "onboarding three-case contract");
  assert(!packs.onboarding.includes("Offer scenario choice before task execution"), "onboarding pack still contains the mandatory chooser heading");
  assert(!packs.onboarding.includes("Each scenario keeps the same five-step rhythm"), "onboarding pack still treats the five-step path as mandatory");
  const explicitSignals = packs.onboarding.slice(
    packs.onboarding.indexOf("### Explicit onboarding signal keywords"),
    packs.onboarding.indexOf("### Continuity startup boundary")
  );
  assert(!explicitSignals.includes("開工"), "onboarding explicit signal list must not classify 開工 as a teaching request");
  const onboardingRouterRow = router.split(/\r?\n/).find((line) => line.includes("dev/rules/onboarding.md"));
  assert(onboardingRouterRow, "onboarding router row missing");
  const routerSignalList = onboardingRouterRow.slice(0, onboardingRouterRow.indexOf("`Start Agent Handoff`"));
  assert(!routerSignalList.includes("開工"), "onboarding router signal list must not classify 開工 as a teaching request");
  assertIncludes(core, [
    "Clear continuity intent such as \"開工\"",
    "A plain continuity message with no same-message task or explicit long-run instruction authorizes only that recovery",
    "one optional display-only title update when safely supported",
    "and then the end of the turn",
    "It does not authorize task-specific reads, research, plans, protocols, preflight, file searches, sub-agents, QA, packaging, project-file writes, network access, other external actions",
    "A concrete objective found only in loaded state is not authority to complete it",
    "current-title readback and title control",
    "Replace only a generic or stale title",
    "keep an informative title",
    "Use `<project name>｜<primary action>` from facts already loaded for startup",
    "a concrete same-message task first",
    "the loaded current objective plus recommended next action",
    "Do not read `dev/PROJECT_INDEX.md`, files, network, or other state solely to name the title",
    "skip silently",
    "display-only; it is not project state, permission, progress, completion evidence, a health result, or a source of truth",
    "開工，繼續做到下一個 blocker",
    "A direct ordinary task begins without a startup card or onboarding ceremony",
    "If no executable objective remains after state reading"
  ], "continuity startup core boundary");
  assert(!core.includes("If the same message or loaded state contains a concrete objective, begin its first safe action in the same response"), "plain 開工 still turns a loaded objective into same-turn full-task authority");
  assert(!core.includes("at most one bounded, low-cost, reversible first checkpoint"), "plain 開工 still permits a task checkpoint");
  console.log("ok: 開工 only -> restore minimum state, optionally update display title, show card/status, then return control");
  console.log("ok: 開工 + explicit continuation -> may proceed under the normal task rules");
  console.log("ok: direct ordinary task -> no startup ceremony");
  console.log("ok: 新手，教我用 -> onboarding");
  console.log("ok: onboarding high-risk confirmation remains unchanged");
}

function assertRuntimeToolUseCaseMatrix() {
  assertIncludes(projectIndex, [
    "## Tool Operation References",
    "runtime-controlled tools",
    "browser validation",
    "Source and version/date",
    "Scope and known limits"
  ], "project index tool operation reference registry");

  for (const useCase of runtimeToolUseCases) {
    assertIncludes(router, useCase.route, `${useCase.name} runtime tool route`);
    assertIncludes(packs.integrations, useCase.pack, `${useCase.name} integrations pack`);
    assertIncludes(projectIndex, useCase.projectIndex, `${useCase.name} project index`);
    console.log(`ok: runtime tool use case - ${useCase.name}`);
  }
}

function assertLongTermGovernanceUseCaseMatrix() {
  const publicDocs = [
    read("README.md"),
    read("agent-handoff-kit-intro.html"),
    read("agent-handoff-kit-guide.html")
  ].join("\n");

  assertIncludes(packs["agent-governance"], [
    "Long-term Governance Routing",
    "Content-based trigger",
    "project index / registered reference / integrations pack",
    "the relevant rule pack, registered reference, or QA check",
    "Do not persist long-term governance knowledge only in"
  ], "long-term governance routing contract");

  for (const useCase of longTermGovernanceUseCases) {
    assertIncludes(router, useCase.route, `${useCase.name} long-term governance route`);
    assertIncludes(packs["agent-governance"], useCase.pack, `${useCase.name} long-term governance pack`);
    assertIncludes(publicDocs, useCase.publicDocs, `${useCase.name} public docs`);
    console.log(`ok: long-term governance use case - ${useCase.name}`);
  }
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
    "Use bridged only when every applicable governance link is present",
    "If only `dev/PROJECT_INDEX.md` or `dev/SESSION_LOG.md` was updated, report partially bridged",
    "Already bridged",
    "Gaps",
    "Not applicable",
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
