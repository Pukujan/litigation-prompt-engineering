import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getHealth } from "../../services/health.service.js";
import { renderPrompt } from "../../../../shared/ai/prompt-registry.js";
import * as ruleContextPrompt from "../../prompts/templates/rule-context.prompt.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

test("court-rules: health service matches dataset", () => {
  const dataset = JSON.parse(
    readFileSync(join(__dirname, "../datasets/example.cases.json"), "utf8")
  );
  const expected = dataset.cases[0].expect;
  const result = getHealth({ name: "court-rules" });
  assert.equal(result.status, expected.status);
  assert.equal(result.module, "court-rules");
});

test("court-rules: rule-context prompt renders supplied rules", () => {
  const rendered = renderPrompt(ruleContextPrompt.template, {
    suppliedRules: "[]",
    caseContext: "{}",
    documentContext: "{}"
  });
  assert.match(rendered, /rule_context_missing/);
});
