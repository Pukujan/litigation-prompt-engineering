import { readFile, readdir, writeFile, access, mkdir } from "fs/promises";
import { join } from "path";
import { AppError } from "../../../shared/http/errors.js";
import { PLANNING_DIR, PLANNING_STATUSES } from "../../../shared/contracts/planningPhase.contract.js";

export function createPlanningService({ repoRoot }) {
  const studyDocsDir = join(repoRoot, "work-log/study-docs");
  const planningDir = join(repoRoot, PLANNING_DIR);

  async function listPlans() {
    try {
      const files = await readdir(planningDir);
      const manifests = [];
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        const raw = await readFile(join(planningDir, file), "utf8");
        manifests.push(JSON.parse(raw));
      }
      return manifests;
    } catch {
      return [];
    }
  }

  async function readManifest(planId) {
    const path = join(planningDir, `${planId}.json`);
    try {
      const raw = await readFile(path, "utf8");
      return JSON.parse(raw);
    } catch {
      throw new AppError(`Planning manifest not found: ${planId}`, 404);
    }
  }

  async function findStudyDocs(slug) {
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

  async function finalizePlan({ planId, slug, status = "approved" }) {
    if (!PLANNING_STATUSES.includes(status)) {
      throw new AppError(`Invalid status: ${status}`, 400);
    }
    const { studyLog, design, planPkg } = await findStudyDocs(slug);
    const missing = [];
    if (!studyLog) missing.push("studyLog");
    if (!planPkg) missing.push("plan");
    if (missing.length) {
      throw new AppError(
        `Missing planning artifacts for slug ${slug}: ${missing.join(", ")}`,
        400
      );
    }

    await mkdir(planningDir, { recursive: true });
    const manifest = {
      planId,
      slug,
      status,
      finalizedAt: new Date().toISOString(),
      artifacts: {
        studyLogMd: join("work-log/study-docs", studyLog),
        planPackageMd: join("work-log/study-docs", planPkg),
        ...(design ? { designMd: join("work-log/study-docs", design) } : {})
      }
    };
    await writeFile(join(planningDir, `${planId}.json`), JSON.stringify(manifest, null, 2));
    return manifest;
  }

  async function buildDownloadMarkdown(planId) {
    const manifest = await readManifest(planId);
    const planPkg = await readFile(join(repoRoot, manifest.artifacts.planPackageMd), "utf8");
    let studyLog = "";
    if (manifest.artifacts.studyLogMd) {
      studyLog = await readFile(join(repoRoot, manifest.artifacts.studyLogMd), "utf8");
    }
    let design = "";
    if (manifest.artifacts.designMd) {
      design = await readFile(join(repoRoot, manifest.artifacts.designMd), "utf8");
    }
    const sections = [
      `# Planning package: ${planId}`,
      "",
      "| Field | Value |",
      "|-------|--------|",
      `| **Status** | ${manifest.status} |`,
      `| **Slug** | ${manifest.slug} |`,
      `| **Finalized** | ${manifest.finalizedAt} |`,
      ""
    ];
    if (studyLog) {
      sections.push("---", "", "## Study log", "", studyLog, "");
    }
    if (design) {
      sections.push("---", "", "## Design", "", design, "");
    }
    sections.push("---", "", "## Plan package", "", planPkg);
    return sections.join("\n");
  }

  return {
    listPlans,
    readManifest,
    finalizePlan,
    buildDownloadMarkdown
  };
}
