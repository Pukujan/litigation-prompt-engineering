export function ProcessingStatus({ status, error, batchId }) {
  if (error) {
    return (
      <div className="panel status-panel error-text">
        <strong>Processing failed</strong>
        <p>{error.message}</p>
      </div>
    );
  }

  if (status === "processing") {
    return (
      <div className="panel status-panel">
        <strong>Processing…</strong>
        <p className="muted">Running documents through the master prompt. This may take a minute.</p>
      </div>
    );
  }

  if (status === "done" && batchId) {
    return (
      <div className="panel status-panel">
        <strong>Batch complete</strong>
        <p className="muted">
          Batch ID: <code>{batchId}</code>
        </p>
      </div>
    );
  }

  return (
    <div className="panel status-panel">
      <strong>Ready</strong>
      <p className="muted">Add a part rule and filings, then click Process.</p>
    </div>
  );
}
