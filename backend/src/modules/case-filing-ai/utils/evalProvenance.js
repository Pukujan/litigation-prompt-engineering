/**
 * Attach pipeline / cache / rule provenance fields to eval reports (005 v2 Phase 5).
 *
 * @param {Record<string, unknown>} report
 * @param {Record<string, unknown>} [documentResult]
 */
export function attachEvalProvenance(report, documentResult = {}) {
  report.parsedDocumentCacheUsed = documentResult.parsedDocumentCacheUsed ?? null;
  report.textSourceUsed = documentResult.textSourceUsed ?? null;
  report.reviewStatusAtEvalTime = documentResult.reviewStatusAtEvalTime ?? null;
  report.pipelineVersions = documentResult.pipelineVersions ?? null;
  report.ruleSourcesChecked = documentResult.ruleSourcesChecked ?? [];
  report.ruleAuthorityFailures = report.ruleAuthorityFailures ?? [];
  report.parsedGoldenFailures = report.parsedGoldenFailures ?? [];
}
