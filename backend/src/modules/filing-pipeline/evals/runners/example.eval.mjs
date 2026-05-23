import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getHealth } from "../../services/health.service.js";
import { getPipelineOverview } from "../../services/pipeline-steps.service.js";
import { renderPrompt } from "../../../../shared/ai/prompt-registry.js";
import * as orchestratorPrompt from "../../prompts/templates/orchestrator.prompt.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

test("filing-pipeline: health service matches dataset", () => {
  const dataset = JSON.parse(
    readFileSync(join(__dirname, "../datasets/example.cases.json"), "utf8")
  );
  const expected = dataset.cases[0].expect;
  const result = getHealth({ name: "filing-pipeline" });
  assert.equal(result.status, expected.status);
  assert.equal(result.module, "filing-pipeline");
});

test("filing-pipeline: orchestrator prompt renders variables", () => {
  const rendered = renderPrompt(orchestratorPrompt.template, {
    documentMetadata: "doc-001",
    caseStateSnapshot: "{}",
    caseContext: "{}",
    relevantRules: "[]"
  });
  assert.match(rendered, /Process ONE filing document at a time/);
});

test("filing-pipeline: exposes 16 single-document steps", () => {
  const overview = getPipelineOverview({ name: "filing-pipeline" });
  assert.equal(overview.stepCount, 16);
  assert.equal(overview.processingMode, "one-document-at-a-time");
});
