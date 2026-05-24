import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, access, readdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { createTestApp } from "../../../../shared/testing/create-test-app.js";

test("POST /api/file-exchange/clear removes dated folders when confirmed", async () => {
  const repoRoot = await mkdtemp(join(tmpdir(), "fx-api-"));
  process.env.FILE_EXCHANGE_REPO_ROOT = repoRoot;

  await mkdir(join(repoRoot, "file-exchange/imports/2026-05-23_15-59-43Z"), {
    recursive: true
  });
  await writeFile(join(repoRoot, "file-exchange/imports/.gitkeep"), "");
  await mkdir(join(repoRoot, "file-exchange/exports/2026-05-24_01-00-00Z_consolidated"), {
    recursive: true
  });
  await writeFile(join(repoRoot, "file-exchange/exports/.gitkeep"), "");

  const { register } = await import("../../index.js");
  const app = createTestApp(register);
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const preview = await fetch(`http://127.0.0.1:${port}/api/file-exchange/clear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dryRun: true })
    });
    assert.equal(preview.status, 200);
    const previewBody = await preview.json();
    assert.equal(previewBody.status, "preview");
    assert.ok(previewBody.removedCount >= 2);

    await access(join(repoRoot, "file-exchange/imports/2026-05-23_15-59-43Z"));

    const res = await fetch(`http://127.0.0.1:${port}/api/file-exchange/clear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: true })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.status, "cleared");
    assert.ok(body.removedCount >= 2);

    const imports = await readdir(join(repoRoot, "file-exchange/imports"));
    assert.deepEqual(imports, [".gitkeep"]);

    const exports = await readdir(join(repoRoot, "file-exchange/exports"));
    assert.deepEqual(exports, [".gitkeep"]);
  } finally {
    server.close();
    delete process.env.FILE_EXCHANGE_REPO_ROOT;
  }
});
