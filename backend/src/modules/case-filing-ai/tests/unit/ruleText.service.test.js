import { test } from "node:test";
import assert from "node:assert/strict";
import { createRuleTextService } from "../../services/ruleText.service.js";
import { createDocumentTextService } from "../../services/documentText.service.js";
import { createOfficeTextService } from "../../services/officeText.service.js";
import { buildMinimalDocxBuffer } from "../helpers/minimalDocx.js";

function documentTextWithOffice() {
  return createDocumentTextService({ officeText: createOfficeTextService() });
}

test("ruleText extracts text from plain rule file upload", async () => {
  const ruleText = createRuleTextService({ documentText: documentTextWithOffice() });
  const result = await ruleText.extractFromUpload({
    originalname: "part-rules.txt",
    mimetype: "text/plain",
    buffer: Buffer.from("Part 29: motions must be filed within 15 days of service.")
  });
  assert.match(result.text, /Part 29/);
  assert.equal(result.fileKind, "text");
});

test("ruleText extracts text from docx rule file upload", async () => {
  const ruleText = createRuleTextService({ documentText: documentTextWithOffice() });
  const buffer = await buildMinimalDocxBuffer("Part 29: motions must be filed within 15 days.");
  const result = await ruleText.extractFromUpload({
    originalname: "part-rules.docx",
    mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer
  });
  assert.match(result.text, /Part 29/);
  assert.equal(result.fileKind, "office");
});
