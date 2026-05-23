import { apiGet } from "../../../shared/api/client.js";

export function fetchModuleHealth() {
  return apiGet("/api/filing-pipeline/health");
}

export function fetchPipelineSteps() {
  return apiGet("/api/filing-pipeline/steps");
}
