import { readFile } from "fs/promises";
import { join } from "path";
import { extractPartNumber } from "../../court-rules/utils/catalogToRuleFixtures.js";

/**
 * @param {string} goldenDatasetDir
 */
export async function loadGoldenCaseIdentity(goldenDatasetDir) {
  const files = await readdirSafe(goldenDatasetDir);
  const manifestName = files.find((f) => f.endsWith(".golden-dataset.json"));
  if (!manifestName) return null;

  const raw = await readFile(join(goldenDatasetDir, manifestName), "utf8");
  const manifest = JSON.parse(raw);
  return manifest.caseIdentity ?? null;
}

async function readdirSafe(dir) {
  try {
    const { readdir } = await import("fs/promises");
    return await readdir(dir);
  } catch {
    return [];
  }
}

/**
 * Seed snapshot fields so court-rules matching works on document 1.
 * @param {Record<string, unknown> | null} caseIdentity
 */
export function buildBootstrapSnapshot(caseIdentity) {
  if (!caseIdentity) return null;

  const part = extractPartNumber(caseIdentity.partName) ?? caseIdentity.part ?? null;
  const county = caseIdentity.county ?? null;
  const court = caseIdentity.court ?? null;

  return {
    snapshotId: "snapshot_bootstrap",
    caseId: caseIdentity.caseId ?? null,
    afterDocNo: 0,
    currentPhase: "commencement",
    currentMiniPhase: null,
    county,
    part,
    partName: caseIdentity.partName ?? null,
    court,
    judgeName: caseIdentity.judgeName ?? null,
    caseType: caseIdentity.caseType ?? null,
    case: {
      county,
      part,
      partName: caseIdentity.partName ?? null,
      court,
      judgeName: caseIdentity.judgeName ?? null,
      caseType: caseIdentity.caseType ?? null
    },
    confirmedFacts: [],
    carriedForwardContext: [],
    openTasks: [],
    completedTasks: [],
    conditionalTasks: [],
    deadlines: [],
    supersededDeadlines: [],
    unresolvedHumanReviewItems: [],
    conflicts: [],
    auditNotes: ["Bootstrap case context from golden dataset for rule matching."]
  };
}

/**
 * @param {string} goldenCaseId
 * @param {string} goldenDatasetDir
 */
export async function loadBootstrapSnapshotForGoldenCase(goldenCaseId, goldenDatasetDir) {
  if (!goldenCaseId?.includes("rule_authority")) {
    return null;
  }
  const identity = await loadGoldenCaseIdentity(goldenDatasetDir);
  return buildBootstrapSnapshot(identity);
}
