import { Router } from "express";
import { createHealthRoutes } from "./health.routes.js";
import { createPipelineRoutes } from "./pipeline.routes.js";

export function createModuleRouter({ config, context }) {
  const router = Router();
  router.use(createHealthRoutes({ config, context }));
  router.use(createPipelineRoutes({ config, context }));
  return router;
}
