import { readFile } from "fs/promises";
import { join } from "path";

const runs = new Map();

export function createAuthoringRegistryService({ stagingStore }) {
  function registerRun(runId, meta) {
    runs.set(runId, meta);
  }

  async function getRun(runId) {
    const cached = runs.get(runId);
    if (cached) return cached;

    const caseDirs = await stagingStore.listCommittedCases().catch(() => []);
    const stagedRoots = [];
    for (const caseId of caseDirs) {
      stagedRoots.push(...(await stagingStore.listStagedVersions(caseId)));
    }

    for (const caseId of caseDirs) {
      const versions = await stagingStore.listStagedVersions(caseId);
      for (const version of versions) {
        try {
          const run = await stagingStore.readJson(
            join(stagingStore.versionDir(caseId, version), "authoring_run.json")
          );
          if (run.runId === runId) {
            return { ...run, stagingDir: stagingStore.versionDir(caseId, version) };
          }
        } catch {
          /* continue */
        }
      }
    }
    return null;
  }

  return { registerRun, getRun };
}
