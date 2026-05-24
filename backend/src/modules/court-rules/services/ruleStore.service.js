import { readdir, readFile } from "fs/promises";
import { join } from "path";

/**
 * @typedef {Object} RuleSourceRecord
 * @property {string} ruleId
 * @property {string} authority
 * @property {string} title
 * @property {string | null} [county]
 * @property {string | null} [part]
 * @property {string | null} [court]
 * @property {string | null} [phase]
 * @property {string[]} [documentTypes]
 * @property {string} text
 * @property {string[]} [tags]
 * @property {number | null} [minSourceDocNo]
 */

export function createRuleStoreService({ fixturesRoot }) {
  const cache = new Map();

  async function loadCaseRules(caseId) {
    const key = String(caseId || "case_001");
    if (cache.has(key)) {
      return cache.get(key);
    }

    const dir = join(fixturesRoot, key);
    let names = [];
    try {
      names = await readdir(dir);
    } catch {
      cache.set(key, []);
      return [];
    }

    const rules = [];
    for (const name of names) {
      if (!name.endsWith(".json")) continue;
      const raw = await readFile(join(dir, name), "utf8");
      const parsed = JSON.parse(raw);
      if (parsed?.ruleId && parsed?.authority && parsed?.text) {
        rules.push(parsed);
      }
    }

    cache.set(key, rules);
    return rules;
  }

  function clearCache() {
    cache.clear();
  }

  return { loadCaseRules, clearCache };
}
