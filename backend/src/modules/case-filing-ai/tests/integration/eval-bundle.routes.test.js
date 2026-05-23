import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, access } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { createTestApp } from "../../../../shared/testing/create-test-app.js";
import { createLocalJsonStore } from "../../services/localJsonStore.service.js";
import { createEvalBundleService } from "../../services/evalBundle.service.js";
import { getModuleConfig } from "../../config/index.js";

test("POST /api/case-filing-ai/batches/:batchId/evals/bundle copies reports to repo root folder", async () => {
  const batchRoot = await mkdtemp(join(tmpdir(), "eval-bundle-batch-"));
  const bundleRoot = await mkdtemp(join(tmpdir(), "eval-bundle-out-"));
  const config = getModuleConfig();

  const store = createLocalJsonStore({ batchRootDir: batchRoot });
  const batchId = "batch-bundle-test";
  await store.createBatch(batchId);

  const sampleReport = {
    evalId: "doc_001",
    batchId,
    status: "partial",
    type: "document",
    scores: {},
    criticalFailures: [],
    fieldResults: [],
    notes: []
  };
  await store.saveEvalReport(batchId, "doc_001", sampleReport);
  await store.saveEvalReport(batchId, "after_doc_001", {
    ...sampleReport,
    evalId: "after_doc_001",
    type: "snapshot"
  });

  process.env.CASE_FILING_BATCH_DIR = batchRoot;
  process.env.EVAL_BUNDLE_ROOT_DIR = bundleRoot;

  const { register } = await import("../../index.js");
  const app = createTestApp(register);
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(
      `http://127.0.0.1:${port}/api/case-filing-ai/batches/${batchId}/evals/bundle`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundleName: "my-test-bundle" })
      }
    );
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.bundleId, "my-test-bundle");
    assert.equal(body.totalReportFiles, 2);
    assert.ok(body.batches.some((b) => b.batchId === batchId));

    const manifestPath = join(bundleRoot, "my-test-bundle", "manifest.json");
    await access(manifestPath);
    const copied = join(bundleRoot, "my-test-bundle", "batches", batchId, "doc_001.eval-report.json");
    await access(copied);
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    assert.equal(manifest.batchIds[0], batchId);
  } finally {
    server.close();
    delete process.env.CASE_FILING_BATCH_DIR;
    delete process.env.EVAL_BUNDLE_ROOT_DIR;
    await rm(batchRoot, { recursive: true, force: true });
    await rm(bundleRoot, { recursive: true, force: true });
  }
});

test("POST /api/case-filing-ai/evals/bundle supports multiple batchIds", async () => {
  const batchRoot = await mkdtemp(join(tmpdir(), "eval-bundle-multi-"));
  const bundleRoot = await mkdtemp(join(tmpdir(), "eval-bundle-multi-out-"));
  const store = createLocalJsonStore({ batchRootDir: batchRoot });

  for (const batchId of ["batch-a", "batch-b"]) {
    await store.createBatch(batchId);
    await store.saveEvalReport(batchId, "doc_001", {
      evalId: "doc_001",
      batchId,
      status: "pass",
      type: "document",
      scores: {},
      criticalFailures: [],
      fieldResults: [],
      notes: []
    });
  }

  const evalBundle = createEvalBundleService({
    store,
    bundleRootDir: bundleRoot,
    repoRoot: bundleRoot,
    resolveGoldenDatasetDir: () => join(bundleRoot, "golden-fixture")
  });

  const manifest = await evalBundle.bundleEvals({
    batchIds: ["batch-a", "batch-b"],
    bundleName: "combined"
  });

  assert.equal(manifest.totalReportFiles, 2);
  await access(join(bundleRoot, "combined", "batches", "batch-a", "doc_001.eval-report.json"));
  await access(join(bundleRoot, "combined", "batches", "batch-b", "doc_001.eval-report.json"));

  await rm(batchRoot, { recursive: true, force: true });
  await rm(bundleRoot, { recursive: true, force: true });
});

