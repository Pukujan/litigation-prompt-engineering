# Golden Authoring API

Base path: `/api/golden-authoring`

Requires `GOLDEN_AUTHORING_API_ENABLED=true`. When `GOLDEN_AUTHORING_API_KEY` is set, send header `X-Golden-Authoring-Key` or `Authorization: Bearer <key>`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Module health, author model, staging root |
| POST | `/process-batch` | Upload PDFs; run authoring pipeline → staging |
| GET | `/runs/:runId` | Lookup authoring run metadata |
| POST | `/promote` | Promote staging to `evals/golden/{caseId}/` (requires `confirm: true`) |
| GET | `/cases/:caseId/versions` | List staged version folders |

### POST `/process-batch`

Multipart fields:

- `files` — PDF filings (required)
- `caseSlug` — e.g. `case_002` (required)
- `legalCaseId` — e.g. `synthetic_case_002` (required)
- `caseIdentity` — JSON string (required)
- `snapshotCheckpoints` — JSON array, default `[1,2,4,8,12,14]`
- `importStamp` — optional file-exchange stamp
- `partRuleText` — optional part rule paste

Returns `201` with `runId`, `caseId`, `version`, `stagingDir`, `batchStatus`.

### POST `/promote`

JSON body:

```json
{
  "caseId": "case_002_rule_authority_v001",
  "version": "synthetic_case_002_rule_authority_v001",
  "confirm": true,
  "reason": "Human reviewed staging"
}
```
