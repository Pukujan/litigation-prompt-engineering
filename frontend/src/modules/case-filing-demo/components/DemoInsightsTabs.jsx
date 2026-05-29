import { useMemo, useState } from "react";
import { DemoDashboardTab } from "./tabs/DemoDashboardTab.jsx";
import { DemoBenchmarkTab } from "./tabs/DemoBenchmarkTab.jsx";
import { DemoLegalOpsTab } from "./tabs/DemoLegalOpsTab.jsx";
import { DemoOutputsTab } from "./tabs/DemoOutputsTab.jsx";
import { DemoEvalsTab } from "./tabs/DemoEvalsTab.jsx";
import { DemoAuditTab } from "./tabs/DemoAuditTab.jsx";
import { DemoGovernanceTab } from "./tabs/DemoGovernanceTab.jsx";
import { isLivePlayback } from "../utils/demoPlaybackHelpers.js";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "benchmark", label: "Benchmark" },
  { id: "legal-ops", label: "Legal Ops" },
  { id: "outputs", label: "Outputs" },
  { id: "evals", label: "Evals" },
  { id: "audit", label: "Audit" },
  { id: "governance", label: "Governance" }
];

export function DemoInsightsTabs({ bundle, caseDetail, playback }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const live = isLivePlayback(playback);

  const badges = useMemo(() => {
    const revealed = playback?.revealedOutputs?.length ?? 0;
    const evals = playback?.visibleEvalReports?.length ?? 0;
    const audit = playback?.liveAudit?.length ?? 0;
    return {
      outputs: live && revealed > 0 ? String(revealed) : null,
      evals: live && evals > 0 ? String(evals) : null,
      audit: live && audit > 0 ? "live" : null
    };
  }, [playback, live]);

  return (
    <section className="demo-tabs panel">
      <header>
        <h3>Demo insights</h3>
        <p className="muted">
          Dashboard, benchmark charts, Legal Ops worklog tables, outputs, golden evals, audit trail,
          and governance. Tabs update live during orchestration and show full data when complete.
        </p>
      </header>

      <div className="demo-tab-list" role="tablist" aria-label="Demo insights">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`demo-tab${activeTab === tab.id ? " demo-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {badges[tab.id] && (
              <span className="demo-tab-badge">
                {badges[tab.id] === "live" ? "●" : badges[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="demo-tab-panel" role="tabpanel">
        {activeTab === "dashboard" && (
          <DemoDashboardTab bundle={bundle} caseDetail={caseDetail} playback={playback} />
        )}
        {activeTab === "benchmark" && (
          <DemoBenchmarkTab bundle={bundle} caseDetail={caseDetail} playback={playback} />
        )}
        {activeTab === "legal-ops" && (
          <DemoLegalOpsTab bundle={bundle} caseDetail={caseDetail} playback={playback} />
        )}
        {activeTab === "outputs" && (
          <DemoOutputsTab bundle={bundle} caseDetail={caseDetail} playback={playback} />
        )}
        {activeTab === "evals" && <DemoEvalsTab bundle={bundle} playback={playback} />}
        {activeTab === "audit" && <DemoAuditTab bundle={bundle} playback={playback} />}
        {activeTab === "governance" && (
          <DemoGovernanceTab bundle={bundle} caseDetail={caseDetail} />
        )}
      </div>
    </section>
  );
}
