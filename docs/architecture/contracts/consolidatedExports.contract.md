# Contract: consolidated exports

**Version:** `v001`  
**Code:** `backend/src/shared/contracts/consolidatedExports.contract.js`

## Purpose

Regenerable **repo snapshots** for human handoff and agent onboarding — not runtime filing data.

## Primary paths (audit trail)

Each condense run writes a **dated, timestamped folder** (same stamp convention as imports):

```text
file-exchange/exports/{2026-05-23_15-59-43Z}_consolidated/
  consolidated-models.json
  consolidated-prompts.json
  consolidated-file-structure.json
  manifest.json                 ← artifact index for the run
```

`npm run condense:all` uses one shared stamp for all three files in a single folder.

## Latest pointers (agents / API)

```text
file-exchange/exports/consolidated-*.json   ← overwritten each run (latest)
models/consolidated-*.json                  ← API mirror (latest)
```

Every condense run writes **dated folder + latest copies**.

## Commands

```bash
npm run condense:all
npm run condense-prompts
npm run condense-file-structure
npm --prefix backend run condense-models   # or POST /api/model-condenser/condense
```

## Contents

| File | Source |
|------|--------|
| `consolidated-models.json` | Model condenser — schema inventory |
| `consolidated-prompts.json` | All `.prompt.md` / `.prompt.js` + manifests |
| `consolidated-file-structure.json` | ASCII `treeText` only + `stats` (not nested JSON / flat path lists) |

## File tree ignore (consolidated-file-structure)

Directory names: `node_modules`, `.git`, `dist`, `build`.  
Skipped subtrees: `data/case-filing-ai/batches`, `eval-bundles`, `case-exports`.

## Deprecated

- `scripts/export-consolidated-models.mjs` → use `npm run condense-models` or `POST /api/model-condenser/condense`

## Related

- [file-exchange/README.md](../../../file-exchange/README.md)
- [docs/model-condenser/API.md](../../model-condenser/API.md)
