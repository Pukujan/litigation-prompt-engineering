import { createHash } from "crypto";
import { mkdir, readFile, writeFile, appendFile, readdir } from "fs/promises";
import { join } from "path";
import { BATCH_SUBDIRS } from "../contracts/storageLayout.contract.js";
import {
  DEFAULT_REVIEW_STATUS,
  PARSED_AUDIT_EVENTS,
  PARSED_FILES
} from "../contracts/parsedDocumentArtifacts.contract.js";
import { buildPipelineVersions, OCR_VERSION, PARSER_VERSION } from "../contracts/pipelineVersions.js";

function hashBuffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function readJson(path, fallback) {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(path, data) {
  await writeFile(path, JSON.stringify(data, null, 2));
}

/**
 * @param {{ storagePaths: ReturnType<import('../utils/storagePaths.js').createStoragePaths>, documentText: { extractLayers: Function }, getPipelineVersions?: () => object }} deps
 */
export function createParsedDocumentCacheService({
  storagePaths,
  documentText,
  getPipelineVersions = () => buildPipelineVersions()
}) {
  async function appendAudit(batchId, docKey, event, payload = {}) {
    const { auditLog } = storagePaths.parsedPaths(batchId, docKey);
    const line =
      JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        docKey,
        ...payload
      }) + "\n";
    await appendFile(auditLog, line, "utf8");
  }

  async function cacheHit(batchId, docKey, sourceFileHash, versions) {
    const paths = storagePaths.parsedPaths(batchId, docKey);
    const meta = await readJson(paths.parseMetadata, null);
    if (!meta) return null;
    if (meta.sourceFileHash !== sourceFileHash) return null;
    if (meta.parserVersion !== versions.parser) return null;
    if (meta.ocrVersion !== versions.ocr) return null;

    const review = await readJson(paths.reviewStatus, { ...DEFAULT_REVIEW_STATUS });
    let text = "";
    let textSourceUsed = "final-parsed";

    if (review.status === "human_reviewed") {
      try {
        text = (await readFile(paths.humanReviewedText, "utf8")).trim();
        textSourceUsed = "human-reviewed";
      } catch {
        /* fall through */
      }
    }
    if (!text) {
      try {
        text = (await readFile(paths.finalParsedText, "utf8")).trim();
      } catch {
        return null;
      }
    }

    const extractionQuality = await readJson(paths.extractionQuality, {});
    await appendAudit(batchId, docKey, PARSED_AUDIT_EVENTS.cacheReused, {
      textSourceUsed,
      pipelineVersions: versions
    });

    return {
      text,
      textSourceUsed,
      extractionQuality,
      pageCount: meta.pageCount ?? null,
      fileKind: meta.fileKind ?? null,
      cacheUsed: true,
      pipelineVersions: versions
    };
  }

  async function writeArtifacts(batchId, docKey, layers, sourceFileHash, versions) {
    const paths = storagePaths.parsedPaths(batchId, docKey);
    await mkdir(paths.dir, { recursive: true });

    await writeFile(paths.embeddedText, layers.embeddedText ?? "", "utf8");
    if (layers.ocrText) {
      await writeFile(paths.ocrText, layers.ocrText, "utf8");
      await appendAudit(batchId, docKey, PARSED_AUDIT_EVENTS.ocrTextCreated, {
        pipelineVersions: versions
      });
    }
    await writeFile(paths.finalParsedText, layers.finalText ?? "", "utf8");
    await writeJson(paths.extractionQuality, layers.extractionQuality ?? {});
    await writeJson(paths.pageMap, layers.pageMap ?? { pages: [] });
    await writeJson(paths.parseMetadata, {
      sourceFileHash,
      parserVersion: versions.parser,
      ocrVersion: versions.ocr,
      pipelineVersions: versions,
      pageCount: layers.pageCount ?? null,
      fileKind: layers.fileKind ?? null,
      createdAt: new Date().toISOString()
    });
    await writeJson(paths.reviewStatus, { ...DEFAULT_REVIEW_STATUS });

    await appendAudit(batchId, docKey, PARSED_AUDIT_EVENTS.parsedTextCreated, {
      pipelineVersions: versions
    });
  }

  /**
   * @param {string} batchId
   * @param {string} docKey
   * @param {Buffer} buffer
   * @param {{ originalname: string, mimetype?: string }} fileMeta
   */
  async function getOrExtract(batchId, docKey, buffer, fileMeta) {
    const versions = {
      ...getPipelineVersions(),
      parser: PARSER_VERSION,
      ocr: OCR_VERSION
    };
    const sourceFileHash = hashBuffer(buffer);
    const hit = await cacheHit(batchId, docKey, sourceFileHash, versions);
    if (hit) return hit;

    const layers = await documentText.extractLayers(buffer, fileMeta);
    await writeArtifacts(batchId, docKey, layers, sourceFileHash, versions);

    return {
      text: layers.finalText,
      textSourceUsed: layers.ocrText ? "ocr" : "embedded",
      extractionQuality: layers.extractionQuality,
      pageCount: layers.pageCount,
      fileKind: layers.fileKind,
      cacheUsed: false,
      pipelineVersions: versions
    };
  }

  async function getReviewStatus(batchId, docKey) {
    const { reviewStatus } = storagePaths.parsedPaths(batchId, docKey);
    return readJson(reviewStatus, { ...DEFAULT_REVIEW_STATUS });
  }

  async function updateReviewStatus(batchId, docKey, patch) {
    const paths = storagePaths.parsedPaths(batchId, docKey);
    const current = await readJson(paths.reviewStatus, { ...DEFAULT_REVIEW_STATUS });
    const next = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString()
    };
    await writeJson(paths.reviewStatus, next);
    await appendAudit(batchId, docKey, PARSED_AUDIT_EVENTS.reviewStatusUpdated, {
      status: next.status
    });
    return next;
  }

  async function listParsedDocuments(batchId) {
    const base = join(storagePaths.batchDir(batchId), BATCH_SUBDIRS.parsedDocuments);
    try {
      const entries = await readdir(base);
      return entries.filter((e) => e.startsWith("doc-")).sort();
    } catch {
      return [];
    }
  }

  async function getParsedDetail(batchId, docKey) {
    const paths = storagePaths.parsedPaths(batchId, docKey);
    const reviewStatus = await readJson(paths.reviewStatus, { ...DEFAULT_REVIEW_STATUS });
    const parseMetadata = await readJson(paths.parseMetadata, null);
    const extractionQuality = await readJson(paths.extractionQuality, {});
    let finalParsedText = "";
    try {
      finalParsedText = await readFile(paths.finalParsedText, "utf8");
    } catch {
      /* empty */
    }
    return {
      docKey,
      reviewStatus,
      parseMetadata,
      extractionQuality,
      finalParsedTextLength: finalParsedText.length
    };
  }

  return {
    getOrExtract,
    getReviewStatus,
    updateReviewStatus,
    listParsedDocuments,
    getParsedDetail,
    appendAudit
  };
}
