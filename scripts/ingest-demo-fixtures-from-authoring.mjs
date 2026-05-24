#!/usr/bin/env node
/**
 * Copy golden authoring run outputs → demo offline fixtures for case-filing-demo replay.
 *
 * Usage:
 *   npm run ingest:demo-fixtures -- --case case_002_queens_catapano_fox_v002 --version synthetic_queens_tcf_001_rule_authority_v001
 */
import { readFile, writeFile, cp, mkdir, readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const opts = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--case") opts.caseId = argv[++i];
    else if (arg === "--version") opts.version = argv[++i];
    else if (arg === "--fixture-dir") opts.fixtureDir = argv[++i];
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv);
  if (!opts.caseId || !opts.version) {
    console.error("Required: --case <caseId> --version <goldenDatasetVersion>");
    process.exit(1);
  }

  const goldenDir = join(repoRoot, "evals/golden", opts.caseId);
  const stagingRunDir = join(
    repoRoot,
    "evals/golden-staging",
    opts.caseId,
    opts.version,
    "run"
  );
  const outputsDir = join(stagingRunDir, "outputs");
  const fixtureDir =
    opts.fixtureDir ??
    join(
      repoRoot,
      "backend/src/modules/case-filing-ai/tests/fixtures/queens-catapano-fox-v002"
    );

  const manifest = JSON.parse(
    await readFile(join(goldenDir, `${opts.caseId}.golden-dataset.json`), "utf8")
  );
  const snapshotCheckpoints =
    manifest.snapshotCheckpoints ?? [1, 2, 4, 8, 12, 14, 18, 21];

  await mkdir(join(fixtureDir, "outputs"), { recursive: true });

  const outputFiles = (await readdir(outputsDir))
    .filter((name) => name.endsWith(".json"))
    .sort();
  for (const file of outputFiles) {
    await cp(join(outputsDir, file), join(fixtureDir, "outputs", file));
  }

  const snapshotPath = join(stagingRunDir, "case-snapshot.json");
  try {
    await cp(snapshotPath, join(fixtureDir, "case-snapshot.json"));
  } catch {
    const lastCheckpoint = snapshotCheckpoints[snapshotCheckpoints.length - 1];
    const pad = String(lastCheckpoint).padStart(3, "0");
    await cp(
      join(goldenDir, `after_doc_${pad}.expected.json`),
      join(fixtureDir, "case-snapshot.json")
    );
  }

  const catalogSrc = join(
    repoRoot,
    "file-exchange/imports/2026-05-24_17-42-31Z/synthetic_queens_catapano_fox_case_v002/rules/rule_sources_catalog.json"
  );
  try {
    await cp(catalogSrc, join(goldenDir, "rule_sources_catalog.json"));
  } catch {
    console.warn("rule_sources_catalog.json not copied (import rules path missing)");
  }

  const meta = {
    caseId: opts.caseId,
    goldenDatasetVersion: opts.version,
    fixtureDir: fixtureDir.replace(repoRoot + "/", ""),
    documentCount: outputFiles.length,
    snapshotCheckpoints,
    ingestedAt: new Date().toISOString()
  };
  await writeFile(join(fixtureDir, "demo-fixture-manifest.json"), JSON.stringify(meta, null, 2));

  console.log(`Demo fixtures → ${fixtureDir}`);
  console.log(`  outputs: ${outputFiles.length} documents`);
  console.log(`  golden:  ${goldenDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
