# 007 — Study log: Pipeline UI, download packages & planning audit

| Field | Value |
|-------|--------|
| **Program** | 007 |
| **Scope** | Planning conversation + build plan **before** implementation (retroactive log — code landed on `plan/007-pipeline-ui-onboarding` first) |
| **Session (UTC)** | 2026-05-24 |
| **Filename** | `007_2026-05-24_study-log_pipeline-ui-onboarding.md` |
| **Cursor transcript** | [a3886672-3e7b-49be-b5b6-831ae7077aa9](file:///Users/teresaguajardo/.cursor/projects/Users-teresaguajardo-Documents-coding-legal-prmpt-eng/agent-transcripts/a3886672-3e7b-49be-b5b6-831ae7077aa9/a3886672-3e7b-49be-b5b6-831ae7077aa9.jsonl) |
| **Cursor plan** | `batch_download_package` (`.cursor/plans/`) |
| **Content policy** | Fixtures, APIs, folder layout, architecture only — no real party names or filing text |

## About this document

- **Your messages** — verbatim (raw) in blockquotes under each turn.
- **Cursor** — short bullet summaries per turn (audited, not full tool output).
- **Build plans** — committed under `work-log/study-docs/`; this log records *how we chose* them.

**Note:** Implementation started before this file existed. This log closes the planningPhase audit gap for program 007.

---

## Table of contents

1. [Decision summary](#1-decision-summary)
2. [Conversation — download package](#2-conversation--download-package)
3. [Conversation — frontend visibility & rules](#3-conversation--frontend-visibility--rules)
4. [Conversation — design docs & work-log placement](#4-conversation--design-docs--work-log-placement)
5. [Conversation — planning gate & execution](#5-conversation--planning-gate--execution)
6. [Artifacts produced](#artifacts-produced)

---

## 1. Decision summary

| Decision | Outcome |
|----------|---------|
| Download | Batch zip + case export zip; `rules-applied/` summary in package |
| Frontend visibility | Module rail (6 runtime modules) + document queue + richer eval cards |
| Court rules | Backend fixtures only; part rules optional from UI |
| Live progress | Async `process-batch` (202) + poll `GET /status` |
| Persistence | `batchId` in URL + `localStorage` + batch history |
| Onboarding | `docs/onboarding/pipeline-guide.md` + `GET /api/platform/onboarding/pipeline-guide` |
| Planning audit | study log + design MD + plan package + `work-log/planning/*.json` **before** build |
| Work-log location | All planning artifacts under `work-log/study-docs/`, not `docs/` |

---

## 2. Conversation — download package

### Turn 1 — Processed data download package

**You (raw):**

> (Asked whether processed output has a downloadable bundle API; chose batch + case download scopes.)

**Cursor (summary):** Mapped existing batch folder layout (`uploads`, `parsed-documents`, `outputs`, `evals`, `rule/`, snapshot, log). Noted export APIs copy to disk only — no browser zip. Planned `POST/GET .../package` + case export download.

**Build plan created:** Cursor Plan `batch_download_package` → repo copies:
- [007 design](./007_2026-05-24_design_pipeline-ui-onboarding.md)
- [007 plan package](./007_2026-05-24_plan_pipeline-ui-onboarding-package.md)

---

## 3. Conversation — frontend visibility & rules

### Turn 2 — Pipeline not shown; rules source

**You (raw):**

> also the frontend doesnt show the whole pipeline, only the processing and part rule upload, but i believe the rules right now are simply taken from our module rather than from frontend for processing right?
>
> and another problem is its not showing enough data in frontend to show everything it does, just that there is issue
>
> do you suggest a fix for this?

**Cursor (summary):** Confirmed **hybrid rules**: part rules from UI (optional); court rules from `court-rules` fixtures in backend. Filing Pipeline page is static catalog, not live runner. Recommended module rail + document queue + post-run cards + extended eval scores. Added pipeline UI todos to plan.

---

## 4. Conversation — design docs & work-log placement

### Turn 3 — Mermaid design + downloadable MD in chat

**You (raw):**

> (Requested rough design via mermaid + detailed explanation in downloadable MD; API to serve guide MD.)

**Cursor (summary):** Delivered full design document in chat; proposed `GET /api/platform/onboarding/pipeline-guide` and async batch prerequisite.

### Turn 4 — work-log vs docs

**You (raw):**

> i think everything about the plans like this are supposed to go in work log not doc right?

**Cursor (summary):** Agreed — `work-log/study-docs/` for planning; `docs/onboarding/` only for shipped product guide. Moved files from `docs/design/` to `work-log/study-docs/`; updated INDEX.

### Turn 5 — Downloadable MD package in chat

**You (raw):**

> give me a downloadable md … including the one from before for the pipeline …

**Cursor (summary):** Wrote `work-log/study-docs/007_*_design_*.md` and `007_*_plan_*-package.md` in repo.

---

## 5. Conversation — planning gate & execution

### Turn 6 — planningPhase contract before build

**You (raw):**

> … contract … documents the planning phase right before it gets carried out … raw conversation … summarized … plans … work log before carrying out any build plan …

**Cursor (summary):** Explained partial existing support (`/planning-study-log`, 006 example). Proposed `planningPhase` contract + `work-log/planning/{id}.json` + `npm run plan:gate`. Program 008 later received full study log; **007 was missing study log until this file**.

### Turn 7 — Git branch before execute

**You (raw):**

> github push … new branch … before we actually carry it out

**Cursor (summary):** Created `plan/007-pipeline-ui-onboarding`; committed planning MD only; pushed to GitHub.

### Turn 8 — Execute plan

**You (raw):**

> Processed data download package — Implement the plan as specified…

**Cursor (summary):** Implemented batch package service, zip routes, async batch, platform module, pipeline UI components, onboarding page, planning scripts, tests, API docs. Dev-log: `007_2026-05-24_12-55_dev-log_pipeline-ui-onboarding.md`.

---

## Artifacts produced

| Artifact | Path | Role |
|----------|------|------|
| Study log (this file) | `work-log/study-docs/007_2026-05-24_study-log_pipeline-ui-onboarding.md` | Raw you + summarized Cursor |
| Design | [007_2026-05-24_design_pipeline-ui-onboarding.md](./007_2026-05-24_design_pipeline-ui-onboarding.md) | Full UI/API design |
| Plan package | [007_2026-05-24_plan_pipeline-ui-onboarding-package.md](./007_2026-05-24_plan_pipeline-ui-onboarding-package.md) | Phases, todos, verification |
| Planning manifest | [work-log/planning/007-pipeline-ui-onboarding.json](../planning/007-pipeline-ui-onboarding.json) | `plan:finalize` / `plan:gate` |
| Shipped guide | `docs/onboarding/pipeline-guide.md` | Product doc (post-build) |
| Dev log (shipped) | [../dev-logs/human/007_2026-05-24_12-55_dev-log_pipeline-ui-onboarding.md](../dev-logs/human/007_2026-05-24_12-55_dev-log_pipeline-ui-onboarding.md) | What landed after build |

**Gate:** `npm run plan:gate -- --slug pipeline-ui-onboarding --plan-id 007-pipeline-ui-onboarding`
