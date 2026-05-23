import { join } from "path";
import { BATCH_SUBDIRS } from "../contracts/storageLayout.contract.js";
import { PARSED_FILES } from "../contracts/parsedDocumentArtifacts.contract.js";

/**
 * @param {{ batchRootDir: string, goldenRootDir?: string, ruleFixturesRoot?: string }} roots
 */
export function createStoragePaths({ batchRootDir, goldenRootDir, ruleFixturesRoot }) {
  function batchDir(batchId) {
    return join(batchRootDir, batchId);
  }

  function parsedDocDir(batchId, docKey) {
    return join(batchDir(batchId), BATCH_SUBDIRS.parsedDocuments, docKey);
  }

  function parsedFile(batchId, docKey, fileName) {
    return join(parsedDocDir(batchId, docKey), fileName);
  }

  return {
    batchRootDir,
    goldenRootDir,
    ruleFixturesRoot,
    batchDir,
    uploadsDir: (batchId) => join(batchDir(batchId), BATCH_SUBDIRS.uploads),
    outputsDir: (batchId) => join(batchDir(batchId), BATCH_SUBDIRS.outputs),
    evalsDir: (batchId) => join(batchDir(batchId), BATCH_SUBDIRS.evals),
    ruleDir: (batchId) => join(batchDir(batchId), BATCH_SUBDIRS.rule),
    processingLogPath: (batchId) => join(batchDir(batchId), BATCH_SUBDIRS.processingLog),
    caseSnapshotPath: (batchId) => join(batchDir(batchId), BATCH_SUBDIRS.caseSnapshot),
    outputPath: (batchId, docKey) => join(batchDir(batchId), BATCH_SUBDIRS.outputs, `${docKey}.json`),
    evalReportPath: (batchId, evalId) =>
      join(batchDir(batchId), BATCH_SUBDIRS.evals, `${evalId}.eval-report.json`),
    parsedDocDir,
    parsedFile,
    parsedPaths: (batchId, docKey) => ({
      dir: parsedDocDir(batchId, docKey),
      embeddedText: parsedFile(batchId, docKey, PARSED_FILES.embeddedText),
      ocrText: parsedFile(batchId, docKey, PARSED_FILES.ocrText),
      finalParsedText: parsedFile(batchId, docKey, PARSED_FILES.finalParsedText),
      humanReviewedText: parsedFile(batchId, docKey, PARSED_FILES.humanReviewedText),
      extractionQuality: parsedFile(batchId, docKey, PARSED_FILES.extractionQuality),
      pageMap: parsedFile(batchId, docKey, PARSED_FILES.pageMap),
      parseMetadata: parsedFile(batchId, docKey, PARSED_FILES.parseMetadata),
      reviewStatus: parsedFile(batchId, docKey, PARSED_FILES.reviewStatus),
      auditLog: parsedFile(batchId, docKey, PARSED_FILES.auditLog)
    })
  };
}
