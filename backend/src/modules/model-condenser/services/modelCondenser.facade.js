import { access } from "fs/promises";
import { join } from "path";
import {
  buildConsolidatedModels,
  condenseModels,
  readConsolidatedModels
} from "./modelCondenser.service.js";

export function createModelCondenserFacade({ config }) {
  async function condense({ includePayload = false } = {}) {
    return condenseModels({
      repoRoot: config.repoRoot,
      modelsDir: config.modelsDir,
      consolidatedFileName: config.consolidatedFileName,
      includePayload
    });
  }

  async function readConsolidated() {
    return readConsolidatedModels({
      modelsDir: config.modelsDir,
      consolidatedFileName: config.consolidatedFileName
    });
  }

  async function getStatus() {
    const outputPath = join(config.modelsDir, config.consolidatedFileName);
    let exists = false;
    let generatedAt = null;
    let modelCount = null;

    try {
      await access(outputPath);
      exists = true;
      const data = await readConsolidated();
      generatedAt = data.meta?.generatedAt ?? null;
      modelCount = data.inventory?.length ?? null;
    } catch {
      exists = false;
    }

    return {
      status: exists ? "ready" : "missing",
      exists,
      outputPath,
      outputRelativePath: `models/${config.consolidatedFileName}`,
      generatedAt,
      modelCount
    };
  }

  return {
    condense,
    readConsolidated,
    getStatus,
    buildConsolidatedModels: () => buildConsolidatedModels({ repoRoot: config.repoRoot })
  };
}
