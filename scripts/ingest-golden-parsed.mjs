#!/usr/bin/env node
/**
 * Copy synthetic parsed cache from file-exchange import → evals/golden/case_001/parsed/
 * Usage: node scripts/ingest-golden-parsed.mjs [sourceParsedRoot]
 */
import { cp, mkdir, access, readdir, readFile, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { resolveImportStamp, importDirForStamp } from "./resolve-import-stamp.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const defaultImportStamp = "2026-05-23_15-59-43Z";
const defaultParsedRel =
  "synthetic_case_001_parsed_documents_cache/data/case-filing-ai/batches/synthetic-batch-001/parsed-documents";
const targetRoot = join(repoRoot, "evals/golden/case_001/parsed");

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function ingestDoc(sourceRoot, docKey) {
  const srcDir = join(sourceRoot, docKey);
  if (!(await exists(srcDir))) return false;

  const destDir = join(targetRoot, docKey);
  await mkdir(destDir, { recursive: true });

  const textFiles = [
    "final-parsed-text.txt",
    "embedded-text.txt",
    "ocr-text.txt",
    "human-reviewed-text.txt"
  ];
  for (const name of textFiles) {
    const src = join(srcDir, name);
    if (await exists(src)) {
      await cp(src, join(destDir, name));
    }
  }

  for (const [srcName, destName] of [
    ["extraction-quality.json", "extraction-quality.expected.json"],
    ["parse-metadata.json", "parse-metadata.expected.json"],
    ["page-map.json", "page-map.expected.json"]
  ]) {
    const src = join(srcDir, srcName);
    if (await exists(src)) {
      await cp(src, join(destDir, destName));
    }
  }

  const eqPath = join(srcDir, "extraction-quality.json");
  if (await exists(eqPath)) {
    const eq = JSON.parse(await readFile(eqPath, "utf8"));
    const reviewExpected = {
      status: eq.reviewStatus ?? "ai_extracted_unreviewed",
      preferredSource: eq.ocr_used ? "ocr" : "embedded",
      synthetic: eq.synthetic === true,
      note: eq.note ?? null
    };
    await writeFile(
      join(destDir, "review-status.expected.json"),
      JSON.stringify(reviewExpected, null, 2)
    );
  }

  return true;
}

async function main() {
  const sourceRoot = process.argv[2]
    ? join(process.cwd(), process.argv[2])
    : join(
        importDirForStamp(await resolveImportStamp(defaultImportStamp)),
        defaultParsedRel
      );

  if (!(await exists(sourceRoot))) {
    console.error("Source parsed-documents folder not found:", sourceRoot);
    console.error("Import bundle to file-exchange first, or pass a path argument.");
    process.exit(1);
  }

  await mkdir(targetRoot, { recursive: true });
  const entries = await readdir(sourceRoot);
  const docKeys = entries.filter((e) => e.startsWith("doc-")).sort();
  let count = 0;
  for (const docKey of docKeys) {
    if (await ingestDoc(sourceRoot, docKey)) count += 1;
  }

  console.log(`Ingested ${count} golden parsed folders → ${targetRoot}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
