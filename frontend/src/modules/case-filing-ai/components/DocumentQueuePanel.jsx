import { useEffect, useRef } from "react";

const STEP_LABELS = ["parse", "rules", "extract", "snapshot", "eval"];

export function DocumentQueuePanel({ documentQueue = [], processedCount, totalCount }) {
  const activeRef = useRef(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [documentQueue]);

  if (!documentQueue.length) return null;

  return (
    <div className="document-queue">
      <header className="document-queue-header">
        <h4>Document queue</h4>
        <span className="muted">
          {processedCount ?? 0} / {totalCount ?? documentQueue.length}
        </span>
      </header>
      <ul className="document-queue-list">
        {documentQueue.map((doc) => {
          const isActive = doc.status === "processing";
          return (
            <li
              key={doc.docKey ?? doc.docIndex}
              ref={isActive ? activeRef : null}
              className={`document-queue-row document-queue-row--${doc.status}`}
            >
              <span className="document-queue-index">
                {doc.status === "completed" ? "✓" : doc.status === "failed" ? "!" : isActive ? "▶" : "○"}
              </span>
              <span className="document-queue-name" title={doc.name}>
                {String(doc.docIndex).padStart(2, "0")} {doc.name}
              </span>
              <div className="document-queue-steps">
                {STEP_LABELS.map((step) => (
                  <span
                    key={step}
                    className={`doc-step doc-step--${doc.steps?.[step] ?? "pending"}`}
                    title={step}
                  />
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
