import { mkdir, writeFile, copyFile, readFile } from "fs/promises";
import { join, dirname } from "path";
import { buildGoldenAuditRecord } from "./goldenAudit.service.js";

const SYNTHETIC_NOTICE =
  "Synthetic expected output; no real NYSCEF file/data used.";

export function docEvalId(docIndex) {
  return `doc_${String(docIndex).padStart(3, "0")}`;
}

export function snapshotEvalId(docIndex) {
  return `after_doc_${String(docIndex).padStart(3, "0")}`;
}

/**
 * Map runtime documentResult → golden doc_NNN.expected.json shape.
 */
export function documentResultToExpected(documentResult) {
  const meta = documentResult.documentMetadata ?? {};
  const docket = documentResult.docketEntry ?? {};
  const extractionQuality = documentResult.extractionQuality ?? {};

  return {
    docIndex: documentResult.docIndex,
    docKey: documentResult.docKey,
    expectedDocumentType:
      docket.filingType ?? meta.documentType ?? meta.title ?? "",
    expectedTitle: meta.title ?? docket.filingType ?? documentResult.originalName ?? "",
    expectedFilingDate: docket.filingDate ?? meta.filedDate ?? meta.filingDate ?? null,
    expectedReceivedDate: meta.receivedDate ?? null,
    expectedNyscefDocNo: docket.nyscefDocNo ?? meta.nyscefDocNo ?? meta.docIndex ?? null,
    expectedPageCount: meta.pageCount ?? null,
    expectedExtractionQuality: extractionQuality,
    expectedConfirmedFacts: documentResult.caseUpdates?.confirmedFacts ?? [],
    expectedParties: documentResult.parties ?? [],
    expectedTasks: documentResult.tasks ?? [],
    expectedDeadlines: documentResult.deadlines ?? [],
    expectedHumanReviewItems: documentResult.humanReviewItems ?? [],
    mustNotCreate: documentResult.rawMasterResult?.mustNotCreate ?? [],
    synthetic: true,
    syntheticDataNotice: SYNTHETIC_NOTICE,
    expectedRuleSourcesApplied: documentResult.ruleSourcesChecked ?? [],
    expectedRuleAuthorityBehavior: {
      mustIncludeSourceAuthorityOnFinalDeadlines: true,
      mustUseHighestApplicableAuthority: true,
      mustNotUseGeneralRuleWhenSpecificOrderControls: true
    }
  };
}

/**
 * Map merged case snapshot → after_doc_NNN.expected.json shape.
 */
export function snapshotToExpected(snapshot, docIndex, caseIdentity = {}) {
  const caseId = caseIdentity.caseId ?? snapshot.caseId ?? null;
  return {
    snapshotId: snapshotEvalId(docIndex),
    caseId,
    afterDocNo: docIndex,
    currentPhase: snapshot.currentPhase ?? null,
    currentMiniPhase: snapshot.currentMiniPhase ?? null,
    confirmedFacts: snapshot.confirmedFacts ?? [],
    openTasks: snapshot.openTasks ?? [],
    completedTasks: snapshot.completedTasks ?? [],
    deadlines: snapshot.deadlines ?? [],
    supersededDeadlines: snapshot.supersededDeadlines ?? [],
    conflicts: snapshot.conflicts ?? [],
    auditNotes: snapshot.auditNotes ?? [],
    synthetic: true,
    syntheticDataNotice: "Synthetic snapshot expected output for eval testing.",
    expectedRuleAuthorityState: snapshot.expectedRuleAuthorityState ?? {
      activeRuleSetVersion: null,
      authorityHierarchy: {},
      ruleSourcesAvailable: []
    }
  };
}

