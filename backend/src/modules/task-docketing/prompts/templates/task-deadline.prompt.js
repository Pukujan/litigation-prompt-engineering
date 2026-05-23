export const id = "task-deadline";
export const version = "1.0.0";
export const variables = ["documentText", "ruleContext", "caseContext"];

export const template = `# Task and Deadline Prompt

Create tasks and deadlines only when supported by:
- explicit text in the current document
- a court order
- a demand
- a notice
- supplied judge/part/county rule
- approved deterministic calculation

Document text:
{{documentText}}

Rule context:
{{ruleContext}}

Case context:
{{caseContext}}

Every task must include:
- taskDescription
- responsibleParty
- dueDate or no_fixed_due_date
- triggerDocument
- sourcePage
- calculationMethod
- confidence
- status: ai_extracted_unreviewed | source_supported_auto_saved | conditional | needs_ocr_review | corrected_later | superseded

If the role is unclear, do not force it.

Use deposition_role_unknown, witness_role_unknown, needs_context, or conditional.

Do not label a deposition as plaintiff, defendant, or non-party unless the document clearly supports it.

Later documents may enrich or correct the role.`;
