#!/usr/bin/env node
/**
 * Sync rule_sources_catalog.json from a file-exchange import package → data/court-rules/fixtures/{caseId}/
 * Usage: node scripts/sync-import-rule-catalog.mjs [importDir] [fixturesCaseId]
 */
import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { catalogToRuleFixtures } from "../backend/src/modules/court-rules/utils/catalogToRuleFixtures.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const AUTHORITY_MAP = {
  judge_medmal_part_rule: "judge_part_rule",
  queens_medmal_form_or_local_rule: "county_or_court_rule",
  uniform_civil_rule: "uniform_rule",
  nyscef_rule: "uniform_rule",
  cplr_or_statute: "cplr_or_statute",
  case_specific_order: "case_specific_order",
  later_case_specific_order: "later_case_specific_order"
};

function normalizeEntry(entry) {
  return {
    ruleId: entry.ruleId,
    sourceName: entry.sourceName ?? entry.ruleId,
    sourceAuthority: AUTHORITY_MAP[entry.authority] ?? entry.authority ?? "unknown",
    sourceDocNo: entry.sourceDocNo ?? entry.minSourceDocNo ?? null,
    controls: entry.controls,
    applicationRule: entry.applicationRule,
    mustNotUseFor: entry.mustNotUseFor
  };
}

function entriesFromImportCatalog(catalog) {
  const base = (catalog.ruleSources ?? []).map(normalizeEntry);
  const caseSpecific = catalog.caseSpecificRuleSourcePattern ?? {};

  for (const [ruleId, note] of Object.entries(caseSpecific)) {
    const match = String(note).match(/doc\s*(\d+)/i);
    const docNo = match ? Number(match[1]) : null;
    const isLater = ruleId.includes("later") || String(note).includes("later");
    base.push({
      ruleId,
      sourceName: ruleId.replace(/_/g, " "),
      sourceAuthority: isLater ? "later_case_specific_order" : "case_specific_order",
      sourceDocNo: docNo
    });
  }

  return base;
}

async function main() {
  const importDir =
    process.argv[2] ??
    join(
      repoRoot,
      "file-exchange/imports/2026-05-24_17-42-31Z/synthetic_queens_catapano_fox_case_v002"
    );
  const fixturesCaseId =
    process.argv[3] ?? "case_002_queens_catapano_fox_v002";

  const catalogPath = join(importDir, "rules/rule_sources_catalog.json");
  const manifestPath = join(importDir, "manifest.json");

  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const caseBlock = manifest.case ?? {};

  const entries = entriesFromImportCatalog(catalog);
  const fixtures = catalogToRuleFixtures(entries, {
    county: "Queens",
    partName: caseBlock.partName,
    court: caseBlock.court
  });

  const outDir = join(repoRoot, "data/court-rules/fixtures", fixturesCaseId);
  await mkdir(outDir, { recursive: true });

  for (const fixture of fixtures) {
    await writeFile(
      join(outDir, `${fixture.ruleId}.json`),
      `${JSON.stringify(fixture, null, 2)}\n`,
      "utf8"
    );
  }

  console.log(`Synced ${fixtures.length} rule fixtures → data/court-rules/fixtures/${fixturesCaseId}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
