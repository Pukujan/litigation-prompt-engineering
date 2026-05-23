import { test } from "node:test";
import assert from "node:assert/strict";
import { createGoldenDatasetService } from "../../services/goldenDataset.service.js";
import { createEvalRunnerService } from "../../services/evalRunner.service.js";
import { buildRunMetadata } from "../../services/runMetadata.service.js";
import { getModuleConfig } from "../../config/index.js";

test("evalRunner attaches runMetadata to document eval report", async () => {
  const config = getModuleConfig();
  const goldenDataset = createGoldenDatasetService({
    goldenDatasetDir: config.goldenDatasetDir,
    caseId: config.goldenCaseId
  });
  const evalRunner = createEvalRunnerService({ goldenDataset });

  const runMetadata = buildRunMetadata({
    promptVersion: "v1",
    snapshotMergeMode: "legacy",
    openRouterModel: "test-model",
    masterPromptConfig: config.masterPrompt
  });

  const documentResult = {
    docKey: "doc-001",
    docIndex: 1,
    runMetadata,
    docketEntry: { filingType: "SUMMONS AND VERIFIED COMPLAINT" },
    documentMetadata: { pageCount: 7 },
    parties: [],
    tasks: [],
    deadlines: [],
    humanReviewItems: []
  };

  const report = await evalRunner.evalDocument({
    batchId: "batch-test",
    docIndex: 1,
    docKey: "doc-001",
    documentResult,
    snapshot: {},
    allDocumentOutputs: [documentResult],
    runMetadata
  });

  assert.equal(report.runMetadata.promptVersion, "v1");
  assert.equal(report.runMetadata.promptTemplate, "master-case-filing.prompt.md");
  assert.ok(report.notes.some((n) => n.includes("master prompt v1")));
});
