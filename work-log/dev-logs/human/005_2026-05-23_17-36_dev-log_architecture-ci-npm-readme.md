# Dev log (human): architecture ci npm readme

| Field | Value |
|-------|--------|
| **Entry** | 005 |
| **Date** | 2026-05-23 |
| **Time** | 17-36 |
| **Filename** | `005_2026-05-23_17-36_dev-log_architecture-ci-npm-readme.md` |
| **Agent audit** | [005_2026-05-23_17-36_dev-log-agent_architecture-ci-npm-readme.json](../agent/005_2026-05-23_17-36_dev-log-agent_architecture-ci-npm-readme.json) |
| **Git** | `main` @ `e37c37f` |

## Table of contents

### [Part I — Summary](#part-i-summary) _(read first)_
- [I.1 At a glance](#i1-at-a-glance)
- [I.2 Diagrams](#i2-diagrams)
- [I.3 API surface (summary)](#i3-api-surface-summary)
- [I.4 Version & prompt audit](#i4-version-prompt-audit)
- [I.5 Test audit](#i5-test-audit)
- [I.6 Git audit](#i6-git-audit)
- [I.7 Repository shape](#i7-repository-shape)

### [Part II — Detailed](#part-ii-detailed) _(full audit trail)_
- [II.1 Goals and scope](#ii1-goals-and-scope)
- [II.2 Decisions](#ii2-decisions)
- [II.3 Changes by area](#ii3-changes-by-area)
- [II.4 Iterations](#ii4-iterations)
- [II.5 Tests (detail)](#ii5-tests-detail)
- [II.6 What got better / trade-offs / risks](#ii6-outcomes)
- [II.7 Follow-ups](#ii7-follow-ups)
- [II.8 APIs (full registry)](#ii8-apis-full-registry)
- [II.9 Git snapshot (full)](#ii9-git-snapshot-full)
- [II.10 Repository tree (full)](#repository-tree-full)

---

## Part I — Summary {#part-i-summary}

> **Purpose:** One-screen picture for reviewers — APIs, versions, tests, git, repo shape.  
> **Detail:** [Part II](#part-ii-detailed) below.

### I.1 At a glance {#i1-at-a-glance}

Shipped **platform architecture upgrades** across the product repo and npm starter: GitHub Actions CI (`test:ci`), golden regression slice for synthetic `case_001`, JSON schema validation on master-prompt output, batch/document **trace IDs**, product README redesign, and **@pukujan/create-modular-monolith@2.2.0** on GitHub. All **72 tests pass**. Blockers: npm **2.2.0** publish to registry (GitHub only until `npm publish`); full 14-doc golden still optional ingest, not required for every case.

### I.2 Diagrams {#i2-diagrams}

**HTTP modules (active + stub)**

```mermaid
flowchart LR
  client[Client / Frontend]
  client --> m0[Case Filing AI]
  client --> m1[Model condenser]
  client --> m2[Filing pipeline]
  client --> m3[Case workflow]
  client --> m4[Court rules]
  client --> m5[Filing text vault]
  client --> m6[Human review]
  client --> m7[Task docketing]
```

**Pipeline versions (defaults at push)**

```mermaid
flowchart TB
  upload[Upload PDFs] --> parse[Parse cache v001]
  parse --> master[Master prompt v1]
  master --> out[Batch outputs]
  rules[Rule fixtures fixtures-v0] -.-> master
  golden[Golden case_001-v2-full-expected] -.-> evals[Eval runner]
```

**Pre-push dev log flow**

```mermaid
flowchart LR
  code[Code changes] --> devlog[npm run dev-log:pre-push]
  devlog --> human[human/*.md]
  devlog --> agent[agent/*.json]
  human --> push[git push]
  agent --> push
```

### I.3 API surface (summary) {#i3-api-surface-summary}

| Kind | Count | Notes |
|------|------:|-------|
| Active HTTP routes | 20 | Case-filing-ai + condenser + pipeline |
| Stub modules (health only) | 5 | Workflow, court-rules, vault, review, docketing |
| Deprecated HTTP | 0 | From docs/API.md descriptions |
| Deprecated CLI | 1 | See version audit |

**Key routes this program:**

| Method | Path |
|--------|------|
| POST | `/api/case-filing-ai/process-batch` |
| GET | `/api/case-filing-ai/batches/:batchId/parsed-documents` |
| GET | `/api/case-filing-ai/batches/:batchId/parsed-documents/:documentId` |
| PATCH | `/api/case-filing-ai/batches/:batchId/parsed-documents/:documentId/review-status` |
| GET | `/api/model-condenser/health` |
| POST | `/api/model-condenser/condense` |

_Session API changes not in docs/API.md — FILL in [II.8](#ii8-apis-full-registry)._

### I.4 Version & prompt audit {#i4-version-prompt-audit}

| Contract | Version | Status |
|----------|---------|--------|
| App (package.json) | 2.0.0 | current |
| Storage layout | v001 | current |
| Parsed artifacts | v001 | current |
| Master prompt (default) | v1 | env `MASTER_PROMPT_VERSION` |
| Rule prompt | v1 | current |
| Golden dataset | case_001-v2-full-expected | current |
| Parser | pdf-embedded-v1 | current |
| OCR | openrouter-vision-v1 | current |

**Master prompt keys:**

| Key | Template | Notes |
|-----|----------|-------|
| v1 | `master-case-filing.prompt.md` | default |
| compact | `master-case-filing.compact.prompt.md` | available |
| v2 | `master-case-filing.compact.prompt.md` | alias → compact |
| v001 | `v001_master-case-filing.prompt.md` | opt-in |

**Deprecated surfaces:**

- `scripts/export-consolidated-models.mjs` → npm run condense-models (backend/) or POST /api/model-condenser/condense

### I.5 Test audit {#i5-test-audit}

| Status | Value |
|--------|-------|
| Ran | yes |
| Exit code | 0 |
| Summary | tests=72 pass=72 fail=0 exit=0 |
| Passed (sample) | 80 lines captured |
| Failed (sample) | 2 lines captured |

### I.6 Git audit {#i6-git-audit}

| Field | Value |
|-------|-------|
| Branch | `main` |
| Commit | `e37c37f` (`e37c37f7cd3928b74c1be39593d39fe1bd7efc1c`) |
| Changed paths (porcelain) | 0 |
| Recent commits | 4 listed below |

### I.7 Repository shape {#i7-repository-shape}

| Metric | Value |
|--------|------:|
| Files | 529 |
| Directories | 323 |
| Tree ignores | node_modules, .git, dist, build |
| Top extensions | .js (231), .md (129), .json (54), .mjs (36), .jsx (35) |

_Condensed tree (full tree in [II.10](#repository-tree-full)):_

```text
legal-prmpt-eng/
├── .gitignore
├── AGENTS.md
├── LICENSE
├── package.json
├── README.md
├── .cursor/
│   ├── commands/
│   │   ├── planning-study-log.md
│   │   └── pre-push-dev-log.md
│   └── rules/
│       ├── api-documentation.mdc
│       └── file-exchange-inbox.mdc
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── package-lock.json
│   ├── package.json
│   ├── db/
│   │   └── migrations/
│   │       └── 001_case_filing_ai_schema.sql
│   ├── scripts/
│   │   ├── check-module-boundaries.mjs
│   │   └── check-module-layers.mjs
│   └── src/
│       ├── core/
│       │   ├── module-loader.js
│       │   └── server.js
│       ├── modules/
│       │   ├── .gitkeep
│       │   ├── _reference/
│       │   │   ├── index.js
│       │   │   ├── README.md
│       │   │   ├── adapters/
│       │   │   │   └── README.md
│       │   │   ├── config/
│       │   │   │   └── index.js
│       │   │   ├── domain/
│       │   │   │   └── README.md
│       │   │   ├── evals/
│       │   │   │   ├── README.md
│       │   │   │   ├── datasets/
│       │   │   │   │   └── example.cases.json
│       │   │   │   └── runners/
│       │   │   │       └── example.eval.mjs
│   └── … (805 more lines — [full tree](#repository-tree-full))
```

---

## Part II — Detailed {#part-ii-detailed}

> **Purpose:** Decisions, iterations, narrative, and full machine-captured snapshots.

### II.1 Goals and scope {#ii1-goals-and-scope}

- **In scope:** CI gates, `EVAL_AND_CI.md`, trace IDs, schema validation, minimal committed golden for CI, README (product + npm), npm template 2.2.0 sync, export script `--to` fix, layer/boundary lint fixes.
- **Out of scope:** Langfuse/OTel integration; full synthetic golden ingest to git; automatic dev-log on every push (still manual `dev-log:pre-push` unless hook installed).

### II.2 Decisions {#ii2-decisions}

| ID | Decision | Rationale | Alternatives rejected |
|----|----------|-----------|------------------------|
| D1 | Golden is **per-case** (`evals/golden/case_001` = synthetic CI slice only), not universal truth for all matters | Real cases differ; golden answers regression on a **known** fixture | Single global golden for all litigation |
| D2 | CI runs offline `golden-regression.eval.mjs` (no API key) | Gates merge without OpenRouter secrets | Live LLM eval in CI |
| D3 | Platform sync to npm excludes domain modules/schemas | Starter stays domain-agnostic | Full case-filing-ai in create-modular-monolith |

### II.3 Changes by area {#ii3-changes-by-area}

#### Backend / API
- `validateMasterOutput` + v1/v001 JSON schemas in master prompt flow
- `traceId.js`; `uploadBatch` logs `batchTraceId` / `traceId`
- `runMetadata.service.js` moved to services (layer lint)

#### Frontend
- No UI changes this slice

#### Data / contracts / prompts
- `evals/golden/case_001/` minimal CI slice committed
- `prompts/manifest.json` for case-filing-ai

#### Tooling / CI / docs
- `.github/workflows/ci.yml`, `npm run test:ci`, `EVAL_AND_CI.md`
- Root README + LICENSE; GitHub topics/description
- npm `create-modular-monolith` 2.2.0; `export-architecture-starter` absolute `--to`

### II.4 Iterations {#ii4-iterations}

1. **Attempt 1** — `npm run test:ci` after golden + layer fixes → **72 pass, 0 fail**

### II.5 Tests (detail) {#ii5-tests-detail}

#### Passed
- Backend 72/72 including `validateMasterOutput`, `golden-regression` (via eval runner tests), eval bundle routes
- Frontend 12/12

#### Failed
- None at capture

#### Raw tail (auto)

```
1 missing updatedCaseSnapshot (0.749292ms)
✔ validateMasterOutput accepts v001 shape (0.4625ms)
✔ validateMasterOutput rejects v001 missing documentFacts (0.4115ms)
✔ GET /api/case-workflow/health (29.096625ms)
✔ getHealth returns module metadata (1.446167ms)
✔ GET /api/court-rules/health (36.816292ms)
✔ getHealth returns module metadata (2.193875ms)
✔ authorityRank: case order beats county and part (0.903958ms)
✔ rule pipeline loads fixtures and ranks part above county for Queens Part 10 (5.266333ms)
✔ GET /api/filing-pipeline/health (35.805375ms)
✔ GET /api/filing-pipeline/steps (32.885541ms)
✔ getHealth returns module metadata (2.159625ms)
✔ GET /api/filing-text-vault/health (32.889458ms)
✔ getHealth returns module metadata (3.754417ms)
✔ GET /api/human-review/health (33.723833ms)
✔ getHealth returns module metadata (1.273833ms)
✔ POST /api/model-condenser/condense regenerates consolidated file (47.2645ms)
✔ condenseModels writes consolidated-models.json (16.981875ms)
✔ GET /api/task-docketing/health (25.070541ms)
✔ getHealth returns module metadata (1.403292ms)
ℹ tests 72
ℹ suites 0
ℹ pass 72
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2327.274542

> legal-prmpt-eng-frontend@1.0.0 test
> node --test 'src/modules/**/tests/**/*.test.js'

✔ isHealthResponse validates shape (0.484625ms)
✔ isSupportedUploadFile accepts PDF and text files (0.712041ms)
✔ isSupportedUploadFile rejects empty and executable files (0.11125ms)
✔ mergeUploadFiles accumulates unique files (0.112083ms)
✔ supported upload hint is documented (0.111166ms)
✔ isHealthResponse validates shape (0.396291ms)
✔ isHealthResponse validates shape (1.340875ms)
✔ isHealthResponse validates shape (0.386ms)
✔ isHealthResponse validates shape (0.423208ms)
✔ isHealthResponse validates shape (0.435292ms)
✔ isHealthResponse validates shape (0.424375ms)
✔ isHealthResponse validates shape (0.435042ms)
ℹ tests 12
ℹ suites 0
ℹ pass 12
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 157.471791


```

### II.6 What got better / trade-offs / risks {#ii6-outcomes}

**Better**
- Merge-quality gates without manual checklist
- Product README explains litigation platform vs npm starter
- Agents can resume from this dev-log pair + `EVAL_AND_CI.md`

**Trade-offs**
- Minimal golden ≠ full case regression
- CI does not call live LLM APIs

**Regressions / risks**
- See Part I at-a-glance blockers (npm publish, optional full golden)

### II.7 Follow-ups {#ii7-follow-ups}

- [ ] Publish `@pukujan/create-modular-monolith@2.2.0` to npm
- [ ] Update product README `npm create` to `@2.2.0`
- [ ] Ingest full synthetic golden when ready (`import:file-exchange` + `ingest:golden-*`)

### II.8 APIs (full registry) {#ii8-apis-full-registry}

### HTTP — active

| Method | Path | Module | Description |
|--------|------|--------|-------------|
| GET | `/api/case-filing-ai/health` | Case Filing AI | Module health and config summary |
| POST | `/api/case-filing-ai/extract-rule-text` | Case Filing AI | Extract text from uploaded part-rule file |
| POST | `/api/case-filing-ai/process-batch` | Case Filing AI | Upload filings and run master prompt pipeline |
| GET | `/api/case-filing-ai/batches/:batchId/status` | Case Filing AI | Batch processing status |
| GET | `/api/case-filing-ai/batches/:batchId/results` | Case Filing AI | Aggregated batch results |
| GET | `/api/case-filing-ai/batches/:batchId/parsed-documents` | Case Filing AI | List parsed-document cache keys |
| GET | `/api/case-filing-ai/batches/:batchId/parsed-documents/:documentId` | Case Filing AI | Parsed cache detail for one document |
| PATCH | `/api/case-filing-ai/batches/:batchId/parsed-documents/:documentId/review-status` | Case Filing AI | Update parsed-document review status |
| GET | `/api/case-filing-ai/batches/:batchId/evals` | Case Filing AI | Golden eval reports for batch |
| POST | `/api/case-filing-ai/batches/:batchId/evals/bundle` | Case Filing AI | Copy one batch eval reports to eval-bundles |
| POST | `/api/case-filing-ai/evals/bundle` | Case Filing AI | Copy multiple batch eval reports to eval-bundles |
| POST | `/api/case-filing-ai/evals/cases/:goldenCaseId/bundle` | Case Filing AI | Copy golden fixtures plus case eval runs |
| GET | `/api/case-filing-ai/cases/:goldenCaseId` | Case Filing AI | Inventory batches for a golden case |
| POST | `/api/case-filing-ai/cases/:goldenCaseId/export` | Case Filing AI | Export full batch folders to case-exports |
| DELETE | `/api/case-filing-ai/cases/:goldenCaseId` | Case Filing AI | Delete batch folders for a case (requires confirm) |
| GET | `/api/model-condenser/health` | Model condenser | Module health |
| POST | `/api/model-condenser/condense` | Model condenser | Regenerate consolidated-models.json |
| GET | `/api/model-condenser/consolidated` | Model condenser | Read consolidated schema inventory |
| GET | `/api/filing-pipeline/health` | Filing pipeline | Module health |
| GET | `/api/filing-pipeline/steps` | Filing pipeline | List planned pipeline steps |

### HTTP — stub (health only)

| Method | Path | Module | Description |
|--------|------|--------|-------------|
| GET | `/api/case-workflow/health` | Case workflow | Module health (stub) |
| GET | `/api/court-rules/health` | Court rules | Module health (stub) |
| GET | `/api/filing-text-vault/health` | Filing text vault | Module health (stub) |
| GET | `/api/human-review/health` | Human review | Module health (stub) |
| GET | `/api/task-docketing/health` | Task docketing | Module health (stub) |

### HTTP — deprecated

_none registered in docs/API.md_

### Versioned contracts (current defaults)

```json
{
  "app": "2.0.0",
  "storageLayout": "v001",
  "parsedArtifacts": "v001",
  "parser": "pdf-embedded-v1",
  "ocr": "openrouter-vision-v1",
  "masterPrompt": "v1",
  "rulePrompt": "v1",
  "snapshotPrompt": "v1",
  "ruleSet": "fixtures-v0",
  "goldenDataset": "case_001-v2-full-expected"
}
```

### Master prompt versions

- **v1** — Original master prompt. (`master-case-filing.prompt.md`)
- **compact** — Bounded snapshot + strict JSON output (recommended for 6+ documents). (`master-case-filing.compact.prompt.md`)
- **v2** — Alias for compact. (`master-case-filing.compact.prompt.md`)
- **v001** — Ranked rule sources + documentFacts / ruleBasedTasks output shape. (`v001_master-case-filing.prompt.md`)

_Env: `MASTER_PROMPT_VERSION` default `v1`; allowed: v1, compact, v2, v001_

### Deprecated CLI

- `scripts/export-consolidated-models.mjs` → use npm run condense-models (backend/) or POST /api/model-condenser/condense

### II.9 Git snapshot (full) {#ii9-git-snapshot-full}

**Changed files (porcelain)**

```
(clean)
```

**Diff stat vs HEAD**

```
(no diff)
```

**Recent commits**

```
e37c37f fix: resolve absolute paths in export:architecture-starter --to
6ab6e9b feat: CI gates, golden regression, schema validation, and trace IDs
f8b8c96 docs: redesign README for litigation prompt engineering product
df7f0da Initial commit: litigation prompt engineering platform.
```

### II.10 Repository tree (full) {#repository-tree-full}

_Ignores: `node_modules`, `.git`, `dist`, `build` — equivalent to `tree -I "node_modules|.git|dist|build"`._

```text
legal-prmpt-eng/
├── .gitignore
├── AGENTS.md
├── LICENSE
├── package.json
├── README.md
├── .cursor/
│   ├── commands/
│   │   ├── planning-study-log.md
│   │   └── pre-push-dev-log.md
│   └── rules/
│       ├── api-documentation.mdc
│       └── file-exchange-inbox.mdc
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── package-lock.json
│   ├── package.json
│   ├── db/
│   │   └── migrations/
│   │       └── 001_case_filing_ai_schema.sql
│   ├── scripts/
│   │   ├── check-module-boundaries.mjs
│   │   └── check-module-layers.mjs
│   └── src/
│       ├── core/
│       │   ├── module-loader.js
│       │   └── server.js
│       ├── modules/
│       │   ├── .gitkeep
│       │   ├── _reference/
│       │   │   ├── index.js
│       │   │   ├── README.md
│       │   │   ├── adapters/
│       │   │   │   └── README.md
│       │   │   ├── config/
│       │   │   │   └── index.js
│       │   │   ├── domain/
│       │   │   │   └── README.md
│       │   │   ├── evals/
│       │   │   │   ├── README.md
│       │   │   │   ├── datasets/
│       │   │   │   │   └── example.cases.json
│       │   │   │   └── runners/
│       │   │   │       └── example.eval.mjs
│       │   │   ├── events/
│       │   │   │   └── index.js
│       │   │   ├── prompts/
│       │   │   │   ├── manifest.json
│       │   │   │   └── templates/
│       │   │   │       └── example.prompt.js
│       │   │   ├── repositories/
│       │   │   │   └── .gitkeep
│       │   │   ├── routes/
│       │   │   │   ├── health.routes.js
│       │   │   │   └── index.js
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   └── health.service.js
│       │   │   ├── tests/
│       │   │   │   ├── integration/
│       │   │   │   │   └── health.routes.test.js
│       │   │   │   └── unit/
│       │   │   │       └── health.service.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── case-filing-ai/
│       │   │   ├── index.js
│       │   │   ├── README.md
│       │   │   ├── adapters/
│       │   │   │   ├── openrouter.client.js
│       │   │   │   └── README.md
│       │   │   ├── config/
│       │   │   │   └── index.js
│       │   │   ├── contracts/
│       │   │   │   ├── parsedDocumentArtifacts.contract.js
│       │   │   │   ├── pipelineVersions.js
│       │   │   │   └── storageLayout.contract.js
│       │   │   ├── domain/
│       │   │   │   └── README.md
│       │   │   ├── evals/
│       │   │   │   ├── README.md
│       │   │   │   ├── datasets/
│       │   │   │   │   └── example.cases.json
│       │   │   │   └── runners/
│       │   │   │       ├── example.eval.mjs
│       │   │   │       └── golden-regression.eval.mjs
│       │   │   ├── events/
│       │   │   │   └── index.js
│       │   │   ├── prompts/
│       │   │   │   ├── manifest.json
│       │   │   │   ├── master-case-filing.compact.prompt.md
│       │   │   │   ├── master-case-filing.prompt.md
│       │   │   │   ├── promptVersions.js
│       │   │   │   ├── rule-parse.prompt.md
│       │   │   │   ├── v001_master-case-filing.prompt.md
│       │   │   │   └── templates/
│       │   │   ├── repositories/
│       │   │   │   └── .gitkeep
│       │   │   ├── routes/
│       │   │   │   ├── caseFiling.routes.js
│       │   │   │   ├── health.routes.js
│       │   │   │   └── index.js
│       │   │   ├── schemas/
│       │   │   │   ├── health.schema.js
│       │   │   │   ├── master-output.v001.schema.json
│       │   │   │   ├── master-output.v1.schema.json
│       │   │   │   └── parsed-document.schema.js
│       │   │   ├── services/
│       │   │   │   ├── caseData.service.js
│       │   │   │   ├── caseSnapshot.service.js
│       │   │   │   ├── documentText.service.js
│       │   │   │   ├── evalBundle.service.js
│       │   │   │   ├── evalRunner.service.js
│       │   │   │   ├── goldenDataset.service.js
│       │   │   │   ├── health.service.js
│       │   │   │   ├── localJsonStore.service.js
│       │   │   │   ├── masterPrompt.service.js
│       │   │   │   ├── ocr.service.js
│       │   │   │   ├── officeText.service.js
│       │   │   │   ├── parsedDocumentCache.service.js
│       │   │   │   ├── pdfText.service.js
│       │   │   │   ├── ruleText.service.js
│       │   │   │   ├── runMetadata.service.js
│       │   │   │   └── uploadBatch.service.js
│       │   │   ├── tests/
│       │   │   │   ├── fixtures/
│       │   │   │   │   └── batch-002/
│       │   │   │   │       ├── case-snapshot.json
│       │   │   │   │       └── outputs/
│       │   │   │   │           └── doc-001.json
│       │   │   │   ├── helpers/
│       │   │   │   │   └── minimalDocx.js
│       │   │   │   ├── integration/
│       │   │   │   │   ├── batch.routes.test.js
│       │   │   │   │   ├── case-data.routes.test.js
│       │   │   │   │   ├── eval-bundle.routes.test.js
│       │   │   │   │   ├── eval.routes.test.js
│       │   │   │   │   ├── health.routes.test.js
│       │   │   │   │   └── rule-text.routes.test.js
│       │   │   │   └── unit/
│       │   │   │       ├── auditNotes.test.js
│       │   │   │       ├── document-upload.test.js
│       │   │   │       ├── documentText.service.test.js
│       │   │   │       ├── evalRunner.provenance.test.js
│       │   │   │       ├── evalRunner.service.test.js
│       │   │   │       ├── health.service.test.js
│       │   │   │       ├── masterPrompt.service.test.js
│       │   │   │       ├── normalizeMasterOutput.test.js
│       │   │   │       ├── ocr.service.test.js
│       │   │   │       ├── officeText.service.test.js
│       │   │   │       ├── pdfText.service.test.js
│       │   │   │       ├── ruleText.service.test.js
│       │   │   │       ├── runMetadata.test.js
│       │   │   │       ├── runParsedDocumentChecks.test.js
│       │   │   │       ├── runRuleAuthorityChecks.test.js
│       │   │   │       ├── snapshotContext.test.js
│       │   │   │       ├── snapshotMerge.test.js
│       │   │   │       ├── storagePaths.test.js
│       │   │   │       ├── uploadBatch.continue.test.js
│       │   │   │       ├── uploadBatch.service.test.js
│       │   │   │       └── validateMasterOutput.test.js
│       │   │   └── utils/
│       │   │       ├── auditNotes.js
│       │   │       ├── caseBatchDiscovery.js
│       │   │       ├── document-upload.js
│       │   │       ├── evalNormalize.js
│       │   │       ├── evalProvenance.js
│       │   │       ├── extractionErrors.js
│       │   │       ├── index.js
│       │   │       ├── normalizeMasterOutput.js
│       │   │       ├── runParsedDocumentChecks.js
│       │   │       ├── runRuleAuthorityChecks.js
│       │   │       ├── snapshotContext.js
│       │   │       ├── snapshotMerge.js
│       │   │       ├── storagePaths.js
│       │   │       └── validateMasterOutput.js
│       │   ├── case-workflow/
│       │   │   ├── index.js
│       │   │   ├── README.md
│       │   │   ├── adapters/
│       │   │   │   └── README.md
│       │   │   ├── config/
│       │   │   │   └── index.js
│       │   │   ├── domain/
│       │   │   │   └── README.md
│       │   │   ├── evals/
│       │   │   │   ├── README.md
│       │   │   │   ├── datasets/
│       │   │   │   │   └── example.cases.json
│       │   │   │   └── runners/
│       │   │   │       └── example.eval.mjs
│       │   │   ├── events/
│       │   │   │   └── index.js
│       │   │   ├── prompts/
│       │   │   │   ├── manifest.json
│       │   │   │   └── templates/
│       │   │   │       └── case-state-update.prompt.js
│       │   │   ├── repositories/
│       │   │   │   └── .gitkeep
│       │   │   ├── routes/
│       │   │   │   ├── health.routes.js
│       │   │   │   └── index.js
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   └── health.service.js
│       │   │   ├── tests/
│       │   │   │   ├── integration/
│       │   │   │   │   └── health.routes.test.js
│       │   │   │   └── unit/
│       │   │   │       └── health.service.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── court-rules/
│       │   │   ├── index.js
│       │   │   ├── README.md
│       │   │   ├── adapters/
│       │   │   │   └── README.md
│       │   │   ├── config/
│       │   │   │   └── index.js
│       │   │   ├── contracts/
│       │   │   │   └── ruleAuthority.contract.js
│       │   │   ├── domain/
│       │   │   │   └── README.md
│       │   │   ├── evals/
│       │   │   │   ├── README.md
│       │   │   │   ├── datasets/
│       │   │   │   │   └── example.cases.json
│       │   │   │   └── runners/
│       │   │   │       └── example.eval.mjs
│       │   │   ├── events/
│       │   │   │   └── index.js
│       │   │   ├── prompts/
│       │   │   │   ├── manifest.json
│       │   │   │   └── templates/
│       │   │   │       └── rule-context.prompt.js
│       │   │   ├── repositories/
│       │   │   │   └── .gitkeep
│       │   │   ├── routes/
│       │   │   │   ├── health.routes.js
│       │   │   │   └── index.js
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   ├── health.service.js
│       │   │   │   ├── ruleAuthority.service.js
│       │   │   │   ├── ruleMatch.service.js
│       │   │   │   └── ruleStore.service.js
│       │   │   ├── tests/
│       │   │   │   ├── integration/
│       │   │   │   │   └── health.routes.test.js
│       │   │   │   └── unit/
│       │   │   │       ├── health.service.test.js
│       │   │   │       └── ruleAuthority.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── filing-pipeline/
│       │   │   ├── index.js
│       │   │   ├── README.md
│       │   │   ├── adapters/
│       │   │   │   └── README.md
│       │   │   ├── config/
│       │   │   │   └── index.js
│       │   │   ├── domain/
│       │   │   │   ├── pipeline-steps.js
│       │   │   │   └── README.md
│       │   │   ├── evals/
│       │   │   │   ├── README.md
│       │   │   │   ├── datasets/
│       │   │   │   │   └── example.cases.json
│       │   │   │   └── runners/
│       │   │   │       └── example.eval.mjs
│       │   │   ├── events/
│       │   │   │   └── index.js
│       │   │   ├── prompts/
│       │   │   │   ├── manifest.json
│       │   │   │   └── templates/
│       │   │   │       └── orchestrator.prompt.js
│       │   │   ├── repositories/
│       │   │   │   └── .gitkeep
│       │   │   ├── routes/
│       │   │   │   ├── health.routes.js
│       │   │   │   ├── index.js
│       │   │   │   └── pipeline.routes.js
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   ├── health.service.js
│       │   │   │   └── pipeline-steps.service.js
│       │   │   ├── tests/
│       │   │   │   ├── integration/
│       │   │   │   │   ├── health.routes.test.js
│       │   │   │   │   └── pipeline.routes.test.js
│       │   │   │   └── unit/
│       │   │   │       └── health.service.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── filing-text-vault/
│       │   │   ├── index.js
│       │   │   ├── README.md
│       │   │   ├── adapters/
│       │   │   │   └── README.md
│       │   │   ├── config/
│       │   │   │   └── index.js
│       │   │   ├── domain/
│       │   │   │   └── README.md
│       │   │   ├── evals/
│       │   │   │   ├── README.md
│       │   │   │   ├── datasets/
│       │   │   │   │   └── example.cases.json
│       │   │   │   └── runners/
│       │   │   │       └── example.eval.mjs
│       │   │   ├── events/
│       │   │   │   └── index.js
│       │   │   ├── prompts/
│       │   │   │   ├── manifest.json
│       │   │   │   └── templates/
│       │   │   │       └── filing-text-vault.prompt.js
│       │   │   ├── repositories/
│       │   │   │   └── .gitkeep
│       │   │   ├── routes/
│       │   │   │   ├── health.routes.js
│       │   │   │   └── index.js
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   └── health.service.js
│       │   │   ├── tests/
│       │   │   │   ├── integration/
│       │   │   │   │   └── health.routes.test.js
│       │   │   │   └── unit/
│       │   │   │       └── health.service.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── human-review/
│       │   │   ├── index.js
│       │   │   ├── README.md
│       │   │   ├── adapters/
│       │   │   │   └── README.md
│       │   │   ├── config/
│       │   │   │   └── index.js
│       │   │   ├── domain/
│       │   │   │   └── README.md
│       │   │   ├── evals/
│       │   │   │   ├── README.md
│       │   │   │   ├── datasets/
│       │   │   │   │   └── example.cases.json
│       │   │   │   └── runners/
│       │   │   │       └── example.eval.mjs
│       │   │   ├── events/
│       │   │   │   └── index.js
│       │   │   ├── prompts/
│       │   │   │   ├── manifest.json
│       │   │   │   └── templates/
│       │   │   │       └── human-review.prompt.js
│       │   │   ├── repositories/
│       │   │   │   └── .gitkeep
│       │   │   ├── routes/
│       │   │   │   ├── health.routes.js
│       │   │   │   └── index.js
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   └── health.service.js
│       │   │   ├── tests/
│       │   │   │   ├── integration/
│       │   │   │   │   └── health.routes.test.js
│       │   │   │   └── unit/
│       │   │   │       └── health.service.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── model-condenser/
│       │   │   ├── index.js
│       │   │   ├── README.md
│       │   │   ├── config/
│       │   │   │   └── index.js
│       │   │   ├── events/
│       │   │   │   └── index.js
│       │   │   ├── routes/
│       │   │   │   ├── health.routes.js
│       │   │   │   ├── index.js
│       │   │   │   └── modelCondenser.routes.js
│       │   │   ├── services/
│       │   │   │   ├── health.service.js
│       │   │   │   ├── modelCondenser.facade.js
│       │   │   │   └── modelCondenser.service.js
│       │   │   ├── tests/
│       │   │   │   ├── integration/
│       │   │   │   │   └── modelCondenser.routes.test.js
│       │   │   │   └── unit/
│       │   │   │       └── modelCondenser.service.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   └── task-docketing/
│       │       ├── index.js
│       │       ├── README.md
│       │       ├── adapters/
│       │       │   └── README.md
│       │       ├── config/
│       │       │   └── index.js
│       │       ├── domain/
│       │       │   └── README.md
│       │       ├── evals/
│       │       │   ├── README.md
│       │       │   ├── datasets/
│       │       │   │   └── example.cases.json
│       │       │   └── runners/
│       │       │       └── example.eval.mjs
│       │       ├── events/
│       │       │   └── index.js
│       │       ├── prompts/
│       │       │   ├── manifest.json
│       │       │   └── templates/
│       │       │       └── task-deadline.prompt.js
│       │       ├── repositories/
│       │       │   └── .gitkeep
│       │       ├── routes/
│       │       │   ├── health.routes.js
│       │       │   └── index.js
│       │       ├── schemas/
│       │       │   └── health.schema.js
│       │       ├── services/
│       │       │   └── health.service.js
│       │       ├── tests/
│       │       │   ├── integration/
│       │       │   │   └── health.routes.test.js
│       │       │   └── unit/
│       │       │       └── health.service.test.js
│       │       └── utils/
│       │           └── index.js
│       └── shared/
│           ├── ai/
│           │   └── prompt-registry.js
│           ├── contracts/
│           │   ├── consolidatedExports.contract.js
│           │   └── prePushDevLog.contract.js
│           ├── domain/
│           │   └── case-filing/
│           │       └── core-models.js
│           ├── events/
│           │   └── index.js
│           ├── http/
│           │   └── errors.js
│           ├── testing/
│           │   └── create-test-app.js
│           └── utils/
│               ├── consolidatedExport.js
│               ├── formatExchangeTimestamp.js
│               ├── formatExchangeTimestamp.test.js
│               └── traceId.js
├── data/
│   ├── case-filing-ai/
│   │   ├── batches/
│   │   └── examples/
│   │       ├── case-snapshot.json
│   │       └── case.json
│   └── court-rules/
│       └── fixtures/
│           └── case_001/
│               ├── cplr-3212-summary.json
│               ├── queens-county-practice.json
│               └── queens-part-10-general.json
├── docs/
│   ├── API.md
│   ├── DEVLOG_V2.md
│   ├── PUBLISHING.md
│   ├── README.md
│   ├── STARTER_PACK.md
│   ├── architecture/
│   │   ├── API_DOCUMENTATION_CONTRACT.md
│   │   ├── ARCHITECTURE_GUARDRAILS.md
│   │   ├── CONTRACTS_OVERVIEW.md
│   │   ├── EVAL_AND_CI.md
│   │   ├── MODULE_INTERNAL_CONTRACT.md
│   │   ├── REPO_ARTIFACT_LAYOUT.md
│   │   └── contracts/
│   │       ├── apiDocumentationRegistry.contract.md
│   │       ├── changelog.jsonl
│   │       ├── consolidatedExports.contract.md
│   │       ├── fileExchange.contract.md
│   │       ├── manifest.json
│   │       └── prePushDevLog.contract.md
│   ├── case-filing-ai/
│   │   ├── API.md
│   │   ├── guardrails.md
│   │   ├── INTEGRATION.md
│   │   ├── module-boundaries.md
│   │   ├── one-document-pipeline.md
│   │   ├── README.md
│   │   ├── STORAGE.md
│   │   └── suggested-work-tree.md
│   ├── case-workflow/
│   │   └── API.md
│   ├── court-rules/
│   │   └── API.md
│   ├── filing-pipeline/
│   │   └── API.md
│   ├── filing-text-vault/
│   │   └── API.md
│   ├── human-review/
│   │   └── API.md
│   ├── model-condenser/
│   │   └── API.md
│   └── task-docketing/
│       └── API.md
├── eval-bundles/
├── evals/
│   └── golden/
│       └── case_001/
│           ├── after_doc_001.expected.json
│           ├── case_001.golden-dataset.json
│           ├── doc_001.expected.json
│           ├── eval_comparison_config.json
│           └── negative_guardrails.expected.json
├── export/
├── export-templates/
│   ├── AGENTS.starter.md
│   ├── package.starter.json
│   └── docs/
│       └── API.starter.md
├── file-exchange/
│   ├── README.md
│   ├── exports/
│   │   ├── .gitkeep
│   │   ├── consolidated-file-structure.json
│   │   ├── consolidated-models.json
│   │   ├── consolidated-prompts.json
│   │   ├── 2026-05-23_15-59-43Z_live-batch-run/
│   │   │   ├── curl.log
│   │   │   └── response.json
│   │   └── 2026-05-23_16-11-33Z_live-batch-run-v2/
│   │       ├── curl.log
│   │       └── response.json
│   └── imports/
│       ├── .gitkeep
│       └── 2026-05-23_15-59-43Z/
│           ├── synthetic_case_001_golden_dataset_ground_truth.json
│           ├── synthetic_case_001_golden_dataset_ground_truth.zip
│           └── synthetic_case_001_pdf_files/
│               ├── doc_001_SUMMONS_AND_VERIFIED_COMPLAINT.pdf
│               ├── doc_002_CERTIFICATE_OF_MERIT.pdf
│               ├── doc_003_EXHIBITS_SUPPORTING_SUMMONS_AND_COMPLAINT.pdf
│               ├── doc_004_NOTICE_OF_COMMENCEMENT_OF_ACTION_FOR_PERSONAL_INJURIES.pdf
│               ├── doc_005_AFFIRMATION_AFFIDAVIT_OF_SERVICE.pdf
│               ├── doc_006_ANSWER.pdf
│               ├── doc_007_DEMAND_FOR_BILL_OF_PARTICULARS.pdf
│               ├── doc_008_NOTICE_TO_TAKE_DEPOSITION.pdf
│               ├── doc_009_BILL_OF_PARTICULARS.pdf
│               ├── doc_010_NOTICE_OF_MEDICAL_MALPRACTICE_ACTION.pdf
│               ├── doc_011_RJI_MEDICAL_MALPRACTICE.pdf
│               ├── doc_012_PRELIMINARY_CONFERENCE_ORDER.pdf
│               ├── doc_013_COMPLIANCE_CONFERENCE_ORDER.pdf
│               ├── doc_014_COMPLIANCE_CONFERENCE_ORDER_DUPLICATE_OR_REFILED_WITH_CPLR_3.pdf
│               ├── manifest.json
│               └── SYNTHETIC_DATA_NOTICE.md
├── frontend/
│   ├── .env.example
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── index.css
│       ├── main.jsx
│       ├── core/
│       │   ├── App.jsx
│       │   └── moduleRegistry.jsx
│       ├── modules/
│       │   ├── .gitkeep
│       │   ├── _reference/
│       │   │   ├── index.jsx
│       │   │   ├── README.md
│       │   │   ├── components/
│       │   │   │   └── ModuleHealthCard.jsx
│       │   │   ├── hooks/
│       │   │   │   └── use-module-health.js
│       │   │   ├── pages/
│       │   │   │   └── _referencePage.jsx
│       │   │   ├── prompts/
│       │   │   │   └── README.md
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   └── health-api.js
│       │   │   ├── tests/
│       │   │   │   └── unit/
│       │   │   │       └── health.schema.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── case-filing-ai/
│       │   │   ├── index.jsx
│       │   │   ├── README.md
│       │   │   ├── api/
│       │   │   │   └── caseFilingApi.js
│       │   │   ├── components/
│       │   │   │   ├── EvalPanel.jsx
│       │   │   │   ├── FilingUploadPicker.jsx
│       │   │   │   ├── ModuleHealthCard.jsx
│       │   │   │   ├── PdfFilingsDropZone.jsx
│       │   │   │   ├── ProcessingStatus.jsx
│       │   │   │   ├── ResultsPanel.jsx
│       │   │   │   ├── RuleInputPanel.jsx
│       │   │   │   └── UploadedFileList.jsx
│       │   │   ├── hooks/
│       │   │   │   ├── use-document-file-accumulator.js
│       │   │   │   └── use-module-health.js
│       │   │   ├── pages/
│       │   │   │   └── CaseFilingUpload.jsx
│       │   │   ├── prompts/
│       │   │   │   └── README.md
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   └── health-api.js
│       │   │   ├── tests/
│       │   │   │   └── unit/
│       │   │   │       ├── document-files.test.js
│       │   │   │       └── health.schema.test.js
│       │   │   ├── types/
│       │   │   │   └── caseFiling.types.js
│       │   │   └── utils/
│       │   │       ├── document-files.js
│       │   │       └── index.js
│       │   ├── case-workflow/
│       │   │   ├── index.jsx
│       │   │   ├── README.md
│       │   │   ├── components/
│       │   │   │   └── ModuleHealthCard.jsx
│       │   │   ├── hooks/
│       │   │   │   └── use-module-health.js
│       │   │   ├── pages/
│       │   │   │   └── CaseWorkflowPage.jsx
│       │   │   ├── prompts/
│       │   │   │   └── README.md
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   └── health-api.js
│       │   │   ├── tests/
│       │   │   │   └── unit/
│       │   │   │       └── health.schema.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── court-rules/
│       │   │   ├── index.jsx
│       │   │   ├── README.md
│       │   │   ├── components/
│       │   │   │   └── ModuleHealthCard.jsx
│       │   │   ├── hooks/
│       │   │   │   └── use-module-health.js
│       │   │   ├── pages/
│       │   │   │   └── CourtRulesPage.jsx
│       │   │   ├── prompts/
│       │   │   │   └── README.md
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   └── health-api.js
│       │   │   ├── tests/
│       │   │   │   └── unit/
│       │   │   │       └── health.schema.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── filing-pipeline/
│       │   │   ├── index.jsx
│       │   │   ├── README.md
│       │   │   ├── components/
│       │   │   │   ├── ModuleHealthCard.jsx
│       │   │   │   └── PipelineStepsCard.jsx
│       │   │   ├── hooks/
│       │   │   │   ├── use-module-health.js
│       │   │   │   └── use-pipeline-steps.js
│       │   │   ├── pages/
│       │   │   │   └── FilingPipelinePage.jsx
│       │   │   ├── prompts/
│       │   │   │   └── README.md
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   ├── health-api.js
│       │   │   │   └── pipeline-api.js
│       │   │   ├── tests/
│       │   │   │   └── unit/
│       │   │   │       └── health.schema.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── filing-text-vault/
│       │   │   ├── index.jsx
│       │   │   ├── README.md
│       │   │   ├── components/
│       │   │   │   └── ModuleHealthCard.jsx
│       │   │   ├── hooks/
│       │   │   │   └── use-module-health.js
│       │   │   ├── pages/
│       │   │   │   └── FilingTextVaultPage.jsx
│       │   │   ├── prompts/
│       │   │   │   └── README.md
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   └── health-api.js
│       │   │   ├── tests/
│       │   │   │   └── unit/
│       │   │   │       └── health.schema.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   ├── human-review/
│       │   │   ├── index.jsx
│       │   │   ├── README.md
│       │   │   ├── components/
│       │   │   │   └── ModuleHealthCard.jsx
│       │   │   ├── hooks/
│       │   │   │   └── use-module-health.js
│       │   │   ├── pages/
│       │   │   │   └── HumanReviewPage.jsx
│       │   │   ├── prompts/
│       │   │   │   └── README.md
│       │   │   ├── schemas/
│       │   │   │   └── health.schema.js
│       │   │   ├── services/
│       │   │   │   └── health-api.js
│       │   │   ├── tests/
│       │   │   │   └── unit/
│       │   │   │       └── health.schema.test.js
│       │   │   └── utils/
│       │   │       └── index.js
│       │   └── task-docketing/
│       │       ├── index.jsx
│       │       ├── README.md
│       │       ├── components/
│       │       │   └── ModuleHealthCard.jsx
│       │       ├── hooks/
│       │       │   └── use-module-health.js
│       │       ├── pages/
│       │       │   └── TaskDocketingPage.jsx
│       │       ├── prompts/
│       │       │   └── README.md
│       │       ├── schemas/
│       │       │   └── health.schema.js
│       │       ├── services/
│       │       │   └── health-api.js
│       │       ├── tests/
│       │       │   └── unit/
│       │       │       └── health.schema.test.js
│       │       └── utils/
│       │           └── index.js
│       └── shared/
│           └── api/
│               └── client.js
├── models/
│   ├── consolidated-file-structure.json
│   ├── consolidated-models.json
│   └── consolidated-prompts.json
├── scripts/
│   ├── check-api-docs.mjs
│   ├── condense-file-structure.mjs
│   ├── condense-models.mjs
│   ├── condense-prompts.mjs
│   ├── consolidated-output.mjs
│   ├── export-architecture-starter.mjs
│   ├── export-consolidated-models.mjs
│   ├── import-to-file-exchange.mjs
│   ├── ingest-golden-expected.mjs
│   ├── ingest-golden-parsed.mjs
│   ├── lint-contracts.mjs
│   ├── lint-repo-artifacts.mjs
│   ├── new-module.mjs
│   ├── rerun-batch-evals.mjs
│   ├── resolve-import-stamp.mjs
│   ├── run-module-evals.mjs
│   ├── sync-cli-template.mjs
│   ├── verify-dev-log.mjs
│   ├── write-pre-push-dev-log.mjs
│   ├── git-hooks/
│   │   └── pre-push.sample
│   └── lib/
│       ├── api-inventory.mjs
│       ├── dev-log-human-format.mjs
│       ├── git-snapshot.mjs
│       ├── module-scaffold.mjs
│       ├── repo-tree.mjs
│       └── run-tests.mjs
└── work-log/
    ├── INDEX.md
    ├── README.md
    ├── dev-logs/
    │   ├── 005_2026-05-23_15-45_dev-log_preflight-and-v3-v2-foundation.md
    │   ├── 005_2026-05-23_16-30_dev-log_v2-phases-3-7-complete.md
    │   ├── 005_2026-05-23_17-05_dev-log_golden-parsed-and-handoff-closeout.md
    │   ├── README.md
    │   ├── agent/
    │   │   ├── 005_2026-05-23_16-54_dev-log-agent_pre-push-dual-dev-log-system.json
    │   │   ├── 005_2026-05-23_16-57_dev-log-agent_api-inventory-and-tree-ignores.json
    │   │   ├── 005_2026-05-23_16-59_dev-log-agent_two-part-human-dev-log.json
    │   │   └── 005_2026-05-23_17-00_dev-log-agent_e2e-test.json
    │   ├── human/
    │   │   ├── 005_2026-05-23_16-54_dev-log_pre-push-dual-dev-log-system.md
    │   │   ├── 005_2026-05-23_16-57_dev-log_api-inventory-and-tree-ignores.md
    │   │   ├── 005_2026-05-23_16-59_dev-log_two-part-human-dev-log.md
    │   │   └── 005_2026-05-23_17-00_dev-log_e2e-test.md
    │   ├── schemas/
    │   │   └── dev-log-agent.v1.schema.json
    │   └── templates/
    │       └── dev-log-human.template.md
    ├── handoffs/
    │   ├── 002_2026-05-23_00-42_handoff_second.md
    │   ├── 005_2026-05-23_10-49_handoff-original_parsed-cache-rule-authority.md
    │   ├── 005_2026-05-23_11-14_handoff-v2_planned-review-in-cursor.md
    │   ├── 005_2026-05-23_11-20_handoff-v3_filing-structure-architecture.md
    │   ├── INDEX.md
    │   ├── README.md
    │   └── 001_2026-05-23_starter_case-filing-ai-updated/
    │       ├── README.md
    │       ├── db/
    │       │   └── migrations/
    │       │       └── 001_case_filing_ai_schema.sql
    │       ├── docs/
    │       │   ├── module-boundaries.md
    │       │   ├── one-document-pipeline.md
    │       │   └── suggested-work-tree.md
    │       ├── examples/
    │       │   └── local-json/
    │       │       ├── case-snapshot.json
    │       │       └── case.json
    │       ├── guardrails/
    │       │   └── all-guardrails.md
    │       ├── models/
    │       │   └── typescript/
    │       │       └── core-models.ts
    │       └── prompts/
    │           ├── case-state-update.prompt.md
    │           ├── fact-extraction.prompt.md
    │           ├── filing-text-vault.prompt.md
    │           ├── human-review.prompt.md
    │           ├── orchestrator.prompt.md
    │           ├── rule-context.prompt.md
    │           └── task-deadline.prompt.md
    └── study-docs/
        ├── 002_2026-05-23_study-log_follow-up-before-handoff.md
        ├── 003_2026-05-23_study-log_case-filing-ai-planning.md
        ├── 004_2026-05-23_study-log_golden-dataset-eval-runner.md
        ├── 005_2026-05-23_10-50_study-log_parsed-cache-rule-authority.md
        ├── 006_2026-05-23_11-21_study-log_cursor-planning-phase.md
        ├── README.md
        └── 001_2026-05-23_00-07_blog_source-grounded-docketing/
            ├── part-1_docketing-is-not-summarization.md
            ├── part-2_prompt-engineering-as-design-method.md
            └── part-3_final-source-grounded-agent-pattern.md
```