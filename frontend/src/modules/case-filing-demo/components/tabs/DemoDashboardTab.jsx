import {
  formatDemoDate,
  isLivePlayback,
  isPlaybackComplete,
  summarizeEvalReports,
  useHybridEvalReports
} from "../../utils/demoPlaybackHelpers.js";

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
          <span className="demo-kpi-label">Critical</span>
          <strong>{summary.criticalFailureCount}</strong>
          <span className="muted">eval guardrail failures</span>
        </article>
      </div>

      {(complete || idle || !live) && snapshot && (
        <section className="demo-grid">
          <article className="panel">
            <h4>Case posture</h4>
            <p>{identity?.caseName ?? caseDetail?.title}</p>
            <p className="muted">
              Index {identity?.indexNumber ?? "—"} · {identity?.county ?? caseDetail?.county}
            </p>
            <p className="muted">
              Phase: <code>{snapshot.currentPhase ?? "-"}</code>
              {snapshot.currentMiniPhase && (
                <>
                  {" "}
                  · <code>{snapshot.currentMiniPhase}</code>
                </>
              )}
            </p>
          </article>
          <article className="panel">
            <h4>Deadlines ({(snapshot.deadlines ?? []).length})</h4>
            <ul>
              {(snapshot.deadlines ?? []).slice(0, 6).map((deadline) => (
                <li key={`${deadline.type}-${deadline.date}`}>
                  <strong>{deadline.type}</strong>: {deadline.date}
                </li>
              ))}
            </ul>
          </article>
          <article className="panel">
            <h4>Open tasks ({(snapshot.openTasks ?? []).length})</h4>
            <ul>
              {(snapshot.openTasks ?? []).slice(0, 6).map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ul>
          </article>
          <article className="panel">
            <h4>Human review</h4>
            <p>
              {(snapshot.unresolvedHumanReviewItemsExpected ?? []).length} unresolved items
              expected at final snapshot.
            </p>
            {(snapshot.supersededDeadlines ?? []).length > 0 && (
              <p className="muted">
                {snapshot.supersededDeadlines.length} superseded deadline(s) tracked.
              </p>
            )}
          </article>
        </section>
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
