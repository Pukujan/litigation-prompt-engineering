import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { createGoldenVersionService } from "../../services/goldenVersion.service.js";

test("caseIdFromVersion replaces synthetic_case prefix with case slug", () => {
  const svc = createGoldenVersionService({
    stagingRoot: "/tmp/staging",
    goldenRoot: "/tmp/golden"
  });
  assert.equal(
    svc.caseIdFromVersion("synthetic_case_002_rule_authority_v001", "case_002"),
    "case_002_rule_authority_v001"
  );
});

test("allocateVersionId increments vNNN suffix", async () => {
  const root = await mkdtemp(join(tmpdir(), "golden-ver-"));
  const stagingRoot = join(root, "staging");
  const goldenRoot = join(root, "golden");
  const caseId = "case_002_rule_authority_v001";
  const v1 = "synthetic_case_002_rule_authority_v001";
  await mkdir(join(stagingRoot, caseId, v1), { recursive: true });
  await writeFile(join(stagingRoot, caseId, v1, "authoring_run.json"), "{}", "utf8");

  const svc = createGoldenVersionService({ stagingRoot, goldenRoot });
  const next = await svc.allocateVersionId({
    legalCaseId: "synthetic_case_002",
    purpose: "rule_authority"
  });
  assert.equal(next, "synthetic_case_002_rule_authority_v002");
});
