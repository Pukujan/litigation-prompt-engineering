import { Router } from "express";
import multer from "multer";
import { AppError } from "../../../shared/http/errors.js";

function assertApiEnabled(config) {
  if (!config.apiEnabled) {
    throw new AppError("Golden authoring API is disabled. Set GOLDEN_AUTHORING_API_ENABLED=true", 503);
  }
}

function assertApiKey(config, req) {
  if (!config.apiKey) return;
  const header = req.headers["x-golden-authoring-key"] ?? req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (header !== config.apiKey) {
    throw new AppError("Invalid golden authoring API key", 401);
  }
}

export function createGoldenAuthoringRoutes({ config, authoring, promote, goldenVersion }) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: config.maxUploadBytes }
  });

  const router = Router();

  router.use((req, res, next) => {
    try {
      assertApiEnabled(config);
      assertApiKey(config, req);
      next();
    } catch (error) {
      next(error);
    }
  });

  router.get("/health", (req, res) => {
    res.json({
      module: "golden-authoring",
      apiEnabled: config.apiEnabled,
      authorModel: config.openRouter.model,
      stagingRoot: config.stagingRoot
    });
  });

  router.post(
    "/process-batch",
    upload.fields([
      { name: "files", maxCount: 50 },
      { name: "partRuleFile", maxCount: 1 }
    ]),
    async (req, res, next) => {
      try {
        const caseSlug = req.body?.caseSlug ?? req.body?.caseId;
        const legalCaseId = req.body?.legalCaseId;
        const purpose = req.body?.purpose ?? goldenVersion.PURPOSE_DEFAULT;
        const importStamp = req.body?.importStamp ?? null;
        const partRuleText = req.body?.partRuleText ?? "";

        if (!caseSlug || !legalCaseId) {
          throw new AppError("caseSlug and legalCaseId are required", 400);
        }

        let caseIdentity;
        try {
          caseIdentity = JSON.parse(req.body?.caseIdentity ?? "{}");
        } catch {
          throw new AppError("caseIdentity must be valid JSON", 400);
        }

        let snapshotCheckpoints;
        try {
          snapshotCheckpoints = req.body?.snapshotCheckpoints
            ? JSON.parse(req.body.snapshotCheckpoints)
            : [1, 2, 4, 8, 12, 14];
        } catch {
          throw new AppError("snapshotCheckpoints must be valid JSON array", 400);
        }

        const { caseId, version } = await authoring.allocateAndPrepare({
          caseSlug,
          legalCaseId,
          purpose,
          manifest: { snapshotCheckpoints, caseIdentity }
        });

        const filingFiles = req.files?.files ?? [];
        if (!filingFiles.length) {
          throw new AppError("At least one file is required in 'files' field", 400);
        }

        const result = await authoring.processAuthoringBatch({
          caseId,
          version,
          legalCaseId,
          caseIdentity,
          files: filingFiles,
          manifest: { snapshotCheckpoints, caseIdentity },
          importStamp,
          partRuleText
        });

        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  router.get("/runs/:runId", async (req, res, next) => {
    try {
      const run = await authoring.getRun(req.params.runId);
      if (!run) {
        throw new AppError("Authoring run not found", 404);
      }
      res.json(run);
    } catch (error) {
      next(error);
    }
  });

  router.post("/promote", async (req, res, next) => {
    try {
      const { caseId, version, confirm } = req.body ?? {};
      if (!caseId || !version) {
        throw new AppError("caseId and version are required", 400);
      }
      if (confirm !== true) {
        throw new AppError('promote requires confirm: true in body', 400);
      }
      const result = await promote.promote({
        caseId,
        version,
        promotedBy: "api",
        reason: req.body?.reason ?? ""
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get("/cases/:caseId/versions", async (req, res, next) => {
    try {
      const versions = await promote.listVersions(req.params.caseId);
      res.json(versions);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
