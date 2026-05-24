import { access, readFile, readdir, stat } from "fs/promises";
import { join } from "path";
import { AppError } from "../../../shared/http/errors.js";

const DEMO_BATCH_ID = "demo-case-001-cached";
const DEMO_GENERATED_AT = "2026-05-24T13:37:21.793Z";

const COMING_SOON_CASES = [
  {
    id: "case_002",
    label: "Case 002",
    title: "Commercial Division Contract Dispute",
    matterType: "commercial_litigation",
    jurisdiction: "New York Supreme Court",
    status: "coming_soon",
    documentCount: 0,
    description: "Planned synthetic case for contract motion practice and discovery deadlines."
  },
  {
    id: "case_003",
    label: "Case 003",
    title: "Labor and Employment Action",
    matterType: "employment_litigation",
    jurisdiction: "New York Supreme Court",
    status: "coming_soon",
    documentCount: 0,
    description: "Planned synthetic case for employment pleadings, notices, and compliance tasks."
  },
  {
    id: "case_004",
    label: "Case 004",
    title: "Premises Liability Discovery Track",
    matterType: "personal_injury",
    jurisdiction: "New York Supreme Court",
    status: "coming_soon",
    documentCount: 0,
    description: "Planned synthetic case for EBT scheduling, expert discovery, and NOI tracking."
  }
];

const AUDIT_STAGES = [
  ["upload_received", "Source filing registered in the demo corpus."],
  ["parse_completed", "Document text and extraction quality metadata prepared for review."],
  ["rules_matched", "Court-rule and case-order authority candidates ranked."],
  ["prompt_completed", "Master prompt output generated for this filing."],
  ["snapshot_merged", "Rolling case snapshot updated after document-level review."],
  ["eval_scored", "Golden eval report generated against the synthetic expected output."]
];

function padDocNo(value) {
  return String(value).padStart(3, "0");
}

function normalizeCaseStatus(caseId) {
  if (caseId === "case_001_rule_authority_v002") return "available";
  return "coming_soon";
}

function buildDocumentFilename(doc) {
  const type = doc.expectedDocumentType || doc.docKey || `doc_${padDocNo(doc.docIndex)}`;
  return `doc_${padDocNo(doc.docIndex)}_${type}.pdf`;
}

function countByStatus(reports) {
  return reports.reduce(
    (summary, report) => {
      if (report.status === "pass") summary.pass += 1;
      else if (report.status === "partial") summary.partial += 1;
      else summary.fail += 1;
      summary.criticalFailureCount += report.criticalFailures?.length ?? 0;
      return summary;
    },
    { pass: 0, partial: 0, fail: 0, criticalFailureCount: 0 }
  );
}

function publicDocument(doc, sourceAvailable) {
  return {
    docIndex: doc.docIndex,
    docKey: doc.docKey,
    title: doc.expectedTitle,
    documentType: doc.expectedDocumentType,
    filingDate: doc.expectedFilingDate,
    receivedDate: doc.expectedReceivedDate,
    nyscefDocNo: doc.expectedNyscefDocNo,
    pageCount: doc.expectedPageCount,
    expectedExtractionQuality: doc.expectedExtractionQuality,
    expectedConfirmedFacts: doc.expectedConfirmedFacts ?? [],
    expectedTasks: doc.expectedTasks ?? [],
    expectedDeadlines: doc.expectedDeadlines ?? [],
    expectedHumanReviewItems: doc.expectedHumanReviewItems ?? [],
    syntheticDataNotice: doc.syntheticDataNotice,
    source: {
      filename: buildDocumentFilename(doc),
      available: sourceAvailable,
      url: sourceAvailable
        ? `/api/case-filing-demo/cases/case_001_rule_authority_v002/documents/${doc.docKey}/source`
        : null,
      status: sourceAvailable ? "viewable" : "pdf_not_imported_yet"
    }
  };
}

