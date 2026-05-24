#!/usr/bin/env node
/**
 * Run offline golden regression for a committed dataset.
 *
 * Usage:
 *   npm run eval:golden
 *   npm run eval:golden -- --dataset case_001_rule_authority_v002
 *   npm run eval:golden -- --all
 */
import { spawnSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

function readOption(name) {
  const idx = args.indexOf(name);
  if (idx < 0 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

const runAll = args.includes("--all");
const dataset = readOption("--dataset") || "case_001";
const datasets = runAll ? ["case_001", "case_001_rule_authority_v002"] : [dataset];

const runner = join(
  repoRoot,
  "backend/src/modules/case-filing-ai/evals/runners/golden-regression.eval.mjs"
);

let failed = false;

for (const caseId of datasets) {
  console.log(`\n▶ golden eval: ${caseId}`);
  const result = spawnSync(
    process.execPath,
    ["--test", runner],
    {
      cwd: join(repoRoot, "backend"),
      stdio: "inherit",
      env: {
        ...process.env,
        GOLDEN_CASE_ID: caseId,
        GOLDEN_DATASET_DIR: join(repoRoot, "evals/golden", caseId)
      }
    }
  );
  if (result.status !== 0) failed = true;
}

if (failed) process.exit(1);
console.log("\nGolden evals complete.");
