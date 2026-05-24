import { join } from "path";

/**
 * Resolve golden case, prompt, and court-rules fixture profile from env + case id.
 * @param {{ repoRoot: string, env?: Record<string, string | undefined> }} params
 */
export function resolveCaseFilingProfile({ repoRoot, env = process.env }) {
  const goldenCaseId = env.GOLDEN_CASE_ID || "case_001";
  const isRuleAuthorityV002 =
    goldenCaseId === "case_001_rule_authority_v002" ||
    goldenCaseId.includes("rule_authority_v002");

  const masterPromptVersion =
    env.MASTER_PROMPT_VERSION || (isRuleAuthorityV002 ? "v001" : "v1");

  const goldenDatasetDir =
    env.GOLDEN_DATASET_DIR || join(repoRoot, "evals/golden", goldenCaseId);

  const ruleFixturesCaseId =
    env.RULE_FIXTURES_CASE_ID ||
    (isRuleAuthorityV002 ? "case_001_rule_authority_v002" : "case_001");

  const ruleSetVersion =
    env.RULE_SET_VERSION ||
    (isRuleAuthorityV002 ? "queens_kerrigan_medmal_rules_v001" : "fixtures-v0");

  return {
    goldenCaseId,
    goldenDatasetDir,
    masterPromptVersion,
    ruleFixturesCaseId,
    ruleSetVersion,
    isRuleAuthorityV002
  };
}
