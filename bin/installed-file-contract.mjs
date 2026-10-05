// Single source of truth for the current file lifecycle Agent Handoff Kit
// installs and upgrades. Fresh-only files are declared separately so their
// path cannot silently become current lifecycle authority before that route is
// explicitly present.

import { commands, commandFiles } from './commands.mjs';

// Source-to-delivery routing. Unknown new shipped modules must receive an owner.
// QA stages/evidence are defined by the existing assurance gate, not runtime doctor.
export const deliveredFeatureContracts = Object.freeze([
 {id:'installer',sources:['package.json','bin/agent-handoff-kit.mjs','bin/installed-file-contract.mjs','bin/official-origin-catalog.mjs','bin/migration-baselines/','bin/upgrade-inventory.mjs','bin/user-rules-router.mjs']},
 {id:'shortcuts',sources:['bin/commands.mjs'],requiredForFull:true,hosts:['claude','gemini','codex','antigravity'],nativeAcceptanceHosts:['codex'],nativeInvocationEntries:commands.map(({name})=>name)},
 {id:'dashboard',sources:['bin/progress/']},
 {id:'continuity',sources:['runtime-core/','bin/handoff-read.mjs','bin/prompt-mirror-core.mjs']},
 {id:'task-packs',sources:['packs/']}
].map(x=>Object.freeze(x)));

// These are delivery dependencies, not runtime ownership. They decide whether
// a historical shortcut raw case can still describe the current package.
export const packageInstallDependencyRoots=Object.freeze([
 'package.json','bin/agent-handoff-kit.mjs','bin/commands.mjs','bin/installed-file-contract.mjs',
 'bin/official-origin-catalog.mjs','bin/migration-baselines/','bin/upgrade-inventory.mjs','bin/user-rules-router.mjs',
 'bin/handoff-read.mjs','bin/prompt-mirror-core.mjs','bin/progress/','runtime-core/','packs/'
]);
const sharedShortcutDependencyRoots=Object.freeze(['bin/commands.mjs','runtime-core/']);
const shortcutEntrySpecificDependencyRoots=Object.freeze({
 'handoff-kit-start':Object.freeze(['bin/agent-handoff-kit.mjs','bin/handoff-read.mjs','packs/onboarding.md']),
 'handoff-kit-close':Object.freeze([...packageInstallDependencyRoots,'packs/closeout.md','packs/safety.md']),
 'handoff-kit-progress':Object.freeze(['package.json','bin/progress/']),
 'handoff-kit-align':Object.freeze(['packs/agent-governance.md']),
 'handoff-kit-onboard':Object.freeze(['packs/onboarding.md']),
 'handoff-kit-remember':Object.freeze(['packs/agent-governance.md']),
 'handoff-kit-check':packageInstallDependencyRoots,
 'handoff-kit-update':packageInstallDependencyRoots,
 'handoff-kit-help':Object.freeze([])
});
export function dependencyRootMatches(file,root){return root.endsWith('/')?file.startsWith(root):file===root;}
export function shortcutEntryDependencyRoots(entry){
 if(!Object.hasOwn(shortcutEntrySpecificDependencyRoots,entry))throw Error(`Unknown shortcut delivery dependency entry: ${entry}`);
 return Object.freeze([...new Set([...sharedShortcutDependencyRoots,...shortcutEntrySpecificDependencyRoots[entry]])]);
}

export const INSTALLED_FILE_CONTRACT_SCHEMA = 1;
// Generated project entries share one content owner. Only these exact paths
// enter installer recovery; platform directories are never blanket-owned.
export const SHORTCUT_INSTALL_CONTRACT = 1;
export const requiredShortcutTargets = Object.freeze(commandFiles().map(({file})=>file));

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
