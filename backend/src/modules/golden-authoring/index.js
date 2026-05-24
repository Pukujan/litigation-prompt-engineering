import { join } from "path";
import { getSnapshotMergeMode } from "../case-filing-ai/config/index.js";
import { createOpenRouterClient } from "../case-filing-ai/adapters/openrouter.client.js";
import { createOcrService } from "../case-filing-ai/services/ocr.service.js";
import { createDocumentTextService } from "../case-filing-ai/services/documentText.service.js";
import { createOfficeTextService } from "../case-filing-ai/services/officeText.service.js";
import { createCaseSnapshotService } from "../case-filing-ai/services/caseSnapshot.service.js";
import { createMasterPromptService } from "../case-filing-ai/services/masterPrompt.service.js";
import { createRuleStoreService } from "../court-rules/services/ruleStore.service.js";
import { createRuleMatchService } from "../court-rules/services/ruleMatch.service.js";
import { createRuleAuthorityService } from "../court-rules/services/ruleAuthority.service.js";
import { getGoldenAuthoringConfig } from "./config/index.js";
import { createStagingStoreService } from "./services/stagingStore.service.js";
import { createGoldenVersionService } from "./services/goldenVersion.service.js";
import { createGoldenExporterService } from "./services/goldenExporter.service.js";
import { createAuthoringBatchService } from "./services/authoringBatch.service.js";
import { createPromoteGoldenService } from "./services/promoteGolden.service.js";
import { createAuthoringRegistryService } from "./services/authoringRegistry.service.js";
import { createGoldenAuthoringRoutes } from "./routes/goldenAuthoring.routes.js";

export function register(app) {
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
  const goldenExporter = createGoldenExporterService({ stagingStore });
  const registry = createAuthoringRegistryService({ stagingStore });

  const openRouter = createOpenRouterClient(config.openRouter);
  const ocr = createOcrService({ openRouter });
  const officeText = createOfficeTextService();
  const documentText = createDocumentTextService({ ocr, officeText });
  const mergeMode = getSnapshotMergeMode(config.masterPrompt.version);

  const ruleStore = createRuleStoreService({
    fixturesRoot: join(config.repoRoot, "data/court-rules/fixtures")
  });
  const ruleMatch = createRuleMatchService({ ruleStore });
  const ruleAuthority = createRuleAuthorityService();

  const authoring = {
    allocateAndPrepare(opts) {
      const versionPromise = goldenVersion.allocateVersionId({
        legalCaseId: opts.legalCaseId,
        purpose: opts.purpose ?? goldenVersion.PURPOSE_DEFAULT
      });
      return versionPromise.then(async (version) => {
        const caseId = goldenVersion.caseIdFromVersion(version, opts.caseSlug);
        await stagingStore.ensureDir(stagingStore.versionDir(caseId, version));
        return { caseId, version };
      });
    },
    async processAuthoringBatch(opts) {
      const runStore = stagingStore.createRunStoreAdapter(opts.caseId, opts.version);
      const caseSnapshot = createCaseSnapshotService({
        store: runStore,
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

      const batch = createAuthoringBatchService({
        stagingStore,
        goldenExporter,
        goldenVersion,
        documentText,
        parsedDocumentCache: null,
        masterPrompt,
        caseSnapshot,
        ruleMatch,
        ruleAuthority,
        config
      });

      const result = await batch.processAuthoringBatch(opts);
      registry.registerRun(result.runId, result);
      return result;
    },
    getRun: (runId) => registry.getRun(runId)
  };

  const promote = createPromoteGoldenService({
    stagingStore,
    goldenVersion,
    repoRoot: config.repoRoot
  });

  app.use(
    "/api/golden-authoring",
    createGoldenAuthoringRoutes({ config, authoring, promote, goldenVersion })
  );
}
