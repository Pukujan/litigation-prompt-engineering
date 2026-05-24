# Platform — HTTP API

**Base path:** `/api/platform`

Cross-cutting endpoints: runtime module registry for the pipeline UI, onboarding guide, and planning-phase manifests.

**Routes:** `backend/src/modules/platform/routes/platform.routes.js`

---

## Endpoint quick reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/modules` | Runtime module registry (icons, labels, liveBatch) |
| GET | `/onboarding/pipeline-guide` | Pipeline onboarding guide (`?format=md` or `json`) |
| GET | `/planning` | List planning manifests |
| GET | `/planning/:planId` | Read planning manifest JSON |
| GET | `/planning/:planId/download` | Download planning package (`?format=md` or `json`) |
| POST | `/planning/:planId/finalize` | Finalize planning manifest for a slug |

---

## Module registry

### `GET /modules`

**Response 200:**

```json
{
  "modules": [
    {
      "id": "court-rules",
      "displayName": "Court rules",
      "icon": "scale",
      "description": "...",
      "liveBatch": true
    }
  ]
}
```

---

## Onboarding

### `GET /onboarding/pipeline-guide`

| Query | Default | Description |
|-------|---------|-------------|
| `format` | `json` | `json` or `md` |
| `download` | — | When `format=md`, set `true` for `Content-Disposition: attachment` |

**Response 200:** JSON guide object or markdown body.

---

## Planning

### `GET /planning`

**Response 200:** `{ "plans": [ { "planId": "007", ... } ] }`

### `GET /planning/:planId`

**Response 200:** Planning manifest JSON.

### `GET /planning/:planId/download`

| Query | Default |
|-------|---------|
| `format` | `md` |

**Response 200:** Markdown attachment or JSON manifest when `format=json`.

### `POST /planning/:planId/finalize`

**Body:**

```json
{
  "slug": "pipeline-ui-onboarding",
  "status": "approved"
}
```

**Response 201:** Created/updated manifest.
