import { readFile, writeFile, mkdir } from "fs/promises";
import { join, relative } from "path";

/**
 * Scan the repo and build the consolidated model document (in memory).
 * @param {{ repoRoot: string }} options
 */
export async function buildConsolidatedModels({ repoRoot }) {
  const ROOT = repoRoot;

  async function readJson(relPath) {
    const abs = join(ROOT, relPath);
    const raw = await readFile(abs, "utf8");
    return JSON.parse(raw);
  }

  async function tryReadJson(relPath) {
    try {
      return await readJson(relPath);
    } catch {
      return null;
    }
  }

  const models = {
    meta: {
      generatedAt: new Date().toISOString(),
      repositoryRoot: ROOT,
      condensedBy: "model-condenser",
      description:
        "Consolidated inventory of JSON shapes used by the legal-prmpt-eng case filing pipeline."
    },
    inventory: [],
    definitions: {}
  };

  function addModel({
  id,
  name,
  category,
  sourcePaths,
  description,
  schema,
  example,
  exampleSourcePath
}) {
  models.inventory.push({
    id,
    name,
    category,
    sourcePaths,
    description,
    hasSchema: Boolean(schema),
    hasExample: Boolean(example),
    exampleSourcePath: exampleSourcePath ?? null
  });
  models.definitions[id] = {
    name,
    category,
    sourcePaths,
    description,
    schema: schema ?? null,
    example: example ?? null
  };
}

// --- Core domain (from handoffs/.../core-models.ts + shared JS typedefs) ---
addModel({
  id: "CaseModel",
  name: "CaseModel",
  category: "core_domain",
  sourcePaths: [
    "work-log/handoffs/001_2026-05-23_starter_case-filing-ai-updated/models/typescript/core-models.ts",
    "backend/src/shared/domain/case-filing/core-models.js"
  ],
  description: "Top-level case identity and phase tracking.",
  schema: {
    caseId: "string",
    county: "string | null",
    court: "string | null",
    indexNumber: "string | null",
    caseName: "string | null",
    caseType: "string | null",
    judgeName: "string | null",
    partName: "string | null",
    currentPhase: "string | null",
    currentMiniPhase: "string | null",
    confidence: "high | medium | low"
  },
  example: await readJson("data/case-filing-ai/examples/case.json"),
  exampleSourcePath: "data/case-filing-ai/examples/case.json"
});

addModel({
  id: "DocumentModel",
  name: "DocumentModel",
  category: "core_domain",
  sourcePaths: [
    "work-log/handoffs/001_2026-05-23_starter_case-filing-ai-updated/models/typescript/core-models.ts",
    "backend/src/shared/domain/case-filing/core-models.js",
    "work-log/handoffs/001_2026-05-23_starter_case-filing-ai-updated/db/migrations/001_case_filing_ai_schema.sql"
  ],
  description: "A filing document linked to a case (NYSCEF-style metadata).",
  schema: {
    documentId: "string",
    caseId: "string",
    nyscefDocNo: "number | null",
    title: "string | null",
    documentType: "string | null",
    filedDateTime: "string | null",
    filedBy: "string | null",
    sourceFileName: "string",
    pageCount: "number | null",
    extractionStatus: "string",
    textReviewStatus: "unreviewed | partially_reviewed | reviewed | rejected"
  }
});

addModel({
  id: "DocumentTextVersionModel",
  name: "DocumentTextVersionModel",
  category: "core_domain",
  sourcePaths: [
    "work-log/handoffs/001_2026-05-23_starter_case-filing-ai-updated/models/typescript/core-models.ts",
    "backend/src/shared/domain/case-filing/core-models.js"
  ],
  description: "Versioned extracted or reviewed text for a document (filing-text-vault).",
  schema: {
    id: "string",
    caseId: "string",
    documentId: "string",
    versionType: "embedded_text | ocr_text | ai_parsed_text | human_reviewed_text",
    textContent: "string (optional)",
    structuredJson: "unknown (optional)",
    extractionMethod: "pdf_text | ocr | llm | human_review",
    reviewStatus: "unreviewed | partially_reviewed | reviewed | rejected",
    createdBy: "system | ai | human",
    createdAt: "string (ISO datetime)"
  }
});

addModel({
  id: "TaskModel",
  name: "TaskModel",
  category: "core_domain",
  sourcePaths: [
    "work-log/handoffs/001_2026-05-23_starter_case-filing-ai-updated/models/typescript/core-models.ts",
    "backend/src/shared/domain/case-filing/core-models.js"
  ],
  description: "Docketing task with due date and workflow status.",
  schema: {
    taskId: "string",
    caseId: "string",
    documentId: "string (optional)",
    taskDescription: "string",
    taskType: "string",
    responsibleParty: "string | null",
    dueDate: "string | null",
    dueDateStatus: "fixed | calculated | no_fixed_due_date | needs_review",
    status:
      "ai_extracted_unreviewed | source_supported_auto_saved | conditional | needs_ocr_review | corrected_later | superseded | human_verified",
    sourcePage: "number (optional)",
    confidence: "high | medium | low",
    docketingNote: "string (optional)"
  }
});

addModel({
  id: "HumanReviewItemModel",
  name: "HumanReviewItemModel",
  category: "core_domain",
  sourcePaths: [
    "work-log/handoffs/001_2026-05-23_starter_case-filing-ai-updated/models/typescript/core-models.ts",
    "backend/src/shared/domain/case-filing/core-models.js"
  ],
  description: "Mandatory human review queue item (OCR, handwriting, stamps, etc.).",
  schema: {
    itemId: "string",
    caseId: "string",
    documentId: "string",
    pageNumber: "number",
    location: "string",
    issue: "string",
    reason: "string",
    suggestedAction: "string",
    cropFilePath: "string (optional)",
    blocking: "boolean",
    status: "pending | reviewed | resolved"
  }
});

const emptySnapshot = {
  snapshotId: null,
  caseId: null,
  afterDocNo: null,
  currentPhase: null,
  currentMiniPhase: null,
  confirmedFacts: [],
  carriedForwardContext: [],
  openTasks: [],
  completedTasks: [],
  conditionalTasks: [],
  deadlines: [],
  supersededDeadlines: [],
  unresolvedHumanReviewItems: [],
  conflicts: [],
  auditNotes: []
};

addModel({
  id: "CaseStateSnapshotModel",
  name: "CaseStateSnapshotModel",
  category: "core_domain",
  sourcePaths: [
    "work-log/handoffs/001_2026-05-23_starter_case-filing-ai-updated/models/typescript/core-models.ts",
    "backend/src/shared/domain/case-filing/core-models.js",
    "backend/src/modules/case-filing-ai/services/localJsonStore.service.js"
  ],
  description: "Rolling case state after each processed document.",
  schema: {
    snapshotId: "string | null",
    caseId: "string | null",
    afterDocNo: "number | null",
    currentPhase: "string | null",
    currentMiniPhase: "string | null",
    confirmedFacts: "unknown[]",
    carriedForwardContext: "unknown[]",
    openTasks: "TaskModel[] | string[] (runtime varies)",
    completedTasks: "TaskModel[] | string[]",
    conditionalTasks: "TaskModel[] | string[]",
    deadlines: "unknown[]",
    supersededDeadlines: "unknown[]",
    unresolvedHumanReviewItems: "HumanReviewItemModel[]",
    conflicts: "unknown[]",
    auditNotes: "string[]"
  },
  example: await readJson("data/case-filing-ai/examples/case-snapshot.json"),
  exampleSourcePath: "data/case-filing-ai/examples/case-snapshot.json"
});

addModel({
  id: "EmptyCaseStateSnapshot",
  name: "EmptyCaseStateSnapshot",
  category: "runtime_default",
  sourcePaths: ["backend/src/modules/case-filing-ai/services/localJsonStore.service.js"],
  description: "Initial snapshot written when a new batch is created.",
  schema: emptySnapshot,
  example: emptySnapshot
});

// --- Prompt output schemas ---
addModel({
  id: "MasterCaseFilingPromptOutput",
  name: "MasterCaseFilingPromptOutput",
  category: "prompt_output",
  sourcePaths: [
    "backend/src/modules/case-filing-ai/prompts/master-case-filing.prompt.md",
    "work-log/handoffs/002_2026-05-23_00-42_handoff_second.md"
  ],
  description: "Strict JSON returned by the master case-filing LLM prompt per document.",
  schema: {
    documentMetadata: "object",
    extractionQuality: "object",
    docketEntry: "object",
    caseUpdates: "object",
    parties: "array",
    witnesses: "array",
    tasks: "array",
    deadlines: "array",
    humanReviewItems: "array",
    updatedCaseSnapshot: "object",
    auditNotes: "array",
    inferredPartRuleText: "string",
    partRuleExtracts: "array"
  }
});

addModel({
  id: "PartRuleParsed",
  name: "PartRuleParsed",
  category: "prompt_output",
  sourcePaths: ["backend/src/modules/case-filing-ai/prompts/rule-parse.prompt.md"],
  description: "Structured part/judge rules after parsing user-supplied rule text.",
  schema: {
    partName: "string | null",
    judgeName: "string | null",
    county: "string | null",
    court: "string | null",
    rules: "string[]",
    schedulingNotes: "string[]",
    deadlinePolicies: "string[]",
    sourceSummary: "string",
    confidence: "high | medium | low"
  },
  example: await tryReadJson("data/case-filing-ai/batches/batch-002/rule/part-rules-parsed.json"),
  exampleSourcePath: "data/case-filing-ai/batches/batch-002/rule/part-rules-parsed.json"
});

addModel({
  id: "PartRuleStoredRecord",
  name: "PartRuleStoredRecord",
  category: "pipeline_storage",
  sourcePaths: ["backend/src/modules/case-filing-ai/services/uploadBatch.service.js"],
  description: "part-rules-parsed.json on disk: PartRuleParsed plus batch metadata.",
  schema: {
    source: "user_paste | user_upload | inferred_from_filings | pending_inference | none",
    savedAt: "string (ISO datetime)",
    extraction: "PartRuleExtraction | null",
    inferredFromDocs: "array (optional)",
    "...PartRuleParsed fields": "see PartRuleParsed"
  }
});

addModel({
  id: "PartRuleExtraction",
  name: "PartRuleExtraction",
  category: "pipeline_storage",
  sourcePaths: ["backend/src/modules/case-filing-ai/services/uploadBatch.service.js"],
  description: "part-rules-extraction.json: file upload metadata for a part rule file.",
  schema: {
    storedName: "string",
    originalName: "string",
    fileKind: "pdf | text | image | office | binary",
    extractionQuality: "ExtractionQuality",
    mimeType: "string",
    sizeBytes: "number"
  },
  example: await tryReadJson("data/case-filing-ai/batches/batch-002/rule/part-rules-extraction.json"),
  exampleSourcePath: "data/case-filing-ai/batches/batch-002/rule/part-rules-extraction.json"
});

addModel({
  id: "ExtractionQuality",
  name: "ExtractionQuality",
  category: "pipeline_runtime",
  sourcePaths: ["backend/src/modules/case-filing-ai/services/documentText.service.js"],
  description: "Text extraction quality flags for uploads and filings.",
  schema: {
    method: "string",
    fileKind: "string",
    textLength: "number",
    ocr_needed: "boolean",
    ocr_used: "boolean",
    ocr_model: "string | null",
    ocr_pages: "number[] | null",
    reviewStatus: "ai_extracted_unreviewed | ...",
    note: "string | null"
  }
});

addModel({
  id: "DocumentProcessingOutput",
  name: "DocumentProcessingOutput",
  category: "pipeline_storage",
  sourcePaths: [
    "backend/src/modules/case-filing-ai/services/uploadBatch.service.js",
    "data/case-filing-ai/batches/batch-002/outputs/doc-001.json"
  ],
  description: "Per-document JSON saved under data/.../outputs/doc-NNN.json after LLM processing.",
  schema: {
    docKey: "string",
    docIndex: "number",
    storedName: "string",
    originalName: "string",
    fileKind: "string",
    model: "string",
    usage: "object",
    documentMetadata: "object",
    extractionQuality: "object",
    docketEntry: "object",
    caseUpdates: "object",
    parties: "array",
    witnesses: "array",
    tasks: "array",
    deadlines: "array",
    humanReviewItems: "array",
    auditNotes: "array"
  },
  example: await tryReadJson("data/case-filing-ai/batches/batch-002/outputs/doc-001.json"),
  exampleSourcePath: "data/case-filing-ai/batches/batch-002/outputs/doc-001.json"
});

addModel({
  id: "BatchProcessingResult",
  name: "BatchProcessingResult",
  category: "api_response",
  sourcePaths: ["backend/src/modules/case-filing-ai/services/uploadBatch.service.js"],
  description: "POST /process-batch and GET /batches/:id/results response body.",
  schema: {
    batchId: "string",
    caseSnapshot: "CaseStateSnapshotModel",
    documents: "DocumentProcessingOutput[]",
    tasks: "array (aggregated)",
    deadlines: "array (aggregated)",
    humanReviewItems: "array (aggregated)",
    partRule: "PartRuleStoredRecord | null"
  }
});

addModel({
  id: "BatchStatus",
  name: "BatchStatus",
  category: "api_response",
  sourcePaths: ["backend/src/modules/case-filing-ai/services/uploadBatch.service.js"],
  description: "GET /batches/:id/status response body.",
  schema: {
    batchId: "string",
    status: "pending | processing | completed",
    currentStep: "string",
    currentDocument: "string | null",
    processedCount: "number",
    totalCount: "number"
  }
});

addModel({
  id: "RuleTextExtractResponse",
  name: "RuleTextExtractResponse",
  category: "api_response",
  sourcePaths: [
    "backend/src/modules/case-filing-ai/services/ruleText.service.js",
    "backend/src/modules/case-filing-ai/routes/caseFiling.routes.js"
  ],
  description: "POST /extract-rule-text response body.",
  schema: {
    text: "string",
    fileKind: "string",
    extractionQuality: "ExtractionQuality",
    originalName: "string"
  }
});

// --- Example JSON files (instances, also listed) ---
const exampleJsonPaths = [
  "data/case-filing-ai/examples/case.json",
  "data/case-filing-ai/examples/case-snapshot.json",
  "work-log/handoffs/001_2026-05-23_starter_case-filing-ai-updated/examples/local-json/case.json",
  "work-log/handoffs/001_2026-05-23_starter_case-filing-ai-updated/examples/local-json/case-snapshot.json",
  "data/case-filing-ai/batches/batch-001/case-snapshot.json",
  "data/case-filing-ai/batches/batch-002/case-snapshot.json",
  "data/case-filing-ai/batches/batch-002/outputs/doc-002.json"
];

models.exampleInstances = {};
for (const rel of exampleJsonPaths) {
  const data = await tryReadJson(rel);
  if (data) {
    models.exampleInstances[relative(ROOT, rel)] = data;
  }
}

// Module eval datasets (health-check fixtures, not domain models)
models.evalDatasets = {
  description: "Per-module eval fixture files (API health shape tests, not case domain models).",
  paths: [
    "backend/src/modules/_reference/evals/datasets/example.cases.json",
    "backend/src/modules/case-filing-ai/evals/datasets/example.cases.json",
    "backend/src/modules/case-workflow/evals/datasets/example.cases.json",
    "backend/src/modules/court-rules/evals/datasets/example.cases.json",
    "backend/src/modules/filing-pipeline/evals/datasets/example.cases.json",
    "backend/src/modules/filing-text-vault/evals/datasets/example.cases.json",
    "backend/src/modules/human-review/evals/datasets/example.cases.json",
    "backend/src/modules/task-docketing/evals/datasets/example.cases.json"
  ],
  sharedShape: await tryReadJson("backend/src/modules/task-docketing/evals/datasets/example.cases.json")
};

  return models;
}

