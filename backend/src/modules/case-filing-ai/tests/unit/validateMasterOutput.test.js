import { test } from "node:test";
import assert from "node:assert/strict";
import { validateMasterOutput } from "../../utils/validateMasterOutput.js";

test("validateMasterOutput accepts legacy v1 shape", () => {
  const { valid, errors } = validateMasterOutput(
    {
      parties: [],
      tasks: [],
      updatedCaseSnapshot: {}
    },
    "v1"
  );
  assert.equal(valid, true, errors.join("; "));
});

test("validateMasterOutput rejects v1 missing updatedCaseSnapshot", () => {
  const { valid, errors } = validateMasterOutput({ parties: [] }, "v1");
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes("updatedCaseSnapshot")));
});

test("validateMasterOutput accepts v001 shape", () => {
  const { valid } = validateMasterOutput(
    {
      documentFacts: { parties: [] },
      ruleBasedTasks: [],
      updatedCaseSnapshot: {}
    },
    "v001"
  );
  assert.equal(valid, true);
});

test("validateMasterOutput rejects v001 missing documentFacts", () => {
  const { valid, errors } = validateMasterOutput({ updatedCaseSnapshot: {} }, "v001");
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes("documentFacts")));
});
