# Dev log (human): API inventory in dev logs and tree ignores

| Field | Value |
|-------|--------|
| **Entry** | 005 |
| **Date** | 2026-05-23 |
| **Time** | 16-57 |
| **Filename** | `005_2026-05-23_16-57_dev-log_api-inventory-and-tree-ignores.md` |
| **Agent audit** | [005_2026-05-23_16-57_dev-log-agent_api-inventory-and-tree-ignores.json](../agent/005_2026-05-23_16-57_dev-log-agent_api-inventory-and-tree-ignores.json) |
| **Git** | `unknown` @ `unknown` |
| **Handoff** | _optional: work-log/handoffs/…_ |
| **PR / commit** | _(fill before push)_ |

---

## Executive summary

_One paragraph: what shipped and why it matters._

---

## Goals and scope

- **In scope:**
- **Out of scope:**

---

## Decisions

| ID | Decision | Rationale | Alternatives rejected |
|----|----------|-----------|------------------------|
| D1 | _fill_ | _fill_ | _fill_ |

---

## APIs and versions (auto + fill)

### HTTP — active

| Method | Path | Module | Description |
|--------|------|--------|-------------|
| GET | `/api/case-filing-ai/health` | Case Filing AI | Module health and config summary |
| POST | `/api/case-filing-ai/extract-rule-text` | Case Filing AI | Extract text from uploaded part-rule file |
| POST | `/api/case-filing-ai/process-batch` | Case Filing AI | Upload filings and run master prompt pipeline |
| GET | `/api/case-filing-ai/batches/:batchId/status` | Case Filing AI | Batch processing status |
| GET | `/api/case-filing-ai/batches/:batchId/results` | Case Filing AI | Aggregated batch results |
| GET | `/api/case-filing-ai/batches/:batchId/parsed-documents` | Case Filing AI | List parsed-document cache keys |
| GET | `/api/case-filing-ai/batches/:batchId/parsed-documents/:documentId` | Case Filing AI | Parsed cache detail for one document |
| PATCH | `/api/case-filing-ai/batches/:batchId/parsed-documents/:documentId/review-status` | Case Filing AI | Update parsed-document review status |
| GET | `/api/case-filing-ai/batches/:batchId/evals` | Case Filing AI | Golden eval reports for batch |
| POST | `/api/case-filing-ai/batches/:batchId/evals/bundle` | Case Filing AI | Copy one batch eval reports to eval-bundles |
| POST | `/api/case-filing-ai/evals/bundle` | Case Filing AI | Copy multiple batch eval reports to eval-bundles |
| POST | `/api/case-filing-ai/evals/cases/:goldenCaseId/bundle` | Case Filing AI | Copy golden fixtures plus case eval runs |
| GET | `/api/case-filing-ai/cases/:goldenCaseId` | Case Filing AI | Inventory batches for a golden case |
| POST | `/api/case-filing-ai/cases/:goldenCaseId/export` | Case Filing AI | Export full batch folders to case-exports |
| DELETE | `/api/case-filing-ai/cases/:goldenCaseId` | Case Filing AI | Delete batch folders for a case (requires confirm) |
| GET | `/api/model-condenser/health` | Model condenser | Module health |
| POST | `/api/model-condenser/condense` | Model condenser | Regenerate consolidated-models.json |
| GET | `/api/model-condenser/consolidated` | Model condenser | Read consolidated schema inventory |
| GET | `/api/filing-pipeline/health` | Filing pipeline | Module health |
| GET | `/api/filing-pipeline/steps` | Filing pipeline | List planned pipeline steps |

### HTTP — stub (health only)

| Method | Path | Module | Description |
|--------|------|--------|-------------|
| GET | `/api/case-workflow/health` | Case workflow | Module health (stub) |
| GET | `/api/court-rules/health` | Court rules | Module health (stub) |
| GET | `/api/filing-text-vault/health` | Filing text vault | Module health (stub) |
| GET | `/api/human-review/health` | Human review | Module health (stub) |
| GET | `/api/task-docketing/health` | Task docketing | Module health (stub) |

### HTTP — deprecated

_none registered in docs/API.md_

### Versioned contracts (current defaults)

```json
{
  "app": "2.0.0",
  "storageLayout": "v001",
  "parsedArtifacts": "v001",
  "parser": "pdf-embedded-v1",
  "ocr": "openrouter-vision-v1",
  "masterPrompt": "v1",
  "rulePrompt": "v1",
  "snapshotPrompt": "v1",
  "ruleSet": "fixtures-v0",
  "goldenDataset": "case_001-v2-full-expected"
}
```

