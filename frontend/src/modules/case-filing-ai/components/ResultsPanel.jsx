import { EvalPanel } from "./EvalPanel.jsx";

export function ResultsPanel({ results, batchId, evalReports }) {
  if (!results) return null;

  const batchStatus = results.batchStatus ?? "completed";
  const failedCount = results.failedDocuments?.length ?? 0;

  return (
    <div className="panel results-panel">
      <h3>Raw extracted JSON</h3>
      {batchStatus !== "completed" && (
        <p className={`batch-status batch-status--${batchStatus}`}>
          Batch {batchStatus}: {results.processedCount ?? 0} of {results.totalCount ?? 0}{" "}
          documents processed
          {failedCount > 0 ? ` (${failedCount} failed)` : ""}.
        </p>
      )}
      {failedCount > 0 && (
        <details open>
          <summary>Failed documents ({failedCount})</summary>
          <pre>{JSON.stringify(results.failedDocuments, null, 2)}</pre>
        </details>
      )}
      <EvalPanel batchId={batchId ?? results.batchId} evalReports={evalReports} />
      <details>
        <summary>Case snapshot</summary>
        <pre>{JSON.stringify(results.caseSnapshot, null, 2)}</pre>
      </details>
      <details>
        <summary>Documents ({results.documents?.length ?? 0})</summary>
        <pre>{JSON.stringify(results.documents, null, 2)}</pre>
      </details>
    </div>
  );
}
