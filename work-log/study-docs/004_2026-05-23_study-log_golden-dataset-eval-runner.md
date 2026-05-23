# 004 Case Filing AI Golden Dataset and Eval Runner Study Log

## From prompt-only extraction to golden-dataset evaluation

## Purpose

This study document captures the development that happened after the previous Case Filing AI study handoff.

The focus is not just the final architecture. It explains the back-and-forth that led us here:

```text
prototype extraction
→ model output looked promising
→ model overclaimed legal deadlines
→ we reframed the issue as confidence/guardrail failure
→ we realized the manually reviewed outputs can become ground truth
→ we created a golden dataset
→ next step is an eval runner
```

The key development is this:

> The system should not only generate structured JSON. It should also test whether the generated JSON matches a human-reviewed expected case flow.

---

# 1. Starting point after the last study doc

The previous simplified build plan was intentionally small.

We had reduced the system from a large modular architecture into a practical first prototype.

## First prototype loop

```text
Upload part rule + multiple PDFs
→ backend saves files
→ backend processes one document at a time
→ embedded text extracted first
→ one master prompt extracts structured data
→ local JSON saves output
→ case snapshot updates after each document
→ frontend shows status and results
```

## Why this was the right first simplification

Earlier, the system had many possible modules:

```text
case-filing-ai
filing-text-vault
case-workflow
court-rules
task-docketing
human-review
filing-pipeline
```

That was clean as a long-term architecture, but too large for the first build.

So we chose the smallest working version:

| Decision | Reason |
|---|---|
| One frontend upload page | Prove the workflow before building a full dashboard |
| Local JSON storage | Easier to inspect than a database while prototyping |
| One master prompt | Faster than building many specialized prompt stages |
| Embedded text first | Cheap, fast, and avoids unnecessary OCR |
| Part rule paste/upload | Avoids building a full rule database too early |
| One document at a time | Keeps audit trail and snapshot evolution clear |

The goal was to prove the pipeline first.

---

# 2. First model test result

The prototype produced structured output for the first documents.

This was a good sign.

It showed the pipeline could:

```text
read PDFs
extract embedded text
call a cheap text reasoning model
return structured JSON
save document-level output
update a case snapshot
track model usage and cost
```

## What was good

| Good result | Why it mattered |
|---|---|
| It processed documents one at a time | This matched the desired architecture |
| It produced structured JSON | The prompt/schema was usable |
| It saved usage/cost data | Helpful for choosing cheap models |
| It extracted parties, filing dates, and document types | Basic filing ingestion worked |
| It updated the case snapshot | The rolling case-state idea was working |

This meant the prototype was not failing at the pipeline level.

## But the output exposed a bigger issue

The model created a response deadline too confidently.

It treated weak information as if it were enough to produce a final legal deadline.

Example pattern:

```text
summons/complaint filing date
→ model creates final defendant response deadline
```

But that is not safe.

A response deadline depends on a verified service trigger, usually service date and method.

So the problem was not that the prototype failed.

The problem was that the prototype worked well enough to reveal the next missing layer.

---

# 3. First interpretation: maybe the prompt needs more rules

The first reaction was to tighten the master prompt.

The prompt already had broad rules like:

```text
Prior case context can guide interpretation.
Only the current document can confirm new facts.
Do not overwrite confirmed facts silently.
Later documents may enrich, correct, or supersede earlier provisional data.
If unsure, mark status as provisional or needs_review instead of guessing.
```

These were good general rules.

But the model still created a confident unsupported deadline.

## Tradeoff: prompt tightening

| Option | Benefit | Problem |
|---|---|---|
| Add more prompt rules | Quick and easy | The model may still ignore or soften them |
| Add deadline-specific instructions | Catches known mistake | Becomes a growing list of special cases |
| Keep master prompt broad | Cleaner | Too much room for overconfidence |

The useful prompt fix was:

