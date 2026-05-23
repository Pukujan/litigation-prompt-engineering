import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import { createStoragePaths } from "../../utils/storagePaths.js";
import { createGoldenDatasetService } from "../../services/goldenDataset.service.js";
import { runParsedDocumentChecks } from "../../utils/runParsedDocumentChecks.js";

test("runParsedDocumentChecks compares runtime to golden extraction quality", async () => {
  const root = await mkdtemp(join(tmpdir(), "parsed-golden-"));
  const batchRoot = join(root, "batches");
  const goldenRoot = join(root, "golden");
  const batchId = "batch-001";
  const docKey = "doc-001";

  const storagePaths = createStoragePaths({ batchRootDir: batchRoot, goldenRootDir: goldenRoot });
  const goldenDataset = createGoldenDatasetService({ goldenDatasetDir: goldenRoot, caseId: "case_001" });

  const goldenDir = join(goldenRoot, "parsed", docKey);
  const runtimeDir = storagePaths.parsedDocDir(batchId, docKey);
  await mkdir(goldenDir, { recursive: true });
  await mkdir(runtimeDir, { recursive: true });

  await writeFile(
    join(goldenDir, "extraction-quality.expected.json"),
    JSON.stringify({ method: "embedded_text", ocr_needed: false, textLength: 1000 })
  );
  await writeFile(
    join(runtimeDir, "extraction-quality.json"),
    JSON.stringify({ method: "embedded_text", ocr_needed: false, textLength: 1020 })
  );
  await writeFile(
    join(goldenDir, "final-parsed-text.txt"),
    "Synthetic filing paragraph anchor text for comparison purposes only."
  );
  await writeFile(
    join(runtimeDir, "final-parsed-text.txt"),
    "Synthetic filing paragraph anchor text for comparison purposes only."
  );

  const failures = await runParsedDocumentChecks({
    batchId,
    docIndex: 1,
    storagePaths,
    goldenDataset
  });
  assert.equal(failures.length, 0);
});

test("runParsedDocumentChecks returns empty when no golden parsed folder", async () => {
  const root = await mkdtemp(join(tmpdir(), "parsed-golden-"));
  const storagePaths = createStoragePaths({
    batchRootDir: join(root, "batches"),
    goldenRootDir: join(root, "golden")
  });
  const goldenDataset = createGoldenDatasetService({
    goldenDatasetDir: join(root, "golden"),
    caseId: "case_001"
  });

  const failures = await runParsedDocumentChecks({
    batchId: "batch-001",
    docIndex: 99,
    storagePaths,
    goldenDataset
  });
  assert.equal(failures.length, 0);
});
