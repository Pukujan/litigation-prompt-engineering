# Case Filing AI — HTTP API

**Base path:** `/api/case-filing-ai`

**Routes:** [`backend/src/modules/case-filing-ai/routes/caseFiling.routes.js`](../../backend/src/modules/case-filing-ai/routes/caseFiling.routes.js)

**Frontend client:** [`frontend/src/modules/case-filing-ai/api/caseFilingApi.js`](../../frontend/src/modules/case-filing-ai/api/caseFilingApi.js)

**Contract:** [API documentation contract](../architecture/API_DOCUMENTATION_CONTRACT.md) — update this file and [Endpoint registry](../API.md) when adding routes.

---

## Endpoint quick reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Module health and config summary |
| POST | `/extract-rule-text` | Extract text from uploaded part-rule file |
| POST | `/process-batch` | Upload filings; **202** starts background processing |
| GET | `/batches/:batchId/status` | Status with `moduleStates`, `documentQueue`, `activeModule` |
| GET | `/batches/:batchId/processing-log` | Parsed processing log |
| POST | `/batches/:batchId/package` | Build batch download package |
| GET | `/batches/:batchId/package/download` | Download batch package zip |
| GET | `/batches/:batchId/results` | Aggregated batch results |
| GET | `/batches/:batchId/parsed-documents` | List parsed-document cache keys for batch |
| GET | `/batches/:batchId/parsed-documents/:documentId` | Parsed cache detail (text layers, review status) |
| PATCH | `/batches/:batchId/parsed-documents/:documentId/review-status` | Update human review status for parsed doc |
| GET | `/batches/:batchId/evals` | Golden eval reports for batch |
| POST | `/batches/:batchId/evals/bundle` | Copy one batch eval reports to eval-bundles |
| POST | `/evals/bundle` | Copy multiple batch eval reports to eval-bundles |
| POST | `/evals/cases/:goldenCaseId/bundle` | Copy golden fixtures plus case eval runs (eval JSON only) |
| GET | `/cases/:goldenCaseId` | Inventory all batches and matched case runs |
| POST | `/cases/:goldenCaseId/export` | Export full batch folders to case-exports |
| DELETE | `/cases/:goldenCaseId` | Delete batch folders for case (requires confirm) |

---

## Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Module metadata and config summary |

---

## Rule text extraction

### `POST /extract-rule-text`

Extract text from an uploaded part-rule file (PDF, DOCX, DOC, TXT).

**Content-Type:** `multipart/form-data`

| Field | Type | Required |
|-------|------|----------|
| `file` | file | yes |

**Response 200:** `{ text, fileKind, extractionQuality, ... }`

---

## Batch processing

### `POST /process-batch`

Upload filings (+ optional part rule), process each document sequentially with the master prompt, merge rolling case snapshot, run golden evals when configured.

**Content-Type:** `multipart/form-data`

| Field | Type | Required |
|-------|------|----------|
| `files` | file[] | yes (at least one supported filing) |
| `partRuleText` | string | no |
| `partRuleFile` | file | no |

**Response 202:**

```json
{
  "batchId": "batch-003",
  "status": "processing"
}
```

Poll `GET /batches/:batchId/status` until `status` is `completed`, `partial`, or `failed`, then `GET /batches/:batchId/results`.

**Results body** (from `/results` when complete):

```json
{
  "batchId": "batch-003",
  "batchStatus": "completed | partial | failed",
  "processedCount": 8,
  "totalCount": 12,
  "failedDocuments": [{ "docKey", "docIndex", "error": { "message", "statusCode" } }],
  "caseSnapshot": { ... },
  "documents": [ ... ],
  "tasks": [ ... ],
  "deadlines": [ ... ],
  "humanReviewItems": [ ... ],
  "partRule": { ... }
}
```

- On per-document failure: batch continues; failed doc saved with `"status": "failed"`; snapshot **not** merged for that doc.
- Each successful `documents[]` entry may include `runMetadata` (prompt version, template, merge mode, model).

**On-disk layout:**

```text
data/case-filing-ai/batches/{batchId}/
  rule/part-rules.txt
  uploads/
  outputs/doc-NNN.json
  evals/doc_NNN.eval-report.json
  case-snapshot.json
  processing-log.jsonl
```

### `GET /batches/:batchId/status`

**Response 200:** `{ batchId, status, activeModule, moduleStates[], documentQueue[], processedCount, failedCount, totalCount, currentStep, currentDocument }`

### `GET /batches/:batchId/processing-log`

**Response 200:** `{ batchId, entries: [...] }`

