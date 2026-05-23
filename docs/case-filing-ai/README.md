# Case Filing AI Updated Starter

Starter blueprint for a modular MVC case filing AI system.

**HTTP API:** [API.md](./API.md) · [All modules](../API.md)

## Core recommendation

Process **one document at a time internally**, while carrying forward prior case context through `CaseStateSnapshot`.

Use bundle uploads only as convenience.

```text
Bundle upload
  → split into individual files
  → process Doc 1
  → update CaseStateSnapshot
  → process Doc 2 with updated snapshot
  → update CaseStateSnapshot
  → repeat
  → show bundle summary
```

## Core principle

```text
Prior case context can guide interpretation.
Only the current source document can confirm new facts.
```

## Review policy

Only block workflow for OCR/handwriting/visual uncertainty:

- handwriting
- bad OCR
- unclear stamps
- checkboxes that control meaning
- postal receipts
- signature/date ambiguity
- rotated or low-quality pages
- visually unclear court-order fields

Normal AI extraction is saved as `ai_extracted_unreviewed` and can be enriched or corrected later.

## Module split

```text
backend/src/modules/
  case-filing-ai/
  filing-text-vault/
  case-workflow/
  court-rules/
  task-docketing/
  human-review/
  filing-pipeline/
```

## Main boundary

```text
Modules own domain logic.
Pipeline owns execution order.
```
