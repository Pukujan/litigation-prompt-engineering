# Modular Monolith Platform

**Your scaffolded app** — Express + React modular monolith with architecture contracts, file-exchange, agent dev logs, and CI gates.

| | |
|---|---|
| **Architecture** | This repo layout and contracts |
| **npm package** | [@pukujan/create-modular-monolith](https://github.com/Pukujan/create-modular-monolith) |
| **Example product** | [litigation-prompt-engineering](https://github.com/Pukujan/litigation-prompt-engineering) (domain-filled reference) |

---

## Start here

| Doc | Purpose |
|-----|---------|
| [docs/architecture/PLATFORM_ARCHITECTURE.md](docs/architecture/PLATFORM_ARCHITECTURE.md) | How the platform works (agents + humans) |
| [docs/architecture/CONTRACTS_OVERVIEW.md](docs/architecture/CONTRACTS_OVERVIEW.md) | Contract manifest and enforcement |
| [docs/architecture/EVAL_AND_CI.md](docs/architecture/EVAL_AND_CI.md) | CI gates, evals, golden (per-case) |
| [AGENTS.md](AGENTS.md) | **Required for Cursor / automation** |
| [docs/README.md](docs/README.md) | Full documentation index |

---

## Quick start

**Requirements:** Node.js 20+

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

cd backend && npm install && npm run dev
# new terminal:
cd frontend && npm install && npm run dev
```

---

## Daily commands

```bash
npm run dev-log:pre-push -- --slug your-topic
npm run test:ci
npm run import:file-exchange -- "/path/to/bundle"
npm run condense:all
npm run new:module -- billing --label "Billing"
```

---

## License & attribution

Platform files from [@pukujan/create-modular-monolith](https://github.com/Pukujan/create-modular-monolith). See [LICENSE](LICENSE) and [NOTICE](NOTICE).
