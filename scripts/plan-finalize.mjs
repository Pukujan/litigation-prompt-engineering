#!/usr/bin/env node
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

const repoRoot = join(import.meta.dirname, "..");
const slug = process.argv.find((a) => a.startsWith("--slug="))?.split("=")[1]
  ?? process.argv[process.argv.indexOf("--slug") + 1];

if (!slug) {
  console.error("Usage: npm run plan:finalize -- --slug <plan-slug> [--plan-id <id>]");
  process.exit(1);
}

const planId =
  process.argv.find((a) => a.startsWith("--plan-id="))?.split("=")[1]
  ?? process.argv[process.argv.indexOf("--plan-id") + 1]
  ?? slug;

const manifest = {
  planId,
  slug,
  status: "approved",
  finalizedAt: new Date().toISOString(),
  artifacts: {
    designMd: `work-log/study-docs (files matching *_design_${slug}.md)`,
    planPackageMd: `work-log/study-docs (files matching *_plan_${slug}*.md)`
  }
};

const dir = join(repoRoot, "work-log/planning");
await mkdir(dir, { recursive: true });
await writeFile(join(dir, `${planId}.json`), JSON.stringify(manifest, null, 2));
console.log(`Wrote work-log/planning/${planId}.json`);
