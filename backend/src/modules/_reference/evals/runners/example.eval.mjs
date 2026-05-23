import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getHealth } from "../../services/health.service.js";
import { renderPrompt } from "../../../../shared/ai/prompt-registry.js";
import * as examplePrompt from "../../prompts/templates/example.prompt.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

test("_reference: health service matches dataset", () => {
  const dataset = JSON.parse(
    readFileSync(join(__dirname, "../datasets/example.cases.json"), "utf8")
  );
  const expected = dataset.cases[0].expect;
  const result = getHealth({ name: "_reference" });
  assert.equal(result.status, expected.status);
  assert.equal(result.module, "_reference");
});

test("_reference: example prompt renders variables", () => {
  const rendered = renderPrompt(examplePrompt.template, { matterId: "MAT-001" });
  assert.match(rendered, /MAT-001/);
});
