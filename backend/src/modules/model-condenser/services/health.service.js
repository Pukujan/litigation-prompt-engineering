export function getHealth(config) {
  return {
    status: "ok",
    module: config.name,
    label: config.label,
    outputRelativePath: `models/${config.consolidatedFileName}`
  };
}
