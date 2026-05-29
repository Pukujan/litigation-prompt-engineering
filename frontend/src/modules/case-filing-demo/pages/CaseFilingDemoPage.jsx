import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  absoluteDemoUrl,
  getDemoBundle,
  getDemoCase,
  listDemoCases
} from "../api/caseFilingDemoApi.js";
import { InteractiveOrchestrationDemo } from "../components/InteractiveOrchestrationDemo.jsx";
import { DemoInsightsTabs } from "../components/DemoInsightsTabs.jsx";

function statusLabel(status) {
  if (status === "available") return "Available";
  if (status === "sources_available") return "PDFs ready";
  if (status === "coming_soon") return "Coming soon";
  return status ?? "Unknown";
}

function isSelectableCase(entry) {
  return entry.status === "available" || entry.status === "sources_available";
}

function CaseDropdown({ cases, selectedCaseId, onChange }) {
  return (
    <label className="demo-field">
      <span>Demo case</span>
      <select value={selectedCaseId} onChange={(event) => onChange(event.target.value)}>
        {cases.map((entry) => (
          <option key={entry.id} value={entry.id} disabled={!isSelectableCase(entry)}>
            {entry.label} - {entry.title} ({statusLabel(entry.status)})
          </option>
        ))}
      </select>
    </label>
  );
}

export function CaseFilingDemoPage() {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [caseDetail, setCaseDetail] = useState(null);
  const [bundle, setBundle] = useState(null);
  const [playback, setPlayback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePlaybackChange = useCallback((state) => {
    setPlayback(state);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listDemoCases()
      .then((data) => {
        if (cancelled) return;
        const allCases = Array.isArray(data.cases)
          ? data.cases
          : [...(data.available ?? []), ...(data.comingSoon ?? [])];
        setCases(allCases);
        const firstAvailable = allCases.find((entry) => isSelectableCase(entry));
        setSelectedCaseId(firstAvailable?.id ?? allCases[0]?.id ?? "");
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCaseId) return undefined;
    let cancelled = false;
    setError(null);
    setBundle(null);
    setPlayback(null);
    setBundleLoading(true);

    const selected = cases.find((entry) => entry.id === selectedCaseId);
    if (selected?.status === "coming_soon") {
      setCaseDetail(null);
      setBundleLoading(false);
      return () => {
        cancelled = true;
      };
    }

    if (selected?.status === "sources_available") {
      getDemoCase(selectedCaseId)
        .then((detail) => {
          if (cancelled) return;
          setCaseDetail(detail);
          setBundle(null);
        })
        .catch((err) => {
          if (!cancelled) {
            setCaseDetail(null);
            setError(err);
          }
        })
        .finally(() => {
          if (!cancelled) setBundleLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    Promise.all([getDemoCase(selectedCaseId), getDemoBundle(selectedCaseId)])
      .then(([detail, cachedBundle]) => {
        if (cancelled) return;
        setCaseDetail(detail);
        setBundle(cachedBundle);
      })
      .catch((err) => {
        if (!cancelled) {
          setCaseDetail(null);
          setBundle(null);
          setError(err);
        }
      })
      .finally(() => {
        if (!cancelled) setBundleLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCaseId, cases]);

  const selectedCase = useMemo(
    () => cases.find((entry) => entry.id === selectedCaseId),
    [cases, selectedCaseId]
  );

  if (loading) {
    return <section className="card">Loading case filing demo...</section>;
  }

  return (
    <section className="card case-filing-demo">
      <header className="demo-hero">
        <div>
          <h2>Case Filing Demo</h2>
          <p className="muted">
            Interactive orchestration for legal audiences: watch each synthetic filing move through
            the agents, then explore dashboard, outputs, evals, audit, and governance in the tabs
            below.
          </p>
        </div>
        <Link className="file-picker-button" to="/case-filing-ai">
          Run live pipeline
        </Link>
      </header>

      {error && <p className="error-text">{error.message || "Demo request failed"}</p>}

      <CaseDropdown cases={cases} selectedCaseId={selectedCaseId} onChange={setSelectedCaseId} />

      {selectedCase?.status === "coming_soon" && (
        <div className="panel">
          <h3>{selectedCase.title}</h3>
          <p className="muted">{selectedCase.description}</p>
          <span className="badge">Coming soon</span>
        </div>
      )}

      {caseDetail && (
        <section className="panel demo-case-summary">
          <div>
            <h3>{caseDetail.title}</h3>
            <p className="muted">{caseDetail.syntheticDataNotice}</p>
            {caseDetail.demoDisclosure && (
              <p className="muted">{caseDetail.demoDisclosure}</p>
            )}
          </div>
          <dl className="document-run-meta">
            <div>
              <dt>Jurisdiction</dt>
              <dd>{caseDetail.jurisdiction}</dd>
            </div>
            <div>
              <dt>Filings</dt>
              <dd>
                {caseDetail.sourceDocumentCount}/{caseDetail.documentCount} PDFs ready
              </dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>
                {selectedCase?.status === "sources_available"
                  ? "Import preview (PDFs + manifest)"
                  : bundleLoading
                    ? "Preparing demo bundle…"
                    : "Interactive + insights tabs"}
              </dd>
            </div>
          </dl>
          {selectedCase?.status === "sources_available" && caseDetail.documents?.length > 0 && (
            <div className="demo-source-doc-list">
              <h4>View source filings</h4>
              <ul>
                {caseDetail.documents.map((doc) => (
                  <li key={doc.docKey}>
                    {doc.source?.available ? (
                      <a
                        href={absoluteDemoUrl(doc.source.url)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {String(doc.docIndex).padStart(2, "0")}. {doc.title}
                      </a>
                    ) : (
                      <span>
                        {String(doc.docIndex).padStart(2, "0")}. {doc.title} (PDF pending)
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {caseDetail.nextSteps?.length > 0 && (
                <div className="demo-next-steps">
                  <h4>Next: author golden</h4>
                  <pre className="demo-cli-hint">{caseDetail.nextSteps.join("\n")}</pre>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {bundleLoading && (
        <p className="muted">Loading cached outputs, eval fixtures, and audit replay…</p>
      )}

      {bundle && caseDetail && !bundleLoading && (
        <>
          <InteractiveOrchestrationDemo
            bundle={bundle}
            caseDetail={caseDetail}
            onPlaybackChange={handlePlaybackChange}
          />
          <DemoInsightsTabs bundle={bundle} caseDetail={caseDetail} playback={playback} />
        </>
      )}
    </section>
  );
}
