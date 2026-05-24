# Checkpoint 008 — Rule Authority v002 Runtime (batch-002)

| Field | Value |
|-------|--------|
| **Entry** | 008 |
| **Date (UTC)** | 2026-05-24 |
| **Batch** | `batch-002` (14 documents, gitignored under `data/case-filing-ai/batches/batch-002/`) |
| **Milestone** | [Rule Authority v002 Runtime Checkpoint](https://github.com/Pukujan/litigation-prompt-engineering/milestone/3) |
| **Merged to main** | `83cabca` (Plan 007 + v002 stabilization) |
| **Planning audit** | [008 study log](../study-docs/008_2026-05-24_study-log_external-artifact-and-v002-checkpoint.md) (raw conversation + summarized Cursor + build plans) |

---

## Executive summary

`batch-002` is the first runtime proof that rule-authority v002 configuration works end-to-end: **v001** master prompt, **non-empty** `rankedRules` / `ruleSourcesChecked` on early docs, and **case-order rules gated by doc index** (no `doc_012_pc_order` on doc 1; present from doc 12 onward). Golden eval reports still show gaps (`pipelineVersions`, `ruleSources`, snapshot, metadata) — tracked as GitHub issues #7–#12. This checkpoint does **not** claim full golden parity.

---

## Environment

| Setting | Value |
|---------|--------|
| `GOLDEN_CASE_ID` | `case_001_rule_authority_v002` |
| Master prompt | `v001` (`v001_master-case-filing.prompt.md`) |
| Rule fixtures case | `case_001_rule_authority_v002` (9 catalog-synced JSON files) |
| `ruleSet` (runtime) | `queens_kerrigan_medmal_rules_v001` |
| Model | `qwen/qwen3-30b-a3b-04-28` |
| Part rule source | `none` (inferred from filings) |

---

## Batch metadata

| Field | Value |
|-------|--------|
| Batch ID | `batch-002` |
| Documents | 14 |
| Started (UTC) | `2026-05-24T13:37:21.793Z` (from `processing-log.jsonl`) |
| Batch trace | `batch_batch-002_3e985aaf0d47` |

---

## Checkpoint criteria

| Criterion | Result | Evidence |
|-----------|--------|----------|
| `promptVersion` / `masterPrompt` = **v001** | **Pass** | `outputs/doc-001.json` → `runMetadata.promptVersion: "v001"`, `pipelineVersions.masterPrompt: "v001"` |
| `rankedRules` non-empty on early docs | **Pass** | `doc-001` → 5 ranked rules including `queens_part_10_kerrigan_rules` |
| `ruleSourcesChecked` non-empty | **Pass** | `doc-001` → 5 rule IDs in `ruleSourcesChecked` |
| Case orders staged at docs **12–14** | **Pass** | `doc-001`: no `doc_012_pc_order`; `doc-012` / `doc-013` / `doc-014`: `doc_012_pc_order` and `doc_013_014_cc_order` in `ruleSourcesChecked` |
| Eval exposes remaining failures | **Pass** | 20 eval reports under `evals/`; weak dimensions listed below |

**Not claimed:** empty eval failures, `ruleSourcesApplied` on every doc, `pipelineVersions` golden match.

---

## Per-doc spot checks

### doc-001 (Summons / complaint)

- `promptVersion`: v001
- `ruleSourcesChecked`: `queens_part_10_kerrigan_rules`, Queens med-mal forms, compliance rules (no case orders)
- `rankedRules`: 5 entries, part rule ranked first among scoped rules

### doc-012 (PC order)

- `doc_012_pc_order` in `ruleSourcesChecked` and `rankedRules`
- Tasks reference `doc_012_pc_order` as `sourceAuthority` / `ruleSourceApplied`

### doc-014 (CC order / CPLR 3216)

- `doc_013_014_cc_order` and `doc_012_pc_order` both checked
- Supersession noted on tasks (`supersedes: doc_012_pc_order`)

---

## Eval failure inventory (representative)

Scores below 1.0 on selected dimensions (`data/case-filing-ai/batches/batch-002/evals/`).

| Report | Weak dimensions (score &lt; 1) |
|--------|--------------------------------|
| `doc_001` | `pipelineVersions` 0.14, `ruleSources` 0, `snapshot` 0, `metadata` 0.33, `parties` 0 |
| `doc_012` | `pipelineVersions` 0.14, `snapshot` 0, `tasks` 0, `deadlines` 0, `ruleSources` 0.8 |
| `doc_014` | `pipelineVersions` 0.14, `snapshot` 0, `documentIdentity` 0 |
| `after_doc_001` | `snapshot` 0.5, most content dimensions 0 |
| `after_doc_014` | `snapshot` 0.25 |

**Passing consistently:** `ruleAuthority`, `ruleAuthorityBehavior`, `parsedGolden`, `negativeGuardrails` (most docs).

---

## GitHub issues (follow-up)

| Issue | Title |
|-------|--------|
| [#7](https://github.com/Pukujan/litigation-prompt-engineering/issues/7) | Fix `pipelineVersions` mismatch against v002 golden baseline |
| [#8](https://github.com/Pukujan/litigation-prompt-engineering/issues/8) | Populate `ruleSourcesApplied` when ranked rules influence tasks/deadlines |
| [#9](https://github.com/Pukujan/litigation-prompt-engineering/issues/9) | Fix UI golden case label defaulting to `case_001` during v002 eval |
| [#10](https://github.com/Pukujan/litigation-prompt-engineering/issues/10) | Improve snapshot merge alignment with v002 expected snapshots |
| [#11](https://github.com/Pukujan/litigation-prompt-engineering/issues/11) | Review doc metadata/title/page-count mismatches in v002 golden eval |
| [#12](https://github.com/Pukujan/litigation-prompt-engineering/issues/12) | Confirm batch export package contains full artifact set |

---

## Next step

**Phase B:** External artifact root (`local-artifacts.json` + `resolveArtifactPaths`) — move batches, file-exchange, and export bundles outside the repo per [roadmap plan](https://github.com/Pukujan/litigation-prompt-engineering).
