# Agent instructions (Cursor / automation)

Repo-wide rules for AI agents working in **legal-prmpt-eng**. Module-specific rules live under `.cursor/rules/`.

## Mandatory: file-exchange before processing inbound files

**Never** call `POST /process-batch`, read PDFs from `Downloads/`, or ingest golden data directly from paths outside the repo until inbound material is under a dated import folder.

### Required sequence

1. **Import** — copy the user’s bundle or loose files into the repo inbox:
   ```bash
   npm run import:file-exchange -- "/absolute/or/relative/path/to/bundle"
   ```
   This creates `file-exchange/imports/{stamp}/` with a human-readable UTC stamp like `2026-05-23_15-59-43Z` (see `formatExchangeTimestamp` in `backend/src/shared/utils/formatExchangeTimestamp.js`).

2. **Ingest golden** (when applicable) — only from that stamp:
   ```bash
   npm run ingest:golden-parsed
   npm run ingest:golden-expected
   ```
   Override paths with explicit args if the stamp is not the script default.

3. **Process** — use files under `file-exchange/imports/{stamp}/` (e.g. `.../synthetic_case_001_pdf_files/*.pdf`), not the original Downloads path.

4. **Export deliverables** — copy batch summaries, eval bundles, or reports to:
   ```text
   file-exchange/exports/{stamp}/
   ```

5. **Consolidated snapshots** (models / prompts / file tree):
   ```bash
   npm run condense:all
   ```
   → `file-exchange/exports/{stamp}_consolidated/` (dated audit folder + `manifest.json`). Latest: `exports/consolidated-*.json` and `consolidated-files/` mirror.

### Do not

- Leave bundles at repo root.
- Use slug folders like `imports/my-bundle/` instead of `imports/2026-05-23_15-59-43Z/`.
- Skip import because “it’s faster” to point `curl` at `Downloads/`.

### Contracts

- Layout: [docs/architecture/REPO_ARTIFACT_LAYOUT.md](docs/architecture/REPO_ARTIFACT_LAYOUT.md)
- Manifest: [docs/architecture/contracts/manifest.json](docs/architecture/contracts/manifest.json)
- Inbox detail: [file-exchange/README.md](file-exchange/README.md)

## Other agent conventions

- **API changes** — follow `.cursor/rules/api-documentation.mdc`; run `npm run lint:api-docs`.
- **Architecture** — `npm run lint:boundaries`, `lint:layers`, `lint:contracts`, `lint:repo-artifacts` before finishing large changes.
- **PII** — synthetic fixtures only in committed docs/logs; no real party names in git.
- **Planning logs** — use `/planning-study-log` for planning-only sessions (see `.cursor/commands/planning-study-log.md`).
- **Work log** — handoffs and dev-logs under `work-log/` per [work-log/README.md](work-log/README.md).
- **Pre-push dev log** — before every push, run `npm run dev-log:pre-push -- --slug <topic>` and fill both:
  - `work-log/dev-logs/human/*_dev-log_*.md` (narrative)
  - `work-log/dev-logs/agent/*_dev-log-agent_*.json` (audit for agents — read this first when resuming)
  See `.cursor/commands/pre-push-dev-log.md`.

## Case Filing AI quick reference

| Step | Command / path |
|------|----------------|
| Import bundle | `npm run import:file-exchange -- <path>` |
| Process batch | `POST /api/case-filing-ai/process-batch` (files from `imports/{stamp}/`) |
| Re-score evals | `npm run rerun:batch-evals -- batch-NNN` |
| Runtime batches | `data/case-filing-ai/batches/batch-NNN/` |
| Golden expected | `evals/golden/case_001/` |
