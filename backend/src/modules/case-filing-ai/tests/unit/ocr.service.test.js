import { test } from "node:test";
import assert from "node:assert/strict";
import { createOpenRouterClient } from "../../adapters/openrouter.client.js";
import { createOcrService } from "../../services/ocr.service.js";

test("visionOcrCompletion always uses MODEL_VISION_OCR", async () => {
  let requestedModel = null;
  const originalFetch = global.fetch;

  global.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    requestedModel = body.model;
    return {
      ok: true,
      json: async () => ({
        model: body.model,
        choices: [{ message: { content: "Summons and Complaint" } }]
      })
    };
  };

  const openRouter = createOpenRouterClient({
    apiKey: "test-key",
    model: "text/reasoning-model",
    visionOcrModel: "qwen/qwen2.5-vl-7b-instruct",
    siteUrl: "http://localhost",
    appName: "test"
  });
  const ocr = createOcrService({ openRouter });

  try {
    const result = await ocr.extractFromImageBuffer(Buffer.from("fake-image"), {
      mimetype: "image/png",
      originalname: "scan.png"
    });

    assert.equal(requestedModel, "qwen/qwen2.5-vl-7b-instruct");
    assert.equal(result.model, "qwen/qwen2.5-vl-7b-instruct");
    assert.match(result.text, /Summons/);
  } finally {
    global.fetch = originalFetch;
  }
});

test("chatCompletion uses MODEL_TEXT_REASONING, not vision OCR model", async () => {
  let requestedModel = null;
  const originalFetch = global.fetch;

  global.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    requestedModel = body.model;
    return {
      ok: true,
      json: async () => ({
        model: body.model,
        choices: [{ message: { content: "{}" } }]
      })
    };
  };

  const openRouter = createOpenRouterClient({
    apiKey: "test-key",
    model: "text/reasoning-model",
    visionOcrModel: "qwen/qwen2.5-vl-7b-instruct",
    siteUrl: "http://localhost",
    appName: "test"
  });

  try {
    await openRouter.chatCompletion({ messages: [{ role: "user", content: "hello" }] });
    assert.equal(requestedModel, "text/reasoning-model");
  } finally {
    global.fetch = originalFetch;
  }
});
