import { createModuleRouter } from "./routes/index.js";
import { registerModuleEvents } from "./events/index.js";
import { moduleConfig } from "./config/index.js";

export function register(app, context) {
  const router = createModuleRouter({ config: moduleConfig, context });
  app.use("/api/filing-text-vault", router);
  registerModuleEvents(context);
}
