// Single source of truth for the current file lifecycle Agent Handoff Kit
// installs and upgrades. Fresh-only files are declared separately so their
// path cannot silently become current lifecycle authority before that route is
// explicitly present.

export const INSTALLED_FILE_CONTRACT_SCHEMA = 1;

export const installedFileContracts = Object.freeze([
  contract("runtime-core/AGENTS.core.md", "AGENTS.md", "managed-core"),
  contract("runtime-core/CLAUDE.md", "CLAUDE.md", "strict-bridge"),
  contract("runtime-core/GEMINI.md", "GEMINI.md", "strict-bridge"),
  contract("runtime-core/START_NEXT_SESSION_PROMPT.txt", "START_NEXT_SESSION_PROMPT.txt", "generated-state"),
  contract("runtime-core/SESSION_HANDOFF.md", "dev/SESSION_HANDOFF.md", "stateful-handoff"),
  contract("runtime-core/SESSION_LOG.md", "dev/SESSION_LOG.md", "stateful-log"),
  contract("runtime-core/PROJECT_INDEX.md", "dev/PROJECT_INDEX.md", "stateful-index"),
  contract("runtime-core/DOC_SYNC_REGISTRY.md", "dev/DOC_SYNC_REGISTRY.md", "stateful-registry"),
  contract("runtime-core/RULE_PACKS.md", "dev/RULE_PACKS.md", "marked-routing-table"),
  contract("runtime-core/PROJECT_DECISIONS.md", "dev/PROJECT_DECISIONS.md", "stateful-decisions"),
  contract("packs/safety.md", "dev/rules/safety.md", "rule-pack"),
  contract("packs/coding.md", "dev/rules/coding.md", "rule-pack"),
  contract("packs/writing.md", "dev/rules/writing.md", "rule-pack"),
  contract("packs/research.md", "dev/rules/research.md", "rule-pack"),
  contract("packs/agent-governance.md", "dev/rules/agent-governance.md", "rule-pack"),
  contract("packs/release.md", "dev/rules/release.md", "rule-pack"),
  contract("packs/knowledge.md", "dev/rules/knowledge.md", "rule-pack"),
  contract("packs/communication.md", "dev/rules/communication.md", "rule-pack"),
  contract("packs/closeout.md", "dev/rules/closeout.md", "rule-pack"),
  contract("packs/onboarding.md", "dev/rules/onboarding.md", "rule-pack"),
  contract("packs/integrations.md", "dev/rules/integrations.md", "rule-pack")
]);

export const installedMappings = Object.freeze(
  installedFileContracts.map(({ sourceRel, targetRel }) => Object.freeze([sourceRel, targetRel]))
);

// The router is installed on fresh roots, but is not evidence that an arbitrary
// mixed file is Kit-managed. Its upgrade treatment lives in a separate current
// transition contract below rather than broad path ownership.
export const freshInstallFileContracts = Object.freeze([
  ...installedFileContracts,
  contract("runtime-core/USER_RULES.md", "dev/USER_RULES.md", "fresh-user-router")
]);

export const freshInstallMappings = Object.freeze(
  freshInstallFileContracts.map(({ sourceRel, targetRel }) => Object.freeze([sourceRel, targetRel]))
);

// Formal user-rule state is part of an upgrade only when the existing AGENTS.md
// entry and router form one verifiable current formal state. This separate
// contract deliberately does not reclassify a path, title, or directory as Kit
// authority.
export const upgradeStateFileContracts = Object.freeze([
  contract("runtime-core/USER_RULES.md", "dev/USER_RULES.md", "accepted-user-rules-router")
]);

export const upgradeStateMappings = Object.freeze(
  upgradeStateFileContracts.map(({ sourceRel, targetRel }) => Object.freeze([sourceRel, targetRel]))
);

export const upgradeStateTargets = Object.freeze(
  upgradeStateFileContracts.map(({ targetRel }) => targetRel)
);

export const requiredInstalledTargets = Object.freeze(
  installedFileContracts.map(({ targetRel }) => targetRel)
);

export function installedFileContract(targetRel) {
  return installedFileContracts.find((item) => item.targetRel === targetRel) ?? null;
}

function contract(sourceRel, targetRel, strategy) {
  return Object.freeze({ sourceRel, targetRel, strategy });
}
