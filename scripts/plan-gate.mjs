#!/usr/bin/env node
import { access, readdir, readFile } from "fs/promises";
import { join } from "path";

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

const studyDir = join(repoRoot, "work-log/study-docs");
const entries = await readdir(studyDir);
const design = entries.find((f) => f.includes(slug) && f.includes("_design_"));
const planPkg = entries.find((f) => f.includes(slug) && f.includes("_plan_"));

if (!design) errors.push(`Missing design MD in work-log/study-docs for slug ${slug}`);
if (!planPkg) errors.push(`Missing plan package MD in work-log/study-docs for slug ${slug}`);

const manifestPath = join(repoRoot, "work-log/planning", `${planId}.json`);
try {
  const raw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw);
  if (manifest.status !== "approved") {
    errors.push(`Manifest status is ${manifest.status}, expected approved`);
  }
} catch {
  errors.push(`Missing manifest work-log/planning/${planId}.json — run npm run plan:finalize`);
}

if (errors.length) {
  console.error("Plan gate FAILED:\n", errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

console.log(`Plan gate passed for ${planId} (${slug})`);
