/**
 * @param {import("./ruleStore.service.js").RuleSourceRecord} rule
 * @param {Object} context
 */
function scoreRule(rule, context) {
  let score = 0;
  const county = context.county?.trim();
  const part = context.part?.trim();
  const court = context.court?.trim();
  const phase = context.phase?.trim();
  const documentType = context.documentType?.trim();

  if (rule.county) {
    score += county && rule.county.toLowerCase() === county.toLowerCase() ? 4 : -2;
  }
  if (rule.part) {
    score += part && String(rule.part) === String(part) ? 5 : -2;
  }
  if (rule.court) {
    score += court && rule.court.toLowerCase() === court.toLowerCase() ? 2 : 0;
  }
  if (rule.phase) {
    score += phase && rule.phase.toLowerCase() === phase.toLowerCase() ? 3 : 0;
  }
  if (Array.isArray(rule.documentTypes) && rule.documentTypes.length > 0 && documentType) {
    const hit = rule.documentTypes.some(
      (t) => t.toLowerCase() === documentType.toLowerCase()
    );
    score += hit ? 3 : -1;
  }

  if (!rule.county && !rule.part && !rule.court && !rule.phase) {
    score += 1;
  }

  return score;
}

export function createRuleMatchService({ ruleStore }) {
  /**
   * @param {Object} params
   * @param {string} [params.caseId]
   * @param {Object} [params.context]
   * @param {number} [params.limit]
   */
  async function findApplicableRules({ caseId = "case_001", context = {}, limit = 5 }) {
    const all = await ruleStore.loadCaseRules(caseId);
    const scored = all
      .map((rule) => ({ rule, score: scoreRule(rule, context) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((entry) => entry.rule);
  }

  return { findApplicableRules, scoreRule };
}
