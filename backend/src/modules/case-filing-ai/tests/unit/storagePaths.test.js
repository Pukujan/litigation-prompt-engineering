import test from "node:test";
import assert from "node:assert/strict";
import { createStoragePaths } from "../../utils/storagePaths.js";
import { toDocKey, toEvalId } from "../../contracts/storageLayout.contract.js";

test("toDocKey and toEvalId", () => {
  assert.equal(toDocKey(1), "doc-001");
  assert.equal(toEvalId("doc-001"), "doc_001");
});

test("storagePaths builds batch paths", () => {
  const paths = createStoragePaths({ batchRootDir: "/tmp/batches" });
  assert.equal(paths.outputPath("batch-001", "doc-002"), "/tmp/batches/batch-001/outputs/doc-002.json");
  assert.equal(
    paths.parsedPaths("batch-001", "doc-001").finalParsedText,
    "/tmp/batches/batch-001/parsed-documents/doc-001/final-parsed-text.txt"
  );
});
