import { test } from "node:test";
import assert from "node:assert/strict";
import { extractPdfEmbeddedText } from "../../services/pdfText.service.js";

test("extractPdfEmbeddedText reads text from a PDF with embedded text", async () => {
  const res = await fetch("https://bitcoin.org/bitcoin.pdf");
  const buffer = Buffer.from(await res.arrayBuffer());
  const result = await extractPdfEmbeddedText(buffer);
  assert.ok(result.text.length > 100);
  assert.match(result.text, /Bitcoin/);
  assert.ok(result.pageCount >= 1);
});
