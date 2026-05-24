import {
  formatDemoDate,
  isLivePlayback,
  isPlaybackComplete,
  summarizeEvalReports,
  useHybridEvalReports
} from "../../utils/demoPlaybackHelpers.js";
import {
  mapToDashboard,
  mapToDeadlineTable,
  mapToFilingTable,
  mapToTaskTable,
  minutesLabel,
  money
} from "../../legal-ops/mapDemoBundleToLegalOps.js";
import { DemoCharts } from "../charts/DemoCharts.jsx";
import { absoluteDemoUrl } from "../../api/caseFilingDemoApi.js";

const MODULE_LABELS = {
  "part-rules": "Part rules",
  parse: "Parse & text",
  "court-rules": "Court rules",
  "master-prompt": "Extraction (LLM)",
  snapshot: "Case snapshot",
  eval: "Golden eval"
};

export function DemoDashboardTab({ bundle, caseDetail, playback }) {
  const snapshot = bundle?.results?.caseSnapshot;
  const identity = bundle?.case?.caseIdentity ?? caseDetail?.caseIdentity;
  const reports = useHybridEvalReports(bundle, playback);
  const summary = summarizeEvalReports(reports);
  const live = isLivePlayback(playback);
  const complete = isPlaybackComplete(playback);
  const dashboard = mapToDashboard(bundle, playback, caseDetail);
  const filings = mapToFilingTable(bundle, playback, caseDetail);
  const deadlines = mapToDeadlineTable(bundle);
  const tasks = mapToTaskTable(bundle);

  const docTotal = caseDetail?.documentCount ?? bundle?.results?.totalCount ?? 14;
  const idle = !playback || playback.playStatus === "idle";
  const docProcessed = complete || idle
    ? docTotal
    : live || playback?.playStatus === "paused"
      ? (playback?.processedCount ?? playback?.revealedOutputs?.length ?? 0)
      : 0;

  const progressPct =
    playback?.progress?.total > 0
      ? Math.round((playback.progress.current / playback.progress.total) * 100)
      : complete
        ? 100
        : 0;

  return (
    <div className="demo-tab-panel-inner">
      {live && (
        <p className="demo-live-banner">
          Live demo in progress — dashboard metrics update as each filing completes.
        </p>
      )}

      <div className="demo-kpi-grid">
        <article className="demo-kpi-card">
          <span className="demo-kpi-label">Documents</span>
          <strong>
            {docProcessed}/{docTotal}
          </strong>
          <span className="muted">filings processed</span>
        </article>
        <article className="demo-kpi-card">
          <span className="demo-kpi-label">Orchestration</span>
          <strong>{progressPct}%</strong>
          <span className="muted">
            {live && playback?.activeModule
              ? `Active: ${MODULE_LABELS[playback.activeModule] ?? playback.activeModule}`
              : complete
                ? "Batch complete"
                : "Press Start above"}
          </span>
        </article>
        <article className="demo-kpi-card">
          <span className="demo-kpi-label">Eval pass</span>
          <strong>{summary.pass}</strong>
          <span className="muted">
            {summary.partial} partial · {summary.fail} fail
          </span>
        </article>
        <article className="demo-kpi-card">
          <span className="demo-kpi-label">Est. saved</span>
          <strong>{minutesLabel(dashboard.summary?.estimatedMinutesSaved)}</strong>
          <span className="muted">{money(dashboard.savings?.estimatedCostSaved)}</span>
        </article>
      </div>

      {(complete || idle || !live) && (
        <>
          <DemoCharts bundle={bundle} playback={playback} />

          <section className="panel">
            <h4>Legal Ops metrics (from demo bundle)</h4>
            <div className="ops-datalog-stats ops-datalog-stats--dark">
              {dashboard.metrics.map((m) => (
                <div key={m.metricId}>
                  <span>{m.label}</span>
                  <b>
                    {m.unit === "currency"
                      ? money(m.value)
                      : m.unit === "minutes"
                        ? minutesLabel(m.value)
                        : m.value}
                  </b>
                </div>
              ))}
            </div>
          </section>

          {filings.length > 0 && (
            <section className="panel">
              <h4>Filing index ({filings.length})</h4>
              <div className="demo-table-wrap">
                <table className="demo-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Filed</th>
                      <th>Pages</th>
                      <th>Eval</th>
                      <th>Tasks</th>
                      <th>PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filings.map((row) => (
                      <tr key={row.docKey}>
                        <td>{row.docIndex}</td>
                        <td>{row.title}</td>
                        <td>{row.documentType}</td>
                        <td>{row.filingDate || "—"}</td>
                        <td>{row.pageCount ?? "—"}</td>
                        <td>
                          <span className={`eval-badge eval-status-${row.evalStatus}`}>
                            {row.evalStatus}
                          </span>
                        </td>
                        <td>{row.tasksCount}</td>
                        <td>
                          {row.pdfUrl ? (
                            <a href={absoluteDemoUrl(row.pdfUrl)} target="_blank" rel="noreferrer">
                              View
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <div className="demo-grid">
            <article className="panel">
              <h4>Case posture</h4>
              <p>{identity?.caseName ?? caseDetail?.title}</p>
              <p className="muted">
                Index {identity?.indexNumber ?? "—"} · {identity?.county ?? caseDetail?.county}
              </p>
              <p className="muted">
                Phase: <code>{snapshot?.currentPhase ?? "-"}</code>
                {snapshot?.currentMiniPhase && (
                  <>
                    {" "}
                    · <code>{snapshot.currentMiniPhase}</code>
                  </>
                )}
              </p>
            </article>
            <article className="panel">
              <h4>Deadlines ({deadlines.length})</h4>
              <div className="demo-table-wrap">
                <table className="demo-table demo-table--compact">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Authority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deadlines.slice(0, 8).map((d) => (
                      <tr key={d.id}>
                        <td>{d.type}</td>
                        <td>{d.date || "—"}</td>
                        <td>{d.sourceAuthority || "—"}</td>
                      </tr>
                    ))}
                    {deadlines.length === 0 && (
                      <tr>
                        <td colSpan={3}>No deadlines in snapshot yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
            <article className="panel">
              <h4>Open tasks ({tasks.length})</h4>
              <div className="demo-table-wrap">
                <table className="demo-table demo-table--compact">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.slice(0, 8).map((t) => (
                      <tr key={t.id}>
                        <td>{t.description}</td>
                        <td>{t.status}</td>
                      </tr>
                    ))}
                    {tasks.length === 0 && (
                      <tr>
                        <td colSpan={2}>No open tasks.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
            <article className="panel">
              <h4>Recommendations</h4>
              <ul>
                {dashboard.recommendations.map((r) => (
                  <li key={r.title}>
                    <strong>{r.title}</strong>
                    <span className="muted"> — {r.suggestedAction}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </>
      )}

      {live && playback?.activeDocument && (
        <article className="panel">
          <h4>Currently processing</h4>
          <p>
            <strong>
              {String(playback.activeDocument.docIndex).padStart(2, "0")}.{" "}
              {playback.activeDocument.title}
            </strong>
          </p>
          <p className="muted">{playback.currentMessage}</p>
        </article>
      )}

      <p className="muted">
        Batch <code>{bundle?.batchId}</code> · generated {formatDemoDate(bundle?.generatedAt)}
      </p>
    </div>
  );
}
