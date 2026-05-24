import { useMemo, useState } from "react";
import {
  formatDemoDate,
  isLivePlayback,
  isPlaybackComplete,
  useHybridAuditEntries
} from "../../utils/demoPlaybackHelpers.js";

const AUDIT_EXPLAINER = [
  {
    event: "batch_started",
    label: "Batch started",
    description: "The pipeline registers the synthetic case and part-rule context."
  },
  {
    event: "document_started",
    label: "Document started",
    description: "A filing enters the queue for sequential processing."
  },
  {
    event: "parse_completed",
    label: "Parse",
    description: "Text extraction and OCR routing complete for the filing."
  },
  {
    event: "rules_matched",
    label: "Court rules",
    description: "Applicable court rules and case-order authority are ranked."
  },
  {
    event: "prompt_completed",
    label: "Master prompt",
    description: "Structured tasks, deadlines, parties, and review items are extracted."
  },
  {
    event: "snapshot_merged",
    label: "Snapshot merge",
    description: "The rolling case snapshot is updated with guardrail checks."
  },
  {
    event: "eval_scored",
    label: "Golden eval",
    description: "Output is scored against the synthetic expected JSON baseline."
  },
  {
    event: "document_completed",
    label: "Document completed",
    description: "All agents finished for this filing."
  },
  {
    event: "batch_completed",
    label: "Batch completed",
    description: "The full filing sequence and governance bundle are ready."
  }
];

export function DemoAuditTab({ bundle, playback }) {
  const live = isLivePlayback(playback);
  const complete = isPlaybackComplete(playback);
  const [docFilter, setDocFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [viewMode, setViewMode] = useState("auto");

  const liveEntries = playback?.liveAudit ?? [];
  const fullEntries = bundle?.audit?.entries ?? [];
  const hybridEntries = useHybridAuditEntries(bundle, playback);

  const showLive =
    viewMode === "live" || (viewMode === "auto" && (live || (!complete && liveEntries.length > 0)));
  const entries = showLive ? liveEntries : hybridEntries.length ? hybridEntries : fullEntries;

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      if (docFilter && entry.docKey !== docFilter) return false;
      if (eventFilter && !String(entry.event).includes(eventFilter)) return false;
      return true;
    });
  }, [entries, docFilter, eventFilter]);

  const docKeys = useMemo(() => {
    const keys = new Set();
    for (const entry of fullEntries) {
      if (entry.docKey) keys.add(entry.docKey);
    }
    return [...keys].sort();
  }, [fullEntries]);

  return (
    <div className="demo-tab-panel-inner">
      {live && (
        <p className="demo-live-banner">
          Live audit trail — events stream in as each agent completes its step.
        </p>
      )}

      <section className="panel demo-audit-explainer">
        <h4>What the audit log contains</h4>
        <p className="muted">
          Each row is a governance event: which filing was processed, which agent ran, and what
          changed. In production this is stored as <code>processing-log.jsonl</code> per batch.
        </p>
        <ul className="demo-audit-explainer-list">
          {AUDIT_EXPLAINER.map((item) => (
            <li key={item.event}>
              <strong>{item.label}</strong> — {item.description}
            </li>
          ))}
        </ul>
      </section>

      <div className="demo-audit-controls">
        <label>
          View{" "}
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
            <option value="auto">Auto (live during demo)</option>
            <option value="live">Live only</option>
            <option value="full">Full replay</option>
          </select>
        </label>
        <label>
          Document{" "}
          <select value={docFilter} onChange={(e) => setDocFilter(e.target.value)}>
            <option value="">All</option>
            {docKeys.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </label>
        <label>
          Event contains{" "}
          <input
            type="text"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            placeholder="e.g. eval_scored"
          />
        </label>
      </div>

      <div className="demo-table-wrap">
        <table className="demo-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Doc</th>
              <th>Event</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {(showLive ? [...filtered].reverse() : filtered).slice(0, 80).map((entry, index) => (
              <tr key={`${entry.timestamp}-${entry.docKey}-${entry.event}-${index}`}>
                <td>{formatDemoDate(entry.timestamp)}</td>
                <td>{entry.docKey ?? "—"}</td>
                <td>
                  <code>{entry.event}</code>
                </td>
                <td>{entry.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="muted">No audit events match the current filters.</p>
      )}
    </div>
  );
}
