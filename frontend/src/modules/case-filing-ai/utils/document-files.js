export const SUPPORTED_UPLOAD_HINT =
  "PDF, TXT, MD, JSON, CSV, HTML, images (PNG/JPG/TIFF), Office (DOC/DOCX), and more";

const BLOCKED_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".msi",
  ".dmg",
  ".pkg",
  ".app",
  ".js",
  ".mjs",
  ".cjs",
  ".wasm"
]);

function extensionFromName(name) {
  const lower = String(name || "").toLowerCase();
  const dot = lower.lastIndexOf(".");
  return dot >= 0 ? lower.slice(dot) : "";
}

/**
 * @param {File} file
 * @returns {boolean}
 */
export function isSupportedUploadFile(file) {
  if (!file?.size) return false;

  const ext = extensionFromName(file.name);
  if (BLOCKED_EXTENSIONS.has(ext)) return false;

  const type = (file.type || "").toLowerCase();
  if (type.startsWith("video/") || type.startsWith("audio/")) return false;

  return true;
}

/**
 * @param {DataTransfer} dataTransfer
 * @returns {File[]}
 */
export function filesFromDataTransfer(dataTransfer) {
  const fromItems = [];
  if (dataTransfer?.items?.length) {
    for (const item of dataTransfer.items) {
      if (item.kind !== "file") continue;
      const file = item.getAsFile();
      if (file) fromItems.push(file);
    }
  }

  if (fromItems.length) return fromItems;
  return Array.from(dataTransfer?.files ?? []);
}

/**
 * @param {File[] | FileList} files
 * @returns {Promise<{ accepted: File[], rejected: File[] }>}
 */
export async function partitionUploadFiles(files) {
  const accepted = [];
  const rejected = [];
  for (const file of Array.from(files ?? [])) {
    if (isSupportedUploadFile(file)) accepted.push(file);
    else rejected.push(file);
  }
  return { accepted, rejected };
}

/**
 * @param {File[]} existing
 * @param {File[]} incoming
 * @returns {File[]}
 */
export function mergeUploadFiles(existing, incoming) {
  const merged = [...existing];
  for (const file of incoming) {
    const duplicate = merged.some((f) => f.name === file.name && f.size === file.size);
    if (!duplicate) merged.push(file);
  }
  return merged;
}
