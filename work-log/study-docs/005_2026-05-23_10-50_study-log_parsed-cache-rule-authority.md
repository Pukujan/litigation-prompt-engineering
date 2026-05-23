# 005 Case Filing AI Study Log: Parsed Cache, Rule Authority, and Version Contracts

| Field | Value |
|-------|--------|
| **Doc** | 005 study log (design rationale) |
| **Created (UTC)** | 2026-05-23T10:50:03Z |
| **Filename** | `005_2026-05-23_10-50_study-log_parsed-cache-rule-authority.md` |

## Purpose

This study log records the back-and-forth that led to the next Case Filing AI pipeline improvement.

The focus is not only the final design. It explains why the design changed, what tradeoffs were considered, and why this is the best next step before rerunning the synthetic 14-document pipeline.

---

# 1. Starting point

The system had already reached a working prototype stage.

Current pipeline:

```text
upload synthetic PDFs
→ extract embedded text / OCR where needed
→ send current document + prior snapshot + rule text to prompt
→ save model JSON
→ update case snapshot
→ run evals against golden dataset
```

The next planned step was to rerun the full synthetic case and inspect eval reports.

But before rerunning, we noticed two major design gaps:

1. Parsed text was not being saved as a reusable artifact.
2. Rule sources were not yet represented strongly enough in the model/prompt/eval flow.

---

# 2. Gap 1: parsed documents were missing from the pipeline

The user noticed that there was a saved place for synthetic PDFs and model outputs, but not for the parsed document text.

This matters because OCR is expensive and slow.

If the same document is rerun for prompt testing, the system should not need to parse or OCR the PDF again.

## Old flow

```text
uploaded PDF
→ parse/OCR
→ prompt
→ model output
```

## Problem

If prompts change, the same PDF may need to be rerun many times.

Without parsed text cache:

```text
every prompt rerun may repeat parsing/OCR
```

That wastes time, cost, and debugging clarity.

## New flow

```text
uploaded PDF
→ parse/OCR once
→ save parsed text
→ rerun prompts using saved parsed text
→ skip OCR if parser/OCR versions match
```

## Tradeoff

| Option | Benefit | Problem |
|---|---|---|
| Do not save parsed text | Simpler pipeline | Repeats OCR/parsing unnecessarily |
| Save only final model JSON | Easy to inspect output | Cannot rerun prompts from clean text source |
| Save parsed text cache | Faster reruns, better auditability | Adds one more storage layer |
| Full filing-text-vault module now | Strong architecture | Too much for this prototype stage |

## Decision

Add a lightweight parsed document cache now.

Do not build the full filing-text-vault module yet.

---

# 3. Where parsed cache belongs

We placed parsed cache between file storage and prompt processing.

## Correct placement

```text
uploaded PDFs
→ document storage
→ parsed document cache / text vault
→ prompts
→ model JSON outputs
→ eval reports
→ snapshot update
```

## Why this is the right location

Parsed text is not the same as:

```text
uploaded PDF
model output JSON
eval report
case snapshot
```

It is its own reusable artifact.

The prompt should consume the best available parsed text, not repeatedly touch the raw PDF unless needed.

---

# 4. Human verification status

The next question was whether parsed documents should know whether they were human verified.

Answer: yes.

But only storing a status is not enough. The system should also preserve history.

So the design uses both:

```text
review-status.json = current state
audit-log.jsonl = history
```

## Why both are needed

| File | Purpose |
|---|---|
| `review-status.json` | Fast current status lookup |
| `audit-log.jsonl` | Historical record of what changed and when |

## Tradeoff

| Option | Benefit | Problem |
|---|---|---|
| Only review status | Easy to read | Loses history |
| Only audit log | Complete history | Requires recalculation every time |
| Both | Best balance | Slightly more files |

## Decision

Use both.

Each parsed document folder gets:

```text
review-status.json
audit-log.jsonl
```

This supports unreviewed, partially reviewed, fully reviewed, and rejected text states.

---

# 5. Text priority rule

The system needs to decide which text to send to prompts.

## Final priority

```text
1. human-reviewed-text.txt if fully_reviewed
2. final-parsed-text.txt if cache reusable
3. parse/OCR PDF again
```

## Why this matters

If a human has verified the text, the prompt should use that version.

If not, reusable parsed text is still better than re-OCRing.

Only if the cache is missing or invalid should the system parse/OCR again.

## Tradeoff

| Text source | Benefit | Risk |
|---|---|---|
| Human-reviewed text | Most reliable | May not exist |
| Final parsed text | Fast and reusable | May still contain OCR/AI extraction errors |
| Fresh OCR/parsing | Regenerates from source | Slower and costly |

## Decision

Human-reviewed text wins.  
Reusable parsed text comes second.  
Fresh parsing/OCR is fallback.

---

# 6. Rule-source issue

The next issue came from adding Queens/Kerrigan/med-mal rule PDFs.

The case is not controlled only by the judge's part rule.

Other sources may affect the timeline:

```text
Uniform Rule 202.56
Queens med-mal rules
Queens med-mal PC form
Queens med-mal CC form
Queens Compliance Part rules
Kerrigan Part 10 rules
case-specific PC/CC orders
```

This means the model must not just extract documents. It must also know which rule source controlled each task/deadline.

---

# 7. Rule hierarchy discussion

