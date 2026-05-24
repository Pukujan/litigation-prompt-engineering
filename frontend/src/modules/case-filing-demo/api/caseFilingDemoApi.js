import { apiGet } from "../../../shared/api/client.js";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export function listDemoCases() {
  return apiGet("/api/case-filing-demo/cases");
}

export function getDemoCase(caseId) {
  return apiGet(`/api/case-filing-demo/cases/${caseId}`);
}

export function getDemoBundle(caseId) {
  return apiGet(`/api/case-filing-demo/cases/${caseId}/bundle`);
}

export function absoluteDemoUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}