/**
 * Model condenser: writes models/consolidated-models.json and returns a summary.
 * @param {{ repoRoot: string, modelsDir: string, consolidatedFileName?: string, writeFile?: boolean, includePayload?: boolean }} options
 */
export async function condenseModels({
  repoRoot,
  modelsDir,
  consolidatedFileName = "consolidated-models.json",
  writeFile: shouldWrite = true,
  includePayload = false
}) {
  const consolidated = await buildConsolidatedModels({ repoRoot });
  const outputPath = join(modelsDir, consolidatedFileName);

  if (shouldWrite) {
    await mkdir(modelsDir, { recursive: true });
    const jsonText = `${JSON.stringify(consolidated, null, 2)}\n`;
    await writeFile(outputPath, jsonText, "utf8");
    const { writeConsolidatedExport } = await import(
      "../../../shared/utils/consolidatedExport.js"
    );
    await writeConsolidatedExport(repoRoot, consolidatedFileName, jsonText);
  }

  const exampleInstanceCount = Object.keys(consolidated.exampleInstances ?? {}).length;

  return {
    status: "condensed",
    outputPath,
    outputRelativePath: relative(repoRoot, outputPath),
    modelCount: consolidated.inventory.length,
    exampleInstanceCount,
    generatedAt: consolidated.meta.generatedAt,
    inventory: consolidated.inventory,
    ...(includePayload ? { consolidated } : {})
  };
}

export async function readConsolidatedModels({ modelsDir, consolidatedFileName = "consolidated-models.json" }) {
  const outputPath = join(modelsDir, consolidatedFileName);
  const raw = await readFile(outputPath, "utf8");
  return JSON.parse(raw);
}
