import { useEffect, useState } from "react";
import {
  bundleBatchEvals,
  bundleCaseEvals,
  deleteCase,
  exportCase,
  getBatchEvals,
  getCaseInventory
} from "../api/caseFilingApi.js";

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
        </ul>
      </div>

      {report.fieldResults?.filter((f) => !f.pass).length > 0 && (
        <details>
          <summary>
            Field mismatches ({report.fieldResults.filter((f) => !f.pass).length})
          </summary>
          <ul className="eval-mismatches">
            {report.fieldResults
              .filter((f) => !f.pass)
              .map((field) => (
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

export function EvalPanel({ batchId }) {
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

  useEffect(() => {
    if (!batchId) {
      setEvalData(null);
      return;
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
  }, [batchId]);

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

  async function handleLoadCaseInventory() {
    setCaseDataBusy(true);
    setCaseInventory(null);
    try {
      const inventory = await getCaseInventory("case_001");
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
      const manifest = await exportCase("case_001", {
        exportName: "case_001-full-export",
        includeGolden: true
      });
      setCaseExportResult(manifest);
    } catch (err) {
      setCaseExportResult({ error: err.message || "Export failed" });
    } finally {
      setCaseDataBusy(false);
    }
  }

  async function handleDeleteCase() {
    if (
      !window.confirm(
        "Delete all matched batch folders for case_001? Golden fixtures are not removed. This cannot be undone."
      )
    ) {
      return;
    }
    setCaseDataBusy(true);
    try {
      const result = await deleteCase("case_001", { confirm: true });
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
      const manifest = await bundleCaseEvals("case_001", {
        bundleName: "case_001-review"
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
      <p className="eval-bundle-actions">
        <button type="button" onClick={handleBundleEvals} disabled={bundling || caseBundling}>
          {bundling ? "Bundling…" : "Copy this batch to eval-bundles/"}
        </button>
        <button
          type="button"
          onClick={handleBundleCaseEvals}
          disabled={bundling || caseBundling}
        >
          {caseBundling ? "Bundling…" : "Bundle full case (golden + all runs)"}
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
          Case: golden + {caseBundleResult.totalReportFiles} reports ({caseBundleResult.batchIds?.length}{" "}
          runs) → <code>{caseBundleResult.relativePath}/</code>
        </p>
      )}
      {caseBundleResult?.error && <p className="error-text">{caseBundleResult.error}</p>}
      <details className="case-data-panel">
        <summary>Case data (full export / delete)</summary>
        <p className="muted">
          Export copies entire batch folders (uploads, outputs, evals, rules) to{" "}
          <code>case-exports/</code>. Eval bundles above copy eval JSON only.
        </p>
        <p className="eval-bundle-actions">
          <button type="button" onClick={handleLoadCaseInventory} disabled={caseDataBusy}>
            {caseDataBusy && !caseInventory ? "Loading…" : "Show case inventory"}
          </button>
          <button type="button" onClick={handleExportCase} disabled={caseDataBusy}>
            Export full case
          </button>
          <button type="button" onClick={handleDeleteCase} disabled={caseDataBusy}>
            Delete matched batches
          </button>
        </p>
        {caseInventory?.matchedBatchIds && (
          <p className="muted">
            Matched: {caseInventory.matchedBatchIds.join(", ") || "none"}
            {caseInventory.unclassifiedBatchIds?.length > 0 &&
              ` · Other batches: ${caseInventory.unclassifiedBatchIds.join(", ")}`}
          </p>
        )}
        {caseInventory?.error && <p className="error-text">{caseInventory.error}</p>}
        {caseInventory?.deleted != null && (
          <p className="muted">
            {caseInventory.deleted
              ? `Deleted ${caseInventory.batchIds?.join(", ")}`
              : `Dry run: would delete ${caseInventory.batchIds?.join(", ")}`}
          </p>
        )}
        {caseExportResult?.relativePath && (
          <p className="muted">
            Exported {caseExportResult.totalFiles} files →{" "}
            <code>{caseExportResult.relativePath}/</code>
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
