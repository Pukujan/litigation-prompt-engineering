import { test } from "node:test";
import assert from "node:assert/strict";
import { dedupeAndCapAuditNotes } from "../../utils/auditNotes.js";

test("dedupeAndCapAuditNotes removes duplicates and keeps most recent", () => {
  const notes = [
    "Processed doc-001.pdf",
    "NOI deadline noted",
    "Processed doc-001.pdf",
    "NOI deadline noted",
    "RJI filed",
    "Extra note A",
    "Extra note B",
    "Extra note C"
  ];
  const result = dedupeAndCapAuditNotes(notes, 5);
  assert.equal(result.length, 5);
  assert.equal(result[0], "NOI deadline noted");
  assert.equal(result[4], "Extra note C");
  assert.ok(!result.includes("Processed doc-001.pdf"));
});