We discussed whether judge rules supersede court rules.

The operational conclusion was:

```text
Most specific valid source controls.
Case-specific order controls over judge/part rule.
Later case-specific order controls over earlier order.
```

The practical hierarchy for docketing behavior:

```text
CPLR/statute
→ Uniform Rules
→ Queens/court-wide rules
→ judge/part rules
→ case-specific order
→ later case-specific order
```

## Important nuance

In real docketing practice, judge orders often control even when the default CPLR rule says something else, especially when the court has discretion over scheduling.

So the system should not blindly apply general CPLR/default timelines if a case-specific order gives a different date.

## Tradeoff

| Source | Strength |
|---|---|
| General rule | Useful default |
| Judge/part rule | More specific operational practice |
| Case-specific order | Controls the actual case |
| Later order | Supersedes earlier case schedule |

## Decision

Tasks and deadlines need rule authority fields.

---

# 8. Rule-source fields in tasks and deadlines

The model output should support fields like:

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

## Why this matters

A deadline is not enough by itself.

The system needs to know:

```text
what created the deadline
which source controlled it
whether that source was later superseded
```

## Tradeoff

| Option | Benefit | Problem |
|---|---|---|
| Store just date/description | Simple | Cannot audit source authority |
| Store source document only | Better | Still misses rule hierarchy |
| Store authority fields | More reliable and auditable | Slightly larger schema |

## Decision

Add optional source authority fields now.

They do not have to be perfect immediately, but the schema should allow them.

---

# 9. Court-rules module or just prompt rules?

The user asked whether another module should be added for court rules that saves all parts/miniparts.

Decision: add a lightweight court-rules service layer, not a full product module yet.

## Proposed structure

```text
backend/src/modules/court-rules/
  services/
    ruleStore.service.js
    ruleMatch.service.js
    ruleAuthority.service.js

  contracts/
    ruleAuthority.contract.js
```

## Why not full module yet

A full court-rules UI/database is too much right now.

But the pipeline needs a place to:

```text
load stored rule files
match applicable rules
rank rule authority
return relevant rule sources to the prompt
```

## Tradeoff

| Option | Benefit | Problem |
|---|---|---|
| Put rules directly in prompt | Fast | Messy and hard to version |
| Full court-rules module now | Clean long term | Too much for current stage |
| Lightweight services/contracts | Good balance | May need refactor later |

## Decision

Add lightweight `court-rules` services and contracts.

No full UI/database yet.

---

# 10. Prompt versioning question

The user did not yet have prompt versioning ready and asked whether this should become a module or contracts.

Decision: use simple version contracts first.

## Why not full prompt versioning module yet

A full prompt registry would be overkill.

The immediate need is to record which prompt/rule/parser/OCR/golden dataset version produced each output.

## Simple contract

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

## Tradeoff

| Option | Benefit | Problem |
|---|---|---|
| No prompt versioning | Simple | Cannot compare runs reliably |
| Full prompt registry | Powerful | Too much now |
| Version contract file | Simple and traceable | Manual updates required |

## Decision

Use contract file now.

Build full versioning later only if needed.

---

# 11. Prompt pipeline impact

The prompt pipeline now needs to separate document extraction from rule authority.

## Old behavior

```text
document text + snapshot + rule text
→ one master prompt
→ model output
```

## New expected behavior

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

## Why this improves the pipeline

The model should not treat all rules equally.

If a case-specific order gives a date, that controls.

If a later order changes a date, the old date should be superseded.

If only a general rule exists, the output should be conditional/rule-based.

If no trigger exists, no final deadline should be created.

---

# 12. Eval impact

Eval reports should also understand parsed cache and rule authority.

## New eval fields

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

## New eval checks

```text
deadline has sourceAuthority
deadline has sourceName or sourceDocNo
case-specific order controls over general rule
later order supersedes earlier order
old NOI date is superseded after CC order
general Queens rule is not applied when HHC med-mal/Part 10 specific rule controls
```

## Tradeoff

| Eval focus | Benefit |
|---|---|
| Only output accuracy | Checks extraction |
| Output + authority | Checks legal workflow reasoning |
| Output + authority + versions | Checks reproducibility |

## Decision

Add rule-authority failures and version metadata to eval reports.

---

# 13. What not to build yet

The user wants the system to improve without expanding scope too much.

So the plan explicitly avoids:

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

## Why

The system needs to stabilize the current pipeline before adding more layers.

The next run should test:

```text
parsed cache
review state
rule authority
version tracking
eval compatibility
```

not unrelated infrastructure.

---

# 14. Final design direction

The system is moving from:

```text
PDF → prompt → JSON
```

to:

```text
PDF
→ parsed cache
→ best available text
→ ranked applicable rules
→ versioned prompts
→ JSON with source authority
→ eval report with rule failures
→ snapshot update
```

This is a major quality improvement.

## Why this is the best next step

Because the next major risks are:

```text
repeating OCR unnecessarily
not knowing whether parsed text was reviewed
not knowing which prompt/rule version created an output
not knowing which rule source controlled a deadline
not catching rule hierarchy mistakes in evals
```

This plan directly addresses those risks without overbuilding the project.

---

# 15. One-line takeaway

```text
The pipeline is evolving from simple extraction into a reusable, auditable, rule-aware docketing simulator.
```
