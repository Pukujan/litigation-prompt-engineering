import { readFile, access } from "fs/promises";
import { join } from "path";
import { toDocKey } from "../contracts/storageLayout.contract.js";
import { PARSED_FILES } from "../contracts/parsedDocumentArtifacts.contract.js";

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readJson(path, fallback = null) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

function lengthWithinTolerance(actual, expected, tolerance = 0.15) {
  if (!expected || expected <= 0) return true;
  const ratio = Math.abs(actual - expected) / expected;
  return ratio <= tolerance;
}

/**
 * Compare runtime parsed artifacts under a batch to golden parse baseline.
 *
 * @param {Object} params
 * @param {string} params.batchId
 * @param {number} params.docIndex
 * @param {object} params.storagePaths — from createStoragePaths()
 * @param {object} params.goldenDataset — from createGoldenDatasetService()
 */
export async function runParsedDocumentChecks({
  batchId,
  docIndex,
  storagePaths,
  goldenDataset
}) {
  const failures = [];
  const docKey = toDocKey(docIndex);

  if (!(await goldenDataset.hasGoldenParsed(docIndex))) {
    return failures;
  }

  const goldenDir = goldenDataset.goldenParsedDir(docIndex);
  const runtime = storagePaths.parsedPaths(batchId, docKey);

  const expectedEq = await readJson(
    join(goldenDir, "extraction-quality.expected.json"),
    null
  );
  const actualEq = await readJson(runtime.extractionQuality, {});

  if (expectedEq) {
    if (expectedEq.method && actualEq.method && expectedEq.method !== actualEq.method) {
      failures.push({
        code: "extraction_method_mismatch",
        message: `Expected extraction method ${expectedEq.method}, got ${actualEq.method}`
      });
    }
    if (
      typeof expectedEq.ocr_needed === "boolean" &&
      typeof actualEq.ocr_needed === "boolean" &&
      expectedEq.ocr_needed !== actualEq.ocr_needed
    ) {
      failures.push({
        code: "ocr_needed_mismatch",
        message: `Expected ocr_needed=${expectedEq.ocr_needed}, got ${actualEq.ocr_needed}`
      });
    }
    if (
      typeof expectedEq.textLength === "number" &&
      typeof actualEq.textLength === "number" &&
      !lengthWithinTolerance(actualEq.textLength, expectedEq.textLength)
    ) {
      failures.push({
        code: "text_length_drift",
        message: `Parsed text length ${actualEq.textLength} outside tolerance of golden ${expectedEq.textLength}`
      });
    }
  }

  const expectedReview = await readJson(
    join(goldenDir, "review-status.expected.json"),
    null
  );
  const actualReview = await readJson(runtime.reviewStatus, null);
  if (
    expectedReview?.status &&
    actualReview?.status &&
    expectedReview.status !== actualReview.status &&
    !String(actualReview.status).includes(String(expectedReview.status).split("_")[0])
  ) {
    failures.push({
      code: "review_status_mismatch",
      message: `Review status expected ${expectedReview.status}, got ${actualReview.status}`
    });
  }

  const goldenTextPath = join(goldenDir, PARSED_FILES.finalParsedText);
  if (await exists(goldenTextPath) && (await exists(runtime.finalParsedText))) {
    const goldenText = (await readFile(goldenTextPath, "utf8")).trim();
    const actualText = (await readFile(runtime.finalParsedText, "utf8")).trim();
    if (goldenText.length > 100 && actualText.length > 0) {
      const goldenAnchor = goldenText.slice(0, 120).replace(/\s+/g, " ");
      const actualNorm = actualText.replace(/\s+/g, " ");
      if (!actualNorm.includes(goldenAnchor.slice(0, 60)) && !lengthWithinTolerance(actualText.length, goldenText.length, 0.25)) {
        failures.push({
          code: "final_text_drift",
          message: "Final parsed text length/anchor differs from golden baseline"
        });
      }
    }
  }

  return failures;
}
