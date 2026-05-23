/** @readonly */
export const PARSED_REVIEW_STATUSES = [
  "unreviewed",
  "partially_reviewed",
  "reviewed",
  "rejected",
  "ai_extracted_unreviewed",
  "ai_extracted_unreviewed_with_visual_review_items"
];

/**
 * @param {unknown} body
 * @returns {{ ok: true, value: { status?: string, note?: string, preferredSource?: string } } | { ok: false, error: string }}
 */
export function validateParsedReviewPatch(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { status, note, preferredSource } = body;
  if (status != null && !PARSED_REVIEW_STATUSES.includes(status)) {
    return {
      ok: false,
      error: `status must be one of: ${PARSED_REVIEW_STATUSES.join(", ")}`
    };
  }

  return {
    ok: true,
    value: {
      ...(status != null ? { status } : {}),
      ...(note != null ? { note: String(note) } : {}),
      ...(preferredSource != null ? { preferredSource: String(preferredSource) } : {})
    }
  };
}
