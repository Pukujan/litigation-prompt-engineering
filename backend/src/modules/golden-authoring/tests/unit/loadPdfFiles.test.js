import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { mkdtemp } from "fs/promises";

// Test helpers mirror authorGoldenCli loadPdfFiles (exported via dynamic import after refactor)
import { readFile, readdir } from "fs/promises";
import { extname } from "path";
import { isSupportedUpload } from "../../../case-filing-ai/utils/document-upload.js";

function matchesPdfGlob(fileName, pdfGlob) {
  const pattern = pdfGlob ?? "**/*.pdf";
  if (pattern === "**/*.pdf" || pattern === "*.pdf") {
    return /\.pdf$/i.test(fileName);
  }
  const slash = pattern.lastIndexOf("/");
  const filePart = slash >= 0 ? pattern.slice(slash + 1) : pattern;
  const escaped = filePart.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`, "i").test(fileName);
}

function pdfWalkRoot(importDir, pdfGlob) {
  const pattern = pdfGlob ?? "**/*.pdf";
  const slash = pattern.indexOf("/");
  if (slash <= 0) return importDir;
  const dirPart = pattern.slice(0, slash);
  if (dirPart === "**") return importDir;
  return join(importDir, dirPart);
}

test("pdfGlob pdf/*.pdf resolves walk root and matches filenames", async () => {
  const root = await mkdtemp(join(tmpdir(), "golden-pdf-glob-"));
  const pdfDir = join(root, "pdf");
  await mkdir(pdfDir, { recursive: true });
  await writeFile(join(pdfDir, "doc_001.pdf"), "%PDF", "utf8");
  await writeFile(join(root, "readme.txt"), "nope", "utf8");

  const walkRoot = pdfWalkRoot(root, "pdf/*.pdf");
  assert.equal(walkRoot, pdfDir);

  const entries = await readdir(walkRoot);
  const pdfs = entries.filter((name) => {
    if (!matchesPdfGlob(name, "pdf/*.pdf")) return false;
    return isSupportedUpload({ originalname: name, size: 1 });
  });
  assert.deepEqual(pdfs, ["doc_001.pdf"]);
});
