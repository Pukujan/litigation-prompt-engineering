import { readFile, readdir } from "fs/promises";
import { join, extname } from "path";
import { getGoldenAuthoringConfig } from "../config/index.js";
import { createStagingStoreService } from "../services/stagingStore.service.js";
import { createGoldenVersionService } from "../services/goldenVersion.service.js";
import { createGoldenExporterService } from "../services/goldenExporter.service.js";
import { createAuthoringBatchService } from "../services/authoringBatch.service.js";
import { createOpenRouterClient } from "../../case-filing-ai/adapters/openrouter.client.js";
import { createOcrService } from "../../case-filing-ai/services/ocr.service.js";
import { createDocumentTextService } from "../../case-filing-ai/services/documentText.service.js";
import { createOfficeTextService } from "../../case-filing-ai/services/officeText.service.js";
import { createCaseSnapshotService } from "../../case-filing-ai/services/caseSnapshot.service.js";
import { createMasterPromptService } from "../../case-filing-ai/services/masterPrompt.service.js";
import { getSnapshotMergeMode } from "../../case-filing-ai/config/index.js";
import { createRuleStoreService } from "../../court-rules/services/ruleStore.service.js";
import { createRuleMatchService } from "../../court-rules/services/ruleMatch.service.js";
import { createRuleAuthorityService } from "../../court-rules/services/ruleAuthority.service.js";
import { isSupportedUpload } from "../../case-filing-ai/utils/document-upload.js";

async function loadPdfFiles(importDir, pdfGlob) {
  const pattern = pdfGlob ?? "**/*.pdf";
  const simpleSuffix = pattern.replace(/^\*\*\//, "").replace(/^\*/, "");
  const files = [];
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && isSupportedUpload({ originalname: entry.name })) {
        if (!simpleSuffix || entry.name.endsWith(simpleSuffix.replace(/^\*/, ""))) {
          const buffer = await readFile(full);
          files.push({
            originalname: entry.name,
            buffer,
            mimetype: extname(entry.name) === ".pdf" ? "application/pdf" : "application/octet-stream",
            size: buffer.length
          });
        }
      }
    }
  }
  await walk(importDir);
  return files;
}

export async function runAuthorGoldenCli({
  caseSlug,
  legalCaseId,
  importDir,
  importStamp = null,
  purpose = "rule_authority",
  partRuleText = ""
}) {
  const config = getGoldenAuthoringConfig();
  const manifestPath = join(importDir, "case_manifest.json");
  const manifestRaw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw);

  const caseIdentity = manifest.caseIdentity;
  if (!caseIdentity) {
    throw new Error("case_manifest.json must include caseIdentity");
  }

  const files = await loadPdfFiles(importDir, manifest.pdfGlob);
  if (!files.length) {
    throw new Error(`No supported PDFs found under ${importDir}`);
  }

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

  const version = await goldenVersion.allocateVersionId({ legalCaseId, purpose });
  const caseId = goldenVersion.caseIdFromVersion(version, caseSlug);
  await stagingStore.ensureDir(stagingStore.versionDir(caseId, version));

  const openRouter = createOpenRouterClient(config.openRouter);
  const ocr = createOcrService({ openRouter });
  const documentText = createDocumentTextService({
    ocr,
    officeText: createOfficeTextService()
  });
  const runStore = stagingStore.createRunStoreAdapter(caseId, version);
  const caseSnapshot = createCaseSnapshotService({
    store: runStore,
    mergeMode: getSnapshotMergeMode(config.masterPrompt.version),
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
  const ruleStore = createRuleStoreService({
    fixturesRoot: join(config.repoRoot, "data/court-rules/fixtures")
  });

  const authoringBatch = createAuthoringBatchService({
    stagingStore,
    goldenExporter,
    goldenVersion,
    documentText,
    parsedDocumentCache: null,
    masterPrompt,
    caseSnapshot,
    ruleMatch: createRuleMatchService({ ruleStore }),
    ruleAuthority: createRuleAuthorityService(),
    config
  });

  const result = await authoringBatch.processAuthoringBatch({
    caseId,
    version,
    legalCaseId,
    caseIdentity,
    files,
    manifest,
    importStamp,
    partRuleText
  });

  return { ...result, caseSlug, legalCaseId, importDir };
}