```text
Do not calculate answer/response deadlines unless the current document or supplied rule text gives the required trigger.
Filing date alone is not enough.
Summons date alone is not enough.
Complaint date alone is not enough.
Use verified service date and service method from affidavit/proof of service, admission, order, or stipulation.
```

That would help.

But we realized this was still not the full answer.

---

# 4. Better framing: this is a confidence guardrail problem

The user reframed the issue correctly:

> Maybe rather than prompting it should fall under guardrail of the model being way too confident?

That was the turning point.

The mistake was not only missing language in the prompt.

The deeper issue was:

```text
weak trigger → confident legal conclusion
```

The desired behavior is:

```text
weak trigger → provisional task / missing trigger / no final deadline
```

## Why this matters

In legal operations, the danger is not only a wrong extraction.

The danger is a wrong extraction promoted into workflow truth.

A bad deadline in raw model output is fixable.

A bad deadline inside the case snapshot can contaminate later documents, tasks, alerts, and UI decisions.

## Tradeoff: prompt vs guardrail

| Approach | Benefit | Weakness |
|---|---|---|
| Prompt-only | Fast and simple | Model can still overclaim |
| Guardrail-only | Stronger validation | Needs structured checks |
| Prompt + guardrail | Best balance | Slightly more build work |

## New principle

```text
The LLM may suggest.
The guardrail decides whether it is confirmed.
```

This became the new architectural principle for the eval layer.

---

# 5. Where the eval runner should step in

The next question was:

> When does the eval runner step in?

The answer was:

```text
after the model returns JSON
before the output becomes trusted case truth
```

## Earlier flow

```text
PDF upload
→ extract embedded text
→ send document text + snapshot + rule text to master prompt
→ model returns JSON
→ save JSON
→ update snapshot
```

## Safer flow

```text
PDF upload
→ extract embedded text
→ master prompt returns actual JSON
→ save actual JSON
→ eval/guardrail runner checks the JSON
→ save eval report
→ only then decide what should enter the snapshot as confirmed
```

For the first implementation, the eval runner does not have to rewrite output yet.

It can start by reporting.

## Tradeoff: report-only vs blocking guardrail

| Mode | Benefit | Problem |
|---|---|---|
| Report only | Easy to add, safer for prototype | Bad snapshot may still update if not blocked |
| Blocking/downgrading | Prevents bad truth from entering snapshot | More complicated |
| Start report-only, later block | Best stepwise path | Requires second phase later |

## First eval decision

For now:

```text
eval runner compares, scores, reports, and flags critical failures
```

Later:

```text
eval runner can downgrade or block unsupported fields before snapshot update
```

This is the best next step because it adds visibility without breaking the processing flow.

---

# 6. One document at a time or four-document chunks?

The user asked whether eval should run after four-document chunks like the manual review process, or after each document.

The answer was:

```text
Run document-level eval after every document.
Run chunk-level eval after every four documents or major milestones.
```

## Why one document at a time

The actual backend processes one document at a time.

So the eval should match that.

If bad data enters after Doc 1, Doc 2 may inherit it.

If the system waits until Doc 4 to evaluate, the snapshot may already be contaminated.

## Best flow

```text
Doc 1
→ model output
→ eval/guardrail check
→ save eval report
→ update snapshot

Doc 2
→ model output using snapshot after Doc 1
→ eval/guardrail check
→ save eval report
→ update snapshot

Doc 3
→ same

Doc 4
→ same

After Doc 4
→ chunk-level snapshot/story eval
```

## Tradeoff

| Option | Benefit | Problem |
|---|---|---|
| Eval after every document | Catches mistakes early | Slightly more eval work |
| Eval after four documents | Easier summary | Bad facts can contaminate the next docs |
| Both | Best balance | Slightly more structure |

## Final decision

```text
Doc-level eval prevents contamination.
Chunk-level eval checks whether the case story is progressing correctly.
```

This gives both precision and narrative quality control.

---

# 7. Realization: the earlier manual work can become the golden dataset

