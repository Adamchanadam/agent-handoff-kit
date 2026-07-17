#!/usr/bin/env node

// Contract-level regression check for AI-facing response rules. It verifies the
// installed routing and two representative response shapes; it does not claim
// to measure every external AI runtime's compliance.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const core = read("runtime-core/AGENTS.core.md");
const communication = read("packs/communication.md");
const router = read("runtime-core/RULE_PACKS.md");

assert(
  core.includes("In every user-facing reply, lead with ordinary language: state the result and its practical effect, then the next action when one helps."),
  "always-read core lacks the concise outcome/effect/next-action baseline"
);
assert(
  core.includes("Put exact commands, errors, hashes, and detailed evidence after that; brevity must not hide uncertainty or safety risk."),
  "always-read core does not preserve evidence and risk after the plain-language lead"
);
assert(
  router.includes("| Reply format, language, output schema | `dev/rules/communication.md` | user-facing response rules |"),
  "rule router no longer sends response-format work to the communication pack"
);

const directRule = requiredRule(3);
assert(directRule.includes("ordinary direct task"), "direct-task response shape is missing");
assert(directRule.includes("practical effect"), "direct-task response does not name user impact");
assert(directRule.includes("only when the user needs one"), "direct-task response makes a next step unconditional");
assert(directRule.includes("repeated summary"), "direct-task response does not protect concise answers from boilerplate");

const technicalRule = requiredRule(4);
assert(technicalRule.includes("complex technical result"), "technical-result response shape is missing");
assert(technicalRule.indexOf("short, clear conclusion") < technicalRule.indexOf("exact commands, errors, hashes, source paths"), "technical evidence is not ordered after the clear conclusion");
assert(technicalRule.includes("when the user asks for technical depth"), "technical-depth request does not preserve direct evidence access");
assert(
  communication.includes("Clear language never permits hiding uncertainty, safety risk, data loss, permission boundaries, or a blocked condition."),
  "plain-language rule could hide material risk or a blocker"
);

console.log("ok: plain-language response contract routes through the existing communication pack");
console.log("ok: representative direct-task and complex-technical response shapes retain outcome, effect, risk, and evidence order");

function requiredRule(number) {
  const match = communication.match(new RegExp(`^${number}\\. (.+)$`, "m"));
  assert(match, `communication rule ${number} is missing`);
  return match[1];
}

function read(relative) {
  return readFileSync(path.join(root, relative), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
