# File exchange

Dated folders for human ↔ agent file handoff. **No sensitive filing text in git** — use synthetic fixtures only.

## External artifact root

Optional: copy [`local-artifacts.example.json`](../local-artifacts.example.json) → `local-artifacts.json` (gitignored) and set `artifactRoot` to move `file-exchange/` (and batches, eval bundles, etc.) outside the repo. Resolved paths come from `backend/src/shared/config/resolveArtifactPaths.js`. `npm run import:file-exchange` prints the **absolute** import destination.

## Layout (in-repo default)

```text
file-exchange/
  imports/{2026-05-23_15-59-43Z}/                    ← inbound bundles
  exports/{2026-05-23_15-59-43Z_live-batch-run}/      ← session deliverables
  exports/{2026-05-23_15-59-43Z}_consolidated/        ← repo snapshots (audit trail)
  exports/consolidated-*.json                        ← latest copies (condense:all)
  exports/templates/                                 ← npm export starter sources (maintainer)
  exports/architecture-starter/                      ← generated export output (gitignored)
```

**Stamp format:** `YYYY-MM-DD_HH-MM-SSZ` via `formatExchangeTimestamp()` in `backend/src/shared/utils/formatExchangeTimestamp.js`.

## Consolidated exports

```bash
npm run condense:all
```

Writes all three artifacts into **one dated folder** `{stamp}_consolidated/` and refreshes latest copies:

| Audit (dated folder) | Latest (`exports/` + `consolidated-files/`) |
|----------------------|----------------------------------|
| `{stamp}_consolidated/consolidated-models.json` | `exports/consolidated-models.json`, `consolidated-files/consolidated-models.json` |
| `{stamp}_consolidated/consolidated-prompts.json` | same pattern |
| `{stamp}_consolidated/consolidated-file-structure.json` | same pattern |

Individual runs (`npm run condense-prompts`, etc.) create their own `{stamp}_consolidated/` folder for that artifact (plus `manifest.json`).

## Clear dated folders

Remove old import stamps and export session/audit folders (keeps `.gitkeep`, `exports/templates/`, and latest `consolidated-*.json` by default):

```bash
npm run clear:file-exchange -- --dry-run    # preview
npm run clear:file-exchange -- --confirm    # delete
```

Or `POST /api/file-exchange/clear` with `{ "confirm": true }` — see [docs/file-exchange/API.md](../docs/file-exchange/API.md).

## Workflow

1. Triage loose files into `imports/{stamp}/` (`npm run import:file-exchange -- <path>`).
2. Process via case-filing APIs using files **under that stamp** only.
3. Copy batch bundles / reports to `exports/{stamp}_{label}/` when done.
4. Refresh consolidated snapshots: `npm run condense:all` → new `exports/{stamp}_consolidated/`.

**Cursor agents:** mandatory — see [AGENTS.md](../AGENTS.md) and `.cursor/rules/file-exchange-inbox.mdc`.

See [docs/architecture/REPO_ARTIFACT_LAYOUT.md](../docs/architecture/REPO_ARTIFACT_LAYOUT.md).
