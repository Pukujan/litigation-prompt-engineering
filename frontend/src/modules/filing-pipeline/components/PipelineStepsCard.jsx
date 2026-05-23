import { usePipelineSteps } from "../hooks/use-pipeline-steps.js";

export function PipelineStepsCard() {
  const { data, error, loading } = usePipelineSteps();

  if (loading) return <p className="muted">Loading pipeline steps…</p>;
  if (error) return <p className="muted">Pipeline unavailable: {error.message}</p>;

  return (
    <div>
      <p className="muted">{data?.principle}</p>
      <p>
        Mode: <code>{data?.processingMode}</code> · {data?.stepCount} steps
      </p>
      <ol>
        {data?.steps?.map((step) => (
          <li key={step.step}>
            <code>{step.name}</code> — {step.owner}
          </li>
        ))}
      </ol>
    </div>
  );
}
