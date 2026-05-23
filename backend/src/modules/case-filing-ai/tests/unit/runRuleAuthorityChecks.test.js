import test from "node:test";
import assert from "node:assert/strict";
import { runRuleAuthorityChecks } from "../../utils/runRuleAuthorityChecks.js";

test("runRuleAuthorityChecks flags invalid supersession", () => {
  const failures = runRuleAuthorityChecks({
    actualDoc: {
      tasks: [
        {
          taskDescription: "Low rank task",
          sourceAuthority: "county",
          authorityRank: 60,
          supersedes: { authority: "case_order", authorityRank: 90 }
        }
      ]
    },
    docIndex: 1
  });
  assert.ok(failures.some((f) => f.code === "invalid_supersession"));
});

test("runRuleAuthorityChecks returns empty for clean tasks", () => {
  const failures = runRuleAuthorityChecks({
    actualDoc: { tasks: [{ taskDescription: "Routine filing", sourceAuthority: "part" }] },
    docIndex: 1
  });
  assert.equal(failures.length, 0);
});
