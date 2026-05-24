import { readdir, readFile } from "fs/promises";
import { join, extname } from "path";
import { AppError } from "../../../shared/http/errors.js";
import {
  isSupportedUpload,
  storedFilenameFor,
  SUPPORTED_UPLOAD_HINT
} from "../utils/document-upload.js";
import { buildRunMetadata } from "./runMetadata.service.js";
import { createTraceId, docTraceId } from "../../../shared/utils/traceId.js";
import { buildPipelineStatusFromLog } from "../utils/pipelineStatus.js";
import { extractPartNumber } from "../../court-rules/utils/catalogToRuleFixtures.js";

function extractDocNumber(name) {
  const match = String(name).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function ruleOriginalStoredName(originalname) {
  const ext = extname(originalname || "") || ".bin";
  return `part-rule-original${ext}`;
}

function mergeInferredPartRule(existingText, result) {
  const chunks = [
    existingText?.trim(),
    result.inferredPartRuleText?.trim(),
    ...(result.partRuleExtracts ?? []).map((entry) => {
      if (typeof entry === "string") return entry.trim();
      if (entry && typeof entry === "object") {
        return JSON.stringify(entry);
      }
      return "";
    })
  ].filter(Boolean);

  return [...new Set(chunks)].join("\n\n");
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

  async function persistInferredPartRule(batchId, {
    effectiveText,
    source,
    docKey,
    originalName,
    result
  }) {
    const mergedText = mergeInferredPartRule(effectiveText, result);
    if (!mergedText || mergedText === effectiveText) {
      return effectiveText;
    }

    await store.savePartRule(batchId, mergedText);

    const existingParsed = (await store.readRuleParsed(batchId)) ?? {};
    const inferredFromDocs = [...(existingParsed.inferredFromDocs ?? [])];
    if (!inferredFromDocs.some((entry) => entry.docKey === docKey)) {
      inferredFromDocs.push({
        docKey,
        originalName,
        inferredPartRuleText: result.inferredPartRuleText ?? "",
        partRuleExtracts: result.partRuleExtracts ?? []
      });
    }

    const parsed =
      source === "pending_inference" || source === "inferred_from_filings"
        ? await masterPrompt.parsePartRule(mergedText)
        : {
            partName: existingParsed.partName ?? null,
            judgeName: existingParsed.judgeName ?? null,
            county: existingParsed.county ?? null,
            court: existingParsed.court ?? null,
            rules: existingParsed.rules ?? [],
            schedulingNotes: existingParsed.schedulingNotes ?? [],
            deadlinePolicies: existingParsed.deadlinePolicies ?? [],
            sourceSummary: existingParsed.sourceSummary ?? "",
            confidence: existingParsed.confidence ?? "medium"
          };

    await store.saveRuleParsed(batchId, {
      ...parsed,
      source: "inferred_from_filings",
      savedAt: new Date().toISOString(),
      extraction: existingParsed.extraction ?? null,
      inferredFromDocs
    });

    return mergedText;
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
    let activePartRuleText = effectiveText;
    const documentOutputs = [];
    const failedDocuments = [];
    let currentSnapshot = await caseSnapshot.initSnapshot(batchId);
    if (loadBootstrapSnapshot) {
      const boot = await loadBootstrapSnapshot();
      if (boot) {
        currentSnapshot = { ...currentSnapshot, ...boot, case: boot.case ?? boot };
        await store.writeCaseSnapshot(batchId, currentSnapshot);
      }
    }

    for (let i = 0; i < sorted.length; i += 1) {
      const file = sorted[i];
      const docIndex = i + 1;
      const storedName = storedFilenameFor(docIndex, file.originalname);
      const docKey = `doc-${String(docIndex).padStart(3, "0")}`;
      const traceId = docTraceId(batchTraceId, docIndex);

      if (!(await store.listUploads(batchId)).includes(storedName)) {
        await store.saveUpload(batchId, storedName, file.buffer);
      }
      await store.appendProcessingLog(batchId, {
        step: "document_started",
        batchTraceId,
        traceId,
        docIndex,
        docKey,
        storedName,
        originalName: file.originalname
      });

      try {
        await logModule(batchId, "parse", docIndex, "start", { batchTraceId, traceId });
        const extractFn =
          parsedDocumentCache?.getOrExtract?.bind(parsedDocumentCache) ??
          (async (batchId, docKey, buffer, meta) => {
            const r = await documentText.extractText(buffer, meta);
            return {
              text: r.text,
              pageCount: r.pageCount,
              fileKind: r.fileKind,
              extractionQuality: r.extractionQuality,
              textSourceUsed: r.extractionQuality?.method ?? "unknown",
              cacheUsed: false,
              pipelineVersions: null
            };
          });

        const {
          text,
          pageCount,
          fileKind,
          extractionQuality,
          textSourceUsed,
          cacheUsed,
          pipelineVersions: docPipelineVersions
        } = await extractFn(batchId, docKey, file.buffer, {
          originalname: file.originalname,
          mimetype: file.mimetype
        });
        await logModule(batchId, "parse", docIndex, "complete", { batchTraceId, traceId });

        const fileMetadata = {
          docIndex,
          storedName,
          originalName: file.originalname,
          fileKind,
          pageCount,
          mimeType: file.mimetype,
          sizeBytes: file.size
        };

        const caseFields = currentSnapshot?.case ?? currentSnapshot ?? {};
        let rankedRules = [];
        let rankedRulesBlock = "";
        if (ruleMatch && ruleAuthority) {
          await logModule(batchId, "court-rules", docIndex, "start", { batchTraceId, traceId });
          const matched = await ruleMatch.findApplicableRules({
            caseId: ruleFixturesCaseId,
            context: {
              county: caseFields.county,
              part:
                caseFields.part ??
                extractPartNumber(caseFields.partName) ??
                extractPartNumber(currentSnapshot?.partName),
              court: caseFields.court,
              phase: currentSnapshot?.currentPhase ?? caseFields.currentPhase,
              documentType: fileMetadata.documentType,
              docIndex
            },
            limit: 12
          });
          rankedRules = ruleAuthority.rankRules(matched);
          rankedRulesBlock = ruleAuthority.formatRankedRulesBlock(rankedRules);
          await logModule(batchId, "court-rules", docIndex, "complete", { batchTraceId, traceId });
        }

        await logModule(batchId, "master-prompt", docIndex, "start", { batchTraceId, traceId });
        const { model, usage, result, promptVersion } = await masterPrompt.processDocument({
          documentText: text,
          fileMetadata,
          priorCaseSnapshot: currentSnapshot,
          partRuleText: activePartRuleText,
          hasUserPartRule: Boolean(activePartRuleText?.trim()),
          rankedRules: rankedRulesBlock
        });
        await logModule(batchId, "master-prompt", docIndex, "complete", { batchTraceId, traceId });

        const runMetadata = buildRunMetadata({
          promptVersion: promptVersion ?? masterPrompt.promptVersion,
          snapshotMergeMode: caseSnapshot.mergeMode,
          openRouterModel: model,
          masterPromptConfig
        });

        if (!userProvidedRule) {
          activePartRuleText = await persistInferredPartRule(batchId, {
            effectiveText: activePartRuleText,
            source,
            docKey,
            originalName: file.originalname,
            result
          });
        }

        const mergedQuality = {
          ...extractionQuality,
          ...(result.extractionQuality ?? {})
        };

        let reviewStatusAtEvalTime = null;
        if (parsedDocumentCache?.getReviewStatus) {
          reviewStatusAtEvalTime = await parsedDocumentCache.getReviewStatus(batchId, docKey);
        }

        const documentResult = {
          docKey,
          docIndex,
          storedName,
          originalName: file.originalname,
          fileKind,
          status: "completed",
          batchTraceId,
          traceId,
          model,
          usage,
          runMetadata,
          pipelineVersions: docPipelineVersions ?? null,
          parsedDocumentCacheUsed: Boolean(cacheUsed),
          textSourceUsed: textSourceUsed ?? null,
          reviewStatusAtEvalTime,
          ruleSourcesChecked: rankedRules.map((r) => r.ruleId),
          rankedRules,
          documentMetadata: result.documentMetadata ?? fileMetadata,
          extractionQuality: mergedQuality,
          docketEntry: result.docketEntry ?? {},
          caseUpdates: result.caseUpdates ?? {},
          parties: result.parties ?? [],
          witnesses: result.witnesses ?? [],
          tasks: result.tasks ?? [],
          deadlines: result.deadlines ?? [],
          humanReviewItems: result.humanReviewItems ?? [],
          auditNotes: result.auditNotes ?? []
        };

        await store.saveDocumentOutput(batchId, docKey, documentResult);
        await logModule(batchId, "snapshot", docIndex, "start", { batchTraceId, traceId });
        currentSnapshot = caseSnapshot.mergeSnapshot(currentSnapshot, result, {
          docIndex,
          storedName
        });
        await store.writeCaseSnapshot(batchId, currentSnapshot);
        await logModule(batchId, "snapshot", docIndex, "complete", { batchTraceId, traceId });
        documentOutputs.push(documentResult);

        if (evalRunner) {
          await logModule(batchId, "eval", docIndex, "start", { batchTraceId, traceId });
          const evalReports = await evalRunner.runAfterDocument({
            batchId,
            docIndex,
            docKey,
            documentResult,
            snapshot: currentSnapshot,
            allDocumentOutputs: documentOutputs
          });
          for (const { evalId, report } of evalReports) {
            await store.saveEvalReport(batchId, evalId, report);
          }
          await logModule(batchId, "eval", docIndex, "complete", { batchTraceId, traceId });
        }

        await store.appendProcessingLog(batchId, {
          step: "document_completed",
          batchTraceId,
          traceId,
          docIndex,
          storedName,
          fileKind,
          ocr_needed: mergedQuality.ocr_needed ?? false,
          promptVersion: runMetadata?.promptVersion ?? null
        });
      } catch (error) {
        const failure = {
          docKey,
          docIndex,
          storedName,
          originalName: file.originalname,
          batchTraceId,
          traceId,
          status: "failed",
          error: {
            message: error?.message ?? String(error),
            statusCode: error?.statusCode ?? 500
          }
        };

        failedDocuments.push(failure);
        await store.saveDocumentOutput(batchId, docKey, failure);
        documentOutputs.push(failure);

        await store.appendProcessingLog(batchId, {
          step: "document_failed",
          batchTraceId,
          traceId,
          docIndex,
          storedName,
          originalName: file.originalname,
          error: failure.error.message
        });
      }
    }

    const successCount = documentOutputs.filter((doc) => doc.status !== "failed").length;
    const batchStatus = failedDocuments.length
      ? successCount
        ? "partial"
        : "failed"
      : "completed";

    await store.appendProcessingLog(batchId, {
      step: "batch_completed",
      batchTraceId,
      batchStatus,
      processedCount: successCount,
      failedCount: failedDocuments.length,
      totalCount: sorted.length
    });

    const aggregated = await aggregateResultsWithRule(batchId, currentSnapshot, documentOutputs);
    return {
      ...aggregated,
      batchStatus,
      failedDocuments,
      processedCount: successCount,
      totalCount: sorted.length,
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
