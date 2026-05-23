# Legal Prmpt Eng (v2)

A **scalable modular monolith** boilerplate: strict feature-module boundaries, internal MVC layers, prompts/evals for AI workflows, and automated architecture lint. Built for platforms that should grow toward services **without** a rewrite.

Domain-agnostic — use it for legal tech, ops, marketplaces, or any multi-feature product. (This repo started as a litigation workflow; the architecture is not limited to that.)

> **v1 (minimal)** — branch [`main`](https://github.com/Pukujan/litigation-workflow-application/tree/main). **v2 (platform)** — this branch + npm CLI.

**Documentation:** [docs/README.md](./docs/README.md) · [**HTTP APIs**](./docs/API.md) · [DEVLOG v2](./docs/DEVLOG_V2.md) · [guardrails](./docs/architecture/ARCHITECTURE_GUARDRAILS.md) · [internal contract](./docs/architecture/MODULE_INTERNAL_CONTRACT.md)

**Repository:** [github.com/Pukujan/litigation-workflow-application](https://github.com/Pukujan/litigation-workflow-application)

## What is included

- Backend module auto-loader + frontend route discovery
- **Inter-module** guardrails (no cross-feature imports; event bus + HTTP)
- **Intra-module** contract (routes → services → repositories / domain / adapters)
- Prompts + evals colocated per feature module
- `lint:architecture`, `npm test`, `npm run test:evals`
- `_reference` example module (documentation only; not loaded at runtime)

## Create a new project (npm CLI)

```bash
npm create @pukujan/modular-monolith@2 my-platform
cd my-platform
cd backend && npm install && cd ../frontend && npm install
```

Publish first: `@pukujan/create-modular-monolith` — see [docs/PUBLISHING.md](./docs/PUBLISHING.md).

Local (without publish):

```bash
node packages/create-modular-monolith/bin/create-modular-monolith.js ../my-platform
```

## Repo structure

```text
legal-prmpt-eng/
├── backend/src/{core,shared,modules}/
├── frontend/src/{core,shared,modules}/
├── docs/architecture/
├── scripts/new-module.mjs
└── packages/create-modular-monolith/   # npm CLI
```

## Run locally (this repo)

```bash
cd backend && npm install && npm run dev
# other terminal:
cd frontend && npm install && npm run dev
```

## Create your first module

```bash
npm run new:module -- billing --label "Billing"
```

Restart backend; refresh frontend.

## Architecture checks

```bash
npm run lint:architecture
npm test
npm run test:evals
```

See `backend/src/modules/_reference/` for the full internal layout.
