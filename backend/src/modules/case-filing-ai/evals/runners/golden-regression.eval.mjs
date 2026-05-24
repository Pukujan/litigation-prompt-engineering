/**
 * Offline golden regression — no LLM calls.
 * Dataset: GOLDEN_CASE_ID (default case_001) or GOLDEN_DATASET_DIR.
 *
 * Run:
 *   npm run test:evals -- case-filing-ai
 *   npm run eval:golden -- --dataset case_001_rule_authority_v002
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createGoldenDatasetService } from "../../services/goldenDataset.service.js";
import { createEvalRunnerService } from "../../services/evalRunner.service.js";
import { assertRuleCatalogCoversTopics } from "../../utils/compareGoldenRuleFields.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const datasetId = process.env.GOLDEN_CASE_ID || "case_001";
const goldenDatasetDir =
  process.env.GOLDEN_DATASET_DIR || join(repoRoot, "evals/golden", datasetId);

function createServices() {
  const goldenDataset = createGoldenDatasetService({
    goldenDatasetDir,
    caseId: datasetId
  });
  const evalRunner = createEvalRunnerService({ goldenDataset });
  return { goldenDataset, evalRunner };
}

function fixturesDirForDataset(id) {
  if (id === "case_001_rule_authority_v002") {
    return join(dirname(fileURLToPath(import.meta.url)), "../../tests/fixtures/rule-authority-v002");
  }
  return join(dirname(fileURLToPath(import.meta.url)), "../../tests/fixtures/batch-002");
}

if (datasetId === "case_001") {
  const fixturesDir = fixturesDirForDataset(datasetId);
  const { goldenDataset, evalRunner } = createServices();

  test("golden regression [case_001]: doc_001 matches fixture output", async () => {
    const actual = JSON.parse(
      await readFile(join(fixturesDir, "outputs/doc-001.json"), "utf8")
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
    assert.ok(report.scores.documentIdentity >= 0.5);
    assert.equal(report.criticalFailures.length, 0, report.criticalFailures.join("; "));
  });

  test("golden regression [case_001]: after_doc_001 snapshot checkpoint", async () => {
    const snapshot = JSON.parse(
      await readFile(join(fixturesDir, "case-snapshot.json"), "utf8")
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
    assert.ok(report.scores.snapshot >= 0.5);
  });

  test("golden regression [case_001]: manifest is loadable", async () => {
    const manifest = await goldenDataset.loadManifest();
    assert.ok(manifest);
    assert.equal(manifest.caseId, "case_001");
  });
}

if (datasetId === "case_001_rule_authority_v002") {
  const fixturesDir = fixturesDirForDataset(datasetId);
  const { goldenDataset, evalRunner } = createServices();

  test("golden regression [v002]: manifest and rule catalog", async () => {
    const manifest = await goldenDataset.loadManifest();
    assert.ok(manifest);
    assert.equal(manifest.caseId, "case_001_rule_authority_v002");
    assert.equal(manifest.documentCount, 14);

    const catalog = await goldenDataset.loadRuleSourcesCatalog();
    assert.ok(Array.isArray(catalog));
    const { ok, missing } = assertRuleCatalogCoversTopics(catalog);
    assert.ok(ok, `rule catalog missing: ${missing.join(", ")}`);

    const pipeline = await goldenDataset.loadPipelineVersionsExpected();
    assert.equal(pipeline.goldenDatasetVersion, "synthetic_case_001_rule_authority_v002");
    assert.ok(pipeline.masterPromptVersion);
  });

  test("golden regression [v002]: eval_comparison_config rule authority checks", async () => {
    const config = await goldenDataset.loadComparisonConfig();
    assert.ok(config.ruleAuthorityChecks?.length);
    assert.ok(config.criticalFailureRules?.length);
    assert.ok(config.exactMatchFields?.includes("expectedRuleSourcesApplied"));
  });

  for (const docIndex of [1, 2, 4, 8, 12, 13, 14]) {
    test(`golden regression [v002]: doc_${String(docIndex).padStart(3, "0")} fixture`, async () => {
      const docKey = `doc-${String(docIndex).padStart(3, "0")}`;
      const actual = JSON.parse(
        await readFile(join(fixturesDir, `outputs/${docKey}.json`), "utf8")
      );

      const report = await evalRunner.evalDocument({
        batchId: "batch-rule-authority-v002",
        docIndex,
        docKey,
        documentResult: actual,
        snapshot: {},
        allDocumentOutputs: [actual]
      });

      assert.equal(report.evalId, goldenDataset.docEvalId(docIndex));
      assert.ok(report.scores.ruleSources >= 0.99, `ruleSources ${report.scores.ruleSources}`);
      assert.ok(report.scores.pipelineVersions >= 0.99);
      assert.ok(report.scores.extractionQuality >= 0.99);
      assert.equal(report.criticalFailures.length, 0, report.criticalFailures.join("; "));
    });
  }

  for (const docIndex of goldenDataset.snapshotCheckpoints) {
    test(`golden regression [v002]: after_doc_${String(docIndex).padStart(3, "0")} snapshot`, async () => {
      const expected = await goldenDataset.loadSnapshotExpected(docIndex);
      assert.ok(expected);

      const report = await evalRunner.evalSnapshot({
        batchId: "batch-rule-authority-v002",
        docIndex,
        snapshot: expected,
        allDocumentOutputs: []
      });

      assert.equal(report.evalId, goldenDataset.snapshotEvalId(docIndex));
      assert.ok(report.scores.snapshot >= 0.85, `snapshot score ${report.scores.snapshot}`);
    });
  }

  test("golden regression [v002]: negative guardrails file loads", async () => {
    const guardrails = await goldenDataset.loadNegativeGuardrails();
    assert.ok(guardrails.length >= 8);
    const ids = guardrails.map((g) => g.id);
    assert.ok(ids.includes("supersede_old_noi_after_cc_order"));
    assert.ok(ids.includes("deadline_requires_source_authority"));
  });

  test("golden regression [v002]: doc_013 PC/CC authority and supersession fields", async () => {
    const expected = await goldenDataset.loadDocumentExpected(13);
    assert.ok(expected.expectedRuleSourcesApplied?.length);
    const hasOrderSource = (expected.expectedTasks ?? []).some((t) =>
      /case_specific|later_case_specific_order/i.test(String(t.sourceAuthority ?? ""))
    );
    assert.ok(hasOrderSource);
    const snapshot = await goldenDataset.loadSnapshotExpected(14);
    assert.ok((snapshot.supersededDeadlines ?? []).length > 0);
  });
}

if (datasetId !== "case_001" && datasetId !== "case_001_rule_authority_v002") {
  test(`golden regression: unknown dataset ${datasetId}`, () => {
    assert.fail(`Unsupported GOLDEN_CASE_ID: ${datasetId}`);
  });
}
