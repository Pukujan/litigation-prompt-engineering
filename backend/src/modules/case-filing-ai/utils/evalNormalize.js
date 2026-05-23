export function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizedIncludes(haystack, needle) {
  const h = normalizeText(haystack);
  const n = normalizeText(needle);
  if (!n) return true;
  if (!h) return false;
  return h.includes(n) || n.includes(h);
}

export function normalizedEquals(a, b) {
  return normalizeText(a) === normalizeText(b);
}

/**
 * @param {unknown[]} expected
 * @param {unknown[]} actual
 * @param {(item: unknown) => string} toText
 */
export function arrayMatchScore(expected, actual, toText) {
  if (!expected?.length) {
    return !actual?.length ? 1 : 0.75;
  }
  if (!actual?.length) {
    return 0;
  }

  let matched = 0;
  for (const expItem of expected) {
    const expText = toText(expItem);
    const hit = actual.some((actItem) => {
      const actText = toText(actItem);
      return normalizedIncludes(actText, expText) || normalizedIncludes(expText, actText);
    });
    if (hit) matched += 1;
  }
  return matched / expected.length;
}

export function collectTextBlob(value, depth = 0) {
  if (depth > 6 || value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => collectTextBlob(item, depth + 1)).join(" ");
  }
  if (typeof value === "object") {
    return Object.values(value)
      .map((item) => collectTextBlob(item, depth + 1))
      .join(" ");
  }
  return "";
}
