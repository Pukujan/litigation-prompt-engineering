import { EvalReportCard } from "../../../case-filing-ai/components/EvalReportCard.jsx";
import {
  isLivePlayback,
  isPlaybackComplete,
  percentScore,
  summarizeEvalReports,
  useHybridEvalReports
} from "../../utils/demoPlaybackHelpers.js";

export function DemoEvalsTab({ bundle, playback }) {
  const reports = useHybridEvalReports(bundle, playback);
  const summary = summarizeEvalReports(reports);
  const live = isLivePlayback(playback);
  const complete = isPlaybackComplete(playback);
  const fullCount = bundle?.evals?.reports?.length ?? 0;

  return (
    <div className="demo-tab-panel-inner">
      {live && (
        <p className="demo-live-banner">
          Showing {reports.length} eval report(s) revealed so far ({fullCount} total when complete).
        </p>
      )}

      <p className="muted">
        Pass {summary.pass} · Partial {summary.partial} · Fail {summary.fail}
        {summary.criticalFailureCount > 0 && ` · ${summary.criticalFailureCount} critical`}
      </p>

      {reports.length > 0 && (
        <div className="demo-table-wrap">
          <table className="demo-table">
            <thead>
              <tr>
                <th>Eval</th>
                <th>Type</th>
                <th>Status</th>
                <th>Rule authority</th>
                <th>Snapshot</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.evalId}>
                  <td>{report.evalId}</td>
                  <td>{report.type}</td>
                  <td>
                    <span className={`eval-badge eval-status-${report.status}`}>
                      {report.status}
                    </span>
                  </td>
                  <td>{percentScore(report.scores?.ruleAuthority)}</td>
                  <td>{percentScore(report.scores?.snapshot)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(complete || reports.length > 0) && (
        <div className="eval-report-list">
          {reports.map((report) => (
            <EvalReportCard key={report.evalId} report={report} />
          ))}
        </div>
      )}

      {reports.length === 0 && (
        <p className="muted">Eval reports appear after each document completes the eval agent.</p>
      )}
    </div>
  );
}
