import { Router } from "express";
import { createHealthRoutes } from "./health.routes.js";
import { createCaseFilingRoutes } from "./caseFiling.routes.js";

export function createModuleRouter({
  config,
  context,
  uploadBatch,
  ruleText,
  evalBundle,
  caseData,
  parsedDocumentCache
}) {
  const router = Router();
  router.use(createHealthRoutes({ config, context }));
  router.use(
    createCaseFilingRoutes({
      config,
      uploadBatch,
      ruleText,
      evalBundle,
      caseData,
      parsedDocumentCache
    })
  );
  return router;
}
