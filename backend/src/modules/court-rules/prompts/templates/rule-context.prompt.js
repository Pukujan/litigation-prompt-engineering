export const id = "rule-context";
export const version = "1.0.0";
export const variables = ["suppliedRules", "caseContext", "documentContext"];

export const template = `# Rule Context Prompt

Apply only the supplied rules for this run.

Supplied rules:
{{suppliedRules}}

Case context:
{{caseContext}}

Document context:
{{documentContext}}

Do not invent court practices.

If no applicable rule is supplied, return \`rule_context_missing\`.

If a rule may apply but judge/part/case type is not confirmed, mark the task as \`conditional_rule_based\`.

Rule priority:
1. Current court order text
2. Later court order over earlier court order
3. Judge/part rule
4. County rule
5. Court-wide rule
6. Firm/internal workflow rule

Return applicableRule, ruleSource, condition, affectedTaskOrDeadline, requiredHandling, confidence.`;
