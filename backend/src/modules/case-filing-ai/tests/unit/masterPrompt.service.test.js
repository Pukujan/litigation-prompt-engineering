import { test } from "node:test";
import assert from "node:assert/strict";
import { createMasterPromptService } from "../../services/masterPrompt.service.js";

test("parseJsonResponse repairs trailing commas", () => {
  const service = createMasterPromptService({
    openRouter: { chatCompletion: async () => ({}) }
  });
  const parsed = service.parseJsonResponse('{"ok": true,}');
  assert.equal(parsed.ok, true);
});

test("processDocument retries once on invalid JSON", async () => {
  let callCount = 0;
  const openRouter = {
    chatCompletion: async () => {
      callCount += 1;
      if (callCount === 1) {
        return { model: "test", content: "not json", usage: null };
      }
      return {
        model: "test",
        content: JSON.stringify({
          documentMetadata: {},
          updatedCaseSnapshot: {},
          auditNotes: []
        }),
        usage: null
      };
    }
  };

  const service = createMasterPromptService({
    openRouter,
    jsonRetry: true,
    jsonObjectMode: false,
    omitAuditNotesInPrompt: true
  });

  const result = await service.processDocument({
    documentText: "Sample filing text",
    fileMetadata: { docIndex: 1 },
    priorCaseSnapshot: { confirmedFacts: [] },
    partRuleText: "",
    hasUserPartRule: false
  });

  assert.equal(callCount, 2);
  assert.ok(result.result);
});
