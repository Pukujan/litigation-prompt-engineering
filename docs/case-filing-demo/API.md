# Case Filing Demo — HTTP API

**Base path:** `/api/case-filing-demo`

**Routes:** [`backend/src/modules/case-filing-demo/routes/caseFilingDemo.routes.js`](../../backend/src/modules/case-filing-demo/routes/caseFilingDemo.routes.js)

**Frontend client:** [`frontend/src/modules/case-filing-demo/api/caseFilingDemoApi.js`](../../frontend/src/modules/case-filing-demo/api/caseFilingDemoApi.js)

**Contract:** [API documentation contract](../architecture/API_DOCUMENTATION_CONTRACT.md) — update this file and [Endpoint registry](../API.md) when adding routes.

---

## Endpoint quick reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Demo module health and mode summary |
| GET | `/cases` | List available and coming-soon demo cases |
| GET | `/cases/:caseId` | Read one demo case with document metadata and source availability |
| GET | `/cases/:caseId/bundle` | Read cached processed outputs, eval reports, audit replay, and demo manifest |
| GET | `/cases/:caseId/documents/:docKey/source` | Stream a source PDF when imported for the selected demo document |

---

## Health

### `GET /health`

Returns `{ module, status, mode }`.

---

## Demo Cases

### `GET /cases`

Lists demo cases for the dropdown. Available cases can be selected; future cases are returned as disabled `coming_soon` entries.

**Response 200:**

```json
{
  "available": [
    {
      "id": "case_001_rule_authority_v002",
      "label": "Case 001",
      "status": "available",
      "documentCount": 14
    }
  ],
  "comingSoon": [
    {
      "id": "case_002",
      "label": "Case 002",
      "status": "coming_soon"
    }
  ],
  "cases": [
    { "id": "case_001_rule_authority_v002", "status": "available" },
    { "id": "case_002", "status": "coming_soon" }
  ]
}
```

Use the top-level `cases` array for dropdown rendering.

### `GET /cases/:caseId`

Returns legal-friendly case metadata, filing sequence, synthetic-data notice, and source PDF availability. Source PDFs are only exposed from curated demo lookup logic; arbitrary filesystem paths are not accepted.

### `GET /cases/:caseId/documents/:docKey/source`

Streams `application/pdf` for a curated source filing when the synthetic PDF bundle has been imported under `file-exchange/imports`. Returns `404` when the committed repo has the golden/cached data but not the source PDF.

---

## Cached Demo Bundle

### `GET /cases/:caseId/bundle`

Returns a prebuilt demo presentation bundle from committed fixtures:

- `results`: processed document outputs and final case snapshot
- `evals`: eval reports recomputed from committed golden fixtures
- `audit`: deterministic audit replay for presentation
- `manifest`: fixture lineage and source PDF status

This endpoint is intentionally separate from `/api/case-filing-ai` so demo shortcuts do not change the operational processing mode.

The frontend **Demo insights** tabs consume `results`, `evals`, `audit`, and `manifest` from this bundle response for dashboard, outputs, eval drill-down, audit replay, and governance views.
