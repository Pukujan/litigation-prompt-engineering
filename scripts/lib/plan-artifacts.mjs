import { readdir } from "fs/promises";
import { join } from "path";

/**
 * Resolve planning artifact paths under work-log/study-docs for a slug.
 * @param {string} studyDocsDir absolute path
 * @param {string} slug
 */
export async function resolvePlanArtifacts(studyDocsDir, slug) {
  const entries = await readdir(studyDocsDir);
  const studyLog = entries.find(
    (f) => f.includes(slug) && f.includes("_study-log_") && f.endsWith(".md")
  );
  const design = entries.find(
    (f) => f.includes(slug) && f.includes("_design_") && f.endsWith(".md")
  );
  const planPkg = entries.find(
    (f) => f.includes(slug) && f.includes("_plan_") && f.endsWith(".md")
  );
  return { studyLog, design, planPkg };
}

export function artifactPaths(repoRoot, files) {
  const base = "work-log/study-docs";
  return {
    studyLogMd: files.studyLog ? join(base, files.studyLog) : null,
    designMd: files.design ? join(base, files.design) : null,
    planPackageMd: files.planPkg ? join(base, files.planPkg) : null
  };
}
