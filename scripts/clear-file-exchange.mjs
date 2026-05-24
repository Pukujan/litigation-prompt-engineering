#!/usr/bin/env node
/**
 * Clear dated file-exchange import/export folders.
 *
 * Usage:
 *   npm run clear:file-exchange -- --dry-run
 *   npm run clear:file-exchange -- --confirm
 *   npm run clear:file-exchange -- --confirm --scope exports
 *   npm run clear:file-exchange -- --confirm --no-keep-consolidated
 */
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

function readFlag(name) {
  return args.includes(name);
}

function readOption(name) {
  const idx = args.indexOf(name);
  if (idx < 0 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

const scope = readOption("--scope") || "all";
const dryRun = readFlag("--dry-run");
const confirm = readFlag("--confirm");

if (!dryRun && !confirm) {
  console.error("Use --dry-run to preview or --confirm to delete.");
  process.exit(1);
}

const { clearFileExchange } = await import(
  "../backend/src/shared/utils/fileExchangeCleanup.js"
);

try {
  const result = await clearFileExchange({
    repoRoot,
    scope,
    dryRun,
    confirm,
    keepLatestConsolidated: !readFlag("--no-keep-consolidated"),
    keepTemplates: !readFlag("--no-keep-templates")
  });

  console.log(JSON.stringify(result, null, 2));
  if (result.dryRun) {
    console.log("\nRe-run with --confirm to remove listed paths.");
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
