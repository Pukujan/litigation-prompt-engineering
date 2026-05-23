import { cp, mkdir, writeFile, readdir, readFile, access } from "fs/promises";
import { join, relative } from "path";
import { AppError } from "../../../shared/http/errors.js";
import {
  discoverBatchesForGoldenCase,
  discoverBatchesWithEvals
} from "../utils/caseBatchDiscovery.js";

export { discoverBatchesForGoldenCase, discoverBatchesWithEvals } from "../utils/caseBatchDiscovery.js";

function summarizeReports(reports) {
  return {
    pass: reports.filter((r) => r.status === "pass").length,
    partial: reports.filter((r) => r.status === "partial").length,
    fail: reports.filter((r) => r.status === "fail").length,
    criticalFailureCount: reports.reduce(
      (n, r) => n + (r.criticalFailures?.length ?? 0),
      0
    )
  };
}

function sanitizeBundleName(name) {
  if (!name) return null;
  const cleaned = String(name)
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || null;
}

function defaultBundleId(batchIds) {
  if (batchIds.length === 1) {
    return `${batchIds[0]}-evals`;
  }
  return `eval-bundle-${batchIds.join("-")}`.slice(0, 96);
}

function defaultCaseBundleId(goldenCaseId) {
  return `${goldenCaseId}-case-evals`;
}

export async function copyGoldenFixtures(goldenDatasetDir, destGoldenDir) {
  await mkdir(destGoldenDir, { recursive: true });
  const files = await readdir(goldenDatasetDir);
  const copied = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    await cp(join(goldenDatasetDir, file), join(destGoldenDir, file));
    copied.push(file);
  }
  return copied.sort();
}

async function readLegalCaseId(goldenDatasetDir) {
  try {
    const raw = await readFile(join(goldenDatasetDir, "case_001.golden-dataset.json"), "utf8");
    const manifest = JSON.parse(raw);
    return manifest?.caseIdentity?.caseId ?? null;
  } catch {
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
}

export function createEvalBundleService({
  store,
  bundleRootDir,
  repoRoot,
  resolveGoldenDatasetDir
}) {
  async function ensureBundleDir(bundleId) {
    await mkdir(bundleRootDir, { recursive: true });
    const basePath = join(bundleRootDir, bundleId);
    try {
      await mkdir(basePath, { recursive: false });
      return { bundleId, bundlePath: basePath };
    } catch (error) {
      if (error?.code !== "EEXIST") {
        throw error;
      }
      const suffixed = `${bundleId}-${Date.now()}`;
      const suffixedPath = join(bundleRootDir, suffixed);
      await mkdir(suffixedPath, { recursive: true });
      return { bundleId: suffixed, bundlePath: suffixedPath };
    }
  }

  async function collectBatchMeta(batchIds) {
    const batchesMeta = [];
    let totalFiles = 0;

    for (const batchId of batchIds) {
      await store.assertBatchExists(batchId);
      const reportFiles = await store.listEvalReports(batchId);
      if (!reportFiles.length) {
        throw new AppError(`No eval reports found for batch: ${batchId}`, 404);
      }
      const reports = await store.listAllEvalReports(batchId);
      batchesMeta.push({
        batchId,
        reportCount: reportFiles.length,
        files: reportFiles,
        summary: summarizeReports(reports),
        runMetadata: reports[0]?.runMetadata ?? null
      });
      totalFiles += reportFiles.length;
    }

    return { batchesMeta, totalFiles };
  }

  async function copyBatchRuns(bundlePath, batchesMeta, runsSubdir = "batches") {
    for (const { batchId, files } of batchesMeta) {
      const destDir = join(bundlePath, runsSubdir, batchId);
      await mkdir(destDir, { recursive: true });
      for (const file of files) {
        const src = join(store.batchRootDir, batchId, "evals", file);
        await cp(src, join(destDir, file));
      }
    }
  }

  async function bundleEvals({ batchIds, bundleName }) {
    if (!batchIds?.length) {
      throw new AppError("At least one batchId is required", 400);
    }

    const uniqueBatchIds = [
      ...new Set(batchIds.map((id) => String(id).trim()).filter(Boolean))
    ];

    const { batchesMeta, totalFiles } = await collectBatchMeta(uniqueBatchIds);
    const requestedId = sanitizeBundleName(bundleName) || defaultBundleId(uniqueBatchIds);
    const { bundleId, bundlePath } = await ensureBundleDir(requestedId);

    await copyBatchRuns(bundlePath, batchesMeta, "batches");

    const relativePath = relative(repoRoot, bundlePath);
    const manifest = {
      bundleType: "batch",
      bundleId,
      createdAt: new Date().toISOString(),
      relativePath,
      absolutePath: bundlePath,
      batchIds: uniqueBatchIds,
      totalReportFiles: totalFiles,
      batches: batchesMeta
    };

    await writeFile(join(bundlePath, "manifest.json"), JSON.stringify(manifest, null, 2));

    return manifest;
  }

  async function bundleCaseEvals({
    goldenCaseId,
    batchIds,
    bundleName,
    includeGolden = true
  }) {
    const caseKey = String(goldenCaseId || "").trim();
    if (!caseKey) {
      throw new AppError("goldenCaseId is required", 400);
    }

    const goldenDatasetDir = resolveGoldenDatasetDir(caseKey);
    try {
      await access(goldenDatasetDir);
    } catch {
      throw new AppError(`Golden dataset not found for case: ${caseKey}`, 404);
    }

    let uniqueBatchIds = batchIds?.length
      ? [...new Set(batchIds.map((id) => String(id).trim()).filter(Boolean))]
      : await discoverBatchesForGoldenCase(store.batchRootDir, caseKey);

    if (!uniqueBatchIds.length) {
      throw new AppError(
        `No batches with eval reports found for golden case: ${caseKey}`,
        404
      );
    }

    const { batchesMeta, totalFiles } = await collectBatchMeta(uniqueBatchIds);
    const requestedId =
      sanitizeBundleName(bundleName) || defaultCaseBundleId(caseKey);
    const { bundleId, bundlePath } = await ensureBundleDir(requestedId);

    let goldenFiles = [];
    if (includeGolden) {
      goldenFiles = await copyGoldenFixtures(
        goldenDatasetDir,
        join(bundlePath, "golden")
      );
    }

    await copyBatchRuns(bundlePath, batchesMeta, "runs");

    const legalCaseId = await readLegalCaseId(goldenDatasetDir);
    const relativePath = relative(repoRoot, bundlePath);
    const manifest = {
      bundleType: "case",
      bundleId,
      createdAt: new Date().toISOString(),
      relativePath,
      absolutePath: bundlePath,
      goldenCaseId: caseKey,
      legalCaseId,
      includeGolden,
      goldenFiles,
      batchIds: uniqueBatchIds,
      totalReportFiles: totalFiles,
      runs: batchesMeta
    };

    await writeFile(join(bundlePath, "manifest.json"), JSON.stringify(manifest, null, 2));

    return manifest;
  }

  return { bundleEvals, bundleCaseEvals };
}
