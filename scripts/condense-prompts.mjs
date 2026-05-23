#!/usr/bin/env node
/**
 * Collect all versioned prompt templates into models/consolidated-prompts.json
 * Usage: node scripts/condense-prompts.mjs
 */
import { readFile, readdir, stat } from "fs/promises";
import { join, relative, dirname } from "path";
import { fileURLToPath } from "url";
import { writeConsolidatedArtifact } from "./consolidated-output.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const SCAN_ROOTS = [
  "backend/src/modules",
  "work-log/handoffs/001_2026-05-23_starter_case-filing-ai-updated/prompts"
];

const PROMPT_EXTENSIONS = [".prompt.md", ".prompt.js"];

function extractVariables(text) {
  const vars = new Set();
  const re = /\{\{(\w+)\}\}/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    vars.add(m[1]);
  }
  return [...vars].sort();
}

async function walk(dir, acc = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const ent of entries) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name.startsWith(".")) continue;
      await walk(full, acc);
    } else if (PROMPT_EXTENSIONS.some((ext) => ent.name.endsWith(ext))) {
      acc.push(full);
    }
  }
  return acc;
}

async function findManifests() {
  const manifests = {};
  async function scanManifests(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const full = join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === "node_modules" || ent.name.startsWith(".")) continue;
        await scanManifests(full);
      } else if (ent.name === "manifest.json" && full.includes("/prompts/")) {
        const rel = relative(repoRoot, full);
        try {
          manifests[rel] = JSON.parse(await readFile(full, "utf8"));
        } catch {
          /* skip */
        }
      }
    }
  }
  await scanManifests(join(repoRoot, "backend/src/modules"));
  return manifests;
}

async function loadCaseFilingVersions() {
  const path = join(
    repoRoot,
    "backend/src/modules/case-filing-ai/prompts/promptVersions.js"
  );
  const raw = await readFile(path, "utf8");
  const versions = {};
  const blockRe = /(\w+):\s*\{[^}]*id:\s*"([^"]+)"[^}]*masterCaseFiling:\s*"([^"]+)"[^}]*description:\s*"([^"]+)"/gs;
  let m;
  while ((m = blockRe.exec(raw)) !== null) {
    versions[m[2]] = {
      key: m[1],
      id: m[2],
      masterCaseFiling: m[3],
      description: m[4]
    };
  }
  return { sourcePath: relative(repoRoot, path), versions };
}

async function main() {
  const promptFiles = [];
  for (const root of SCAN_ROOTS) {
    const found = await walk(join(repoRoot, root));
    promptFiles.push(...found.filter((f) => !f.endsWith("manifest.json")));
  }

  promptFiles.sort();

  const inventory = [];
  const prompts = {};

  for (const abs of promptFiles) {
    const rel = relative(repoRoot, abs);
    const content = await readFile(abs, "utf8");
    const st = await stat(abs);
    const moduleMatch = rel.match(/^backend\/src\/modules\/([^/]+)/);
    const module = moduleMatch ? moduleMatch[1] : "starter-handoff";
    const id = rel
      .replace(/^backend\/src\/modules\/[^/]+\/prompts\//, "")
      .replace(/^work-log\/handoffs\/[^/]+\/prompts\//, "starter/")
      .replace(/[/.]/g, "_");

    const entry = {
      id,
      path: rel,
      module,
      fileName: abs.split("/").pop(),
      variables: extractVariables(content),
      byteLength: Buffer.byteLength(content, "utf8"),
      modifiedAt: st.mtime.toISOString()
    };
    inventory.push(entry);
    prompts[rel] = {
      ...entry,
      content
    };
  }

  const caseFilingVersions = await loadCaseFilingVersions();
  const moduleManifests = await findManifests();

  const doc = {
    meta: {
      generatedAt: new Date().toISOString(),
      repositoryRoot: repoRoot,
      condensedBy: "condense-prompts",
      description:
        "Consolidated prompt templates for legal-prmpt-eng (active + starter reference).",
      promptCount: inventory.length
    },
    caseFilingPromptVersions: caseFilingVersions,
    moduleManifests,
    inventory,
    prompts
  };

  const { exportPath, modelsPath } = await writeConsolidatedArtifact("prompts", doc);
  console.log(`Consolidated ${inventory.length} prompts → ${exportPath} (+ ${modelsPath})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
