import { access, readFile, readdir, stat } from "fs/promises";
import { join } from "path";
import { AppError } from "../../../shared/http/errors.js";
import {
  COMING_SOON_CASES,
  DEMO_CASES,
  getDemoCase
} from "../config/demoCaseRegistry.js";

const DEMO_GENERATED_AT = "2026-05-24T18:41:29.674Z";

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

function docKeyFromIndex(docIndex) {
  return `doc-${padDocNo(docIndex)}`;
}

function buildDocumentFilename(doc) {
  if (doc.syntheticFileBase) {
    return `${doc.syntheticFileBase}.pdf`;
  }
  const type = doc.expectedDocumentType || doc.documentType || doc.docKey || `doc_${padDocNo(doc.docIndex)}`;
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

function publicDocumentFromGolden(doc, sourceAvailable, caseId) {
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
        ? `/api/case-filing-demo/cases/${caseId}/documents/${doc.docKey}/source`
        : null,
      status: sourceAvailable ? "viewable" : "pdf_not_imported_yet"
    }
  };
}

function publicDocumentFromImport(doc, sourceAvailable, caseId) {
  const docIndex = doc.docNo ?? doc.docIndex;
  const docKey = docKeyFromIndex(docIndex);
  return {
    docIndex,
    docKey,
    title: doc.title,
    documentType: doc.documentType,
    filingDate: doc.filedDate ?? null,
    receivedDate: null,
    nyscefDocNo: docIndex,
    pageCount: null,
    expectedExtractionQuality: null,
    expectedConfirmedFacts: [],
    expectedTasks: doc.expectedTasks ?? [],
    expectedDeadlines: doc.expectedDeadlines ?? [],
    expectedHumanReviewItems: [],
    syntheticDataNotice:
      "Synthetic import package — golden expected outputs not yet authored for this case.",
    source: {
      filename: buildDocumentFilename(doc),
      available: sourceAvailable,
      url: sourceAvailable
        ? `/api/case-filing-demo/cases/${caseId}/documents/${docKey}/source`
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

function buildAuditReplay(documents, batchId, generatedAt = DEMO_GENERATED_AT) {
  const entries = [];
  let offsetMs = 0;
  for (const doc of documents) {
    for (const [event, message] of AUDIT_STAGES) {
      const timestamp = new Date(Date.parse(generatedAt) + offsetMs).toISOString();
      entries.push({
        timestamp,
        batchId,
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

async function resolveImportPackageDir(repoRoot, caseConfig) {
  const importsRoot = join(repoRoot, "file-exchange/imports");
  const candidates = [];

  if (caseConfig.importStamp) {
    for (const name of caseConfig.importPackageNames ?? []) {
      candidates.push(join(importsRoot, caseConfig.importStamp, name));
    }
  }

  for (const name of caseConfig.importPackageNames ?? []) {
    candidates.push(join(importsRoot, name));
  }

  try {
    const stamps = await readdir(importsRoot, { withFileTypes: true });
    for (const entry of stamps) {
      if (!entry.isDirectory()) continue;
      for (const name of caseConfig.importPackageNames ?? []) {
        candidates.push(join(importsRoot, entry.name, name));
      }
    }
  } catch {
    /* optional */
  }

  for (const candidate of candidates) {
    if (await exists(join(candidate, "manifest.json")) || (await exists(candidate))) {
      return candidate;
    }
  }

  return candidates[0] ?? null;
}

async function buildSourceIndexForPackage(importDir) {
  const pdfs = (await walkFiles(importDir)).filter((file) => file.toLowerCase().endsWith(".pdf"));
  const byDocKey = new Map();
  for (const pdf of pdfs) {
    const filename = pdf.split("/").pop();
    const match = filename.match(/doc[_-](\d{3})/i);
    const docNo = match?.[1];
    if (docNo) {
      byDocKey.set(docKeyFromIndex(Number(docNo)), { path: pdf, filename });
    }
  }
  return byDocKey;
}

export function createCaseFilingDemoService({
  repoRoot,
  createEvalRunnerForCase,
  cases = DEMO_CASES
}) {
  function fixtureDirFor(caseConfig) {
    return join(repoRoot, ...caseConfig.fixtureDirParts);
  }

  async function loadCachedManifest(caseConfig) {
    const goldenDatasetDir = join(repoRoot, "evals/golden", caseConfig.goldenCaseId);
    return readJson(join(goldenDatasetDir, `${caseConfig.goldenCaseId}.golden-dataset.json`));
  }

  async function loadFixtureOutputs(caseConfig) {
    const outputsDir = join(fixtureDirFor(caseConfig), "outputs");
    const files = (await readdir(outputsDir)).filter((file) => file.endsWith(".json")).sort();
    const outputs = [];
    for (const file of files) {
      outputs.push(await readJson(join(outputsDir, file)));
    }
    return outputs;
  }

  async function loadCaseSnapshot(caseConfig) {
    return readJson(join(fixtureDirFor(caseConfig), "case-snapshot.json"));
  }

  async function assertKnownCase(caseId) {
    if (getDemoCase(caseId)) return getDemoCase(caseId);
    const comingSoon = COMING_SOON_CASES.find((entry) => entry.id === caseId);
    if (comingSoon) {
      throw new AppError(`${comingSoon.label} is coming soon. Synthetic files have not been added yet.`, 404);
    }
    throw new AppError(`Unknown demo case: ${caseId}`, 404);
  }

  async function buildCachedCaseSummary(caseConfig) {
    const manifest = await loadCachedManifest(caseConfig);
    const identity = manifest.caseIdentity ?? {};
    const importDir = await resolveImportPackageDir(repoRoot, caseConfig);
    const sourceMap = importDir ? await buildSourceIndexForPackage(importDir) : new Map();
    const docs = manifest.documentExpectedOutputs ?? [];

    const descriptions = {
      case_001_rule_authority_v002:
        "Synthetic Queens med-mal (Kerrigan part), 14 filings, rule-authority golden v002, cached fixture replay.",
      case_002_queens_catapano_fox_v002:
        "Synthetic Queens med-mal (Catapano-Fox part), 21 filings, DeepSeek V4 golden authoring, cached fixture replay."
    };

    return {
      id: caseConfig.id,
      label: caseConfig.label,
      title: identity.caseName,
      matterType: identity.caseType,
      jurisdiction: identity.court,
      county: identity.county,
      status: "available",
      documentCount: docs.length,
      sourceDocumentCount: docs.filter((doc) => sourceMap.has(doc.docKey)).length,
      sourceDocumentsAvailable: docs.every((doc) => sourceMap.has(doc.docKey)),
      cachedBundleAvailable: await exists(fixtureDirFor(caseConfig)),
      goldenCaseId: caseConfig.goldenCaseId,
      importStamp: caseConfig.importStamp ?? null,
      generatedAt: manifest.meta?.generatedAt ?? DEMO_GENERATED_AT,
      syntheticDataNotice: manifest.meta?.syntheticDataNotice ?? identity.syntheticNotice,
      description:
        descriptions[caseConfig.id] ??
        "Synthetic filing sequence with golden eval fixtures and cached orchestration replay."
    };
  }

  async function buildImportCaseSummary(caseConfig) {
    const importDir = await resolveImportPackageDir(repoRoot, caseConfig);
    if (!importDir) {
      throw new AppError(`Import package not found for ${caseConfig.id}`, 404);
    }

    const manifest = await readJson(join(importDir, caseConfig.manifestFile ?? "manifest.json"));
    const caseBlock = manifest.case ?? {};
    const docs = manifest.documents ?? [];
    const sourceMap = await buildSourceIndexForPackage(importDir);

    const caseName = [
      caseBlock.plaintiff,
      caseBlock.defendants?.length ? `v. ${caseBlock.defendants.join(", ")}` : null
    ]
      .filter(Boolean)
      .join(" ");

    return {
      id: caseConfig.id,
      label: caseConfig.label,
      title: caseName || caseConfig.label,
      matterType: caseBlock.caseType ?? "medical_malpractice",
      jurisdiction: caseBlock.court,
      county: "Queens",
      status: "sources_available",
      documentCount: docs.length,
      sourceDocumentCount: docs.filter((doc) =>
        sourceMap.has(docKeyFromIndex(doc.docNo))
      ).length,
      sourceDocumentsAvailable: docs.every((doc) =>
        sourceMap.has(docKeyFromIndex(doc.docNo))
      ),
      cachedBundleAvailable: false,
      goldenCaseId: null,
      importStamp: caseConfig.importStamp ?? null,
      importPackageId: manifest.packageId ?? caseConfig.importPackageNames?.[0],
      generatedAt: manifest.generatedAt,
      syntheticDataNotice:
        "Synthetic Queens Catapano-Fox med-mal package (21 filings). PDFs and manifest imported; run npm run author:golden to create golden eval fixtures.",
      description:
        "21-document synthetic NYSCEF-style sequence for Justice Catapano-Fox Medical Malpractice Part. View PDFs now; interactive eval replay after golden authoring."
    };
  }

  async function listCases() {
    const summaries = [];
    for (const caseConfig of cases) {
      if (caseConfig.mode === "cached") {
        summaries.push(await buildCachedCaseSummary(caseConfig));
      } else if (caseConfig.mode === "import") {
        summaries.push(await buildImportCaseSummary(caseConfig));
      }
    }

    return {
      available: summaries.filter((entry) => entry.status !== "coming_soon"),
      comingSoon: COMING_SOON_CASES,
      cases: [...summaries, ...COMING_SOON_CASES]
    };
  }

  async function getCaseDetail(caseId) {
    const caseConfig = await assertKnownCase(caseId);

    if (caseConfig.mode === "cached") {
      const manifest = await loadCachedManifest(caseConfig);
      const summary = await buildCachedCaseSummary(caseConfig);
      const importDir = await resolveImportPackageDir(repoRoot, caseConfig);
      const sourceMap = importDir ? await buildSourceIndexForPackage(importDir) : new Map();
      const documents = (manifest.documentExpectedOutputs ?? []).map((doc) =>
        publicDocumentFromGolden(doc, sourceMap.has(doc.docKey), caseId)
      );

      return {
        ...summary,
        caseIdentity: manifest.caseIdentity,
        expectedProcessingRule: manifest.expectedProcessingRule,
        documents,
        demoDisclosure:
          "Cached synthetic golden fixtures and fixture replay. Source PDFs stream from file-exchange imports when present."
      };
    }

    const importDir = await resolveImportPackageDir(repoRoot, caseConfig);
    const manifest = await readJson(join(importDir, caseConfig.manifestFile ?? "manifest.json"));
    const summary = await buildImportCaseSummary(caseConfig);
    const sourceMap = await buildSourceIndexForPackage(importDir);
    const documents = (manifest.documents ?? []).map((doc) =>
      publicDocumentFromImport(doc, sourceMap.has(docKeyFromIndex(doc.docNo)), caseId)
    );

    return {
      ...summary,
      caseIdentity: {
        caseId: caseConfig.legalCaseId,
        indexNumber: manifest.case?.indexNumber,
        court: manifest.case?.court,
        caseType: manifest.case?.caseType,
        judgeName: manifest.case?.judgeName,
        partName: manifest.case?.partName,
        synthetic: true
      },
      documents,
      demoDisclosure:
        "Import-only demo mode: all PDFs are viewable. Golden expected outputs and interactive replay will appear after golden authoring and promote.",
      nextSteps: [
        `npm run author:golden -- --case ${caseConfig.id} --import-stamp ${caseConfig.importStamp} --legal-case-id ${caseConfig.legalCaseId}`,
        `npm run promote:golden -- --case ${caseConfig.id} --version <goldenDatasetVersion> --confirm`
      ]
    };
  }

  async function getCachedBundle(caseId) {
    const caseConfig = await assertKnownCase(caseId);

    if (caseConfig.mode !== "cached") {
      throw new AppError(
        "Cached demo bundle is not available for this case yet. PDFs and manifest are imported; run golden authoring to enable eval replay.",
        409
      );
    }

    const evalRunner = createEvalRunnerForCase(caseConfig.goldenCaseId);
    const demoBatchId = caseConfig.demoBatchId ?? `demo-${caseConfig.id}`;
    const goldenDatasetDir = join(repoRoot, "evals/golden", caseConfig.goldenCaseId);
    const snapshotCheckpoints =
      caseConfig.snapshotCheckpoints ?? [1, 2, 4, 8, 12, 14];

    const [detail, outputs, snapshot] = await Promise.all([
      getCaseDetail(caseId),
      loadFixtureOutputs(caseConfig),
      loadCaseSnapshot(caseConfig)
    ]);

    const reports = [];
    for (const output of outputs) {
      reports.push(
        await evalRunner.evalDocument({
          batchId: demoBatchId,
          docIndex: output.docIndex,
          docKey: output.docKey,
          documentResult: output,
          snapshot: {},
          allDocumentOutputs: [output]
        })
      );
    }

    for (const docIndex of snapshotCheckpoints) {
      const checkpoint = await readJson(
        join(goldenDatasetDir, `after_doc_${padDocNo(docIndex)}.expected.json`)
      );
      reports.push(
        await evalRunner.evalSnapshot({
          batchId: demoBatchId,
          docIndex,
          snapshot: checkpoint,
          allDocumentOutputs: outputs
        })
      );
    }

    return {
      batchId: demoBatchId,
      generatedAt: detail.generatedAt ?? DEMO_GENERATED_AT,
      replay: true,
      replayLabel: "Golden authoring fixture replay (DeepSeek V4 ground truth)",
      case: detail,
      results: {
        batchId: demoBatchId,
        batchStatus: "completed",
        processedCount: outputs.length,
        totalCount: outputs.length,
        failedDocuments: [],
        caseSnapshot: snapshot,
        documents: outputs.map(summarizeOutput),
        tasks: snapshot.openTasks ?? [],
        deadlines: snapshot.deadlines ?? [],
        humanReviewItems:
          snapshot.unresolvedHumanReviewItemsExpected ??
          snapshot.humanReviewItems ??
          [],
        partRule: { source: "demo fixture replay", hasText: false }
      },
      evals: {
        batchId: demoBatchId,
        summary: countByStatus(reports),
        reports
      },
      audit: {
        batchId: demoBatchId,
        generatedFrom: "committed fixture replay",
        entries: buildAuditReplay(outputs, demoBatchId, detail.generatedAt ?? DEMO_GENERATED_AT)
      },
      manifest: {
        lineage: {
          goldenCaseId: caseConfig.goldenCaseId,
          fixtureDir: caseConfig.fixtureDirParts.join("/"),
          goldenDatasetDir: `evals/golden/${caseConfig.goldenCaseId}`,
          sourcePdfStatus: detail.sourceDocumentsAvailable ? "available" : "not_imported",
          authorModel: "deepseek/deepseek-v4-pro"
        },
        integrity: {
          note:
            "Runtime batch logs are not committed. This bundle recomputes evals from committed golden + authoring fixtures and replays deterministic audit events."
        }
      }
    };
  }

  async function getDocumentSource(caseId, docKey) {
    await assertKnownCase(caseId);
    if (!/^doc-\d{3}$/.test(docKey)) {
      throw new AppError(`Invalid document id: ${docKey}`, 400);
    }

    const caseConfig = getDemoCase(caseId);
    const importDir = await resolveImportPackageDir(repoRoot, caseConfig);
    if (!importDir) return null;

    const source = (await buildSourceIndexForPackage(importDir)).get(docKey);
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
