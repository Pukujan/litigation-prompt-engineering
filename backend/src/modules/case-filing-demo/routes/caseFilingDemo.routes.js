import { Router } from "express";
import { createReadStream } from "fs";
import { AppError } from "../../../shared/http/errors.js";

export function createCaseFilingDemoRoutes({ demo }) {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({
      module: "case-filing-demo",
      status: "ok",
      mode: "multi-case-demo",
      cases: ["case_001_rule_authority_v002", "case_002_queens_catapano_fox_v002"]
    });
  });

  router.get("/cases", async (_req, res, next) => {
    try {
      res.json(await demo.listCases());
    } catch (error) {
      next(error);
    }
  });

  router.get("/cases/:caseId", async (req, res, next) => {
    try {
      res.json(await demo.getCaseDetail(req.params.caseId));
    } catch (error) {
      next(error);
    }
  });

  router.get("/cases/:caseId/bundle", async (req, res, next) => {
    try {
      res.json(await demo.getCachedBundle(req.params.caseId));
    } catch (error) {
      next(error);
    }
  });

  router.get("/cases/:caseId/documents/:docKey/source", async (req, res, next) => {
    try {
      const source = await demo.getDocumentSource(req.params.caseId, req.params.docKey);
      if (!source?.path) {
        throw new AppError("Source PDF is not available for this demo document yet.", 404);
      }
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${source.filename}"`);
      createReadStream(source.path).pipe(res);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
