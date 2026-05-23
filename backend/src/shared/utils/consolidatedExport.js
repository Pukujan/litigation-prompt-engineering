import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { formatExchangeTimestamp, normalizeExchangeStamp } from "./formatExchangeTimestamp.js";

/** Session exports and consolidated snapshots root. */
export const CONSOLIDATED_EXPORT_DIR = "file-exchange/exports";

/** Folder suffix for consolidated audit bundles (matches file-exchange stamp convention). */
export const CONSOLIDATED_FOLDER_LABEL = "consolidated";

export const CONSOLIDATED_FILENAMES = {
  models: "consolidated-models.json",
  prompts: "consolidated-prompts.json",
  fileStructure: "consolidated-file-structure.json"
};

export const CONSOLIDATED_MANIFEST_FILENAME = "manifest.json";

const ENV_STAMP = "CONSOLIDATED_EXPORT_STAMP";

/**
 * @param {string} [stamp]
 * @param {string} [label]
 * @returns {string} e.g. 2026-05-23_15-59-43Z_consolidated
 */
export function consolidatedExportFolderName(stamp, label = CONSOLIDATED_FOLDER_LABEL) {
  return `${normalizeExchangeStamp(stamp)}_${label}`;
}

/**
 * Resolve or create a shared UTC stamp for one condense run (condense:all shares via env).
 * @param {{ create?: boolean }} [options]
 * @returns {string|null}
 */
export function getConsolidatedExportStamp({ create = true } = {}) {
  const fromEnv = process.env[ENV_STAMP];
  if (fromEnv) {
    return normalizeExchangeStamp(fromEnv);
  }
  if (!create) {
    return null;
  }
  const stamp = formatExchangeTimestamp();
  process.env[ENV_STAMP] = stamp;
  return stamp;
}

/**
 * Start a consolidated export session (sets CONSOLIDATED_EXPORT_STAMP).
 * @param {{ stamp?: string, label?: string }} [options]
 */
export function beginConsolidatedExportSession(options = {}) {
  const stamp = options.stamp
    ? normalizeExchangeStamp(options.stamp)
    : getConsolidatedExportStamp({ create: true });
  process.env[ENV_STAMP] = stamp;
  const folderName = consolidatedExportFolderName(stamp, options.label ?? CONSOLIDATED_FOLDER_LABEL);
  return {
    stamp,
    label: options.label ?? CONSOLIDATED_FOLDER_LABEL,
    folderName,
    exportDir: `${CONSOLIDATED_EXPORT_DIR}/${folderName}`
  };
}

/**
 * @param {string} repoRoot
 * @param {string} stamp
 * @param {string} [label]
 * @returns {string} absolute path to dated export folder
 */
export function resolveConsolidatedExportDir(repoRoot, stamp, label = CONSOLIDATED_FOLDER_LABEL) {
  return join(repoRoot, CONSOLIDATED_EXPORT_DIR, consolidatedExportFolderName(stamp, label));
}

/**
 * Write a consolidated JSON artifact to a dated export folder and refresh latest mirrors.
 * @param {string} repoRoot
 * @param {string} filename
 * @param {string} jsonText
 * @param {{ stamp?: string, label?: string, writeLatest?: boolean, condensedBy?: string }} [options]
 * @returns {Promise<{ absolutePath: string, exportPath: string, datedExportDir: string, stamp: string, folderName: string }>}
 */
export async function writeConsolidatedExport(repoRoot, filename, jsonText, options = {}) {
  const stamp = options.stamp ?? getConsolidatedExportStamp({ create: true });
  const label = options.label ?? CONSOLIDATED_FOLDER_LABEL;
  const folderName = consolidatedExportFolderName(stamp, label);
  const datedDir = join(repoRoot, CONSOLIDATED_EXPORT_DIR, folderName);
  const exportsRoot = join(repoRoot, CONSOLIDATED_EXPORT_DIR);

  await mkdir(datedDir, { recursive: true });
  await mkdir(exportsRoot, { recursive: true });

  const absolutePath = join(datedDir, filename);
  await writeFile(absolutePath, jsonText, "utf8");

  if (options.writeLatest !== false) {
    await writeFile(join(exportsRoot, filename), jsonText, "utf8");
  }

  if (options.condensedBy) {
    await appendConsolidatedManifest(repoRoot, stamp, {
      filename,
      condensedBy: options.condensedBy,
      label
    });
  }

  return {
    absolutePath,
    exportPath: `${CONSOLIDATED_EXPORT_DIR}/${folderName}/${filename}`,
    datedExportDir: `${CONSOLIDATED_EXPORT_DIR}/${folderName}`,
    stamp,
    folderName
  };
}

/**
 * @param {string} repoRoot
 * @param {string} stamp
 * @param {{ filename: string, condensedBy?: string, label?: string }} entry
 */
export async function appendConsolidatedManifest(repoRoot, stamp, entry) {
  const label = entry.label ?? CONSOLIDATED_FOLDER_LABEL;
  const folderName = consolidatedExportFolderName(stamp, label);
  const manifestPath = join(
    repoRoot,
    CONSOLIDATED_EXPORT_DIR,
    folderName,
    CONSOLIDATED_MANIFEST_FILENAME
  );
  const now = new Date().toISOString();

  let manifest = {
    stamp: normalizeExchangeStamp(stamp),
    folder: folderName,
    label,
    startedAt: now,
    updatedAt: now,
    artifacts: []
  };

  try {
    const raw = await readFile(manifestPath, "utf8");
    manifest = JSON.parse(raw);
    manifest.updatedAt = now;
    if (!Array.isArray(manifest.artifacts)) {
      manifest.artifacts = [];
    }
  } catch {
    /* new manifest */
  }

  const existing = manifest.artifacts.findIndex((a) => a.filename === entry.filename);
  const row = {
    filename: entry.filename,
    condensedBy: entry.condensedBy ?? null,
    writtenAt: now
  };
  if (existing >= 0) {
    manifest.artifacts[existing] = row;
  } else {
    manifest.artifacts.push(row);
  }

  await mkdir(join(repoRoot, CONSOLIDATED_EXPORT_DIR, folderName), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifestPath;
}

/** @deprecated use writeConsolidatedExport */
export async function mirrorConsolidatedExport(repoRoot, filename, jsonText, options = {}) {
  return writeConsolidatedExport(repoRoot, filename, jsonText, options);
}
