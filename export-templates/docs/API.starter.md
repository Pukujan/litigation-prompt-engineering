# Backend HTTP API reference

Base URL (local dev): `http://localhost:3001`

Global health:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server up |

---

## Endpoint registry

Maintained manually when routes change. Enforced by `npm run lint:api-docs`. See [API documentation contract](./architecture/API_DOCUMENTATION_CONTRACT.md).

| Method | Path | Module | Description |
|--------|------|--------|-------------|
| GET | `/api/_reference/health` | Reference | Example module health |
| GET | `/api/model-condenser/health` | Model condenser | Module health |
| POST | `/api/model-condenser/condense` | Model condenser | Regenerate consolidated-models.json |
| GET | `/api/model-condenser/consolidated` | Model condenser | Read consolidated schema inventory |

_Add rows here when you scaffold new modules with `npm run new:module`._

---

## Module index

| Module | Base path | API doc | Status |
|--------|-----------|---------|--------|
| Reference | `/api/_reference` | [_reference stub] | Example layout |
| Model condenser | `/api/model-condenser` | [model-condenser/API.md](./model-condenser/API.md) | Active — schema inventory export |

---

## Conventions

- **JSON** unless noted (multipart for file uploads).
- **Errors**: `{ "error": "message" }` with 4xx/5xx status.
- Route definitions: `backend/src/modules/{module}/routes/`.
- **New routes:** update `docs/{module}/API.md` and this registry.
