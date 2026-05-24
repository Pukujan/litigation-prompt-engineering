# Architecture push logs

Paired **human** + **agent** audit for syncing this repo’s architecture export to [@pukujan/create-modular-monolith](https://github.com/Pukujan/create-modular-monolith) and publishing npm.

**Not** the same as [pre-push dev logs](../dev-logs/README.md) (product/feature pushes).

## Workflow

1. Change starter sources: `file-exchange/exports/templates/`, `scripts/export-architecture-starter.mjs`, contracts.
2. Export: `npm run export:architecture-starter -- --to /path/to/create-modular-monolith/template`
3. Log: `npm run arch-log:push -- --slug <topic> [--npm-version x.y.z]`
4. Fill FILL sections in the new pair under `human/` and `agent/`.
5. Commit product repo log + push create-modular-monolith + `npm publish`.
6. Verify: `npm run arch-log:verify`

## Paths

| Audience | Directory | Filename pattern |
|----------|-----------|------------------|
| Human | `human/` | `{NNN}_{date}_{time}_arch-push_{slug}.md` |
| Agent | `agent/` | `{NNN}_{date}_{time}_arch-push-agent_{slug}.json` |

Headers use **long-form UTC** (e.g. `Sunday, 24 May 2026, 14:53 UTC`) via `formatHumanReadableUtc`.

## Contract

[architecturePushDevLog.contract.md](../../docs/architecture/contracts/architecturePushDevLog.contract.md)
