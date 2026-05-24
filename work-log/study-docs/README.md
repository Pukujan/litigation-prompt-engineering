# Study docs

Design rationale, planning conversations, and portfolio study logs. Parent: [work-log](../README.md).

Implementation specs are in **[../handoffs/](../handoffs/)**.

## Planning trio (before build)

For each program tier, commit **in this order** before implementation:

1. **Study log** — `*_study-log_{slug}.md` — your messages verbatim + Cursor summaries ([planning-study-log](../../.cursor/commands/planning-study-log.md))
2. **Design** (optional) — `*_design_{slug}.md`
3. **Plan package** — `*_plan_{slug}*.md`
4. **Manifest** — `npm run plan:finalize -- --slug {slug} --plan-id {NNN}-{slug}` → `work-log/planning/{planId}.json`

Gate: `npm run plan:gate -- --slug {slug} --plan-id {planId}`

Reference: program **008** (full audit) · program **007** (retroactive study log after build).

## Filename convention

Same as [handoffs](../handoffs/README.md) and [dev-logs](../dev-logs/README.md):

`{NNN}_{YYYY-MM-DD}_{HH-MM}_study-log_{slug}.md`

Full index: [../INDEX.md](../INDEX.md).
