import { readdir, readFile } from "fs/promises";
import { join } from "path";

export async function readFirstEvalReportCaseId(batchRootDir, batchId) {
  const evalsDir = join(batchRootDir, batchId, "evals");
  try {
    const files = (await readdir(evalsDir))
      .filter((f) => f.endsWith(".eval-report.json"))
      .sort();
    if (!files.length) return null;
    const raw = await readFile(join(evalsDir, files[0]), "utf8");
    const report = JSON.parse(raw);
    return report.caseId ?? null;
  } catch {
    return null;
  }
}

export async function listAllBatchIds(batchRootDir) {
  try {
    const entries = await readdir(batchRootDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && e.name.startsWith("batch-"))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

export async function discoverBatchesWithEvals(batchRootDir) {
  const batchIds = await listAllBatchIds(batchRootDir);
  const withEvals = [];
  for (const batchId of batchIds) {
    const evalsDir = join(batchRootDir, batchId, "evals");
    try {
      const files = await readdir(evalsDir);
      if (files.some((f) => f.endsWith(".eval-report.json"))) {
        withEvals.push(batchId);
      }
    } catch {
      // no evals folder
    }
  }
  return withEvals;
}

export async function discoverBatchesForGoldenCase(batchRootDir, goldenCaseId) {
  const batchIds = await listAllBatchIds(batchRootDir);
  const matched = [];
  for (const batchId of batchIds) {
    const caseId = await readFirstEvalReportCaseId(batchRootDir, batchId);
    if (caseId === goldenCaseId) {
      matched.push(batchId);
    }
  }
  return matched;
}
