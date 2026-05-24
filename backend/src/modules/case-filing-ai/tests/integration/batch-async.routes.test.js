import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { createTestApp } from "../../../../shared/testing/create-test-app.js";

const MOCK_PARSED_RULE = {
  partName: "Part 29",
  judgeName: null,
  county: null,
  court: null,
  rules: ["all motions must be filed within 15 days."],
  schedulingNotes: [],
  deadlinePolicies: [],
  sourceSummary: "Part 29 motion deadline",
  confidence: "high"
};

const MOCK_AI_RESULT = {
  documentMetadata: { title: "Test complaint" },
  extractionQuality: { ocr_needed: false },
  docketEntry: {},
  caseUpdates: {},
  parties: [],
  witnesses: [],
  tasks: [{ taskDescription: "File answer" }],
  deadlines: [],
  humanReviewItems: [],
  updatedCaseSnapshot: {
    afterDocNo: 1,
    openTasks: [{ taskDescription: "File answer" }],
    auditNotes: ["Processed test doc"]
  },
  auditNotes: ["AI extracted provisional tasks"],
  inferredPartRuleText: "",
  partRuleExtracts: []
};

function createOpenRouterMock() {
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    if (String(url).includes("openrouter.ai")) {
      const body = JSON.parse(options.body);
      const userContent = body.messages.find((message) => message.role === "user")?.content ?? "";
      if (userContent.includes("Parse the supplied part rule")) {
        return {
          ok: true,
          json: async () => ({
            model: "test-model",
            choices: [{ message: { content: JSON.stringify(MOCK_PARSED_RULE) } }]
          })
        };
      }
      return {
        ok: true,
        json: async () => ({
          model: "test-model",
          choices: [{ message: { content: JSON.stringify(MOCK_AI_RESULT) } }]
        })
      };
    }
    return originalFetch(url, options);
  };
  return originalFetch;
}

async function pollUntilComplete(port, batchId, maxAttempts = 50) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const res = await fetch(
      `http://127.0.0.1:${port}/api/case-filing-ai/batches/${batchId}/status`
    );
    assert.equal(res.status, 200);
    const status = await res.json();
    if (["completed", "partial", "failed"].includes(status.status)) {
      return status;
    }
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error("batch did not complete in time");
}

test("POST /api/case-filing-ai/process-batch async returns 202 and completes via polling", async () => {
  const batchDir = await mkdtemp(join(tmpdir(), "case-filing-async-"));
  process.env.CASE_FILING_BATCH_DIR = batchDir;
  process.env.OPENROUTER_API_KEY = "test-key";
  delete process.env.CASE_FILING_SYNC_BATCH;

  const originalFetch = createOpenRouterMock();

  const { register } = await import("../../index.js");
  const app = createTestApp(register);
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const form = new FormData();
    form.append("partRuleText", "Part 29: all motions must be filed within 15 days.");
    form.append(
      "files",
      new Blob(["%PDF-1.4 test"], { type: "application/pdf" }),
      "001-complaint.pdf"
    );

    const res = await fetch(`http://127.0.0.1:${port}/api/case-filing-ai/process-batch`, {
      method: "POST",
      body: form
    });

    assert.equal(res.status, 202);
    const started = await res.json();
    assert.match(started.batchId, /^batch-/);
    assert.equal(started.status, "processing");

    const finalStatus = await pollUntilComplete(port, started.batchId);
    assert.equal(finalStatus.status, "completed");
    assert.equal(finalStatus.processedCount, 1);

    const resultsRes = await fetch(
      `http://127.0.0.1:${port}/api/case-filing-ai/batches/${started.batchId}/results`
    );
    assert.equal(resultsRes.status, 200);
    const results = await resultsRes.json();
    assert.equal(results.documents.length, 1);
  } finally {
    server.close();
    global.fetch = originalFetch;
    await rm(batchDir, { recursive: true, force: true });
    delete process.env.CASE_FILING_BATCH_DIR;
    delete process.env.OPENROUTER_API_KEY;
  }
});
