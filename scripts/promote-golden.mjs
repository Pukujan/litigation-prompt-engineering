#!/usr/bin/env node
/**
 * Promote staged golden → evals/golden/{caseId}/
 * Usage: npm run promote:golden -- --case case_002_rule_authority_v001 --version synthetic_case_002_rule_authority_v001
 */
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { cp } from "fs/promises";
import { getGoldenAuthoringConfig } from "../backend/src/modules/golden-authoring/config/index.js";
import { createStagingStoreService } from "../backend/src/modules/golden-authoring/services/stagingStore.service.js";
import { createPromoteGoldenService } from "../backend/src/modules/golden-authoring/services/promoteGolden.service.js";
import { createGoldenVersionService } from "../backend/src/modules/golden-authoring/services/goldenVersion.service.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const opts = { confirm: false };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--case" || arg === "-c") opts.caseId = argv[++i];
    else if (arg === "--version" || arg === "-v") opts.version = argv[++i];
    else if (arg === "--confirm") opts.confirm = true;
    else if (arg === "--reason") opts.reason = argv[++i];
    else if (arg === "--export-stamp") opts.exportStamp = argv[++i];
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv);
  if (!opts.caseId || !opts.version) {
    console.error("Required: --case <caseId> --version <goldenDatasetVersion>");
    process.exit(1);
  }
  if (!opts.confirm) {
    console.error("Promote requires --confirm (human review gate)");
    process.exit(1);
  }

  const config = getGoldenAuthoringConfig();
  const stagingStore = createStagingStoreService({
    repoRoot: config.repoRoot,
    stagingRoot: config.stagingRoot,
    goldenRoot: config.goldenRoot
  });
  const goldenVersion = createGoldenVersionService({
    stagingRoot: config.stagingRoot,
    goldenRoot: config.goldenRoot
  });
  const promote = createPromoteGoldenService({
    stagingStore,
    goldenVersion,
    repoRoot: config.repoRoot
  });

  const result = await promote.promote({
    caseId: opts.caseId,
    version: opts.version,
    promotedBy: "cli",
    reason: opts.reason ?? ""
  });

  console.log("Promoted to:", result.committedDir);

  if (opts.exportStamp) {
    const exportDir = join(
      repoRoot,
      "file-exchange/exports",
      opts.exportStamp,
      "golden-promoted"
    );
    await cp(result.committedDir, exportDir, { recursive: true });
    console.log("Copied to:", exportDir);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
