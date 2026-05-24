import { normalizedEquals } from "./evalNormalize.js";

function fieldResult(field, expected, actual, pass, note) {
  return { field, expected, actual, pass, note: note ?? null };
}

export function compareExtractionQuality(actual, expected, fieldResults) {
  const exp = expected.expectedExtractionQuality;
  if (!exp) return 1;

  const act =
    actual.extractionQuality ??
    actual.documentMetadata?.extractionQuality ??
    {};

  let hits = 0;
  let total = 0;

  for (const key of ["method", "ocr_needed", "reviewStatus"]) {
    if (exp[key] == null) continue;
    total += 1;
    const pass =
      typeof exp[key] === "boolean"
        ? exp[key] === act[key]
        : normalizedEquals(exp[key], act[key]);
    fieldResults.push(fieldResult(`expectedExtractionQuality.${key}`, exp[key], act[key], pass));
    if (pass) hits += 1;
  }

  return total ? hits / total : 1;
}

export function compareRuleSourcesApplied(actual, expected, fieldResults) {
  const expectedIds = expected.expectedRuleSourcesApplied ?? [];
  if (!expectedIds.length) return 1;

  const actualIds = [
    ...(actual.ruleSourcesApplied ?? []),
    ...(actual.ruleSourcesChecked ?? [])
  ].map(String);

  let hits = 0;
  for (const id of expectedIds) {
    const pass = actualIds.some((a) => normalizedEquals(a, id));
    fieldResults.push(
      fieldResult(`expectedRuleSourcesApplied.${id}`, id, actualIds, pass)
    );
    if (pass) hits += 1;
  }
  return hits / expectedIds.length;
}

export function compareRuleAuthorityBehavior(actual, expected, fieldResults) {
  const behavior = expected.expectedRuleAuthorityBehavior;
  if (!behavior) return 1;

  const tasks = [...(actual.tasks ?? []), ...(actual.deadlines ?? [])];
  let score = 1;

  if (behavior.mustIncludeSourceAuthorityOnFinalDeadlines) {
    const finals = tasks.filter(
      (t) =>
        t?.dueDateStatus === "fixed" ||
        (t?.status && /source_supported|auto_saved/i.test(String(t.status)))
    );
    const missing = finals.filter((t) => !t?.sourceAuthority && !t?.authority);
    const pass = missing.length === 0;
    fieldResults.push(
      fieldResult(
        "expectedRuleAuthorityBehavior.mustIncludeSourceAuthorityOnFinalDeadlines",
        true,
        missing.map((t) => t.taskType ?? t.type),
        pass,
        pass ? null : "final tasks missing sourceAuthority"
      )
    );
    if (!pass) score = 0;
  }

  return score;
}

const PIPELINE_KEY_MAP = {
  parserVersion: "parser",
  ocrVersion: "ocr",
  masterPromptVersion: "masterPrompt",
  ruleMatchPromptVersion: "rulePrompt",
  snapshotPromptVersion: "snapshotPrompt",
  ruleSetVersion: "ruleSet",
  goldenDatasetVersion: "goldenDataset"
};

export function comparePipelineVersions(actualVersions, expectedVersions, fieldResults) {
  if (!expectedVersions || !actualVersions) return 1;

  let hits = 0;
  let total = 0;

  for (const [expectedKey, expectedVal] of Object.entries(expectedVersions)) {
    const actualKey = PIPELINE_KEY_MAP[expectedKey] ?? expectedKey;
    const actualVal = actualVersions[actualKey] ?? actualVersions[expectedKey];
    if (actualVal == null) continue;
    total += 1;
    const pass = normalizedEquals(expectedVal, actualVal);
    fieldResults.push(
      fieldResult(`pipelineVersions.${expectedKey}`, expectedVal, actualVal, pass)
    );
    if (pass) hits += 1;
  }

  return total ? hits / total : 1;
}

export function assertRuleCatalogCoversTopics(catalog) {
  const required = [
    "cplr_general_civil_practice",
    "uniform_rule_202_56_medmal",
    "queens_medmal_part_rules",
    "queens_medmal_pc_form",
    "queens_medmal_cc_form",
    "queens_compliance_part_rules",
    "queens_part_10_kerrigan_rules"
  ];
  const ids = new Set(catalog.map((r) => r.ruleId));
  const missing = required.filter((id) => !ids.has(id));
  return { ok: missing.length === 0, missing };
}
