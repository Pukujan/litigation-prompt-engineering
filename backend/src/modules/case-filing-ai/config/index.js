import { join } from "path";
import { fileURLToPath } from "url";

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "../../../../..");

export function getModuleConfig() {
  return {
    name: "case-filing-ai",
    label: "Case Filing AI",
    batchRootDir:
      process.env.CASE_FILING_BATCH_DIR || join(repoRoot, "data/case-filing-ai/batches"),
    goldenDatasetDir:
      process.env.GOLDEN_DATASET_DIR || join(repoRoot, "evals/golden/case_001"),
    goldenCaseId: process.env.GOLDEN_CASE_ID || "case_001",
    evalBundleRootDir:
      process.env.EVAL_BUNDLE_ROOT_DIR || join(repoRoot, "eval-bundles"),
    caseExportRootDir:
      process.env.CASE_EXPORT_ROOT_DIR || join(repoRoot, "case-exports"),
    repoRoot,
    maxUploadBytes: Number(process.env.CASE_FILING_MAX_UPLOAD_MB || 25) * 1024 * 1024,
    openRouter: {
      apiKey: process.env.OPENROUTER_API_KEY || "",
      model: process.env.MODEL_TEXT_REASONING || "google/gemini-2.0-flash-001",
      visionOcrModel:
        process.env.MODEL_VISION_OCR || "qwen/qwen2.5-vl-7b-instruct",
      siteUrl: process.env.OPENROUTER_SITE_URL || "http://localhost:5173",
      appName: process.env.OPENROUTER_APP_NAME || "Case Filing AI",
      jsonObjectMode: process.env.OPENROUTER_JSON_OBJECT_MODE === "true"
    },
    masterPrompt: {
      version: process.env.MASTER_PROMPT_VERSION || "v1",
      jsonRetry: process.env.MASTER_PROMPT_JSON_RETRY !== "false",
      maxDocumentTextChars: Number(process.env.MASTER_PROMPT_MAX_DOC_CHARS || 120_000),
      omitAuditNotesInPrompt: process.env.MASTER_PROMPT_OMIT_AUDIT_NOTES !== "false",
      maxAuditNotes: Number(process.env.MASTER_PROMPT_MAX_AUDIT_NOTES || 20)
    }
  };
}

export function getSnapshotMergeMode(promptVersion) {
  const key = String(promptVersion || "v1").toLowerCase();
  return key === "compact" || key === "v2" ? "structured" : "legacy";
}

/** @deprecated Prefer getModuleConfig() for fresh env reads */
export const moduleConfig = getModuleConfig();
