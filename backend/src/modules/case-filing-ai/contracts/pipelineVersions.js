import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { PARSED_ARTIFACTS_VERSION } from "./parsedDocumentArtifacts.contract.js";
import { BATCH_LAYOUT_VERSION } from "./storageLayout.contract.js";

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../../..");
let appVersion = "0.0.0";
try {
  const pkg = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8"));
  appVersion = pkg.version ?? appVersion;
} catch {
  /* optional */
}

export const PARSER_VERSION = "pdf-embedded-v1";
export const OCR_VERSION = "openrouter-vision-v1";
export const GOLDEN_DATASET_VERSION = "case_001-v2-full-expected";

/**
 * @param {{
 *   masterPromptVersion?: string,
 *   rulePromptVersion?: string,
 *   ruleSetVersion?: string,
 *   snapshotPromptVersion?: string,
 * }} [overrides]
 */
export function buildPipelineVersions(overrides = {}) {
  return {
    app: appVersion,
    storageLayout: BATCH_LAYOUT_VERSION,
    parsedArtifacts: PARSED_ARTIFACTS_VERSION,
    parser: PARSER_VERSION,
    ocr: OCR_VERSION,
    masterPrompt: overrides.masterPromptVersion ?? "v1",
    rulePrompt: overrides.rulePromptVersion ?? "v1",
    snapshotPrompt: overrides.snapshotPromptVersion ?? "v1",
    ruleSet: overrides.ruleSetVersion ?? "fixtures-v0",
    goldenDataset: GOLDEN_DATASET_VERSION,
    ...overrides
  };
}
