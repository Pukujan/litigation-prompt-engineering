# Case Filing AI Planning Log

## How we narrowed the system from a full architecture to a first working prototype

## Context

We started with a broad goal:

> Build a system that can process NYSCEF-style filing documents, extract the useful case information, and help create structured case workflow data.

The first idea sounded like a docketing AI system.

But as we talked through it, the scope changed.

It became clear that this first version should not try to be the entire docketing system. It should be a smaller **case filing AI prototype** that ingests filings, applies part-rule context, extracts structured data, saves outputs, and updates a case snapshot.

The larger architecture still matters, but it should come later.

---

# 1. Starting idea: extract docket entries from filings

## Original plan

The first version was simple:

```text
Upload NYSCEF-style PDFs
→ extract docket entries
→ fill case/task/deadline models
```

The goal was to get information like:

| Field | Example |
|---|---|
| NYSCEF doc number | Doc 1 |
| Filed date | 05/06/2025 |
| Document title | Summons and Complaint |
| Filed by | Plaintiff |
| Event | Case commenced |

## Why this was useful

It gave us a clear starting point.

A filing should create a structured docket entry.

## Tradeoff

| Benefit | Problem |
|---|---|
| Easy to understand | Too shallow for real workflow |
| Good first extraction target | Does not capture tasks, deadlines, rules, or case posture |
| Simple output | Cannot tell what needs to be done next |

## What we learned

Docket entries alone are not enough.

A filing is not just a record of what happened. It may create obligations, deadlines, risks, and workflow changes.

---

# 2. Adding OCR and human verification

## New concern

You wanted the system to first check whether OCR is needed.

That changed the workflow.

```text
PDF
→ check embedded text
→ use text if reliable
→ use OCR/VL if needed
→ flag unreadable handwriting or unclear visual fields
```

## Why this mattered

Court-style filings often contain:

- embedded text
- scanned pages
- handwritten dates
- signatures
- checkboxes
- stamps
- postal receipts
- garbled OCR
- court forms with visual fields

## Tradeoff

| Choice | Benefit | Cost |
|---|---|---|
| Always use OCR/VL | May catch visual fields | Expensive and unnecessary |
| Always use embedded text | Fast and cheap | Misses scanned or handwritten areas |
| Check text first, then OCR only when needed | Best balance | Requires extra quality-check step |

## Final decision

Use this order:

```text
1. Try embedded PDF text extraction first
2. If usable, parse that text
3. If missing, garbled, incomplete, scanned, or unreliable, use OCR/VL
4. If OCR/VL cannot confidently read it, create human review item
```

---

# 3. Expanding into models

## Next idea

Once we saw what the filings could contain, we identified multiple models:

```text
CaseModel
DocumentModel
DocketEntryModel
PartyModel
TaskModel
DeadlineModel
HumanVerificationModel
CaseStateSnapshotModel
```

## Why this helped

It separated different kinds of information.

A party is not a task.

A deadline is not a document.

A human review item is not the same as an extracted fact.

## Tradeoff

| Benefit | Problem |
|---|---|
| Cleaner data structure | More code to build |
| Easier to audit | More upfront design |
| Better future database mapping | Too much for first prototype |
| Supports later enrichment | Requires case state logic |

## What we learned

The full model set is valuable, but building all of it at once would slow down the first prototype.

---

# 4. Considering full modular architecture

## Larger architecture we considered

We discussed splitting the system into modules:

```text
case-filing-ai
filing-text-vault
case-workflow
court-rules
task-docketing
human-review
filing-pipeline
```

## What each module would own

| Module | Purpose |
|---|---|
| `case-filing-ai` | Parse filings, classify docs, extract facts |
| `filing-text-vault` | Save embedded text, OCR text, AI parsed text, reviewed text |
| `case-workflow` | Maintain case phase, mini-phase, and case snapshot |
| `court-rules` | Store and retrieve court-wide, county, judge, part, and case-type rules |
| `task-docketing` | Create tasks, deadlines, and risk alerts |
| `human-review` | Manage OCR/visual uncertainty review |
| `filing-pipeline` | Orchestrate all modules |

## Why this architecture was attractive

It created clean boundaries.

```text
Modules own domain logic.
Pipeline owns execution order.
```

## Tradeoff

| Benefit | Problem |
|---|---|
| Clean long-term architecture | Too large for first build |
| Easy to test each module later | Too much scaffolding upfront |
| Better for production | Slower proof of concept |
| Clear ownership | More files, routes, services, and prompts |