The next breakthrough was the user asking whether the manually reviewed filled-in models could be used as a golden dataset.

The answer was yes.

The prior work was not just notes.

It was a human-reviewed expected case flow.

## What had already been manually reviewed

The synthetic filings had been processed in groups:

```text
Docs 1-4
Docs 5-8
Docs 9-12
Docs 13-14
```

Across those documents, we had already identified:

```text
document types
filing dates
case identity
parties
judge/part confirmation
service/answer/BP/deposition events
PC order deadlines
CC order deadlines
NOI supersession
human review flags
overclaim risks
```

This is exactly what a golden dataset needs.

## Tradeoff: use manual outputs as ground truth?

| Concern | Answer |
|---|---|
| Are the prior outputs perfect legal truth? | No |
| Are they useful as expected eval data? | Yes |
| Should every legal inference be hard truth? | No |
| Should source-backed facts and workflow expectations be used? | Yes |
| Should negative rules be included? | Absolutely |

## Best framing

```text
The manually reviewed outputs are golden expected outputs for this synthetic case flow.
They are not court-certified truth.
They are the expected behavior baseline for the AI pipeline.
```

This distinction matters.

The golden dataset is used to test the system, not to replace attorney judgment.

---

# 8. Actual output vs golden output

Another important clarification was needed.

The user asked if the current JSON was the same as what had been given earlier.

The answer was:

```text
No.
The current JSON is actual model output.
The earlier manually reviewed data is expected output.
```

## Difference

| Type | Meaning |
|---|---|
| Actual output | What the model produced |
| Golden output | What the model should have produced |
| Eval report | How close the actual output came to the golden output |

## Example

Actual output:

```json
{
  "description": "Response to summons",
  "date": "2025-05-26",
  "party": "DEFENDANT"
}
```

Golden expected behavior:

```json
{
  "taskDescription": "Verify service date and service method before calculating defendant response deadline.",
  "status": "needs_source_trigger",
  "dueDate": null,
  "missingTrigger": "affidavit/proof of service showing service date and method"
}
```

## Why this distinction matters

The model output should not be copied into golden data.

The golden data should correct it.

The golden data becomes the answer key.

---

# 9. Golden dataset structure

The golden dataset was created in two forms:

```text
case_001_golden_dataset_ground_truth.json
case_001_golden_dataset_ground_truth.zip
```

## Why two forms

| File | Purpose |
|---|---|
| Combined JSON | One full source of truth for the whole case flow |
| ZIP folder | Eval-ready structure split into document and snapshot files |

The ZIP is easier for Cursor and the backend eval runner to use.

Expected folder structure:

```text
evals/
  golden/
    case_001/
      case_001.golden-dataset.json
      doc_001.expected.json
      doc_002.expected.json
      doc_003.expected.json
      doc_004.expected.json
      doc_005.expected.json
      doc_006.expected.json
      doc_007.expected.json
      doc_008.expected.json
      doc_009.expected.json
      doc_010.expected.json
      doc_011.expected.json
      doc_012.expected.json
      doc_013.expected.json
      doc_014.expected.json
      after_doc_001.expected.json
      after_doc_002.expected.json
      after_doc_004.expected.json
      after_doc_008.expected.json
      after_doc_012.expected.json
      after_doc_014.expected.json
      negative_guardrails.expected.json
      eval_comparison_config.json
```

## Why include 14 docs if the user said 12?

The earlier flow had 12 core documents, then later expanded with Docs 13-14.

The golden dataset includes all processed filings from the synthetic sequence:

```text
Docs 1-14
```

This is better because the final compliance conference / CPLR 3216 / NOI supersession logic is an important test of snapshot evolution.

---

# 10. What the golden dataset contains

The golden dataset contains three major layers.

## 1. Document-level expected outputs

Each document gets an expected file:

```text
doc_001.expected.json
doc_002.expected.json
...
doc_014.expected.json
```

These test whether each document was classified and extracted correctly.

