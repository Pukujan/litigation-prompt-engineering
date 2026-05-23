import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isSupportedUploadFile,
  mergeUploadFiles,
  SUPPORTED_UPLOAD_HINT
} from "../../utils/document-files.js";

test("isSupportedUploadFile accepts PDF and text files", () => {
  assert.equal(isSupportedUploadFile(new File(["a"], "a.pdf", { type: "application/pdf" })), true);
  assert.equal(isSupportedUploadFile(new File(["a"], "notes.txt", { type: "text/plain" })), true);
  assert.equal(isSupportedUploadFile(new File(["a"], "scan.png", { type: "image/png" })), true);
});

test("isSupportedUploadFile rejects empty and executable files", () => {
  assert.equal(isSupportedUploadFile(new File([], "empty.pdf", { type: "application/pdf" })), false);
  assert.equal(isSupportedUploadFile(new File(["a"], "run.exe", { type: "application/octet-stream" })), false);
});

test("mergeUploadFiles accumulates unique files", () => {
  const a = new File(["a"], "001.pdf", { type: "application/pdf" });
  const b = new File(["b"], "002.txt", { type: "text/plain" });
  assert.equal(mergeUploadFiles([a], [b, a]).length, 2);
});

test("supported upload hint is documented", () => {
  assert.match(SUPPORTED_UPLOAD_HINT, /PDF/);
  assert.match(SUPPORTED_UPLOAD_HINT, /Office/);
});
