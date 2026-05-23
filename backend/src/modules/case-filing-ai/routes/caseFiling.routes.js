import { Router } from "express";
import multer from "multer";
import { AppError } from "../../../shared/http/errors.js";
import { validateParsedReviewPatch } from "../schemas/parsed-document.schema.js";

export function createCaseFilingRoutes({
  config,
  uploadBatch,
  ruleText,
  evalBundle,
  caseData,
  parsedDocumentCache
}) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: config.maxUploadBytes }
  });

  const router = Router();

  router.post("/extract-rule-text", upload.single("file"), async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError("Rule file is required. Use field name 'file'.", 400);
      }
      const result = await ruleText.extractFromUpload(req.file);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post("/process-batch", upload.fields([
    { name: "files", maxCount: 50 },
    { name: "partRuleFile", maxCount: 1 }
  ]), async (req, res, next) => {
    try {
      const partRuleText = req.body?.partRuleText ?? "";
      const filingFiles = req.files?.files ?? [];
      const partRuleFile = req.files?.partRuleFile?.[0] ?? null;
      const result = await uploadBatch.processBatch({
        files: filingFiles,
        partRuleText,
        partRuleFile
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get("/batches/:batchId/status", async (req, res, next) => {
    try {
      const status = await uploadBatch.getBatchStatus(req.params.batchId);
      res.json(status);
    } catch (error) {
      next(error);
    }
  });

  router.get("/batches/:batchId/results", async (req, res, next) => {
    try {
      const results = await uploadBatch.getBatchResults(req.params.batchId);
      res.json(results);
    } catch (error) {
      next(error);
    }
  });

  router.get("/batches/:batchId/parsed-documents", async (req, res, next) => {
    try {
      if (!parsedDocumentCache) {
        throw new AppError("Parsed document cache not configured", 501);
      }
      await uploadBatch.getBatchStatus(req.params.batchId);
      const docKeys = await parsedDocumentCache.listParsedDocuments(req.params.batchId);
      res.json({ batchId: req.params.batchId, documents: docKeys });
    } catch (error) {
      next(error);
    }
  });

  router.get("/batches/:batchId/parsed-documents/:documentId", async (req, res, next) => {
    try {
      if (!parsedDocumentCache) {
        throw new AppError("Parsed document cache not configured", 501);
      }
      await uploadBatch.getBatchStatus(req.params.batchId);
      const detail = await parsedDocumentCache.getParsedDetail(
        req.params.batchId,
        req.params.documentId
      );
      res.json(detail);
    } catch (error) {
      next(error);
    }
  });

  router.patch("/batches/:batchId/parsed-documents/:documentId/review-status", async (req, res, next) => {
    try {
      if (!parsedDocumentCache) {
        throw new AppError("Parsed document cache not configured", 501);
      }
      await uploadBatch.getBatchStatus(req.params.batchId);
      const validated = validateParsedReviewPatch(req.body);
      if (!validated.ok) {
        throw new AppError(validated.error, 400);
      }
      const reviewStatus = await parsedDocumentCache.updateReviewStatus(
        req.params.batchId,
        req.params.documentId,
        validated.value
      );
      res.json({ batchId: req.params.batchId, documentId: req.params.documentId, reviewStatus });
    } catch (error) {
      next(error);
    }
  });

  router.get("/batches/:batchId/evals", async (req, res, next) => {
    try {
      const evals = await uploadBatch.getBatchEvals(req.params.batchId);
      res.json(evals);
    } catch (error) {
      next(error);
    }
  });

  router.post("/batches/:batchId/evals/bundle", async (req, res, next) => {
    try {
      const bundleName = req.body?.bundleName;
      const manifest = await evalBundle.bundleEvals({
        batchIds: [req.params.batchId],
        bundleName
      });
      res.status(201).json(manifest);
    } catch (error) {
      next(error);
    }
  });

  router.post("/evals/bundle", async (req, res, next) => {
    try {
      const batchIds = req.body?.batchIds;
      const bundleName = req.body?.bundleName;
      const manifest = await evalBundle.bundleEvals({ batchIds, bundleName });
      res.status(201).json(manifest);
    } catch (error) {
      next(error);
    }
  });

  router.post("/evals/cases/:goldenCaseId/bundle", async (req, res, next) => {
    try {
      const { goldenCaseId } = req.params;
      const batchIds = req.body?.batchIds;
      const bundleName = req.body?.bundleName;
      const includeGolden = req.body?.includeGolden !== false;
      const manifest = await evalBundle.bundleCaseEvals({
        goldenCaseId,
        batchIds,
        bundleName,
        includeGolden
      });
      res.status(201).json(manifest);
    } catch (error) {
      next(error);
    }
  });

  router.get("/cases/:goldenCaseId", async (req, res, next) => {
    try {
      const inventory = await caseData.getCaseInventory(req.params.goldenCaseId);
      res.json(inventory);
    } catch (error) {
      next(error);
    }
  });

  router.post("/cases/:goldenCaseId/export", async (req, res, next) => {
    try {
      const manifest = await caseData.exportCase({
        goldenCaseId: req.params.goldenCaseId,
        batchIds: req.body?.batchIds,
        exportName: req.body?.exportName,
        includeGolden: req.body?.includeGolden === true
      });
      res.status(201).json(manifest);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/cases/:goldenCaseId", async (req, res, next) => {
    try {
      const result = await caseData.deleteCase({
        goldenCaseId: req.params.goldenCaseId,
        batchIds: req.body?.batchIds,
        confirm: req.body?.confirm === true,
        dryRun: req.body?.dryRun === true
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.use((error, _req, _res, next) => {
    if (error instanceof multer.MulterError) {
      next(new AppError(error.message, 400));
      return;
    }
    next(error);
  });

  return router;
}
