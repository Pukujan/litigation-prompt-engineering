import { cp, readFile, appendFile, access } from "fs/promises";
import { join } from "path";

export function createPromoteGoldenService({ stagingStore, goldenVersion, repoRoot }) {
  async function validateStaging(caseId, version) {
    const dir = stagingStore.versionDir(caseId, version);
    const errors = [];

    let authoringRun;
    try {
      authoringRun = await stagingStore.readJson(join(dir, "authoring_run.json"));
    } catch {
      errors.push("Missing authoring_run.json");
    }

    if (authoringRun && authoringRun.batchStatus !== "completed") {
      errors.push(`authoring_run batchStatus is ${authoringRun.batchStatus}, expected completed`);
    }

    try {
      await access(join(dir, "SYNTHETIC_DATA_NOTICE.md"));
    } catch {
      errors.push("Missing SYNTHETIC_DATA_NOTICE.md");
    }

    try {
      await access(join(dir, `${caseId}.golden-dataset.json`));
    } catch {
      errors.push(`Missing ${caseId}.golden-dataset.json`);
    }

    if (errors.length) {
      const err = new Error(`Promote validation failed: ${errors.join("; ")}`);
      err.statusCode = 400;
      err.validationErrors = errors;
      throw err;
    }

    return { dir, authoringRun };
  }

  async function promote({ caseId, version, promotedBy = "script", reason = "" }) {
    const { dir, authoringRun } = await validateStaging(caseId, version);
    const targetDir = stagingStore.committedDir(caseId);

    await cp(dir, targetDir, { recursive: true, force: true });

    await goldenVersion.appendVersionHistory(join(targetDir, "VERSION_HISTORY.jsonl"), {
      time: new Date().toISOString(),
      version,
      caseId,
      status: "promoted",
      promotedBy,
      reason: reason || `Promoted from staging ${version}`,
      authoringRunId: authoringRun.runId
    });

    const changelogPath = join(repoRoot, "docs/architecture/contracts/changelog.jsonl");
    const changelogEntry = {
      time: new Date().toISOString(),
      contract: "goldenDataset",
      from: null,
      to: version,
      reason: reason || `Promoted golden authoring ${caseId}/${version}`,
      author: promotedBy
    };
    await appendFile(changelogPath, `${JSON.stringify(changelogEntry)}\n`);

    return {
      caseId,
      version,
      committedDir: targetDir,
      changelogEntry
    };
  }

  async function listVersions(caseId) {
    const staged = await stagingStore.listStagedVersions(caseId);
    let committed = false;
    try {
      await access(stagingStore.committedDir(caseId));
      committed = true;
    } catch {
      committed = false;
    }
    return { caseId, staged, committed };
  }

  return { promote, validateStaging, listVersions };
}
