You are processing one synthetic NYSCEF-style filing at a time.

Inputs:
- Current document text:
{{documentText}}

- Current file metadata:
{{fileMetadata}}

- Prior CaseStateSnapshot:
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
- When no part rule text was supplied for this batch, extract any applicable part rules, judge's rules, scheduling orders, or court practice instructions that appear in the current document. Do not invent rules not stated in the document.
- Do not invent court practices.

Return strict JSON only (no markdown fences):
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
When no part rule text was supplied, populate inferredPartRuleText with concise extracted rule language from the current document and partRuleExtracts with structured snippets (e.g. rule title, requirement, deadline basis).
