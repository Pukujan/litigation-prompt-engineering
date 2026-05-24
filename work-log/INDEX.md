# Work log — index

| ID | Date | Time | Kind | Path |
|----|------|------|------|------|
| 001 | 2026-05-23 | 04:00 | starter pack | [handoffs/001_2026-05-23_starter_case-filing-ai-updated/](./handoffs/001_2026-05-23_starter_case-filing-ai-updated/) |
| 001 | 2026-05-23 | 00:07 | blog (3 parts) | [study-docs/001_2026-05-23_00-07_blog_source-grounded-docketing/](./study-docs/001_2026-05-23_00-07_blog_source-grounded-docketing/) |
| 002 | 2026-05-23 | 00:42 | handoff | [handoffs/002_2026-05-23_00-42_handoff_second.md](./handoffs/002_2026-05-23_00-42_handoff_second.md) |
| 002 | 2026-05-23 | — | study log | [study-docs/002_2026-05-23_study-log_follow-up-before-handoff.md](./study-docs/002_2026-05-23_study-log_follow-up-before-handoff.md) |
| 003 | 2026-05-23 | — | study log | [study-docs/003_2026-05-23_study-log_case-filing-ai-planning.md](./study-docs/003_2026-05-23_study-log_case-filing-ai-planning.md) |
| 004 | 2026-05-23 | — | study log | [study-docs/004_2026-05-23_study-log_golden-dataset-eval-runner.md](./study-docs/004_2026-05-23_study-log_golden-dataset-eval-runner.md) |
| 005 | 2026-05-23 | 10:49 | handoff original | [handoffs/005_2026-05-23_10-49_handoff-original_parsed-cache-rule-authority.md](./handoffs/005_2026-05-23_10-49_handoff-original_parsed-cache-rule-authority.md) |
| 005 | 2026-05-23 | 10:50 | study log | [study-docs/005_2026-05-23_10-50_study-log_parsed-cache-rule-authority.md](./study-docs/005_2026-05-23_10-50_study-log_parsed-cache-rule-authority.md) |
| 005 | 2026-05-23 | 11:14 | handoff v2 | [handoffs/005_2026-05-23_11-14_handoff-v2_planned-review-in-cursor.md](./handoffs/005_2026-05-23_11-14_handoff-v2_planned-review-in-cursor.md) |
| 005 | 2026-05-23 | 11:20 | handoff v3 | [handoffs/005_2026-05-23_11-20_handoff-v3_filing-structure-architecture.md](./handoffs/005_2026-05-23_11-20_handoff-v3_filing-structure-architecture.md) |
| 006 | 2026-05-23 | 11:21 | study log | [study-docs/006_2026-05-23_11-21_study-log_cursor-planning-phase.md](./study-docs/006_2026-05-23_11-21_study-log_cursor-planning-phase.md) |
| 007 | 2026-05-24 | — | study log | [study-docs/007_2026-05-24_study-log_pipeline-ui-onboarding.md](./study-docs/007_2026-05-24_study-log_pipeline-ui-onboarding.md) |
| 007 | 2026-05-24 | — | design (planning) | [study-docs/007_2026-05-24_design_pipeline-ui-onboarding.md](./study-docs/007_2026-05-24_design_pipeline-ui-onboarding.md) |
| 007 | 2026-05-24 | — | plan package | [study-docs/007_2026-05-24_plan_pipeline-ui-onboarding-package.md](./study-docs/007_2026-05-24_plan_pipeline-ui-onboarding-package.md) |
| 007 | 2026-05-24 | — | planning manifest | [planning/007-pipeline-ui-onboarding.json](./planning/007-pipeline-ui-onboarding.json) |
| 008 | 2026-05-24 | — | study log | [study-docs/008_2026-05-24_study-log_external-artifact-and-v002-checkpoint.md](./study-docs/008_2026-05-24_study-log_external-artifact-and-v002-checkpoint.md) |
| 008 | 2026-05-24 | — | plan package | [study-docs/008_2026-05-24_plan_external-artifact-root-package.md](./study-docs/008_2026-05-24_plan_external-artifact-root-package.md) |
| 008 | 2026-05-24 | — | plan package (roadmap) | [study-docs/008_2026-05-24_plan_repo-roadmap-v002-and-artifacts-package.md](./study-docs/008_2026-05-24_plan_repo-roadmap-v002-and-artifacts-package.md) |
| 008 | 2026-05-24 | — | planning manifest (artifacts) | [planning/008-external-artifact-root.json](./planning/008-external-artifact-root.json) |
| 008 | 2026-05-24 | — | planning manifest (roadmap) | [planning/008-repo-roadmap-v002-and-artifacts.json](./planning/008-repo-roadmap-v002-and-artifacts.json) |
| 008 | 2026-05-24 | — | checkpoint (runtime) | [checkpoints/008_2026-05-24_rule-authority-v002_runtime-checkpoint.md](./checkpoints/008_2026-05-24_rule-authority-v002_runtime-checkpoint.md) |

