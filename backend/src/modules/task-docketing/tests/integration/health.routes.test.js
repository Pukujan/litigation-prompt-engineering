import { test } from "node:test";
import assert from "node:assert/strict";
import { createTestApp } from "../../../../shared/testing/create-test-app.js";
import { register } from "../../index.js";

test("GET /api/task-docketing/health", async () => {
  const app = createTestApp(register);
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/task-docketing/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.module, "task-docketing");
    assert.equal(body.status, "ok");
  } finally {
    server.close();
  }
});
