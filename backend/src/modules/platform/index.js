import { join } from "path";
import { fileURLToPath } from "url";
import { createPlatformRoutes } from "./routes/platform.routes.js";
import { createPlatformService } from "./services/platform.service.js";
import { createOnboardingService } from "./services/onboarding.service.js";
import { createPlanningService } from "./services/planning.service.js";

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "../../../..");

export function register(app) {
  const platform = createPlatformService();
  const onboarding = createOnboardingService({ repoRoot });
  const planning = createPlanningService({ repoRoot });
  const router = createPlatformRoutes({ platform, onboarding, planning });
  app.use("/api/platform", router);
}
