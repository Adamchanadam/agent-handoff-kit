import { lstatSync, rmSync } from "node:fs";
import path from "node:path";

export function createQaTempTracker(label) {
  const paths = new Set();

  function track(targetPath) {
    paths.add(path.resolve(targetPath));
    return targetPath;
  }

  function cleanupOnSuccess() {
    if (keepQaTemp()) {
      reportRetained("AGENT_HANDOFF_KIT_KEEP_QA_TMP is set");
      return;
    }
    const removed = [];
    for (const targetPath of [...paths].sort((a, b) => b.length - a.length)) {
      if (!pathExists(targetPath)) continue;
      rmSync(targetPath, { recursive: true, force: true });
      removed.push(targetPath);
    }
    if (removed.length > 0) console.log(`ok: ${label} temporary roots cleaned (${removed.length})`);
  }

  function reportRetained(reason) {
    const existing = [...paths].filter((targetPath) => pathExists(targetPath));
    if (existing.length === 0) return;
    console.error(`${label} temporary roots retained: ${reason}`);
    for (const targetPath of existing) console.error(`- ${targetPath}`);
  }

  return { track, cleanupOnSuccess, reportRetained };
}

function keepQaTemp() {
  return ["1", "true", "yes"].includes(String(process.env.AGENT_HANDOFF_KIT_KEEP_QA_TMP ?? "").toLowerCase());
}

function pathExists(targetPath) {
  try {
    lstatSync(targetPath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}
