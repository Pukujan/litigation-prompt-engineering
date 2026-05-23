# File exchange

Dated folders for human ↔ agent file handoff. **No sensitive filing text in git** — use synthetic fixtures only.

## Layout

```text
file-exchange/
  imports/{2026-05-23_15-59-43Z}/                    ← inbound bundles
  exports/{2026-05-23_15-59-43Z_live-batch-run}/      ← session deliverables
  exports/{2026-05-23_15-59-43Z}_consolidated/        ← repo snapshots (audit trail)
    consolidated-models.json
    consolidated-prompts.json
    consolidated-file-structure.json
    manifest.json
  exports/consolidated-*.json                        ← latest copies (regenerate with condense:all)
```

**Stamp format:** `YYYY-MM-DD_HH-MM-SSZ` via `formatExchangeTimestamp()` in `backend/src/shared/utils/formatExchangeTimestamp.js`.

## Consolidated exports

```bash
npm run condense:all
```

Writes all three artifacts into **one dated folder** `{stamp}_consolidated/` and refreshes latest copies:

| Audit (dated folder) | Latest (`exports/` + `models/`) |
|----------------------|----------------------------------|
| `{stamp}_consolidated/consolidated-models.json` | `exports/consolidated-models.json`, `models/consolidated-models.json` |
| `{stamp}_consolidated/consolidated-prompts.json` | same pattern |
| `{stamp}_consolidated/consolidated-file-structure.json` | same pattern |

Individual runs (`npm run condense-prompts`, etc.) create their own `{stamp}_consolidated/` folder for that artifact (plus `manifest.json`).

## Workflow

1. Triage loose files into `imports/{stamp}/` (`npm run import:file-exchange -- <path>`).
2. Process via case-filing APIs using files **under that stamp** only.
3. Copy batch bundles / reports to `exports/{stamp}_{label}/` when done.
4. Refresh consolidated snapshots: `npm run condense:all` → new `exports/{stamp}_consolidated/`.

**Cursor agents:** mandatory — see [AGENTS.md](../AGENTS.md) and `.cursor/rules/file-exchange-inbox.mdc`.

See [docs/architecture/REPO_ARTIFACT_LAYOUT.md](../docs/architecture/REPO_ARTIFACT_LAYOUT.md).
