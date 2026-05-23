import { mkdir, writeFile, readFile, readdir, appendFile } from "fs/promises";
import { join } from "path";
import { AppError } from "../../../shared/http/errors.js";

const EMPTY_SNAPSHOT = {
  snapshotId: null,
  caseId: null,
  afterDocNo: null,
  currentPhase: null,
  currentMiniPhase: null,
  confirmedFacts: [],
  carriedForwardContext: [],
  openTasks: [],
  completedTasks: [],
  conditionalTasks: [],
  deadlines: [],
  supersededDeadlines: [],
  unresolvedHumanReviewItems: [],
  conflicts: [],
  auditNotes: []
};

export function createLocalJsonStore({ batchRootDir }) {
  function batchDir(batchId) {
    return join(batchRootDir, batchId);
  }

  async function ensureBatchDirs(batchId) {
    const root = batchDir(batchId);
    await mkdir(join(root, "rule"), { recursive: true });
    await mkdir(join(root, "uploads"), { recursive: true });
    await mkdir(join(root, "outputs"), { recursive: true });
    await mkdir(join(root, "evals"), { recursive: true });
    await mkdir(join(root, "parsed-documents"), { recursive: true });
    return root;
  }

  async function createBatch(batchId) {
    await ensureBatchDirs(batchId);
    const snapshotPath = join(batchDir(batchId), "case-snapshot.json");
    await writeFile(snapshotPath, JSON.stringify({ ...EMPTY_SNAPSHOT }, null, 2));
    return batchId;
  }

  async function savePartRule(batchId, partRuleText) {
    await ensureBatchDirs(batchId);
    const rulePath = join(batchDir(batchId), "rule", "part-rules.txt");
    await writeFile(rulePath, partRuleText, "utf8");
    return rulePath;
  }

  async function readPartRule(batchId) {
    const rulePath = join(batchDir(batchId), "rule", "part-rules.txt");
    return readFile(rulePath, "utf8");
  }

  async function saveRuleOriginal(batchId, storedName, buffer) {
    await ensureBatchDirs(batchId);
    const originalPath = join(batchDir(batchId), "rule", storedName);
    await writeFile(originalPath, buffer);
    return originalPath;
  }

  async function saveRuleExtraction(batchId, metadata) {
    await ensureBatchDirs(batchId);
    const extractionPath = join(batchDir(batchId), "rule", "part-rules-extraction.json");
    await writeFile(extractionPath, JSON.stringify(metadata, null, 2));
    return extractionPath;
  }

  async function readRuleExtraction(batchId) {
    const extractionPath = join(batchDir(batchId), "rule", "part-rules-extraction.json");
    try {
      const raw = await readFile(extractionPath, "utf8");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async function saveRuleParsed(batchId, parsed) {
    await ensureBatchDirs(batchId);
    const parsedPath = join(batchDir(batchId), "rule", "part-rules-parsed.json");
    await writeFile(parsedPath, JSON.stringify(parsed, null, 2));
    return parsedPath;
  }

  async function readRuleParsed(batchId) {
    const parsedPath = join(batchDir(batchId), "rule", "part-rules-parsed.json");
    try {
      const raw = await readFile(parsedPath, "utf8");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async function saveUpload(batchId, storedName, buffer) {
    await ensureBatchDirs(batchId);
    const uploadPath = join(batchDir(batchId), "uploads", storedName);
    await writeFile(uploadPath, buffer);
    return uploadPath;
  }

  async function listUploads(batchId) {
    const uploadsDir = join(batchDir(batchId), "uploads");
    try {
      const files = await readdir(uploadsDir);
      return files.filter((f) => !f.startsWith(".")).sort();
    } catch {
      return [];
    }
  }

  async function readUpload(batchId, storedName) {
    const uploadPath = join(batchDir(batchId), "uploads", storedName);
    return readFile(uploadPath);
  }

  async function readCaseSnapshot(batchId) {
    const snapshotPath = join(batchDir(batchId), "case-snapshot.json");
    try {
      const raw = await readFile(snapshotPath, "utf8");
      return JSON.parse(raw);
    } catch {
      return { ...EMPTY_SNAPSHOT };
    }
  }

  async function writeCaseSnapshot(batchId, snapshot) {
    await ensureBatchDirs(batchId);
    const snapshotPath = join(batchDir(batchId), "case-snapshot.json");
    await writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));
    return snapshot;
  }

  async function saveDocumentOutput(batchId, docKey, result) {
    await ensureBatchDirs(batchId);
    const outputPath = join(batchDir(batchId), "outputs", `${docKey}.json`);
    await writeFile(outputPath, JSON.stringify(result, null, 2));
    return outputPath;
  }

  async function listDocumentOutputs(batchId) {
    const outputsDir = join(batchDir(batchId), "outputs");
    try {
      const files = await readdir(outputsDir);
      return files.filter((f) => f.endsWith(".json")).sort();
    } catch {
      return [];
    }
  }

  async function readDocumentOutput(batchId, docKey) {
    const outputPath = join(batchDir(batchId), "outputs", `${docKey}.json`);
    const raw = await readFile(outputPath, "utf8");
    return JSON.parse(raw);
  }

  async function saveEvalReport(batchId, evalId, report) {
    await ensureBatchDirs(batchId);
    const reportPath = join(batchDir(batchId), "evals", `${evalId}.eval-report.json`);
    await writeFile(reportPath, JSON.stringify(report, null, 2));
    return reportPath;
  }

  async function listEvalReports(batchId) {
    const evalsDir = join(batchDir(batchId), "evals");
    try {
      const files = await readdir(evalsDir);
      return files.filter((f) => f.endsWith(".eval-report.json")).sort();
    } catch {
      return [];
    }
  }

  async function readEvalReport(batchId, evalId) {
    const reportPath = join(batchDir(batchId), "evals", `${evalId}.eval-report.json`);
    const raw = await readFile(reportPath, "utf8");
    return JSON.parse(raw);
  }

  async function listAllEvalReports(batchId) {
    const files = await listEvalReports(batchId);
    const reports = [];
    for (const file of files) {
      const evalId = file.replace(".eval-report.json", "");
      reports.push(await readEvalReport(batchId, evalId));
    }
    return reports;
  }

  async function appendProcessingLog(batchId, entry) {
    await ensureBatchDirs(batchId);
    const logPath = join(batchDir(batchId), "processing-log.jsonl");
    const line = JSON.stringify({ ...entry, timestamp: new Date().toISOString() }) + "\n";
    await appendFile(logPath, line, "utf8");
  }

  async function readProcessingLog(batchId) {
    const logPath = join(batchDir(batchId), "processing-log.jsonl");
    try {
      const raw = await readFile(logPath, "utf8");
      return raw
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line));
    } catch {
      return [];
    }
  }

  async function batchExists(batchId) {
    try {
      await readFile(join(batchDir(batchId), "case-snapshot.json"), "utf8");
      return true;
    } catch {
      return false;
    }
  }

  async function assertBatchExists(batchId) {
    if (!(await batchExists(batchId))) {
      throw new AppError(`Batch not found: ${batchId}`, 404);
    }
  }

  return {
    batchRootDir,
    createBatch,
    savePartRule,
    readPartRule,
    saveRuleOriginal,
    saveRuleExtraction,
    readRuleExtraction,
    saveRuleParsed,
    readRuleParsed,
    saveUpload,
    listUploads,
    readUpload,
    readCaseSnapshot,
    writeCaseSnapshot,
    saveDocumentOutput,
    listDocumentOutputs,
    readDocumentOutput,
    saveEvalReport,
    listEvalReports,
    readEvalReport,
    listAllEvalReports,
    appendProcessingLog,
    readProcessingLog,
    batchExists,
    assertBatchExists,
    emptySnapshot: () => ({ ...EMPTY_SNAPSHOT })
  };
}
