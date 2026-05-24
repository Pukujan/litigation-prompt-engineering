#!/usr/bin/env node
/**
 * Sync evals/golden/.../rule_sources_catalog.json → data/court-rules/fixtures/{caseId}/
 * Usage: node scripts/sync-court-rules-fixtures.mjs [goldenCaseId]
 */
import { mkdir, readFile, writeFile, readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { catalogToRuleFixtures } from "../backend/src/modules/court-rules/utils/catalogToRuleFixtures.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const goldenCaseId = process.argv[2] || "case_001_rule_authority_v002";

async function main() {
  const goldenDir = join(repoRoot, "evals/golden", goldenCaseId);
  const catalogPath = join(goldenDir, "rule_sources_catalog.json");
  const manifestFiles = (await readdir(goldenDir)).filter((f) =>
    f.endsWith(".golden-dataset.json")
  );
  const manifest = JSON.parse(
    await readFile(join(goldenDir, manifestFiles[0] ?? ""), "utf8").catch(() => "{}")
  );
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  const caseIdentity = manifest.caseIdentity ?? {};

  const fixtures = catalogToRuleFixtures(catalog, {
    county: caseIdentity.county,
    partName: caseIdentity.partName,
    court: caseIdentity.court
  });

  const outDir = join(repoRoot, "data/court-rules/fixtures", goldenCaseId);
  await mkdir(outDir, { recursive: true });

  for (const fixture of fixtures) {
    const fileName = `${fixture.ruleId}.json`;
    await writeFile(join(outDir, fileName), `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
  }

  console.log(`Wrote ${fixtures.length} rule fixtures → data/court-rules/fixtures/${goldenCaseId}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
