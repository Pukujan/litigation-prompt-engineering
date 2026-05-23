const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".markdown",
  ".csv",
  ".json",
  ".html",
  ".htm",
  ".xml",
  ".rtf",
  ".log",
  ".eml",
  ".msg"
]);

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".tif",
  ".tiff",
  ".bmp",
  ".heic",
  ".heif"
]);

const OFFICE_EXTENSIONS = new Set([
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".odt",
  ".ods"
]);

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

export const SUPPORTED_UPLOAD_HINT =
  "PDF, text (TXT/MD/JSON/CSV/HTML), images (PNG/JPG/TIFF), Office (DOC/DOCX), and more";

function extensionOf(name) {
  const lower = String(name || "").toLowerCase();
  const dot = lower.lastIndexOf(".");
  return dot >= 0 ? lower.slice(dot) : "";
}

function mimeOf(mimetype) {
  return String(mimetype || "").toLowerCase();
}

function isMostlyPrintableText(text) {
  if (!text?.length) return false;
  const sample = text.slice(0, 2000);
  let printable = 0;
  for (const char of sample) {
    const code = char.charCodeAt(0);
    if (code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127)) {
      printable += 1;
    }
  }
  return printable / sample.length > 0.85;
}

/**
 * @param {{ originalname?: string, mimetype?: string, buffer?: Buffer, size?: number }} file
 */
export function isSupportedUpload(file) {
  const size = file.size ?? file.buffer?.length ?? 0;
  if (size <= 0) return false;

  const ext = extensionOf(file.originalname);
  if (BLOCKED_EXTENSIONS.has(ext)) return false;

  const mime = mimeOf(file.mimetype);
  if (mime.startsWith("video/") || mime.startsWith("audio/")) return false;

  if (ext === ".pdf" || mime.includes("pdf")) return true;
  if (TEXT_EXTENSIONS.has(ext) || mime.startsWith("text/") || mime === "application/json") {
    return true;
  }
  if (IMAGE_EXTENSIONS.has(ext) || mime.startsWith("image/")) return true;
  if (OFFICE_EXTENSIONS.has(ext)) return true;
  if (mime === "application/octet-stream") {
    if (file.buffer?.length >= 4 && file.buffer.slice(0, 4).toString() === "%PDF") return true;
  }

  return true;
}

export function sanitizeStoredFilename(name) {
  const cleaned = String(name || "upload")
    .replace(/[^\w.\-() ]+/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 180) || "upload.bin";
}

export function storedFilenameFor(docIndex, originalName) {
  return `${String(docIndex).padStart(3, "0")}-${sanitizeStoredFilename(originalName)}`;
}

export function classifyUpload({ originalname, mimetype, buffer }) {
  const ext = extensionOf(originalname);
  const mime = mimeOf(mimetype);

  if (ext === ".pdf" || mime.includes("pdf") || buffer?.slice(0, 4).toString() === "%PDF") {
    return "pdf";
  }
  if (TEXT_EXTENSIONS.has(ext) || mime.startsWith("text/") || mime === "application/json") {
    return "text";
  }
  if (IMAGE_EXTENSIONS.has(ext) || mime.startsWith("image/")) return "image";
  if (OFFICE_EXTENSIONS.has(ext)) return "office";
  return "binary";
}

export { isMostlyPrintableText, extensionOf, TEXT_EXTENSIONS, IMAGE_EXTENSIONS, OFFICE_EXTENSIONS };
