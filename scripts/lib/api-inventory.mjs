import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join } from "path";

const SKIP_MODULES = new Set(["_reference"]);
const ROUTE_RE = /router\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/gi;
const BASE_PATH_RE = /app\.use\(\s*["'`](\/api\/[^"'`]+)["'`]/;

function readText(path) {
  return readFileSync(path, "utf8");
}

function parseRegistryRows(masterText) {
  const start = masterText.indexOf("## Endpoint registry");
  if (start < 0) return [];
  const section = masterText.slice(start);
  const end = section.indexOf("\n## ", 4);
  const body = end >= 0 ? section.slice(0, end) : section;
  const rows = [];
  for (const line of body.split("\n")) {
    if (!line.startsWith("|") || line.includes("---") || line.toLowerCase().includes("method")) {
      continue;
    }
    const cols = line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    if (cols.length >= 4) {
      rows.push({
        method: cols[0].toUpperCase(),
        path: cols[1].replace(/^`/, "").replace(/`$/, ""),
        module: cols[2],
        description: cols[3]
      });
    }
  }
  return rows;
}

function parseModuleIndex(masterText) {
  const start = masterText.indexOf("## Module index");
  if (start < 0) return [];
  const section = masterText.slice(start);
  const end = section.indexOf("\n## ", 4);
  const body = end >= 0 ? section.slice(0, end) : section;
  const rows = [];
  for (const line of body.split("\n")) {
    if (!line.startsWith("|") || line.includes("---") || line.toLowerCase().includes("module")) {
      continue;
    }
    const cols = line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    if (cols.length >= 3) {
      rows.push({
        module: cols[0],
        basePath: cols[1].replace(/^`/, "").replace(/`$/, ""),
        status: cols[3] || cols[2]
      });
    }
  }
  return rows;
}

function classifyRoute(row) {
  const desc = row.description.toLowerCase();
  if (desc.includes("deprecated")) return "deprecated";
  if (desc.includes("stub") || desc.includes("health only")) return "stub";
  return "active";
}

/**
 * @param {string} repoRoot
 */
export async function collectApiInventory(repoRoot) {
  const modulesDir = join(repoRoot, "backend/src/modules");
  const masterApiPath = join(repoRoot, "docs/API.md");
  const masterText = existsSync(masterApiPath) ? readText(masterApiPath) : "";
  const registry = parseRegistryRows(masterText);
  const moduleIndex = parseModuleIndex(masterText);

  const http = {
    active: [],
    stub: [],
    deprecated: []
  };

  for (const row of registry) {
    const bucket = classifyRoute(row);
    const entry = {
      method: row.method,
      path: row.path,
      module: row.module,
      description: row.description
    };
    http[bucket].push(entry);
  }

  const { PROMPT_VERSIONS } = await import(
    "../../backend/src/modules/case-filing-ai/prompts/promptVersions.js"
  );
  const { buildPipelineVersions } = await import(
    "../../backend/src/modules/case-filing-ai/contracts/pipelineVersions.js"
  );
  const { BATCH_LAYOUT_VERSION } = await import(
    "../../backend/src/modules/case-filing-ai/contracts/storageLayout.contract.js"
  );
  const { PARSED_ARTIFACTS_VERSION } = await import(
    "../../backend/src/modules/case-filing-ai/contracts/parsedDocumentArtifacts.contract.js"
  );

  const promptVersions = {
    defaultEnv: "v1",
    envVar: "MASTER_PROMPT_VERSION",
    allowed: Object.keys(PROMPT_VERSIONS),
    specs: PROMPT_VERSIONS,
    notes: [
      "v2 is an alias for compact (same template file)",
      "v001 is opt-in: ranked rule sources + documentFacts / ruleBasedTasks shape"
    ]
  };

  const pipelineVersions = buildPipelineVersions();
  const storageContracts = {
    batchLayout: BATCH_LAYOUT_VERSION,
    parsedArtifacts: PARSED_ARTIFACTS_VERSION
  };

  const deprecated = {
    http: http.deprecated,
    cli: [],
    prompts: [],
    notes: []
  };

  const exportDeprecated = join(repoRoot, "scripts/export-consolidated-models.mjs");
  if (existsSync(exportDeprecated)) {
    const t = readText(exportDeprecated);
    if (/@deprecated/i.test(t)) {
      deprecated.cli.push({
        command: "scripts/export-consolidated-models.mjs",
        replacement: "npm run condense-models (backend/) or POST /api/model-condenser/condense"
      });
    }
  }

  const versioned = {
    pipeline: pipelineVersions,
    prompts: promptVersions,
    storage: storageContracts,
    app: { packageJson: readText(join(repoRoot, "package.json")).match(/"version":\s*"([^"]+)"/)?.[1] }
  };

  const cli = [
    { command: "npm run dev-log:pre-push", purpose: "Paired human + agent dev logs" },
    { command: "npm run condense:all", purpose: "consolidated-models/prompts/file-structure → file-exchange/exports/" },
    { command: "npm run import:file-exchange", purpose: "Inbound bundle → file-exchange/imports/{stamp}/" },
    { command: "npm run ingest:golden-parsed", purpose: "Parsed cache → evals/golden/case_001/parsed/" },
    { command: "npm run ingest:golden-expected", purpose: "Ground truth → doc_NNN.expected.json" },
    { command: "npm run rerun:batch-evals", purpose: "Re-run evals for a batch id" },
    { command: "npm --prefix backend run condense-models", purpose: "Regenerate consolidated-models.json" }
  ];

  const moduleStatus = moduleIndex.map((m) => ({
    module: m.module,
    basePath: m.basePath,
    status: m.status
  }));

  return {
    capturedAt: new Date().toISOString(),
    sourceDocs: ["docs/API.md", "backend/src/modules/*/routes/", "pipelineVersions.js", "promptVersions.js"],
    http,
    moduleStatus,
    versioned,
    deprecated,
    cli
  };
}

/**
 * @param {Awaited<ReturnType<typeof collectApiInventory>>} apis
 */
export function formatApisMarkdown(apis) {
  const lines = [
    "### HTTP — active",
    "",
    "| Method | Path | Module | Description |",
    "|--------|------|--------|-------------|"
  ];
  for (const r of apis.http.active) {
    lines.push(`| ${r.method} | \`${r.path}\` | ${r.module} | ${r.description} |`);
  }
  lines.push("", "### HTTP — stub (health only)", "");
  if (apis.http.stub.length) {
    lines.push("| Method | Path | Module | Description |", "|--------|------|--------|-------------|");
    for (const r of apis.http.stub) {
      lines.push(`| ${r.method} | \`${r.path}\` | ${r.module} | ${r.description} |`);
    }
  } else {
    lines.push("_none_");
  }
  lines.push("", "### HTTP — deprecated", "");
  if (apis.http.deprecated.length) {
    lines.push("| Method | Path | Module | Description |", "|--------|------|--------|-------------|");
    for (const r of apis.http.deprecated) {
      lines.push(`| ${r.method} | \`${r.path}\` | ${r.module} | ${r.description} |`);
    }
  } else {
    lines.push("_none registered in docs/API.md_");
  }
  lines.push("", "### Versioned contracts (current defaults)", "", "```json");
  lines.push(JSON.stringify(apis.versioned.pipeline, null, 2));
  lines.push("```", "", "### Master prompt versions", "");
  for (const [key, spec] of Object.entries(apis.versioned.prompts.specs)) {
    lines.push(`- **${key}** — ${spec.description} (\`${spec.masterCaseFiling}\`)`);
  }
  lines.push("", `_Env: \`${apis.versioned.prompts.envVar}\` default \`${apis.versioned.prompts.defaultEnv}\`; allowed: ${apis.versioned.prompts.allowed.join(", ")}_`);
  if (apis.deprecated.cli.length) {
    lines.push("", "### Deprecated CLI", "");
    for (const d of apis.deprecated.cli) {
      lines.push(`- \`${d.command}\` → use ${d.replacement}`);
    }
  }
  return lines.join("\n");
}
