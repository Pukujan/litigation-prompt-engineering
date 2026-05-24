import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mapToBenchmark,
  mapToFilingTable,
  mapToWorklogPayload
} from "./mapDemoBundleToLegalOps.js";

const minimalBundle = {
  generatedAt: "2026-05-24T18:00:00.000Z",
  batchId: "demo-case-002-cached",
  replay: true,
  results: {
    totalCount: 2,
    documents: [
      { docIndex: 1, docKey: "doc-001", tasks: [], deadlines: [], ruleSourcesChecked: ["r1"] },
      { docIndex: 2, docKey: "doc-002", tasks: [{ taskType: "X" }], deadlines: [], ruleSourcesChecked: [] }
    ],
    caseSnapshot: { openTasks: ["Review"], deadlines: [{ type: "CC", date: "2026-01-01" }] }
  },
  evals: {
    reports: [
      { evalId: "doc_001", type: "document", docIndex: 1, status: "pass" },
      { evalId: "doc_002", type: "document", docIndex: 2, status: "partial" }
    ]
  },
  audit: {
    entries: [
      { event: "parse_completed", docKey: "doc-001", docIndex: 1, timestamp: "2026-05-24T18:01:00.000Z" },
      { event: "eval_scored", docKey: "doc-001", docIndex: 1, timestamp: "2026-05-24T18:02:00.000Z" }
    ]
  },
  manifest: {
    lineage: { goldenCaseId: "case_test", authorModel: "deepseek/deepseek-v4-pro" }
  },
  case: { title: "Test Matter" }
};

test("mapToBenchmark produces stage rows and savings", () => {
  const b = mapToBenchmark(minimalBundle, null);
  assert.ok(b.manualTotal > b.autoTotal);
  assert.ok(b.savedTotal > 0);
  assert.equal(b.evalSummary.pass, 1);
});

test("mapToWorklogPayload builds worklog from audit", () => {
  const p = mapToWorklogPayload(minimalBundle, null, { id: "case_test", title: "Test" });
  assert.ok(p.worklog.worklog.length >= 2);
  assert.ok(p.durations.durationEstimates.length > 0);
});

test("mapToFilingTable lists documents", () => {
  const rows = mapToFilingTable(minimalBundle, null, {
    documents: [
      { docKey: "doc-001", docIndex: 1, title: "Complaint" },
      { docKey: "doc-002", docIndex: 2, title: "Answer" }
    ]
  });
  assert.equal(rows.length, 2);
  assert.equal(rows[0].evalStatus, "pass");
});
