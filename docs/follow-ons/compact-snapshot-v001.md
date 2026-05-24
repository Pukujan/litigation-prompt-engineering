# Follow-on: v001 + compact snapshot rules (token space)

**Status:** deferred  
**Tracking:** [GitHub #10 — snapshot merge alignment](https://github.com/Pukujan/litigation-prompt-engineering/issues/10)

## Problem

`v001` master prompt injects full `priorCaseSnapshot` each document. On 14+ document batches, token use grows without bound.

## Direction

- Add compact snapshot prompt variant (`MASTER_PROMPT_VERSION=compact` or `v2`) with structured merge (`getSnapshotMergeMode`).
- Cap `auditNotes`, `carriedForwardContext`, and redundant party lists in prompt preparation (`prepareSnapshotForPrompt`).
- Align rolling snapshot with v002 golden checkpoints (`after_doc_*`).

## Not in scope

Filesystem layout — see `local-artifacts.json` / `resolveArtifactPaths()` for disk space.
