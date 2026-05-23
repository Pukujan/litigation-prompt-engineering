import { readFile, readdir, access } from "fs/promises";
import { join } from "path";
import { toDocKey } from "../contracts/storageLayout.contract.js";

const SNAPSHOT_CHECKPOINTS = new Set([1, 2, 4, 8, 12, 14]);

export function createGoldenDatasetService({ goldenDatasetDir, caseId = "case_001" }) {
  function docEvalId(docIndex) {
    return `doc_${String(docIndex).padStart(3, "0")}`;
  }

  function snapshotEvalId(docIndex) {
    return `after_doc_${String(docIndex).padStart(3, "0")}`;
  }

  async function readJsonFile(filename) {
    const raw = await readFile(join(goldenDatasetDir, filename), "utf8");
    return JSON.parse(raw);
  }

  async function loadManifest() {
    try {
      return await readJsonFile("case_001.golden-dataset.json");
    } catch {
      return null;
    }
  }

  async function loadDocumentExpected(docIndex) {
    return readJsonFile(`${docEvalId(docIndex)}.expected.json`);
  }

  async function loadSnapshotExpected(docIndex) {
    if (!SNAPSHOT_CHECKPOINTS.has(docIndex)) {
      return null;
    }
    return readJsonFile(`${snapshotEvalId(docIndex)}.expected.json`);
  }

  async function loadNegativeGuardrails() {
    return readJsonFile("negative_guardrails.expected.json");
  }

  async function loadComparisonConfig() {
    try {
      return await readJsonFile("eval_comparison_config.json");
    } catch {
      return null;
    }
  }

  async function listAvailableFixtures() {
    const files = await readdir(goldenDatasetDir);
    return files.filter((name) => name.endsWith(".expected.json") || name.endsWith(".json"));
  }

  function hasSnapshotCheckpoint(docIndex) {
    return SNAPSHOT_CHECKPOINTS.has(docIndex);
  }

  function goldenParsedDir(docIndex) {
    return join(goldenDatasetDir, "parsed", toDocKey(docIndex));
  }

  async function hasGoldenParsed(docIndex) {
    try {
      await access(join(goldenParsedDir(docIndex), "extraction-quality.expected.json"));
      return true;
    } catch {
      return false;
    }
  }

  return {
    caseId,
    goldenDatasetDir,
    docEvalId,
    snapshotEvalId,
    loadManifest,
    loadDocumentExpected,
    loadSnapshotExpected,
    loadNegativeGuardrails,
    loadComparisonConfig,
    listAvailableFixtures,
    hasSnapshotCheckpoint,
    goldenParsedDir,
    hasGoldenParsed,
    snapshotCheckpoints: [...SNAPSHOT_CHECKPOINTS]
  };
}
