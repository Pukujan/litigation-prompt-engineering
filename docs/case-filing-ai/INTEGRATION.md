# Case Filing AI — integrated starter

This folder contains the **Case Filing AI Updated Starter** blueprint, integrated into the modular monolith.

## What was wired up

| Asset | Location |
| --- | --- |
| Module docs & guardrails | `docs/case-filing-ai/` |
| PostgreSQL schema | `backend/db/migrations/001_case_filing_ai_schema.sql` |
| Example case fixtures | `data/case-filing-ai/examples/` |
| Shared domain types | `backend/src/shared/domain/case-filing/core-models.js` |
| Feature modules | `case-filing-ai`, `filing-text-vault`, `case-workflow`, `court-rules`, `task-docketing`, `human-review`, `filing-pipeline` under `backend/src/modules/` |
| Frontend routes | Matching folders under `frontend/src/modules/` |

## Module split

See [module-boundaries.md](./module-boundaries.md). Core rule:

```text
Modules own domain logic.
Pipeline owns execution order.
```

## One-document pipeline

The `filing-pipeline` module exposes `GET /api/filing-pipeline/steps` with the 16-step single-document flow from [one-document-pipeline.md](./one-document-pipeline.md). The frontend **Filing Pipeline** page lists those steps.

## Prompts

Starter `.md` prompts were converted to versioned `prompts/templates/*.prompt.js` files per module:

| Module | Prompt id |
| --- | --- |
| `case-filing-ai` | `fact-extraction` |
| `filing-text-vault` | `filing-text-vault` |
| `case-workflow` | `case-state-update` |
| `court-rules` | `rule-context` |
| `task-docketing` | `task-deadline` |
| `human-review` | `human-review` |
| `filing-pipeline` | `orchestrator` |

Run evals: `npm run test:evals -- filing-pipeline`

## Upload + OpenRouter batch prototype

The **Case Filing AI** module is a small batch prototype:

- Paste/upload part rule text + multiple PDFs on the **Case Filing AI** page
- Full HTTP API reference: **[API.md](./API.md)** (all endpoints, bundles, env vars)
- Master index of all modules: **[docs/API.md](../API.md)**

Storage per batch:

```text
data/case-filing-ai/batches/{batchId}/
  rule/part-rules.txt
  uploads/
  outputs/
  evals/
  case-snapshot.json
  processing-log.jsonl
```

Env: `backend/.env.example`

## Next steps

1. Apply the DB migration when you add PostgreSQL.
2. Implement services/repositories inside each module following [module-boundaries.md](./module-boundaries.md) and [suggested-work-tree.md](./suggested-work-tree.md).
3. Use `data/case-filing-ai/examples/` as fixtures for integration tests and eval datasets.
