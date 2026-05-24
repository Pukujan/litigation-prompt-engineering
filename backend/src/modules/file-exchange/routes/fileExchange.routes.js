import { Router } from "express";

export function createFileExchangeRoutes({ fileExchange }) {
  const router = Router();

  router.post("/clear", async (req, res, next) => {
    try {
      const scope = req.body?.scope ?? "all";
      const result = await fileExchange.clear({
        scope,
        confirm: req.body?.confirm === true,
        dryRun: req.body?.dryRun === true,
        keepLatestConsolidated: req.body?.keepLatestConsolidated !== false,
        keepTemplates: req.body?.keepTemplates !== false
      });
      res.status(result.dryRun ? 200 : 201).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
