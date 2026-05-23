export const SINGLE_DOCUMENT_PIPELINE_STEPS = [
  { step: 1, name: "document-intake", owner: "case-filing-ai" },
  { step: 2, name: "text-quality-check", owner: "case-filing-ai" },
  { step: 3, name: "embedded-text-extraction", owner: "case-filing-ai" },
  { step: 4, name: "ocr-if-needed", owner: "case-filing-ai" },
  { step: 5, name: "save-text-versions", owner: "filing-text-vault" },
  { step: 6, name: "document-classification", owner: "case-filing-ai" },
  { step: 7, name: "fact-extraction", owner: "case-filing-ai" },
  { step: 8, name: "compare-against-snapshot", owner: "case-workflow" },
  { step: 9, name: "enrich-partial-models", owner: "case-workflow" },
  { step: 10, name: "detect-conflicts", owner: "case-workflow" },
  { step: 11, name: "docket-entry-extraction", owner: "case-filing-ai" },
  { step: 12, name: "rule-retrieval", owner: "court-rules" },
  { step: 13, name: "task-deadline-generation", owner: "task-docketing" },
  { step: 14, name: "human-review-item-creation", owner: "human-review" },
  { step: 15, name: "save-ai-parsed-unreviewed", owner: "filing-text-vault" },
  { step: 16, name: "update-case-state-snapshot", owner: "case-workflow" }
];

export const PIPELINE_PRINCIPLE =
  "Prior context may guide interpretation. Only the current source document can confirm new facts.";