### Master prompt versions

- **v1** — Original master prompt. (`master-case-filing.prompt.md`)
- **compact** — Bounded snapshot + strict JSON output (recommended for 6+ documents). (`master-case-filing.compact.prompt.md`)
- **v2** — Alias for compact. (`master-case-filing.compact.prompt.md`)
- **v001** — Ranked rule sources + documentFacts / ruleBasedTasks output shape. (`v001_master-case-filing.prompt.md`)

_Env: `MASTER_PROMPT_VERSION` default `v1`; allowed: v1, compact, v2, v001_

### Deprecated CLI

- `scripts/export-consolidated-models.mjs` → use npm run condense-models (backend/) or POST /api/model-condenser/condense

_Fill any API changes this session not yet in `docs/API.md`._

---

## Changes (detailed)

### Backend / API

- _files, routes, services_

### Frontend

- _components, API client_

### Data / contracts / prompts

- _paths, version bumps_

### Tooling / CI / docs

- _scripts, AGENTS.md, work-log_

---

## Iterations

1. **Attempt 1** — _what you tried_ → _outcome_
2. **Attempt 2** — _…_

---

## Tests

### Passed

- _command + what it verified_

### Failed (if any)

- _command, error snippet, fix or deferral_

### Not run

- _and why_

---

## What got better

- _measurable or qualitative wins_

---

## Trade-offs

- _what we accepted vs ideal_

---

## Regressions / risks

- _known gaps, flakiness, tech debt_

---

## Follow-ups

- [ ] _next session items_

---

## Git snapshot (auto)

**Branch:** `unknown`  
**Commit:** `unknown`

### Changed files (porcelain)

```
(clean)
```

### Diff stat vs HEAD

```
(no diff vs HEAD)
```

### Recent commits

```

```

---

## Repository tree at push (auto)

_Ignores: `node_modules`, `.git`, `dist`, `build` (same as `tree -I "node_modules|.git|dist|build"`)._

