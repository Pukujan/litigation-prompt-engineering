import { test } from "node:test";
import assert from "node:assert/strict";
import { isSupportedUpload, classifyUpload, storedFilenameFor } from "../../utils/document-upload.js";

test("isSupportedUpload accepts common filing formats", () => {
  assert.equal(
    isSupportedUpload({ originalname: "001.pdf", mimetype: "application/pdf", size: 10, buffer: Buffer.from("%PDF") }),
    true
  );
  assert.equal(
    isSupportedUpload({ originalname: "notes.txt", mimetype: "text/plain", size: 10, buffer: Buffer.from("hi") }),
    true
  );
  assert.equal(
    isSupportedUpload({ originalname: "scan.tiff", mimetype: "image/tiff", size: 10, buffer: Buffer.from("data") }),
    true
  );
});

test("isSupportedUpload rejects executables and empty files", () => {
  assert.equal(isSupportedUpload({ originalname: "run.exe", mimetype: "application/octet-stream", size: 10 }), false);
  assert.equal(isSupportedUpload({ originalname: "empty.pdf", mimetype: "application/pdf", size: 0 }), false);
});

test("classifyUpload detects file kinds", () => {
  assert.equal(classifyUpload({ originalname: "a.pdf", mimetype: "application/pdf", buffer: Buffer.from("%PDF") }), "pdf");
  assert.equal(classifyUpload({ originalname: "a.txt", mimetype: "text/plain", buffer: Buffer.from("x") }), "text");
  assert.equal(classifyUpload({ originalname: "a.png", mimetype: "image/png", buffer: Buffer.from("x") }), "image");
});

test("storedFilenameFor preserves original extension", () => {
  assert.equal(storedFilenameFor(1, "Motion to Dismiss.pdf"), "001-Motion to Dismiss.pdf");
});
