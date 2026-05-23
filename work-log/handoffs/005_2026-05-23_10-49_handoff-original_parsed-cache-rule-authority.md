# Case Filing AI Handoff: Parsed Cache, Rule Authority, and Version Contracts

| Field | Value |
|-------|--------|
| **Doc** | 005 original (feature spec) |
| **Status** | **Implemented** via [v2](./005_2026-05-23_11-14_handoff-v2_planned-review-in-cursor.md) + [v3](./005_2026-05-23_11-20_handoff-v3_filing-structure-architecture.md) (2026-05-23) |
| **Created (UTC)** | 2026-05-23T10:49:52Z |
| **Filename** | `005_2026-05-23_10-49_handoff-original_parsed-cache-rule-authority.md` |

## Purpose

Implement the next Case Filing AI pipeline update.

This update has 3 goals:

1. Add parsed document cache / text vault
2. Add rule-source authority handling
3. Add lightweight version contracts for prompts, snapshots, rules, parser, OCR, and golden datasets

Do not add a database.  
Do not add auth.  
Do not add unrelated features.  
Do not overbuild a full prompt-management system yet.

---

# 1. Add parsed document cache

Create:

```text
backend/src/modules/case-filing-ai/services/parsedDocumentCache.service.js
```

Use this folder structure:

```text
data/case-filing-ai/batches/{batchId}/parsed-documents/
  doc-001/
    embedded-text.txt
    ocr-text.txt
    final-parsed-text.txt
    human-reviewed-text.txt

    extraction-quality.json
    page-map.json
    parse-metadata.json
    review-status.json
    audit-log.jsonl
```

`human-reviewed-text.txt` may not exist yet.

Pipeline order:

```text
uploaded PDF
→ check parsed document cache
→ if reusable, load final-parsed-text.txt
→ if fully human reviewed, load human-reviewed-text.txt
→ if no cache, extract embedded text / OCR if needed
→ save parsed artifacts
→ send best available text to prompt
```

Text priority:

```text
1. human-reviewed-text.txt if fully_reviewed
2. final-parsed-text.txt if cache reusable
3. parse/OCR PDF again
```

Cache reuse rule:

```text
If sourceFileHash + parserVersion + ocrVersion match,
reuse parsed text and skip OCR.
```

---

# 2. Add review status and audit log

Create `review-status.json` per parsed document:

```json
{
  "documentId": "doc-001",
  "overallReviewStatus": "unreviewed",
  "humanVerified": false,
  "textVersions": {
    "embeddedText": {
      "path": "embedded-text.txt",
      "reviewStatus": "unreviewed"
    },
    "ocrText": {
      "path": "ocr-text.txt",
      "reviewStatus": "unreviewed"
    },
    "finalParsedText": {
      "path": "final-parsed-text.txt",
      "reviewStatus": "unreviewed"
    },
    "humanReviewedText": {
      "path": "human-reviewed-text.txt",
      "reviewStatus": "not_created"
    }
  },
  "verifiedPages": [],
  "unverifiedPages": [],
  "reviewNotes": [],
  "lastReviewedAt": null
}
```

Allowed `overallReviewStatus`:

```text
unreviewed
partially_reviewed
fully_reviewed
rejected
```

Create `audit-log.jsonl` per parsed document.

Example events:

```jsonl
{"time":"ISO_DATE","event":"parsed_text_created","documentId":"doc-001","version":"embedded-text.txt","status":"unreviewed"}
{"time":"ISO_DATE","event":"ocr_text_created","documentId":"doc-001","version":"ocr-text.txt","status":"unreviewed"}
{"time":"ISO_DATE","event":"cache_reused","documentId":"doc-001","reason":"sourceFileHash/parserVersion/ocrVersion matched"}
{"time":"ISO_DATE","event":"review_status_updated","documentId":"doc-001","overallReviewStatus":"partially_reviewed"}
```

Rule:

```text
review-status.json = current state
audit-log.jsonl = history
```

---

# 3. Add lightweight version contracts

Do not build a full prompt versioning module yet.

Instead, create a simple version contract file:

```text
backend/src/modules/case-filing-ai/contracts/pipelineVersions.js
```

Example:

```js
export const PIPELINE_VERSIONS = {
  parserVersion: "pdf-text-v001",
  ocrVersion: "qwen-vl-v001",
  masterPromptVersion: "v001_master-case-filing",
  ruleMatchPromptVersion: "v001_rule-matching",
  taskDeadlinePromptVersion: "v001_task-deadline",
  snapshotPromptVersion: "v001_snapshot-update",
  ruleSetVersion: "queens_kerrigan_medmal_rules_v001",
  goldenDatasetVersion: "synthetic_case_001_v001"
};
```

Every saved document output should include:

```json
{
  "pipelineVersions": {
    "parserVersion": "pdf-text-v001",
    "ocrVersion": "qwen-vl-v001",
    "masterPromptVersion": "v001_master-case-filing",
    "ruleMatchPromptVersion": "v001_rule-matching",
    "taskDeadlinePromptVersion": "v001_task-deadline",
    "snapshotPromptVersion": "v001_snapshot-update",
    "ruleSetVersion": "queens_kerrigan_medmal_rules_v001",
    "goldenDatasetVersion": "synthetic_case_001_v001"
  }
}
```

Every eval report should also include the same `pipelineVersions`.

This is enough for now. Do not make a full version registry yet.

---

# 4. Add rule-source authority handling

Create a simple court rules service layer.

Create:

```text
backend/src/modules/court-rules/
  services/
    ruleStore.service.js
    ruleMatch.service.js
    ruleAuthority.service.js

  contracts/
    ruleAuthority.contract.js
```

Do not overbuild routes/UI unless already needed.

The purpose is:

