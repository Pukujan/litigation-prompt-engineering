import { join } from "path";
import { fileURLToPath } from "url";

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "../../../../..");

export function getModuleConfig() {
  const modelsDir =
    process.env.MODEL_CONDENSER_OUTPUT_DIR || join(repoRoot, "models");
  return {
    name: "model-condenser",
    label: "Model Condenser",
    repoRoot,
    modelsDir,
    consolidatedFileName:
      process.env.MODEL_CONDENSER_OUTPUT_FILE || "consolidated-models.json"
  };
}

/** @deprecated Prefer getModuleConfig() */
export const moduleConfig = getModuleConfig();
