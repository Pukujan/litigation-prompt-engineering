#!/usr/bin/env node
/**
 * Run golden authoring pipeline → evals/golden-staging/{caseId}/{version}/
 * Usage: npm run author:golden -- --case case_002 --import-stamp 2026-05-23_15-59-43Z --legal-case-id synthetic_case_002
 */
import { runAuthorGoldenCli } from "../backend/src/modules/golden-authoring/cli/authorGoldenCli.js";
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

  const importStamp = opts.importStamp
    ? await resolveImportStamp(opts.importStamp)
    : opts.importDir
      ? null
      : await resolveImportStamp();

  const importDir = opts.importDir ?? importDirForStamp(importStamp);

  console.log(`Import: ${importDir}`);
  console.log(`Author model: ${process.env.MODEL_GOLDEN_AUTHORING || "anthropic/claude-sonnet-4"}`);

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
  console.log("\nReview staging, then: npm run promote:golden -- --case", result.caseId, "--version", result.version);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