test("POST /api/case-filing-ai/evals/cases/:goldenCaseId/bundle copies golden and all runs", async () => {
  const batchRoot = await mkdtemp(join(tmpdir(), "case-bundle-batch-"));
  const bundleRoot = await mkdtemp(join(tmpdir(), "case-bundle-out-"));
  const config = getModuleConfig();

  const store = createLocalJsonStore({ batchRootDir: batchRoot });
  for (const batchId of ["batch-a", "batch-b"]) {
    await store.createBatch(batchId);
    await store.saveEvalReport(batchId, "doc_001", {
      evalId: "doc_001",
      batchId,
      caseId: "case_001",
      status: "partial",
      type: "document",
      scores: {},
      criticalFailures: [],
      fieldResults: [],
      notes: []
    });
  }

  process.env.CASE_FILING_BATCH_DIR = batchRoot;
  process.env.EVAL_BUNDLE_ROOT_DIR = bundleRoot;

  const { register } = await import("../../index.js");
  const app = createTestApp(register);
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(
      `http://127.0.0.1:${port}/api/case-filing-ai/evals/cases/case_001/bundle`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundleName: "case-001-test-bundle" })
      }
    );
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.bundleType, "case");
    assert.equal(body.goldenCaseId, "case_001");
    assert.equal(
      body.legalCaseId,
      "case_001_synthetic_maria_demo"
    );
    assert.equal(body.batchIds.length, 2);
    assert.ok(body.goldenFiles.length > 0);

    const goldenExpected = join(
      bundleRoot,
      "case-001-test-bundle",
      "golden",
      "doc_001.expected.json"
    );
    await access(goldenExpected);
    await access(
      join(bundleRoot, "case-001-test-bundle", "runs", "batch-a", "doc_001.eval-report.json")
    );
    await access(
      join(bundleRoot, "case-001-test-bundle", "runs", "batch-b", "doc_001.eval-report.json")
    );

    const manifest = JSON.parse(
      await readFile(join(bundleRoot, "case-001-test-bundle", "manifest.json"), "utf8")
    );
    assert.equal(manifest.bundleType, "case");
    assert.ok(manifest.runs.length === 2);
  } finally {
    server.close();
    delete process.env.CASE_FILING_BATCH_DIR;
    delete process.env.EVAL_BUNDLE_ROOT_DIR;
    await rm(batchRoot, { recursive: true, force: true });
    await rm(bundleRoot, { recursive: true, force: true });
  }
});

test("case bundle discovery excludes batches tagged with a different golden caseId", async () => {
  const batchRoot = await mkdtemp(join(tmpdir(), "case-filter-batch-"));
  const bundleRoot = await mkdtemp(join(tmpdir(), "case-filter-out-"));
  const config = getModuleConfig();

  const store = createLocalJsonStore({ batchRootDir: batchRoot });
  await store.createBatch("batch-case-001");
  await store.createBatch("batch-case-002");
  await store.saveEvalReport("batch-case-001", "doc_001", {
    evalId: "doc_001",
    batchId: "batch-case-001",
    caseId: "case_001",
    status: "pass",
    type: "document",
    scores: {},
    criticalFailures: [],
    fieldResults: [],
    notes: []
  });
  await store.saveEvalReport("batch-case-002", "doc_001", {
    evalId: "doc_001",
    batchId: "batch-case-002",
    caseId: "case_002",
    status: "pass",
    type: "document",
    scores: {},
    criticalFailures: [],
    fieldResults: [],
    notes: []
  });

  process.env.CASE_FILING_BATCH_DIR = batchRoot;
  process.env.EVAL_BUNDLE_ROOT_DIR = bundleRoot;

  const { register } = await import("../../index.js");
  const app = createTestApp(register);
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(
      `http://127.0.0.1:${port}/api/case-filing-ai/evals/cases/case_001/bundle`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundleName: "case-001-filtered" })
      }
    );
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.deepEqual(body.batchIds, ["batch-case-001"]);
    assert.equal(body.runs.length, 1);

    await access(
      join(bundleRoot, "case-001-filtered", "runs", "batch-case-001", "doc_001.eval-report.json")
    );
    try {
      await access(
        join(bundleRoot, "case-001-filtered", "runs", "batch-case-002", "doc_001.eval-report.json")
      );
      assert.fail("batch-case-002 should not be bundled for case_001");
    } catch (error) {
      assert.equal(error.code, "ENOENT");
    }
  } finally {
    server.close();
    delete process.env.CASE_FILING_BATCH_DIR;
    delete process.env.EVAL_BUNDLE_ROOT_DIR;
    await rm(batchRoot, { recursive: true, force: true });
    await rm(bundleRoot, { recursive: true, force: true });
  }
});
