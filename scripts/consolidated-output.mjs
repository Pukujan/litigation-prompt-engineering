import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  CONSOLIDATED_EXPORT_DIR,
  CONSOLIDATED_FILENAMES,
  writeConsolidatedExport
} from "../backend/src/shared/utils/consolidatedExport.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

export { CONSOLIDATED_EXPORT_DIR, CONSOLIDATED_FILENAMES };

/** Repo-relative paths: exports/ is primary; models/ mirrors for model-condenser API. */
export const CONSOLIDATED_ARTIFACTS = {
  models: {
    filename: CONSOLIDATED_FILENAMES.models,
    exportPath: `${CONSOLIDATED_EXPORT_DIR}/${CONSOLIDATED_FILENAMES.models}`,
    modelsPath: `models/${CONSOLIDATED_FILENAMES.models}`
  },
  prompts: {
    filename: CONSOLIDATED_FILENAMES.prompts,
    exportPath: `${CONSOLIDATED_EXPORT_DIR}/${CONSOLIDATED_FILENAMES.prompts}`,
    modelsPath: `models/${CONSOLIDATED_FILENAMES.prompts}`
  },
  fileStructure: {
    filename: CONSOLIDATED_FILENAMES.fileStructure,
    exportPath: `${CONSOLIDATED_EXPORT_DIR}/${CONSOLIDATED_FILENAMES.fileStructure}`,
    modelsPath: `models/${CONSOLIDATED_FILENAMES.fileStructure}`
  }
};

/**
 * Write JSON to file-exchange/exports/ (primary) and models/ (API mirror).
 * @param {"models"|"prompts"|"fileStructure"} kind
 * @param {object} doc
 */
export async function writeConsolidatedArtifact(kind, doc) {
  const spec = CONSOLIDATED_ARTIFACTS[kind];
  const json = JSON.stringify(doc, null, 2);
  await writeConsolidatedExport(repoRoot, spec.filename, json);
  const modelsAbs = join(repoRoot, spec.modelsPath);
  await mkdir(dirname(modelsAbs), { recursive: true });
  await writeFile(modelsAbs, json);
  return {
    exportPath: spec.exportPath,
    modelsPath: spec.modelsPath
  };
}
