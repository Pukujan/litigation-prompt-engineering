# Agent instructions (Cursor / automation)

Repo-wide rules for AI agents. Module-specific rules live under `.cursor/rules/`.

## Mandatory: file-exchange before processing inbound files

Copy user bundles into a dated import folder before processing:

```bash
npm run import:file-exchange -- "/path/to/bundle"
```

Stamp format: `2026-05-23_15-59-43Z` via `formatExchangeTimestamp` in `backend/src/shared/utils/formatExchangeTimestamp.js`.

Deliverables → `file-exchange/exports/{stamp}/`. Consolidated snapshots → `file-exchange/exports/consolidated-*.json` (`npm run condense:all`).

See [file-exchange/README.md](file-exchange/README.md) and [docs/architecture/CONTRACTS_OVERVIEW.md](docs/architecture/CONTRACTS_OVERVIEW.md).

## Planning before implementation

Before building a tier-L feature:

1. Append a **study log** under `work-log/study-docs/` (You raw + Cursor summary per turn) — see `.cursor/commands/planning-study-log.md`
2. Add a **plan package** `*_plan_{slug}*.md` in the same folder
3. Finalize and gate:

```bash
npm run plan:finalize -- --slug <plan-slug> [--plan-id <id>]
npm run plan:gate -- --slug <plan-slug> [--plan-id <id>]
```

Manifest → `work-log/planning/{planId}.json`. See [planningPhase contract](docs/architecture/contracts/planningPhase.contract.md).

## Pre-push dev log

Before each push:

```bash
npm run dev-log:pre-push -- --slug <topic>
npm run dev-log:verify
```

Paired logs: `work-log/dev-logs/human/` + `work-log/dev-logs/agent/`. See `.cursor/commands/pre-push-dev-log.md`.

## Architecture checks

```bash
npm run lint:architecture
npm run lint:contracts
npm run lint:repo-artifacts
npm run lint:api-docs
```

## Work log

Study logs, plan packages, and planning manifests under `work-log/` per [work-log/README.md](work-log/README.md). Pre-push dev-logs record what shipped.
