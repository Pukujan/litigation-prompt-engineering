import { createModuleRouter } from "./routes/index.js";
import { registerModuleEvents } from "./events/index.js";
import { getModuleConfig } from "./config/index.js";
import { createFileExchangeFacade } from "./services/fileExchange.facade.js";

export function register(app, context) {
  const config = getModuleConfig();
  const fileExchange = createFileExchangeFacade({ config });
  const router = createModuleRouter({ config, fileExchange });
  app.use("/api/file-exchange", router);
  registerModuleEvents(context);
}
