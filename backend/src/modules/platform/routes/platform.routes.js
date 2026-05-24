import { Router } from "express";

export function createPlatformRoutes({ platform, onboarding, planning }) {
  const router = Router();

  router.get("/modules", (_req, res) => {
    res.json({ modules: platform.listModules() });
  });

  router.get("/onboarding/pipeline-guide", async (req, res, next) => {
    try {
      const format = req.query.format === "md" ? "md" : "json";
      const guide = await onboarding.getGuide(format);
      if (format === "md") {
        res.setHeader("Content-Type", "text/markdown; charset=utf-8");
        if (req.query.download === "true") {
          res.setHeader(
            "Content-Disposition",
            'attachment; filename="pipeline-guide.md"'
          );
        }
        res.send(guide.body);
        return;
      }
      res.json(guide.body);
    } catch (error) {
      next(error);
    }
  });

  router.get("/planning", async (_req, res, next) => {
    try {
      const plans = await planning.listPlans();
      res.json({ plans });
    } catch (error) {
      next(error);
    }
  });

  router.get("/planning/:planId", async (req, res, next) => {
    try {
      const manifest = await planning.readManifest(req.params.planId);
      res.json(manifest);
    } catch (error) {
      next(error);
    }
  });

  router.get("/planning/:planId/download", async (req, res, next) => {
    try {
      const format = req.query.format === "json" ? "json" : "md";
      if (format === "json") {
        const manifest = await planning.readManifest(req.params.planId);
        res.json(manifest);
        return;
      }
      const body = await planning.buildDownloadMarkdown(req.params.planId);
      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${req.params.planId}-planning.md"`
      );
      res.send(body);
    } catch (error) {
      next(error);
    }
  });

  router.post("/planning/:planId/finalize", async (req, res, next) => {
    try {
      const { slug, status } = req.body ?? {};
      if (!slug) {
        res.status(400).json({ error: "slug is required in body" });
        return;
      }
      const manifest = await planning.finalizePlan({
        planId: req.params.planId,
        slug,
        status: status ?? "approved"
      });
      res.status(201).json(manifest);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
