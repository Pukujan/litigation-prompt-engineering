import test from "node:test";
import assert from "node:assert/strict";
import { normalizeMasterOutput } from "../../utils/normalizeMasterOutput.js";

test("normalizeMasterOutput passes through legacy v1 shape", () => {
  const legacy = { parties: [{ name: "Plaintiff" }], tasks: [] };
  assert.deepEqual(normalizeMasterOutput(legacy), legacy);
});

test("normalizeMasterOutput maps v001 documentFacts and tasks", () => {
  const v001 = {
    documentFacts: {
      parties: [{ name: "Defendant" }],
      docketEntry: { filingType: "motion" }
    },
    ruleBasedTasks: [{ taskDescription: "File opposition", sourceAuthority: "part" }],
    caseOrderTasks: [{ taskDescription: "Appear at PC", sourceAuthority: "case_order" }],
    ruleSourcesApplied: ["queens-part-10-general"]
  };

  const out = normalizeMasterOutput(v001);
  assert.equal(out.parties.length, 1);
  assert.equal(out.tasks.length, 2);
  assert.equal(out.docketEntry.filingType, "motion");
  assert.deepEqual(out.ruleSourcesApplied, ["queens-part-10-general"]);
});
