import { test } from "node:test";
import assert from "node:assert/strict";
import {
  prepareSnapshotForPrompt,
  truncateDocumentText
} from "../../utils/snapshotContext.js";

test("prepareSnapshotForPrompt omits auditNotes by default", () => {
  const snapshot = {
    caseId: "case_001",
    confirmedFacts: ["Fact 1", "Fact 2"],
    deadlines: [{ type: "NOI", date: "2026-08-13" }],
    auditNotes: ["note a", "note b"]
  };
  const prepared = prepareSnapshotForPrompt(snapshot);
  assert.ok(!("auditNotes" in prepared));
  assert.deepEqual(prepared.confirmedFacts, snapshot.confirmedFacts);
  assert.deepEqual(prepared.deadlines, snapshot.deadlines);
});

test("truncateDocumentText adds notice when over limit", () => {
  const long = "x".repeat(200);
  const out = truncateDocumentText(long, 50);
  assert.ok(out.length > 50);
  assert.match(out, /truncated/i);
});
