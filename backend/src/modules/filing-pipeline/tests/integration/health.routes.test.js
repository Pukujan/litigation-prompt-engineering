import { test } from "node:test";
import assert from "node:assert/strict";
import { createTestApp } from "../../../../shared/testing/create-test-app.js";
import { register } from "../../index.js";

test("GET /api/filing-pipeline/health", async () => {
  const app = createTestApp(register);
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/filing-pipeline/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.module, "filing-pipeline");
    assert.equal(body.status, "ok");
  } finally {
    server.close();
  }
});
