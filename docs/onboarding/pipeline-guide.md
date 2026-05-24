# Case Filing Pipeline Guide

## Overview

Case Filing AI processes uploaded filings **one document at a time** in sorted order. Each document passes through parse, court-rules matching, LLM extraction, snapshot merge, and golden eval.

## Runtime modules

1. **Part rules** — optional paste/upload; may be inferred from early filings.
2. **Parse** — PDF/text extraction and parsed-document cache under `parsed-documents/`.
3. **Court rules** — fixtures from `data/court-rules/fixtures/` matched and ranked per document.
4. **Extraction (LLM)** — master prompt returns metadata, parties, tasks, deadlines.
5. **Case snapshot** — rolling `case-snapshot.json` updated after each document.
6. **Golden eval** — compares outputs to `evals/golden/{caseId}/` expected files.

## Batch folder

```text
data/case-filing-ai/batches/{batchId}/
  uploads/
  parsed-documents/doc-NNN/
  outputs/doc-NNN.json
  evals/
  rule/
  case-snapshot.json
  processing-log.jsonl
```

## Eval

After each document, the eval runner scores identity, metadata, parties, tasks, deadlines, human review, snapshot, rule authority, rule sources, extraction quality, and pipeline versions.

Statuses: `pass`, `partial`, `fail`.

## Downloads

- **Batch package** — full batch folder plus `rules-applied/` summary and eval copies.
- **Case export** — all batches for a golden case, optionally including golden fixtures.
