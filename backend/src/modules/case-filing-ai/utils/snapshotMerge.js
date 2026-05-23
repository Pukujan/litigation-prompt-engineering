import { normalizeText } from "./evalNormalize.js";
import { dedupeAndCapAuditNotes } from "./auditNotes.js";

function itemKey(item) {
  if (typeof item === "string") return normalizeText(item);
  return normalizeText(JSON.stringify(item));
}

/**
 * Append incoming string/object items onto prior, skipping duplicates.
 */
export function mergeStringArrays(prior = [], incoming = []) {
  if (!incoming?.length) return [...(prior ?? [])];
  const result = [...(prior ?? [])];
  const seen = new Set(result.map(itemKey));

  for (const item of incoming) {
    const key = itemKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function deadlineKey(entry) {
  if (!entry || typeof entry !== "object") return normalizeText(String(entry));
  const type = entry.type ?? entry.deadlineType ?? "";
  const date = entry.date ?? entry.dueDate ?? "";
  return normalizeText(`${type}|${date}`);
}

/**
 * Upsert deadlines by type+date; incoming entries replace matching keys.
 */
export function mergeDeadlines(prior = [], incoming = []) {
  if (!incoming?.length) return [...(prior ?? [])];

  const byKey = new Map();
  for (const entry of prior ?? []) {
    byKey.set(deadlineKey(entry), entry);
  }
  for (const entry of incoming) {
    byKey.set(deadlineKey(entry), entry);
  }
  return [...byKey.values()];
}

export function mergeSupersededDeadlines(prior = [], incoming = []) {
  return mergeStringArrays(prior, incoming);
}

/**
 * Structured rolling merge: append facts/tasks; upsert deadlines; preserve full history on disk.
 */
export function structuredMergeSnapshot(priorSnapshot, aiOutput, { docIndex, storedName, maxAuditNotes = 20 }) {
  const updated = aiOutput?.updatedCaseSnapshot ?? {};

  const merged = {
    ...priorSnapshot,
    snapshotId: updated.snapshotId ?? `snapshot_after_doc_${String(docIndex).padStart(3, "0")}`,
    afterDocNo: docIndex,
    caseId: updated.caseId ?? priorSnapshot.caseId,
    currentPhase: updated.currentPhase ?? priorSnapshot.currentPhase,
    currentMiniPhase: updated.currentMiniPhase ?? priorSnapshot.currentMiniPhase,
    confirmedFacts: mergeStringArrays(
      priorSnapshot.confirmedFacts,
      updated.confirmedFacts
    ),
    carriedForwardContext: mergeStringArrays(
      priorSnapshot.carriedForwardContext,
      updated.carriedForwardContext
    ),
    openTasks: mergeStringArrays(priorSnapshot.openTasks, updated.openTasks),
    completedTasks: mergeStringArrays(priorSnapshot.completedTasks, updated.completedTasks),
    conditionalTasks: mergeStringArrays(
      priorSnapshot.conditionalTasks,
      updated.conditionalTasks
    ),
    deadlines: mergeDeadlines(priorSnapshot.deadlines, updated.deadlines),
    supersededDeadlines: mergeSupersededDeadlines(
      priorSnapshot.supersededDeadlines,
      updated.supersededDeadlines
    ),
    unresolvedHumanReviewItems: mergeStringArrays(
      priorSnapshot.unresolvedHumanReviewItems,
      updated.unresolvedHumanReviewItems
    ),
    conflicts: mergeStringArrays(priorSnapshot.conflicts, updated.conflicts),
    auditNotes: dedupeAndCapAuditNotes(
      [
        ...(priorSnapshot.auditNotes ?? []),
        ...(aiOutput?.auditNotes ?? []),
        `Processed ${storedName} as document ${docIndex}`
      ],
      maxAuditNotes
    )
  };

  return merged;
}

/**
 * Legacy merge with audit-note hygiene only (replacement semantics for list fields).
 */
export function legacyMergeSnapshot(priorSnapshot, aiOutput, { docIndex, storedName, maxAuditNotes = 20 }) {
  const updated = aiOutput?.updatedCaseSnapshot ?? {};

  return {
    ...priorSnapshot,
    ...updated,
    snapshotId: updated.snapshotId ?? `snapshot_after_doc_${String(docIndex).padStart(3, "0")}`,
    afterDocNo: docIndex,
    openTasks: updated.openTasks ?? priorSnapshot.openTasks ?? [],
    completedTasks: updated.completedTasks ?? priorSnapshot.completedTasks ?? [],
    conditionalTasks: updated.conditionalTasks ?? priorSnapshot.conditionalTasks ?? [],
    deadlines: updated.deadlines ?? priorSnapshot.deadlines ?? [],
    supersededDeadlines: updated.supersededDeadlines ?? priorSnapshot.supersededDeadlines ?? [],
    unresolvedHumanReviewItems:
      updated.unresolvedHumanReviewItems ?? priorSnapshot.unresolvedHumanReviewItems ?? [],
    confirmedFacts: updated.confirmedFacts ?? priorSnapshot.confirmedFacts ?? [],
    carriedForwardContext: updated.carriedForwardContext ?? priorSnapshot.carriedForwardContext ?? [],
    conflicts: updated.conflicts ?? priorSnapshot.conflicts ?? [],
    auditNotes: dedupeAndCapAuditNotes(
      [
        ...(priorSnapshot.auditNotes ?? []),
        ...(aiOutput?.auditNotes ?? []),
        `Processed ${storedName} as document ${docIndex}`
      ],
      maxAuditNotes
    )
  };
}
