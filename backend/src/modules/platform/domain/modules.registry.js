export const PLATFORM_MODULES = [
  {
    id: "part-rules",
    displayName: "Part rules",
    icon: "clipboard",
    description: "Optional judge/part practice text from upload or inference from early filings.",
    liveBatch: true
  },
  {
    id: "parse",
    displayName: "Parse & text",
    icon: "document",
    description: "PDF text extraction, OCR when needed, parsed-document cache.",
    liveBatch: true
  },
  {
    id: "court-rules",
    displayName: "Court rules",
    icon: "scale",
    description: "Match and rank court rule fixtures for the case context.",
    liveBatch: true
  },
  {
    id: "master-prompt",
    displayName: "Extraction (LLM)",
    icon: "sparkles",
    description: "Master prompt extracts metadata, parties, tasks, deadlines, and review items.",
    liveBatch: true
  },
  {
    id: "snapshot",
    displayName: "Case snapshot",
    icon: "layers",
    description: "Merge each document result into the rolling case snapshot.",
    liveBatch: true
  },
  {
    id: "eval",
    displayName: "Golden eval",
    icon: "badge-check",
    description: "Compare outputs against evals/golden expected JSON after each document.",
    liveBatch: true
  },
  {
    id: "case-workflow",
    displayName: "Case workflow",
    icon: "flow",
    description: "Snapshot enrichment and conflict detection (catalog step).",
    liveBatch: false
  },
  {
    id: "task-docketing",
    displayName: "Task docketing",
    icon: "calendar",
    description: "Task and deadline generation module (catalog step).",
    liveBatch: false
  },
  {
    id: "human-review",
    displayName: "Human review",
    icon: "person",
    description: "Human review queue items (catalog step).",
    liveBatch: false
  }
];
