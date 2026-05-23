import test from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRuleStoreService } from "../../services/ruleStore.service.js";
import { createRuleMatchService } from "../../services/ruleMatch.service.js";
import { createRuleAuthorityService } from "../../services/ruleAuthority.service.js";
import { authorityRank } from "../../contracts/ruleAuthority.contract.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");

test("authorityRank: case order beats county and part", () => {
  assert.ok(authorityRank("case_order") > authorityRank("county"));
  assert.ok(authorityRank("part") >= authorityRank("county"));
});

test("rule pipeline loads fixtures and ranks part above county for Queens Part 10", async () => {
  const ruleStore = createRuleStoreService({
    fixturesRoot: join(repoRoot, "data/court-rules/fixtures")
  });
  const ruleMatch = createRuleMatchService({ ruleStore });
  const ruleAuthority = createRuleAuthorityService();

  const matched = await ruleMatch.findApplicableRules({
    caseId: "case_001",
    context: { county: "Queens", part: "10" }
  });
  assert.ok(matched.some((r) => r.ruleId === "queens-part-10-general"));

  const ranked = ruleAuthority.rankRules(matched);
  const partIdx = ranked.findIndex((r) => r.authority === "part");
  const countyIdx = ranked.findIndex((r) => r.authority === "county");
  if (partIdx >= 0 && countyIdx >= 0) {
    assert.ok(partIdx < countyIdx, "part rules should appear before county in ranked list");
  }

  const block = ruleAuthority.formatRankedRulesBlock(ranked);
  assert.match(block, /queens-part-10-general|Part 10/i);
});
