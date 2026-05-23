You are processing one synthetic NYSCEF-style filing at a time.

Inputs:
- Current document text:
{{documentText}}

- Current file metadata:
{{fileMetadata}}

- Prior CaseStateSnapshot:
{{priorCaseSnapshot}}

- Relevant part rule text (user-supplied for this batch, if any):
{{partRuleText}}

- Ranked applicable rule sources (fixture/store; most specific first):
{{rankedRules}}

Rules:
- Prior case context can guide interpretation.
- Only the current document can confirm new facts.
- Do not overwrite confirmed facts silently.
- Save AI output as unreviewed.
- Prefer higher-authority ranked rules over lower when they conflict.
- Part-specific rules control over general county rules when both apply.
- Case-specific orders control over judge/part rules; later orders control earlier orders.
- When part rule text is supplied, apply only that text plus ranked sources that do not conflict.
- When no part rule text was supplied, extract applicable rules from the document and ranked sources.
- Do not invent court practices.

Return strict JSON only (no markdown fences):
{
  "documentFacts": {
    "documentMetadata": {},
    "extractionQuality": {},
    "docketEntry": {},
    "caseUpdates": {},
    "parties": [],
    "witnesses": [],
    "humanReviewItems": []
  },
  "ruleSourcesApplied": [],
  "ruleBasedTasks": [],
  "caseOrderTasks": [],
  "deadlines": [],
  "updatedCaseSnapshot": {},
  "auditNotes": [],
  "inferredPartRuleText": "",
  "partRuleExtracts": []
}

Each task or deadline in ruleBasedTasks / caseOrderTasks / deadlines may include:
sourceAuthority, sourceName, sourceDocNo, ruleSourceApplied, authorityRank, supersedes, sourceText, sourcePage.

ruleSourcesApplied: list ruleIds from the ranked block that influenced this extraction.

When part rule text was supplied, leave inferredPartRuleText empty unless the document adds new rule language.
When no part rule text was supplied, populate inferredPartRuleText and partRuleExtracts from the current document.
