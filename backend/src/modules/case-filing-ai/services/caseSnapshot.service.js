import { legacyMergeSnapshot, structuredMergeSnapshot } from "../utils/snapshotMerge.js";

export function createCaseSnapshotService({ store, mergeMode = "legacy", maxAuditNotes = 20 }) {
  function mergeSnapshot(priorSnapshot, aiOutput, { docIndex, storedName }) {
    if (mergeMode === "structured") {
      return structuredMergeSnapshot(priorSnapshot, aiOutput, {
        docIndex,
        storedName,
        maxAuditNotes
      });
    }
    return legacyMergeSnapshot(priorSnapshot, aiOutput, {
      docIndex,
      storedName,
      maxAuditNotes
    });
  }

  async function initSnapshot(batchId) {
    const snapshot = store.emptySnapshot();
    await store.writeCaseSnapshot(batchId, snapshot);
    return snapshot;
  }

  return { mergeSnapshot, initSnapshot, mergeMode };
}
