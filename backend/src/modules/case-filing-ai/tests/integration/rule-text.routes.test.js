import { test } from "node:test";
import assert from "node:assert/strict";
import { createTestApp } from "../../../../shared/testing/create-test-app.js";

test("POST /api/case-filing-ai/extract-rule-text extracts PDF rule text", async () => {
  const { register } = await import("../../index.js");
  const app = createTestApp(register);
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const form = new FormData();
    form.append(
      "file",
      new Blob(["Part 29 rule text for motions in this part."], { type: "text/plain" }),
      "part-rules.txt"
    );

    const res = await fetch(`http://127.0.0.1:${port}/api/case-filing-ai/extract-rule-text`, {
      method: "POST",
      body: form
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.match(body.text, /Part 29/);
    assert.equal(body.fileKind, "text");
  } finally {
    server.close();
  }
});