## Decision

Keep this architecture as the future direction, but do not build the whole thing first.

---

# 5. Renaming from docketing AI to case filing AI

## Discussion

At first, the module was called:

```text
docketing-ai
```

Then we realized that was too narrow.

The first system is not only docketing. It is mostly:

```text
filing ingestion
text extraction
rule context
structured parsing
case snapshot updates
human review flags
```

Docketing is only one downstream output.

## Final name

```text
case-filing-ai
```

## Tradeoff

| Name | Benefit | Problem |
|---|---|---|
| `docketing-ai` | Clear task/deadline focus | Too narrow |
| `case-filing-ai` | Better for filing ingestion and structure | Less directly tied to docketing |
| Separate `task-docketing` later | Clean boundary | Requires more modules later |

## Decision

Use `case-filing-ai` for the first prototype.

Add `task-docketing` later when task/deadline logic becomes its own module.

---

# 6. Deciding between four-document chunks and one-document processing

## Original idea

You were sending files in bundles of four.

So we considered processing four documents at a time.

## Concern

If the system processes four documents together, it may be harder to know:

```text
which document created which fact
which document created which task
which document caused a conflict
which document needs human review
```

## Better approach

Process one document at a time internally.

```text
Doc 1
→ extract
→ save output
→ update case snapshot

Doc 2
→ use prior snapshot as context
→ extract
→ save output
→ update case snapshot
```

## Tradeoff

| Approach | Benefit | Problem |
|---|---|---|
| Four-document chunk | Faster summary, easier upload UX | Worse auditability |
| One document at a time | Better source tracking and state updates | Requires snapshot logic |
| Hybrid | Best balance | Slightly more orchestration |

## Final decision

Use hybrid:

```text
Frontend can upload many files.
Backend processes one file at a time.
```

---

# 7. Processing order

## New issue

If the user uploads multiple PDFs, how does the backend know which file to process first?

## Rule we created

Use this priority:

```text
1. NYSCEF document number ascending
2. Filed date/time ascending
3. Filename order
4. Upload order
```

If the order is uncertain, mark:

```text
processing_order_needs_review
```

but still continue with the best available order.

## Tradeoff

| Ordering method | Benefit | Problem |
|---|---|---|
| NYSCEF doc number | Best reflects docket order | May not be extracted before full processing |
| Filed date/time | Good fallback | May be missing or OCR-garbled |
| Filename | Easy | Depends on file naming |
| Upload order | Always available | May be wrong |

## Final decision

Use the priority order above and save it in prompt versioning.

---

# 8. Adding part rules

## New issue

A filing cannot always be docketed correctly without rule context.

The system may need:

```text
court-wide rules
county rules
judge rules
part rules
case-type rules
document-specific rules
firm/internal workflow rules
```

## Example

For a Queens med-mal HHC case, the system may need the relevant part rules before deciding:

```text
whether appearance is required
whether a form must be emailed
when a conference submission is due
how NOI filing should be handled
```

## Tradeoff

| Approach | Benefit | Problem |
|---|---|---|
| Put all rules in one prompt | Simple | Too large, noisy, risky |
| Store rules separately and retrieve relevant ones | Cleaner and scalable | Requires rule storage/retrieval |
| Paste rule text manually for prototype | Fastest practical option | Not scalable yet |

## Final decision for prototype

Use simple part rule input:

```text
Frontend lets user paste/upload part rule text.
Backend saves it with the batch.
Each document prompt receives that part rule text.
```

Later, build a real `court-rules` module.

---

# 9. Human review scope

## Earlier concern

At first, it seemed like many things might need human review:

```text
party names
document classifications
tasks
deadlines
witness roles
case phase
part rule application
```

But that would make the review queue too heavy.

## Better rule

Only block workflow for OCR/visual uncertainty.

Mandatory review should be limited to:

```text
handwriting
bad OCR
unclear dates
checkboxes that control meaning
stamps
postal receipts
signature/date ambiguity
rotated or low-quality pages
```

Normal AI extraction can be saved as:

```text
ai_extracted_unreviewed
```

## Tradeoff

| Review policy | Benefit | Problem |
|---|---|---|
| Review everything | Safer | Too much manual work |
| Review nothing | Fast | Too risky |
| Review only OCR/visual uncertainty | Practical balance | AI errors may need later correction |

