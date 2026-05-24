import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { mkdtemp } from "fs/promises";
import { resolveConsolidatedInventory } from "../../utils/resolveConsolidatedInventory.js";

test("resolveConsolidatedInventory reads meta.generatedAt from consolidated-files", async () => {
  const root = await mkdtemp(join(tmpdir(), "golden-inventory-"));
  const consolidatedDir = join(root, "consolidated-files");
  await mkdir(consolidatedDir, { recursive: true });
  const stamp = "2026-05-24T12:00:00.000Z";
  await writeFile(
    join(consolidatedDir, "consolidated-models.json"),
    JSON.stringify({ meta: { generatedAt: stamp } }),
    "utf8"
  );
  await writeFile(
    join(consolidatedDir, "consolidated-prompts.json"),
    JSON.stringify({ meta: { generatedAt: "2026-05-24T11:59:00.000Z" } }),
    "utf8"
  );

  const result = await resolveConsolidatedInventory(root);
  assert.equal(result.modelInventoryVersion, stamp);
  assert.equal(result.promptInventoryVersion, "2026-05-24T11:59:00.000Z");
  assert.ok(result.modelInventoryPath?.includes("consolidated-models.json"));
});
