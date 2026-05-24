import { mapToBenchmark, minutesLabel, money } from "../../legal-ops/mapDemoBundleToLegalOps.js";
import { DemoCharts } from "../charts/DemoCharts.jsx";

export function DemoBenchmarkTab({ bundle, playback, caseDetail }) {
  const benchmark = mapToBenchmark(bundle, playback);
  const totalEval =
    benchmark.evalSummary.pass + benchmark.evalSummary.partial + benchmark.evalSummary.fail;
  const passRate = totalEval ? Math.round((benchmark.evalSummary.pass / totalEval) * 100) : 0;

  return (
    <div className="demo-tab-panel-inner">
      <p className="muted">
        Side-by-side view for stakeholders: estimated manual litigation-ops time vs this
        AI-assisted pipeline. All figures are synthetic demo estimates, not billing records.
      </p>

      <div className="demo-kpi-grid demo-benchmark-kpis">
        <article className="demo-kpi-card">
          <span className="demo-kpi-label">Manual estimate</span>
          <strong>{minutesLabel(benchmark.manualTotal)}</strong>
          <span className="muted">traditional staff + attorney time</span>
        </article>
        <article className="demo-kpi-card">
          <span className="demo-kpi-label">With Case Filing AI</span>
          <strong>{minutesLabel(benchmark.autoTotal)}</strong>
          <span className="muted">automated agent pipeline</span>
        </article>
        <article className="demo-kpi-card">
          <span className="demo-kpi-label">Time saved</span>
          <strong>{minutesLabel(benchmark.savedTotal)}</strong>
          <span className="muted">{money(benchmark.savedCostBlended)} est. value</span>
        </article>
        <article className="demo-kpi-card">
          <span className="demo-kpi-label">Golden eval pass rate</span>
          <strong>{passRate}%</strong>
          <span className="muted">
            {benchmark.evalSummary.pass} pass · {benchmark.evalSummary.partial} partial ·{" "}
            {benchmark.evalSummary.fail} fail
          </span>
        </article>
      </div>

      <DemoCharts bundle={bundle} playback={playback} />

      <section className="panel">
        <h4>Stage comparison</h4>
        <div className="demo-table-wrap">
          <table className="demo-table ops-datalog-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Filings touched</th>
                <th>Manual est.</th>
                <th>Automated</th>
                <th>Saved</th>
              </tr>
            </thead>
            <tbody>
              {benchmark.stages.map((row) => (
                <tr key={row.id}>
                  <td>{row.label}</td>
                  <td>{row.filingsTouched}</td>
                  <td>{minutesLabel(row.manualMinutes)}</td>
                  <td>{minutesLabel(row.automatedMinutes)}</td>
                  <td>{minutesLabel(row.savedMinutes)}</td>
                </tr>
              ))}
              <tr className="demo-table-total-row">
                <td>
                  <strong>Total</strong>
                </td>
                <td>{benchmark.documentCount} docs</td>
                <td>
                  <strong>{minutesLabel(benchmark.manualTotal)}</strong>
                </td>
                <td>
                  <strong>{minutesLabel(benchmark.autoTotal)}</strong>
                </td>
                <td>
                  <strong>{minutesLabel(benchmark.savedTotal)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h4>Model & golden lineage</h4>
        <dl className="document-run-meta">
          <div>
            <dt>Golden case</dt>
            <dd>
              <code>{benchmark.goldenCaseId}</code>
            </dd>
          </div>
          <div>
            <dt>Author model (ground truth)</dt>
            <dd>
              <code>{benchmark.authorModel}</code>
            </dd>
          </div>
          <div>
            <dt>Matter</dt>
            <dd>{caseDetail?.title ?? "—"}</dd>
          </div>
        </dl>
        <p className="muted ops-datalog-footnote">
          Benchmark uses audit replay stages from the demo bundle. For production, connect Legal Ops
          Patch 07B backend analytics for matter-specific baselines.
        </p>
      </section>
    </div>
  );
}