### `POST /batches/:batchId/package`

Builds `{batchId}-package/` under `case-exports/` with `batch/`, `rules-applied/`, `evals/`, `manifest.json`. Optional body: `{ includeGolden, goldenCaseId }`.

### `GET /batches/:batchId/package/download`

Streams `application/zip`. Query: `includeGolden`, `goldenCaseId`. Builds package if missing.

### `GET /batches/:batchId/results`

Full aggregated results (same shape as process-batch body).

---

## Parsed document cache

Per-document parsed text, extraction layers, review status, and audit log under `parsed-documents/{docKey}/` in the batch folder. See [STORAGE.md](./STORAGE.md).

### `GET /batches/:batchId/parsed-documents`

**Response 200:** `{ batchId, documents: ["doc-001", ...] }`

### `GET /batches/:batchId/parsed-documents/:documentId`

**Response 200:** parsed detail including `text`, `extractionLayers`, `reviewStatus`, `pipelineVersions`, `cacheKey`.

### `PATCH /batches/:batchId/parsed-documents/:documentId/review-status`

**Body:** `{ "status": "unreviewed" | "partially_reviewed" | "reviewed" | "rejected", "note": "optional" }`

**Response 200:** `{ batchId, documentId, reviewStatus }`

---

## Golden dataset evals

Eval runs automatically after each successful document when `evals/golden/{GOLDEN_CASE_ID}/` exists.

### `GET /batches/:batchId/evals`

**Response 200:**

```json
{
  "batchId": "batch-003",
  "summary": { "pass", "partial", "fail", "criticalFailureCount" },
  "reports": [
    {
      "evalId": "doc_001",
      "type": "document | snapshot",
      "status": "pass | partial | fail",
      "caseId": "case_001",
      "runMetadata": {
        "promptVersion": "v1",
        "promptTemplate": "master-case-filing.prompt.md",
        "snapshotMergeMode": "legacy | structured",
        "openRouterModel": "..."
      },
      "scores": { "ruleAuthority": 1, ... },
      "parsedDocumentCacheUsed": true,
      "textSourceUsed": "embedded_text",
      "pipelineVersions": { "parsedDocument": "v001", "masterPrompt": "v1" },
      "ruleSourcesChecked": ["queens-part-10-general"],
      "ruleAuthorityFailures": [],
      "parsedGoldenFailures": [],
      "criticalFailures": [],
      "fieldResults": [],
      "notes": []
    }
  ]
}
```

Golden `*.expected.json` files are **not** modified by the API. `runMetadata` appears on reports from runs after provenance was added; older batches may have `runMetadata: null`.

---

## Eval report bundles

Copies eval JSON to `eval-bundles/` at repo root (see `EVAL_BUNDLE_ROOT_DIR`). Does **not** include `consolidated-files/consolidated-models.json`.

### `POST /batches/:batchId/evals/bundle`

Copy one batch’s eval reports.

**Body (JSON):**

```json
{ "bundleName": "batch-003-evals" }
```

**Output layout:**

```text
eval-bundles/{bundleName}/
  manifest.json
  batches/{batchId}/*.eval-report.json
```

### `POST /evals/bundle`

Copy multiple batches (no golden fixtures).

**Body (JSON):**

```json
{
  "batchIds": ["batch-003", "batch-004"],
  "bundleName": "multi-batch-evals"
}
```

### `POST /evals/cases/:goldenCaseId/bundle`

Copy golden expecteds + batch eval runs for a case (recommended for review).

**Params:** `goldenCaseId` — e.g. `case_001` → `evals/golden/case_001/`

**Body (JSON):**

