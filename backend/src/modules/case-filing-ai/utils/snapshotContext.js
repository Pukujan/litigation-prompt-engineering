/**
 * Prepare on-disk snapshot for LLM prompt input (smaller than full stored snapshot).
 * Does not mutate the stored snapshot — only shapes what is sent to the model.
 */
export function prepareSnapshotForPrompt(snapshot, { omitAuditNotes = true } = {}) {
  if (!snapshot || typeof snapshot !== "object") {
    return snapshot;
  }

  const { auditNotes: _omit, ...rest } = snapshot;

  if (!omitAuditNotes) {
    return {
      ...rest,
      auditNotes: snapshot.auditNotes ?? [],
      _promptContextNote:
        "Full snapshot lists included except auditNotes may be omitted in hygiene mode."
    };
  }

  return {
    ...rest,
    _promptContextNote:
      "auditNotes omitted from prompt input to save context. Full audit trail remains in case-snapshot.json on disk."
  };
}

export function truncateDocumentText(text, maxChars = 120_000) {
  const value = String(text ?? "");
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}\n\n[Document text truncated for prompt size — full text was extracted from the PDF.]`;
}
