/** @readonly */
export const PARSED_ARTIFACTS_VERSION = "v001";

export const PARSED_FILES = {
  embeddedText: "embedded-text.txt",
  ocrText: "ocr-text.txt",
  finalParsedText: "final-parsed-text.txt",
  humanReviewedText: "human-reviewed-text.txt",
  extractionQuality: "extraction-quality.json",
  pageMap: "page-map.json",
  parseMetadata: "parse-metadata.json",
  reviewStatus: "review-status.json",
  auditLog: "audit-log.jsonl"
};

/** @readonly */
export const PARSED_AUDIT_EVENTS = {
  parsedTextCreated: "parsed_text_created",
  ocrTextCreated: "ocr_text_created",
  cacheReused: "cache_reused",
  reviewStatusUpdated: "review_status_updated",
  documentProcessed: "document_processed"
};

export const DEFAULT_REVIEW_STATUS = {
  status: "ai_extracted_unreviewed",
  preferredSource: "final-parsed",
  updatedAt: null,
  updatedBy: null
};
