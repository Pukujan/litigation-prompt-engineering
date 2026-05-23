import { test } from "node:test";
import assert from "node:assert/strict";
import { getHealth } from "../../services/health.service.js";
import { createMasterPromptService } from "../../services/masterPrompt.service.js";

test("case-filing-ai: health service returns module name", () => {
  const result = getHealth({ name: "case-filing-ai" });
  assert.equal(result.module, "case-filing-ai");
  assert.equal(result.status, "ok");
});

test("case-filing-ai: master prompt parses JSON fences", () => {
  const masterPrompt = createMasterPromptService({
    openRouter: { chatCompletion: async () => ({}) }
  });
  const parsed = masterPrompt.parseJsonResponse(
    '```json\n{"tasks":[],"updatedCaseSnapshot":{}}\n```'
  );
  assert.deepEqual(parsed.tasks, []);
});

test("case-filing-ai: master prompt parses JSON with preamble text", () => {
  const masterPrompt = createMasterPromptService({
    openRouter: { chatCompletion: async () => ({}) }
  });
  const parsed = masterPrompt.parseJsonResponse(
    'Here is the extraction:\n```json\n{"tasks":[{"id":1}], "auditNotes": []}\n```\nEnd.'
  );
  assert.equal(parsed.tasks.length, 1);
});

test("case-filing-ai: master prompt repairs trailing commas", () => {
  const masterPrompt = createMasterPromptService({
    openRouter: { chatCompletion: async () => ({}) }
  });
  const parsed = masterPrompt.parseJsonResponse('{"tasks": [],}');
  assert.deepEqual(parsed.tasks, []);
});
