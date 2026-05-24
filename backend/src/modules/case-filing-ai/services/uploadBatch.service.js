import { readdir, readFile } from "fs/promises";
import { join, extname } from "path";
import { AppError } from "../../../shared/http/errors.js";
import {
  isSupportedUpload,
  storedFilenameFor,
  SUPPORTED_UPLOAD_HINT
} from "../utils/document-upload.js";
import { createTraceId } from "../../../shared/utils/traceId.js";
import { buildPipelineStatusFromLog } from "../utils/pipelineStatus.js";
import { createDocumentPipelineRunner } from "./documentPipelineRunner.js";

function extractDocNumber(name) {
  const match = String(name).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function ruleOriginalStoredName(originalname) {
  const ext = extname(originalname || "") || ".bin";
  return `part-rule-original${ext}`;
}

export function sortBatchFiles(files) {
  return [...files].sort((a, b) => {
    const numA = extractDocNumber(a.originalname);
    const numB = extractDocNumber(b.originalname);
    if (numA !== null && numB !== null && numA !== numB) {
      return numA - numB;
    }
    return a.originalname.localeCompare(b.originalname, undefined, { numeric: true });
  });
}

export function createUploadBatchService({
  store,
  documentText,
  parsedDocumentCache,
  masterPrompt,
  caseSnapshot,
  evalRunner,
  ruleMatch,
  ruleAuthority,
  goldenCaseId = "case_001",
  ruleFixturesCaseId = "case_001",
  loadBootstrapSnapshot = null,
  batchRootDir,
  masterPromptConfig = {}
}) {
  const backgroundErrors = new Map();

  const pipelineRunner = createDocumentPipelineRunner({
    store,
    documentText,
    parsedDocumentCache,
    masterPrompt,
    caseSnapshot,
    ruleMatch,
    ruleAuthority,
    ruleFixturesCaseId,
    masterPromptConfig,
    logModule: async (batchId, module, docIndex, phase, extra = {}) => {
      await store.appendProcessingLog(batchId, {
        step: phase === "start" ? "module_started" : "module_completed",
        module,
        docIndex,
        ...extra
      });
    }
  });

  async function logModule(batchId, module, docIndex, phase, extra = {}) {
    await store.appendProcessingLog(batchId, {
      step: phase === "start" ? "module_started" : "module_completed",
      module,
      docIndex,
      ...extra
    });
  }

  async function nextBatchId() {
    let entries = [];
    try {
      entries = await readdir(batchRootDir);
    } catch {
      entries = [];
    }
    const batchNumbers = entries
      .filter((name) => name.startsWith("batch-"))
      .map((name) => parseInt(name.replace("batch-", ""), 10))
      .filter((n) => !Number.isNaN(n));
    const next = batchNumbers.length ? Math.max(...batchNumbers) + 1 : 1;
    return `batch-${String(next).padStart(3, "0")}`;
  }

  function aggregateResults(batchId, caseSnapshotData, documentOutputs) {
    const tasks = [];
    const deadlines = [];
    const humanReviewItems = [];

    for (const doc of documentOutputs) {
      if (doc.tasks?.length) tasks.push(...doc.tasks);
      if (doc.deadlines?.length) deadlines.push(...doc.deadlines);
      if (doc.humanReviewItems?.length) humanReviewItems.push(...doc.humanReviewItems);
    }

    return {
      batchId,
      caseSnapshot: caseSnapshotData,
      documents: documentOutputs,
      tasks,
      deadlines,
      humanReviewItems
    };
  }

  async function aggregateResultsWithRule(batchId, caseSnapshotData, documentOutputs) {
    const base = aggregateResults(batchId, caseSnapshotData, documentOutputs);
    const partRule = await store.readRuleParsed(batchId);
    return { ...base, partRule };
  }

  async function bootstrapRuleState(batchId, { partRuleText, partRuleFile }) {
    let effectiveText = partRuleText?.trim() ?? "";
    let source = effectiveText ? "user_paste" : "none";
    let extraction = null;

    if (partRuleFile?.buffer?.length) {
      const storedName = ruleOriginalStoredName(partRuleFile.originalname);
      await store.saveRuleOriginal(batchId, storedName, partRuleFile.buffer);

      const extracted = await documentText.extractText(partRuleFile.buffer, {
        originalname: partRuleFile.originalname,
        mimetype: partRuleFile.mimetype
      });

      extraction = {
        storedName,
        originalName: partRuleFile.originalname,
        fileKind: extracted.fileKind,
        extractionQuality: extracted.extractionQuality,
        mimeType: partRuleFile.mimetype,
        sizeBytes: partRuleFile.size
      };
      await store.saveRuleExtraction(batchId, extraction);

      if (!effectiveText) {
        effectiveText = extracted.text?.trim() ?? "";
        if (effectiveText) {
          source = "user_upload";
        }
      }
    }

    if (effectiveText) {
      await store.savePartRule(batchId, effectiveText);
      const parsed = await masterPrompt.parsePartRule(effectiveText);
      await store.saveRuleParsed(batchId, {
        source,
        savedAt: new Date().toISOString(),
        extraction,
        ...parsed
      });
    } else {
      await store.savePartRule(batchId, "");
      await store.saveRuleParsed(batchId, {
        source: "pending_inference",
        savedAt: new Date().toISOString(),
        extraction,
        partName: null,
        judgeName: null,
        county: null,
        court: null,
        rules: [],
        schedulingNotes: [],
        deadlinePolicies: [],
        sourceSummary: "",
        confidence: "low",
        inferredFromDocs: []
      });
    }

    return { effectiveText, source, userProvidedRule: Boolean(effectiveText) };
  }

  async function loadFilesFromUploads(batchId) {
    const names = await store.listUploads(batchId);
    const files = [];
    for (const storedName of names) {
      const buffer = await readFile(join(store.batchRootDir, batchId, "uploads", storedName));
      files.push({
        originalname: storedName.replace(/^\d+_/, ""),
        buffer,
        mimetype: "application/octet-stream",
        size: buffer.length
      });
    }
    return sortBatchFiles(files);
  }

  async function runBatchProcessing(batchId, sorted, { source, userProvidedRule, effectiveText }) {
    const batchTraceId = createTraceId(`batch_${batchId}`);
    let currentSnapshot = await caseSnapshot.initSnapshot(batchId);
    if (loadBootstrapSnapshot) {
      const boot = await loadBootstrapSnapshot();
      if (boot) {
        currentSnapshot = { ...currentSnapshot, ...boot, case: boot.case ?? boot };
        await store.writeCaseSnapshot(batchId, currentSnapshot);
      }
    }

    const loopResult = await pipelineRunner.runDocumentLoop({
      batchId,
      sorted,
      batchTraceId,
      currentSnapshot,
      activePartRuleText: effectiveText,
      source,
      userProvidedRule,
      hooks: evalRunner
        ? {
            onAfterDocument: async ({
              batchId: bId,
              docIndex,
              docKey,
              documentResult,
              snapshot,
              allDocumentOutputs
            }) => {
              const traceId = documentResult.traceId;
              await logModule(bId, "eval", docIndex, "start", { batchTraceId, traceId });
              const evalReports = await evalRunner.runAfterDocument({
                batchId: bId,
                docIndex,
                docKey,
                documentResult,
                snapshot,
                allDocumentOutputs
              });
              for (const { evalId, report } of evalReports) {
                await store.saveEvalReport(bId, evalId, report);
              }
              await logModule(bId, "eval", docIndex, "complete", { batchTraceId, traceId });
            }
          }
        : {}
    });

    const { batchStatus, documentOutputs, failedDocuments, currentSnapshot: finalSnapshot } =
      loopResult;

    await store.appendProcessingLog(batchId, {
      step: "batch_completed",
      batchTraceId,
      batchStatus,
      processedCount: loopResult.processedCount,
      failedCount: failedDocuments.length,
      totalCount: loopResult.totalCount
    });

    const aggregated = await aggregateResultsWithRule(
      batchId,
      finalSnapshot,
      documentOutputs
    );
    return {
      ...aggregated,
      batchStatus,
      failedDocuments,
      processedCount: loopResult.processedCount,
      totalCount: loopResult.totalCount,
      processingSummary: {
        partRule: aggregated.partRule ?? null,
        courtRules: { fixtureCaseId: ruleFixturesCaseId, goldenCaseId }
      }
    };
  }

  async function processBatch({ files, partRuleText, partRuleFile }) {
    if (!files?.length) {
      throw new AppError("At least one file is required", 400);
    }

    const supportedFiles = files.filter(isSupportedUpload);
    if (!supportedFiles.length) {
      throw new AppError(
        `No supported files in upload. Supported: ${SUPPORTED_UPLOAD_HINT}`,
        415
      );
    }

    const batchId = await nextBatchId();
    await store.createBatch(batchId);

    const { effectiveText, source, userProvidedRule } = await bootstrapRuleState(batchId, {
      partRuleText,
      partRuleFile
    });

    await store.appendProcessingLog(batchId, {
      step: "batch_started",
      batchId,
      batchTraceId: createTraceId(`batch_${batchId}`),
      fileCount: supportedFiles.length,
      partRuleSource: source
    });

    const sorted = sortBatchFiles(supportedFiles);
    for (let i = 0; i < sorted.length; i += 1) {
      const file = sorted[i];
      const docIndex = i + 1;
      const storedName = storedFilenameFor(docIndex, file.originalname);
      await store.saveUpload(batchId, storedName, file.buffer);
    }

    return runBatchProcessing(batchId, sorted, { source, userProvidedRule, effectiveText });
  }

  function startProcessBatch({ files, partRuleText, partRuleFile }) {
    return (async () => {
      if (!files?.length) {
        throw new AppError("At least one file is required", 400);
      }

      const supportedFiles = files.filter(isSupportedUpload);
      if (!supportedFiles.length) {
        throw new AppError(
          `No supported files in upload. Supported: ${SUPPORTED_UPLOAD_HINT}`,
          415
        );
      }

      const batchId = await nextBatchId();
      await store.createBatch(batchId);

      const { effectiveText, source, userProvidedRule } = await bootstrapRuleState(batchId, {
        partRuleText,
        partRuleFile
      });

      const batchTraceId = createTraceId(`batch_${batchId}`);
      await store.appendProcessingLog(batchId, {
        step: "batch_started",
        batchId,
        batchTraceId,
        fileCount: supportedFiles.length,
        partRuleSource: source
      });

      const sorted = sortBatchFiles(supportedFiles);
      for (let i = 0; i < sorted.length; i += 1) {
        const file = sorted[i];
        const docIndex = i + 1;
        const storedName = storedFilenameFor(docIndex, file.originalname);
        await store.saveUpload(batchId, storedName, file.buffer);
      }

      setImmediate(async () => {
        try {
          await runBatchProcessing(batchId, sorted, {
            source,
            userProvidedRule,
            effectiveText
          });
        } catch (error) {
          backgroundErrors.set(batchId, error);
          await store.appendProcessingLog(batchId, {
            step: "batch_failed",
            error: error?.message ?? String(error)
          });
        }
      });

      return { batchId, status: "processing" };
    })();
  }

  async function getBatchStatus(batchId) {
    await store.assertBatchExists(batchId);
    const log = await store.readProcessingLog(batchId);
    const uploads = await store.listUploads(batchId);
    const pipeline = buildPipelineStatusFromLog(log, uploads);
    const bgError = backgroundErrors.get(batchId);

    return {
      batchId,
      ...pipeline,
      error: bgError?.message ?? null
    };
  }

  async function getProcessingLog(batchId) {
    await store.assertBatchExists(batchId);
    const log = await store.readProcessingLog(batchId);
    return { batchId, entries: log };
  }

  async function getBatchResults(batchId) {
    await store.assertBatchExists(batchId);
    const caseSnapshotData = await store.readCaseSnapshot(batchId);
    const outputFiles = await store.listDocumentOutputs(batchId);
    const documentOutputs = [];

    for (const file of outputFiles) {
      const docKey = file.replace(".json", "");
      documentOutputs.push(await store.readDocumentOutput(batchId, docKey));
    }

    return aggregateResultsWithRule(batchId, caseSnapshotData, documentOutputs);
  }

  async function getBatchEvals(batchId) {
    await store.assertBatchExists(batchId);
    const reports = await store.listAllEvalReports(batchId);
    const summary = {
      pass: reports.filter((r) => r.status === "pass").length,
      partial: reports.filter((r) => r.status === "partial").length,
      fail: reports.filter((r) => r.status === "fail").length,
      criticalFailureCount: reports.reduce(
        (n, r) => n + (r.criticalFailures?.length ?? 0),
        0
      )
    };
    return { batchId, summary, reports };
  }

  return {
    processBatch,
    startProcessBatch,
    getBatchStatus,
    getBatchResults,
    getBatchEvals,
    getProcessingLog,
    sortBatchFiles
  };
}
