# Plan package: External artifact root and repo space policy

| Field | Value |
|-------|--------|
| **Plan slug** | `external-artifact-root` |
| **Program** | 008 |
| **Status** | `implemented` (`main` @ `6ea2100`) |
| **Created (UTC)** | 2026-05-24 |
| **Study log** | [008_2026-05-24_study-log_external-artifact-and-v002-checkpoint.md](./008_2026-05-24_study-log_external-artifact-and-v002-checkpoint.md) |
| **Sequenced after** | [007 pipeline UI](./007_2026-05-24_plan_pipeline-ui-onboarding-package.md) |

---

## Executive summary

Move heavy, gitignored runtime outputs (batches, file-exchange, eval/case exports) to an optional **external `artifactRoot`** via `local-artifacts.json` and `resolveArtifactPaths()`. Keep code, golden fixtures, contracts, and `work-log/` in the repo. Defer second API port; use a storage adapter boundary + `DATABASE_URL` placeholder for future DB.

---

## Policy split

| In repo | Under `artifactRoot` |
|---------|----------------------|
| `backend/`, `frontend/`, `scripts/` | `batches/` |
| `evals/golden/`, `data/court-rules/fixtures/` | `file-exchange/` (imports + exports) |
| `docs/`, `work-log/dev-logs/` | `eval-bundles/`, `case-exports/` |
| `local-artifacts.example.json` | optional `doc-exports/` |

---

## Config

**File:** `local-artifacts.json` (gitignored) — see [local-artifacts.example.json](../../local-artifacts.example.json)

**Resolver:** [backend/src/shared/config/resolveArtifactPaths.js](../../backend/src/shared/config/resolveArtifactPaths.js)

**Precedence:** `ENV` override > `local-artifacts.json` > in-repo defaults

---

## Implementation checklist (completed)

- [x] `local-artifacts.example.json` + `.gitignore` entry
- [x] `resolveArtifactPaths()` + unit tests
- [x] Wire case-filing config, `consolidatedExport`, `fileExchangeCleanup`, import/condense scripts
- [x] Update `REPO_ARTIFACT_LAYOUT.md`, `AGENTS.md`, `file-exchange/README.md`, contracts, `.env.example`
- [x] `batchStorage.adapter.js` + `DATABASE_URL` comment in `.env.example`
- [x] Follow-on doc: [docs/follow-ons/compact-snapshot-v001.md](../../docs/follow-ons/compact-snapshot-v001.md)

---

## Follow-ons (not this plan)

- v001 + compact snapshot merge (token space) — GitHub #10
- Full DB storage adapter implementation
- Durable async job queue

---

*Committed from Cursor Plan `external_artifact_root` for planningPhase audit.*
