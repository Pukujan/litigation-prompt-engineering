# Architecture export templates

**Source files** for `npm run export:architecture-starter` (not copied into the generated scaffold).

Used to patch the npm starter (`create-modular-monolith`) with platform-only prompts, model condenser, API inventory, README, and LICENSE without litigation domain leakage.

| File | Role |
|------|------|
| `package.starter.json` | Root `package.json` for exported scaffold |
| `README.starter.md` | Scaffold README |
| `AGENTS.starter.md` | Scaffold `AGENTS.md` |
| `condense-prompts.starter.mjs` | Generic prompt condenser |
| `modelCondenser.service.starter.js` | Platform-only model inventory |
| `api-inventory.starter.mjs` | API registry without domain imports |

**Generated export output** (gitignored): `file-exchange/exports/architecture-starter/`  
**Publish target:** `create-modular-monolith/template/` via `--to /absolute/path`
