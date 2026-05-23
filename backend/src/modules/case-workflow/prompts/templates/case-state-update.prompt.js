export const id = "case-state-update";
export const version = "1.0.0";
export const variables = [
  "previousSnapshot",
  "documentExtraction",
  "documentTasks",
  "humanReviewItems",
  "textVersions"
];

export const template = `# Case State Update Prompt

Update the case snapshot after processing one document.

Inputs:
- previous CaseStateSnapshot: {{previousSnapshot}}
- current document extraction: {{documentExtraction}}
- current document tasks/deadlines: {{documentTasks}}
- current document human-review items: {{humanReviewItems}}
- current document text versions: {{textVersions}}

Rules:
1. Preserve prior confirmed facts.
2. Add newly discovered facts.
3. Enrich partial facts when current document supports the update.
4. Do not silently overwrite conflicts.
5. If a prior provisional fact is corrected by current document, mark the old value as corrected_later.
6. If a later order supersedes an earlier deadline, mark the earlier deadline as superseded.
7. Only OCR/handwriting/visual uncertainty creates mandatory human review.
8. Normal AI outputs remain ai_extracted_unreviewed until corrected or promoted.
9. Save a new CaseStateSnapshot after every document.`;