Examples:

| Doc | Expected document type |
|---|---|
| Doc 1 | Summons and Verified Complaint |
| Doc 2 | Certificate of Merit |
| Doc 5 | Affidavit/Affirmation of Service |
| Doc 6 | Answer |
| Doc 7 | Demand for Bill of Particulars |
| Doc 8 | Notice to Take Deposition |
| Doc 12 | Preliminary Conference Order |
| Doc 13 | Compliance Conference Order |
| Doc 14 | Duplicate/refiled CC order with CPLR 3216 demand |

## 2. Snapshot-level expected outputs

Snapshots exist after major milestones:

```text
after_doc_001
after_doc_002
after_doc_004
after_doc_008
after_doc_012
after_doc_014
```

These test whether the case state evolved correctly.

Example:

```text
after_doc_002
→ case commenced
→ certificate of merit filed
→ no final answer deadline yet
→ service deadline still needs source trigger
```

Example:

```text
after_doc_014
→ plaintiff EBT marked done
→ new NOI due 2026-12-10
→ old NOI 2026-08-13 superseded
→ CPLR 3216 risk active
```

## 3. Negative guardrail tests

These are the most important tests because they catch overconfidence.

Examples:

```text
Do not create final answer deadline from filing date alone.
Do not create deadline for defendant to respond to Certificate of Merit.
Do not mark notice of claim completed without source support.
Do not create fixed deposition date when date/time/location are not fixed.
Do not leave old NOI active after later order supersedes it.
Do not duplicate Doc 13 tasks as new Doc 14 obligations if Doc 14 is duplicative.
```

## Why negative tests matter

Normal extraction tests check:

```text
Did the model include the right thing?
```

Negative guardrails check:

```text
Did the model avoid saying the wrong thing confidently?
```

For this system, both are necessary.

---

# 11. Eval runner placement

The eval runner should be added as a separate layer, not mixed into the master prompt.

## Proposed backend additions

```text
backend/src/modules/case-filing-ai/services/goldenDataset.service.js
backend/src/modules/case-filing-ai/services/evalRunner.service.js
```

## New endpoint

```text
GET /case-filing-ai/batches/:batchId/evals
```

## Runtime flow

```text
data/case-filing-ai/batches/{batchId}/outputs/doc-001.json
→ compare with evals/golden/case_001/doc_001.expected.json
→ save data/case-filing-ai/batches/{batchId}/evals/doc_001.eval-report.json
```

For snapshots:

```text
data/case-filing-ai/batches/{batchId}/case-snapshot.json
→ compare with evals/golden/case_001/after_doc_001.expected.json
→ save data/case-filing-ai/batches/{batchId}/evals/after_doc_001.eval-report.json
```

## Why separate service files

| Service | Purpose |
|---|---|
| `goldenDataset.service.js` | Load expected documents, snapshots, guardrails |
| `evalRunner.service.js` | Compare actual output to expected output and generate reports |

This keeps evaluation separate from extraction.

---

# 12. Deterministic eval first, not LLM-as-judge

Another key decision was to avoid using another LLM for eval at this stage.

## Why not LLM-as-judge yet

LLM-as-judge could be useful later, but it creates a new trust problem.

If one model makes a mistake and another model judges it, the system may still be fuzzy.

For this stage, the eval should be deterministic.

## Deterministic comparison can check

```text
document type
filing date
NYSCEF doc number
page count
parties
tasks
deadlines
human review items
snapshot phase
snapshot mini phase
negative guardrails
```

## Tradeoff

| Eval type | Benefit | Problem |
|---|---|---|
| Deterministic | Clear, inspectable, cheap | Less flexible on wording |
| LLM-as-judge | Better semantic judgment | Adds cost and trust issues |
| Hybrid later | Best long term | Too much for now |

## Final decision

```text
Use deterministic eval first.
Normalize strings.
Use simple includes/contains matching where exact matching is too strict.
Add LLM-as-judge later only if needed.
```

