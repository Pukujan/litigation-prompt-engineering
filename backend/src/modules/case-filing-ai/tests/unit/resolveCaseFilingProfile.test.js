import test from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { resolveCaseFilingProfile } from "../../utils/resolveCaseFilingProfile.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../../../../..");

test("resolveCaseFilingProfile defaults v001 for rule authority v002", () => {
  const profile = resolveCaseFilingProfile({
    repoRoot,
    env: { GOLDEN_CASE_ID: "case_001_rule_authority_v002" }
  });
  assert.equal(profile.masterPromptVersion, "v001");
  assert.equal(profile.ruleFixturesCaseId, "case_001_rule_authority_v002");
  assert.match(profile.goldenDatasetDir, /case_001_rule_authority_v002$/);
});

test("resolveCaseFilingProfile keeps v1 for legacy case_001", () => {
  const profile = resolveCaseFilingProfile({
    repoRoot,
    env: { GOLDEN_CASE_ID: "case_001" }
  });
  assert.equal(profile.masterPromptVersion, "v1");
  assert.equal(profile.ruleFixturesCaseId, "case_001");
});
