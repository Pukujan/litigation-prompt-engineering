import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { createTestApp } from "../../../../shared/testing/create-test-app.js";
import { createLocalJsonStore } from "../../services/localJsonStore.service.js";
import { createGoldenDatasetService } from "../../services/goldenDataset.service.js";
import { createEvalRunnerService } from "../../services/evalRunner.service.js";
import { getModuleConfig } from "../../config/index.js";

test("GET /api/case-filing-ai/batches/:batchId/evals returns saved reports", async () => {
  const batchRoot = await mkdtemp(join(tmpdir(), "eval-batch-"));
  const config = getModuleConfig();
  const store = createLocalJsonStore({ batchRootDir: batchRoot });
  const goldenDataset = createGoldenDatasetService({
    goldenDatasetDir: config.goldenDatasetDir,
    caseId: config.goldenCaseId
  });
  const evalRunner = createEvalRunnerService({ goldenDataset });

  const batchId = "batch-eval-test";
  await store.createBatch(batchId);

  const docOutput = {
    docKey: "doc-001",
    docIndex: 1,
    docketEntry: { filingType: "SUMMONS AND VERIFIED COMPLAINT", filingDate: "2025-05-06", nyscefDocNo: 1 },
    documentMetadata: { pageCount: 7, title: "Summons and Verified Complaint" },
    parties: [],
    tasks: [
      {
        taskType: "VERIFY_SERVICE_FOR_RESPONSE_DEADLINE",
        taskDescription: "Verify service date and service method before calculating any defendant answer deadline.",
        status: "needs_review"
      }
    ],
    deadlines: [],
    humanReviewItems: []
  };

  await store.saveDocumentOutput(batchId, "doc-001", docOutput);
  const snapshot = await store.readCaseSnapshot(batchId);
  const reports = await evalRunner.runAfterDocument({
    batchId,
    docIndex: 1,
    docKey: "doc-001",
    documentResult: docOutput,
    snapshot,
    allDocumentOutputs: [docOutput]
  });
  for (const { evalId, report } of reports) {
    await store.saveEvalReport(batchId, evalId, report);
  }

  process.env.CASE_FILING_BATCH_DIR = batchRoot;
  const { register } = await import("../../index.js");
  const app = createTestApp(register);
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/case-filing-ai/batches/${batchId}/evals`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.batchId, batchId);
    assert.ok(body.reports.length >= 2);
    assert.ok(body.summary.pass + body.summary.partial + body.summary.fail >= 1);
  } finally {
    server.close();
    delete process.env.CASE_FILING_BATCH_DIR;
    await rm(batchRoot, { recursive: true, force: true });
  }
});
