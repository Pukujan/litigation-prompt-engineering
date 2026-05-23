/**
 * Map v001 master prompt shape to legacy v1 fields used by evals and snapshot merge.
 * Pass-through when output already matches legacy shape.
 *
 * @param {Record<string, unknown>} raw
 * @returns {Record<string, unknown>}
 */
export function normalizeMasterOutput(raw) {
  if (!raw || typeof raw !== "object") {
    return raw;
  }

  const hasLegacyParties = Array.isArray(raw.parties);
  const hasV001Facts = raw.documentFacts != null || raw.ruleBasedTasks != null;

  if (hasLegacyParties && !hasV001Facts) {
    return raw;
  }

  const documentFacts =
    raw.documentFacts && typeof raw.documentFacts === "object" ? raw.documentFacts : {};

  const ruleBasedTasks = Array.isArray(raw.ruleBasedTasks) ? raw.ruleBasedTasks : [];
  const caseOrderTasks = Array.isArray(raw.caseOrderTasks) ? raw.caseOrderTasks : [];
  const mergedTasks = [...ruleBasedTasks, ...caseOrderTasks];

  const deadlines = Array.isArray(raw.deadlines)
    ? raw.deadlines
    : mergedTasks.filter((t) => t?.dueDate || t?.dueDateStatus);

  return {
    documentMetadata: raw.documentMetadata ?? documentFacts.documentMetadata ?? {},
    extractionQuality: raw.extractionQuality ?? documentFacts.extractionQuality ?? {},
    docketEntry: raw.docketEntry ?? documentFacts.docketEntry ?? {},
    caseUpdates: raw.caseUpdates ?? documentFacts.caseUpdates ?? {},
    parties: raw.parties ?? documentFacts.parties ?? [],
    witnesses: raw.witnesses ?? documentFacts.witnesses ?? [],
    tasks: raw.tasks ?? mergedTasks,
    deadlines,
    humanReviewItems: raw.humanReviewItems ?? documentFacts.humanReviewItems ?? [],
    updatedCaseSnapshot: raw.updatedCaseSnapshot ?? {},
    auditNotes: raw.auditNotes ?? [],
    inferredPartRuleText: raw.inferredPartRuleText ?? "",
    partRuleExtracts: raw.partRuleExtracts ?? [],
    ruleSourcesApplied: raw.ruleSourcesApplied ?? [],
    documentFacts: raw.documentFacts,
    ruleBasedTasks: raw.ruleBasedTasks,
    caseOrderTasks: raw.caseOrderTasks
  };
}
