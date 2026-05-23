# File exchange

Dated folders for human ↔ agent file handoff. **No sensitive filing text in git** — use synthetic fixtures only.

## Layout

```text
file-exchange/
  imports/{2026-05-23_15-59-43Z}/          ← inbound bundles
  exports/{2026-05-23_15-59-43Z_...}/      ← session deliverables (batch runs, curl logs)
  exports/consolidated-models.json         ← repo snapshots (regenerate with condense:all)
  exports/consolidated-prompts.json
  exports/consolidated-file-structure.json
```

**Stamp format:** `YYYY-MM-DD_HH-MM-SSZ` via `formatExchangeTimestamp()` in `backend/src/shared/utils/formatExchangeTimestamp.js`.

## Consolidated exports (in `exports/`)

```bash
npm run condense:all
```

| File in `exports/` | Mirror (API) |
|--------------------|--------------|
| `consolidated-models.json` | `models/consolidated-models.json` |
| `consolidated-prompts.json` | `models/consolidated-prompts.json` |
| `consolidated-file-structure.json` | `models/consolidated-file-structure.json` |

**Open `file-exchange/exports/`** — all three consolidated files sit next to dated batch export folders.

## Workflow

1. Triage loose files into `imports/{stamp}/` (`npm run import:file-exchange -- <path>`).
2. Process via case-filing APIs using files **under that stamp** only.
3. Copy batch bundles / reports to `exports/{stamp}/` when done.
4. Refresh consolidated snapshots: `npm run condense:all`.

**Cursor agents:** mandatory — see [AGENTS.md](../AGENTS.md) and `.cursor/rules/file-exchange-inbox.mdc`.

See [docs/architecture/REPO_ARTIFACT_LAYOUT.md](../docs/architecture/REPO_ARTIFACT_LAYOUT.md).
