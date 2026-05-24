#!/usr/bin/env node
/**
 * Copy an inbound bundle into file-exchange/imports/{UTC-stamp}/
 * Usage: node scripts/import-to-file-exchange.mjs /path/to/bundle [optional-stamp]
 */
import { cp, mkdir, access } from "fs/promises";
import { join, basename, dirname } from "path";
import { fileURLToPath } from "url";
import { formatExchangeTimestamp } from "../backend/src/shared/utils/formatExchangeTimestamp.js";
import { resolveArtifactPaths } from "../backend/src/shared/config/resolveArtifactPaths.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const source = process.argv[2];
  if (!source) {
    console.error("Usage: node scripts/import-to-file-exchange.mjs <sourceDirOrZipParent> [UTC-stamp]");
    process.exit(1);
  }

  const stamp = process.argv[3] || formatExchangeTimestamp();
  const { fileExchangeImports } = resolveArtifactPaths(repoRoot);
  const dest = join(fileExchangeImports, stamp);
  const absSource = join(process.cwd(), source);

  try {
    await access(absSource);
  } catch {
    console.error("Source not found:", absSource);
    process.exit(1);
  }

  await mkdir(dest, { recursive: true });
  const folderName = basename(absSource);
  const target = join(dest, folderName);
  await cp(absSource, target, { recursive: true });

  console.log(`Imported → ${dest}/${folderName}`);
  console.log(`Stamp: ${stamp} — use for ingest scripts or paths under this import folder.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
