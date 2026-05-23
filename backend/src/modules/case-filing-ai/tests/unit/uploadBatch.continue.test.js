import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { createUploadBatchService } from "../../services/uploadBatch.service.js";
import { createLocalJsonStore } from "../../services/localJsonStore.service.js";
import { createCaseSnapshotService } from "../../services/caseSnapshot.service.js";

test("processBatch continues after a document failure", async () => {
  const batchRoot = await mkdtemp(join(tmpdir(), "batch-continue-"));
  const store = createLocalJsonStore({ batchRootDir: batchRoot });
  const caseSnapshot = createCaseSnapshotService({ store, mergeMode: "legacy" });

  let callIndex = 0;
  const masterPrompt = {
    parsePartRule: async () => ({ rules: [] }),
    processDocument: async () => {
      callIndex += 1;
      if (callIndex === 2) {
        const error = new Error("invalid JSON");
        error.statusCode = 502;
        throw error;
      }
      return {
        model: "test",
        usage: null,
        result: {
          documentMetadata: {},
          extractionQuality: {},
          docketEntry: {},
          caseUpdates: {},
          parties: [],
          witnesses: [],
          tasks: [],
          deadlines: [],
          humanReviewItems: [],
          updatedCaseSnapshot: { openTasks: [] },
          auditNotes: []
        }
      };
    }
  };

  const documentText = {
    extractText: async () => ({
      text: "filing body",
      pageCount: 1,
      fileKind: "pdf",
      extractionQuality: { ocr_needed: false }
    })
  };

  const uploadBatch = createUploadBatchService({
    store,
    documentText,
    masterPrompt,
    caseSnapshot,
    evalRunner: null,
    batchRootDir: batchRoot
  });

  const files = [
    { originalname: "001-a.pdf", buffer: Buffer.from("a"), mimetype: "application/pdf", size: 1 },
    { originalname: "002-b.pdf", buffer: Buffer.from("b"), mimetype: "application/pdf", size: 1 },
    { originalname: "003-c.pdf", buffer: Buffer.from("c"), mimetype: "application/pdf", size: 1 }
  ];

  const result = await uploadBatch.processBatch({ files, partRuleText: "Part rule text" });

  assert.equal(result.batchStatus, "partial");
  assert.equal(result.processedCount, 2);
  assert.equal(result.failedDocuments.length, 1);
  assert.equal(result.failedDocuments[0].docIndex, 2);
  assert.equal(result.documents.length, 3);
  assert.equal(result.documents.filter((d) => d.status === "completed").length, 2);

  await rm(batchRoot, { recursive: true, force: true });
});
