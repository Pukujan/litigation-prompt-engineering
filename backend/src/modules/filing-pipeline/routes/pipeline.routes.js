import { Router } from "express";
import { getPipelineOverview } from "../services/pipeline-steps.service.js";

export function createPipelineRoutes({ config }) {
  const router = Router();
  router.get("/steps", (_req, res) => {
    res.json(getPipelineOverview(config));
  });
  return router;
}