```json
{
  "bundleName": "case_001-synthetic-review",
  "batchIds": ["batch-003"],
  "includeGolden": true
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `bundleName` | `{goldenCaseId}-case-evals` | Folder name under `eval-bundles/` |
| `batchIds` | omit = auto-discover | Only batches whose eval reports have `caseId === goldenCaseId` |
| `includeGolden` | `true` | Copy `evals/golden/{goldenCaseId}/` into `golden/` |

**Output layout:**

```text
eval-bundles/{bundleName}/
  manifest.json
  golden/*.expected.json, case_001.golden-dataset.json, ...
  runs/batch-003/*.eval-report.json
  runs/batch-004/*.eval-report.json
```

**Response 201:** manifest with `legalCaseId`, `goldenCaseId`, `runs[]` (per-batch summary + `runMetadata` when present).

**Example:**

```bash
curl -X POST http://localhost:3001/api/case-filing-ai/evals/cases/case_001/bundle \
  -H "Content-Type: application/json" \
  -d '{"bundleName":"case_001-synthetic-review"}'
```

---

## Case data (full batch export / delete)

Gather **everything** under each batch folder (uploads, outputs, evals, rules, snapshots) — not just eval JSON like the eval bundle routes.

### `GET /cases/:goldenCaseId`

Inventory all `batch-*` directories under the batch root. Batches with eval reports whose `caseId` matches `goldenCaseId` appear in `matchedBatchIds`; others in `unclassifiedBatchIds`.

**Response 200:**

```json
{
  "goldenCaseId": "case_001",
  "legalCaseId": "case_001_synthetic_maria_demo",
  "matchedBatchIds": ["batch-003", "batch-004"],
  "unclassifiedBatchIds": ["batch-001"],
  "batches": [
    {
      "batchId": "batch-003",
      "matchedCase": true,
      "fileCount": 42,
      "totalBytes": 1234567,
      "paths": ["uploads/", "outputs/", "evals/"]
    }
  ]
}
```

### `POST /cases/:goldenCaseId/export`

Recursively copy batch folders to `case-exports/{exportName}/batches/{batchId}/`.

| Field | Default | Description |
|-------|---------|-------------|
| `exportName` | `{goldenCaseId}-export-{timestamp}` | Folder under `case-exports/` |
| `batchIds` | omit = matched batches only | Which batches to copy |
| `includeGolden` | `false` | Also copy `evals/golden/{goldenCaseId}/` into `golden/` |

**Response 201:** manifest with `exportType: "case_full"`, `exportDir`, `batches[]`, `totalFiles`, `totalBytes`.

```bash
curl -X POST http://localhost:3001/api/case-filing-ai/cases/case_001/export \
  -H "Content-Type: application/json" \
  -d '{"exportName":"case_001-full-backup","includeGolden":true}'
```

### `GET /cases/:goldenCaseId/export/:exportId/download`

Streams zip of the export folder (build export with `POST .../export` first if needed).

### `DELETE /cases/:goldenCaseId`

Remove batch directories from disk. **Does not** delete `evals/golden/`.

| Field | Required | Description |
|-------|----------|-------------|
| `confirm` | yes (unless `dryRun`) | Must be `true` to delete |
| `dryRun` | — | List what would be deleted without removing |
| `batchIds` | — | Default: matched batches only |

```bash
# Preview
curl -X DELETE http://localhost:3001/api/case-filing-ai/cases/case_001 \
  -H "Content-Type: application/json" \
  -d '{"dryRun":true}'

# Delete matched batches
curl -X DELETE http://localhost:3001/api/case-filing-ai/cases/case_001 \
  -H "Content-Type: application/json" \
  -d '{"confirm":true}'
```

---

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `OPENROUTER_API_KEY` | — | Required for LLM calls |
| `MODEL_TEXT_REASONING` | `google/gemini-2.0-flash-001` | Master + rule-parse model |
| `MODEL_VISION_OCR` | `qwen/qwen2.5-vl-7b-instruct` | OCR for scanned pages |
| `CASE_FILING_BATCH_DIR` | `data/case-filing-ai/batches` | Batch storage |
| `CASE_FILING_MAX_UPLOAD_MB` | `25` | Per-file upload limit |
| `GOLDEN_DATASET_DIR` | `evals/golden/case_001` | Golden expected files |
| `GOLDEN_CASE_ID` | `case_001` | Short case id on eval reports |
| `EVAL_BUNDLE_ROOT_DIR` | `eval-bundles/` | Eval bundle output root |
| `CASE_EXPORT_ROOT_DIR` | `case-exports/` | Full case export output root |
| `MASTER_PROMPT_VERSION` | `v1` | `v1` \| `compact` \| `v2` |
| `MASTER_PROMPT_JSON_RETRY` | `true` | Retry once on invalid JSON |
| `MASTER_PROMPT_OMIT_AUDIT_NOTES` | `true` | Omit auditNotes from LLM snapshot input |
| `MASTER_PROMPT_MAX_AUDIT_NOTES` | `20` | Cap stored audit notes on merge |
| `MASTER_PROMPT_MAX_DOC_CHARS` | `120000` | PDF text truncation for prompt |
| `OPENROUTER_JSON_OBJECT_MODE` | `false` | `response_format: json_object` |

`compact` / `v2` use structured snapshot merge + [`master-case-filing.compact.prompt.md`](../../backend/src/modules/case-filing-ai/prompts/master-case-filing.compact.prompt.md).

---

## Tests

Integration tests: `backend/src/modules/case-filing-ai/tests/integration/`