This matches the broader system philosophy:

```text
AI is helper.
System is authority.
```

---

# 13. Eval report shape

The eval runner should produce a clear report.

## Proposed report

```json
{
  "evalId": "doc_001",
  "batchId": "batch-001",
  "docKey": "doc-001",
  "caseId": "case_001",
  "type": "document",
  "status": "pass",
  "scores": {
    "documentIdentity": 1,
    "metadata": 1,
    "parties": 0.8,
    "tasks": 0.5,
    "deadlines": 0,
    "humanReview": 0.5,
    "snapshot": 0,
    "negativeGuardrails": 1
  },
  "criticalFailures": [],
  "fieldResults": [],
  "notes": []
}
```

## Status meanings

| Status | Meaning |
|---|---|
| pass | No critical failures and most expected fields match |
| partial | Some mismatches but no major unsafe behavior |
| fail | Critical failure or major expected behavior missing |

## Most important score

The most important category is:

```text
negativeGuardrails
```

Because a model can extract many facts correctly but still fail if it confidently invents a deadline.

---

# 14. Frontend eval panel

The frontend does not need a complex UI.

It only needs to show:

```text
pass / partial / fail
critical failures
score by category
field mismatches
notes
```

## Why simple is enough

This feature is mostly for development and testing.

The user needs to know:

```text
Did the model behave correctly?
Where did it overclaim?
Which document caused the problem?
Which field failed?
```

A simple eval panel is better than a complex dashboard at this stage.

---

# 15. Why this is the best next step

This is the best next step because the system is now moving from:

```text
Can the model produce JSON?
```

to:

```text
Can the system tell whether the JSON is safe, supported, and correct enough?
```

That is a major maturity step.

## Why not keep improving prompt only?

Prompt improvement is still useful, but prompt-only improvement has a ceiling.

Without evals, every change is guesswork.

With evals, every change can be tested.

## Why not build database now?

Database will matter later.

But right now the bigger risk is not storage.

The bigger risk is:

```text
bad model output entering the snapshot as truth
```

A database would only persist the mistake more durably.

So evals come before DB expansion.

## Why not full OCR now?

OCR will matter.

But the observed issue was not OCR.

The first mistake came from text reasoning overconfidence.

So the next best step is to evaluate reasoning quality and guardrails.

OCR can be added after the extraction/eval loop is stable.

## Why not split all modules now?

The system will eventually need modules.

But the current prototype needs one focused improvement:

```text
actual JSON vs expected JSON
```

Adding eval services gives more value than expanding architecture too early.

---

# 16. Final architecture direction after this development

The prototype now has a clearer progression.

## Current build

```text
Upload PDFs + part rule
→ process one doc at a time
→ master prompt returns JSON
→ save output
→ update snapshot
```

## New build

```text
Upload PDFs + part rule
→ process one doc at a time
→ master prompt returns JSON
→ save output
→ eval runner compares against golden dataset
→ save eval report
→ show pass/fail/mismatch
```

## Later build

```text
Upload PDFs + part rule
→ process one doc at a time
→ master prompt returns JSON
→ eval/guardrail runner checks source support
→ unsupported items downgraded
→ validated output updates snapshot
```

## Eventual build

```text
filing-text-vault
court-rules
case-workflow
task-docketing
human-review
evals-runner
filing-pipeline
```

The eval runner is the bridge between the small prototype and the larger trustworthy architecture.

---

# 17. System lesson

The most important lesson from this stage:

> The first working AI prototype is not finished when it produces structured data. It becomes useful when it can be tested against expected behavior.

The model’s output is not the product.

The controlled workflow around the model is the product.

## Practical rule

```text
Never trust a model output just because it is well-structured.
Test it against source triggers, expected outputs, and negative guardrails.
```

## One-line takeaway

```text
The golden dataset turns the prototype from “AI that extracts” into “AI that can be measured, corrected, and safely improved.”
```
