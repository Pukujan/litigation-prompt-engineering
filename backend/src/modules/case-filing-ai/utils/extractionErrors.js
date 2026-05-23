/**
 * User-facing hint when rule/filing text extraction returns empty.
 */
export function buildExtractionFailureMessage({ fileKind, extractionQuality, originalName }) {
  const note = extractionQuality?.note ?? "";
  const name = originalName ? ` (${originalName})` : "";

  if (fileKind === "office") {
    if (note === "office_format_unsupported") {
      return `Could not read this Office file${name}. Use .doc or .docx, paste the rule text, or save as PDF/TXT.`;
    }
    if (note === "office_extract_failed") {
      return `Could not read this Word file${name}. The file may be corrupt or password-protected. Paste the rule text or try another format.`;
    }
    return `Could not extract text from this Word document${name}. Paste the rule text or upload PDF/TXT/MD.`;
  }

  if (fileKind === "pdf") {
    if (note === "pdf_parse_failed") {
      return `Could not parse this PDF${name}. Paste the rule text or upload a different copy.`;
    }
    if (note?.includes("ocr") || extractionQuality?.ocr_used === false) {
      return `This PDF${name} has little or no embedded text (likely scanned). Paste the rule text, or configure OPENROUTER_API_KEY in backend/.env for OCR.`;
    }
    return `Could not extract readable text from this PDF${name}. Paste the rule text or upload a PDF with selectable text.`;
  }

  if (fileKind === "image") {
    return `Could not extract text from this image${name}. Paste the rule text, or configure OPENROUTER_API_KEY in backend/.env for OCR.`;
  }

  if (note === "unsupported_binary_format") {
    return `Unsupported file type${name}. Upload PDF, TXT, MD, DOC, DOCX, or paste the rule text below.`;
  }

  return "Could not extract readable text from this rule file. Paste the rule text or upload a PDF/TXT/MD/DOC/DOCX file with embedded text.";
}