export function createGoldenExporterService({ stagingStore }) {
  async function writeJsonFile(path, data) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(data, null, 2), "utf8");
  }

  async function exportToStaging({
    caseId,
    version,
    legalCaseId,
    caseIdentity,
    documentOutputs,
    snapshotsByCheckpoint,
    pipelineVersions,
    authoringRun,
    evalComparisonConfig = null,
    negativeGuardrails = [],
    importStamp = null
  }) {
    const outDir = stagingStore.versionDir(caseId, version);
    await stagingStore.ensureDir(outDir);

    const documentExpectedOutputs = [];
    for (const doc of documentOutputs) {
      if (doc.status === "failed") continue;
      const expected = documentResultToExpected(doc);
      documentExpectedOutputs.push(expected);
      await writeJsonFile(
        join(outDir, `${docEvalId(doc.docIndex)}.expected.json`),
        expected
      );
    }

    const snapshotExpectedOutputs = {};
    for (const [docIndex, snap] of Object.entries(snapshotsByCheckpoint)) {
      const key = snapshotEvalId(Number(docIndex));
      const expected = snapshotToExpected(snap, Number(docIndex), caseIdentity);
      snapshotExpectedOutputs[key] = expected;
      await writeJsonFile(join(outDir, `${key}.expected.json`), expected);
    }

    await writeJsonFile(join(outDir, "negative_guardrails.expected.json"), negativeGuardrails);

    const comparisonConfig =
      evalComparisonConfig ??
      (await loadDefaultEvalComparisonConfig(stagingStore.repoRoot));

    await writeJsonFile(join(outDir, "eval_comparison_config.json"), comparisonConfig);

    const pipelineVersionsExpected = {
      parserVersion: pipelineVersions.parser ?? "pdf-embedded-v1",
      ocrVersion: pipelineVersions.ocr ?? "openrouter-vision-v1",
      masterPromptVersion: pipelineVersions.masterPrompt ?? "v1",
      ruleMatchPromptVersion: pipelineVersions.rulePrompt ?? "v1",
      taskDeadlinePromptVersion: "task-docketing/task-deadline-1.0.0",
      snapshotPromptVersion: pipelineVersions.snapshotPrompt ?? "v1",
      ruleSetVersion: pipelineVersions.ruleSet ?? "fixtures-v0",
      goldenDatasetVersion: version,
      authorModel: authoringRun.authorModel,
      authoringRunId: authoringRun.runId,
      modelInventoryVersion: authoringRun.modelInventoryVersion ?? null,
      promptInventoryVersion: authoringRun.promptInventoryVersion ?? null
    };

    await writeJsonFile(join(outDir, "pipeline_versions.expected.json"), pipelineVersionsExpected);

    const goldenAudit = await buildGoldenAuditRecord({
      repoRoot: stagingStore.repoRoot,
      authoringRun,
      pipelineVersions,
      pipelineVersionsExpected,
      caseId,
      version,
      importStamp
    });
    await writeJsonFile(join(outDir, "golden_audit.json"), goldenAudit);

    const goldenDataset = {
      meta: {
        datasetId: version,
        name: `Golden dataset ${version}`,
        generatedAt: new Date().toISOString(),
        purpose:
          "Authoring pipeline expected outputs for evaluating Case Filing AI.",
        importantNote:
          "Synthetic eval fixture; not legal advice or court-certified record.",
        syntheticDataNotice: SYNTHETIC_NOTICE,
        authoringRunId: authoringRun.runId,
        authorModel: authoringRun.authorModel,
        masterPromptVersion: authoringRun.masterPromptVersion,
        modelInventoryVersion: pipelineVersionsExpected.modelInventoryVersion,
        promptInventoryVersion: pipelineVersionsExpected.promptInventoryVersion,
        importStamp,
        auditArtifact: "golden_audit.json"
      },
      caseIdentity,
      expectedProcessingRule: {
        processOrder: [
          "NYSCEF document number ascending",
          "filed date/time ascending",
          "filename order",
          "upload order"
        ],
        coreRule:
          "Prior case snapshot may guide interpretation, but only the current document can confirm facts.",
        snapshotUpdateRule:
          "Run doc-level eval/guardrail check before promoting extracted items into rolling case snapshot."
      },
      documentExpectedOutputs,
      snapshotExpectedOutputs,
      negativeGuardrailTests: negativeGuardrails,
      evalComparisonConfig: comparisonConfig
    };

    await writeJsonFile(
      join(outDir, `${caseId}.golden-dataset.json`),
      goldenDataset
    );

    await writeJsonFile(join(outDir, "authoring_run.json"), authoringRun);

    try {
      const noticeSrc = join(
        stagingStore.repoRoot,
        "evals/golden/case_001_rule_authority_v002/SYNTHETIC_DATA_NOTICE.md"
      );
      await copyFile(noticeSrc, join(outDir, "SYNTHETIC_DATA_NOTICE.md"));
    } catch {
      await writeFile(
        join(outDir, "SYNTHETIC_DATA_NOTICE.md"),
        `# Synthetic Data Notice\n\n${SYNTHETIC_NOTICE}\n`,
        "utf8"
      );
    }

    return { outDir, documentCount: documentExpectedOutputs.length };
  }

  return { exportToStaging, documentResultToExpected, snapshotToExpected };
}

async function loadDefaultEvalComparisonConfig(repoRoot) {
  try {
    const raw = await readFile(
      join(
        repoRoot,
        "evals/golden/case_001_rule_authority_v002/eval_comparison_config.json"
      ),
      "utf8"
    );
    return JSON.parse(raw);
  } catch {
    return {
      exactMatchFields: ["expectedDocumentType", "expectedNyscefDocNo"],
      semanticMatchFields: ["expectedConfirmedFacts", "expectedTasks.taskDescription"],
      guardrailFields: ["mustNotCreate", "negativeGuardrailTests"],
      criticalFailureRules: [],
      ruleAuthorityChecks: ["deadline_has_sourceAuthority"]
    };
  }
}
