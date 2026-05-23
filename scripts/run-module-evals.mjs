#!/usr/bin/env node
import { readdirSync, existsSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

const moduleName = process.argv[2];
const root = new URL("../", import.meta.url).pathname;
const modulesDir = join(root, "backend/src/modules");

if (!existsSync(modulesDir)) {
  console.error("No modules directory.");
  process.exit(1);
}

const targets = moduleName
  ? [moduleName]
  : readdirSync(modulesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
      .map((d) => d.name);

let failed = false;

for (const name of targets) {
  const runnersDir = join(modulesDir, name, "evals", "runners");
  if (!existsSync(runnersDir)) continue;

  const runners = readdirSync(runnersDir).filter(
    (f) => f.endsWith(".eval.mjs") || f.endsWith(".eval.js")
  );

  for (const runner of runners) {
    const file = join(runnersDir, runner);
    console.log(`\n▶ eval ${name}/${runner}`);
    const result = spawnSync(process.execPath, ["--test", file], {
      stdio: "inherit",
      cwd: join(root, "backend")
    });
    if (result.status !== 0) failed = true;
  }
}

if (failed) process.exit(1);
console.log("\nEvals complete.");
