import { ModuleHealthCard } from "../components/ModuleHealthCard.jsx";
import { PipelineStepsCard } from "../components/PipelineStepsCard.jsx";

export function FilingPipelinePage() {
  return (
    <section className="card">
      <h2>Filing Pipeline</h2>
      <p className="muted">
        One-document-at-a-time orchestration. Modules own domain logic; the
        pipeline owns execution order.
      </p>
      <ModuleHealthCard />
      <PipelineStepsCard />
    </section>
  );
}
