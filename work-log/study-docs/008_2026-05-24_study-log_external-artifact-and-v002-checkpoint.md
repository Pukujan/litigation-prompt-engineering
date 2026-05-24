# 008 — Study log: External artifact root, 007 sequencing, v002 runtime checkpoint

| Field | Value |
|-------|--------|
| **Program** | 008 |
| **Scope** | Planning conversation + build-plan decisions (retroactive log for session that implemented before this file existed) |
| **Session (UTC)** | 2026-05-24 |
| **Filename** | `008_2026-05-24_study-log_external-artifact-and-v002-checkpoint.md` |
| **Cursor transcript** | [60c97cfd-c57e-44c6-b3a4-8239a14b2f08](file:///Users/teresaguajardo/.cursor/projects/Users-teresaguajardo-Documents-coding-legal-prmpt-eng/agent-transcripts/60c97cfd-c57e-44c6-b3a4-8239a14b2f08/60c97cfd-c57e-44c6-b3a4-8239a14b2f08.jsonl) |
| **Content policy** | Synthetic fixtures, repo layout, APIs, prompts — no real party names or filing text |

## About this document

- **Your messages** — verbatim (raw) in blockquotes.
- **Cursor** — short bullet summaries per turn.
- **Build plans** — committed under `work-log/study-docs/` (see [Artifacts](#artifacts-produced)) before or alongside implementation; this log records *how we chose* those plans.

**Note:** Implementation on `main` (`83cabca`, `6ea2100`) preceded this study log. This file closes the planningPhase audit gap.

---

## Table of contents

1. [Decision summary](#1-decision-summary)
2. [Conversation — prompts & space](#2-conversation--prompts--space)
3. [Conversation — sequencing 007 vs artifacts](#3-conversation--sequencing-007-vs-artifacts)
4. [Conversation — rule authority failure & fix](#4-conversation--rule-authority-failure--fix)
5. [Conversation — roadmap & execution](#5-conversation--roadmap--execution)
6. [Artifacts produced](#artifacts-produced)

---

## 1. Decision summary

| Decision | Outcome |
|----------|---------|
| Repo vs external disk | Heavy runtime data → optional `local-artifacts.json` + `resolveArtifactPaths()`; code + golden stay in repo |
| Sequencing | **Option A:** finish [007 pipeline UI](./007_2026-05-24_plan_pipeline-ui-onboarding-package.md) before external artifact root |
| v002 batch failure | Wrong prompt (`v1`), empty `rankedRules`, thin fixtures — fix profile + bootstrap + fixture sync |
| Checkpoint | `batch-002` proves v001 + ranked rules; gaps → GitHub milestone + issues #7–#12 |
| Work log hygiene | This study log + plan packages in repo (not only Cursor Plan UI) |

---

## 2. Conversation — prompts & space

### Turn 1 — Copilot vs consolidated prompts

**You (raw):**

> i had a conversation with github copilot regarding this  
> what are your opinions?  
> @consolidated-prompts.json (1-641)

**Cursor (summary):** Compared Copilot’s “one master prompt” view with repo reality: `v1` / `v001` / `compact`, `rankedRules` only on v001, court-rules injected in code. Recommended keeping versioned prompts and contracts; optional later merge of v001 + compact for token control.

---

### Turn 2 — Space management & external folder

**You (raw):**

> what about the space management issue  
> anything else i should be aware of?  
> i think we shohuld also consider exports and document logging being in the repo itself, i think we can use a simple json to specify an a folder outside the work space for direct exporting outside the repo and into another space so only coding things can be here to save space  
> right? since its only meant for local machine running right now, something that would help me spicfy a path outside the repo and into another folder  
> and only keep here things meant to make the coding to keep being easier, what do you think?  
> and also an additional api port so we can easily connect all of that to a database instead of local later

**Cursor (summary):** Agreed with split: repo = code, contracts, golden, dev logs; external = batches, file-exchange, eval-bundles, exports. Proposed `local-artifacts.json` + resolver; partial env support already exists. Deferred second API port — use storage adapter + `DATABASE_URL` later, not a new port now. Flagged gitignore gap for file-exchange payloads.

**Build plan created (Cursor Plan, then repo):** [008 plan — external artifact root](./008_2026-05-24_plan_external-artifact-root-package.md)

---

## 3. Conversation — sequencing 007 vs artifacts

### Turn 3 — Pause implementation; check 007 branch

**You (raw):**

> wait hold on i think before we do this  
> can you check the branch plan/007 ui onboarding

**Cursor (summary):** Reported branch `plan/007-pipeline-ui-onboarding`: one commit = planning docs only; large WIP uncommitted (async batch, pipeline UI, golden v002, file-exchange clear).

---

### Turn 4 — Option A

**You (raw):**

> A

**Cursor (summary):** User chose **finish 007 first**, defer external artifact implementation. Produced commit/review plan for 007 WIP.

**Build plan:** [007 plan package](./007_2026-05-24_plan_pipeline-ui-onboarding-package.md) (already in repo); execution plan “Commit 007 branch WIP” in Cursor Plan mode.

---

### Turn 5 — Commit and review 007

**You (raw):**

> Commit and review plan/007-pipeline-ui-onboarding  
> Implement the plan as specified…

**Cursor (summary):** Fixed layer lint, gitignore, `test:ci` green, four commits, PR #6, dev-log 007. Merged 007 + golden v002 to `main` in a later session.

---

## 4. Conversation — rule authority failure & fix

### Turn 6 — Batch run diagnosis

**You (raw):**

> No.  
> Based on this run, the pipeline **did not properly apply the part-rule / court-rule authority layer**.  
> … `ruleSourcesChecked: []`, `rankedRules: []`, `promptVersion: "v1"` …

**Cursor (summary):** Confirmed: run used legacy `v1` (no `{{rankedRules}}`), `GOLDEN_CASE_ID` still `case_001`, only three thin fixtures, cold snapshot with no Queens/Part 10 for doc 1. Outlined fix: v002 profile, sync catalog → fixtures, bootstrap snapshot, `minSourceDocNo` for case orders.

---

### Turn 7 — Implement fix

**You (raw):**

> do the fix

**Cursor (summary):** Implemented stabilization (`resolveCaseFilingProfile`, `catalogToRuleFixtures`, `goldenCaseBootstrap`, `uploadBatch` + `ruleMatch` changes, nine fixture JSON files, tests). User restarted servers with `GOLDEN_CASE_ID=case_001_rule_authority_v002`; **batch-002** validated v001 + ranked rules.

**Runtime evidence (post-plan):** [checkpoint 008](../checkpoints/008_2026-05-24_rule-authority-v002_runtime-checkpoint.md)

---

## 5. Conversation — roadmap & execution

### Turn 8 — What was the plan before the stability patch?

**You (raw):**

> what was our plan before this stability patch?

**Cursor (summary):** Clarified: deferred plan was **external artifact root**; active plan was **007**; stabilization was a reactive sidetrack after batch failure.

---

### Turn 9 — Confirm deferred plan (external artifact)

**You (raw):**

> no i think it was this  
> External artifact root and repo space policy  
> … *(pasted full plan)*

**Cursor (summary):** Confirmed user was right; restored external-artifact plan as Phase B; 007 + stabilization as prerequisite.

---

### Turn 10 — Full roadmap (checkpoint + artifacts)

**You (raw):**

> also i think you should do this too  
> 1. Merge the current rule-authority v002 stabilization work to main.  
> 2. Create milestone: Rule Authority v002 Runtime Checkpoint  
> 3. Open tickets: …  
> 4. Add checkpoint log: batch-002 proves…

**Cursor (summary):** Expanded plan: Phase A (merge, milestone, six issues, checkpoint log) then Phase B (artifact resolver). Executed on `main`.

**Build plan:** [008 plan — repo roadmap (v002 checkpoint + artifacts)](./008_2026-05-24_plan_repo-roadmap-v002-and-artifacts-package.md)

---

### Turn 11 — Work log gap

**You (raw):**

> question, where is the conversation with sumemrized conversation…  
> i believe it was supposed to go in work log before carrying out any build plan

**Cursor (summary):** Explained gap: conversation lived in Cursor/transcript and Plan UI; repo had checkpoint + code but no **008 study-log**. User asked to fix.

**This file** is that fix.

---

## Artifacts produced

| Artifact | Path | Role |
|----------|------|------|
| Study log (this file) | `work-log/study-docs/008_…_study-log_….md` | Raw you + summarized Cursor |
| External artifact plan | [008_2026-05-24_plan_external-artifact-root-package.md](./008_2026-05-24_plan_external-artifact-root-package.md) | Build plan — disk layout |
| Repo roadmap plan | [008_2026-05-24_plan_repo-roadmap-v002-and-artifacts-package.md](./008_2026-05-24_plan_repo-roadmap-v002-and-artifacts-package.md) | Build plan — Phase A + B |
| Planning manifests | `work-log/planning/*.json` | `npm run plan:finalize` |
| Runtime checkpoint | [checkpoints/008_…](../checkpoints/008_2026-05-24_rule-authority-v002_runtime-checkpoint.md) | batch-002 evidence (not conversation) |
| Prior program | [007 plan](./007_2026-05-24_plan_pipeline-ui-onboarding-package.md) | Pipeline UI (implemented) |
| Git | `main` @ `6ea2100` | Implementation |

---

*End of study log 008*
