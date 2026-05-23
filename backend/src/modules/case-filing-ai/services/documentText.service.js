import {
  classifyUpload,
  isMostlyPrintableText
} from "../utils/document-upload.js";
import { extractPdfEmbeddedText } from "./pdfText.service.js";

const OCR_NEEDED_THRESHOLD = 50;

export function createDocumentTextService({ ocr, officeText } = {}) {
  const office = officeText ?? null;
  async function maybeRunOcr(buffer, { originalname, mimetype, fileKind, note }) {
    if (!ocr) {
      return null;
    }

    if (fileKind !== "image" && fileKind !== "pdf") {
      return null;
    }

    try {
      const ocrResult = await ocr.extractText(buffer, { originalname, mimetype, fileKind });
      if (!ocrResult?.text?.trim()) {
        return null;
      }

      return {
        text: ocrResult.text.trim(),
        method: "ocr",
        ocrNeeded: ocrResult.text.length < OCR_NEEDED_THRESHOLD,
        note: note ?? null,
        ocrMeta: {
          ocr_used: true,
          ocr_model: ocrResult.model,
          ocr_pages: ocrResult.ocrPages ?? null,
          rendered_pages: ocrResult.renderedPages ?? null
        }
      };
    } catch (error) {
      return {
        text: "",
        method: "ocr_failed",
        ocrNeeded: true,
        note: error.message || "ocr_failed",
        ocrMeta: {
          ocr_used: false,
          ocr_error: error.message || "ocr_failed"
        }
      };
    }
  }

  async function extractText(buffer, { originalname, mimetype }) {
    const kind = classifyUpload({ originalname, mimetype, buffer });
    let text = "";
    let pageCount = null;
    let method = "unknown";
    let ocrNeeded = true;
    let note = null;
    let ocrMeta = {
      ocr_used: false,
      ocr_model: null
    };

    if (kind === "pdf") {
      method = "embedded_text";
      try {
        const parsed = await extractPdfEmbeddedText(buffer);
        text = parsed.text || "";
        pageCount = parsed.pageCount;
      } catch (error) {
        text = "";
        note = error.message || "pdf_parse_failed";
      }
      ocrNeeded = text.length < OCR_NEEDED_THRESHOLD;

      if (ocrNeeded) {
        const ocrAttempt = await maybeRunOcr(buffer, {
          originalname,
          mimetype,
          fileKind: kind,
          note: note ?? "pdf_embedded_text_insufficient"
        });
        if (ocrAttempt?.text) {
          text = ocrAttempt.text;
          method = ocrAttempt.method;
          ocrNeeded = ocrAttempt.ocrNeeded;
          note = ocrAttempt.note;
          ocrMeta = ocrAttempt.ocrMeta;
          pageCount = ocrAttempt.ocrMeta?.rendered_pages ?? pageCount;
        } else if (ocrAttempt?.ocrMeta) {
          ocrMeta = ocrAttempt.ocrMeta;
          if (ocrAttempt.note) note = ocrAttempt.note;
        }
      }
    } else if (kind === "text") {
      method = "plain_text";
      text = buffer.toString("utf8").trim();
      ocrNeeded = text.length < OCR_NEEDED_THRESHOLD;
    } else if (kind === "image") {
      method = "image";
      text = "";
      ocrNeeded = true;
      note = "image_requires_ocr";

      const ocrAttempt = await maybeRunOcr(buffer, {
        originalname,
        mimetype,
        fileKind: kind,
        note
      });
      if (ocrAttempt?.text) {
        text = ocrAttempt.text;
        method = ocrAttempt.method;
        ocrNeeded = ocrAttempt.ocrNeeded;
        note = ocrAttempt.note;
        ocrMeta = ocrAttempt.ocrMeta;
      } else if (ocrAttempt?.ocrMeta) {
        ocrMeta = ocrAttempt.ocrMeta;
      }
    } else if (kind === "office") {
      method = "office_extract";
      if (office?.supportsExtension?.(originalname)) {
        try {
          text = (await office.extractText(buffer, { originalname })) || "";
          ocrNeeded = text.length < OCR_NEEDED_THRESHOLD;
          if (!text) {
            note = "office_extract_empty";
          }
        } catch (error) {
          text = "";
          ocrNeeded = true;
          note = error.message || "office_extract_failed";
        }
      } else {
        method = "office_unsupported";
        text = "";
        ocrNeeded = true;
        note = "office_format_unsupported";
      }
    } else {
      const asText = buffer.toString("utf8");
      if (isMostlyPrintableText(asText)) {
        method = "binary_as_text";
        text = asText.trim();
        ocrNeeded = text.length < OCR_NEEDED_THRESHOLD;
      } else {
        method = "binary";
        text = "";
        ocrNeeded = true;
        note = "unsupported_binary_format";
      }
    }

    return {
      text,
      pageCount,
      fileKind: kind,
      extractionQuality: {
        method,
        fileKind: kind,
        textLength: text.length,
        ocr_needed: ocrNeeded,
        ocr_used: ocrMeta.ocr_used,
        ocr_model: ocrMeta.ocr_model,
        ocr_pages: ocrMeta.ocr_pages ?? null,
        reviewStatus: "ai_extracted_unreviewed",
        note
      }
    };
  }

  async function extractLayers(buffer, { originalname, mimetype }) {
    const base = await extractText(buffer, { originalname, mimetype });
    let embeddedText = "";
    let ocrText = null;

    const kind = base.fileKind;
    if (kind === "pdf") {
      try {
        const parsed = await extractPdfEmbeddedText(buffer);
        embeddedText = parsed.text || "";
      } catch {
        embeddedText = "";
      }
      if (base.extractionQuality?.ocr_used && base.text) {
        ocrText = base.text;
      }
    } else if (base.extractionQuality?.method === "ocr") {
      ocrText = base.text;
      embeddedText = "";
    } else {
      embeddedText = base.text;
    }

    const finalText = base.text || embeddedText || ocrText || "";

    return {
      embeddedText,
      ocrText,
      finalText,
      pageCount: base.pageCount,
      fileKind: base.fileKind,
      extractionQuality: {
        ...base.extractionQuality,
        textLength: finalText.length
      },
      pageMap: {
        pageCount: base.pageCount ?? null,
        fileKind: base.fileKind
      }
    };
  }

  return { extractText, extractLayers, OCR_NEEDED_THRESHOLD };
}
