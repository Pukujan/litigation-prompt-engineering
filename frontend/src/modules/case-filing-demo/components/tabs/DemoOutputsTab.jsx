import { DocumentRunCard } from "../../../case-filing-ai/components/DocumentRunCard.jsx";
import {
  isLivePlayback,
  useHybridEvalReports,
  useHybridOutputs
} from "../../utils/demoPlaybackHelpers.js";
import { mapToFilingTable } from "../../legal-ops/mapDemoBundleToLegalOps.js";

export function DemoOutputsTab({ bundle, playback, caseDetail }) {
  const outputs = useHybridOutputs(bundle, playback);
  const evalReports = useHybridEvalReports(bundle, playback);
  const live = isLivePlayback(playback);
  const tableRows = mapToFilingTable(bundle, playback, caseDetail);

  const evalByDoc = new Map();
  for (const report of evalReports) {
    const match = report.evalId?.match(/doc_(\d+)/);
    if (match) evalByDoc.set(Number(match[1]), report);
  }

  return (
    <div className="demo-tab-panel-inner">
      {live && (
        <p className="demo-live-banner">
          Showing {outputs.length} completed output(s) so far. More appear as each document
          finishes extraction.
        </p>
      )}

      {tableRows.length > 0 && (
        <section className="panel">
          <h4>Processed filings summary</h4>
          <div className="demo-table-wrap">
            <table className="demo-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Rules</th>
                  <th>Tasks</th>
                  <th>Deadlines</th>
                  <th>Eval</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.docKey}>
                    <td>{row.docIndex}</td>
                    <td>{row.title}</td>
                    <td>{row.documentType}</td>
                    <td>{row.rulesCount}</td>
                    <td>{row.tasksCount}</td>
                    <td>{row.deadlinesCount}</td>
                    <td>
                      <span className={`eval-badge eval-status-${row.evalStatus}`}>
                        {row.evalStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {outputs.length === 0 ? (
        <p className="muted">
          No processed outputs yet. Start the interactive demo to watch document outputs appear.
        </p>
      ) : (
        <div className="document-run-list">
          {outputs.map((doc) => (
            <DocumentRunCard key={doc.docKey} doc={doc} evalReport={evalByDoc.get(doc.docIndex)} />
          ))}
        </div>
      )}
    </div>
  );
}
