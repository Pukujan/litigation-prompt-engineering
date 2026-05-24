import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { resolveArtifactPaths } from "../../../shared/config/resolveArtifactPaths.js";
import { CONSOLIDATED_FILENAMES } from "../../../shared/utils/consolidatedExport.js";

/**
 * Resolve latest consolidated model/prompt inventory files for golden audit pins.
 * @param {string} repoRoot
 * @returns {Promise<{
 *   modelInventoryVersion: string|null,
 *   promptInventoryVersion: string|null,
 *   modelInventoryPath: string|null,
 *   promptInventoryPath: string|null
 * }>}
 */
export async function resolveConsolidatedInventory(repoRoot) {
  const paths = resolveArtifactPaths(repoRoot);
  const candidates = (filename) => [
    join(paths.consolidatedFiles, filename),
    join(paths.fileExchangeExports, filename),
    join(repoRoot, "file-exchange/exports", filename)
  ];

  const model = await readInventoryMeta(candidates(CONSOLIDATED_FILENAMES.models));
  const prompts = await readInventoryMeta(candidates(CONSOLIDATED_FILENAMES.prompts));

  return {
    modelInventoryVersion: model?.generatedAt ?? null,
    promptInventoryVersion: prompts?.generatedAt ?? null,
    modelInventoryPath: model?.path ?? null,
    promptInventoryPath: prompts?.path ?? null
  };
}

async function readInventoryMeta(candidatePaths) {
  for (const absolutePath of candidatePaths) {
    if (!existsSync(absolutePath)) continue;
    try {
      const raw = await readFile(absolutePath, "utf8");
      const parsed = JSON.parse(raw);
      const generatedAt = parsed?.meta?.generatedAt ?? null;
      return { generatedAt, path: absolutePath };
    } catch {
      /* try next */
    }
  }
  return null;
}
