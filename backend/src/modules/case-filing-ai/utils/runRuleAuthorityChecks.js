import { authorityRank } from "../../court-rules/contracts/ruleAuthority.contract.js";

const NOI_PATTERNS = [/notice of intention/i, /\bNOI\b/i];

/**
 * Structural authority checks (no LLM). Returns failure objects for eval reports.
 *
 * @param {Object} params
 * @param {Record<string, unknown>} [params.actualDoc]
 * @param {Record<string, unknown>} [params.snapshot]
 * @param {import("../../court-rules/services/ruleStore.service.js").RuleSourceRecord[]} [params.rankedRules]
 * @param {number} [params.docIndex]
 */
export function runRuleAuthorityChecks({
  actualDoc = {},
  snapshot = {},
  rankedRules = [],
  docIndex = 0
}) {
  const failures = [];
  const tasks = [
    ...(Array.isArray(actualDoc.tasks) ? actualDoc.tasks : []),
    ...(Array.isArray(actualDoc.deadlines) ? actualDoc.deadlines : [])
  ];

  for (const task of tasks) {
    const auth = task?.sourceAuthority ?? task?.authority;
    const rank = task?.authorityRank ?? (auth ? authorityRank(auth) : null);
    const superseded = task?.supersedes;

    if (auth && rank != null && rank <= 0) {
      failures.push({
        code: "unknown_authority",
        message: `Task uses unknown authority: ${auth}`,
        taskId: task.taskId ?? null
      });
    }

    if (superseded && rank != null) {
      const supersededRank =
        typeof superseded === "object" && superseded.authorityRank != null
          ? superseded.authorityRank
          : authorityRank(superseded.authority ?? superseded);
      if (supersededRank > rank && !task.supersededByLaterOrder) {
        failures.push({
          code: "invalid_supersession",
          message: "Lower-authority task claims to supersede higher-authority source",
          taskId: task.taskId ?? null
        });
      }
    }
  }

  if (docIndex === 13) {
    const generalOnly = tasks.filter((t) => {
      const isNoi = NOI_PATTERNS.some((p) =>
        p.test(String(t.taskDescription ?? t.taskType ?? t.type ?? ""))
      );
      if (!isNoi) return false;
      const auth = String(t.sourceAuthority ?? t.authority ?? "");
      return (
        !auth ||
        /cplr|uniform|county|general/i.test(auth) &&
          !/case_specific|later_case_specific|judge_part|earlier_case_specific/i.test(auth)
      );
    });
    if (generalOnly.length) {
      failures.push({
        code: "doc13_noi_guardrail",
        message: "Document 13 must not create NOI-style tasks from general rules alone"
      });
    }
  }

  const partRules = rankedRules.filter((r) => r.authority === "part");
  const countyRules = rankedRules.filter((r) => r.authority === "county");
  if (partRules.length && countyRules.length) {
    const partMax = Math.max(...partRules.map((r) => authorityRank(r.authority)));
    const countyMax = Math.max(...countyRules.map((r) => authorityRank(r.authority)));
    if (partMax < countyMax) {
      failures.push({
        code: "part_vs_county_rank",
        message: "Part rules should outrank county rules when both are in the ranked set"
      });
    }
  }

  return failures;
}
