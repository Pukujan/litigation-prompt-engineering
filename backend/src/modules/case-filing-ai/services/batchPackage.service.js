import { cp, mkdir, readFile, readdir, writeFile } from "fs/promises";
import { join, relative } from "path";
import { AppError } from "../../../shared/http/errors.js";
import { copyGoldenFixtures } from "./evalBundle.service.js";

async function readJsonIfExists(path) {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function buildRulesAppliedSummary(batchDir, documentOutputs) {
  const partRulePath = join(batchDir, "rule", "part-rules.txt");
  let partRuleText = null;
  try {
    partRuleText = await readFile(partRulePath, "utf8");
  } catch {
    // optional
  }

  const perDocument = [];
  for (const doc of documentOutputs) {
    if (!doc?.docKey) continue;
    perDocument.push({
      docKey: doc.docKey,
      docIndex: doc.docIndex,
      originalName: doc.originalName,
      status: doc.status,
      ruleSourcesChecked: doc.ruleSourcesChecked ?? [],
      ruleSourcesApplied: doc.ruleSourcesApplied ?? doc.ruleSourcesChecked ?? [],
      rankedRules: (doc.rankedRules ?? []).map((r) => ({
        ruleId: r.ruleId,
        name: r.name ?? r.title,
        authority: r.authority
      })),
      pipelineVersions: doc.pipelineVersions ?? doc.runMetadata?.pipelineVersions ?? null,
      textSourceUsed: doc.textSourceUsed ?? null,
      extractionQuality: doc.extractionQuality ?? null
    });
  }

  return {
    partRule: { hasText: Boolean(partRuleText?.trim()), length: partRuleText?.length ?? 0 },
    perDocument
  };
}

export function createBatchPackageService({
  store,
  uploadBatch,
  caseExportRootDir,
  repoRoot,
  resolveGoldenDatasetDir,
  defaultGoldenCaseId
}) {
  function packageDirFor(batchId) {
    return join(caseExportRootDir, `${batchId}-package`);
  }

  async function buildBatchPackage(batchId, { includeGolden = false, goldenCaseId } = {}) {
    await store.assertBatchExists(batchId);
    const results = await uploadBatch.getBatchResults(batchId);
    const evals = await uploadBatch.getBatchEvals(batchId);

    const packagePath = packageDirFor(batchId);
    await mkdir(packagePath, { recursive: true });

    const batchSrc = join(store.batchRootDir, batchId);
    const batchDest = join(packagePath, "batch");
    await cp(batchSrc, batchDest, { recursive: true, force: true });

    const rulesApplied = await buildRulesAppliedSummary(batchSrc, results.documents ?? []);
    await mkdir(join(packagePath, "rules-applied"), { recursive: true });
    await writeFile(
      join(packagePath, "rules-applied", "per-document.json"),
      JSON.stringify(rulesApplied, null, 2)
    );
    try {
      await cp(
        join(batchSrc, "rule", "part-rules.txt"),
        join(packagePath, "rules-applied", "part-rule.txt"),
        { force: true }
      );
    } catch {
      // optional
    }

    await mkdir(join(packagePath, "evals"), { recursive: true });
    await writeFile(
      join(packagePath, "evals", "summary.json"),
      JSON.stringify({ batchId, ...evals.summary }, null, 2)
    );
    const evalSrc = join(batchSrc, "evals");
    try {
      const evalFiles = await readdir(evalSrc);
      for (const file of evalFiles) {
        if (file.endsWith(".json")) {
          await cp(join(evalSrc, file), join(packagePath, "evals", file), { force: true });
        }
      }
    } catch {
      // no evals
    }

    let goldenFiles = [];
    const caseKey = goldenCaseId || defaultGoldenCaseId;
    if (includeGolden && caseKey) {
      const goldenDir = resolveGoldenDatasetDir(caseKey);
      goldenFiles = await copyGoldenFixtures(goldenDir, join(packagePath, "golden"));
    }

    const manifest = {
      packageType: "batch",
      batchId,
      createdAt: new Date().toISOString(),
      relativePath: relative(repoRoot, packagePath),
      absolutePath: packagePath,
      includeGolden,
      goldenCaseId: includeGolden ? caseKey : null,
      goldenFiles,
      documentCount: results.documents?.length ?? 0,
      evalSummary: evals.summary,
      contents: [
        "batch/ — full batch folder (uploads, parsed-documents, outputs, evals, rule, snapshot, log)",
        "rules-applied/per-document.json",
        "rules-applied/part-rule.txt",
        "evals/summary.json",
        "evals/*.eval-report.json"
      ]
    };

    await writeFile(join(packagePath, "manifest.json"), JSON.stringify(manifest, null, 2));
    return manifest;
  }

  async function getPackageManifest(batchId) {
    const manifestPath = join(packageDirFor(batchId), "manifest.json");
    const manifest = await readJsonIfExists(manifestPath);
    if (!manifest) {
      throw new AppError(`No package built for batch ${batchId}. POST .../package first.`, 404);
    }
    return manifest;
  }

  function getPackageDirectory(batchId) {
    return packageDirFor(batchId);
  }

  return {
    buildBatchPackage,
    getPackageManifest,
    getPackageDirectory
  };
}
