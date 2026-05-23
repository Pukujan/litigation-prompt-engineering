# Contract: consolidated exports

**Version:** `v001`  
**Code:** `backend/src/shared/contracts/consolidatedExports.contract.js`

## Purpose

Regenerable **repo snapshots** for human handoff and agent onboarding — not runtime filing data.

## Primary paths (handoff)

```text
file-exchange/exports/
  consolidated-models.json
  consolidated-prompts.json
  consolidated-file-structure.json
```

## Mirror paths (API / git)

```text
models/
  consolidated-models.json      ← model-condenser API writes here first
  consolidated-prompts.json
  consolidated-file-structure.json
```

Every condense run writes **both** export and mirror.

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
| `consolidated-file-structure.json` | Full file tree (tree ignore rules) |

## File tree ignore (consolidated-file-structure)

Same as pre-push dev log: `node_modules`, `.git`, `dist`, `build`.

## Deprecated

- `scripts/export-consolidated-models.mjs` → use `npm run condense-models` or `POST /api/model-condenser/condense`

## Related

- [file-exchange/README.md](../../../file-exchange/README.md)
- [docs/model-condenser/API.md](../../model-condenser/API.md)
