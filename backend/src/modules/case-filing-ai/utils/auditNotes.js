import { normalizeText } from "./evalNormalize.js";

/**
 * Dedupe audit notes (exact match after normalize) and keep the most recent entries.
 */
export function dedupeAndCapAuditNotes(notes, maxItems = 20) {
  if (!Array.isArray(notes) || !notes.length) return [];

  const seen = new Set();
  const unique = [];

  for (const note of notes) {
    const text = String(note ?? "").trim();
    if (!text) continue;
    const key = normalizeText(text);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(text);
  }

  if (unique.length <= maxItems) return unique;
  return unique.slice(-maxItems);
}
