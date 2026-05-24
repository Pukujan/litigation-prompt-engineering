import { Link } from "react-router-dom";
import { DocumentRunCard } from "./DocumentRunCard.jsx";
import { DocumentQueuePanel } from "./DocumentQueuePanel.jsx";
import { PipelineModuleRail } from "./PipelineModuleRail.jsx";

export function BatchRunSummary({ results, status, evalReports = [], modules = [] }) {
  if (!results && !status) return null;

  const partRule = results?.partRule;
  const docs = results?.documents ?? [];
  const reportsByDoc = new Map();
  for (const report of evalReports) {
    const match = report.evalId?.match(/doc_(\d+)/);
    if (match) reportsByDoc.set(Number(match[1]), report);
  }

  const moduleStates =
    status?.moduleStates?.map((m) => {
      const meta = modules.find((x) => x.id === m.id);
      return { ...m, displayName: meta?.displayName, icon: meta?.icon };
    }) ?? [];

  return (
    <div className="batch-run-summary">
      <header className="batch-run-header">
        <h3>Batch run</h3>
        <p className="muted">
          {results?.batchId && (
            <>
              <code>{results.batchId}</code>
              {" · "}
            </>
          )}
          Part rules: <code>{partRule?.source ?? "—"}</code>
          {partRule?.hasText === false && " (empty)"}
          {" · "}
          <Link to="/onboarding">Onboarding</Link>
        </p>
      </header>

      {moduleStates.length > 0 && (
        <PipelineModuleRail moduleStates={moduleStates} activeModule={status?.activeModule} />
      )}

      {status?.documentQueue?.length > 0 && status.status === "processing" && (
        <DocumentQueuePanel
          documentQueue={status.documentQueue}
          processedCount={status.processedCount}
          totalCount={status.totalCount}
        />
      )}

      <div className="document-run-list">
        {docs.map((doc) => (
          <DocumentRunCard key={doc.docKey} doc={doc} evalReport={reportsByDoc.get(doc.docIndex)} />
        ))}
      </div>
    </div>
  );
}
