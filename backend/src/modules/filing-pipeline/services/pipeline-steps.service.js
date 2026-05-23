import {
  PIPELINE_PRINCIPLE,
  SINGLE_DOCUMENT_PIPELINE_STEPS
} from "../domain/pipeline-steps.js";

export function getPipelineOverview(config) {
  return {
    module: config.name,
    principle: PIPELINE_PRINCIPLE,
    processingMode: "one-document-at-a-time",
    stepCount: SINGLE_DOCUMENT_PIPELINE_STEPS.length,
    steps: SINGLE_DOCUMENT_PIPELINE_STEPS
  };
}
