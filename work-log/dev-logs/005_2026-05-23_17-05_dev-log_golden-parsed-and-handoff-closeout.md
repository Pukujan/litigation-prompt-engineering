# Dev log — 005 handoff closeout

**Date:** 2026-05-23  
**Scope:** Remaining v2/v3 handoff items (golden parsed, lint, command, docs)

## Completed

### Golden parsed (v2 Phase 2 / acceptance #11)
- Maria synthetic bundle → `file-exchange/imports/synthetic-case-001-maria-bundle/`
- `npm run ingest:golden-parsed` → 14 docs under `evals/golden/case_001/parsed/`
- `runParsedDocumentChecks()` wired in `evalRunner`
- `GOLDEN_DATASET_VERSION` → `case_001-v1-parsed-synthetic`

### Remaining v2 items
- `schemas/parsed-document.schema.js` — PATCH validation
- `uploadBatch` sets `reviewStatusAtEvalTime`
- Frontend: `apiPatch`, `listParsedDocuments`, `getParsedDocument`, `patchParsedReviewStatus`

### v3-E
- `npm run lint:repo-artifacts`
- `.cursor/commands/planning-study-log.md`

### Handoff docs
- v2 + v3 status → **Implemented**; checklist items checked
- `work-log/INDEX.md` dev-log rows updated

## Verification

```bash
npm test
npm run lint:api-docs
npm run lint:contracts
npm run lint:repo-artifacts
```

## Backlog (unchanged — post-005)

See v3 handoff backlog: filing-text-vault module, cross-batch parse vault, eval-bundles delete API, etc.