```
legal-prmpt-eng/
├── .gitignore
├── AGENTS.md
├── package.json
├── README.md
├── .cursor/
│   ├── commands/
│   │   ├── planning-study-log.md
│   │   └── pre-push-dev-log.md
│   └── rules/
│       ├── api-documentation.mdc
│       └── file-exchange-inbox.mdc
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── package-lock.json
│   ├── package.json
│   ├── db/
│   │   └── migrations/
│   │       └── 001_case_filing_ai_schema.sql
│   ├── scripts/
│   │   ├── check-module-boundaries.mjs
│   │   └── check-module-layers.mjs
│   └── src/
│       ├── core/
│       │   ├── module-loader.js
│       │   └── server.js
│       ├── modules/
│       │   ├── .gitkeep
│       │   ├── _reference/
│       │   │   ├── index.js
│       │   │   ├── README.md
│       │   │   ├── adapters/
│       │   │   │   └── README.md
│       │   │   ├── config/
│       │   │   │   └── index.js
│       │   │   ├── domain/
│       │   │   │   └── README.md
│       │   │   ├── evals/
│       │   │   │   ├── README.md
│       │   │   │   ├── datasets/
│       │   │   │   │   └── example.cases.json
│       │   │   │   └── runners/
│       │   │   │       └── example.eval.mjs
│       │   │   ├── events/
│       │   │   │   └── index.js
│       │   │   ├── prompts/
│       │   │   │   ├── manifest.json
│       │   │   │   └── templates/
│       │   │   │       └── example.prompt.js
│       │   │   ├── repositories/
│       │   │   │   └── .gitkeep
│       │   │   ├── routes/
│       │   │   │   ├── health.routes.js
│       │   │   │   └── index.js
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   └── health.service.js
│       │   │   ├── tests/
│       │   │   │   ├── integration/
│       │   │   │   │   └── health.routes.test.js
│       │   │   │   └── unit/
│       │   │   │       └── health.service.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── case-filing-ai/
│       │   │   ├── index.js
│       │   │   ├── README.md
│       │   │   ├── adapters/
│       │   │   │   ├── openrouter.client.js
│       │   │   │   └── README.md
│       │   │   ├── config/
│       │   │   │   └── index.js
│       │   │   ├── contracts/
│       │   │   │   ├── parsedDocumentArtifacts.contract.js
│       │   │   │   ├── pipelineVersions.js
│       │   │   │   └── storageLayout.contract.js
│       │   │   ├── domain/
│       │   │   │   └── README.md
│       │   │   ├── evals/
│       │   │   │   ├── README.md
│       │   │   │   ├── datasets/
│       │   │   │   │   └── example.cases.json
│       │   │   │   └── runners/
│       │   │   │       └── example.eval.mjs
│       │   │   ├── events/
│       │   │   │   └── index.js
│       │   │   ├── prompts/
│       │   │   │   ├── master-case-filing.compact.prompt.md
│       │   │   │   ├── master-case-filing.prompt.md
│       │   │   │   ├── promptVersions.js
│       │   │   │   ├── rule-parse.prompt.md
│       │   │   │   ├── v001_master-case-filing.prompt.md
│       │   │   │   └── templates/
│       │   │   ├── repositories/
│       │   │   │   └── .gitkeep
│       │   │   ├── routes/
│       │   │   │   ├── caseFiling.routes.js
│       │   │   │   ├── health.routes.js
│       │   │   │   └── index.js
│       │   │   ├── schemas/
│       │   │   │   ├── health.schema.js
│       │   │   │   └── parsed-document.schema.js
│       │   │   ├── services/
│       │   │   │   ├── caseData.service.js
│       │   │   │   ├── caseSnapshot.service.js
│       │   │   │   ├── documentText.service.js
│       │   │   │   ├── evalBundle.service.js
│       │   │   │   ├── evalRunner.service.js
│       │   │   │   ├── goldenDataset.service.js
│       │   │   │   ├── health.service.js
│       │   │   │   ├── localJsonStore.service.js
│       │   │   │   ├── masterPrompt.service.js
│       │   │   │   ├── ocr.service.js
│       │   │   │   ├── officeText.service.js
│       │   │   │   ├── parsedDocumentCache.service.js
│       │   │   │   ├── pdfText.service.js
│       │   │   │   ├── ruleText.service.js
│       │   │   │   └── uploadBatch.service.js
│       │   │   ├── tests/
│       │   │   │   ├── fixtures/
│       │   │   │   │   └── batch-002/
│       │   │   │   │       ├── case-snapshot.json
│       │   │   │   │       └── outputs/
│       │   │   │   │           └── doc-001.json
│       │   │   │   ├── helpers/
│       │   │   │   │   └── minimalDocx.js
│       │   │   │   ├── integration/
│       │   │   │   │   ├── batch.routes.test.js
│       │   │   │   │   ├── case-data.routes.test.js
│       │   │   │   │   ├── eval-bundle.routes.test.js
│       │   │   │   │   ├── eval.routes.test.js
│       │   │   │   │   ├── health.routes.test.js
│       │   │   │   │   └── rule-text.routes.test.js
│       │   │   │   └── unit/
│       │   │   │       ├── auditNotes.test.js
│       │   │   │       ├── document-upload.test.js
│       │   │   │       ├── documentText.service.test.js
│       │   │   │       ├── evalRunner.provenance.test.js
│       │   │   │       ├── evalRunner.service.test.js
│       │   │   │       ├── health.service.test.js
│       │   │   │       ├── masterPrompt.service.test.js
│       │   │   │       ├── normalizeMasterOutput.test.js
│       │   │   │       ├── ocr.service.test.js
│       │   │   │       ├── officeText.service.test.js
│       │   │   │       ├── pdfText.service.test.js
│       │   │   │       ├── ruleText.service.test.js
│       │   │   │       ├── runMetadata.test.js
│       │   │   │       ├── runParsedDocumentChecks.test.js
│       │   │   │       ├── runRuleAuthorityChecks.test.js
│       │   │   │       ├── snapshotContext.test.js
│       │   │   │       ├── snapshotMerge.test.js
│       │   │   │       ├── storagePaths.test.js
│       │   │   │       ├── uploadBatch.continue.test.js
│       │   │   │       └── uploadBatch.service.test.js
│       │   │   └── utils/
│       │   │       ├── auditNotes.js
│       │   │       ├── caseBatchDiscovery.js
│       │   │       ├── document-upload.js
│       │   │       ├── evalNormalize.js
│       │   │       ├── evalProvenance.js
│       │   │       ├── extractionErrors.js
│       │   │       ├── index.js
│       │   │       ├── normalizeMasterOutput.js
│       │   │       ├── runMetadata.js
│       │   │       ├── runParsedDocumentChecks.js
│       │   │       ├── runRuleAuthorityChecks.js
│       │   │       ├── snapshotContext.js
│       │   │       ├── snapshotMerge.js
│       │   │       └── storagePaths.js
│       │   ├── case-workflow/
│       │   │   ├── index.js
│       │   │   ├── README.md
│       │   │   ├── adapters/
│       │   │   │   └── README.md
│       │   │   ├── config/
│       │   │   │   └── index.js
│       │   │   ├── domain/
│       │   │   │   └── README.md
│       │   │   ├── evals/
│       │   │   │   ├── README.md
│       │   │   │   ├── datasets/
│       │   │   │   │   └── example.cases.json
│       │   │   │   └── runners/
│       │   │   │       └── example.eval.mjs
│       │   │   ├── events/
│       │   │   │   └── index.js
│       │   │   ├── prompts/
│       │   │   │   ├── manifest.json
│       │   │   │   └── templates/
│       │   │   │       └── case-state-update.prompt.js
│       │   │   ├── repositories/
│       │   │   │   └── .gitkeep
│       │   │   ├── routes/
│       │   │   │   ├── health.routes.js
│       │   │   │   └── index.js
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   └── health.service.js
│       │   │   ├── tests/
│       │   │   │   ├── integration/
│       │   │   │   │   └── health.routes.test.js
│       │   │   │   └── unit/
│       │   │   │       └── health.service.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── court-rules/
│       │   │   ├── index.js
│       │   │   ├── README.md
│       │   │   ├── adapters/
│       │   │   │   └── README.md
│       │   │   ├── config/
│       │   │   │   └── index.js
│       │   │   ├── contracts/
│       │   │   │   └── ruleAuthority.contract.js
│       │   │   ├── domain/
│       │   │   │   └── README.md
│       │   │   ├── evals/
│       │   │   │   ├── README.md
│       │   │   │   ├── datasets/
│       │   │   │   │   └── example.cases.json
│       │   │   │   └── runners/
│       │   │   │       └── example.eval.mjs
│       │   │   ├── events/
│       │   │   │   └── index.js
│       │   │   ├── prompts/
│       │   │   │   ├── manifest.json
│       │   │   │   └── templates/
│       │   │   │       └── rule-context.prompt.js
│       │   │   ├── repositories/
│       │   │   │   └── .gitkeep
│       │   │   ├── routes/
│       │   │   │   ├── health.routes.js
│       │   │   │   └── index.js
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   ├── health.service.js
│       │   │   │   ├── ruleAuthority.service.js
│       │   │   │   ├── ruleMatch.service.js
│       │   │   │   └── ruleStore.service.js
│       │   │   ├── tests/
│       │   │   │   ├── integration/
│       │   │   │   │   └── health.routes.test.js
│       │   │   │   └── unit/
│       │   │   │       ├── health.service.test.js
│       │   │   │       └── ruleAuthority.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── filing-pipeline/
│       │   │   ├── index.js
│       │   │   ├── README.md
│       │   │   ├── adapters/
│       │   │   │   └── README.md
│       │   │   ├── config/
│       │   │   │   └── index.js
│       │   │   ├── domain/
│       │   │   │   ├── pipeline-steps.js
│       │   │   │   └── README.md
│       │   │   ├── evals/
│       │   │   │   ├── README.md
│       │   │   │   ├── datasets/
│       │   │   │   │   └── example.cases.json
│       │   │   │   └── runners/
│       │   │   │       └── example.eval.mjs
│       │   │   ├── events/
│       │   │   │   └── index.js
│       │   │   ├── prompts/
│       │   │   │   ├── manifest.json
│       │   │   │   └── templates/
│       │   │   │       └── orchestrator.prompt.js
│       │   │   ├── repositories/
│       │   │   │   └── .gitkeep
│       │   │   ├── routes/
│       │   │   │   ├── health.routes.js
│       │   │   │   ├── index.js
│       │   │   │   └── pipeline.routes.js
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   ├── health.service.js
│       │   │   │   └── pipeline-steps.service.js
│       │   │   ├── tests/
│       │   │   │   ├── integration/
│       │   │   │   │   ├── health.routes.test.js
│       │   │   │   │   └── pipeline.routes.test.js
│       │   │   │   └── unit/
│       │   │   │       └── health.service.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── filing-text-vault/
│       │   │   ├── index.js
│       │   │   ├── README.md
│       │   │   ├── adapters/
│       │   │   │   └── README.md
│       │   │   ├── config/
│       │   │   │   └── index.js
│       │   │   ├── domain/
│       │   │   │   └── README.md
│       │   │   ├── evals/
│       │   │   │   ├── README.md
│       │   │   │   ├── datasets/
│       │   │   │   │   └── example.cases.json
│       │   │   │   └── runners/
│       │   │   │       └── example.eval.mjs
│       │   │   ├── events/
│       │   │   │   └── index.js
│       │   │   ├── prompts/
│       │   │   │   ├── manifest.json
│       │   │   │   └── templates/
│       │   │   │       └── filing-text-vault.prompt.js
│       │   │   ├── repositories/
│       │   │   │   └── .gitkeep
│       │   │   ├── routes/
│       │   │   │   ├── health.routes.js
│       │   │   │   └── index.js
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   └── health.service.js
│       │   │   ├── tests/
│       │   │   │   ├── integration/
│       │   │   │   │   └── health.routes.test.js
│       │   │   │   └── unit/
│       │   │   │       └── health.service.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── human-review/
│       │   │   ├── index.js
│       │   │   ├── README.md
│       │   │   ├── adapters/
│       │   │   │   └── README.md
│       │   │   ├── config/
│       │   │   │   └── index.js
│       │   │   ├── domain/
│       │   │   │   └── README.md
│       │   │   ├── evals/
│       │   │   │   ├── README.md
│       │   │   │   ├── datasets/
│       │   │   │   │   └── example.cases.json
│       │   │   │   └── runners/
│       │   │   │       └── example.eval.mjs
│       │   │   ├── events/
│       │   │   │   └── index.js
│       │   │   ├── prompts/
│       │   │   │   ├── manifest.json
│       │   │   │   └── templates/
│       │   │   │       └── human-review.prompt.js
│       │   │   ├── repositories/
│       │   │   │   └── .gitkeep
│       │   │   ├── routes/
│       │   │   │   ├── health.routes.js
│       │   │   │   └── index.js
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   └── health.service.js
│       │   │   ├── tests/
│       │   │   │   ├── integration/
│       │   │   │   │   └── health.routes.test.js
│       │   │   │   └── unit/
│       │   │   │       └── health.service.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── model-condenser/
│       │   │   ├── index.js
│       │   │   ├── README.md
│       │   │   ├── config/
│       │   │   │   └── index.js
│       │   │   ├── events/
│       │   │   │   └── index.js
│       │   │   ├── routes/
│       │   │   │   ├── health.routes.js
│       │   │   │   ├── index.js
│       │   │   │   └── modelCondenser.routes.js
│       │   │   ├── services/
│       │   │   │   ├── health.service.js
│       │   │   │   ├── modelCondenser.facade.js
│       │   │   │   └── modelCondenser.service.js
│       │   │   ├── tests/
│       │   │   │   ├── integration/
│       │   │   │   │   └── modelCondenser.routes.test.js
│       │   │   │   └── unit/
│       │   │   │       └── modelCondenser.service.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   └── task-docketing/
│       │       ├── index.js
│       │       ├── README.md
│       │       ├── adapters/
│       │       │   └── README.md
│       │       ├── config/
│       │       │   └── index.js
│       │       ├── domain/
│       │       │   └── README.md
│       │       ├── evals/
│       │       │   ├── README.md
│       │       │   ├── datasets/
│       │       │   │   └── example.cases.json
│       │       │   └── runners/
│       │       │       └── example.eval.mjs
│       │       ├── events/
│       │       │   └── index.js
│       │       ├── prompts/
│       │       │   ├── manifest.json
│       │       │   └── templates/
│       │       │       └── task-deadline.prompt.js
│       │       ├── repositories/
│       │       │   └── .gitkeep
│       │       ├── routes/
│       │       │   ├── health.routes.js
│       │       │   └── index.js
│       │       ├── schemas/
│       │       │   └── health.schema.js
│       │       ├── services/
│       │       │   └── health.service.js
│       │       ├── tests/
│       │       │   ├── integration/
│       │       │   │   └── health.routes.test.js
│       │       │   └── unit/
│       │       │       └── health.service.test.js
│       │       └── utils/
│       │           └── index.js
│       └── shared/
│           ├── ai/
│           │   └── prompt-registry.js
│           ├── domain/
│           │   └── case-filing/
│           │       └── core-models.js
│           ├── events/
│           │   └── index.js
│           ├── http/
│           │   └── errors.js
│           ├── testing/
│           │   └── create-test-app.js
│           └── utils/
│               ├── consolidatedExport.js
│               ├── formatExchangeTimestamp.js
│               └── formatExchangeTimestamp.test.js
├── data/
│   ├── case-filing-ai/
│   │   ├── batches/
│   │   └── examples/
│   │       ├── case-snapshot.json
│   │       └── case.json
│   └── court-rules/
│       └── fixtures/
│           └── case_001/
│               ├── cplr-3212-summary.json
│               ├── queens-county-practice.json
│               └── queens-part-10-general.json
├── docs/
│   ├── API.md
│   ├── DEVLOG_V2.md
│   ├── PUBLISHING.md
│   ├── README.md
│   ├── STARTER_PACK.md
│   ├── architecture/
│   │   ├── API_DOCUMENTATION_CONTRACT.md
│   │   ├── ARCHITECTURE_GUARDRAILS.md
│   │   ├── MODULE_INTERNAL_CONTRACT.md
│   │   ├── REPO_ARTIFACT_LAYOUT.md
│   │   └── contracts/
│   │       ├── changelog.jsonl
│   │       └── manifest.json
│   ├── case-filing-ai/
│   │   ├── API.md
│   │   ├── guardrails.md
│   │   ├── INTEGRATION.md
│   │   ├── module-boundaries.md
│   │   ├── one-document-pipeline.md
│   │   ├── README.md
│   │   ├── STORAGE.md
│   │   └── suggested-work-tree.md
│   ├── case-workflow/
│   │   └── API.md
│   ├── court-rules/
│   │   └── API.md
│   ├── filing-pipeline/
│   │   └── API.md
│   ├── filing-text-vault/
│   │   └── API.md
│   ├── human-review/
│   │   └── API.md
│   ├── model-condenser/
│   │   └── API.md
│   └── task-docketing/
│       └── API.md
├── eval-bundles/
├── evals/
│   └── golden/
├── file-exchange/
│   ├── README.md
│   ├── exports/
│   │   ├── .gitkeep
│   │   ├── consolidated-file-structure.json
│   │   ├── consolidated-models.json
│   │   ├── consolidated-prompts.json
│   │   ├── 2026-05-23_15-59-43Z_live-batch-run/
│   │   │   ├── curl.log
│   │   │   └── response.json
│   │   └── 2026-05-23_16-11-33Z_live-batch-run-v2/
│   │       ├── curl.log
│   │       └── response.json
│   └── imports/
│       ├── .gitkeep
│       └── 2026-05-23_15-59-43Z/
│           ├── synthetic_case_001_golden_dataset_ground_truth.json
│           ├── synthetic_case_001_golden_dataset_ground_truth.zip
│           └── synthetic_case_001_pdf_files/
│               ├── doc_001_SUMMONS_AND_VERIFIED_COMPLAINT.pdf
│               ├── doc_002_CERTIFICATE_OF_MERIT.pdf
│               ├── doc_003_EXHIBITS_SUPPORTING_SUMMONS_AND_COMPLAINT.pdf
│               ├── doc_004_NOTICE_OF_COMMENCEMENT_OF_ACTION_FOR_PERSONAL_INJURIES.pdf
│               ├── doc_005_AFFIRMATION_AFFIDAVIT_OF_SERVICE.pdf
│               ├── doc_006_ANSWER.pdf
│               ├── doc_007_DEMAND_FOR_BILL_OF_PARTICULARS.pdf
│               ├── doc_008_NOTICE_TO_TAKE_DEPOSITION.pdf
│               ├── doc_009_BILL_OF_PARTICULARS.pdf
│               ├── doc_010_NOTICE_OF_MEDICAL_MALPRACTICE_ACTION.pdf
│               ├── doc_011_RJI_MEDICAL_MALPRACTICE.pdf
│               ├── doc_012_PRELIMINARY_CONFERENCE_ORDER.pdf
│               ├── doc_013_COMPLIANCE_CONFERENCE_ORDER.pdf
│               ├── doc_014_COMPLIANCE_CONFERENCE_ORDER_DUPLICATE_OR_REFILED_WITH_CPLR_3.pdf
│               ├── manifest.json
│               └── SYNTHETIC_DATA_NOTICE.md
├── frontend/
│   ├── .env.example
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── index.css
│       ├── main.jsx
│       ├── core/
│       │   ├── App.jsx
│       │   └── moduleRegistry.jsx
│       ├── modules/
│       │   ├── .gitkeep
│       │   ├── _reference/
│       │   │   ├── index.jsx
│       │   │   ├── README.md
│       │   │   ├── components/
│       │   │   │   └── ModuleHealthCard.jsx
│       │   │   ├── hooks/
│       │   │   │   └── use-module-health.js
│       │   │   ├── pages/
│       │   │   │   └── _referencePage.jsx
│       │   │   ├── prompts/
│       │   │   │   └── README.md
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   └── health-api.js
│       │   │   ├── tests/
│       │   │   │   └── unit/
│       │   │   │       └── health.schema.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── case-filing-ai/
│       │   │   ├── index.jsx
│       │   │   ├── README.md
│       │   │   ├── api/
│       │   │   │   └── caseFilingApi.js
│       │   │   ├── components/
│       │   │   │   ├── EvalPanel.jsx
│       │   │   │   ├── FilingUploadPicker.jsx
│       │   │   │   ├── ModuleHealthCard.jsx
│       │   │   │   ├── PdfFilingsDropZone.jsx
│       │   │   │   ├── ProcessingStatus.jsx
│       │   │   │   ├── ResultsPanel.jsx
│       │   │   │   ├── RuleInputPanel.jsx
│       │   │   │   └── UploadedFileList.jsx
│       │   │   ├── hooks/
│       │   │   │   ├── use-document-file-accumulator.js
│       │   │   │   └── use-module-health.js
│       │   │   ├── pages/
│       │   │   │   └── CaseFilingUpload.jsx
│       │   │   ├── prompts/
│       │   │   │   └── README.md
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   └── health-api.js
│       │   │   ├── tests/
│       │   │   │   └── unit/
│       │   │   │       ├── document-files.test.js
│       │   │   │       └── health.schema.test.js
│       │   │   ├── types/
│       │   │   │   └── caseFiling.types.js
│       │   │   └── utils/
│       │   │       ├── document-files.js
│       │   │       └── index.js
│       │   ├── case-workflow/
│       │   │   ├── index.jsx
│       │   │   ├── README.md
│       │   │   ├── components/
│       │   │   │   └── ModuleHealthCard.jsx
│       │   │   ├── hooks/
│       │   │   │   └── use-module-health.js
│       │   │   ├── pages/
│       │   │   │   └── CaseWorkflowPage.jsx
│       │   │   ├── prompts/
│       │   │   │   └── README.md
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   └── health-api.js
│       │   │   ├── tests/
│       │   │   │   └── unit/
│       │   │   │       └── health.schema.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── court-rules/
│       │   │   ├── index.jsx
│       │   │   ├── README.md
│       │   │   ├── components/
│       │   │   │   └── ModuleHealthCard.jsx
│       │   │   ├── hooks/
│       │   │   │   └── use-module-health.js
│       │   │   ├── pages/
│       │   │   │   └── CourtRulesPage.jsx
│       │   │   ├── prompts/
│       │   │   │   └── README.md
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   └── health-api.js
│       │   │   ├── tests/
│       │   │   │   └── unit/
│       │   │   │       └── health.schema.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── filing-pipeline/
│       │   │   ├── index.jsx
│       │   │   ├── README.md
│       │   │   ├── components/
│       │   │   │   ├── ModuleHealthCard.jsx
│       │   │   │   └── PipelineStepsCard.jsx
│       │   │   ├── hooks/
│       │   │   │   ├── use-module-health.js
│       │   │   │   └── use-pipeline-steps.js
│       │   │   ├── pages/
│       │   │   │   └── FilingPipelinePage.jsx
│       │   │   ├── prompts/
│       │   │   │   └── README.md
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   ├── health-api.js
│       │   │   │   └── pipeline-api.js
│       │   │   ├── tests/
│       │   │   │   └── unit/
│       │   │   │       └── health.schema.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── filing-text-vault/
│       │   │   ├── index.jsx
│       │   │   ├── README.md
│       │   │   ├── components/
│       │   │   │   └── ModuleHealthCard.jsx
│       │   │   ├── hooks/
│       │   │   │   └── use-module-health.js
│       │   │   ├── pages/
│       │   │   │   └── FilingTextVaultPage.jsx
│       │   │   ├── prompts/
│       │   │   │   └── README.md
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   └── health-api.js
│       │   │   ├── tests/
│       │   │   │   └── unit/
│       │   │   │       └── health.schema.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── human-review/
│       │   │   ├── index.jsx
│       │   │   ├── README.md
│       │   │   ├── components/
│       │   │   │   └── ModuleHealthCard.jsx
│       │   │   ├── hooks/
│       │   │   │   └── use-module-health.js
│       │   │   ├── pages/
│       │   │   │   └── HumanReviewPage.jsx
│       │   │   ├── prompts/
│       │   │   │   └── README.md
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   └── health-api.js
│       │   │   ├── tests/
│       │   │   │   └── unit/
│       │   │   │       └── health.schema.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   └── task-docketing/
│       │       ├── index.jsx
│       │       ├── README.md
│       │       ├── components/
│       │       │   └── ModuleHealthCard.jsx
│       │       ├── hooks/
│       │       │   └── use-module-health.js
│       │       ├── pages/
│       │       │   └── TaskDocketingPage.jsx
│       │       ├── prompts/
│       │       │   └── README.md
│       │       ├── schemas/
│       │       │   └── health.schema.js
│       │       ├── services/
│       │       │   └── health-api.js
│       │       ├── tests/
│       │       │   └── unit/
│       │       │       └── health.schema.test.js
│       │       └── utils/
│       │           └── index.js
│       └── shared/
│           └── api/
│               └── client.js
├── models/
│   ├── consolidated-file-structure.json
│   ├── consolidated-models.json
│   └── consolidated-prompts.json
├── scripts/
│   ├── check-api-docs.mjs
│   ├── condense-file-structure.mjs
│   ├── condense-models.mjs
│   ├── condense-prompts.mjs
│   ├── consolidated-output.mjs
│   ├── export-consolidated-models.mjs
│   ├── import-to-file-exchange.mjs
│   ├── ingest-golden-expected.mjs
│   ├── ingest-golden-parsed.mjs
│   ├── lint-contracts.mjs
│   ├── lint-repo-artifacts.mjs
│   ├── new-module.mjs
│   ├── rerun-batch-evals.mjs
│   ├── resolve-import-stamp.mjs
│   ├── run-module-evals.mjs
│   ├── sync-cli-template.mjs
│   ├── write-pre-push-dev-log.mjs
│   ├── git-hooks/
│   │   └── pre-push.sample
│   └── lib/
│       ├── api-inventory.mjs
│       ├── git-snapshot.mjs
│       ├── module-scaffold.mjs
│       ├── repo-tree.mjs
│       └── run-tests.mjs
└── work-log/
    ├── INDEX.md
    ├── README.md
    ├── dev-logs/
    │   ├── 005_2026-05-23_15-45_dev-log_preflight-and-v3-v2-foundation.md
    │   ├── 005_2026-05-23_16-30_dev-log_v2-phases-3-7-complete.md
    │   ├── 005_2026-05-23_17-05_dev-log_golden-parsed-and-handoff-closeout.md
    │   ├── README.md
    │   ├── agent/
    │   │   └── 005_2026-05-23_16-54_dev-log-agent_pre-push-dual-dev-log-system.json
    │   ├── human/
    │   │   └── 005_2026-05-23_16-54_dev-log_pre-push-dual-dev-log-system.md
    │   ├── schemas/
    │   │   └── dev-log-agent.v1.schema.json
    │   └── templates/
    │       └── dev-log-human.template.md
    ├── handoffs/
    │   ├── 002_2026-05-23_00-42_handoff_second.md
    │   ├── 005_2026-05-23_10-49_handoff-original_parsed-cache-rule-authority.md
    │   ├── 005_2026-05-23_11-14_handoff-v2_planned-review-in-cursor.md
    │   ├── 005_2026-05-23_11-20_handoff-v3_filing-structure-architecture.md
    │   ├── INDEX.md
    │   ├── README.md
    │   └── 001_2026-05-23_starter_case-filing-ai-updated/
    │       ├── README.md
    │       ├── db/
    │       │   └── migrations/
    │       │       └── 001_case_filing_ai_schema.sql
    │       ├── docs/
    │       │   ├── module-boundaries.md
    │       │   ├── one-document-pipeline.md
    │       │   └── suggested-work-tree.md
    │       ├── examples/
    │       │   └── local-json/
    │       │       ├── case-snapshot.json
    │       │       └── case.json
    │       ├── guardrails/
    │       │   └── all-guardrails.md
    │       ├── models/
    │       │   └── typescript/
    │       │       └── core-models.ts
    │       └── prompts/
    │           ├── case-state-update.prompt.md
    │           ├── fact-extraction.prompt.md
    │           ├── filing-text-vault.prompt.md
    │           ├── human-review.prompt.md
    │           ├── orchestrator.prompt.md
    │           ├── rule-context.prompt.md
    │           └── task-deadline.prompt.md
    └── study-docs/
        ├── 002_2026-05-23_study-log_follow-up-before-handoff.md
        ├── 003_2026-05-23_study-log_case-filing-ai-planning.md
        ├── 004_2026-05-23_study-log_golden-dataset-eval-runner.md
        ├── 005_2026-05-23_10-50_study-log_parsed-cache-rule-authority.md
        ├── 006_2026-05-23_11-21_study-log_cursor-planning-phase.md
        ├── README.md
        └── 001_2026-05-23_00-07_blog_source-grounded-docketing/
            ├── part-1_docketing-is-not-summarization.md
            ├── part-2_prompt-engineering-as-design-method.md
            └── part-3_final-source-grounded-agent-pattern.md
```

**Stats:** 495 files, 316 directories.

---

## Verification commands

```bash
# fill what you ran before push
npm test
```
