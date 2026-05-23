import { test } from "node:test";
import assert from "node:assert/strict";
import { createDocumentTextService } from "../../services/documentText.service.js";
import { createOfficeTextService } from "../../services/officeText.service.js";

test("documentText extracts plain text files", async () => {
  const documentText = createDocumentTextService();
  const result = await documentText.extractText(
    Buffer.from("Summons and Complaint filed in Queens County Supreme Court index 999999/2025"),
    {
    originalname: "complaint.txt",
    mimetype: "text/plain"
    }
  );
  assert.match(result.text, /Summons/);
  assert.equal(result.fileKind, "text");
  assert.equal(result.extractionQuality.ocr_needed, false);
});

test("documentText marks images as ocr_needed", async () => {
  const documentText = createDocumentTextService();
  const result = await documentText.extractText(Buffer.from([0x89, 0x50, 0x4e, 0x47]), {
    originalname: "scan.png",
    mimetype: "image/png"
  });
  assert.equal(result.fileKind, "image");
  assert.equal(result.extractionQuality.ocr_needed, true);
});

test("documentText extracts docx via officeText service", async () => {
  const { buildMinimalDocxBuffer } = await import("../helpers/minimalDocx.js");
  const documentText = createDocumentTextService({ officeText: createOfficeTextService() });
  const buffer = await buildMinimalDocxBuffer(
    "Summons and complaint filing deadline is thirty days from date of service in Queens County."
  );
  const result = await documentText.extractText(buffer, {
    originalname: "rules.docx",
    mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  });
  assert.match(result.text, /Summons and complaint/);
  assert.equal(result.extractionQuality.method, "office_extract");
  assert.equal(result.extractionQuality.ocr_needed, false);
});

test("documentText marks unsupported office files as ocr_needed", async () => {
  const documentText = createDocumentTextService({ officeText: createOfficeTextService() });
  const result = await documentText.extractText(Buffer.from("PK"), {
    originalname: "slides.pptx",
    mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  });
  assert.equal(result.fileKind, "office");
  assert.equal(result.extractionQuality.method, "office_unsupported");
  assert.equal(result.extractionQuality.ocr_needed, true);
});
