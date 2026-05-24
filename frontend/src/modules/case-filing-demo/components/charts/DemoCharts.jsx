import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { mapToChartData } from "../../legal-ops/mapDemoBundleToLegalOps.js";

export function DemoCharts({ bundle, playback }) {
  const { evalPie, stageBars } = mapToChartData(bundle, playback);

  if (!evalPie.length && !stageBars.length) {
    return <p className="muted">Charts appear once eval and audit data are available.</p>;
  }

  return (
    <div className="demo-charts-grid">
      {evalPie.length > 0 && (
        <article className="panel demo-chart-panel">
          <h4>Golden eval results</h4>
          <p className="muted">How closely agent output matches the synthetic expected dataset.</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={evalPie}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {evalPie.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </article>
      )}

      {stageBars.length > 0 && (
        <article className="panel demo-chart-panel">
          <h4>Manual vs automated time by stage</h4>
          <p className="muted">Estimated minutes — synthetic benchmark for demo storytelling.</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stageBars} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="manual" name="Manual est." fill="#6b7a99" radius={[4, 4, 0, 0]} />
              <Bar dataKey="automated" name="With AI" fill="#6ea8fe" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
      )}
    </div>
  );
}
