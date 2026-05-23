# Planning study log

Append a **planning-only** study log entry under `work-log/study-docs/`.

## Rules

1. **No sensitive content** — fixtures, APIs, folder layout, architecture only. No party names or filing text.
2. **User messages** — verbatim in blockquotes under `### {UTC} · You`.
3. **Assistant** — short bullet summary under `### {UTC} · Cursor`.
4. **Filename** — `work-log/study-docs/{NNN}_{YYYY-MM-DD}_{HH-MM}_study-log_{slug}.md` using UTC from `formatWorkLogTimestamp` in `backend/src/shared/utils/formatExchangeTimestamp.js`.
5. **Append vs new file** — append to the latest log for the same program id if under ~400 lines; otherwise create a new file with `Continues from: [previous](./previous.md)`.
6. **Index** — add a row to `work-log/INDEX.md` when creating a new file.
7. **Scope** — default planning-only unless the user says to include implementation.

## Steps

1. Read the current conversation turns since the last logged entry (or the whole session if new).
2. Determine program id (e.g. `006`) and slug from the topic.
3. Write or append turns with ISO-8601 UTC timestamps per turn.
4. Confirm the file path in your reply.

## Optional tags on user turns

- `Program` — pipeline / feature scope (v2)
- `Architecture` — layout / contracts (v3)
