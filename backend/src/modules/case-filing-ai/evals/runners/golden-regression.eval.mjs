/**
 * Offline golden regression — no LLM calls.
 * Compares committed fixtures to evals/golden/case_001 expected JSON.
 *
 * Run: npm run test:evals -- case-filing-ai
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createGoldenDatasetService } from "../../services/goldenDataset.service.js";
import { createEvalRunnerService } from "../../services/evalRunner.service.js";
import { getModuleConfig } from "../../config/index.js";

const config = getModuleConfig();
const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "../../tests/fixtures");

test("golden regression: doc_001 matches fixture output", async () => {
  const goldenDataset = createGoldenDatasetService({
    goldenDatasetDir: config.goldenDatasetDir,
    caseId: config.goldenCaseId
  });
  const evalRunner = createEvalRunnerService({ goldenDataset });

  const actual = JSON.parse(
    await readFile(join(fixturesDir, "batch-002/outputs/doc-001.json"), "utf8")
  );

  const report = await evalRunner.evalDocument({
    batchId: "batch-ci",
    docIndex: 1,
    docKey: "doc-001",
    documentResult: actual,
    snapshot: {},
    allDocumentOutputs: [actual]
  });

  assert.equal(report.type, "document");
  assert.equal(report.evalId, "doc_001");
  assert.ok(typeof report.scores.documentIdentity === "number");
  assert.ok(report.scores.documentIdentity >= 0.5, `documentIdentity score ${report.scores.documentIdentity}`);
  assert.equal(report.criticalFailures.length, 0, report.criticalFailures.join("; "));
});

test("golden regression: after_doc_001 snapshot checkpoint", async () => {
  const goldenDataset = createGoldenDatasetService({
    goldenDatasetDir: config.goldenDatasetDir,
    caseId: config.goldenCaseId
  });
  const evalRunner = createEvalRunnerService({ goldenDataset });

  const snapshot = JSON.parse(
    await readFile(join(fixturesDir, "batch-002/case-snapshot.json"), "utf8")
  );

  const report = await evalRunner.evalSnapshot({
    batchId: "batch-ci",
    docIndex: 1,
    snapshot,
    allDocumentOutputs: []
  });

  assert.equal(report.type, "snapshot");
  assert.equal(report.evalId, "after_doc_001");
  assert.ok(typeof report.scores.snapshot === "number");
  assert.ok(report.scores.snapshot >= 0.5, `snapshot score ${report.scores.snapshot}`);
});

test("golden regression: manifest is loadable", async () => {
  const goldenDataset = createGoldenDatasetService({
    goldenDatasetDir: config.goldenDatasetDir,
    caseId: config.goldenCaseId
  });
  const manifest = await goldenDataset.loadManifest();
  assert.ok(manifest);
  assert.equal(manifest.caseId, "case_001");
});
