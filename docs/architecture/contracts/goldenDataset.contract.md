# Golden dataset contract

Versioned ground-truth fixtures for Case Filing AI evals. Authored via the **golden-authoring** pipeline or ingested from external bundles.

## Layout

| Path | Writable | Purpose |
|------|----------|---------|
| `evals/golden/{caseId}/` | No (committed after promote) | Production golden fixtures |
| `evals/golden-staging/{caseId}/{version}/` | Yes (authoring runs) | Staging before human promote |

### Staging folder (`evals/golden-staging/{caseId}/{version}/`)

| File | Description |
|------|-------------|
| `{caseId}.golden-dataset.json` | Monolith manifest + embedded expected outputs |
| `doc_NNN.expected.json` | Per-document expected fields |
| `after_doc_NNN.expected.json` | Snapshot checkpoints |
| `pipeline_versions.expected.json` | Version pins including `goldenDatasetVersion`, `authorModel` |
| `eval_comparison_config.json` | Field-level eval rules |
| `negative_guardrails.expected.json` | Cross-doc guardrail tests |
| `authoring_run.json` | Audit: models, runId, batchStatus, import stamp |
| `VERSION_HISTORY.jsonl` | Append-only version events (`staged`, `promoted`) |
| `SYNTHETIC_DATA_NOTICE.md` | Required before promote |
| `run/` | Ephemeral pipeline run (processing log, snapshot, outputs) |

## Version id format

```text
{legalCaseId}_{purpose}_v{NNN}
```

Example: `synthetic_case_002_rule_authority_v001`

- **caseId** (repo folder): `case_002_rule_authority_v001` — replace `synthetic_case_002` prefix with `case_002`.
- **goldenDatasetVersion** pin: same string as `version` in staging path.

## Authoring workflow

1. `npm run import:file-exchange -- "<bundle>"` — record stamp.
2. Add `case_manifest.json` under `file-exchange/imports/{stamp}/`.
3. `npm run author:golden -- --case case_002 --import-stamp {stamp} --legal-case-id synthetic_case_002`
4. Human review of `evals/golden-staging/{caseId}/{version}/`.
5. `npm run promote:golden -- --case {caseId} --version {version} --confirm`
6. Optional: copy promoted bundle to `file-exchange/exports/{stamp}/golden-promoted/`.

## Environment

| Variable | Purpose |
|----------|---------|
| `MODEL_GOLDEN_AUTHORING` | Stronger OpenRouter model for master prompt |
| `MASTER_PROMPT_GOLDEN_VERSION` | Prompt template version (defaults to runtime profile) |
| `GOLDEN_AUTHORING_STAGING_ROOT` | Override staging root |
| `GOLDEN_AUTHORING_API_ENABLED` | Enable `/api/golden-authoring/*` |
| `GOLDEN_AUTHORING_API_KEY` | Optional API key header |

Parse/OCR use the same paths as runtime (`MODEL_VISION_OCR`, pdf-text) so evals compare fairly.

## Changelog

Promote appends a line to `docs/architecture/contracts/changelog.jsonl` with `contract: "goldenDataset"`.

## Related

- [REPO_ARTIFACT_LAYOUT.md](../REPO_ARTIFACT_LAYOUT.md)
- [docs/golden-authoring/API.md](../../golden-authoring/API.md)
