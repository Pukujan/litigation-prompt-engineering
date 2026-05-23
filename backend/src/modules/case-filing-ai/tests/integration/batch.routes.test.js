import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "fs/promises";
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

const MOCK_INFERRED_AI_RESULT = {
  ...MOCK_AI_RESULT,
  inferredPartRuleText: "Part 29: all motions must be filed within 15 days.",
  partRuleExtracts: [{ title: "Motion deadline", requirement: "15 days" }],
  auditNotes: ["Inferred part rule from filing"]
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
      if (userContent.includes("(none supplied")) {
        return {
          ok: true,
          json: async () => ({
            model: "test-model",
            choices: [{ message: { content: JSON.stringify(MOCK_INFERRED_AI_RESULT) } }]
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

test("POST /api/case-filing-ai/process-batch stores batch and returns results", async () => {
  const batchDir = await mkdtemp(join(tmpdir(), "case-filing-batch-"));
  process.env.CASE_FILING_BATCH_DIR = batchDir;
  process.env.OPENROUTER_API_KEY = "test-key";

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

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.match(body.batchId, /^batch-/);
    assert.equal(body.documents.length, 1);
    assert.equal(body.tasks.length, 1);
    assert.equal(body.partRule?.source, "user_paste");
    assert.equal(body.partRule?.partName, "Part 29");

    const parsedPath = join(batchDir, body.batchId, "rule", "part-rules-parsed.json");
    const parsedRaw = await readFile(parsedPath, "utf8");
    const parsed = JSON.parse(parsedRaw);
    assert.equal(parsed.source, "user_paste");

    const statusRes = await fetch(
      `http://127.0.0.1:${port}/api/case-filing-ai/batches/${body.batchId}/status`
    );
    assert.equal(statusRes.status, 200);
    const status = await statusRes.json();
    assert.equal(status.status, "completed");
    assert.equal(status.processedCount, 1);

    const resultsRes = await fetch(
      `http://127.0.0.1:${port}/api/case-filing-ai/batches/${body.batchId}/results`
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

test("POST /api/case-filing-ai/process-batch infers part rules from filings when none supplied", async () => {
  const batchDir = await mkdtemp(join(tmpdir(), "case-filing-batch-"));
  process.env.CASE_FILING_BATCH_DIR = batchDir;
  process.env.OPENROUTER_API_KEY = "test-key";

  const originalFetch = createOpenRouterMock();

  const { register } = await import("../../index.js");
  const app = createTestApp(register);
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const form = new FormData();
    form.append("partRuleText", "");
    form.append(
      "files",
      new Blob(["%PDF-1.4 test"], { type: "application/pdf" }),
      "001-complaint.pdf"
    );

    const res = await fetch(`http://127.0.0.1:${port}/api/case-filing-ai/process-batch`, {
      method: "POST",
      body: form
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.partRule?.source, "inferred_from_filings");
    assert.match(body.partRule?.inferredFromDocs?.[0]?.docKey ?? "", /^doc-/);

    const ruleText = await readFile(
      join(batchDir, body.batchId, "rule", "part-rules.txt"),
      "utf8"
    );
    assert.match(ruleText, /Part 29/);
  } finally {
    server.close();
    global.fetch = originalFetch;
    await rm(batchDir, { recursive: true, force: true });
    delete process.env.CASE_FILING_BATCH_DIR;
    delete process.env.OPENROUTER_API_KEY;
  }
});
