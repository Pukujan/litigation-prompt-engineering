export function DocumentRunCard({ doc, evalReport }) {
  const title =
    doc.docketEntry?.filingType ??
    doc.documentMetadata?.title ??
    doc.originalName ??
    doc.docKey;
  const ranked = doc.rankedRules ?? [];
  const evalStatus = evalReport?.status;

  return (
    <article className={`document-run-card${doc.status === "failed" ? " document-run-card--failed" : ""}`}>
      <header>
        <strong>
          {doc.docIndex != null ? `${String(doc.docIndex).padStart(2, "0")}. ` : ""}
          {title}
        </strong>
        {evalStatus && <span className={`eval-badge eval-status-${evalStatus}`}>{evalStatus}</span>}
      </header>
      <dl className="document-run-meta">
        <div>
          <dt>Parse</dt>
          <dd>
            {doc.textSourceUsed ?? "—"}
            {doc.parsedDocumentCacheUsed ? " (cache)" : ""}
            {doc.extractionQuality?.ocr_needed ? " · OCR" : ""}
          </dd>
        </div>
        <div>
          <dt>Rules checked</dt>
          <dd>{(doc.ruleSourcesChecked ?? []).join(", ") || "—"}</dd>
        </div>
        <div>
          <dt>Ranked rules</dt>
          <dd>
            {ranked.length
              ? ranked.map((r) => r.name ?? r.ruleId).filter(Boolean).join(", ")
              : "—"}
          </dd>
        </div>
        <div>
          <dt>Extracted</dt>
          <dd>
            {(doc.tasks?.length ?? 0)} tasks · {(doc.deadlines?.length ?? 0)} deadlines ·{" "}
            {(doc.humanReviewItems?.length ?? 0)} review
          </dd>
        </div>
      </dl>
    </article>
  );
}
