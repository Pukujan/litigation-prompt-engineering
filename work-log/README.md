# Work log

Planning artifacts for this repo: **what to build** (handoffs) and **how we decided** (study docs).

```text
work-log/
  README.md       ← you are here
  INDEX.md        ← full index (handoffs + study-docs + dev-logs)
  handoffs/       ← numbered specs, starter packs (002, 005, …)
  study-docs/     ← study logs, planning notes, blog drafts
  dev-logs/       ← pre-push audit: human/ + agent/ (paired per push)
```

## When to use which folder

| Folder | Put here |
|--------|----------|
| **handoffs/** | Implementation specs, second/third handoffs, starter pack snapshots |
| **study-docs/** | Conversation study logs, design rationale, portfolio / recruiter logs |
| **dev-logs/** | What shipped — **paired human MD + agent JSON** before each push |

## Filename convention (all three folders)

```text
{NNN}_{YYYY-MM-DD}_{HH-MM}_{kind}_{short-slug}.md
```

| Folder | `kind` value | Example |
|--------|----------------|---------|
| handoffs/ | `handoff`, `handoff-v2`, `handoff-original`, … | `005_2026-05-23_10-49_handoff-original_…` |
| study-docs/ | `study-log` | `006_2026-05-23_11-21_study-log_cursor-planning-phase` |
| dev-logs/ | `dev-log` (fixed) | `001_2026-05-24_14-30_dev-log_work-log-reorg` |

Details: [handoffs/README.md](./handoffs/README.md) · [study-docs/README.md](./study-docs/README.md) · [dev-logs/README.md](./dev-logs/README.md)

## 005 program order

1. Original spec → [handoffs/005_…_handoff-original_…](./handoffs/005_2026-05-23_10-49_handoff-original_parsed-cache-rule-authority.md)
2. v3 architecture → [handoffs/005_…_handoff-v3_…](./handoffs/005_2026-05-23_11-20_handoff-v3_filing-structure-architecture.md)
3. v2 pipeline → [handoffs/005_…_handoff-v2_…](./handoffs/005_2026-05-23_11-14_handoff-v2_planned-review-in-cursor.md)
