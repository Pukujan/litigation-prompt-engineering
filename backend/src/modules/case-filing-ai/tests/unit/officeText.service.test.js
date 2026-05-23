import { test } from "node:test";
import assert from "node:assert/strict";
import { createOfficeTextService } from "../../services/officeText.service.js";
import { buildMinimalDocxBuffer } from "../helpers/minimalDocx.js";

test("officeText extracts plain text from docx", async () => {
  const officeText = createOfficeTextService();
  const buffer = await buildMinimalDocxBuffer("Part 29: motions within 15 days.");
  const text = await officeText.extractText(buffer, { originalname: "part-rules.docx" });
  assert.match(text, /Part 29/);
});
