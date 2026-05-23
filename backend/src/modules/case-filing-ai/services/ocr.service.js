const OCR_PROMPT =
  "Extract all readable text from this document image. Return plain text only, preserving line breaks where obvious. Do not summarize or add commentary.";

function imageMimeType({ mimetype, originalname }) {
  if (mimetype?.startsWith("image/")) {
    return mimetype;
  }

  const lower = String(originalname || "").toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".tif") || lower.endsWith(".tiff")) return "image/tiff";
  if (lower.endsWith(".bmp")) return "image/bmp";
  return "image/png";
}

function toDataUrl(buffer, mimeType) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export function createOcrService({ openRouter }) {
  async function extractFromImageBuffer(buffer, { mimetype, originalname, pageLabel = null }) {
    const mimeType = imageMimeType({ mimetype, originalname });
    const prompt = pageLabel
      ? `${OCR_PROMPT}\n\nThis image is ${pageLabel}.`
      : OCR_PROMPT;

    const completion = await openRouter.visionOcrCompletion({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: toDataUrl(buffer, mimeType) }
            }
          ]
        }
      ]
    });

    return {
      text: completion.content.trim(),
      model: completion.model,
      usage: completion.usage
    };
  }

  async function renderPdfPageImages(buffer, { maxPages = 5 } = {}) {
    const [{ createCanvas }, pdfjs] = await Promise.all([
      import("@napi-rs/canvas"),
      import("pdfjs-dist/legacy/build/pdf.mjs")
    ]);

    const doc = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      disableWorker: true,
      useSystemFonts: true
    }).promise;
    const pageCount = Math.min(doc.numPages, maxPages);
    const images = [];

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const context = canvas.getContext("2d");

      await page.render({
        canvasContext: context,
        viewport
      }).promise;

      images.push({
        pageNumber,
        buffer: canvas.toBuffer("image/png"),
        mimetype: "image/png",
        originalname: `page-${pageNumber}.png`
      });
    }

    return { images, totalPages: doc.numPages, renderedPages: pageCount };
  }

  async function extractFromPdf(buffer, metadata) {
    const { images, totalPages, renderedPages } = await renderPdfPageImages(buffer);
    const pageTexts = [];

    for (const image of images) {
      const result = await extractFromImageBuffer(image.buffer, {
        mimetype: image.mimetype,
        originalname: image.originalname,
        pageLabel: `page ${image.pageNumber} of ${totalPages} from ${metadata.originalname || "upload.pdf"}`
      });
      if (result.text) {
        pageTexts.push(result.text);
      }
    }

    return {
      text: pageTexts.join("\n\n").trim(),
      model: openRouter.visionOcrModel,
      pageCount: totalPages,
      renderedPages,
      ocrPages: images.map((image) => image.pageNumber)
    };
  }

  async function extractText(buffer, { originalname, mimetype, fileKind }) {
    if (fileKind === "image") {
      return extractFromImageBuffer(buffer, { mimetype, originalname });
    }

    if (fileKind === "pdf") {
      return extractFromPdf(buffer, { originalname, mimetype });
    }

    return null;
  }

  return { extractText, extractFromImageBuffer, extractFromPdf, OCR_PROMPT };
}
