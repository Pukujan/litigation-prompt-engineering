# Contract: file exchange

**Version:** `v001`  
**Timestamp helper:** `backend/src/shared/utils/formatExchangeTimestamp.js`  
**User doc:** [file-exchange/README.md](../../../file-exchange/README.md)

## Layout

```text
file-exchange/
  imports/{stamp}/     ← inbound bundles (mandatory before processing)
  exports/{stamp}/     ← session deliverables (batch runs, curl logs)
  exports/consolidated-*.json   ← see consolidatedExports contract
```

## Stamp format (human-readable UTC)

```text
YYYY-MM-DD_HH-MM-SSZ
```

Example: `2026-05-23_15-59-43Z`

Legacy compact stamps (`20260523T155943Z`) are normalized by `normalizeExchangeStamp()` in the timestamp helper.

## Mandatory workflow (agents)

1. `npm run import:file-exchange -- "<path>"`
2. Process only from `imports/{stamp}/`
3. Copy deliverables to `exports/{stamp}/`
4. `npm run condense:all` when refreshing consolidated snapshots

Enforced by `AGENTS.md` and `.cursor/rules/file-exchange-inbox.mdc` (`alwaysApply: true`).

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/import-to-file-exchange.mjs` | Copy bundle → `imports/{stamp}/` |
| `scripts/resolve-import-stamp.mjs` | Resolve human or legacy stamp folder |
| `scripts/ingest-golden-parsed.mjs` | Parsed cache → `evals/golden/` |
| `scripts/ingest-golden-expected.mjs` | Ground truth → `doc_NNN.expected.json` |

## Related contracts

- [consolidatedExports.contract.md](./consolidatedExports.contract.md)
- [prePushDevLog.contract.md](./prePushDevLog.contract.md)
