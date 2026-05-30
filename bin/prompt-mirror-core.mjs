import { readFileSync } from "node:fs";
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

  return assessPromptMirrorTexts(handoffText, promptText);
}

export function assessPromptMirrorTexts(handoffText, promptText) {
  const openingMessage = extractOpeningMessage(handoffText);
  if (openingMessage == null) {
    return {
      status: "missing",
      ok: false,
      reason: "handoff opening message missing"
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

  const normalizedOpening = normalizePrompt(openingMessage);
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
