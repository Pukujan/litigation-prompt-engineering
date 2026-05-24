import { test } from "node:test";
import assert from "node:assert/strict";
import {
  documentResultToExpected,
  snapshotToExpected,
  docEvalId
} from "../../services/goldenExporter.service.js";

test("docEvalId formats three-digit index", () => {
  assert.equal(docEvalId(1), "doc_001");
  assert.equal(docEvalId(14), "doc_014");
});

test("documentResultToExpected maps pipeline output to golden shape", () => {
  const expected = documentResultToExpected({
    docIndex: 1,
    docKey: "doc-001",
    originalName: "001-complaint.pdf",
    ruleSourcesChecked: ["cplr_general_civil_practice"],
    documentMetadata: { title: "Complaint", pageCount: 5 },
    extractionQuality: { ocr_needed: true, method: "ocr" },
    docketEntry: {
      filingType: "COMPLAINT",
      filingDate: "2027-01-01",
      nyscefDocNo: 1
    },
    parties: [{ role: "plaintiff", name: "Example" }],
    tasks: [{ taskType: "REVIEW", taskDescription: "Review filing" }],
    deadlines: [],
    humanReviewItems: [],
    caseUpdates: { confirmedFacts: ["Fact one"] },
    rawMasterResult: { mustNotCreate: ["bad deadline"] }
  });

  assert.equal(expected.expectedDocumentType, "COMPLAINT");
  assert.equal(expected.expectedNyscefDocNo, 1);
  assert.deepEqual(expected.expectedRuleSourcesApplied, ["cplr_general_civil_practice"]);
  assert.deepEqual(expected.mustNotCreate, ["bad deadline"]);
  assert.equal(expected.synthetic, true);
});

test("snapshotToExpected maps snapshot checkpoint fields", () => {
  const snap = snapshotToExpected(
    {
      currentPhase: "CASE_COMMENCED",
      confirmedFacts: ["A"],
      openTasks: [],
      deadlines: []
    },
    2,
    { caseId: "synthetic_case_002" }
  );

  assert.equal(snap.afterDocNo, 2);
  assert.equal(snap.caseId, "synthetic_case_002");
  assert.equal(snap.currentPhase, "CASE_COMMENCED");
});
