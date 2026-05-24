# 009 — Study log: Case Filing Demo + Golden authoring pipeline

| Field | Value |
|-------|--------|
| **Program** | 009 |
| **Scope** | Planning conversation + implementation (retroactive log — code landed before this file) |
| **Session (UTC)** | 2026-05-24 |
| **Filename** | `009_2026-05-24_17-38_study-log_case-filing-demo-golden-authoring.md` |
| **Cursor transcript** | [3a5d3011-11bb-4100-9eed-becdb76c6001](file:///Users/teresaguajardo/.cursor/projects/Users-teresaguajardo-Documents-coding-legal-prmpt-eng/agent-transcripts/3a5d3011-11bb-4100-9eed-becdb76c6001/3a5d3011-11bb-4100-9eed-becdb76c6001.jsonl) |
| **Content policy** | Synthetic fixtures, APIs, module layout — no real party names or filing text |

## About this document

- **Your messages** — verbatim (raw) in blockquotes.
- **Cursor** — short bullet summaries per turn.
- **Build plans** — Cursor plans + [plan package](./009_2026-05-24_17-38_plan_case-filing-demo-golden-authoring-package.md); this log records *how we chose* them.

**Note:** Implementation (demo module, insights tabs, `golden-authoring` module) preceded this study log. This file closes the planningPhase audit gap for program 009.

---

## Table of contents

1. [Decision summary](#1-decision-summary)
2. [Conversation — demo without DB](#2-conversation--demo-without-db)
3. [Conversation — hybrid demo UX](#3-conversation--hybrid-demo-ux)
4. [Conversation — interactive orchestration](#4-conversation--interactive-orchestration)
5. [Conversation — insights tabs](#5-conversation--insights-tabs)
6. [Conversation — golden authoring](#6-conversation--golden-authoring)
7. [Conversation — work-log gap](#7-conversation--work-log-gap)
8. [Artifacts produced](#artifacts-produced)

---

## 1. Decision summary

| Decision | Outcome |
|----------|---------|
| Demo vs production | Separate **`case-filing-demo`** module; does not mutate `/case-filing-ai` batches |
| Data for demo | Case 001: `evals/golden/case_001_rule_authority_v002/` + fixtures + optional PDF stream from file-exchange imports |
| Case picker | Dropdown; cases 002–004 **Coming soon** until user adds bundles |
| Speed vs fidelity | **Hybrid:** cached bundle for audit/eval/governance; optional live pipeline later |
| Interactivity | Start button, animated agent rail per filing, live output panels during playback |
| Insights UI | Tabs below orchestration: Dashboard, Outputs, Evals, Audit, Governance |
| Golden ground truth | **`golden-authoring`** module: same pipeline shape, `MODEL_GOLDEN_AUTHORING`, staging → human promote |
| Eval versioning | `goldenDatasetVersion`, `VERSION_HISTORY.jsonl`, `pipeline_versions.expected.json` pins, changelog contract |
| Work log | This retroactive study log + plan manifest + dev-log pair (program 009) |

---

## 2. Conversation — demo without DB

### Turn 1 — Governance demo, Vercel + Railway

**You (raw):**

> is there a way to improve governance and file handling without adding a db right now for a demo?
>
> i also wanna create a frontend focus on showing all the data to a non technical demo, that clearly shows data as well as summery and presentable decks and blocks along with audit log tables and everything else we might need for that
>
> what can i do for this?
>
> note that im gonna have about 3-4 cases each with their own eval and eval fixtures, and synthetic input
>
> i wanna make the synthetic input accessible and viewable to a legal professional so they can see that its actually very similar file to an actual litigation filing and the governance trail and output actually shows the multi orchestration ai agent working to create the outputs
>
> note these has be viewable in frontend in a vercel demo
>
> the backend will be hosted in railway

**Cursor (summary):** Proposed file-based governance (existing batches, golden, file-exchange), read-only demo API, frontend “legal deck” with case switcher, PDF viewer, eval/governance panels. No DB required for first demo.

---

### Turn 2 — Cases arriving later

**You (raw):**

> i will sent the synthetic cases later

**Cursor (summary):** Planned placeholder cases in dropdown; Case 001 from repo golden v002.

---

## 3. Conversation — hybrid demo UX

### Turn 3 — Dropdown + viewable documents

**You (raw):**

> maybe use a drop down to show them and make sure the documents themself are viewable?

**Cursor (summary):** Case dropdown + `GET .../documents/:docKey/source` for PDF streaming when imports exist.

---

### Turn 4 — Pre-processed vs queue

**You (raw):**

> and the dropdown, the ones that are not there yet, say coming soon and i will add them later through cursor so they can choose and view the document before it goes to process queue pipeline where it actually processes? or for this right now for demo should we just show processed json already fast spped sake for the demo?

**Cursor (summary):** Recommended **cached processed JSON** for demo speed; “Coming soon” for missing cases; live queue deferred.

---

### Turn 5 — Audit and eval in demo

**You (raw):**

> but i dont think it would show proper audit and eval log that i want to show too? should we use a pre programmed one for the demo too?

**Cursor (summary):** Yes — prebuilt eval reports + synthesized audit replay from fixtures (no LLM on demo path).

---

### Turn 6 — Separate module

**You (raw):**

> i mean we should create a seperate module just for the containerized demo so it doesnt actually mess with the actual mode

**Cursor (summary):** Agreed: `case-filing-demo` at `/api/case-filing-demo/*`, isolated from operational module.

---

### Turn 7 — Use existing repo data

**You (raw):**

> can you make this and use the data that is in this repo, i think 1 case is already done with 14 pdf filings and its parsed result as well as its audit and eval log i think, can you check

**Cursor (summary):** Confirmed Case 001 v002 (14 docs), golden expected files, rule-authority fixtures; implemented demo backend + frontend route.

---

## 4. Conversation — interactive orchestration

### Turn 8 — Run servers; fix empty demo

**You (raw):**

> run both ends

**You (raw):**

> nothing loading on case filing demo

**Cursor (summary):** Started dev servers; fixed API shape bug (`{ cases: { cases: [] } }` → flat `{ cases: [...] }`).

---

### Turn 9 — Dynamic agent animation

**You (raw):**

> its just static demo, i want it dynamic where a button is pressed animation shows which file is on which agent and the output as well this is very interactive demo

**Cursor (summary):** Built `InteractiveOrchestrationDemo` + `useInteractiveDemoPlayback` — stepped playback through parse → court-rules → master-prompt → snapshot → eval with live panels.

---

## 5. Conversation — insights tabs

### Turn 10 — Tabs below orchestration

**You (raw):**

> i think it should also show more tabs below to check evals and dashboard and what audit logs contain and all of that things in the demo

**Cursor (summary):** Planned and implemented `DemoInsightsTabs` (Dashboard, Outputs, Evals, Audit, Governance); hybrid live vs full bundle via `onPlaybackChange`.

---

### Turn 11 — Implement insights plan

**You (raw):**

> Demo Insights Tabs Below Orchestration
>
> Implement the plan as specified…

**Cursor (summary):** Extracted `EvalReportCard`, wired tabs on `CaseFilingDemoPage`, CSS + build verification.

---

### Turn 12 — What generates documents?

**You (raw):**

> what is being used to generate the documents right now?

**Cursor (summary):** PDFs are **external synthetic** imports; demo replays **fixtures**; live pipeline uses **OpenRouter** (`MODEL_TEXT_REASONING`, OCR model) + master prompt v001 — demo path calls no LLMs.

---

## 6. Conversation — golden authoring

### Turn 13 — Authoring pipeline + eval versioning

**You (raw):**

> i wanna create a similar but different pipeline that actually writes the golden dataset
>
> a completely same pipeline but done by a much more powerful model that writes the golden dataset/ground truth,
>
> also im assuming we are also gonna need eval versioning

**Cursor (summary):** Planned `golden-authoring` module: shared `documentPipelineRunner`, stronger `MODEL_GOLDEN_AUTHORING`, export to `evals/golden-staging/{caseId}/{version}/`, promote to `evals/golden/`, `VERSION_HISTORY.jsonl`, CLI + admin API. User chose staging + human promote and CLI + API.

---

### Turn 14 — Implement golden plan

**You (raw):**

> Golden authoring pipeline and eval versioning
>
> Implement the plan as specified…

**Cursor (summary):** Shipped `golden-authoring` module, `author:golden` / `promote:golden`, `goldenDataset.contract.md`, API registry, tests (99 pass).

---

## 7. Conversation — work-log gap

### Turn 15 — Missing work logs

**You (raw):**

> whatever happened to our work-log updates for planning and conversation logging?

**Cursor (summary):** Explained gap: plan/implement sessions skipped `/planning-study-log` and `dev-log:pre-push`; program 008 logged, 009 not. Offered retroactive backfill.

---

### Turn 16 — Backfill confirmed

**You (raw):**

> yes

**Cursor (summary):** Creating this study log, plan package, `plan:finalize` manifest, and dev-log pair.

---

## Artifacts produced

| Artifact | Path |
|----------|------|
| Study log (this file) | `work-log/study-docs/009_2026-05-24_17-38_study-log_case-filing-demo-golden-authoring.md` |
| Plan package | `work-log/study-docs/009_2026-05-24_17-38_plan_case-filing-demo-golden-authoring-package.md` |
| Planning manifest | `work-log/planning/009-case-filing-demo-golden-authoring.json` |
| Dev log (human) | `work-log/dev-logs/human/009_2026-05-24_17-39_dev-log_case-filing-demo-golden-authoring.md` |
| Dev log (agent) | `work-log/dev-logs/agent/009_2026-05-24_17-39_dev-log-agent_case-filing-demo-golden-authoring.json` |
| Demo module | `backend/src/modules/case-filing-demo/`, `frontend/src/modules/case-filing-demo/` |
| Golden authoring | `backend/src/modules/golden-authoring/`, `scripts/author-golden.mjs`, `scripts/promote-golden.mjs` |
| Shared runner | `backend/src/modules/case-filing-ai/services/documentPipelineRunner.js` |
| Contract | `docs/architecture/contracts/goldenDataset.contract.md` |
| API docs | `docs/golden-authoring/API.md`, `docs/API.md` rows |
| Case manifest template | `file-exchange/imports/templates/case_manifest.example.json` |
