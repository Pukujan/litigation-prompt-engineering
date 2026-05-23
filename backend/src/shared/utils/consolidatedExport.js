import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

/** Consolidated deliverables live directly under file-exchange/exports/. */
export const CONSOLIDATED_EXPORT_DIR = "file-exchange/exports";

export const CONSOLIDATED_FILENAMES = {
  models: "consolidated-models.json",
  prompts: "consolidated-prompts.json",
  fileStructure: "consolidated-file-structure.json"
};

/**
 * Write a consolidated JSON artifact to file-exchange/exports/.
 * @param {string} repoRoot
 * @param {string} filename
 * @param {string} jsonText
 * @returns {Promise<string>} absolute path written
 */
export async function writeConsolidatedExport(repoRoot, filename, jsonText) {
  const dest = join(repoRoot, CONSOLIDATED_EXPORT_DIR, filename);
  await mkdir(join(repoRoot, CONSOLIDATED_EXPORT_DIR), { recursive: true });
  await writeFile(dest, jsonText, "utf8");
  return dest;
}

/** @deprecated use writeConsolidatedExport */
export async function mirrorConsolidatedExport(repoRoot, filename, jsonText) {
  return writeConsolidatedExport(repoRoot, filename, jsonText);
}
