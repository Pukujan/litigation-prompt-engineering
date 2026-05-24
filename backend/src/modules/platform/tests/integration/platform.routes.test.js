import { test } from "node:test";
import assert from "node:assert/strict";
import { createTestApp } from "../../../../shared/testing/create-test-app.js";

test("GET /api/platform/modules returns registry", async () => {
  const { register } = await import("../../index.js");
  const app = createTestApp(register);
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/platform/modules`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.modules?.length >= 6);
    assert.ok(body.modules.some((m) => m.id === "court-rules"));
  } finally {
    server.close();
  }
});

test("GET /api/platform/onboarding/pipeline-guide returns json", async () => {
  const { register } = await import("../../index.js");
  const app = createTestApp(register);
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(
      `http://127.0.0.1:${port}/api/platform/onboarding/pipeline-guide?format=json`
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.title, "Case Filing Pipeline Guide");
    assert.ok(body.sections?.length > 0);
  } finally {
    server.close();
  }
});
