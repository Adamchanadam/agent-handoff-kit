import { createHash } from "node:crypto";
import { lstat, readdir, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { installedFileContracts } from "./installed-file-contract.mjs";
import { FORMAL_USER_RULES_ENTRY_ANCHOR, readFormalUserRules } from "./user-rules-router.mjs";

export const UPGRADE_INVENTORY_SCHEMA = 1;

const formalEntryTargets = Object.freeze([
  "AGENTS.md",
  "CLAUDE.md",
  "GEMINI.md",
  "START_NEXT_SESSION_PROMPT.txt"
]);

const archiveDirectories = Object.freeze([
  { relative: "dev/SESSION_LOG_archive", classification: "session-log-archive" },
  { relative: "dev/session_log_archive", classification: "legacy-session-log-archive" }
]);

/**
 * Builds a read-only, hash-bound description of the Kit data that an upgrade
 * can reach now. Ordinary workspace files, generic Markdown references, and
 * committed historical transaction receipts are not current upgrade authority.
 */
export async function buildUpgradeInventory({ root, contracts = installedFileContracts } = {}) {
  if (!root) throw new Error("upgrade inventory requires a project root");
  const rootPath = path.resolve(root);
  const rootStats = await lstat(rootPath).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!rootStats?.isDirectory() || rootStats.isSymbolicLink()) {
    throw new Error("upgrade inventory root must be a real directory");
  }
  const realRoot = await realpath(rootPath);
  const entries = new Map();
  const blockers = [];

  const addBlocker = (relative, reason) => {
    const key = `${relative}\0${reason}`;
    if (!blockers.some((item) => `${item.path}\0${item.reason}` === key)) blockers.push({ path: relative, reason });
  };

  async function addFile(relative, classification, reachability = null) {
    const normalized = normalizeProjectRelative(relative);
    if (!normalized) {
      addBlocker(String(relative), "reference escapes the selected project root");
      return null;
    }
    const absolute = path.resolve(rootPath, normalized);
    if (!isInside(rootPath, absolute)) {
      addBlocker(normalized, "reference escapes the selected project root");
      return null;
    }
    const stats = await lstat(absolute).catch((error) => {
      if (error?.code === "ENOENT") return null;
      throw error;
    });
    if (!stats) return null;
    if (stats.isSymbolicLink()) {
      addBlocker(normalized, "symbolic links and junctions are not accepted as inventory sources");
      return null;
    }
    if (!stats.isFile()) {
      addBlocker(normalized, "inventory source is not a regular file");
      return null;
    }
    const resolved = await realpath(absolute);
    if (!isInside(realRoot, resolved)) {
      addBlocker(normalized, "resolved inventory source is outside the selected project root");
      return null;
    }

    const buffer = await readFile(absolute);
    let entry = entries.get(normalized);
    if (!entry) {
      entry = {
        path: normalized,
        sha256: sha256(buffer),
        bytes: buffer.length,
        classifications: new Set(),
        reachability: new Map(),
        text: decodeUtf8(buffer)
      };
      entries.set(normalized, entry);
    }
    entry.classifications.add(classification);
    if (reachability) entry.reachability.set(`${reachability.from}\0${reachability.via}`, reachability);
    return entry;
  }

  for (const contract of contracts) {
    const isFormalEntry = formalEntryTargets.includes(contract.targetRel);
    await addFile(
      contract.targetRel,
      "managed-contract",
      isFormalEntry ? { from: "formal-entry", via: contract.targetRel } : { from: "managed-contract", via: contract.targetRel }
    );
  }

  for (const directory of archiveDirectories) {
    await addTree(directory.relative, directory.classification);
  }

  const agentsEntry = entries.get("AGENTS.md");
  if (agentsEntry?.text?.includes(FORMAL_USER_RULES_ENTRY_ANCHOR)) {
    try {
      const formal = await readFormalUserRules({ root: rootPath, allowActiveTransaction: true });
      await addFile(formal.routerPath, "formal-user-rules-router", { from: formal.entryPath, via: formal.routerPath });
      for (const rule of formal.rules) {
        await addFile(rule.path, "formal-user-rule-content", { from: formal.routerPath, via: rule.path });
      }
    } catch (error) {
      addBlocker("dev/USER_RULES.md", `formal user-rules state is unsafe: ${String(error?.message ?? error)}`);
    }
  }

  const frozenEntries = [...entries.values()]
    .map((entry) => ({
      path: entry.path,
      sha256: entry.sha256,
      bytes: entry.bytes,
      classifications: [...entry.classifications].sort(),
      reachability: [...entry.reachability.values()]
        .sort((left, right) => `${left.from}\0${left.via}`.localeCompare(`${right.from}\0${right.via}`))
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const sortedBlockers = blockers.sort((left, right) => `${left.path}\0${left.reason}`.localeCompare(`${right.path}\0${right.reason}`));
  const digestInput = {
    schemaVersion: UPGRADE_INVENTORY_SCHEMA,
    entries: frozenEntries,
    blockers: sortedBlockers
  };

  return Object.freeze({
    schemaVersion: UPGRADE_INVENTORY_SCHEMA,
    status: sortedBlockers.length === 0 ? "ready" : "blocked",
    entries: frozenEntries,
    blockers: sortedBlockers,
    inventorySha256: sha256(Buffer.from(`${JSON.stringify(digestInput)}\n`, "utf8")),
    formalEntryTargets: formalEntryTargets.filter((target) => entries.has(target))
  });

  async function addTree(relativeDirectory, classification) {
    const normalized = normalizeProjectRelative(relativeDirectory);
    if (!normalized) {
      addBlocker(String(relativeDirectory), "dynamic directory escapes the selected project root");
      return;
    }
    const absolute = path.resolve(rootPath, normalized);
    const stats = await lstat(absolute).catch((error) => {
      if (error?.code === "ENOENT") return null;
      throw error;
    });
    if (!stats) return;
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      addBlocker(normalized, "dynamic inventory directory is not a safe real directory");
      return;
    }
    const resolved = await realpath(absolute);
    if (!isInside(realRoot, resolved)) {
      addBlocker(normalized, "dynamic inventory directory resolves outside the selected project root");
      return;
    }
    for (const item of await readdir(absolute, { withFileTypes: true })) {
      const child = `${normalized}/${item.name}`;
      const childAbsolute = path.join(absolute, item.name);
      const childStats = await lstat(childAbsolute).catch((error) => {
        if (error?.code === "ENOENT") return null;
        throw error;
      });
      if (!childStats) continue;
      if (childStats.isSymbolicLink()) {
        addBlocker(child, "dynamic inventory source is not a safe real file or directory");
      } else if (childStats.isDirectory()) {
        await addTree(child, classification);
      } else if (childStats.isFile()) {
        await addFile(child, classification, { from: "dynamic-state", via: normalized });
      } else {
        addBlocker(child, "dynamic inventory source is not a regular file or directory");
      }
    }
  }
}

export async function readProjectIndexTemplateVersion(root) {
  const bytes = await readFile(path.join(root, "dev", "PROJECT_INDEX.md")).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (!bytes) return null;
  return parseProjectIndexTemplateVersion(bytes.toString("utf8"));
}

export function parseProjectIndexTemplateVersion(text) {
  return projectIndexTemplateVersionEvidence(text)?.version ?? null;
}

export function projectIndexTemplateVersionRow(text) {
  return projectIndexTemplateVersionEvidence(text)?.row ?? null;
}

export function materializeProjectIndexTemplateVersion(text, version) {
  if (!isStableSemver(version)) return text;
  const evidence = projectIndexTemplateVersionEvidence(text);
  if (!evidence) return text;
  return String(text).slice(0, evidence.rowStart)
    + evidence.row.replace(`| ${evidence.version} |`, `| ${version} |`)
    + String(text).slice(evidence.rowEnd);
}

function projectIndexTemplateVersionEvidence(text) {
  const value = String(text);
  const normalized = value.replace(/\r\n/g, "\n");
  const visibleLines = markdownVisibleLinesOutsideHiddenBlocks(value);
  const headings = [];
  for (const item of visibleLines) if (/^## [^\r\n]+$/u.test(item.text)) headings.push({ title: item.text.trim(), line: item.line, offset: item.normalizedStart });
  const stackHeadings = headings.filter((heading) => heading.title === "## Stack");
  if (stackHeadings.length !== 1) return null;
  const stack = stackHeadings[0];
  const nextHeading = headings.find((heading) => heading.line > stack.line);
  const stackStart = stack.offset + visibleLines.find((line) => line.line === stack.line)?.text.length + 1;
  const stackEnd = nextHeading ? nextHeading.offset : normalized.length;
  const stackLines = visibleLines.filter((line) => line.normalizedStart >= stackStart && line.normalizedStart < stackEnd);
  const candidateRows = [];
  const rowPattern = /^\| Agent Handoff Kit template version \| ([^|\n]+) \| [^|\n]+ \|$/u;
  for (const line of stackLines) {
    const match = rowPattern.exec(line.text);
    if (!match) continue;
    const version = match[1].trim();
    if (!isStableSemver(version)) return null;
    candidateRows.push({
      version,
      row: line.text,
      rowStart: line.start,
      rowEnd: line.end
    });
  }
  const versionLabelRows = stackLines.filter((line) => line.text.startsWith("| Agent Handoff Kit template version |"));
  if (versionLabelRows.length !== candidateRows.length || candidateRows.length !== 1) return null;
  const [row] = candidateRows;
  return { version: row.version, row: row.row, rowStart: row.rowStart, rowEnd: row.rowEnd };
}

export function markdownVisibleLinesOutsideHiddenBlocks(text) {
  const value = String(text);
  const normalized = value.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const result = [];
  let offset = 0;
  let fence = null;
  let inComment = false;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (inComment) {
      if (line.includes("-->")) inComment = false;
      offset += line.length + 1;
      continue;
    }
    const fenceMatch = /^\s{0,3}(`{3,}|~{3,})(?![`~])(.*)$/u.exec(line);
    const fenceRun = fenceMatch?.[1] ?? null;
    if (fence) {
      if (
        fenceRun
        && fenceRun[0] === fence.char
        && fenceRun.length >= fence.length
        && /^\s*$/u.test(fenceMatch?.[2] ?? "")
      ) {
        fence = null;
      }
      offset += line.length + 1;
      continue;
    }
    if (fenceRun) {
      fence = { char: fenceRun[0], length: fenceRun.length };
      offset += line.length + 1;
      continue;
    }
    const commentStart = line.indexOf("<!--");
    if (commentStart >= 0) {
      if (line.indexOf("-->", commentStart + 4) < 0) inComment = true;
      offset += line.length + 1;
      continue;
    }
    result.push({
      text: line,
      line: index,
      normalizedStart: offset,
      normalizedEnd: offset + line.length,
      start: originalOffsetForNormalizedOffset(value, offset),
      end: originalOffsetForNormalizedOffset(value, offset + line.length)
    });
    offset += line.length + 1;
  }
  return result;
}

function originalOffsetForNormalizedOffset(text, normalizedOffset) {
  let original = 0;
  let normalized = 0;
  while (original < text.length && normalized < normalizedOffset) {
    if (text[original] === "\r" && text[original + 1] === "\n") {
      original += 2;
      normalized += 1;
    } else {
      original += 1;
      normalized += 1;
    }
  }
  return original;
}

function isStableSemver(value) {
  return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u.test(String(value));
}

export function extractExplicitLocalReferences(text) {
  const matches = new Map();
  const add = (raw, via) => {
    const normalized = normalizeReference(raw);
    if (normalized) matches.set(`${normalized}\0${via}`, { path: normalized, via });
  };
  for (const match of String(text).matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g)) add(match[1], "markdown-link");
  for (const match of String(text).matchAll(/`([^`\r\n]+)`/g)) add(match[1], "inline-code-path");
  for (const match of String(text).matchAll(/^\s*@([^\s]+)\s*$/gm)) add(match[1], "bridge-import");
  // Do not treat the dot before a filename extension as sentence punctuation.
  // On Windows, the truncated `dev/USER_RULES` then aliases the real
  // `dev/user_rules/` directory, making a valid formal router look unsafe.
  for (const match of String(text).matchAll(/(?:^|[\s("'`])((?:[\p{L}\p{N}_-]+[\\/])+[\p{L}\p{N}_. -]*[\p{L}\p{N}_.-])(?=$|[\s,;:，。!?)\]}>"'])/gu)) add(match[1], "plain-local-path");
  return [...matches.values()].sort((left, right) => `${left.path}\0${left.via}`.localeCompare(`${right.path}\0${right.via}`));
}

function normalizeReference(raw) {
  const value = String(raw).trim().replace(/^<|>$/g, "");
  if (!value || value.includes("://") || value.startsWith("~") || /^[A-Za-z]:[\\/]/.test(value) || value.startsWith("/")) return null;
  const withoutFragment = value.split(/[?#]/, 1)[0].replaceAll("\\", "/");
  if (!withoutFragment || withoutFragment.endsWith("/") || (!withoutFragment.includes("/") && !/\.[\p{L}\p{N}]+$/u.test(withoutFragment))) return null;
  return normalizeProjectRelative(withoutFragment);
}

function normalizeProjectRelative(relative) {
  const normalized = path.posix.normalize(String(relative).replaceAll("\\", "/").replace(/^\.\//, ""));
  if (!normalized || normalized === "." || normalized === ".." || normalized.startsWith("../") || path.posix.isAbsolute(normalized)) return null;
  return normalized;
}

function isInside(root, target) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function decodeUtf8(buffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return null;
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
