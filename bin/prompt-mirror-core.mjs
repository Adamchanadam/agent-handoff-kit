import { lstatSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const openingSectionMarker = "<!-- ack:section:next-session-opening-message -->";
const openingHeadingPattern = /^##\s+Next Session Opening Message\s*$/m;
const openingContentMarkers = [
  "📋 Next session: agent-managed startup content below",
  "📋 Next session: copy and paste the whole block below"
];

export function assessPromptMirrorRoot(root) {
  const handoffPath = path.join(root, "dev", "SESSION_HANDOFF.md");
  const promptPath = path.join(root, "START_NEXT_SESSION_PROMPT.txt");
  let handoffText = "";
  let promptText = "";

  try {
    handoffText = readFileSync(handoffPath, "utf8");
  } catch {
    return { status: "missing", ok: false, reason: "handoff unreadable" };
  }

  try {
    promptText = readFileSync(promptPath, "utf8");
  } catch {
    return { status: "missing", ok: false, reason: "prompt copy unreadable" };
  }

  const otherTexts = collectCurrentGovernanceTexts(root, new Set([
    path.resolve(handoffPath),
    path.resolve(promptPath)
  ]));
  return assessPromptMirrorTexts(handoffText, promptText, otherTexts);
}

export function assessPromptMirrorTexts(handoffText, promptText, otherTexts = []) {
  const markerCount = countLiteral(handoffText, openingSectionMarker);
  const headingCount = (handoffText.match(new RegExp(openingHeadingPattern.source, "gm")) ?? []).length;
  const contentMarkerCount = openingContentMarkers.reduce((sum, marker) => sum + countLiteral(handoffText, marker), 0);
  const openingSection = markerCount === 1 ? handoffText.slice(handoffText.indexOf(openingSectionMarker)) : "";
  const fenceCount = (openingSection.match(/```text[^\r\n]*(?:\r\n?|\n)[\s\S]*?(?:\r\n?|\n)```/g) ?? []).length;
  if (markerCount !== 1 || headingCount > 1 || contentMarkerCount !== 1 || fenceCount !== 1) {
    return {
      status: "structure-invalid",
      ok: false,
      reason: `opening structure must be unique (section marker=${markerCount}, heading=${headingCount}, copy marker=${contentMarkerCount}, fenced text=${fenceCount})`
    };
  }

  const openingMessage = extractOpeningMessage(handoffText);
  if (openingMessage == null) {
    return {
      status: "missing",
      ok: false,
      reason: "handoff opening message missing"
    };
  }

  const normalizedOpening = normalizePrompt(openingMessage);
  const thirdCopies = otherTexts.filter(({ text }) => normalizePrompt(text).includes(normalizedOpening));
  if (thirdCopies.length > 0) {
    return {
      status: "third-copy",
      ok: false,
      reason: `full opening message also appears in: ${thirdCopies.map(({ relative }) => relative).join(", ")}`,
      openingMessage,
      thirdCopies: thirdCopies.map(({ relative }) => relative)
    };
  }

  if (openingMessage === promptText) {
    return {
      status: "match",
      ok: true,
      reason: "",
      openingMessage,
      firstDiff: null
    };
  }

  const normalizedPrompt = normalizePrompt(promptText);
  if (normalizedOpening === normalizedPrompt) {
    return {
      status: "newline-only",
      ok: true,
      reason: "only newline style or final newline differs",
      openingMessage,
      firstDiff: null
    };
  }

  return {
    status: "mismatch",
    ok: false,
    reason: "convenience copy differs from dev/SESSION_HANDOFF.md",
    openingMessage,
    firstDiff: firstDiff(normalizedOpening, normalizedPrompt)
  };
}

export function extractOpeningMessage(text) {
  const sectionStart = findOpeningSectionStart(text);
  if (sectionStart < 0) return null;

  const sectionText = text.slice(sectionStart);
  const marker = openingContentMarkers.find((candidate) => sectionText.includes(candidate));
  if (!marker) return null;

  const markerIndex = sectionText.indexOf(marker);
  const afterMarker = sectionText.slice(markerIndex + marker.length);
  const fenceMatch = /```text[^\r\n]*(?:\r\n?|\n)([\s\S]*?)(?:\r\n?|\n)```/.exec(afterMarker);
  if (!fenceMatch) return null;
  return fenceMatch[1];
}

export function normalizePrompt(text) {
  return text.replace(/\r\n?/g, "\n").replace(/\n+$/g, "");
}

function findOpeningSectionStart(text) {
  const markerIndex = text.indexOf(openingSectionMarker);
  if (markerIndex >= 0) return markerIndex;

  const headingMatch = openingHeadingPattern.exec(text);
  return headingMatch ? headingMatch.index : -1;
}

function firstDiff(left, right) {
  const leftLines = left.split("\n");
  const rightLines = right.split("\n");
  const count = Math.max(leftLines.length, rightLines.length);
  for (let index = 0; index < count; index += 1) {
    if ((leftLines[index] ?? "") !== (rightLines[index] ?? "")) {
      return {
        line: index + 1,
        handoff: leftLines[index] ?? "",
        prompt: rightLines[index] ?? ""
      };
    }
  }
  return null;
}

function countLiteral(text, token) {
  if (!token) return 0;
  let count = 0;
  let offset = 0;
  while ((offset = text.indexOf(token, offset)) >= 0) {
    count += 1;
    offset += token.length;
  }
  return count;
}

function collectCurrentGovernanceTexts(root, excluded) {
  const candidates = [
    "AGENTS.md",
    "CLAUDE.md",
    "GEMINI.md",
    "dev/SESSION_LOG.md",
    "dev/PROJECT_INDEX.md",
    "dev/DOC_SYNC_REGISTRY.md",
    "dev/RULE_PACKS.md",
    "dev/PROJECT_DECISIONS.md"
  ];
  const rulesDir = path.join(root, "dev", "rules");
  try {
    for (const entry of readdirSync(rulesDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith(".md")) candidates.push(`dev/rules/${entry.name}`);
    }
  } catch {
    // Missing rules are reported by normal doctor checks.
  }

  const results = [];
  for (const relative of candidates) {
    const absolute = path.resolve(root, relative);
    if (excluded.has(absolute)) continue;
    try {
      if (lstatSync(absolute).isSymbolicLink()) continue;
      results.push({ relative, text: readFileSync(absolute, "utf8") });
    } catch {
      // Missing or unreadable files are handled by their owning checks.
    }
  }
  return results;
}
