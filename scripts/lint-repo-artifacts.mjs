#!/usr/bin/env node
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const requiredPaths = [
  "docs/architecture/CONTRACTS_OVERVIEW.md",
  "docs/architecture/REPO_ARTIFACT_LAYOUT.md",
  "docs/architecture/contracts/manifest.json",
  "docs/architecture/contracts/changelog.jsonl",
  "docs/architecture/contracts/fileExchange.contract.md",
  "docs/architecture/contracts/consolidatedExports.contract.md",
  "docs/architecture/contracts/prePushDevLog.contract.md",
  "docs/architecture/contracts/apiDocumentationRegistry.contract.md",
  "backend/src/shared/contracts/prePushDevLog.contract.js",
  "backend/src/shared/contracts/consolidatedExports.contract.js",
  "work-log/dev-logs/schemas/dev-log-agent.v1.schema.json",
  "work-log/dev-logs/human",
  "work-log/dev-logs/agent",
  "file-exchange/README.md",
  "file-exchange/imports",
  "file-exchange/exports",
  "evals/golden/case_001/case_001.golden-dataset.json",
  "evals/golden/case_001_rule_authority_v002/case_001_rule_authority_v002.golden-dataset.json",
  "evals/golden/case_001_rule_authority_v002/rule_sources_catalog.json",
  "docs/case-filing-ai/STORAGE.md",
  "docs/API.md",
  "backend/src/modules/case-filing-ai/contracts/storageLayout.contract.js",
  "backend/src/modules/case-filing-ai/utils/storagePaths.js",
  "data/court-rules/fixtures/case_001"
];

const failures = requiredPaths.filter((rel) => !existsSync(join(repoRoot, rel)));

if (failures.length) {
  console.error("Repo artifact lint failed — missing:\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}

console.log(`Repo artifact lint OK (${requiredPaths.length} paths)`);
