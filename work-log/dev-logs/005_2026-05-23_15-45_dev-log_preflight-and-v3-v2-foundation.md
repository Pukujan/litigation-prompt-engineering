# Dev log: Pre-flight PII wipe + v3 foundation + v2 parsed cache core

| Field | Value |
|-------|--------|
| **Patch id** | 005-preflight, 005-v3-A–D, 005-v2-p0–p2 (partial) |
| **Date** | 2026-05-23 |
| **Time** | 15-45 |

## Summary

Removed legacy case_001 runtime data (batches, eval-bundles, golden wipe), regenerated `consolidated-models.json`, sanitized API examples. Shipped file-exchange layout, repo artifact docs, contract manifest/changelog, storage contracts, parsed document cache, parsed-doc API routes, and `pipelineVersions` on batch outputs.

## Changes

- `file-exchange/`, `formatExchangeTimestamp`, cursor inbox rule
- `docs/architecture/REPO_ARTIFACT_LAYOUT.md`, `contracts/manifest.json`, `changelog.jsonl`
- `case-filing-ai/contracts/*`, `storagePaths.js`, `parsedDocumentCache.service.js`, `STORAGE.md`
- Golden test fixtures only (synthetic, no party names)
- `npm test` (backend): 60 pass

## Rollback

Revert git commit; restore data from backup if needed. Pin `MASTER_PROMPT_VERSION=v1`.

## Not in this slice

- Court-rules fixtures + ranked rules in prompt (v2 p3)
- Prompt v001 + `normalizeMasterOutput` (v2 p4)
- Full eval authority / parsed-golden checks (v2 p5)
- v3-E contract lint

## Follow-ups

- Import Maria synthetic bundle via `file-exchange/imports/{stamp}/`
- Rebuild golden expecteds from synthetic case when ready
