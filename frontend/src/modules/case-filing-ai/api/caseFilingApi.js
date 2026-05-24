import {
  apiGet,
  apiPost,
  apiPostForm,
  apiPatch,
  apiDelete,
  apiDownload
} from "../../../shared/api/client.js";

export function extractRuleText(file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiPostForm("/api/case-filing-ai/extract-rule-text", formData);
}

export function processBatch(files, partRuleText, partRuleFile = null) {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  formData.append("partRuleText", partRuleText ?? "");
  if (partRuleFile) {
    formData.append("partRuleFile", partRuleFile);
  }
  return apiPostForm("/api/case-filing-ai/process-batch", formData);
}

export function getBatchStatus(batchId) {
  return apiGet(`/api/case-filing-ai/batches/${batchId}/status`);
}

export function getProcessingLog(batchId) {
  return apiGet(`/api/case-filing-ai/batches/${batchId}/processing-log`);
}

export function getPlatformModules() {
  return apiGet("/api/platform/modules");
}

export function buildBatchPackage(batchId, options = {}) {
  return apiPost(`/api/case-filing-ai/batches/${batchId}/package`, options);
}

export function downloadBatchPackage(batchId, options = {}) {
  const params = new URLSearchParams();
  if (options.includeGolden) params.set("includeGolden", "true");
  if (options.goldenCaseId) params.set("goldenCaseId", options.goldenCaseId);
  const qs = params.toString();
  return apiDownload(
    `/api/case-filing-ai/batches/${batchId}/package/download${qs ? `?${qs}` : ""}`,
    `${batchId}-package.zip`
  );
}

export function downloadCaseExport(goldenCaseId, exportId) {
  return apiDownload(
    `/api/case-filing-ai/cases/${goldenCaseId}/export/${exportId}/download`,
    `${exportId}.zip`
  );
}

export function getBatchResults(batchId) {
  return apiGet(`/api/case-filing-ai/batches/${batchId}/results`);
}

export function getBatchEvals(batchId) {
  return apiGet(`/api/case-filing-ai/batches/${batchId}/evals`);
}

export function bundleBatchEvals(batchId, bundleName) {
  return apiPost(`/api/case-filing-ai/batches/${batchId}/evals/bundle`, {
    bundleName
  });
}

export function bundleEvals(batchIds, bundleName) {
  return apiPost("/api/case-filing-ai/evals/bundle", { batchIds, bundleName });
}

export function bundleCaseEvals(goldenCaseId = "case_001", options = {}) {
  const { bundleName, batchIds, includeGolden } = options;
  return apiPost(`/api/case-filing-ai/evals/cases/${goldenCaseId}/bundle`, {
    bundleName,
    batchIds,
    includeGolden
  });
}

export function getCaseInventory(goldenCaseId = "case_001") {
  return apiGet(`/api/case-filing-ai/cases/${goldenCaseId}`);
}

export function exportCase(goldenCaseId = "case_001", options = {}) {
  const { exportName, batchIds, includeGolden } = options;
  return apiPost(`/api/case-filing-ai/cases/${goldenCaseId}/export`, {
    exportName,
    batchIds,
    includeGolden
  });
}

export function deleteCase(goldenCaseId = "case_001", options = {}) {
  const { batchIds, confirm, dryRun } = options;
  return apiDelete(`/api/case-filing-ai/cases/${goldenCaseId}`, {
    batchIds,
    confirm,
    dryRun
  });
}

export function listParsedDocuments(batchId) {
  return apiGet(`/api/case-filing-ai/batches/${batchId}/parsed-documents`);
}

export function getParsedDocument(batchId, documentId) {
  return apiGet(`/api/case-filing-ai/batches/${batchId}/parsed-documents/${documentId}`);
}

export function patchParsedReviewStatus(batchId, documentId, patch) {
  return apiPatch(
    `/api/case-filing-ai/batches/${batchId}/parsed-documents/${documentId}/review-status`,
    patch
  );
}
