import { spawn, spawnSync } from "node:child_process";

export const DEFAULT_QA_TIMEOUT_MS = 120_000;
export const SHORT_QA_TIMEOUT_MS = 60_000;
export const LONG_QA_TIMEOUT_MS = 600_000;
export const TIMEOUT_EXIT_CODE = 124;

export class QaRunError extends Error {
  constructor(message, result) {
    super(message);
    this.name = "QaRunError";
    this.result = result;
    this.exitCode = typeof result?.status === "number" ? result.status : result?.timedOut ? TIMEOUT_EXIT_CODE : 1;
  }
}

export function runSync(command, args, label, options = {}) {
  const timeoutMs = normalizeTimeout(options.timeoutMs);
  try {
    const result = spawnSync(command, args, {
      cwd: options.cwd,
      encoding: "utf8",
      env: options.env,
      shell: options.shell ?? false,
      timeout: timeoutMs,
      windowsHide: true
    });
    return normalizeSyncResult(result, { command, args, label, timeoutMs });
  } catch (error) {
    return spawnErrorResult({ command, args, label, timeoutMs }, error);
  }
}

export function assertRunPassed(result, label = result?.label ?? "command", options = {}) {
  const text = outputText(result);
  if (options.requiredStdoutIncludes && !text.includes(options.requiredStdoutIncludes)) {
    throw new QaRunError(`${label} did not reach required terminal output\n${describeResult(result)}`, {
      ...result,
      status: typeof result.status === "number" ? result.status : 1
    });
  }
  if (result.errorType || result.timedOut || result.signal || result.status !== 0) {
    throw new QaRunError(`${label} failed\n${describeResult(result)}`, result);
  }
  return result;
}

export function assertRunFailed(result, label = result?.label ?? "command") {
  if (!result.errorType && !result.timedOut && !result.signal && result.status === 0) {
    throw new QaRunError(`${label} unexpectedly passed\n${describeResult(result)}`, { ...result, status: 1 });
  }
  return result;
}

export function runSyncChecked(command, args, label, options = {}) {
  return assertRunPassed(runSync(command, args, label, options), label, options);
}

export function runNodeScript(script, label, options = {}) {
  return runSyncChecked(process.execPath, [script], label, options);
}

export async function runChecked(command, args, label, options = {}) {
  return assertRunPassed(await invokeAsync(command, args, label, options), label, options);
}

export async function runNodeScriptChecked(script, label, options = {}) {
  return runChecked(process.execPath, [script], label, options);
}

export function invokeAsync(command, args, label, options = {}) {
  const timeoutMs = normalizeTimeout(options.timeoutMs);
  const killGraceMs = normalizeTimeout(options.killGraceMs ?? 1_000);
  const settleGraceMs = Math.max(killGraceMs, normalizeTimeout(options.settleGraceMs ?? 3_000));
  return new Promise((resolve) => {
    let child;
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;
    let sigtermSent = false;
    let forceKillSent = false;
    try {
      child = spawn(command, args, {
        cwd: options.cwd,
        env: options.env,
        shell: options.shell ?? false,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true
      });
    } catch (error) {
      resolve(spawnErrorResult({ command, args, label, timeoutMs }, error));
      return;
    }
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(forceKillTimer);
      clearTimeout(settlementTimer);
      resolve(result);
    };
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        sigtermSent = child.kill("SIGTERM");
      } catch {
        sigtermSent = false;
      }
    }, timeoutMs);
    const forceKillTimer = setTimeout(() => {
      if (!timedOut || settled) return;
      try {
        forceKillSent = child.kill("SIGKILL");
      } catch {
        forceKillSent = false;
      }
    }, timeoutMs + killGraceMs);
    const settlementTimer = setTimeout(() => {
      if (!timedOut || settled) return;
      finish({
        label,
        command,
        args,
        status: TIMEOUT_EXIT_CODE,
        signal: null,
        timedOut: true,
        killed: sigtermSent || forceKillSent,
        stopped: false,
        errorType: "timeout",
        errorMessage: "timeout settlement deadline reached before child close",
        stdout,
        stderr,
        timeoutMs
      });
    }, timeoutMs + settleGraceMs);

    child.stdout?.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
    child.stderr?.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => {
      finish({
        label,
        command,
        args,
        status: null,
        signal: null,
        timedOut,
        killed: sigtermSent || forceKillSent,
        stopped: false,
        errorType: "spawn-error",
        errorMessage: error.message,
        stdout,
        stderr,
        timeoutMs
      });
    });
    child.on("close", (status, signal) => {
      finish({
        label,
        command,
        args,
        status: timedOut ? TIMEOUT_EXIT_CODE : status,
        signal,
        timedOut,
        killed: sigtermSent || forceKillSent,
        stopped: true,
        errorType: timedOut ? "timeout" : null,
        errorMessage: "",
        stdout,
        stderr,
        timeoutMs
      });
    });
  });
}

export function outputText(result) {
  return `${result?.stdout ?? ""}${result?.stderr ? `\n${result.stderr}` : ""}`;
}

export function describeResult(result) {
  const parts = [
    `status=${result?.status ?? "null"}`,
    `signal=${result?.signal ?? "none"}`,
    `timedOut=${result?.timedOut ? "true" : "false"}`,
    `error=${result?.errorType ?? "none"}`,
    `timeoutMs=${result?.timeoutMs ?? "none"}`
  ];
  if (result?.errorMessage) parts.push(`message=${result.errorMessage}`);
  const text = outputText(result).trim();
  return `${parts.join(" ")}${text ? `\n${text}` : ""}`;
}

function normalizeSyncResult(result, context) {
  const timedOut = result.error?.code === "ETIMEDOUT";
  const errorType = result.error ? (timedOut ? "timeout" : "spawn-error") : null;
  return {
    ...context,
    status: timedOut ? TIMEOUT_EXIT_CODE : result.status,
    signal: result.signal ?? null,
    timedOut,
    killed: timedOut,
    stopped: errorType === "spawn-error" ? false : true,
    errorType,
    errorMessage: result.error?.message ?? "",
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? ""
  };
}

function spawnErrorResult(context, error) {
  return {
    ...context,
    status: null,
    signal: null,
    timedOut: false,
    killed: false,
    stopped: false,
    errorType: "spawn-error",
    errorMessage: error?.message ?? String(error),
    stdout: "",
    stderr: ""
  };
}

function normalizeTimeout(value) {
  const number = Number(value ?? DEFAULT_QA_TIMEOUT_MS);
  return Number.isFinite(number) && number > 0 ? Math.trunc(number) : DEFAULT_QA_TIMEOUT_MS;
}
