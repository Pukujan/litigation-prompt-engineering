import { cp, mkdir, readdir, readFile, rm, stat, access, writeFile } from "fs/promises";
import { join, relative } from "path";
import { AppError } from "../../../shared/http/errors.js";
import {
  discoverBatchesForGoldenCase,
  listAllBatchIds,
  readFirstEvalReportCaseId
} from "../utils/caseBatchDiscovery.js";
import { copyGoldenFixtures } from "./evalBundle.service.js";

const BATCH_SECTIONS = ["uploads", "outputs", "evals", "rule"];

function sanitizeExportName(name) {
  if (!name) return null;
  const cleaned = String(name)
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || null;
}

async function readLegalCaseId(goldenDatasetDir) {
  try {
    const files = await readdir(goldenDatasetDir);
    const manifestFile = files.find((f) => f.endsWith(".golden-dataset.json"));
    if (!manifestFile) return null;
    const raw = await readFile(join(goldenDatasetDir, manifestFile), "utf8");
    const manifest = JSON.parse(raw);
    return manifest?.caseIdentity?.caseId ?? null;
  } catch {
    return null;
  }
}

async function dirExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(rootDir) {
  const results = [];
  async function walk(current, prefix = "") {
    let entries = [];
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full, rel);
      } else if (entry.isFile()) {
        const info = await stat(full);
        results.push({ path: rel, sizeBytes: info.size });
      }
    }
  }
  await walk(rootDir);
  return results;
}

async function summarizeBatch(batchRootDir, batchId) {
  const batchPath = join(batchRootDir, batchId);
  const caseId = await readFirstEvalReportCaseId(batchRootDir, batchId);
  const sections = {};
  let fileCount = 0;
  let totalBytes = 0;

  for (const section of BATCH_SECTIONS) {
    const sectionPath = join(batchPath, section);
    if (await dirExists(sectionPath)) {
      const files = await walkFiles(sectionPath);
      sections[section] = { fileCount: files.length, sizeBytes: files.reduce((n, f) => n + f.sizeBytes, 0) };
      fileCount += files.length;
      totalBytes += sections[section].sizeBytes;
    }
  }

  for (const rootFile of ["case-snapshot.json", "processing-log.jsonl"]) {
    const filePath = join(batchPath, rootFile);
    try {
      const info = await stat(filePath);
      sections[rootFile] = { sizeBytes: info.size };
      fileCount += 1;
      totalBytes += info.size;
    } catch {
      // optional
    }
  }

  return {
    batchId,
    batchPath,
    caseId,
    caseIdSource: caseId ? "eval_report" : "unknown",
    sections,
    fileCount,
    totalBytes
  };
}

