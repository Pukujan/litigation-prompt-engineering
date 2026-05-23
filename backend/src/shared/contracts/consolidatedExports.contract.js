/** @readonly Consolidated repo snapshot exports contract. */

export {
  CONSOLIDATED_EXPORT_DIR,
  CONSOLIDATED_FILENAMES,
  writeConsolidatedExport
} from "../utils/consolidatedExport.js";

export const CONSOLIDATED_EXPORTS_VERSION = "v001";

/** API / model-condenser mirror path. */
export const CONSOLIDATED_MODELS_MIRROR_DIR = "models";

export const CONSOLIDATED_NPM_SCRIPTS = {
  models: "condense-models",
  prompts: "condense-prompts",
  fileStructure: "condense-file-structure",
  all: "condense:all"
};
