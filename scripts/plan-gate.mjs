#!/usr/bin/env node
import { access, readFile } from "fs/promises";
import { join } from "path";
import { artifactPaths, resolvePlanArtifacts } from "./lib/plan-artifacts.mjs";

const repoRoot = join(import.meta.dirname, "..");
const slug = process.argv.find((a) => a.startsWith("--slug="))?.split("=")[1]
  ?? process.argv[process.argv.indexOf("--slug") + 1];

if (!slug) {
  console.error("Usage: npm run plan:gate -- --slug <plan-slug> [--plan-id <id>]");
  process.exit(1);
}

const planId =
  process.argv.find((a) => a.startsWith("--plan-id="))?.split("=")[1]
  ?? process.argv[process.argv.indexOf("--plan-id") + 1]
  ?? slug;

const errors = [];

async function fileExists(relPath) {
  try {
    await access(join(repoRoot, relPath));
    return true;
  } catch {
    return false;
  }
}

const manifestPath = join(repoRoot, "work-log/planning", `${planId}.json`);
let manifest;
try {
  const raw = await readFile(manifestPath, "utf8");
  manifest = JSON.parse(raw);
} catch {
  errors.push(`Missing manifest work-log/planning/${planId}.json — run npm run plan:finalize`);
}

if (manifest) {
  if (manifest.status !== "approved") {
    errors.push(`Manifest status is ${manifest.status}, expected approved`);
  }
  if (!manifest.artifacts?.studyLogMd) {
    errors.push("Manifest missing artifacts.studyLogMd — re-run npm run plan:finalize");
  } else if (!(await fileExists(manifest.artifacts.studyLogMd))) {
    errors.push(`Study log not found: ${manifest.artifacts.studyLogMd}`);
  }
  if (!manifest.artifacts?.planPackageMd) {
    errors.push("Manifest missing artifacts.planPackageMd");
  } else if (!(await fileExists(manifest.artifacts.planPackageMd))) {
    errors.push(`Plan package not found: ${manifest.artifacts.planPackageMd}`);
  }
  if (manifest.artifacts?.designMd && !(await fileExists(manifest.artifacts.designMd))) {
    errors.push(`Design MD not found: ${manifest.artifacts.designMd}`);
  }
} else {
  const studyDocsDir = join(repoRoot, "work-log/study-docs");
  const files = await resolvePlanArtifacts(studyDocsDir, slug);
  const paths = artifactPaths(repoRoot, files);
  if (!paths.studyLogMd) errors.push(`Missing study log in work-log/study-docs for slug ${slug}`);
  if (!paths.planPackageMd) errors.push(`Missing plan package MD in work-log/study-docs for slug ${slug}`);
}

if (errors.length) {
  console.error("Plan gate FAILED:\n", errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

console.log(`Plan gate passed for ${planId} (${slug})`);
