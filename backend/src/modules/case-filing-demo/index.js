import { join } from "path";
import { fileURLToPath } from "url";
import { createGoldenDatasetService } from "../case-filing-ai/services/goldenDataset.service.js";
import { createEvalRunnerService } from "../case-filing-ai/services/evalRunner.service.js";
import { createCaseFilingDemoRoutes } from "./routes/caseFilingDemo.routes.js";
import { createCaseFilingDemoService } from "./services/caseFilingDemo.service.js";

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "../../../..");

export function register(app) {
  const createEvalRunnerForCase = (goldenCaseId) => {
    const goldenDatasetDir = join(repoRoot, "evals/golden", goldenCaseId);
    const goldenDataset = createGoldenDatasetService({
      goldenDatasetDir,
      caseId: goldenCaseId
    });
    return createEvalRunnerService({ goldenDataset });
  };

  const demo = createCaseFilingDemoService({ repoRoot, createEvalRunnerForCase });

  app.use("/api/case-filing-demo", createCaseFilingDemoRoutes({ demo }));
}
