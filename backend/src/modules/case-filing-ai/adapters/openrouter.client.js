import { AppError } from "../../../shared/http/errors.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export function createOpenRouterClient({ apiKey, model, visionOcrModel, siteUrl, appName }) {
  function assertConfigured() {
    if (!apiKey) {
      throw new AppError(
        "OpenRouter API key is not configured. Set OPENROUTER_API_KEY in backend/.env",
        503
      );
    }
  }

  async function requestCompletion({
    messages,
    model: selectedModel,
    temperature = 0.2,
    responseFormat
  }) {
    assertConfigured();

    const body = {
      model: selectedModel,
      messages,
      temperature
    };
    if (responseFormat?.type === "json_object") {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": siteUrl,
        "X-Title": appName
      },
      body: JSON.stringify(body)
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail =
        payload?.error?.message || payload?.message || `OpenRouter request failed (${response.status})`;
      throw new AppError(detail, response.status >= 500 ? 502 : 400);
    }

    const content = payload?.choices?.[0]?.message?.content;
    if (!content) {
      throw new AppError("OpenRouter returned an empty response", 502);
    }

    return {
      model: payload.model || selectedModel,
      content,
      usage: payload.usage ?? null,
      raw: payload
    };
  }

  async function chatCompletion({
    messages,
    model: modelOverride,
    temperature = 0.2,
    responseFormat
  }) {
    return requestCompletion({
      messages,
      model: modelOverride || model,
      temperature,
      responseFormat
    });
  }

  async function visionOcrCompletion({ messages, temperature = 0 }) {
    if (!visionOcrModel) {
      throw new AppError(
        "Vision OCR model is not configured. Set MODEL_VISION_OCR in backend/.env",
        503
      );
    }

    return requestCompletion({
      messages,
      model: visionOcrModel,
      temperature
    });
  }

  return { chatCompletion, visionOcrCompletion, visionOcrModel };
}
