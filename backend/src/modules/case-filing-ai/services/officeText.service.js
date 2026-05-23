import mammoth from "mammoth";
import WordExtractor from "word-extractor";
import { extensionOf } from "../utils/document-upload.js";

const DOCX_EXTENSIONS = new Set([".docx"]);
const DOC_EXTENSIONS = new Set([".doc"]);

export function createOfficeTextService() {
  async function extractFromDocx(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value?.trim() ?? "";
  }

  async function extractFromDoc(buffer) {
    const extractor = new WordExtractor();
    const document = await extractor.extract(buffer);
    return document.getBody()?.trim() ?? "";
  }

  /**
   * @param {Buffer} buffer
   * @param {{ originalname?: string }} metadata
   */
  async function extractText(buffer, { originalname }) {
    const ext = extensionOf(originalname);

    if (DOCX_EXTENSIONS.has(ext)) {
      return extractFromDocx(buffer);
    }

    if (DOC_EXTENSIONS.has(ext)) {
      return extractFromDoc(buffer);
    }

    return "";
  }

  function supportsExtension(originalname) {
    const ext = extensionOf(originalname);
    return DOCX_EXTENSIONS.has(ext) || DOC_EXTENSIONS.has(ext);
  }

  return { extractText, supportsExtension };
}
