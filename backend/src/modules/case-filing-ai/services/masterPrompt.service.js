import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { AppError } from "../../../shared/http/errors.js";
import { resolvePromptVersion } from "../prompts/promptVersions.js";
import { prepareSnapshotForPrompt, truncateDocumentText } from "../utils/snapshotContext.js";
import { normalizeMasterOutput } from "../utils/normalizeMasterOutput.js";
import {
  validateMasterOutput,
  formatValidationErrors
} from "../utils/validateMasterOutput.js";

const moduleDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const RULE_PARSE_PROMPT_PATH = join(moduleDir, "prompts", "rule-parse.prompt.md");

export const NO_PART_RULE_SENTINEL =
  "(none supplied — extract applicable part rules from the current document if present)";

const JSON_RETRY_SYSTEM =
  "You are a legal case filing extraction agent. Your previous response was not valid JSON. Return only a single valid JSON object with no markdown fences or commentary.";

export function createMasterPromptService({
  openRouter,
  promptVersion = "v1",
  jsonRetry = true,
  jsonObjectMode = false,
  maxDocumentTextChars = 120_000,
  omitAuditNotesInPrompt = true
}) {
  const versionSpec = resolvePromptVersion(promptVersion);

  function loadTemplate() {
    return readFileSync(versionSpec.masterCaseFilingPath, "utf8");
  }

  function renderTemplate(template, variables) {
    let output = template;
    for (const [key, value] of Object.entries(variables)) {
      output = output.replaceAll(`{{${key}}}`, String(value ?? ""));
    }
    return output;
  }

  function extractJsonCandidate(content) {
    let trimmed = String(content ?? "").trim();
    if (!trimmed) return "";

    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced) {
      return fenced[1].trim();
    }

    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return trimmed.slice(start, end + 1);
    }

    return trimmed;
  }

  function repairJsonCandidate(text) {
    return text
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/\u201c|\u201d/g, '"')
      .replace(/\u2018|\u2019/g, "'");
  }

  function parseJsonResponse(content) {
    const candidate = extractJsonCandidate(content);
    const attempts = [candidate, repairJsonCandidate(candidate)];

    let lastError = null;
    for (const attempt of attempts) {
      if (!attempt) continue;
      try {
        return JSON.parse(attempt);
      } catch (error) {
        lastError = error;
      }
    }

    const preview = String(content ?? "")
      .replace(/\s+/g, " ")
      .slice(0, 240);
    const detail = lastError?.message ? ` (${lastError.message})` : "";
    throw new AppError(
      `Master prompt returned invalid JSON${detail}. Response preview: ${preview}`,
      502
    );
  }

  async function requestMasterCompletion(messages, { useJsonObject = false } = {}) {
    return openRouter.chatCompletion({
      messages,
      responseFormat: useJsonObject && jsonObjectMode ? { type: "json_object" } : undefined
    });
  }

  function assertSchemaValid(parsed, { allowRetry }) {
    const { valid, errors } = validateMasterOutput(parsed, versionSpec.id);
    if (valid) return parsed;
    const detail = formatValidationErrors(errors);
    const err = new AppError(`Master prompt output failed schema validation: ${detail}`, 502);
    err.validationErrors = errors;
    if (allowRetry) throw err;
    throw err;
  }

  async function completeAndParse(messages, { allowRetry = true } = {}) {
    const completion = await requestMasterCompletion(messages, {
      useJsonObject: true
    });

    try {
      const parsed = parseJsonResponse(completion.content);
      return { completion, parsed: assertSchemaValid(parsed, { allowRetry: false }) };
    } catch (firstError) {
      if (!jsonRetry || !allowRetry) {
        throw firstError;
      }

      const validationHint =
        firstError.validationErrors?.length > 0
          ? ` Schema errors: ${formatValidationErrors(firstError.validationErrors)}.`
          : "";

      const retryCompletion = await requestMasterCompletion(
        [
          { role: "system", content: JSON_RETRY_SYSTEM },
          messages[1],
          { role: "assistant", content: completion.content ?? "" },
          {
            role: "user",
            content:
              `Your response was not valid JSON or did not match the required schema.${validationHint} Return only a single valid JSON object. No markdown, no explanation.`
          }
        ],
        { useJsonObject: true }
      );

      const parsed = parseJsonResponse(retryCompletion.content);
      return {
        completion: retryCompletion,
        parsed: assertSchemaValid(parsed, { allowRetry: false })
      };
    }
  }

  async function parsePartRule(partRuleText) {
    const template = readFileSync(RULE_PARSE_PROMPT_PATH, "utf8");
    const rendered = renderTemplate(template, { partRuleText });

    const completion = await openRouter.chatCompletion({
      messages: [
        {
          role: "system",
          content: "You parse court part rules into structured JSON. Return strict JSON only."
        },
        { role: "user", content: rendered }
      ]
    });

    return parseJsonResponse(completion.content);
  }

  function buildPromptVariables({
    documentText,
    fileMetadata,
    priorCaseSnapshot,
    partRuleText,
    hasUserPartRule,
    rankedRules = ""
  }) {
    const effectivePartRuleText = hasUserPartRule
      ? partRuleText.trim()
      : NO_PART_RULE_SENTINEL;

    const snapshotForPrompt = prepareSnapshotForPrompt(priorCaseSnapshot, {
      omitAuditNotes: omitAuditNotesInPrompt
    });

    return {
      documentText: truncateDocumentText(documentText, maxDocumentTextChars),
      fileMetadata: JSON.stringify(fileMetadata, null, 2),
      priorCaseSnapshot: JSON.stringify(snapshotForPrompt, null, 2),
      partRuleText: effectivePartRuleText,
      rankedRules: rankedRules || "(none)"
    };
  }

  async function processDocument({
    documentText,
    fileMetadata,
    priorCaseSnapshot,
    partRuleText,
    hasUserPartRule = Boolean(partRuleText?.trim()),
    rankedRules = ""
  }) {
    const template = loadTemplate();
    const rendered = renderTemplate(
      template,
      buildPromptVariables({
        documentText,
        fileMetadata,
        priorCaseSnapshot,
        partRuleText,
        hasUserPartRule,
        rankedRules
      })
    );

    const messages = [
      {
        role: "system",
        content: "You are a legal case filing extraction agent. Return strict JSON only."
      },
      { role: "user", content: rendered }
    ];

    const { completion, parsed } = await completeAndParse(messages);

    const normalized = normalizeMasterOutput(parsed);

    return {
      model: completion.model,
      usage: completion.usage,
      result: normalized,
      rawResult: parsed,
      promptVersion: versionSpec.id
    };
  }

  return {
    processDocument,
    normalizeMasterOutput,
    parsePartRule,
    parseJsonResponse,
    renderTemplate,
    loadTemplate,
    NO_PART_RULE_SENTINEL,
    promptVersion: versionSpec.id
  };
}
