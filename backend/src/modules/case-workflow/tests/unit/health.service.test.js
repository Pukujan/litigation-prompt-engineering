import { test } from "node:test";
import assert from "node:assert/strict";
import { getHealth } from "../../services/health.service.js";

test("getHealth returns module metadata", () => {
  const result = getHealth({ name: "case-workflow" });
  assert.equal(result.module, "case-workflow");
  assert.equal(result.status, "ok");
});
