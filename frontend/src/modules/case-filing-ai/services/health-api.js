import { apiGet } from "../../../shared/api/client.js";

export function fetchModuleHealth() {
  return apiGet("/api/case-filing-ai/health");
}
