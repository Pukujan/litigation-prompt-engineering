import { extractPartNumber } from "../../court-rules/utils/catalogToRuleFixtures.js";
import { docTraceId } from "../../../shared/utils/traceId.js";
import { buildRunMetadata } from "./runMetadata.service.js";
import { storedFilenameFor } from "../utils/document-upload.js";

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

/**
 * Shared per-document pipeline: parse → court-rules → master prompt → snapshot.
 * Callers attach eval (runtime) or golden export (authoring) via hooks.onAfterDocument.
 */
export function createDocumentPipelineRunner({
  store,
  documentText,
  parsedDocumentCache,
  masterPrompt,
  caseSnapshot,
  ruleMatch,
  ruleAuthority,
  ruleFixturesCaseId = "case_001",
  masterPromptConfig = {},
  logModule = async () => {}
}) {
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

  async function processOneDocument({
    batchId,
    file,
    docIndex,
    batchTraceId,
    traceId,
    currentSnapshot,
    activePartRuleText,
    source,
    userProvidedRule,
    hooks = {}
  }) {
    const storedName = storedFilenameFor(docIndex, file.originalname);
    const docKey = `doc-${String(docIndex).padStart(3, "0")}`;

    if (store.saveUpload && !(await store.listUploads(batchId)).includes(storedName)) {
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
        (async (bId, dKey, buffer, meta) => {
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

      let nextPartRuleText = activePartRuleText;
      if (!userProvidedRule && store.savePartRule) {
        nextPartRuleText = await persistInferredPartRule(batchId, {
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
        auditNotes: result.auditNotes ?? [],
        rawMasterResult: result
      };

      if (store.saveDocumentOutput) {
        await store.saveDocumentOutput(batchId, docKey, documentResult);
      }

      await logModule(batchId, "snapshot", docIndex, "start", { batchTraceId, traceId });
      const nextSnapshot = caseSnapshot.mergeSnapshot(currentSnapshot, result, {
        docIndex,
        storedName
      });
      await store.writeCaseSnapshot(batchId, nextSnapshot);
      await logModule(batchId, "snapshot", docIndex, "complete", { batchTraceId, traceId });

      if (hooks.onAfterDocument) {
        await hooks.onAfterDocument({
          batchId,
          docIndex,
          docKey,
          documentResult,
          snapshot: nextSnapshot,
          allDocumentOutputs: hooks.allDocumentOutputs
        });
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

      return {
        documentResult,
        currentSnapshot: nextSnapshot,
        activePartRuleText: nextPartRuleText,
        failed: false
      };
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

      if (store.saveDocumentOutput) {
        await store.saveDocumentOutput(batchId, docKey, failure);
      }

      await store.appendProcessingLog(batchId, {
        step: "document_failed",
        batchTraceId,
        traceId,
        docIndex,
        storedName,
        originalName: file.originalname,
        error: failure.error.message
      });

      return {
        documentResult: failure,
        currentSnapshot,
        activePartRuleText,
        failed: true
      };
    }
  }

  async function runDocumentLoop({
    batchId,
    sorted,
    batchTraceId,
    currentSnapshot: initialSnapshot,
    activePartRuleText: initialPartRuleText,
    source,
    userProvidedRule,
    hooks = {}
  }) {
    const documentOutputs = [];
    const failedDocuments = [];
    let currentSnapshot = initialSnapshot;
    let activePartRuleText = initialPartRuleText;

    for (let i = 0; i < sorted.length; i += 1) {
      const file = sorted[i];
      const docIndex = i + 1;
      const traceId = docTraceId(batchTraceId, docIndex);

      const loopHooks = {
        ...hooks,
        allDocumentOutputs: documentOutputs
      };

      const outcome = await processOneDocument({
        batchId,
        file,
        docIndex,
        batchTraceId,
        traceId,
        currentSnapshot,
        activePartRuleText,
        source,
        userProvidedRule,
        hooks: loopHooks
      });

      documentOutputs.push(outcome.documentResult);
      currentSnapshot = outcome.currentSnapshot;
      activePartRuleText = outcome.activePartRuleText;

      if (outcome.failed) {
        failedDocuments.push(outcome.documentResult);
      }
    }

    const successCount = documentOutputs.filter((doc) => doc.status !== "failed").length;
    const batchStatus = failedDocuments.length
      ? successCount
        ? "partial"
        : "failed"
      : "completed";

    return {
      batchStatus,
      documentOutputs,
      failedDocuments,
      currentSnapshot,
      activePartRuleText,
      processedCount: successCount,
      totalCount: sorted.length
    };
  }

  return { processOneDocument, runDocumentLoop, persistInferredPartRule };
}
