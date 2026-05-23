import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, access, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { createTestApp } from "../../../../shared/testing/create-test-app.js";
import { createLocalJsonStore } from "../../services/localJsonStore.service.js";
import { getModuleConfig } from "../../config/index.js";

test("case data API inventory, export, and delete", async () => {
  const batchRoot = await mkdtemp(join(tmpdir(), "case-data-batch-"));
  const exportRoot = await mkdtemp(join(tmpdir(), "case-data-export-"));
  const config = getModuleConfig();

  const store = createLocalJsonStore({ batchRootDir: batchRoot });
  const batchId = "batch-case-data";
  await store.createBatch(batchId);
  await store.savePartRule(batchId, "Part rule text");
  await store.saveUpload(batchId, "doc-001.pdf", Buffer.from("pdf"));
  await store.saveDocumentOutput(batchId, "doc-001", {
    docKey: "doc-001",
    docIndex: 1,
    tasks: []
  });
  await store.saveEvalReport(batchId, "doc_001", {
    evalId: "doc_001",
    batchId,
    caseId: "case_001",
    status: "pass",
    type: "document",
    scores: {},
    criticalFailures: [],
    fieldResults: [],
    notes: []
  });

  process.env.CASE_FILING_BATCH_DIR = batchRoot;
  process.env.CASE_EXPORT_ROOT_DIR = exportRoot;
  process.env.GOLDEN_DATASET_DIR = config.goldenDatasetDir;

  const { register } = await import("../../index.js");
  const app = createTestApp(register);
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const invRes = await fetch(`http://127.0.0.1:${port}/api/case-filing-ai/cases/case_001`);
    assert.equal(invRes.status, 200);
    const inventory = await invRes.json();
    assert.ok(inventory.matchedBatchIds.includes(batchId));

    const exportRes = await fetch(
      `http://127.0.0.1:${port}/api/case-filing-ai/cases/case_001/export`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exportName: "case-001-test-export", batchIds: [batchId] })
      }
    );
    assert.equal(exportRes.status, 201);
    const exported = await exportRes.json();
    await access(join(exportRoot, "case-001-test-export", "batches", batchId, "uploads", "doc-001.pdf"));

    const dryRes = await fetch(`http://127.0.0.1:${port}/api/case-filing-ai/cases/case_001`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dryRun: true, batchIds: [batchId] })
    });
    assert.equal(dryRes.status, 200);
    const dry = await dryRes.json();
    assert.equal(dry.deleted, false);

    const delRes = await fetch(`http://127.0.0.1:${port}/api/case-filing-ai/cases/case_001`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true, batchIds: [batchId] })
    });
    assert.equal(delRes.status, 200);
    const deleted = await delRes.json();
    assert.equal(deleted.deleted, true);

    try {
      await access(join(batchRoot, batchId));
      assert.fail("batch folder should be deleted");
    } catch (error) {
      assert.equal(error.code, "ENOENT");
    }

    const manifest = JSON.parse(
      await readFile(join(exportRoot, "case-001-test-export", "manifest.json"), "utf8")
    );
    assert.equal(manifest.exportType, "case_full");
  } finally {
    server.close();
    delete process.env.CASE_FILING_BATCH_DIR;
    delete process.env.CASE_EXPORT_ROOT_DIR;
    delete process.env.GOLDEN_DATASET_DIR;
    await rm(batchRoot, { recursive: true, force: true });
    await rm(exportRoot, { recursive: true, force: true });
  }
});
