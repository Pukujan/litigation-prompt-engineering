import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { createTestApp } from "../../../../shared/testing/create-test-app.js";
import { createLocalJsonStore } from "../../services/localJsonStore.service.js";

test("GET batch package download returns zip", async () => {
  const batchRoot = await mkdtemp(join(tmpdir(), "pkg-batch-"));
  const exportRoot = await mkdtemp(join(tmpdir(), "pkg-export-"));
  const store = createLocalJsonStore({ batchRootDir: batchRoot });
  const batchId = "batch-pkg-001";
  await store.createBatch(batchId);
  await store.saveUpload(batchId, "01_test.pdf", Buffer.from("%PDF-1.4"));
  await mkdir(join(batchRoot, batchId, "outputs"), { recursive: true });
  await writeFile(
    join(batchRoot, batchId, "outputs", "doc-001.json"),
    JSON.stringify({
      docKey: "doc-001",
      docIndex: 1,
      status: "completed",
      rankedRules: [],
      ruleSourcesChecked: []
    }),
    "utf8"
  );
  await store.appendProcessingLog(batchId, {
    step: "batch_completed",
    batchStatus: "completed",
    processedCount: 1,
    totalCount: 1
  });

  process.env.CASE_FILING_BATCH_DIR = batchRoot;
  process.env.CASE_EXPORT_ROOT_DIR = exportRoot;
  const { register } = await import("../../index.js");
  const app = createTestApp(register);
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const buildRes = await fetch(
      `http://127.0.0.1:${port}/api/case-filing-ai/batches/${batchId}/package`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }
    );
    assert.equal(buildRes.status, 201);

    const dlRes = await fetch(
      `http://127.0.0.1:${port}/api/case-filing-ai/batches/${batchId}/package/download`
    );
    assert.equal(dlRes.status, 200);
    assert.match(dlRes.headers.get("content-type") || "", /zip/);
    const buf = Buffer.from(await dlRes.arrayBuffer());
    assert.ok(buf.length > 100);
    assert.equal(buf[0], 0x50);
    assert.equal(buf[1], 0x4b);
  } finally {
    server.close();
    delete process.env.CASE_FILING_BATCH_DIR;
    delete process.env.CASE_EXPORT_ROOT_DIR;
    await rm(batchRoot, { recursive: true, force: true });
    await rm(exportRoot, { recursive: true, force: true });
  }
});