## Final decision

Only OCR/visual uncertainty blocks workflow.

Everything else is saved with source, confidence, and status.

---

# 10. Text vault idea

## New issue

We wanted to save:

```text
embedded text
OCR text
AI parsed JSON
human reviewed output
```

separately.

## Why

Parsed text is not the same as verified truth.

```text
Embedded text = what the PDF gave us
OCR text = what vision/OCR recovered
AI parsed JSON = what the model extracted
Human reviewed text = what a person approved
```

## Tradeoff

| Approach | Benefit | Problem |
|---|---|---|
| Save only final output | Simple | Poor audit trail |
| Save every version | Strong auditability | More files/storage |
| Save versions locally first | Good prototype balance | Needs cleanup later |

## Final decision

For the prototype, save:

```text
embedded-text.txt
ocr-text.txt
ai-parsed.json
human-reviewed.json
extraction-quality.json
```

per document.

---

# 11. Backend queue and persistence

## New issue

If processing happens in the frontend, it may stop if the user changes tabs or refreshes.

## Final rule

```text
Frontend can disappear.
Backend queue must continue.
```

## Backend should persist:

```text
batch.json
queue.json
processing-log.jsonl
```

## Tradeoff

| Approach | Benefit | Problem |
|---|---|---|
| Frontend processing | Easy UI prototype | Fragile, stops on refresh |
| Backend processing | Reliable | Needs queue/status handling |
| Full worker queue | Production-ready | Too much for prototype |
| Simple backend sequential queue | Good balance | Not highly scalable |

## Final decision

Use a simple backend sequential queue.

No complex worker system yet.

---

# 12. Full architecture vs small prototype

## Big architecture

The full architecture would include:

```text
case-filing-ai
filing-text-vault
case-workflow
court-rules
task-docketing
human-review
filing-pipeline
```

## Why we paused it

It was too much for the first Cursor build.

You asked a practical question:

> Can’t prompt engineering already do most of this?

The answer was yes, for the first prototype.

So we reduced the build.

---

# 13. Final prototype plan

## Frontend

One page that can:

```text
paste/upload part rule
upload multiple PDFs
click Process
show processing status
show extracted JSON/results
```

## Backend

One simplified backend flow:

```text
save files
save part rule text
process PDFs one at a time
extract embedded text
mark OCR needed if text is poor
send document text + prior snapshot + part rule to one master prompt
save returned JSON
update case-snapshot.json
write processing logs
```

## Local storage

```text
data/
  case-filing-ai/
    batches/
      batch-001/
        rule/
          part-rules.txt

        uploads/
          001.pdf
          002.pdf
          003.pdf

        outputs/
          doc-001.json
          doc-002.json
          doc-003.json

        case-snapshot.json
        processing-log.jsonl
```

## API

```text
POST /case-filing-ai/process-batch
GET  /case-filing-ai/batches/:batchId/results
GET  /case-filing-ai/batches/:batchId/status
```

## Tradeoff

| Choice | Benefit | Cost |
|---|---|---|
| One master prompt | Fast to build | Less modular |
| Local JSON | Easy to inspect | Not ideal for long-term querying |
| Paste/upload part rule | Simple | No rule database yet |
| Embedded text first | Cheap and fast | Needs OCR later |
| OCR marked but not fully built | Faster MVP | Visual fallback comes later |
| Backend sequential queue | Reliable enough | Not production-scale |

---

# 14. Final build scope

The first build should not try to do everything.

It should prove this loop:

```text
Upload rule + PDFs
→ backend saves files
→ backend processes one document at a time
→ master prompt extracts structure
→ local JSON saves result
→ case snapshot updates
→ frontend shows output
```

## Do not build yet

```text
database
authentication
full OCR/VL
full court rule database
full modular service split
complex worker queue
production dashboard
```

## Build now

```text
frontend upload
part rule input
backend local save
embedded text extraction
one master prompt
case snapshot update
local JSON outputs
simple status/results display
```

---

# Final takeaway

The plan evolved through tradeoffs.

We started with a large, clean architecture.

Then we realized the first version should be smaller.

The final first prototype is intentionally simple:

```text
Prompt engineering first.
Local JSON first.
One document at a time.
Part rule text included.
Backend owns processing.
Frontend shows status and results.
```

The larger architecture is still the destination.

But the first working version should prove the core workflow before adding more modules.
