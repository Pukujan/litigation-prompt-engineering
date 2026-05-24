export function evalStatusClass(status) {
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

export function EvalReportCard({ report }) {
  const statusClass = evalStatusClass(report.status);
  const mismatches = report.fieldResults?.filter((f) => !f.pass) ?? [];
  const showMismatches =
    mismatches.length > 0 && (report.status === "fail" || report.status === "partial");

  return (
    <article className={`eval-card ${statusClass}`}>
      <header className="eval-card-header">
        <strong>{report.evalId}</strong>
        <span className={`eval-badge ${statusClass}`}>{report.status}</span>
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
