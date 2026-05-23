import { AppError } from "../../../shared/http/errors.js";
import { buildExtractionFailureMessage } from "../utils/extractionErrors.js";

export function createRuleTextService({ documentText }) {
  async function extractFromUpload(file) {
    if (!file?.buffer?.length) {
      throw new AppError("Rule file is required", 400);
    }

    const { text, fileKind, extractionQuality } = await documentText.extractText(file.buffer, {
      originalname: file.originalname,
      mimetype: file.mimetype
    });

    const trimmed = text?.trim() || "";
    if (!trimmed) {
      throw new AppError(
        buildExtractionFailureMessage({
          fileKind,
          extractionQuality,
          originalName: file.originalname
        }),
        422
      );
    }

    return {
      text: trimmed,
      fileKind,
      extractionQuality,
      originalName: file.originalname
    };
  }

  return { extractFromUpload };
}