```text
ruleStore = load stored rule files / parsed rule JSON
ruleMatch = find applicable rules for current document/case phase
ruleAuthority = rank rules by authority
```

Authority hierarchy:

```text
cplr_or_statute
→ uniform_rule
→ county_or_court_rule
→ judge_part_rule
→ case_specific_order
→ later_case_specific_order
```

Operational rule:

```text
Most specific valid source controls.
Case-specific order controls over judge/part rule.
Later case-specific order controls over earlier order.
```

---

# 5. Add rule authority contract

Create:

```text
backend/src/modules/court-rules/contracts/ruleAuthority.contract.js
```

Use:

```js
export const RULE_AUTHORITY_RANK = {
  cplr_or_statute: 1,
  uniform_rule: 2,
  county_or_court_rule: 3,
  judge_part_rule: 4,
  case_specific_order: 5,
  later_case_specific_order: 6,
  unknown: 0
};

export const RULE_AUTHORITY_VALUES = [
  "cplr_or_statute",
  "uniform_rule",
  "county_or_court_rule",
  "judge_part_rule",
  "case_specific_order",
  "later_case_specific_order",
  "unknown"
];
```

---

# 6. Update task/deadline schema

Every task/deadline should optionally support:

```json
{
  "sourceAuthority": "case_specific_order",
  "sourceName": "Preliminary Conference Order",
  "sourceDocNo": 12,
  "ruleSourceApplied": "Doc 12 PC Order",
  "authorityRank": 5,
  "supersedes": null,
  "sourceText": "quoted or summarized trigger text",
  "sourcePage": 3
}
```

This does not need to be perfect yet.

But fields should exist so prompts/evals can start using them.

---

# 7. Add rule matching before prompt output

Update processing flow to:

```text
document text ready
→ load prior case snapshot
→ load applicable rule sources
→ rank rule sources
→ send document text + prior snapshot + ranked rules to prompt
→ model returns JSON with ruleSourcesApplied
→ save output
→ eval
→ snapshot update
```

Do not dump every rule into the prompt.

Only include relevant rules by:

```text
county
case type
judge/part
document type
case phase
```

For this synthetic case, relevant rule sources include:

```text
Uniform Rule 202.56
Queens med-mal rules
Queens med-mal PC form
Queens med-mal CC form
Queens Compliance Part rules if applicable
Kerrigan Part 10 rules
case-specific PC/CC orders
```

---

# 8. Update prompt files, but keep versions simple

Create or rename prompts:

```text
backend/src/modules/case-filing-ai/prompts/
  v001_master-case-filing.prompt.md
  v001_snapshot-update.prompt.md

backend/src/modules/court-rules/prompts/
  v001_rule-matching.prompt.md

backend/src/modules/task-docketing/prompts/
  v001_task-deadline-authority.prompt.md
```

If the modules do not exist yet, keep prompts under `case-filing-ai/prompts/` for now:

```text
backend/src/modules/case-filing-ai/prompts/
  v001_master-case-filing.prompt.md
  v001_rule-matching.prompt.md
  v001_task-deadline-authority.prompt.md
  v001_snapshot-update.prompt.md
```

Do not build a separate prompt versioning module yet.

Use file names + `pipelineVersions.js` as the version contract.

---

# 9. Update master prompt expectations

The master prompt should separate:

```json
{
  "documentFacts": {},
  "ruleSourcesApplied": [],
  "ruleBasedTasks": [],
  "caseOrderTasks": [],
  "deadlines": [],
  "ruleConflicts": [],
  "sourceAuthorityNotes": [],
  "updatedCaseSnapshot": {}
}
```

Important prompt rule:

```text
Do not treat all rules equally.
Use the highest authority applicable source.
If a case-specific order gives a date, that controls.
If a later order changes a date, mark the old date superseded.
If only a general rule exists, mark output as rule_based or conditional.
If no trigger exists, do not create a final deadline.
```

---

# 10. Update eval reports

Eval reports should include:

```json
{
  "parsedDocumentCacheUsed": true,
  "textSourceUsed": "final-parsed-text.txt",
  "reviewStatusAtEvalTime": "unreviewed",
  "pipelineVersions": {},
  "ruleSourcesChecked": [],
  "ruleAuthorityFailures": []
}
```

Add eval checks for:

```text
deadline has sourceAuthority
deadline has sourceName or sourceDocNo
case-specific order controls over general rule
later order supersedes earlier order
old NOI date is superseded after CC order
general Queens rule is not applied when HHC med-mal/Part 10 specific rule controls
```

---

# 11. Add minimal parsed document API

Add endpoints:

```text
GET /case-filing-ai/batches/:batchId/parsed-documents
GET /case-filing-ai/batches/:batchId/parsed-documents/:documentId
PATCH /case-filing-ai/batches/:batchId/parsed-documents/:documentId/review-status
```

The detail endpoint should return:

```json
{
  "documentId": "doc-001",
  "parseMetadata": {},
  "extractionQuality": {},
  "reviewStatus": {},
  "pageMap": {},
  "textPreview": "first 2000 chars of best available text"
}
```

---

# 12. Do not implement yet

Do not implement:

```text
database
auth
Neo4j
vector database
full court-rules UI
full human review UI
LLM-as-judge eval
complex prompt versioning database
```

---

# 13. Acceptance criteria

After implementation:

1. Parsed text is saved for every document.
2. Rerun can reuse parsed text and skip OCR.
3. Review status exists for every parsed document.
4. Audit log exists for every parsed document.
5. Document outputs include pipeline versions.
6. Tasks/deadlines can store source authority fields.
7. Rule authority hierarchy exists as a contract.
8. Relevant rules can be loaded/ranked before prompt call.
9. Eval reports include text source, review status, versions, and rule authority failures.
10. Existing upload/process/results flow still works.
