import test from "node:test";
import assert from "node:assert/strict";
import {
  catalogEntryToRuleFixture,
  extractPartNumber,
  minSourceDocNoFromCatalog
} from "../../utils/catalogToRuleFixtures.js";

test("extractPartNumber parses Civil Term Part 10", () => {
  assert.equal(extractPartNumber("Queens Medical Malpractice Part / Civil Term Part 10"), "10");
});

test("catalogEntryToRuleFixture maps case order minSourceDocNo", () => {
  const fixture = catalogEntryToRuleFixture(
    {
      ruleId: "doc_012_pc_order",
      sourceAuthority: "case_specific_order",
      sourceName: "Doc 12 PC Order",
      sourceDocNo: 12
    },
    { county: "Queens", partName: "Civil Term Part 10" }
  );
  assert.equal(fixture.authority, "case_order");
  assert.equal(fixture.minSourceDocNo, 12);
  assert.equal(fixture.county, "Queens");
});

test("minSourceDocNoFromCatalog uses minimum of array", () => {
  assert.equal(minSourceDocNoFromCatalog([13, 14]), 13);
});
