import { test } from "node:test";
import assert from "node:assert/strict";
import { sortBatchFiles } from "../../services/uploadBatch.service.js";

test("sortBatchFiles sorts by numeric prefix in filename", () => {
  const files = [
    { originalname: "010-summons.pdf" },
    { originalname: "002-complaint.txt" },
    { originalname: "001-cover.png" }
  ];
  const sorted = sortBatchFiles(files);
  assert.deepEqual(
    sorted.map((f) => f.originalname),
    ["001-cover.png", "002-complaint.txt", "010-summons.pdf"]
  );
});
