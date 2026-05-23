import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  CONSOLIDATED_EXPORT_DIR,
  CONSOLIDATED_FILENAMES,
  writeConsolidatedExport,
  getConsolidatedExportStamp
} from "../backend/src/shared/utils/consolidatedExport.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

export {
  CONSOLIDATED_EXPORT_DIR,
  CONSOLIDATED_FILENAMES,
  getConsolidatedExportStamp,
  beginConsolidatedExportSession
} from "../backend/src/shared/utils/consolidatedExport.js";

/** Repo-relative paths: dated exports/ folder is primary audit trail; models/ is latest mirror. */
export const CONSOLIDATED_ARTIFACTS = {
  models: {
    filename: CONSOLIDATED_FILENAMES.models,
    modelsPath: `models/${CONSOLIDATED_FILENAMES.models}`
  },
  prompts: {
    filename: CONSOLIDATED_FILENAMES.prompts,
    modelsPath: `models/${CONSOLIDATED_FILENAMES.prompts}`
  },
  fileStructure: {
    filename: CONSOLIDATED_FILENAMES.fileStructure,
    modelsPath: `models/${CONSOLIDATED_FILENAMES.fileStructure}`
  }
};

/**
 * Write JSON to dated file-exchange/exports/{stamp}_consolidated/ and models/ mirror.
 * @param {"models"|"prompts"|"fileStructure"} kind
 * @param {object} doc
 */
export async function writeConsolidatedArtifact(kind, doc) {
  const spec = CONSOLIDATED_ARTIFACTS[kind];
  const json = JSON.stringify(doc, null, 2);
  const condensedBy = doc?.meta?.condensedBy ?? null;
  const written = await writeConsolidatedExport(repoRoot, spec.filename, json, {
    condensedBy
  });

  const modelsAbs = join(repoRoot, spec.modelsPath);
  await mkdir(dirname(modelsAbs), { recursive: true });
  await writeFile(modelsAbs, json);

  return {
    exportPath: written.exportPath,
    datedExportDir: written.datedExportDir,
    stamp: written.stamp,
    folderName: written.folderName,
    modelsPath: spec.modelsPath,
    latestExportPath: `${CONSOLIDATED_EXPORT_DIR}/${spec.filename}`
  };
}
