import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "fs/promises";
import { join } from "path";
import { createGoldenDatasetService } from "../../services/goldenDataset.service.js";
import { createEvalRunnerService } from "../../services/evalRunner.service.js";
import { getModuleConfig } from "../../config/index.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const config = getModuleConfig();
const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "../fixtures");

test("evalRunner compares document output against doc_001 golden", async () => {
  const goldenDataset = createGoldenDatasetService({
    goldenDatasetDir: config.goldenDatasetDir,
    caseId: config.goldenCaseId
  });
  const evalRunner = createEvalRunnerService({ goldenDataset });

  const actual = JSON.parse(
    await readFile(
      join(fixturesDir, "batch-002/outputs/doc-001.json"),
      "utf8"
    )
  );

  const report = await evalRunner.evalDocument({
    batchId: "batch-002",
    docIndex: 1,
    docKey: "doc-001",
    documentResult: actual,
    snapshot: {},
    allDocumentOutputs: [actual]
  });

  assert.equal(report.type, "document");
  assert.equal(report.evalId, "doc_001");
  assert.ok(typeof report.scores.documentIdentity === "number");
  assert.ok(Array.isArray(report.criticalFailures));
  assert.ok(["pass", "partial", "fail"].includes(report.status));
});

test("evalRunner runs snapshot checkpoint for doc 1", async () => {
  const goldenDataset = createGoldenDatasetService({
    goldenDatasetDir: config.goldenDatasetDir,
    caseId: config.goldenCaseId
  });
  const evalRunner = createEvalRunnerService({ goldenDataset });

  const snapshot = JSON.parse(
    await readFile(
      join(fixturesDir, "batch-002/case-snapshot.json"),
      "utf8"
    )
  );

  const report = await evalRunner.evalSnapshot({
    batchId: "batch-002",
    docIndex: 1,
    snapshot,
    allDocumentOutputs: []
  });

  assert.equal(report.type, "snapshot");
  assert.equal(report.evalId, "after_doc_001");
  assert.ok(typeof report.scores.snapshot === "number");
});