**005 build order:** original (spec) → v3 (architecture) → v2 (pipeline).

---

## Dev logs

**Pre-push (current):** paired `human/*.md` + `agent/*.json` — `npm run dev-log:pre-push -- --slug <topic>`. See [dev-logs/README.md](./dev-logs/README.md).

| Entry | Date | Time | Human | Agent |
|-------|------|------|-------|-------|
| 005 | 2026-05-23 | 15:45 | [legacy](./dev-logs/005_2026-05-23_15-45_dev-log_preflight-and-v3-v2-foundation.md) | — |
| 005 | 2026-05-23 | 16:30 | [legacy](./dev-logs/005_2026-05-23_16-30_dev-log_v2-phases-3-7-complete.md) | — |
| 005 | 2026-05-23 | 17:05 | [legacy](./dev-logs/005_2026-05-23_17-05_dev-log_golden-parsed-and-handoff-closeout.md) | — |

### Pre-push pairs (human + agent)

| Entry | Date | Time | Human | Agent audit |
|-------|------|------|-------|-------------|
| 005 | 2026-05-23 | 16-54 | [human](./dev-logs/human/005_2026-05-23_16-54_dev-log_pre-push-dual-dev-log-system.md) | [agent](./dev-logs/agent/005_2026-05-23_16-54_dev-log-agent_pre-push-dual-dev-log-system.json) |
| 005 | 2026-05-23 | 16-57 | [human](./dev-logs/human/005_2026-05-23_16-57_dev-log_api-inventory-and-tree-ignores.md) | [agent](./dev-logs/agent/005_2026-05-23_16-57_dev-log-agent_api-inventory-and-tree-ignores.json) |
| 005 | 2026-05-23 | 16-59 | [human](./dev-logs/human/005_2026-05-23_16-59_dev-log_two-part-human-dev-log.md) | [agent](./dev-logs/agent/005_2026-05-23_16-59_dev-log-agent_two-part-human-dev-log.json) |
| 005 | 2026-05-23 | 17-00 | [human](./dev-logs/human/005_2026-05-23_17-00_dev-log_e2e-test.md) | [agent](./dev-logs/agent/005_2026-05-23_17-00_dev-log-agent_e2e-test.json) |
| 005 | 2026-05-23 | **17-36** | **[architecture CI / npm / README](./dev-logs/human/005_2026-05-23_17-36_dev-log_architecture-ci-npm-readme.md)** | **[agent](./dev-logs/agent/005_2026-05-23_17-36_dev-log-agent_architecture-ci-npm-readme.json)** |
| 007 | 2026-05-24 | 12-55 | [human](./dev-logs/human/007_2026-05-24_12-55_dev-log_pipeline-ui-onboarding.md) | [agent](./dev-logs/agent/007_2026-05-24_12-55_dev-log-agent_pipeline-ui-onboarding.json) |

Architecture narrative: [docs/DEVLOG_V2.md](../docs/DEVLOG_V2.md) · Platform gates: [docs/architecture/EVAL_AND_CI.md](../docs/architecture/EVAL_AND_CI.md).
