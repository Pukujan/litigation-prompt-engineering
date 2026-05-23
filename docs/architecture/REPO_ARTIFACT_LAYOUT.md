# Repository artifact layout

Canonical paths for runtime data, golden fixtures, and human↔agent exchange.

## Roots

| Root | Env override | Writable at runtime |
|------|----------------|---------------------|
| `data/case-filing-ai/batches/` | `CASE_FILING_BATCH_DIR` | Yes (pipeline) |
| `evals/golden/{caseId}/` | `GOLDEN_DATASET_DIR` | No (fixtures) |
| `data/court-rules/fixtures/` | — | No |
| `eval-bundles/` | `EVAL_BUNDLE_ROOT_DIR` | Yes (export API) |
| `case-exports/` | `CASE_EXPORT_ROOT_DIR` | Yes (export API) |
| `file-exchange/imports\|exports/` | — | Yes (human triage) |
| `work-log/dev-logs/human\|agent/` | — | Yes (pre-push audit) |
| `models/consolidated-*.json` | — | Yes (condenser mirror) |
| `work-log/` | — | Yes (docs only) |

## Batch folder (`batches/batch-NNN/`)

```text
uploads/
parsed-documents/doc-NNN/    # v2+ parsed cache
outputs/doc-NNN.json
evals/doc_NNN.eval-report.json
rule/
case-snapshot.json
processing-log.jsonl
```

## Golden (`evals/golden/case_001/`)

```text
case_001.golden-dataset.json
doc_NNN.expected.json
parsed/doc-NNN/              # optional parse golden (v2)
```

## File exchange

Imports: `file-exchange/imports/{2026-05-23_15-59-43Z}/`  
Session exports: `file-exchange/exports/{stamp}_{label}/`  
Consolidated snapshots: `file-exchange/exports/{stamp}_consolidated/` (+ latest `consolidated-*.json` at `exports/` root)

See [file-exchange/README.md](../../file-exchange/README.md) and [contracts/fileExchange.contract.md](./contracts/fileExchange.contract.md).

## Pre-push dev logs

```text
work-log/dev-logs/human/{NNN}_{date}_{time}_dev-log_{slug}.md
work-log/dev-logs/agent/{NNN}_{date}_{time}_dev-log-agent_{slug}.json
```

`npm run dev-log:pre-push` — see [contracts/prePushDevLog.contract.md](./contracts/prePushDevLog.contract.md).

## Consolidated exports

`npm run condense:all` → [contracts/consolidatedExports.contract.md](./contracts/consolidatedExports.contract.md).

## Contracts

**Overview (start here):** [CONTRACTS_OVERVIEW.md](./CONTRACTS_OVERVIEW.md)  
Manifest: [contracts/manifest.json](./contracts/manifest.json) · Changelog: [contracts/changelog.jsonl](./contracts/changelog.jsonl)

| Contract | Doc |
|----------|-----|
| File exchange | [fileExchange.contract.md](./contracts/fileExchange.contract.md) |
| Consolidated exports | [consolidatedExports.contract.md](./contracts/consolidatedExports.contract.md) |
| Pre-push dev log | [prePushDevLog.contract.md](./contracts/prePushDevLog.contract.md) |
| API registry | [apiDocumentationRegistry.contract.md](./contracts/apiDocumentationRegistry.contract.md) |
| Case filing storage | `backend/src/modules/case-filing-ai/contracts/storageLayout.contract.js` |
| Parsed artifacts | `parsedDocumentArtifacts.contract.js` |
| Pipeline versions | `pipelineVersions.js` |
| Rule authority | `court-rules/contracts/ruleAuthority.contract.js` |

Human storage doc: [docs/case-filing-ai/STORAGE.md](../case-filing-ai/STORAGE.md)
