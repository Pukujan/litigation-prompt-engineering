#!/usr/bin/env node
/**
 * Split synthetic_case_001_golden_dataset_ground_truth.json → evals/golden/case_001/*.expected.json
 * Usage: node scripts/ingest-golden-expected.mjs [path/to/ground_truth.json]
 */
import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { resolveImportStamp, importDirForStamp } from "./resolve-import-stamp.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const defaultImportStamp = "2026-05-23_15-59-43Z";
const goldenDir = join(repoRoot, "evals/golden/case_001");

const SNAPSHOT_CHECKPOINTS = [1, 2, 4, 8, 12, 14];

function docEvalId(docIndex) {
  return `doc_${String(docIndex).padStart(3, "0")}`;
}

function snapshotEvalId(docIndex) {
  return `after_doc_${String(docIndex).padStart(3, "0")}`;
}

function pickDocumentExpected(doc) {
  return {
    expectedDocumentType: doc.expectedDocumentType,
    expectedTitle: doc.expectedTitle,
    expectedFilingDate: doc.expectedFilingDate,
    expectedReceivedDate: doc.expectedReceivedDate,
    expectedNyscefDocNo: doc.expectedNyscefDocNo,
    expectedPageCount: doc.expectedPageCount,
    expectedExtractionQuality: doc.expectedExtractionQuality,
    expectedConfirmedFacts: doc.expectedConfirmedFacts,
    expectedParties: doc.expectedParties,
    expectedTasks: doc.expectedTasks,
    expectedDeadlines: doc.expectedDeadlines,
    expectedHumanReviewItems: doc.expectedHumanReviewItems,
    mustNotCreate: doc.mustNotCreate ?? [],
    synthetic: doc.synthetic === true,
    syntheticDataNotice: doc.syntheticDataNotice ?? null
  };
}

async function main() {
  let sourcePath;
  if (process.argv[2]) {
    sourcePath = join(process.cwd(), process.argv[2]);
  } else {
    const stamp = await resolveImportStamp(defaultImportStamp);
    sourcePath = join(
      importDirForStamp(stamp),
      "synthetic_case_001_golden_dataset_ground_truth.json"
    );
  }
  const raw = await readFile(sourcePath, "utf8");
  const ground = JSON.parse(raw);

  await mkdir(goldenDir, { recursive: true });

  let docCount = 0;
  for (const doc of ground.documentExpectedOutputs ?? []) {
    const evalId = docEvalId(doc.docIndex);
    await writeFile(
      join(goldenDir, `${evalId}.expected.json`),
      JSON.stringify(pickDocumentExpected(doc), null, 2)
    );
    docCount += 1;
  }

  let snapCount = 0;
  const snapshots = ground.snapshotExpectedOutputs ?? {};
  for (const docIndex of SNAPSHOT_CHECKPOINTS) {
    const key = snapshotEvalId(docIndex);
    const snap = snapshots[key];
    if (!snap) {
      console.warn(`warn: missing ${key} in ground truth`);
      continue;
    }
    await writeFile(join(goldenDir, `${key}.expected.json`), JSON.stringify(snap, null, 2));
    snapCount += 1;
  }

  await writeFile(
    join(goldenDir, "negative_guardrails.expected.json"),
    JSON.stringify(ground.negativeGuardrailTests ?? [], null, 2)
  );

  if (ground.evalComparisonConfig) {
    await writeFile(
      join(goldenDir, "eval_comparison_config.json"),
      JSON.stringify(ground.evalComparisonConfig, null, 2)
    );
  }

  const manifest = {
    caseId: "case_001",
    legalCaseId: ground.caseIdentity?.caseId ?? "synthetic_case_001",
    caseIdentity: {
      ...ground.caseIdentity,
      caseId: "case_001_synthetic_maria_demo"
    },
    description: ground.meta?.name ?? "Synthetic Case 001 golden dataset",
    documentCount: docCount,
    snapshotCheckpoints: SNAPSHOT_CHECKPOINTS,
    goldenDatasetVersion: "case_001-v2-full-expected",
    synthetic: true,
    syntheticDataNotice: ground.meta?.syntheticDataNotice ?? null,
    ingestedFrom: sourcePath.replace(repoRoot + "/", "")
  };

  await writeFile(join(goldenDir, "case_001.golden-dataset.json"), JSON.stringify(manifest, null, 2));

  console.log(`Ingested ${docCount} doc expected files, ${snapCount} snapshot checkpoints`);
  console.log(`→ ${goldenDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
