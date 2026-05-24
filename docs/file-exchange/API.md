# File exchange — HTTP API

**Base path:** `/api/file-exchange`

Maintenance endpoints for `file-exchange/imports` and `file-exchange/exports`. Does not delete runtime batch data, golden fixtures, or `consolidated-files/` mirror.

**Routes:** `backend/src/modules/file-exchange/routes/fileExchange.routes.js`

---

## Endpoint quick reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Module health |
| POST | `/clear` | Remove dated import/export session folders |

---

## Health

### `GET /health`

**Response 200:**

```json
{ "status": "ok", "module": "file-exchange", "label": "File Exchange" }
```

---

## Clear exchange folders

### `POST /clear`

Removes dated stamp folders under `file-exchange/imports/` and clutter under `file-exchange/exports/` (session runs, `{stamp}_consolidated/` audit folders, `architecture-starter/`, etc.).

**Preserved by default:**

| Path | When |
|------|------|
| `imports/.gitkeep`, `exports/.gitkeep` | Always |
| `exports/templates/` | `keepTemplates: true` (default) |
| `exports/consolidated-*.json` | `keepLatestConsolidated: true` (default) |

**Body (JSON):**

```json
{
  "confirm": true,
  "dryRun": false,
  "scope": "all",
  "keepLatestConsolidated": true,
  "keepTemplates": true
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `confirm` | `false` | Required to delete (unless `dryRun: true`) |
| `dryRun` | `false` | List paths that would be removed |
| `scope` | `"all"` | `"all"`, `"imports"`, or `"exports"` |
| `keepLatestConsolidated` | `true` | Keep latest `consolidated-*.json` at `exports/` root |
| `keepTemplates` | `true` | Keep `exports/templates/` (npm export sources) |

**Response 201 (cleared) / 200 (dry run):**

```json
{
  "status": "cleared",
  "scope": "all",
  "dryRun": false,
  "cleared": true,
  "keepLatestConsolidated": true,
  "keepTemplates": true,
  "removed": ["imports/2026-05-23_15-59-43Z", "exports/2026-05-24_01-00-00Z_consolidated"],
  "removedCount": 2,
  "skipped": ["exports/.gitkeep", "exports/templates", "exports/consolidated-models.json"],
  "note": "..."
}
```

**CLI equivalent:** `npm run clear:file-exchange -- --confirm`

---

## Related

- [file-exchange/README.md](../../file-exchange/README.md)
- [fileExchange.contract.md](../architecture/contracts/fileExchange.contract.md)
