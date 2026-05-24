import { useEffect, useState } from "react";
import { PipelineModuleRail } from "../../case-filing-ai/components/PipelineModuleRail.jsx";
import { DocumentQueuePanel } from "../../case-filing-ai/components/DocumentQueuePanel.jsx";
import { DocumentRunCard } from "../../case-filing-ai/components/DocumentRunCard.jsx";
import { useInteractiveDemoPlayback } from "../hooks/useInteractiveDemoPlayback.js";
import { absoluteDemoUrl } from "../api/caseFilingDemoApi.js";

const MODULE_ICONS = {
  "part-rules": "📋",
  parse: "📄",
  "court-rules": "⚖️",
  "master-prompt": "✨",
  snapshot: "📊",
  eval: "✓"
};

const MODULE_LABELS = {
  "part-rules": "Part rules",
  parse: "Parse & text",
  "court-rules": "Court rules",
  "master-prompt": "Extraction (LLM)",
  snapshot: "Case snapshot",
  eval: "Golden eval"
};

function AgentSpotlight({ activeModule, activeDocument, currentMessage, playStatus }) {
  const icon = MODULE_ICONS[activeModule] ?? "•";
  const title = MODULE_LABELS[activeModule] ?? activeModule;

  return (
    <div className={`demo-orchestration-stage demo-orchestration-stage--${playStatus}`}>
      <div className="demo-stage-lane demo-stage-input">
        <span className="demo-stage-label">Input filing</span>
        <div className={`demo-file-chip${activeDocument ? " demo-file-chip--active" : ""}`}>
          <span className="demo-file-icon">📄</span>
          <span>
            {activeDocument
              ? `${String(activeDocument.docIndex).padStart(2, "0")}. ${activeDocument.title}`
              : "Waiting for next document"}
          </span>
        </div>
      </div>

      <div className="demo-stage-flow" aria-hidden="true">
        <span className="demo-flow-dot demo-flow-dot--a" />
        <span className="demo-flow-dot demo-flow-dot--b" />
        <span className="demo-flow-line" />
      </div>

      <div className="demo-stage-lane demo-stage-agent">
        <span className="demo-stage-label">Active agent</span>
        <div className={`demo-agent-card demo-agent-card--${activeModule}`}>
          <span className="demo-agent-icon">{icon}</span>
          <strong>{title.replace(/-/g, " ")}</strong>
          <p className="muted">{currentMessage || "Ready to orchestrate filings."}</p>
        </div>
      </div>

      <div className="demo-stage-flow" aria-hidden="true">
        <span className="demo-flow-dot demo-flow-dot--c" />
        <span className="demo-flow-line" />
      </div>

      <div className="demo-stage-lane demo-stage-output">
        <span className="demo-stage-label">Live output</span>
        <div className="demo-output-chip">
          <span>Tasks · Deadlines · Eval</span>
          <span className="muted">Emitted as each agent finishes</span>
        </div>
      </div>
    </div>
  );
}

