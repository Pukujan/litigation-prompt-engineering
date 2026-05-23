import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mergeStringArrays,
  mergeDeadlines,
  legacyMergeSnapshot,
  structuredMergeSnapshot
} from "../../utils/snapshotMerge.js";

test("mergeStringArrays appends without duplicates", () => {
  const merged = mergeStringArrays(["Fact A"], ["Fact B", "Fact A"]);
  assert.deepEqual(merged, ["Fact A", "Fact B"]);
});

test("mergeDeadlines upserts entries with the same type and date", () => {
  const prior = [{ type: "NOI", date: "2026-08-13" }];
  const incoming = [
    { type: "NOI", date: "2026-12-10" },
    { type: "NOI", date: "2026-12-10", note: "updated" }
  ];
  const merged = mergeDeadlines(prior, incoming);
  assert.equal(merged.length, 2);
  assert.ok(merged.some((d) => d.date === "2026-08-13"));
  const dec = merged.find((d) => d.date === "2026-12-10");
  assert.equal(dec.note, "updated");
});

test("legacyMergeSnapshot dedupes audit notes", () => {
  const prior = { confirmedFacts: ["A"], auditNotes: ["Note 1", "Note 1"] };
  const aiOutput = {
    updatedCaseSnapshot: { confirmedFacts: ["B"] },
    auditNotes: ["Note 1"]
  };
  const merged = legacyMergeSnapshot(prior, aiOutput, {
    docIndex: 2,
    storedName: "doc-002.pdf",
    maxAuditNotes: 10
  });
  assert.deepEqual(merged.confirmedFacts, ["B"]);
  assert.equal(merged.auditNotes.filter((n) => n === "Note 1").length, 1);
});

test("structuredMergeSnapshot appends facts instead of replacing", () => {
  const prior = { confirmedFacts: ["Early fact"], deadlines: [] };
  const aiOutput = {
    updatedCaseSnapshot: { confirmedFacts: ["New fact only"] },
    auditNotes: []
  };
  const merged = structuredMergeSnapshot(prior, aiOutput, {
    docIndex: 3,
    storedName: "doc-003.pdf"
  });
  assert.deepEqual(merged.confirmedFacts, ["Early fact", "New fact only"]);
});
