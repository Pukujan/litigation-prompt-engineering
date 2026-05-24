import { formatDemoDate } from "../../utils/demoPlaybackHelpers.js";

export function DemoGovernanceTab({ bundle, caseDetail }) {
  const manifest = bundle?.manifest;
  const lineage = manifest?.lineage ?? {};

  return (
    <div className="demo-tab-panel-inner">
      <section className="panel">
        <h4>Synthetic data disclosure</h4>
        <p>{caseDetail?.syntheticDataNotice ?? bundle?.case?.syntheticDataNotice}</p>
        <p className="muted">{caseDetail?.description}</p>
      </section>

      <section className="demo-grid">
        <article className="panel">
          <h4>Batch lineage</h4>
          <dl className="document-run-meta">
            <div>
              <dt>Batch ID</dt>
              <dd>
                <code>{bundle?.batchId}</code>
              </dd>
            </div>
            <div>
              <dt>Generated</dt>
              <dd>{formatDemoDate(bundle?.generatedAt)}</dd>
            </div>
            <div>
              <dt>Golden case</dt>
              <dd>
                <code>{lineage.goldenCaseId ?? caseDetail?.goldenCaseId}</code>
              </dd>
            </div>
            <div>
              <dt>Replay mode</dt>
              <dd>{bundle?.replay ? "Fixture replay (demo)" : "Runtime"}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <h4>Artifact roots</h4>
          <dl className="document-run-meta">
            <div>
              <dt>Golden dataset</dt>
              <dd>
                <code>{lineage.goldenDatasetDir}</code>
              </dd>
            </div>
            <div>
              <dt>Output fixtures</dt>
              <dd>
                <code>{lineage.fixtureDir}</code>
              </dd>
            </div>
            <div>
              <dt>Source PDFs</dt>
              <dd>{lineage.sourcePdfStatus ?? "unknown"}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <h4>Integrity note</h4>
          <p className="muted">{manifest?.integrity?.note}</p>
          <p className="muted">
            Audit entries in this demo are replayed from committed fixtures for presentation.
            Operational runs write append-only logs under each batch folder.
          </p>
        </article>

        <article className="panel">
          <h4>Eval governance</h4>
          <p className="muted">
            Golden expected JSON under <code>evals/golden/</code> is never modified by the API.
            Eval reports record prompt version, pipeline versions, rule sources checked, and
            provenance for regression review.
          </p>
        </article>
      </section>

      <section className="panel">
        <h4>Pipeline & model pins</h4>
        <div className="demo-table-wrap">
          <table className="demo-table">
            <thead>
              <tr>
                <th>Pin</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Author model (golden)</td>
                <td>
                  <code>{lineage.authorModel ?? "—"}</code>
                </td>
              </tr>
              <tr>
                <td>Golden case id</td>
                <td>
                  <code>{lineage.goldenCaseId ?? "—"}</code>
                </td>
              </tr>
              <tr>
                <td>Import stamp</td>
                <td>
                  <code>{caseDetail?.importStamp ?? "—"}</code>
                </td>
              </tr>
              <tr>
                <td>Fixture replay</td>
                <td>{bundle?.replayLabel ?? (bundle?.replay ? "yes" : "no")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
