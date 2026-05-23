# Dev log — 005 v2 phases 3–7 + v3-E

**Date:** 2026-05-23  
**Scope:** Court rules pipeline, v001 prompt, eval provenance, API docs, contract lint

## Completed

### v2 Phase 3 — Court rules
- Fixtures: `data/court-rules/fixtures/case_001/*.json` (3 synthetic rules)
- Services: `ruleStore`, `ruleMatch`, `ruleAuthority` under `court-rules/services/`
- Wired into `uploadBatch` before master prompt (`rankedRules` block)
- `ruleAuthority.contract.js` ranks aligned (case/later > part/county > cplr)

### v2 Phase 4 — Prompt v001
- `prompts/v001_master-case-filing.prompt.md` + `PROMPT_VERSIONS.v001`
- `normalizeMasterOutput()` — maps v001 → legacy eval/snapshot fields
- `masterPrompt.service.js` — `{{rankedRules}}`, normalizes all responses

### v2 Phase 5 — Eval extensions
- `runRuleAuthorityChecks()` — supersession, doc-13 NOI guardrail, part vs county
- `attachEvalProvenance()` on eval reports
- Document results include `ruleSourcesChecked`, `rankedRules`

### v2 Phase 6 — Parsed API docs
- `docs/case-filing-ai/API.md` + `docs/API.md` registry updated

### v2 Phase 7 — Tests
- `normalizeMasterOutput.test.js`, `runRuleAuthorityChecks.test.js`, `ruleAuthority.test.js`

### v3-E
- `npm run lint:contracts` — validates manifest paths (file + doc entries)

## Verification

```bash
npm test          # 66 backend + 12 frontend pass
npm run lint:api-docs
npm run lint:contracts
```

## Notes

- Default master prompt remains **v1**; set `MASTER_PROMPT_VERSION=v001` to use ranked-rules shape.
- Golden `case_001` is minimal synthetic; expand when Maria bundle is imported via `file-exchange/imports/`.
- `/planning-study-log` Cursor command still optional (not in this slice).
