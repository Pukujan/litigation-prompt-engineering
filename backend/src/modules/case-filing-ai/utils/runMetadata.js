import { resolvePromptVersion } from "../prompts/promptVersions.js";

export function buildRunMetadata({
  promptVersion,
  snapshotMergeMode,
  openRouterModel,
  masterPromptConfig = {}
}) {
  const spec = resolvePromptVersion(promptVersion);
  return {
    promptVersion: spec.id,
    promptTemplate: spec.masterCaseFiling,
    promptLabel: spec.label ?? spec.id,
    snapshotMergeMode: snapshotMergeMode ?? "legacy",
    openRouterModel: openRouterModel ?? null,
    masterPromptJsonRetry: masterPromptConfig.jsonRetry !== false,
    omitAuditNotesInPrompt: masterPromptConfig.omitAuditNotesInPrompt !== false
  };
}

export function runMetadataNote(runMetadata) {
  if (!runMetadata) return null;
  const model = runMetadata.openRouterModel ?? "unknown";
  return (
    `Eval run used master prompt ${runMetadata.promptVersion} ` +
    `(${runMetadata.promptTemplate}), merge=${runMetadata.snapshotMergeMode}, model=${model}`
  );
}

export function attachRunMetadataToReport(report, runMetadata) {
  if (!runMetadata) return report;
  report.runMetadata = runMetadata;
  const note = runMetadataNote(runMetadata);
  if (note && !report.notes.includes(note)) {
    report.notes.unshift(note);
  }
  return report;
}
