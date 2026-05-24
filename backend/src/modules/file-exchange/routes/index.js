import { Router } from "express";
import { createHealthRoutes } from "./health.routes.js";
import { createFileExchangeRoutes } from "./fileExchange.routes.js";

export function createModuleRouter({ config, fileExchange }) {
  const router = Router();
  router.use(createHealthRoutes({ config }));
  router.use(createFileExchangeRoutes({ fileExchange }));
  return router;
}
