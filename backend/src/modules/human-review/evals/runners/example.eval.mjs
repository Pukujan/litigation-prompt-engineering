import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getHealth } from "../../services/health.service.js";
import { renderPrompt } from "../../../../shared/ai/prompt-registry.js";
import * as humanReviewPrompt from "../../prompts/templates/human-review.prompt.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

test("human-review: health service matches dataset", () => {
  const dataset = JSON.parse(
    readFileSync(join(__dirname, "../datasets/example.cases.json"), "utf8")
  );
  const expected = dataset.cases[0].expect;
  const result = getHealth({ name: "human-review" });
  assert.equal(result.status, expected.status);
  assert.equal(result.module, "human-review");
});

test("human-review: prompt limits mandatory review to visual uncertainty", () => {
  const rendered = renderPrompt(humanReviewPrompt.template, {
    documentText: "Illegible handwriting on page 2",
    documentMetadata: '{"pageCount":3}'
  });
  assert.match(rendered, /handwriting/);
  assert.match(rendered, /Do NOT require human review merely because/);
});
