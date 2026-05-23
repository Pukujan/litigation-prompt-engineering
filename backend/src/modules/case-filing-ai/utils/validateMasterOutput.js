import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const schemaDir = join(dirname(fileURLToPath(import.meta.url)), "../schemas");

const SCHEMA_BY_VERSION = {
  v1: "master-output.v1.schema.json",
  compact: "master-output.v1.schema.json",
  v2: "master-output.v1.schema.json",
  v001: "master-output.v001.schema.json"
};

function loadSchema(promptVersion) {
  const key = String(promptVersion || "v1").toLowerCase();
  const file = SCHEMA_BY_VERSION[key] ?? SCHEMA_BY_VERSION.v1;
  return JSON.parse(readFileSync(join(schemaDir, file), "utf8"));
}

/**
 * @param {unknown} value
 * @param {Record<string, unknown>} schema
 * @param {string} path
 * @param {string[]} errors
 */
function validateNode(value, schema, path, errors) {
  if (schema.type === "object") {
    if (value == null || typeof value !== "object" || Array.isArray(value)) {
      errors.push(`${path}: expected object`);
      return;
    }
    for (const key of schema.required ?? []) {
      if (!(key in value)) {
        errors.push(`${path}: missing required property "${key}"`);
      }
    }
    for (const [key, propSchema] of Object.entries(schema.properties ?? {})) {
      if (key in value && propSchema?.type) {
        const actual = value[key];
        const expectedType = propSchema.type;
        const actualType = Array.isArray(actual) ? "array" : typeof actual;
        if (actualType !== expectedType && actual != null) {
          errors.push(`${path}.${key}: expected ${expectedType}, got ${actualType}`);
        }
        if (expectedType === "object" && propSchema.properties) {
          validateNode(actual, propSchema, `${path}.${key}`, errors);
        }
      }
    }
    return;
  }
}

/**
 * @param {Record<string, unknown>} parsed
 * @param {string} promptVersion
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMasterOutput(parsed, promptVersion) {
  const errors = [];
  const schema = loadSchema(promptVersion);
  validateNode(parsed, schema, "$", errors);
  return { valid: errors.length === 0, errors };
}

/**
 * @param {string[]} errors
 * @returns {string}
 */
export function formatValidationErrors(errors) {
  return errors.slice(0, 8).join("; ");
}
