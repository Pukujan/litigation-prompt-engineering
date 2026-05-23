# Dev logs

Session **what we shipped** notes — written **before each push** as a paired human + agent audit.

## Two types (required before push)

| Type | Folder | Format | Audience |
|------|--------|--------|----------|
| **Human** | `human/` | Markdown (narrative, tables) | You, reviewers, GitHub |
| **Agent audit** | `agent/` | JSON (`dev-log-agent.v1`) | Cursor / automation — fast structured read |

Same timestamp prefix on both files so they stay paired:

```text
005_2026-05-23_17-30_dev-log_consolidated-exports.md          ← human/
005_2026-05-23_17-30_dev-log-agent_consolidated-exports.json  ← agent/
```

## Pre-push workflow

```bash
# 1. Generate pair (git + npm test + full repo tree auto-filled)
npm run dev-log:pre-push -- --slug <kebab-topic> --program 005

# 2. Fill FILL sections in agent JSON, then human markdown

# 3. Optional: block push if no agent log for HEAD
npm run dev-log:pre-push -- --check
```

Cursor: use command **Pre-push dev log** (`.cursor/commands/pre-push-dev-log.md`).

### Human log (two-part markdown)

Each `human/*.md` file has:

**Part I — Summary** (read first): table of contents, mermaid diagrams (HTTP modules, pipeline versions, pre-push flow), audit tables for APIs, prompt/version contracts, tests, git, condensed repo tree.

**Part II — Detailed**: goals, decisions, changes, iterations, full API registry, full git snapshot, full repository tree.

Generator: `scripts/lib/dev-log-human-format.mjs`

### Agent log schema

`schemas/dev-log-agent.v1.schema.json` — machine-readable:

- `meta`, `summary`, `apis` (HTTP active/stub/deprecated, versioned contracts, CLI), `git`, `tests`, `repositoryTree`
- `changes`, `decisions[]`, `iterations[]`
- `tradeoffs`, `improvements`, `regressions`, `risks`, `followUps`

Agents should read the **JSON** first when resuming work; humans read **markdown**.

## vs other work-log folders

| Folder | Audience | Content |
|--------|----------|---------|
| **handoffs/** | Implementers | Spec — what to build |
| **study-docs/** | You + recruiters | Why — planning conversation |
| **dev-logs/** | You + agents + reviewers | What landed — audit per push |

## vs `docs/DEVLOG_V2.md`

| Location | Use |
|----------|-----|
| [docs/DEVLOG_V2.md](../../docs/DEVLOG_V2.md) | Long-lived architecture narrative |
| **dev-logs/** | Incremental per-push audit entries |

## Legacy entries

Older single-file logs at `dev-logs/*.md` (repo root of this folder) predate the human/agent split. New entries go only under `human/` and `agent/`.

## Filename convention

```text
{NNN}_{YYYY-MM-DD}_{HH-MM}_dev-log_{slug}.md           → human/
{NNN}_{YYYY-MM-DD}_{HH-MM}_dev-log-agent_{slug}.json    → agent/
```

| Part | Meaning |
|------|---------|
| `NNN` | Program id (`005`) or global sequence (`001`) |
| `YYYY-MM-DD` | Session date |
| `HH-MM` | Finish time (24h) |
| `slug` | Kebab-case topic |

## Git hook (optional)

```bash
cp scripts/git-hooks/pre-push.sample .git/hooks/pre-push
chmod +x .git/hooks/pre-push
```

Reminds you to run `dev-log:pre-push`; use `--check` to enforce agent log for current `HEAD`.

## GitHub

Track in git. No secrets, credentials, or real filing text. Update [../INDEX.md](../INDEX.md) after each pair.
