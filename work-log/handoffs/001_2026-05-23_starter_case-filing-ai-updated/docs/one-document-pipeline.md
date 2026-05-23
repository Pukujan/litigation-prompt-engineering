# One-Document Pipeline

## Internal processing flow

```text
Input:
  - current document
  - current CaseStateSnapshot
  - known case context
  - retrieved relevant rules

Pipeline:
  1. document intake
  2. text quality check
  3. embedded text extraction
  4. OCR if needed
  5. save text versions to filing-text-vault
  6. document classification
  7. fact extraction
  8. compare against prior CaseStateSnapshot
  9. enrich partial models
  10. detect conflicts
  11. docket entry extraction
  12. rule retrieval
  13. task/deadline generation
  14. visual/OCR human review item creation
  15. save AI parsed output as unreviewed
  16. update CaseStateSnapshot
```

## Context rule

```text
Prior context may guide interpretation.
Prior context does not confirm facts in the current document.
```

## Enrichment rule

```text
Early documents create partial models.
Later documents enrich, correct, or supersede them.
Do not silently overwrite.
```
