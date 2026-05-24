import { randomUUID } from "crypto";
import { createTraceId } from "../../../shared/utils/traceId.js";
import { sortBatchFiles } from "../../case-filing-ai/services/uploadBatch.service.js";
import { createDocumentPipelineRunner } from "../../case-filing-ai/services/documentPipelineRunner.js";
import { buildPipelineVersions } from "../../case-filing-ai/contracts/pipelineVersions.js";
import { buildBootstrapSnapshot } from "../../case-filing-ai/utils/goldenCaseBootstrap.js";
import { snapshotEvalId } from "./goldenExporter.service.js";

export function createAuthoringBatchService({
  stagingStore,
  goldenExporter,
  goldenVersion,
  documentText,
  parsedDocumentCache,
  masterPrompt,
  caseSnapshot,
  ruleMatch,
  ruleAuthority,
  config
}) {
  async function processAuthoringBatch({
    caseId,
    version,
    legalCaseId,
    caseIdentity,
    files,
    manifest = {},
    importStamp = null,
    partRuleText = ""
  }) {
    const runId = randomUUID();
    const batchTraceId = createTraceId(`golden_${runId.slice(0, 8)}`);
    const runStore = stagingStore.createRunStoreAdapter(caseId, version);

    const pipelineRunner = createDocumentPipelineRunner({
      store: runStore,
      documentText,
      parsedDocumentCache,
      masterPrompt,
      caseSnapshot,
      ruleMatch,
      ruleAuthority,
      ruleFixturesCaseId: config.ruleFixturesCaseId,
      masterPromptConfig: config.masterPrompt,
      logModule: async (batchId, module, docIndex, phase, extra) => {
        await runStore.appendProcessingLog(batchId, {
          step: phase === "start" ? "module_started" : "module_completed",
          module,
          docIndex,
          ...extra
        });
      }
    });

    const sorted = sortBatchFiles(files);
    const checkpoints = manifest.snapshotCheckpoints ?? [1, 2, 4, 8, 12, 14];
    const checkpointSet = new Set(checkpoints);

    let currentSnapshot =
      buildBootstrapSnapshot(caseIdentity) ?? runStore.emptySnapshot();
    await runStore.writeCaseSnapshot("authoring", currentSnapshot);

    const snapshotsByCheckpoint = {};
    const loopResult = await pipelineRunner.runDocumentLoop({
      batchId: "authoring",
      sorted,
      batchTraceId,
      currentSnapshot,
      activePartRuleText: partRuleText,
      source: partRuleText ? "user_paste" : "pending_inference",
      userProvidedRule: Boolean(partRuleText?.trim()),
      hooks: {
        onAfterDocument: async ({ docIndex, snapshot }) => {
          if (checkpointSet.has(docIndex)) {
            snapshotsByCheckpoint[docIndex] = structuredClone(snapshot);
          }
        }
      }
    });

    const pipelineVersions = buildPipelineVersions({
      masterPromptVersion: config.masterPrompt.version,
      ruleSetVersion: config.ruleSetVersion,
      goldenDataset: version
    });

    const authoringRun = {
      runId,
      caseId,
      version,
      legalCaseId,
      importStamp,
      batchStatus: loopResult.batchStatus,
      authorModel: config.openRouter.model,
      masterPromptVersion: config.masterPrompt.version,
      processedCount: loopResult.processedCount,
      totalCount: loopResult.totalCount,
      failedDocuments: loopResult.failedDocuments,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    const exportResult = await goldenExporter.exportToStaging({
      caseId,
      version,
      legalCaseId,
      caseIdentity,
      documentOutputs: loopResult.documentOutputs,
      snapshotsByCheckpoint,
      pipelineVersions,
      authoringRun,
      evalComparisonConfig: manifest.evalComparisonConfig ?? null,
      negativeGuardrails: manifest.negativeGuardrailTests ?? [],
      importStamp
    });

    await goldenVersion.appendVersionHistory(stagingStore.versionDir(caseId, version), {
      time: new Date().toISOString(),
      version,
      caseId,
      legalCaseId,
      authorModel: config.openRouter.model,
      masterPromptVersion: config.masterPrompt.version,
      importStamp,
      authoringRunId: runId,
      status: "staged",
      documentCount: exportResult.documentCount,
      snapshotCheckpoints: checkpoints.map((n) => snapshotEvalId(n))
    });

    return {
      runId,
      caseId,
      version,
      batchStatus: loopResult.batchStatus,
      stagingDir: exportResult.outDir,
      documentCount: exportResult.documentCount,
      authoringRun
    };
  }

  async function allocateAndPrepare({ caseSlug, legalCaseId, purpose, manifest }) {
    const version = await goldenVersion.allocateVersionId({ legalCaseId, purpose });
    const caseId = goldenVersion.caseIdFromVersion(version, caseSlug);
    await stagingStore.ensureDir(stagingStore.versionDir(caseId, version));
    return { caseId, version };
  }

  return { processAuthoringBatch, allocateAndPrepare };
}