function summarizeOutput(doc) {
  return {
    docIndex: doc.docIndex,
    docKey: doc.docKey,
    title: doc.documentMetadata?.title ?? doc.originalName ?? doc.docKey,
    docketEntry: doc.docketEntry,
    extractionQuality: doc.extractionQuality ?? doc.documentMetadata?.extractionQuality,
    tasks: doc.tasks ?? [],
    deadlines: doc.deadlines ?? [],
    humanReviewItems: doc.humanReviewItems ?? [],
    ruleSourcesChecked: doc.ruleSourcesChecked ?? [],
    ruleSourcesApplied: doc.ruleSourcesApplied ?? [],
    rankedRules: doc.rankedRules ?? [],
    pipelineVersions: doc.pipelineVersions,
    runMetadata: doc.runMetadata
  };
}

function buildAuditReplay(documents) {
  const entries = [];
  let offsetMs = 0;
  for (const doc of documents) {
    for (const [event, message] of AUDIT_STAGES) {
      const timestamp = new Date(Date.parse(DEMO_GENERATED_AT) + offsetMs).toISOString();
      entries.push({
        timestamp,
        batchId: DEMO_BATCH_ID,
        docKey: doc.docKey,
        docIndex: doc.docIndex,
        event,
        level: "info",
        message,
        replay: true,
        source: "committed fixture replay"
      });
      offsetMs += 90_000;
    }
  }
  return entries;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(root) {
  const files = [];
  if (!(await exists(root))) return files;
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

export function createCaseFilingDemoService({
  repoRoot,
  goldenCaseId,
  goldenDatasetDir,
  fixtureDir,
  evalRunner
}) {
  const importsRoot = join(repoRoot, "file-exchange/imports");

  async function loadManifest() {
    return readJson(join(goldenDatasetDir, `${goldenCaseId}.golden-dataset.json`));
  }

  async function loadFixtureOutputs() {
    const outputsDir = join(fixtureDir, "outputs");
    const files = (await readdir(outputsDir)).filter((file) => file.endsWith(".json")).sort();
    const outputs = [];
    for (const file of files) {
      outputs.push(await readJson(join(outputsDir, file)));
    }
    return outputs;
  }

  async function loadCaseSnapshot() {
    return readJson(join(fixtureDir, "case-snapshot.json"));
  }

  async function buildSourceIndex() {
    const pdfs = (await walkFiles(importsRoot)).filter((file) => file.toLowerCase().endsWith(".pdf"));
    const byDocKey = new Map();
    for (const pdf of pdfs) {
      const filename = pdf.split("/").pop();
      const match = filename.match(/doc[_-](\d{3})|^(\d{3})-/i);
      const docNo = match?.[1] ?? match?.[2];
      if (docNo) byDocKey.set(`doc-${docNo}`, { path: pdf, filename });
    }
    return byDocKey;
  }

  async function sourceIndex() {
    return buildSourceIndex();
  }

  async function assertAvailableCase(caseId) {
    if (caseId !== goldenCaseId) {
      const comingSoon = COMING_SOON_CASES.find((entry) => entry.id === caseId);
      if (comingSoon) {
        throw new AppError(`${comingSoon.label} is coming soon. Synthetic files have not been added yet.`, 404);
      }
      throw new AppError(`Unknown demo case: ${caseId}`, 404);
    }
  }

  async function buildAvailableCaseSummary() {
    const manifest = await loadManifest();
    const identity = manifest.caseIdentity ?? {};
    const sourceMap = await sourceIndex();
    const docs = manifest.documentExpectedOutputs ?? [];
    const sourceCount = docs.filter((doc) => sourceMap.has(doc.docKey)).length;
    return {
      id: goldenCaseId,
      label: "Case 001",
      title: identity.caseName,
      matterType: identity.caseType,
      jurisdiction: identity.court,
      county: identity.county,
      status: normalizeCaseStatus(goldenCaseId),
      documentCount: docs.length,
      sourceDocumentCount: sourceCount,
      sourceDocumentsAvailable: sourceCount === docs.length,
      cachedBundleAvailable: await exists(fixtureDir),
      goldenCaseId,
      generatedAt: manifest.meta?.generatedAt,
      syntheticDataNotice: manifest.meta?.syntheticDataNotice ?? identity.syntheticNotice,
      description:
        "Synthetic Queens medical malpractice filing sequence with 14 NYSCEF-style documents, rule-authority expectations, and cached output fixtures."
    };
  }

  async function listCases() {
    return {
      available: [await buildAvailableCaseSummary()],
      comingSoon: COMING_SOON_CASES,
      cases: [await buildAvailableCaseSummary(), ...COMING_SOON_CASES]
    };
  }

  async function getCaseDetail(caseId) {
    await assertAvailableCase(caseId);
    const manifest = await loadManifest();
    const summary = await buildAvailableCaseSummary();
    const sourceMap = await sourceIndex();
    const documents = (manifest.documentExpectedOutputs ?? []).map((doc) =>
      publicDocument(doc, sourceMap.has(doc.docKey))
    );

    return {
      ...summary,
      caseIdentity: manifest.caseIdentity,
      expectedProcessingRule: manifest.expectedProcessingRule,
      documents,
      demoDisclosure:
        "This demo uses committed synthetic golden fixtures and cached outputs. Source PDFs become viewable after the synthetic PDF bundle is imported into file-exchange/imports."
    };
  }

  async function getCachedBundle(caseId) {
    await assertAvailableCase(caseId);
    const [detail, outputs, snapshot] = await Promise.all([
      getCaseDetail(caseId),
      loadFixtureOutputs(),
      loadCaseSnapshot()
    ]);
    const reports = [];
    for (const output of outputs) {
      reports.push(
        await evalRunner.evalDocument({
          batchId: DEMO_BATCH_ID,
          docIndex: output.docIndex,
          docKey: output.docKey,
          documentResult: output,
          snapshot: {},
          allDocumentOutputs: [output]
        })
      );
    }
    for (const docIndex of [1, 2, 4, 8, 12, 14]) {
      const checkpoint = await readJson(
        join(goldenDatasetDir, `after_doc_${padDocNo(docIndex)}.expected.json`)
      );
      reports.push(
        await evalRunner.evalSnapshot({
          batchId: DEMO_BATCH_ID,
          docIndex,
          snapshot: checkpoint,
          allDocumentOutputs: outputs
        })
      );
    }

    return {
      batchId: DEMO_BATCH_ID,
      generatedAt: DEMO_GENERATED_AT,
      replay: true,
      replayLabel: "Previously generated fixture replay",
      case: detail,
      results: {
        batchId: DEMO_BATCH_ID,
        batchStatus: "completed",
        processedCount: outputs.length,
        totalCount: outputs.length,
        failedDocuments: [],
        caseSnapshot: snapshot,
        documents: outputs.map(summarizeOutput),
        tasks: snapshot.openTasks ?? [],
        deadlines: snapshot.deadlines ?? [],
        humanReviewItems: snapshot.unresolvedHumanReviewItemsExpected ?? [],
        partRule: { source: "demo rule-authority fixture", hasText: false }
      },
      evals: {
        batchId: DEMO_BATCH_ID,
        summary: countByStatus(reports),
        reports
      },
      audit: {
        batchId: DEMO_BATCH_ID,
        generatedFrom: "committed fixture replay",
        entries: buildAuditReplay(outputs)
      },
      manifest: {
        lineage: {
          goldenCaseId,
          fixtureDir: ["backend/src", "modules", "case-filing-ai", "tests/fixtures/rule-authority-v002"].join("/"),
          goldenDatasetDir: `evals/golden/${goldenCaseId}`,
          sourcePdfStatus: detail.sourceDocumentsAvailable ? "available" : "not_imported"
        },
        integrity: {
          note:
            "Runtime batch-002 logs are not committed in this repo. This bundle recomputes evals from committed fixtures and replays deterministic audit events for presentation."
        }
      }
    };
  }

  async function getDocumentSource(caseId, docKey) {
    await assertAvailableCase(caseId);
    if (!/^doc-\d{3}$/.test(docKey)) {
      throw new AppError(`Invalid document id: ${docKey}`, 400);
    }
    const source = (await sourceIndex()).get(docKey);
    if (!source) return null;
    const info = await stat(source.path);
    if (!info.isFile()) return null;
    return source;
  }

  return {
    listCases,
    getCaseDetail,
    getCachedBundle,
    getDocumentSource
  };
}
