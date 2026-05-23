import { test } from "node:test";
import assert from "node:assert/strict";
import { getHealth } from "../../services/health.service.js";

test("getHealth returns module metadata", () => {
  const result = getHealth({ name: "task-docketing" });
  assert.equal(result.module, "task-docketing");
  assert.equal(result.status, "ok");
});
