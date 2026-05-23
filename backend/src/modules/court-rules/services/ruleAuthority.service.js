import { authorityRank } from "../contracts/ruleAuthority.contract.js";

export function createRuleAuthorityService() {
  /**
   * Higher rank number = more authoritative (see contract).
   * @param {import("./ruleStore.service.js").RuleSourceRecord[]} rules
   */
  function rankRules(rules) {
    return [...rules].sort((a, b) => {
      const rankDiff = authorityRank(b.authority) - authorityRank(a.authority);
      if (rankDiff !== 0) return rankDiff;
      return String(a.ruleId).localeCompare(String(b.ruleId));
    });
  }

  /**
   * Compact block for master prompt injection.
   * @param {import("./ruleStore.service.js").RuleSourceRecord[]} rules
   */
  function formatRankedRulesBlock(rules) {
    if (!rules?.length) {
      return "(none — apply only rules stated in the current document or supplied part-rule text)";
    }

    return rules
      .map((rule, index) => {
        const rank = authorityRank(rule.authority);
        return [
          `[${index + 1}] ${rule.title} (${rule.authority}, rank ${rank})`,
          `ruleId: ${rule.ruleId}`,
          rule.text
        ].join("\n");
      })
      .join("\n\n");
  }

  return { rankRules, formatRankedRulesBlock };
}
