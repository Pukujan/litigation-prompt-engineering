# Module Boundaries

| Module | Owns | Does not own |
|---|---|---|
| `case-filing-ai` | intake, OCR decision, classification, extraction, docket event extraction | final workflow truth, rule database, approvals |
| `filing-text-vault` | text versions, OCR text, AI parsed text, human reviewed text, audit logs | legal task generation |
| `case-workflow` | canonical case, lookup, phase, snapshots, conflicts | OCR or raw extraction |
| `court-rules` | statewide/county/judge/part/case-type/firm rules | document parsing |
| `task-docketing` | tasks, deadlines, risk alerts, supersession | raw text storage |
| `human-review` | OCR/handwriting/visual review and approvals | normal AI extraction review |
| `filing-pipeline` | execution order and module coordination | domain logic |

Core rule:

```text
Modules own domain logic.
Pipeline owns execution order.
```
