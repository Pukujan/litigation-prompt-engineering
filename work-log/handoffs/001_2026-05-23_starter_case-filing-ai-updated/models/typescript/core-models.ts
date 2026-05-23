export type ReviewStatus = "unreviewed" | "partially_reviewed" | "reviewed" | "rejected";
export type WorkflowStatus = "ai_extracted_unreviewed" | "source_supported_auto_saved" | "conditional" | "needs_ocr_review" | "corrected_later" | "superseded" | "human_verified";

export interface CaseModel {
  caseId: string;
  county: string | null;
  court: string | null;
  indexNumber: string | null;
  caseName: string | null;
  caseType: string | null;
  judgeName: string | null;
  partName: string | null;
  currentPhase: string | null;
  currentMiniPhase: string | null;
  confidence: "high" | "medium" | "low";
}

export interface DocumentModel {
  documentId: string;
  caseId: string;
  nyscefDocNo: number | null;
  title: string | null;
  documentType: string | null;
  filedDateTime: string | null;
  filedBy: string | null;
  sourceFileName: string;
  pageCount: number | null;
  extractionStatus: string;
  textReviewStatus: ReviewStatus;
}

export interface DocumentTextVersionModel {
  id: string;
  caseId: string;
  documentId: string;
  versionType: "embedded_text" | "ocr_text" | "ai_parsed_text" | "human_reviewed_text";
  textContent?: string;
  structuredJson?: unknown;
  extractionMethod: "pdf_text" | "ocr" | "llm" | "human_review";
  reviewStatus: ReviewStatus;
  createdBy: "system" | "ai" | "human";
  createdAt: string;
}

export interface TaskModel {
  taskId: string;
  caseId: string;
  documentId?: string;
  taskDescription: string;
  taskType: string;
  responsibleParty: string | null;
  dueDate: string | null;
  dueDateStatus: "fixed" | "calculated" | "no_fixed_due_date" | "needs_review";
  status: WorkflowStatus;
  sourcePage?: number;
  confidence: "high" | "medium" | "low";
  docketingNote?: string;
}

export interface HumanReviewItemModel {
  itemId: string;
  caseId: string;
  documentId: string;
  pageNumber: number;
  location: string;
  issue: string;
  reason: string;
  suggestedAction: string;
  cropFilePath?: string;
  blocking: boolean;
  status: "pending" | "reviewed" | "resolved";
}

export interface CaseStateSnapshotModel {
  snapshotId: string;
  caseId: string;
  afterDocNo: number | null;
  currentPhase: string | null;
  currentMiniPhase: string | null;
  confirmedFacts: unknown[];
  carriedForwardContext: unknown[];
  openTasks: TaskModel[];
  completedTasks: TaskModel[];
  conditionalTasks: TaskModel[];
  unresolvedHumanReviewItems: HumanReviewItemModel[];
  conflicts: unknown[];
  auditNotes: string[];
  createdAt: string;
}
