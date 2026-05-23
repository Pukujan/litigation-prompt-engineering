/** @readonly — higher number = more authoritative (case-specific beats general). */
export const RULE_AUTHORITY_RANK = {
  cplr: 40,
  uniform: 50,
  county: 60,
  judge: 70,
  part: 70,
  case_order: 90,
  later_case_order: 100,
  unknown: 0
};

export const RULE_AUTHORITY_VALUES = Object.keys(RULE_AUTHORITY_RANK);

/**
 * @param {string} authority
 * @returns {number}
 */
export function authorityRank(authority) {
  return RULE_AUTHORITY_RANK[authority] ?? 0;
}
