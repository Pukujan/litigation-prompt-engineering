import { join } from "path";
import { resolveConsolidatedInventory } from "../utils/resolveConsolidatedInventory.js";

/**
 * Build audit record shipped with every staged/promoted golden dataset.
 * @param {{
 *   repoRoot: string,
 *   authoringRun: Record<string, unknown>,
 *   pipelineVersions: Record<string, unknown>,
 *   pipelineVersionsExpected: Record<string, unknown>,
 *   caseId: string,
 *   version: string,
 *   importStamp?: string|null
 * }} input
 */
export async function buildGoldenAuditRecord({
  repoRoot,
  authoringRun,
  pipelineVersions,
  pipelineVersionsExpected,
  caseId,
  version,
  importStamp = null
}) {
  const inventory = await resolveConsolidatedInventory(repoRoot);
  const auditedAt = new Date().toISOString();

  return {
    auditedAt,
    caseId,
    goldenDatasetVersion: version,
    authoringRunId: authoringRun.runId,
    importStamp: importStamp ?? authoringRun.importStamp ?? null,
    batchStatus: authoringRun.batchStatus ?? null,
    reviewStatus: "pending_human_review",
    models: {
      authorModel: authoringRun.authorModel,
      visionOcrModel: authoringRun.visionOcrModel ?? null,
      runtimeEvalModelNote:
        "Runtime batches use MODEL_TEXT_REASONING; golden uses authorModel above."
    },
    prompts: {
      masterPromptVersion: authoringRun.masterPromptVersion,
      ruleMatchPromptVersion: pipelineVersionsExpected.ruleMatchPromptVersion,
      taskDeadlinePromptVersion: pipelineVersionsExpected.taskDeadlinePromptVersion,
      snapshotPromptVersion: pipelineVersionsExpected.snapshotPromptVersion
    },
    pipeline: {
      parserVersion: pipelineVersionsExpected.parserVersion,
      ocrVersion: pipelineVersionsExpected.ocrVersion,
      ruleSetVersion: pipelineVersionsExpected.ruleSetVersion,
      pipelineVersions
    },
    inventory: {
      modelInventoryVersion:
        authoringRun.modelInventoryVersion ?? inventory.modelInventoryVersion,
      promptInventoryVersion:
        authoringRun.promptInventoryVersion ?? inventory.promptInventoryVersion,
      modelInventoryPath: inventory.modelInventoryPath,
      promptInventoryPath: inventory.promptInventoryPath
    },
    artifacts: {
      pipelineVersionsFile: "pipeline_versions.expected.json",
      authoringRunFile: "authoring_run.json",
      versionHistoryFile: "VERSION_HISTORY.jsonl",
      syntheticNoticeFile: "SYNTHETIC_DATA_NOTICE.md"
    },
    promoteChecklist: [
      "Human reviewed doc_NNN.expected.json and snapshot checkpoints",
      "authoring_run.json batchStatus is completed",
      "pipeline_versions.expected.json pins match intended prompt/rule versions",
      "SYNTHETIC_DATA_NOTICE.md present",
      "npm run promote:golden -- --case <caseId> --version <version> --confirm"
    ]
  };
}

export function goldenAuditPath(outDir) {
  return join(outDir, "golden_audit.json");
}
