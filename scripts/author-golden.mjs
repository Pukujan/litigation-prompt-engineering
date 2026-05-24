#!/usr/bin/env node
/**
 * Run golden authoring pipeline → evals/golden-staging/{caseId}/{version}/
 * Usage: npm run author:golden -- --case case_002 --import-stamp 2026-05-23_15-59-43Z --legal-case-id synthetic_case_002
 */
import { join } from "path";
import { runAuthorGoldenCli } from "../backend/src/modules/golden-authoring/cli/authorGoldenCli.js";
import { DEFAULT_GOLDEN_AUTHORING_MODEL } from "../backend/src/modules/golden-authoring/config/defaults.js";
import { resolveImportStamp, importDirForStamp } from "./resolve-import-stamp.mjs";

function parseArgs(argv) {
  const opts = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--case" || arg === "-c") opts.caseSlug = argv[++i];
    else if (arg === "--import-stamp") opts.importStamp = argv[++i];
    else if (arg === "--legal-case-id") opts.legalCaseId = argv[++i];
    else if (arg === "--purpose") opts.purpose = argv[++i];
    else if (arg === "--import-dir") opts.importDir = argv[++i];
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv);
  if (!opts.caseSlug) {
    console.error("Required: --case <caseSlug> (e.g. case_002)");
    process.exit(1);
  }
  if (!opts.legalCaseId) {
    console.error("Required: --legal-case-id <legalCaseId> (e.g. synthetic_case_002)");
    process.exit(1);
  }

  let importDir = opts.importDir;
  let importStamp = opts.importStamp ?? null;

  if (!importDir) {
    importStamp = importStamp ? await resolveImportStamp(importStamp) : await resolveImportStamp();
    const stampDir = importDirForStamp(importStamp);
    const packageName =
      process.env.GOLDEN_IMPORT_PACKAGE ?? "synthetic_queens_catapano_fox_case_v002";
    importDir = join(stampDir, packageName);
  }

  console.log(`Import: ${importDir}`);
  console.log(
    `Author model: ${process.env.MODEL_GOLDEN_AUTHORING || DEFAULT_GOLDEN_AUTHORING_MODEL}`
  );

  const result = await runAuthorGoldenCli({
    caseSlug: opts.caseSlug,
    legalCaseId: opts.legalCaseId,
    importDir,
    importStamp,
    purpose: opts.purpose ?? "rule_authority"
  });

  console.log("\nGolden authoring complete.");
  console.log(`  caseId:     ${result.caseId}`);
  console.log(`  version:    ${result.version}`);
  console.log(`  runId:      ${result.runId}`);
  console.log(`  status:     ${result.batchStatus}`);
  console.log(`  staging:    ${result.stagingDir}`);
  console.log(`  documents:  ${result.documentCount}`);
  console.log(
    "\nReview staging, then:\n  npm run promote:golden --",
    `--case ${result.caseId} --version ${result.version} --confirm`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
