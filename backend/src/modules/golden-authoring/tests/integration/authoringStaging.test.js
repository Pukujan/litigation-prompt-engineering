import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { createStagingStoreService } from "../../services/stagingStore.service.js";
import { createGoldenExporterService } from "../../services/goldenExporter.service.js";

test("goldenExporter writes staging bundle files", async () => {
  const root = await mkdtemp(join(tmpdir(), "golden-export-"));
  const stagingStore = createStagingStoreService({
    repoRoot: root,
    stagingRoot: join(root, "golden-staging"),
    goldenRoot: join(root, "golden")
  });
  const exporter = createGoldenExporterService({ stagingStore });

  const caseId = "case_test_rule_authority_v001";
  const version = "synthetic_case_test_rule_authority_v001";

  const doc = {
    docIndex: 1,
    docKey: "doc-001",
    originalName: "001.pdf",
    status: "completed",
    ruleSourcesChecked: ["rule_a"],
    documentMetadata: { title: "Doc 1", pageCount: 2 },
    extractionQuality: {},
    docketEntry: { filingType: "MOTION", nyscefDocNo: 1 },
    parties: [],
    tasks: [],
    deadlines: [],
    humanReviewItems: [],
    caseUpdates: {}
  };

  const result = await exporter.exportToStaging({
    caseId,
    version,
    legalCaseId: "synthetic_case_test",
    caseIdentity: { caseId: "synthetic_case_test", county: "Queens" },
    documentOutputs: [doc],
    snapshotsByCheckpoint: {
      1: { currentPhase: "START", confirmedFacts: [], openTasks: [], deadlines: [] }
    },
    pipelineVersions: { parser: "p1", masterPrompt: "v1" },
    authoringRun: {
      runId: "run-test",
      batchStatus: "completed",
      authorModel: "test-model"
    },
    importStamp: "2026-05-24_testZ"
  });

  const expectedRaw = await readFile(join(result.outDir, "doc_001.expected.json"), "utf8");
  const expected = JSON.parse(expectedRaw);
  assert.equal(expected.expectedDocumentType, "MOTION");

  const runRaw = await readFile(join(result.outDir, "authoring_run.json"), "utf8");
  const run = JSON.parse(runRaw);
  assert.equal(run.runId, "run-test");
});
