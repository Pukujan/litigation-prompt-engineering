import { createModuleRouter } from "./routes/index.js";
import { registerModuleEvents } from "./events/index.js";
import { join } from "path";
import { getModuleConfig, getSnapshotMergeMode } from "./config/index.js";
import { createOpenRouterClient } from "./adapters/openrouter.client.js";
import { createLocalJsonStore } from "./services/localJsonStore.service.js";
import { createOcrService } from "./services/ocr.service.js";
import { createDocumentTextService } from "./services/documentText.service.js";
import { createOfficeTextService } from "./services/officeText.service.js";
import { createRuleTextService } from "./services/ruleText.service.js";
import { createCaseSnapshotService } from "./services/caseSnapshot.service.js";
import { createMasterPromptService } from "./services/masterPrompt.service.js";
import { createUploadBatchService } from "./services/uploadBatch.service.js";
import { createGoldenDatasetService } from "./services/goldenDataset.service.js";
import { createEvalRunnerService } from "./services/evalRunner.service.js";
import { createEvalBundleService } from "./services/evalBundle.service.js";
import { createCaseDataService } from "./services/caseData.service.js";
import { createStoragePaths } from "./utils/storagePaths.js";
import { createParsedDocumentCacheService } from "./services/parsedDocumentCache.service.js";
import { buildPipelineVersions } from "./contracts/pipelineVersions.js";
import { createRuleStoreService } from "../court-rules/services/ruleStore.service.js";
import { createRuleMatchService } from "../court-rules/services/ruleMatch.service.js";
import { createRuleAuthorityService } from "../court-rules/services/ruleAuthority.service.js";

export function register(app, context) {
  const config = getModuleConfig();
  const store = createLocalJsonStore({ batchRootDir: config.batchRootDir });
  const storagePaths = createStoragePaths({
    batchRootDir: config.batchRootDir,
    goldenRootDir: config.goldenDatasetDir,
    ruleFixturesRoot: join(config.repoRoot, "data/court-rules/fixtures")
  });
  const openRouter = createOpenRouterClient(config.openRouter);
  const ocr = createOcrService({ openRouter });
  const officeText = createOfficeTextService();
  const documentText = createDocumentTextService({ ocr, officeText });
  const parsedDocumentCache = createParsedDocumentCacheService({
    storagePaths,
    documentText,
    getPipelineVersions: () =>
      buildPipelineVersions({ masterPromptVersion: config.masterPrompt.version })
  });
  const ruleText = createRuleTextService({ documentText });
  const mergeMode = getSnapshotMergeMode(config.masterPrompt.version);
  const caseSnapshot = createCaseSnapshotService({
    store,
    mergeMode,
    maxAuditNotes: config.masterPrompt.maxAuditNotes
  });
  const masterPrompt = createMasterPromptService({
    openRouter,
    promptVersion: config.masterPrompt.version,
    jsonRetry: config.masterPrompt.jsonRetry,
    jsonObjectMode: config.openRouter.jsonObjectMode,
    maxDocumentTextChars: config.masterPrompt.maxDocumentTextChars,
    omitAuditNotesInPrompt: config.masterPrompt.omitAuditNotesInPrompt
  });
  const goldenDataset = createGoldenDatasetService({
    goldenDatasetDir: config.goldenDatasetDir,
    caseId: config.goldenCaseId
  });
  const ruleStore = createRuleStoreService({
    fixturesRoot: join(config.repoRoot, "data/court-rules/fixtures")
  });
  const ruleMatch = createRuleMatchService({ ruleStore });
  const ruleAuthority = createRuleAuthorityService();
  const evalRunner = createEvalRunnerService({ goldenDataset, storagePaths });
  const evalBundle = createEvalBundleService({
    store,
    bundleRootDir: config.evalBundleRootDir,
    repoRoot: config.repoRoot,
    resolveGoldenDatasetDir(goldenCaseId) {
      if (goldenCaseId === config.goldenCaseId) {
        return config.goldenDatasetDir;
      }
      return join(config.repoRoot, "evals/golden", goldenCaseId);
    }
  });
  const caseData = createCaseDataService({
    store,
    caseExportRootDir: config.caseExportRootDir,
    repoRoot: config.repoRoot,
    resolveGoldenDatasetDir(goldenCaseId) {
      if (goldenCaseId === config.goldenCaseId) {
        return config.goldenDatasetDir;
      }
      return join(config.repoRoot, "evals/golden", goldenCaseId);
    }
  });
  const uploadBatch = createUploadBatchService({
    store,
    documentText,
    parsedDocumentCache,
    masterPrompt,
    caseSnapshot,
    evalRunner,
    ruleMatch,
    ruleAuthority,
    goldenCaseId: config.goldenCaseId,
    batchRootDir: config.batchRootDir,
    masterPromptConfig: config.masterPrompt
  });

  const router = createModuleRouter({
    config,
    context,
    parsedDocumentCache,
    uploadBatch,
    ruleText,
    evalBundle,
    caseData
  });
  app.use("/api/case-filing-ai", router);
  registerModuleEvents(context);
}
