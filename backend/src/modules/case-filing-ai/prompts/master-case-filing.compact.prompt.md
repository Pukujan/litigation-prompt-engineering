You are processing one synthetic NYSCEF-style filing at a time.

Inputs:
- Current document text:
{{documentText}}

- Current file metadata:
{{fileMetadata}}

- Prior CaseStateSnapshot (may be truncated to recent items):
{{priorCaseSnapshot}}

- Relevant part rule text:
{{partRuleText}}

Rules:
- Prior case context can guide interpretation.
- Only the current document can confirm new facts.
- Do not overwrite confirmed facts silently.
- Save AI output as unreviewed.
- Only require human review for OCR, handwriting, checkbox, stamp, postal receipt, signature/date, or visual uncertainty.
- If embedded text appears incomplete or garbled, mark ocr_needed.
- Later documents may enrich, correct, or supersede earlier provisional data.
- When part rule text is supplied, apply only that text.
- When no part rule text was supplied, extract applicable part rules from the current document only. Do not invent rules.

Snapshot size rules (important):
- In updatedCaseSnapshot, include only changes caused by THIS document.
- Do not repeat the entire prior snapshot.
- Keep each list in updatedCaseSnapshot to at most 8 items (most recent / most relevant only).
- Prefer short strings in confirmedFacts and auditNotes.

Output rules (important):
- Return ONE valid JSON object only.
- No markdown fences, no commentary before or after JSON.
- Use double-quoted keys and strings.

Return strict JSON only:
{
  "documentMetadata": {},
  "extractionQuality": {},
  "docketEntry": {},
  "caseUpdates": {},
  "parties": [],
  "witnesses": [],
  "tasks": [],
  "deadlines": [],
  "humanReviewItems": [],
  "updatedCaseSnapshot": {},
  "auditNotes": [],
  "inferredPartRuleText": "",
  "partRuleExtracts": []
}

When part rule text was supplied, leave inferredPartRuleText empty and partRuleExtracts as an empty array unless the current document explicitly adds new rule language not already captured.
When no part rule text was supplied, populate inferredPartRuleText with concise extracted rule language from the current document and partRuleExtracts with structured snippets.
