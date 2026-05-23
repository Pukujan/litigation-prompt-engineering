import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getHealth } from "../../services/health.service.js";
import { renderPrompt } from "../../../../shared/ai/prompt-registry.js";
import * as caseStateUpdatePrompt from "../../prompts/templates/case-state-update.prompt.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

test("case-workflow: health service matches dataset", () => {
  const dataset = JSON.parse(
    readFileSync(join(__dirname, "../datasets/example.cases.json"), "utf8")
  );
  const expected = dataset.cases[0].expect;
  const result = getHealth({ name: "case-workflow" });
  assert.equal(result.status, expected.status);
  assert.equal(result.module, "case-workflow");
});

test("case-workflow: case-state-update prompt renders snapshot inputs", () => {
  const rendered = renderPrompt(caseStateUpdatePrompt.template, {
    previousSnapshot: "{}",
    documentExtraction: "{}",
    documentTasks: "[]",
    humanReviewItems: "[]",
    textVersions: "[]"
  });
  assert.match(rendered, /Preserve prior confirmed facts/);
});
