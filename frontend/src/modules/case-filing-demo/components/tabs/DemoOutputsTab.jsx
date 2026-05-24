import { DocumentRunCard } from "../../../case-filing-ai/components/DocumentRunCard.jsx";
import {
  isLivePlayback,
  useHybridEvalReports,
  useHybridOutputs
} from "../../utils/demoPlaybackHelpers.js";

export function DemoOutputsTab({ bundle, playback }) {
  const outputs = useHybridOutputs(bundle, playback);
  const evalReports = useHybridEvalReports(bundle, playback);
  const live = isLivePlayback(playback);

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
