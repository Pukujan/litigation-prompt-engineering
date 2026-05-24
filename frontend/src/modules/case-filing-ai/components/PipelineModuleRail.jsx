const ICONS = {
  clipboard: "📋",
  document: "📄",
  scale: "⚖️",
  sparkles: "✨",
  layers: "📊",
  "badge-check": "✓"
};

export function PipelineModuleRail({ moduleStates = [], activeModule }) {
  if (!moduleStates.length) return null;

  return (
    <div className="pipeline-rail" role="list" aria-label="Processing modules">
      {moduleStates.map((mod, index) => (
        <div key={mod.id} className="pipeline-rail-item" role="listitem">
          {index > 0 && <span className="pipeline-rail-connector" aria-hidden="true" />}
          <div
            className={`pipeline-node pipeline-node--${mod.status}${
              mod.id === activeModule ? " pipeline-node--highlight" : ""
            }`}
            title={mod.id}
          >
            <span className="pipeline-node-icon">{ICONS[mod.icon] ?? "•"}</span>
            <span className="pipeline-node-label">{mod.displayName ?? mod.id}</span>
            <span className={`pipeline-node-dot pipeline-node-dot--${mod.status}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
