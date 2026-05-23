# Case workflow — HTTP API

**Base path:** `/api/case-workflow`

**Status:** Stub — health check only. Domain endpoints (case state updates, snapshot orchestration) are planned per [module-boundaries.md](../case-filing-ai/module-boundaries.md).

**Contract:** [API documentation contract](../architecture/API_DOCUMENTATION_CONTRACT.md)

---

## Endpoint quick reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Module health (stub) |

---

## Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Module health |

**Routes:** [`backend/src/modules/case-workflow/routes/`](../../backend/src/modules/case-workflow/routes/)

---

## Master index

[docs/API.md](../API.md)
