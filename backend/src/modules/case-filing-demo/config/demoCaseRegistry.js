/**
 * Demo case registry — cached golden (Case 001) vs import-only (Case 002+).
 */
export const DEMO_CASES = [
  {
    id: "case_001_rule_authority_v002",
    label: "Case 001",
    mode: "cached",
    goldenCaseId: "case_001_rule_authority_v002",
    demoBatchId: "demo-case-001-cached",
    snapshotCheckpoints: [1, 2, 4, 8, 12, 14],
    fixtureDirParts: [
      "backend",
      "src",
      "modules",
      "case-filing-ai",
      "tests",
      "fixtures",
      "rule-authority-v002"
    ],
    importPackageNames: ["synthetic_case_001_pdf_files"],
    ruleFixturesCaseId: "case_001_rule_authority_v002"
  },
  {
    id: "case_002_queens_catapano_fox_v002",
    label: "Case 002",
    mode: "cached",
    goldenCaseId: "case_002_queens_catapano_fox_v002",
    demoBatchId: "demo-case-002-cached",
    snapshotCheckpoints: [1, 2, 4, 8, 12, 14, 18, 21],
    fixtureDirParts: [
      "backend",
      "src",
      "modules",
      "case-filing-ai",
      "tests",
      "fixtures",
      "queens-catapano-fox-v002"
    ],
    importPackageNames: ["synthetic_queens_catapano_fox_case_v002"],
    ruleFixturesCaseId: "case_002_queens_catapano_fox_v002",
    importStamp: "2026-05-24_17-42-31Z"
  }
];

export const COMING_SOON_CASES = [
  {
    id: "case_003",
    label: "Case 003",
    title: "Labor and Employment Action",
    matterType: "employment_litigation",
    jurisdiction: "New York Supreme Court",
    status: "coming_soon",
    documentCount: 0,
    description: "Planned synthetic case for employment pleadings, notices, and compliance tasks."
  },
  {
    id: "case_004",
    label: "Case 004",
    title: "Premises Liability Discovery Track",
    matterType: "personal_injury",
    jurisdiction: "New York Supreme Court",
    status: "coming_soon",
    documentCount: 0,
    description: "Planned synthetic case for EBT scheduling, expert discovery, and NOI tracking."
  }
];

export function getDemoCase(caseId) {
  return DEMO_CASES.find((entry) => entry.id === caseId) ?? null;
}
