import { join } from "path";
import { fileURLToPath } from "url";
import { resolveArtifactPaths } from "../../../shared/config/resolveArtifactPaths.js";
import { resolveCaseFilingProfile } from "../../case-filing-ai/utils/resolveCaseFilingProfile.js";

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "../../../../..");

export function getGoldenAuthoringConfig() {
  const profile = resolveCaseFilingProfile({ repoRoot, env: process.env });
  const artifacts = resolveArtifactPaths(repoRoot);
  const stagingRoot =
    process.env.GOLDEN_AUTHORING_STAGING_ROOT ||
    join(repoRoot, "evals/golden-staging");
  const goldenRoot = join(repoRoot, "evals/golden");
  const runsRoot =
    process.env.GOLDEN_AUTHORING_RUNS_DIR ||
    join(artifacts.batches?.replace(/batches$/, "golden-authoring") ?? join(repoRoot, "data/golden-authoring"), "runs");

  return {
    repoRoot,
    stagingRoot,
    goldenRoot,
    runsRoot,
    ruleFixturesCaseId: profile.ruleFixturesCaseId,
    ruleSetVersion: profile.ruleSetVersion,
    masterPromptVersion:
      process.env.MASTER_PROMPT_GOLDEN_VERSION || profile.masterPromptVersion,
    maxUploadBytes: Number(process.env.GOLDEN_AUTHORING_MAX_UPLOAD_MB || 25) * 1024 * 1024,
    apiEnabled: process.env.GOLDEN_AUTHORING_API_ENABLED === "true",
    apiKey: process.env.GOLDEN_AUTHORING_API_KEY || "",
    openRouter: {
      apiKey: process.env.OPENROUTER_API_KEY || "",
      model:
        process.env.MODEL_GOLDEN_AUTHORING ||
        "anthropic/claude-sonnet-4",
      visionOcrModel:
        process.env.MODEL_VISION_OCR || "qwen/qwen2.5-vl-7b-instruct",
      siteUrl: process.env.OPENROUTER_SITE_URL || "http://localhost:5173",
      appName: process.env.OPENROUTER_APP_NAME_GOLDEN || "Golden Authoring",
      jsonObjectMode: process.env.OPENROUTER_JSON_OBJECT_MODE === "true"
    },
    masterPrompt: {
      version:
        process.env.MASTER_PROMPT_GOLDEN_VERSION || profile.masterPromptVersion,
      jsonRetry: process.env.MASTER_PROMPT_JSON_RETRY !== "false",
      maxDocumentTextChars: Number(process.env.MASTER_PROMPT_MAX_DOC_CHARS || 120_000),
      omitAuditNotesInPrompt: process.env.MASTER_PROMPT_OMIT_AUDIT_NOTES !== "false",
      maxAuditNotes: Number(process.env.MASTER_PROMPT_MAX_AUDIT_NOTES || 20)
    }
  };
}
