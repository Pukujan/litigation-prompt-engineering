/** Map golden catalog sourceAuthority → ruleAuthority.contract keys. */
export const SOURCE_AUTHORITY_TO_RULE_AUTHORITY = {
  cplr_or_statute: "cplr",
  uniform_rule: "uniform",
  county_or_court_rule: "county",
  judge_part_rule: "part",
  case_specific_order: "case_order",
  later_case_specific_order: "later_case_order"
};

/**
 * @param {string} partName
 * @returns {string | null}
 */
export function extractPartNumber(partName) {
  const text = String(partName ?? "");
  const match = text.match(/Part\s*(\d+)/i);
  return match ? match[1] : null;
}

/**
 * @param {unknown} sourceDocNo
 * @returns {number | null}
 */
export function minSourceDocNoFromCatalog(sourceDocNo) {
  if (sourceDocNo == null) return null;
  if (Array.isArray(sourceDocNo)) {
    const nums = sourceDocNo.map(Number).filter((n) => !Number.isNaN(n));
    return nums.length ? Math.min(...nums) : null;
  }
  const n = Number(sourceDocNo);
  return Number.isNaN(n) ? null : n;
}

/**
 * @param {Record<string, unknown>} entry
 * @param {{ county?: string, part?: string, court?: string }} [caseIdentity]
 * @returns {Record<string, unknown>}
 */
export function catalogEntryToRuleFixture(entry, caseIdentity = {}) {
  const ruleId = String(entry.ruleId ?? "");
  const authority =
    SOURCE_AUTHORITY_TO_RULE_AUTHORITY[entry.sourceAuthority] ?? "unknown";

  const lines = [
    entry.sourceName,
    ...(Array.isArray(entry.controls) ? entry.controls.map((c) => `- ${c}`) : []),
    entry.applicationRule ? `Application: ${entry.applicationRule}` : "",
    Array.isArray(entry.mustNotUseFor) && entry.mustNotUseFor.length
      ? `Must not use for: ${entry.mustNotUseFor.join("; ")}`
      : ""
  ].filter(Boolean);

  const fixture = {
    ruleId,
    authority,
    title: String(entry.sourceName ?? ruleId),
    text: lines.join("\n"),
    county: null,
    part: null,
    court: "Supreme",
    phase: null,
    documentTypes: [],
    tags: [],
    minSourceDocNo: minSourceDocNoFromCatalog(entry.sourceDocNo)
  };

  const isQueensScoped =
    ruleId.includes("queens") ||
    ruleId.includes("kerrigan") ||
    authority === "county" ||
    authority === "part" ||
    authority === "case_order" ||
    authority === "later_case_order";

  if (isQueensScoped && caseIdentity.county) {
    fixture.county = caseIdentity.county;
  }
  if (
    (ruleId.includes("part_10") || ruleId.includes("kerrigan") || authority === "part") &&
    (caseIdentity.part || extractPartNumber(caseIdentity.partName))
  ) {
    fixture.part = caseIdentity.part ?? extractPartNumber(caseIdentity.partName);
  }
  if (caseIdentity.court) {
    fixture.court = caseIdentity.court.includes("Supreme") ? "Supreme" : caseIdentity.court;
  }

  return fixture;
}

/**
 * @param {Record<string, unknown>[]} catalog
 * @param {{ county?: string, part?: string, partName?: string, court?: string }} [caseIdentity]
 */
export function catalogToRuleFixtures(catalog, caseIdentity = {}) {
  const part =
    caseIdentity.part ?? extractPartNumber(caseIdentity.partName) ?? null;
  const identity = { ...caseIdentity, part };

  return catalog.map((entry) => catalogEntryToRuleFixture(entry, identity));
}
