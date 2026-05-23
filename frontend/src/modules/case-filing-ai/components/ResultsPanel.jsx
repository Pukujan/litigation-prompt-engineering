import { EvalPanel } from "./EvalPanel.jsx";

export function ResultsPanel({ results, batchId }) {
  if (!results) return null;

  const batchStatus = results.batchStatus ?? "completed";
  const failedCount = results.failedDocuments?.length ?? 0;

  return (
    <div className="panel results-panel">
      <h3>Extracted results</h3>
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
      <EvalPanel batchId={batchId ?? results.batchId} />
      <details open>
        <summary>Case snapshot</summary>
        <pre>{JSON.stringify(results.caseSnapshot, null, 2)}</pre>
      </details>
      <details>
        <summary>Documents ({results.documents?.length ?? 0})</summary>
        <pre>{JSON.stringify(results.documents, null, 2)}</pre>
      </details>
      <details>
        <summary>Tasks ({results.tasks?.length ?? 0})</summary>
        <pre>{JSON.stringify(results.tasks, null, 2)}</pre>
      </details>
      <details>
        <summary>Deadlines ({results.deadlines?.length ?? 0})</summary>
        <pre>{JSON.stringify(results.deadlines, null, 2)}</pre>
      </details>
      <details>
        <summary>Human review items ({results.humanReviewItems?.length ?? 0})</summary>
        <pre>{JSON.stringify(results.humanReviewItems, null, 2)}</pre>
      </details>
    </div>
  );
}
