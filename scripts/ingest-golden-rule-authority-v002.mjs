#!/usr/bin/env node
/**
 * Install rule-authority v002 golden bundle → evals/golden/case_001_rule_authority_v002/
 * Source: file-exchange/imports/evals/golden/synthetic_case_001_rule_authority_v002/
 */
import { readFile, writeFile, cp, mkdir, readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = join(
  repoRoot,
  "file-exchange/imports/evals/golden/synthetic_case_001_rule_authority_v002"
);
const TARGET_DIR = join(repoRoot, "evals/golden/case_001_rule_authority_v002");
const CASE_ID = "case_001_rule_authority_v002";
const SNAPSHOT_CHECKPOINTS = [1, 2, 4, 8, 12, 14];

async function copyGoldenBundle() {
  await mkdir(TARGET_DIR, { recursive: true });
  const entries = await readdir(SOURCE_DIR, { withFileTypes: true });
  for (const entry of entries) {
    const src = join(SOURCE_DIR, entry.name);
    const dest = join(TARGET_DIR, entry.name);
    await cp(src, dest, { recursive: true, force: true });
  }
}

function expectedToDocumentFixture(doc, pipelineVersions, catalog) {
  const ruleIds = doc.expectedRuleSourcesApplied ?? [];
  const rankedRules = catalog.filter((r) => ruleIds.includes(r.ruleId));

  return {
    docIndex: doc.docIndex,
    docKey: doc.docKey ?? `doc-${String(doc.docIndex).padStart(3, "0")}`,
    storedName: `${String(doc.docIndex).padStart(3, "0")}-fixture.pdf`,
    originalName: doc.expectedTitle ?? `doc-${doc.docIndex}`,
    fileKind: "pdf",
    docketEntry: {
      filingType: doc.expectedDocumentType,
      filingDate: doc.expectedFilingDate,
      nyscefDocNo: doc.expectedNyscefDocNo
    },
    documentMetadata: {
      title: doc.expectedTitle,
      pageCount: doc.expectedPageCount,
      extractionQuality: doc.expectedExtractionQuality
    },
    extractionQuality: doc.expectedExtractionQuality,
    parties: doc.expectedParties ?? [],
    tasks: doc.expectedTasks ?? [],
    deadlines: doc.expectedDeadlines ?? [],
    humanReviewItems: doc.expectedHumanReviewItems ?? [],
    ruleSourcesApplied: ruleIds,
    ruleSourcesChecked: ruleIds,
    rankedRules,
    pipelineVersions: {
      parser: pipelineVersions.parserVersion,
      ocr: pipelineVersions.ocrVersion,
      masterPrompt: pipelineVersions.masterPromptVersion,
      rulePrompt: pipelineVersions.ruleMatchPromptVersion,
      snapshotPrompt: pipelineVersions.snapshotPromptVersion,
      ruleSet: pipelineVersions.ruleSetVersion,
      goldenDataset: pipelineVersions.goldenDatasetVersion
    },
    runMetadata: {
      pipelineVersions: {
        parser: pipelineVersions.parserVersion,
        ocr: pipelineVersions.ocrVersion,
        masterPrompt: pipelineVersions.masterPromptVersion,
        goldenDataset: pipelineVersions.goldenDatasetVersion
      }
    }
  };
}

async function buildOfflineFixtures() {
  const manifestPath = join(TARGET_DIR, "case_001_rule_authority_v002.golden-dataset.json");
  const raw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw);
  const pipelineVersions = JSON.parse(
    await readFile(join(TARGET_DIR, "pipeline_versions.expected.json"), "utf8")
  );
  const catalog = JSON.parse(
    await readFile(join(TARGET_DIR, "rule_sources_catalog.json"), "utf8")
  );

  const fixturesRoot = join(
    repoRoot,
    "backend/src/modules/case-filing-ai/tests/fixtures/rule-authority-v002"
  );
  const outputsDir = join(fixturesRoot, "outputs");
  await mkdir(outputsDir, { recursive: true });

  for (const doc of manifest.documentExpectedOutputs ?? []) {
    const fixture = expectedToDocumentFixture(doc, pipelineVersions, catalog);
    const name = `doc-${String(doc.docIndex).padStart(3, "0")}.json`;
    await writeFile(join(outputsDir, name), JSON.stringify(fixture, null, 2));
  }

  const after14 = JSON.parse(
    await readFile(join(TARGET_DIR, "after_doc_014.expected.json"), "utf8")
  );
  await writeFile(join(fixturesRoot, "case-snapshot.json"), JSON.stringify(after14, null, 2));

  manifest.caseId = CASE_ID;
  manifest.snapshotCheckpoints = SNAPSHOT_CHECKPOINTS;
  manifest.documentCount = manifest.documentExpectedOutputs?.length ?? 14;
  manifest.ingestedTo = TARGET_DIR.replace(repoRoot + "/", "");
  manifest.offlineFixturesDir = "backend/src/modules/case-filing-ai/tests/fixtures/rule-authority-v002";
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
}

async function syncCourtRuleFixtures() {
  const { spawn } = await import("node:child_process");
  await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["scripts/sync-court-rules-fixtures.mjs", CASE_ID],
      { cwd: repoRoot, stdio: "inherit" }
    );
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`sync exited ${code}`))));
    child.on("error", reject);
  });
}

async function main() {
  await copyGoldenBundle();
  await buildOfflineFixtures();
  await syncCourtRuleFixtures();
  console.log(`Installed v002 golden dataset → ${TARGET_DIR}`);
  console.log(`Court rule fixtures → data/court-rules/fixtures/${CASE_ID}/`);
  console.log("Offline fixtures → backend/src/modules/case-filing-ai/tests/fixtures/rule-authority-v002/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
