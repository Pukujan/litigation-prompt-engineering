import { useEffect, useState } from "react";
import {
  bundleBatchEvals,
  bundleCaseEvals,
  deleteCase,
  downloadBatchPackage,
  downloadCaseExport,
  exportCase,
  getBatchEvals,
  getCaseInventory
} from "../api/caseFilingApi.js";

const GOLDEN_CASES = [
  { id: "case_001", label: "case_001" },
  { id: "case_001_rule_authority_v002", label: "case_001_rule_authority_v002" }
];

function statusClass(status) {
  if (status === "pass") return "eval-status-pass";
  if (status === "partial") return "eval-status-partial";
  return "eval-status-fail";
}

function ScoreRow({ label, value }) {
  if (value == null || value === 0) return null;
  return (
    <li>
      <span>{label}</span>
      <span>{Math.round(value * 100)}%</span>
    </li>
  );
}

function EvalReportCard({ report }) {
  const mismatches = report.fieldResults?.filter((f) => !f.pass) ?? [];
  const showMismatches =
    mismatches.length > 0 && (report.status === "fail" || report.status === "partial");

  return (
    <article className={`eval-card ${statusClass(report.status)}`}>
      <header className="eval-card-header">
        <strong>{report.evalId}</strong>
        <span className={`eval-badge ${statusClass(report.status)}`}>{report.status}</span>
        <span className="muted">{report.type}</span>
      </header>

      {report.criticalFailures?.length > 0 && (
        <div className="eval-critical">
          <h5>Critical failures</h5>
          <ul>
            {report.criticalFailures.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="eval-scores">
        <h5>Scores</h5>
        <ul>
          <ScoreRow label="Document identity" value={report.scores?.documentIdentity} />
          <ScoreRow label="Metadata" value={report.scores?.metadata} />
          <ScoreRow label="Parties" value={report.scores?.parties} />
          <ScoreRow label="Tasks" value={report.scores?.tasks} />
          <ScoreRow label="Deadlines" value={report.scores?.deadlines} />
          <ScoreRow label="Human review" value={report.scores?.humanReview} />
          <ScoreRow label="Snapshot" value={report.scores?.snapshot} />
          <ScoreRow label="Negative guardrails" value={report.scores?.negativeGuardrails} />
          <ScoreRow label="Rule authority" value={report.scores?.ruleAuthority} />
          <ScoreRow label="Rule sources" value={report.scores?.ruleSources} />
          <ScoreRow label="Extraction quality" value={report.scores?.extractionQuality} />
          <ScoreRow label="Pipeline versions" value={report.scores?.pipelineVersions} />
          <ScoreRow label="Parsed golden" value={report.scores?.parsedGolden} />
        </ul>
      </div>

      {showMismatches && (
        <div className="eval-mismatches-promoted">
          <h5>Field mismatches ({mismatches.length})</h5>
          <ul className="eval-mismatches">
            {mismatches.map((field) => (
              <li key={field.field}>
                <strong>{field.field}</strong>
                {field.note && <span className="muted"> — {field.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!showMismatches && mismatches.length > 0 && (
        <details>
          <summary>Field mismatches ({mismatches.length})</summary>
          <ul className="eval-mismatches">
            {mismatches.map((field) => (
              <li key={field.field}>
                <strong>{field.field}</strong>
                {field.note && <span className="muted"> — {field.note}</span>}
              </li>
            ))}
          </ul>
        </details>
      )}

      {report.notes?.length > 0 && (
        <p className="muted eval-notes">{report.notes.join(" ")}</p>
      )}
    </article>
  );
}

export function EvalPanel({ batchId, evalReports: evalReportsProp }) {
  const [evalData, setEvalData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bundleResult, setBundleResult] = useState(null);
  const [bundling, setBundling] = useState(false);
  const [caseBundleResult, setCaseBundleResult] = useState(null);
  const [caseBundling, setCaseBundling] = useState(false);
  const [caseInventory, setCaseInventory] = useState(null);
  const [caseExportResult, setCaseExportResult] = useState(null);
  const [caseDataBusy, setCaseDataBusy] = useState(false);
  const [goldenCaseId, setGoldenCaseId] = useState("case_001");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (evalReportsProp?.length) {
      const summary = {
        pass: evalReportsProp.filter((r) => r.status === "pass").length,
        partial: evalReportsProp.filter((r) => r.status === "partial").length,
        fail: evalReportsProp.filter((r) => r.status === "fail").length,
        criticalFailureCount: evalReportsProp.reduce(
          (n, r) => n + (r.criticalFailures?.length ?? 0),
          0
        )
      };
      setEvalData({ batchId, summary, reports: evalReportsProp });
      return undefined;
    }

    if (!batchId) {
      setEvalData(null);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getBatchEvals(batchId)
      .then((data) => {
        if (!cancelled) setEvalData(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [batchId, evalReportsProp]);

  if (!batchId) return null;
  if (loading) return <p className="muted">Loading eval reports…</p>;
  if (error) {
    return (
      <p className="error-text">
        Could not load eval reports: {error.message || "unknown error"}
      </p>
    );
  }
  if (!evalData?.reports?.length) {
    return (
      <p className="muted">
        No eval reports yet. Eval runs automatically after each processed document when the golden
        dataset is present.
      </p>
    );
  }

  async function handleBundleEvals() {
    setBundling(true);
    setBundleResult(null);
    try {
      const manifest = await bundleBatchEvals(batchId);
      setBundleResult(manifest);
    } catch (err) {
      setBundleResult({ error: err.message || "Bundle failed" });
    } finally {
      setBundling(false);
    }
  }

  async function handleDownloadBatch() {
    setDownloading(true);
    try {
      await downloadBatchPackage(batchId, {
        includeGolden: true,
        goldenCaseId
      });
    } catch (err) {
      setBundleResult({ error: err.message || "Download failed" });
    } finally {
      setDownloading(false);
    }
  }

  async function handleLoadCaseInventory() {
    setCaseDataBusy(true);
    setCaseInventory(null);
    try {
      const inventory = await getCaseInventory(goldenCaseId);
      setCaseInventory(inventory);
    } catch (err) {
      setCaseInventory({ error: err.message || "Inventory failed" });
    } finally {
      setCaseDataBusy(false);
    }
  }

  async function handleExportCase() {
    setCaseDataBusy(true);
    setCaseExportResult(null);
    try {
      const exportId = `${goldenCaseId}-full-export`;
      const manifest = await exportCase(goldenCaseId, {
        exportName: exportId,
        includeGolden: true
      });
      setCaseExportResult(manifest);
    } catch (err) {
      setCaseExportResult({ error: err.message || "Export failed" });
    } finally {
      setCaseDataBusy(false);
    }
  }

  async function handleDownloadCase() {
    setDownloading(true);
    try {
      const exportId = `${goldenCaseId}-full-export`;
      try {
        await exportCase(goldenCaseId, { exportName: exportId, includeGolden: true });
      } catch {
        // may already exist
      }
      await downloadCaseExport(goldenCaseId, exportId);
    } catch (err) {
      setCaseExportResult({ error: err.message || "Download failed" });
    } finally {
      setDownloading(false);
    }
  }

  async function handleDeleteCase() {
    if (
      !window.confirm(
        `Delete all matched batch folders for ${goldenCaseId}? Golden fixtures are not removed.`
      )
    ) {
      return;
    }
    setCaseDataBusy(true);
    try {
      const result = await deleteCase(goldenCaseId, { confirm: true });
      setCaseInventory(result);
      setCaseExportResult(null);
    } catch (err) {
      setCaseInventory({ error: err.message || "Delete failed" });
    } finally {
      setCaseDataBusy(false);
    }
  }

  async function handleBundleCaseEvals() {
    setCaseBundling(true);
    setCaseBundleResult(null);
    try {
      const manifest = await bundleCaseEvals(goldenCaseId, {
        bundleName: `${goldenCaseId}-review`
      });
      setCaseBundleResult(manifest);
    } catch (err) {
      setCaseBundleResult({ error: err.message || "Case bundle failed" });
    } finally {
      setCaseBundling(false);
    }
  }

  return (
    <div className="panel eval-panel">
      <h3>Golden dataset eval</h3>
      <p className="muted">
        Pass {evalData.summary.pass} · Partial {evalData.summary.partial} · Fail{" "}
        {evalData.summary.fail}
        {evalData.summary.criticalFailureCount > 0 &&
          ` · ${evalData.summary.criticalFailureCount} critical`}
      </p>
      <label className="golden-case-select">
        Golden case{" "}
        <select value={goldenCaseId} onChange={(e) => setGoldenCaseId(e.target.value)}>
          {GOLDEN_CASES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <p className="eval-bundle-actions">
        <button type="button" onClick={handleDownloadBatch} disabled={downloading || bundling}>
          {downloading ? "Downloading…" : "Download this batch (.zip)"}
        </button>
        <button type="button" onClick={handleBundleEvals} disabled={bundling || caseBundling}>
          {bundling ? "Bundling…" : "Copy evals to eval-bundles/"}
        </button>
        <button type="button" onClick={handleBundleCaseEvals} disabled={bundling || caseBundling}>
          {caseBundling ? "Bundling…" : "Bundle full case evals"}
        </button>
        <button type="button" onClick={handleDownloadCase} disabled={downloading || caseDataBusy}>
          Download full case (.zip)
        </button>
      </p>
      {bundleResult?.relativePath && (
        <p className="muted">
          Batch: {bundleResult.totalReportFiles} reports →{" "}
          <code>{bundleResult.relativePath}/</code>
        </p>
      )}
      {bundleResult?.error && <p className="error-text">{bundleResult.error}</p>}
      {caseBundleResult?.relativePath && (
        <p className="muted">
          Case: golden + {caseBundleResult.totalReportFiles} reports (
          {caseBundleResult.batchIds?.length} runs) →{" "}
          <code>{caseBundleResult.relativePath}/</code>
        </p>
      )}
      {caseBundleResult?.error && <p className="error-text">{caseBundleResult.error}</p>}
      <details className="case-data-panel">
        <summary>Case data (full export / delete)</summary>
        <p className="eval-bundle-actions">
          <button type="button" onClick={handleLoadCaseInventory} disabled={caseDataBusy}>
            Show case inventory
          </button>
          <button type="button" onClick={handleExportCase} disabled={caseDataBusy}>
            Export full case (server)
          </button>
          <button type="button" onClick={handleDeleteCase} disabled={caseDataBusy}>
            Delete matched batches
          </button>
        </p>
        {caseInventory?.matchedBatchIds && (
          <p className="muted">Matched: {caseInventory.matchedBatchIds.join(", ") || "none"}</p>
        )}
        {caseInventory?.error && <p className="error-text">{caseInventory.error}</p>}
        {caseExportResult?.relativePath && (
          <p className="muted">
            Exported → <code>{caseExportResult.relativePath}/</code>
          </p>
        )}
        {caseExportResult?.error && <p className="error-text">{caseExportResult.error}</p>}
      </details>
      <div className="eval-report-list">
        {evalData.reports.map((report) => (
          <EvalReportCard key={report.evalId} report={report} />
        ))}
      </div>
    </div>
  );
}