export function createCaseDataService({
  store,
  caseExportRootDir,
  repoRoot,
  resolveGoldenDatasetDir
}) {
  async function resolveGoldenDir(goldenCaseId) {
    const goldenDatasetDir = resolveGoldenDatasetDir(goldenCaseId);
    try {
      await access(goldenDatasetDir);
    } catch {
      throw new AppError(`Golden dataset not found for case: ${goldenCaseId}`, 404);
    }
    return goldenDatasetDir;
  }

  async function resolveBatchIds(goldenCaseId, batchIds) {
    if (batchIds?.length) {
      const unique = [...new Set(batchIds.map((id) => String(id).trim()).filter(Boolean))];
      for (const batchId of unique) {
        await store.assertBatchExists(batchId);
      }
      return unique;
    }
    const discovered = await discoverBatchesForGoldenCase(store.batchRootDir, goldenCaseId);
    return discovered;
  }

  async function getCaseInventory(goldenCaseId) {
    const caseKey = String(goldenCaseId || "").trim();
    if (!caseKey) {
      throw new AppError("goldenCaseId is required", 400);
    }

    const goldenDatasetDir = await resolveGoldenDir(caseKey);
    const legalCaseId = await readLegalCaseId(goldenDatasetDir);
    const allBatchIds = await listAllBatchIds(store.batchRootDir);
    const batches = [];

    for (const batchId of allBatchIds) {
      batches.push(await summarizeBatch(store.batchRootDir, batchId));
    }

    const matchedBatchIds = batches
      .filter((b) => b.caseId === caseKey)
      .map((b) => b.batchId);

    const unmatchedWithData = batches.filter((b) => !b.caseId && b.fileCount > 0);

    return {
      goldenCaseId: caseKey,
      legalCaseId,
      batchRootDir: store.batchRootDir,
      matchedBatchIds,
      unmatchedBatchIds: batches
        .filter((b) => b.caseId && b.caseId !== caseKey)
        .map((b) => ({ batchId: b.batchId, caseId: b.caseId })),
      unclassifiedBatchIds: unmatchedWithData.map((b) => b.batchId),
      batches,
      totals: {
        batchCount: batches.length,
        matchedBatchCount: matchedBatchIds.length,
        fileCount: batches.reduce((n, b) => n + b.fileCount, 0),
        sizeBytes: batches.reduce((n, b) => n + b.sizeBytes, 0)
      }
    };
  }

  async function exportCase({
    goldenCaseId,
    batchIds,
    exportName,
    includeGolden = false
  }) {
    const caseKey = String(goldenCaseId || "").trim();
    if (!caseKey) {
      throw new AppError("goldenCaseId is required", 400);
    }

    const uniqueBatchIds = await resolveBatchIds(caseKey, batchIds);
    if (!uniqueBatchIds.length) {
      throw new AppError(
        `No batches found for case ${caseKey}. Pass batchIds explicitly or run evals first.`,
        404
      );
    }

    const exportId = sanitizeExportName(exportName) || `${caseKey}-export`;
    await mkdir(caseExportRootDir, { recursive: true });
    const exportPath = join(caseExportRootDir, exportId);
    await mkdir(exportPath, { recursive: true });

    const goldenDatasetDir = await resolveGoldenDir(caseKey);
    let goldenFiles = [];
    if (includeGolden) {
      goldenFiles = await copyGoldenFixtures(goldenDatasetDir, join(exportPath, "golden"));
    }

    const exportedBatches = [];
    for (const batchId of uniqueBatchIds) {
      const src = join(store.batchRootDir, batchId);
      const dest = join(exportPath, "batches", batchId);
      await mkdir(join(exportPath, "batches"), { recursive: true });
      await cp(src, dest, { recursive: true, force: true });
      const summary = await summarizeBatch(store.batchRootDir, batchId);
      exportedBatches.push({
        batchId,
        fileCount: summary.fileCount,
        sizeBytes: summary.totalBytes
      });
    }

    const legalCaseId = await readLegalCaseId(goldenDatasetDir);
    const manifest = {
      exportId,
      exportType: "case_full",
      createdAt: new Date().toISOString(),
      relativePath: relative(repoRoot, exportPath),
      absolutePath: exportPath,
      goldenCaseId: caseKey,
      legalCaseId,
      includeGolden,
      goldenFiles,
      batchIds: uniqueBatchIds,
      batches: exportedBatches,
      totalFiles: exportedBatches.reduce((n, b) => n + b.fileCount, 0),
      totalBytes: exportedBatches.reduce((n, b) => n + b.sizeBytes, 0)
    };

    await writeFile(join(exportPath, "manifest.json"), JSON.stringify(manifest, null, 2));

    return manifest;
  }

  async function deleteCase({ goldenCaseId, batchIds, confirm = false, dryRun = false }) {
    const caseKey = String(goldenCaseId || "").trim();
    if (!caseKey) {
      throw new AppError("goldenCaseId is required", 400);
    }

    if (!confirm && !dryRun) {
      throw new AppError(
        'Deletion requires confirm: true in the request body, or dryRun: true to preview',
        400
      );
    }

    const uniqueBatchIds = await resolveBatchIds(caseKey, batchIds);
    if (!uniqueBatchIds.length) {
      throw new AppError(`No batches found for case ${caseKey}`, 404);
    }

    const targets = [];
    for (const batchId of uniqueBatchIds) {
      const batchPath = join(store.batchRootDir, batchId);
      const summary = await summarizeBatch(store.batchRootDir, batchId);
      targets.push({
        batchId,
        path: batchPath,
        fileCount: summary.fileCount,
        sizeBytes: summary.totalBytes
      });
    }

    if (!dryRun) {
      for (const { path: batchPath } of targets) {
        await rm(batchPath, { recursive: true, force: true });
      }
    }

    return {
      goldenCaseId: caseKey,
      dryRun,
      deleted: !dryRun,
      batchIds: uniqueBatchIds,
      targets,
      totalFiles: targets.reduce((n, t) => n + t.fileCount, 0),
      totalBytes: targets.reduce((n, t) => n + t.sizeBytes, 0),
      note: dryRun
        ? "No files removed. Set confirm: true to delete."
        : "Batch folders removed from disk. Golden fixtures in evals/golden/ were not deleted."
    };
  }

  return {
    getCaseInventory,
    exportCase,
    deleteCase
  };
}
