import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildRunMetadata,
  runMetadataNote,
  attachRunMetadataToReport
} from "../../utils/runMetadata.js";

test("buildRunMetadata includes prompt version and template", () => {
  const meta = buildRunMetadata({
    promptVersion: "v1",
    snapshotMergeMode: "legacy",
    openRouterModel: "google/gemini-2.0-flash-001",
    masterPromptConfig: { jsonRetry: true, omitAuditNotesInPrompt: true }
  });
  assert.equal(meta.promptVersion, "v1");
  assert.equal(meta.promptTemplate, "master-case-filing.prompt.md");
  assert.equal(meta.snapshotMergeMode, "legacy");
  assert.equal(meta.openRouterModel, "google/gemini-2.0-flash-001");
});

test("attachRunMetadataToReport adds note and runMetadata field", () => {
  const report = {
    evalId: "doc_001",
    notes: ["Compared against golden"]
  };
  const meta = buildRunMetadata({
    promptVersion: "compact",
    snapshotMergeMode: "structured",
    openRouterModel: "test-model"
  });
  attachRunMetadataToReport(report, meta);
  assert.deepEqual(report.runMetadata, meta);
  assert.match(report.notes[0], /master prompt compact/);
  assert.match(report.notes[0], /structured/);
});
