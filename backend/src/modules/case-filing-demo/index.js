import { join } from "path";
import { fileURLToPath } from "url";
import { createGoldenDatasetService } from "../case-filing-ai/services/goldenDataset.service.js";
import { createEvalRunnerService } from "../case-filing-ai/services/evalRunner.service.js";
import { createCaseFilingDemoRoutes } from "./routes/caseFilingDemo.routes.js";
import { createCaseFilingDemoService } from "./services/caseFilingDemo.service.js";

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "../../../..");

export function register(app) {
  const goldenCaseId = "case_001_rule_authority_v002";
  const goldenDatasetDir = join(repoRoot, "evals/golden", goldenCaseId);
  const fixtureDir = join(
    repoRoot,
    "backend/src",
    "modules",
    "case-filing-ai",
    "tests/fixtures/rule-authority-v002"
  );
  const goldenDataset = createGoldenDatasetService({
    goldenDatasetDir,
    caseId: goldenCaseId
  });
  const evalRunner = createEvalRunnerService({ goldenDataset });
  const demo = createCaseFilingDemoService({
    repoRoot,
    goldenCaseId,
    goldenDatasetDir,
    fixtureDir,
    evalRunner
  });

  app.use("/api/case-filing-demo", createCaseFilingDemoRoutes({ demo }));
}
