# Case Filing AI — storage layout

Runtime batch I/O uses `storagePaths.js` and contracts under `backend/src/modules/case-filing-ai/contracts/`.

## Roots

| Env | Default |
|-----|---------|
| `CASE_FILING_BATCH_DIR` | `data/case-filing-ai/batches/` |
| `GOLDEN_DATASET_DIR` | `evals/golden/case_001/` |

## Parsed document cache (v2)

Per document: `batches/{batchId}/parsed-documents/{docKey}/`

| File | Purpose |
|------|---------|
| `embedded-text.txt` | PDF embedded layer |
| `ocr-text.txt` | OCR layer when used |
| `final-parsed-text.txt` | Text sent to master prompt |
| `parse-metadata.json` | Hash + parser/OCR versions |
| `review-status.json` | Human review state |
| `audit-log.jsonl` | Append-only parse events |

## Provenance

Outputs include `pipelineVersions`, `parsedDocumentCacheUsed`, `textSourceUsed`.

See [REPO_ARTIFACT_LAYOUT.md](../architecture/REPO_ARTIFACT_LAYOUT.md).
