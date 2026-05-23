import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getHealth } from "../../services/health.service.js";
import { renderPrompt } from "../../../../shared/ai/prompt-registry.js";
import * as filingTextVaultPrompt from "../../prompts/templates/filing-text-vault.prompt.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

test("filing-text-vault: health service matches dataset", () => {
  const dataset = JSON.parse(
    readFileSync(join(__dirname, "../datasets/example.cases.json"), "utf8")
  );
  const expected = dataset.cases[0].expect;
  const result = getHealth({ name: "filing-text-vault" });
  assert.equal(result.status, expected.status);
  assert.equal(result.module, "filing-text-vault");
});

test("filing-text-vault: prompt renders document and case ids", () => {
  const rendered = renderPrompt(filingTextVaultPrompt.template, {
    documentId: "doc-001",
    caseId: "case-001"
  });
  assert.match(rendered, /doc-001/);
  assert.match(rendered, /embedded_text/);
});
