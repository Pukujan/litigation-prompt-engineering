import { appendFile, readFile, readdir } from "fs/promises";
import { join } from "path";

const PURPOSE_DEFAULT = "rule_authority";

/**
 * Version id: {legalCaseId}_{purpose}_v{NNN}
 * e.g. synthetic_case_002_rule_authority_v001
 */
export function createGoldenVersionService({ stagingRoot, goldenRoot }) {
  function parseVersionSuffix(name) {
    const match = String(name).match(/_v(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async function listVersionIdsForLegalCase(legalCaseId, purpose = PURPOSE_DEFAULT) {
    const prefix = `${legalCaseId}_${purpose}_v`;
    const ids = new Set();

    async function scanRoot(root) {
      let caseDirs = [];
      try {
        caseDirs = await readdir(root);
      } catch {
        return;
      }
      for (const caseId of caseDirs) {
        try {
          const versions = await readdir(join(root, caseId));
          for (const v of versions) {
            if (v.startsWith(prefix)) ids.add(v);
          }
        } catch {
          /* skip */
        }
        if (caseId.includes(prefix.slice(0, -1))) {
          ids.add(caseId);
        }
      }
    }

    await scanRoot(stagingRoot);
    await scanRoot(goldenRoot);

    try {
      const goldenCases = await readdir(goldenRoot);
      for (const caseId of goldenCases) {
        if (caseId.startsWith(`${legalCaseId}_`)) {
          const manifestMatch = caseId.match(/_v(\d+)$/);
          if (manifestMatch) ids.add(caseId.replace(/^case_\d+_/, `${legalCaseId}_`));
        }
      }
    } catch {
      /* optional */
    }

    return [...ids];
  }

  async function allocateVersionId({ legalCaseId, purpose = PURPOSE_DEFAULT }) {
    const existing = await listVersionIdsForLegalCase(legalCaseId, purpose);
    const maxN = existing.reduce((max, id) => Math.max(max, parseVersionSuffix(id)), 0);
    const next = String(maxN + 1).padStart(3, "0");
    return `${legalCaseId}_${purpose}_v${next}`;
  }

  function caseIdFromVersion(version, caseSlug) {
    if (!caseSlug) return version;
    const legalMatch = version.match(/^(synthetic_case_\d+)/);
    if (legalMatch) {
      return version.replace(legalMatch[1], caseSlug);
    }
    return `${caseSlug}_${version}`;
  }

  async function appendVersionHistory(versionDir, entry) {
    const path = join(versionDir, "VERSION_HISTORY.jsonl");
    await appendFile(path, `${JSON.stringify(entry)}\n`, "utf8");
  }

  async function readVersionHistory(versionDir) {
    try {
      const raw = await readFile(join(versionDir, "VERSION_HISTORY.jsonl"), "utf8");
      return raw
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line));
    } catch {
      return [];
    }
  }

  return {
    allocateVersionId,
    caseIdFromVersion,
    appendVersionHistory,
    readVersionHistory,
    listVersionIdsForLegalCase,
    PURPOSE_DEFAULT
  };
}
