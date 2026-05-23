import { PDFParse } from "pdf-parse";

/**
 * Extract embedded text from a PDF buffer using pdf-parse v2 (PDFParse class).
 * @param {Buffer} buffer
 */
export async function extractPdfEmbeddedText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return {
      text: result.text?.trim() ?? "",
      pageCount: result.total ?? null
    };
  } finally {
    await parser.destroy();
  }
}
