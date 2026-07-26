#!/usr/bin/env node

try {
  await import("./check-r034-v041-direct-agents.mjs");
  console.log("ok: R-034 vertical QA");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