function LiveAuditFeed({ entries }) {
  if (!entries.length) return null;
  return (
    <div className="demo-live-audit">
      <h4>Live audit trail</h4>
      <ul>
        {[...entries].reverse().slice(0, 8).map((entry, index) => (
          <li key={`${entry.event}-${entry.docKey}-${index}`}>
            <code>{entry.event}</code>
            {entry.docKey && <span> · {entry.docKey}</span>}
            <p className="muted">{entry.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InteractiveOrchestrationDemo({
  bundle,
  caseDetail,
  onComplete,
  onPlaybackChange
}) {
  const [speed, setSpeed] = useState(2);
  const {
    playStatus,
    start,
    pause,
    reset,
    activeModule,
    moduleStates,
    documentQueue,
    activeDocument,
    activeOutput,
    activeEval,
    revealedOutputs,
    visibleEvalReports,
    liveAudit,
    currentMessage,
    progress,
    canStart
  } = useInteractiveDemoPlayback({ bundle, caseDetail, speed, onComplete });

  const processedCount = documentQueue.filter((doc) => doc.status === "completed").length;

  useEffect(() => {
    onPlaybackChange?.({
      playStatus,
      progress,
      liveAudit,
      revealedOutputs,
      visibleEvalReports,
      activeModule,
      activeDocument,
      activeOutput,
      activeEval,
      currentMessage,
      processedCount,
      totalCount: documentQueue.length
    });
  }, [
    playStatus,
    progress,
    liveAudit,
    revealedOutputs,
    visibleEvalReports,
    activeModule,
    activeDocument,
    activeOutput,
    activeEval,
    currentMessage,
    processedCount,
    documentQueue.length,
    onPlaybackChange
  ]);
  const totalCount = documentQueue.length;
  const progressPct =
    progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const sourceUrl = activeDocument?.source?.url
    ? absoluteDemoUrl(activeDocument.source.url)
    : null;

  const evalByDoc = new Map();
  for (const report of visibleEvalReports) {
    const match = report.evalId?.match(/doc_(\d+)/);
    if (match) evalByDoc.set(Number(match[1]), report);
  }

  return (
    <section className="panel demo-interactive">
      <header className="demo-interactive-header">
        <div>
          <h3>Interactive orchestration</h3>
          <p className="muted">
            Press start to watch each synthetic filing move through the agents. Outputs and eval
            scores appear as the pipeline advances.
          </p>
        </div>
        <div className="demo-playback-controls">
          <label className="demo-speed">
            <span className="muted">Speed</span>
            <select
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              disabled={playStatus === "playing"}
            >
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={4}>4x</option>
            </select>
          </label>
          <button type="button" className="file-picker-button" onClick={start} disabled={!canStart}>
            {playStatus === "playing" ? "Running…" : "Start interactive demo"}
          </button>
          {playStatus === "playing" && (
            <button type="button" onClick={pause}>
              Pause
            </button>
          )}
          {(playStatus === "paused" || playStatus === "complete") && (
            <button type="button" onClick={reset}>
              Reset
            </button>
          )}
        </div>
      </header>

      <div className="demo-progress-bar" aria-hidden={playStatus === "idle"}>
        <div className="demo-progress-fill" style={{ width: `${progressPct}%` }} />
        <span className="muted">
          {processedCount}/{totalCount} documents · {progressPct}% orchestration
        </span>
      </div>

      <AgentSpotlight
        activeModule={activeModule}
        activeDocument={activeDocument}
        currentMessage={currentMessage}
        playStatus={playStatus}
      />

      <div className="pipeline-live">
        <PipelineModuleRail moduleStates={moduleStates} activeModule={activeModule} />
        <DocumentQueuePanel
          documentQueue={documentQueue}
          processedCount={processedCount}
          totalCount={totalCount}
        />
      </div>

      <div className="demo-live-panels">
        <article className="demo-live-panel">
          <h4>Current filing preview</h4>
          {activeDocument ? (
            <>
              <p>
                <strong>{activeDocument.title}</strong>
              </p>
              {sourceUrl && playStatus === "playing" ? (
                <div className="demo-pdf-frame demo-pdf-frame--compact">
                  <iframe title={activeDocument.title} src={sourceUrl} />
                </div>
              ) : (
                <p className="muted">PDF preview follows the active document during playback.</p>
              )}
            </>
          ) : (
            <p className="muted">Select Start to begin the filing sequence.</p>
          )}
        </article>

        <article className="demo-live-panel">
          <h4>Agent output (live)</h4>
          {activeOutput ? (
            <DocumentRunCard doc={activeOutput} evalReport={activeEval} />
          ) : (
            <p className="muted">Output appears when the extraction agent finishes each document.</p>
          )}
        </article>
      </div>

      <LiveAuditFeed entries={liveAudit} />

      {revealedOutputs.length > 0 && (
        <section className="demo-revealed-outputs">
          <h4>Completed outputs ({revealedOutputs.length})</h4>
          <div className="document-run-list">
            {revealedOutputs.map((doc) => (
              <DocumentRunCard
                key={doc.docKey}
                doc={doc}
                evalReport={evalByDoc.get(doc.docIndex)}
              />
            ))}
          </div>
        </section>
      )}

      {playStatus === "complete" && (
        <p className="demo-complete-banner">
          Demo complete — all {totalCount} filings processed. Use the insight tabs below for the
          full dashboard, eval log, audit trail, and governance manifest.
        </p>
      )}
    </section>
  );
}
