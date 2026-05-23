#!/usr/bin/env node
/**
 * Re-run golden evals for an existing batch (no LLM re-processing).
 * Usage: node scripts/rerun-batch-evals.mjs [batchId]
 */
import { readFile, readdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getModuleConfig, getSnapshotMergeMode } from "../backend/src/modules/case-filing-ai/config/index.js";
import { createLocalJsonStore } from "../backend/src/modules/case-filing-ai/services/localJsonStore.service.js";
import { createGoldenDatasetService } from "../backend/src/modules/case-filing-ai/services/goldenDataset.service.js";
import { createEvalRunnerService } from "../backend/src/modules/case-filing-ai/services/evalRunner.service.js";
import { createCaseSnapshotService } from "../backend/src/modules/case-filing-ai/services/caseSnapshot.service.js";
import { createStoragePaths } from "../backend/src/modules/case-filing-ai/utils/storagePaths.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function documentToMergeInput(doc) {
  return {
    documentMetadata: doc.documentMetadata,
    extractionQuality: doc.extractionQuality,
    docketEntry: doc.docketEntry,
    caseUpdates: doc.caseUpdates,
    parties: doc.parties,
    witnesses: doc.witnesses,
    tasks: doc.tasks,
    deadlines: doc.deadlines,
    humanReviewItems: doc.humanReviewItems,
    auditNotes: doc.auditNotes,
    updatedCaseSnapshot: doc.updatedCaseSnapshot ?? {}
  };
}

async function main() {
  const batchId = process.argv[2] || "batch-004";
  const config = getModuleConfig();
  const store = createLocalJsonStore({ batchRootDir: config.batchRootDir });
  const storagePaths = createStoragePaths({
    batchRootDir: config.batchRootDir,
    goldenRootDir: config.goldenDatasetDir
  });
  const goldenDataset = createGoldenDatasetService({
    goldenDatasetDir: config.goldenDatasetDir,
    caseId: config.goldenCaseId
  });
  const evalRunner = createEvalRunnerService({ goldenDataset, storagePaths });
  const caseSnapshot = createCaseSnapshotService({
    store,
    mergeMode: getSnapshotMergeMode(config.masterPrompt.version),
    maxAuditNotes: config.masterPrompt.maxAuditNotes
  });

  const outputsDir = join(config.batchRootDir, batchId, "outputs");
  const names = (await readdir(outputsDir))
    .filter((n) => n.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  let snapshot = store.emptySnapshot();
  const allOutputs = [];
  const summary = { pass: 0, partial: 0, fail: 0, criticalFailureCount: 0 };

  for (const name of names) {
    const doc = JSON.parse(await readFile(join(outputsDir, name), "utf8"));
    if (doc.status === "failed") continue;

    allOutputs.push(doc);
    const reports = await evalRunner.runAfterDocument({
      batchId,
      docIndex: doc.docIndex,
      docKey: doc.docKey,
      documentResult: doc,
      snapshot,
      allDocumentOutputs: [...allOutputs],
      runMetadata: doc.runMetadata
    });

    snapshot = caseSnapshot.mergeSnapshot(snapshot, documentToMergeInput(doc), {
      docIndex: doc.docIndex,
      storedName: doc.storedName
    });

    for (const { evalId, report } of reports) {
      await store.saveEvalReport(batchId, evalId, report);
      summary[report.status] = (summary[report.status] ?? 0) + 1;
      summary.criticalFailureCount += report.criticalFailures?.length ?? 0;
    }
  }

  console.log(`Re-ran evals for ${batchId}:`, summary);
  console.log(`Reports: ${config.batchRootDir}/${batchId}/evals/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
