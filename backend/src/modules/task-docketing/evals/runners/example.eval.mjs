import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getHealth } from "../../services/health.service.js";
import { renderPrompt } from "../../../../shared/ai/prompt-registry.js";
import * as taskDeadlinePrompt from "../../prompts/templates/task-deadline.prompt.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

test("task-docketing: health service matches dataset", () => {
  const dataset = JSON.parse(
    readFileSync(join(__dirname, "../datasets/example.cases.json"), "utf8")
  );
  const expected = dataset.cases[0].expect;
  const result = getHealth({ name: "task-docketing" });
  assert.equal(result.status, expected.status);
  assert.equal(result.module, "task-docketing");
});

test("task-docketing: task-deadline prompt renders document text", () => {
  const rendered = renderPrompt(taskDeadlinePrompt.template, {
    documentText: "Order to appear",
    ruleContext: "[]",
    caseContext: "{}"
  });
  assert.match(rendered, /Order to appear/);
  assert.match(rendered, /ai_extracted_unreviewed/);
});
