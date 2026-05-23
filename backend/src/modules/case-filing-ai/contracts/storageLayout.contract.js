/** @readonly */
export const BATCH_LAYOUT_VERSION = "v001";

export const BATCH_SUBDIRS = {
  uploads: "uploads",
  parsedDocuments: "parsed-documents",
  outputs: "outputs",
  evals: "evals",
  rule: "rule",
  processingLog: "processing-log.jsonl",
  caseSnapshot: "case-snapshot.json"
};

export const BATCH_ROOT_KEY = "batches";

/**
 * @param {number|string} docIndexOrKey
 * @returns {string} doc-001
 */
export function toDocKey(docIndexOrKey) {
  if (typeof docIndexOrKey === "string" && docIndexOrKey.startsWith("doc-")) {
    return docIndexOrKey;
  }
  const n = Number(docIndexOrKey);
  return `doc-${String(n).padStart(3, "0")}`;
}

/**
 * @param {string} docKey
 * @returns {string} doc_001
 */
export function toEvalId(docKey) {
  return String(docKey).replace(/-/g, "_");
}

/**
 * @param {string} evalId
 * @returns {string} doc-001
 */
export function evalIdToDocKey(evalId) {
  return String(evalId).replace(/_/g, "-");
}
