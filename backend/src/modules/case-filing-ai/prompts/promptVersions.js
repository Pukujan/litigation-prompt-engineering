import { join, dirname } from "path";
import { fileURLToPath } from "url";

const promptsDir = join(dirname(fileURLToPath(import.meta.url)));

export const PROMPT_VERSIONS = {
  v1: {
    id: "v1",
    label: "default",
    masterCaseFiling: "master-case-filing.prompt.md",
    description: "Original master prompt."
  },
  compact: {
    id: "compact",
    label: "compact",
    masterCaseFiling: "master-case-filing.compact.prompt.md",
    description: "Bounded snapshot + strict JSON output (recommended for 6+ documents)."
  },
  v2: {
    id: "v2",
    label: "compact",
    masterCaseFiling: "master-case-filing.compact.prompt.md",
    description: "Alias for compact."
  },
  v001: {
    id: "v001",
    label: "v001",
    masterCaseFiling: "v001_master-case-filing.prompt.md",
    description: "Ranked rule sources + documentFacts / ruleBasedTasks output shape."
  }
};

export function resolvePromptVersion(versionKey = "v1") {
  const key = String(versionKey || "v1").toLowerCase();
  const spec = PROMPT_VERSIONS[key] ?? PROMPT_VERSIONS.v1;
  return {
    ...spec,
    masterCaseFilingPath: join(promptsDir, spec.masterCaseFiling)
  };
}
