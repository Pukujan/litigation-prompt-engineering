# Filing pipeline — HTTP API

**Base path:** `/api/filing-pipeline`

Describes the planned 16-step single-document pipeline (catalog only; orchestration not fully implemented).

**Routes:** [`backend/src/modules/filing-pipeline/routes/pipeline.routes.js`](../../backend/src/modules/filing-pipeline/routes/pipeline.routes.js)

**Contract:** [API documentation contract](../architecture/API_DOCUMENTATION_CONTRACT.md)

---

## Endpoint quick reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Module health |
| GET | `/steps` | List planned single-document pipeline steps |

---

## Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Module health |

---

## Pipeline catalog

### `GET /steps`

**Response 200:** Pipeline overview (steps, labels, module ownership) from [`pipeline-steps.service.js`](../../backend/src/modules/filing-pipeline/services/pipeline-steps.service.js).

Used by the frontend **Filing Pipeline** page.

---

## Related docs

- [one-document-pipeline.md](../case-filing-ai/one-document-pipeline.md)
