export const PLANNING_PHASE_VERSION = "v001";
export const PLANNING_DIR = "work-log/planning";

export const PLANNING_STATUSES = ["draft", "approved", "executing", "done"];

export function requiredStudyDocPatterns(slug) {
  return ["studyLog", "design", "plan"];
}

export function planningManifestFilename(planId) {
  return `${planId}.json`;
}
