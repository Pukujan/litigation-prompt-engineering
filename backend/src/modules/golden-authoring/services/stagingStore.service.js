import { mkdir, readFile, writeFile, appendFile, access, readdir } from "fs/promises";
import { join, dirname } from "path";
import { buildBootstrapSnapshot } from "../../case-filing-ai/utils/goldenCaseBootstrap.js";

export function createStagingStoreService({ repoRoot, stagingRoot, goldenRoot }) {
  function versionDir(caseId, version) {
    return join(stagingRoot, caseId, version);
  }

  function committedDir(caseId) {
    return join(goldenRoot, caseId);
  }

  function runDir(caseId, version) {
    return join(versionDir(caseId, version), "run");
  }

  async function ensureDir(dir) {
    await mkdir(dir, { recursive: true });
  }

  async function writeJson(path, data) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(data, null, 2), "utf8");
  }

  async function readJson(path) {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw);
  }

  async function appendProcessingLog(caseId, version, entry) {
    const logPath = join(runDir(caseId, version), "processing-log.jsonl");
    await ensureDir(runDir(caseId, version));
    await appendFile(logPath, `${JSON.stringify({ time: new Date().toISOString(), ...entry })}\n`);
  }

  function createRunStoreAdapter(caseId, version) {
    const base = runDir(caseId, version);

    return {
      batchRootDir: base,
      emptySnapshot() {
        return {
          snapshotId: "snapshot_initial",
          confirmedFacts: [],
          openTasks: [],
          completedTasks: [],
          deadlines: [],
          supersededDeadlines: [],
          conflicts: [],
          auditNotes: []
        };
      },
      async listUploads() {
        try {
          return await readdir(join(base, "uploads"));
        } catch {
          return [];
        }
      },
      async saveUpload(batchId, storedName, buffer) {
        const dir = join(base, "uploads");
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, storedName), buffer);
      },
      async saveDocumentOutput(batchId, docKey, data) {
        const dir = join(base, "outputs");
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, `${docKey}.json`), JSON.stringify(data, null, 2));
      },
      async writeCaseSnapshot(batchId, snapshot) {
        await writeJson(join(base, "case-snapshot.json"), snapshot);
      },
      async readCaseSnapshot() {
        try {
          return await readJson(join(base, "case-snapshot.json"));
        } catch {
          return null;
        }
      },
      async savePartRule(batchId, text) {
        await writeFile(join(base, "part-rule.txt"), text ?? "", "utf8");
      },
      async readRuleParsed() {
        try {
          return await readJson(join(base, "rule-parsed.json"));
        } catch {
          return null;
        }
      },
      async saveRuleParsed(batchId, data) {
        await writeJson(join(base, "rule-parsed.json"), data);
      },
      async appendProcessingLog(batchId, entry) {
        await appendProcessingLog(caseId, version, entry);
      }
    };
  }

  async function seedBootstrapSnapshot(caseId, version, caseIdentity) {
    const boot = buildBootstrapSnapshot(caseIdentity);
    if (!boot) return null;
    const adapter = createRunStoreAdapter(caseId, version);
    await adapter.writeCaseSnapshot("authoring", boot);
    return boot;
  }

  async function listStagedVersions(caseId) {
    try {
      const entries = await readdir(join(stagingRoot, caseId), { withFileTypes: true });
      return entries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch {
      return [];
    }
  }

  async function listCommittedCases() {
    try {
      const entries = await readdir(goldenRoot, { withFileTypes: true });
      return entries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch {
      return [];
    }
  }

  async function versionExists(caseId, version) {
    try {
      await access(versionDir(caseId, version));
      return true;
    } catch {
      return false;
    }
  }

  return {
    repoRoot,
    stagingRoot,
    goldenRoot,
    versionDir,
    committedDir,
    runDir,
    ensureDir,
    writeJson,
    readJson,
    appendProcessingLog,
    createRunStoreAdapter,
    seedBootstrapSnapshot,
    listStagedVersions,
    listCommittedCases,
    versionExists
  };
}
