import { useMemo, useState } from "react";
import {
  mapToDashboard,
  mapToWorklogPayload,
  minutesLabel,
  money
} from "../../legal-ops/mapDemoBundleToLegalOps.js";
import { absoluteDemoUrl } from "../../api/caseFilingDemoApi.js";

function formatDt(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function DemoLegalOpsTab({ bundle, playback, caseDetail }) {
  const payload = useMemo(
    () => mapToWorklogPayload(bundle, playback, caseDetail),
    [bundle, playback, caseDetail]
  );
  const dashboard = useMemo(
    () => mapToDashboard(bundle, playback, caseDetail),
    [bundle, playback, caseDetail]
  );
  const [search, setSearch] = useState("");

  const rows = payload.worklog.worklog.filter((row) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const blob = [
      row.taskTitle,
      row.ownerRole,
      row.miniPhaseCode,
      row.taskType,
      row.sourceFileName
    ]
      .join(" ")
      .toLowerCase();
    return blob.includes(q);
  });

  return (
    <div className="demo-tab-panel-inner ops-datalog-shell">
      <div className="ops-datalog-hero">
        <div>
          <div className="ops-datalog-kicker">Legal Ops · imported UI pattern</div>
          <h2>Task-level worklog & duration datalog</h2>
          <p>
            Populated from the Case Filing AI demo bundle (audit replay + golden authoring). Same
            table layout as litigation workflow Patch 07E — no separate backend required for this
            demo.
          </p>
        </div>
      </div>

      <div className={`ops-datalog-qa ${payload.qa.qaReport.ok ? "is-ok" : "is-error"}`}>
        <strong>{payload.qa.qaReport.ok ? "Demo data ready" : "Needs review"}</strong>
        <span>
          {payload.summary.taskCount} worklog rows · {payload.summary.documentCount} filings ·{" "}
          {minutesLabel(payload.summary.savedMinutes)} est. saved
        </span>
      </div>

      <div className="ops-datalog-stats">
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

      <section className="ops-datalog-panel">
        <div className="ops-datalog-section-head">
          <h3>Mini-phase duration estimates</h3>
        </div>
        <div className="ops-datalog-table-wrap">
          <table className="ops-datalog-table ops-datalog-table--compact">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Filings</th>
                <th>Manual</th>
                <th>Auto</th>
                <th>Saved</th>
              </tr>
            </thead>
            <tbody>
              {payload.durations.durationEstimates.map((row) => (
                <tr key={row.miniPhaseCode}>
                  <td>{row.label}</td>
                  <td>{row.filingCount}</td>
                  <td>{minutesLabel(row.manualBaselineMinutes)}</td>
                  <td>{minutesLabel(row.automatedEstimateMinutes)}</td>
                  <td>{minutesLabel(row.estimatedMinutesSaved)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ops-datalog-panel">
        <div className="ops-datalog-section-head">
          <div>
            <h3>Worklog datalog</h3>
            <p>Filter by task, owner, or document.</p>
          </div>
          <label className="demo-field">
            <span>Search</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Task, owner, doc…"
            />
          </label>
        </div>
        <div className="ops-datalog-count">
          {rows.length} / {payload.worklog.worklog.length} rows
        </div>
        <div className="ops-datalog-table-wrap">
          <table className="ops-datalog-table">
            <thead>
              <tr>
                <th>Mini-phase</th>
                <th>Task</th>
                <th>Owner</th>
                <th>Start</th>
                <th>Active</th>
                <th>Manual</th>
                <th>Saved</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8}>No rows match.</td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={`${row.miniPhaseCode}-${row.taskType}-${i}`}>
                    <td>
                      <code>{row.miniPhaseCode}</code>
                    </td>
                    <td>{row.taskTitle}</td>
                    <td>{row.ownerRole}</td>
                    <td>{formatDt(row.startedAt)}</td>
                    <td>{minutesLabel(row.activeMinutes)}</td>
                    <td>{minutesLabel(row.manualBaselineMinutes)}</td>
                    <td>{minutesLabel(row.estimatedMinutesSaved)}</td>
                    <td>
                      {row.sourceDocumentId ? (
                        <a
                          href={absoluteDemoUrl(
                            `/api/case-filing-demo/cases/${caseDetail?.id}/documents/${row.sourceDocumentId}/source`
                          )}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {row.sourceDocumentId}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="muted ops-datalog-footnote">
        Vendor pattern from file-exchange import: litigation_workflow_v4 Patch 07E. Synthetic
        minutes for legal-operations storytelling only.
      </p>
    </div>
  );
}
