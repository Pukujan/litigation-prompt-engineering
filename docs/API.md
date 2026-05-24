# Backend HTTP API reference

Base URL (local dev): `http://localhost:3001`

All module routes are mounted under `/api/{module-id}`. Global health:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server up; lists nothing per-module |

---

## Endpoint registry

Maintained manually when routes change. Enforced by `npm run lint:api-docs`. See [API documentation contract](./architecture/API_DOCUMENTATION_CONTRACT.md).

| Method | Path | Module | Description |
|--------|------|--------|-------------|
| GET | `/api/case-filing-ai/health` | Case Filing AI | Module health and config summary |
| POST | `/api/case-filing-ai/extract-rule-text` | Case Filing AI | Extract text from uploaded part-rule file |
| POST | `/api/case-filing-ai/process-batch` | Case Filing AI | Upload filings; returns **202** and processes batch in background |
| GET | `/api/case-filing-ai/batches/:batchId/status` | Case Filing AI | Batch status with module rail and document queue |
| GET | `/api/case-filing-ai/batches/:batchId/processing-log` | Case Filing AI | Parsed `processing-log.jsonl` entries |
| POST | `/api/case-filing-ai/batches/:batchId/package` | Case Filing AI | Build downloadable batch package folder |
| GET | `/api/case-filing-ai/batches/:batchId/package/download` | Case Filing AI | Download batch package as zip |
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
| GET | `/api/case-filing-ai/cases/:goldenCaseId/export/:exportId/download` | Case Filing AI | Download case export as zip |
| DELETE | `/api/case-filing-ai/cases/:goldenCaseId` | Case Filing AI | Delete batch folders for a case (requires confirm) |
| GET | `/api/platform/modules` | Platform | Runtime module registry (icons, labels) |
| GET | `/api/platform/onboarding/pipeline-guide` | Platform | Pipeline onboarding (`?format=md` or `json`) |
| GET | `/api/platform/planning` | Platform | List planning manifests |
| GET | `/api/platform/planning/:planId` | Platform | Read planning manifest JSON |
| GET | `/api/platform/planning/:planId/download` | Platform | Download planning package markdown |
| POST | `/api/platform/planning/:planId/finalize` | Platform | Finalize planning manifest for a slug |
| GET | `/api/file-exchange/health` | File exchange | Module health |
| POST | `/api/file-exchange/clear` | File exchange | Clear dated import/export session folders |
| GET | `/api/model-condenser/health` | Model condenser | Module health |
| POST | `/api/model-condenser/condense` | Model condenser | Regenerate consolidated-models.json |
| GET | `/api/model-condenser/consolidated` | Model condenser | Read consolidated schema inventory |
| GET | `/api/filing-pipeline/health` | Filing pipeline | Module health |
| GET | `/api/filing-pipeline/steps` | Filing pipeline | List planned pipeline steps |
| GET | `/api/case-workflow/health` | Case workflow | Module health (stub) |
| GET | `/api/court-rules/health` | Court rules | Module health (stub) |
| GET | `/api/filing-text-vault/health` | Filing text vault | Module health (stub) |
| GET | `/api/human-review/health` | Human review | Module health (stub) |
| GET | `/api/task-docketing/health` | Task docketing | Module health (stub) |

---

## Module index

| Module | Base path | API doc | Status |
|--------|-----------|---------|--------|
| Case Filing AI | `/api/case-filing-ai` | [case-filing-ai/API.md](./case-filing-ai/API.md) | **Active** — batch upload, master prompt, evals, bundles |
| File exchange | `/api/file-exchange` | [file-exchange/API.md](./file-exchange/API.md) | **Active** — clear dated import/export folders |
| Model condenser | `/api/model-condenser` | [model-condenser/API.md](./model-condenser/API.md) | **Active** — schema inventory export |
| Filing pipeline | `/api/filing-pipeline` | [filing-pipeline/API.md](./filing-pipeline/API.md) | **Active** — pipeline step catalog |
| Case workflow | `/api/case-workflow` | [case-workflow/API.md](./case-workflow/API.md) | Health only (stub) |
| Court rules | `/api/court-rules` | [court-rules/API.md](./court-rules/API.md) | Health only (stub) |
| Filing text vault | `/api/filing-text-vault` | [filing-text-vault/API.md](./filing-text-vault/API.md) | Health only (stub) |
| Human review | `/api/human-review` | [human-review/API.md](./human-review/API.md) | Health only (stub) |
| Task docketing | `/api/task-docketing` | [task-docketing/API.md](./task-docketing/API.md) | Health only (stub) |

---

## Conventions

- **JSON** unless noted (multipart for file uploads).
- **Errors**: `{ "error": "message" }` or `{ "message": "..." }` with 4xx/5xx status (see `AppError` in shared HTTP layer).
- **201** for creates (batches, bundles, condense); **200** for reads.
- Route definitions (source of truth): `backend/src/modules/{module}/routes/`.
- **New routes:** update `docs/{module}/API.md` and the [Endpoint registry](#endpoint-registry) — see [API documentation contract](./architecture/API_DOCUMENTATION_CONTRACT.md).
- Frontend clients: `frontend/src/modules/{module}/api/` where present.

---

## Environment

Copy `backend/.env.example` → `backend/.env`. Module-specific variables are documented in each module’s API file.

---

## Related docs

- [Case Filing AI integration overview](./case-filing-ai/INTEGRATION.md)
- [Module boundaries](./case-filing-ai/module-boundaries.md)
- [Golden eval fixtures](../evals/golden/case_001/) (on-disk, not an API)
