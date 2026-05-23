import { readdir } from "fs/promises";
import { join, extname } from "path";
import { AppError } from "../../../shared/http/errors.js";
import {
  isSupportedUpload,
  storedFilenameFor,
  SUPPORTED_UPLOAD_HINT
} from "../utils/document-upload.js";
import { buildRunMetadata } from "../utils/runMetadata.js";

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
  batchRootDir,
  masterPromptConfig = {}
}) {
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
    let activePartRuleText = effectiveText;

    await store.appendProcessingLog(batchId, {
      step: "batch_started",
      batchId,
      fileCount: supportedFiles.length,
      partRuleSource: source
    });

    const sorted = sortBatchFiles(supportedFiles);
    const documentOutputs = [];
    const failedDocuments = [];
    let currentSnapshot = await caseSnapshot.initSnapshot(batchId);

    for (let i = 0; i < sorted.length; i += 1) {
      const file = sorted[i];
      const docIndex = i + 1;
      const storedName = storedFilenameFor(docIndex, file.originalname);
      const docKey = `doc-${String(docIndex).padStart(3, "0")}`;

      await store.saveUpload(batchId, storedName, file.buffer);
      await store.appendProcessingLog(batchId, {
        step: "document_started",
        docIndex,
        storedName,
        originalName: file.originalname
      });

      try {
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
          const matched = await ruleMatch.findApplicableRules({
            caseId: goldenCaseId,
            context: {
              county: caseFields.county,
              part: caseFields.partName ?? caseFields.part,
              court: caseFields.court,
              phase: caseFields.currentPhase,
              documentType: fileMetadata.documentType
            }
          });
          rankedRules = ruleAuthority.rankRules(matched);
          rankedRulesBlock = ruleAuthority.formatRankedRulesBlock(rankedRules);
        }

        const { model, usage, result, promptVersion } = await masterPrompt.processDocument({
          documentText: text,
          fileMetadata,
          priorCaseSnapshot: currentSnapshot,
          partRuleText: activePartRuleText,
          hasUserPartRule: Boolean(activePartRuleText?.trim()),
          rankedRules: rankedRulesBlock
        });

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
        currentSnapshot = caseSnapshot.mergeSnapshot(currentSnapshot, result, {
          docIndex,
          storedName
        });
        await store.writeCaseSnapshot(batchId, currentSnapshot);
        documentOutputs.push(documentResult);

        if (evalRunner) {
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
        }

        await store.appendProcessingLog(batchId, {
          step: "document_completed",
          docIndex,
          storedName,
          fileKind,
          ocr_needed: mergedQuality.ocr_needed ?? false
        });
      } catch (error) {
        const failure = {
          docKey,
          docIndex,
          storedName,
          originalName: file.originalname,
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
      totalCount: sorted.length
    };
  }

  async function getBatchStatus(batchId) {
    await store.assertBatchExists(batchId);
    const log = await store.readProcessingLog(batchId);
    const uploads = await store.listUploads(batchId);
    const outputs = await store.listDocumentOutputs(batchId);

    const lastEntry = log[log.length - 1] ?? {};
    const isComplete = lastEntry.step === "batch_completed";
    const currentDocEntry = [...log].reverse().find((e) => e.step === "document_started");
    const failedCount =
      lastEntry.failedCount ?? log.filter((entry) => entry.step === "document_failed").length;
    const successCount =
      lastEntry.processedCount ??
      log.filter((entry) => entry.step === "document_completed").length;

    return {
      batchId,
      status: isComplete
        ? lastEntry.batchStatus ?? (failedCount ? "partial" : "completed")
        : log.length
          ? "processing"
          : "pending",
      currentStep: lastEntry.step ?? "pending",
      currentDocument: currentDocEntry?.originalName ?? null,
      processedCount: successCount,
      failedCount,
      totalCount: uploads.length
    };
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

  return { processBatch, getBatchStatus, getBatchResults, getBatchEvals, sortBatchFiles };
}
