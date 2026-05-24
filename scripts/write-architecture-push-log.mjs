#!/usr/bin/env node
/**
 * Paired architecture-push logs (human MD + agent JSON) for npm / create-modular-monolith sync.
 *
 * Usage:
 *   npm run arch-log:push -- --slug planning-gate-export
 *   npm run arch-log:push -- --slug v225 --npm-version 2.2.5 --export-to ../create-modular-monolith/template
 */
import { writeFile, mkdir, readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import {
  formatWorkLogTimestamp,
  formatHumanReadableUtc
} from "../backend/src/shared/utils/formatExchangeTimestamp.js";
import {
  ARCH_PUSH_DEFAULT_NPM_PACKAGE,
  ARCH_PUSH_DEFAULT_TARGET_REPO
} from "../backend/src/shared/contracts/architecturePushDevLog.contract.js";
import { collectGitSnapshot } from "./lib/git-snapshot.mjs";
import { buildArchPushHumanLog } from "./lib/arch-push-human-format.mjs";
import {
  filterStarterPaths,
  classifyChangedFiles
} from "./lib/collect-starter-export-changes.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const humanDir = join(repoRoot, "work-log/architecture-push-logs/human");
const agentDir = join(repoRoot, "work-log/architecture-push-logs/agent");

function parseArgs(argv) {
  const out = {
    slug: "",
    seq: "",
    title: "",
    npmVersion: "",
    exportTo: "",
    noLint: false
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--slug" && argv[i + 1]) out.slug = argv[++i];
    else if (a === "--seq" && argv[i + 1]) out.seq = argv[++i];
    else if (a === "--title" && argv[i + 1]) out.title = argv[++i];
    else if (a === "--npm-version" && argv[i + 1]) out.npmVersion = argv[++i];
    else if (a === "--export-to" && argv[i + 1]) out.exportTo = argv[++i];
    else if (a === "--no-lint") out.noLint = true;
  }
  return out;
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function nextEntryId() {
  let files = [];
  try {
    files = (await readdir(agentDir)).filter((f) => f.endsWith(".json"));
  } catch {
    return "001";
  }
  let max = 0;
  for (const f of files) {
    const m = f.match(/^(\d{3})_/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return String(max + 1).padStart(3, "0");
}

function runNpmScript(script) {
  const r = spawnSync("npm", ["run", script], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: process.platform === "win32"
  });
  return {
    ran: true,
    exitCode: r.status ?? 1,
    summary: r.status === 0 ? "pass" : `exit ${r.status}`,
    tail: (r.stderr || r.stdout || "").slice(-800)
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.slug) {
    console.error(
      "Usage: npm run arch-log:push -- --slug <kebab-topic> [--npm-version x.y.z] [--export-to path] [--seq NNN]"
    );
    process.exit(1);
  }

  const git = await collectGitSnapshot(repoRoot);
  const now = new Date();
  const { date, time, folder: folderStamp } = formatWorkLogTimestamp(now);
  const humanReadableUtc = formatHumanReadableUtc(now);
  const entryId = args.seq ? String(args.seq).padStart(3, "0") : await nextEntryId();
  const slug = slugify(args.slug);
  const base = `${entryId}_${date}_${time}`;
  const humanFilename = `${base}_arch-push_${slug}.md`;
  const agentFilename = `${base}_arch-push-agent_${slug}.json`;
  const humanRel = `work-log/architecture-push-logs/human/${humanFilename}`;
  const agentRel = `work-log/architecture-push-logs/agent/${agentFilename}`;

  const starterPaths = filterStarterPaths(git.changedFiles);
  const changes = classifyChangedFiles(git.changedFiles);

  const exportLint = {
    lintContracts: args.noLint
      ? { ran: false, exitCode: null, summary: "skipped" }
      : runNpmScript("lint:contracts"),
    lintRepoArtifacts: args.noLint
      ? { ran: false, exitCode: null, summary: "skipped" }
      : runNpmScript("lint:repo-artifacts")
  };

  const architecturePush = {
    productRepo: "legal-prmpt-eng",
    targetRepo: ARCH_PUSH_DEFAULT_TARGET_REPO,
    npmPackage: ARCH_PUSH_DEFAULT_NPM_PACKAGE,
    npmVersion: args.npmVersion || null,
    exportScript: "scripts/export-architecture-starter.mjs",
    exportTarget: args.exportTo || null,
    publishCommand: `cd packages/create-modular-monolith && npm publish --access public`
  };

  const title = args.title || slug.replace(/-/g, " ");

  const humanBody = buildArchPushHumanLog({
    title,
    entryId,
    date,
    time,
    humanReadableUtc,
    folderStamp,
    humanFilename,
    agentFilename,
    git,
    architecturePush,
    exportLint,
    starterChanges: {
      templatesDir: "file-exchange/exports/templates/",
      exportScriptPath: "scripts/export-architecture-starter.mjs",
      paths: starterPaths
    }
  });

  const agentDoc = {
    meta: {
      schemaVersion: "1.0.0",
      entryId,
      slug,
      generatedAt: now.toISOString(),
      humanReadableUtc,
      folderStamp,
      humanLogPath: humanRel,
      audience: "agent",
      logKind: "architecture-push",
      filledBy: "script"
    },
    summary:
      "FILL: What was exported to create-modular-monolith, npm version published, and any blockers.",
    architecturePush,
    git: {
      branch: git.branch,
      sha: git.sha,
      shortSha: git.shortSha,
      changedFiles: git.changedFiles,
      diffStatAgainstHead: git.diffStatAgainstHead,
      recentCommits: git.recentCommits
    },
    exportLint,
    starterChanges: {
      templatesDir: "file-exchange/exports/templates/",
      exportScriptPath: "scripts/export-architecture-starter.mjs",
      paths: starterPaths
    },
    changes: {
      ...changes,
      narrative: ["FILL: platform-layer changes in this architecture push"]
    },
    decisions: [
      {
        id: "D1",
        decision: "FILL",
        rationale: "FILL",
        alternativesRejected: ["FILL"]
      }
    ],
    followUps: ["FILL: e.g. npm publish OTP, update create-modular-monolith README version pin"]
  };

  await mkdir(humanDir, { recursive: true });
  await mkdir(agentDir, { recursive: true });
  await writeFile(join(humanDir, humanFilename), humanBody);
  await writeFile(join(agentDir, agentFilename), JSON.stringify(agentDoc, null, 2));

  console.log("\nArchitecture push logs created:");
  console.log(`  When (UTC): ${humanReadableUtc}`);
  console.log(`  Human: ${humanRel}`);
  console.log(`  Agent: ${agentRel}`);
  console.log(`  Git:   ${git.branch} @ ${git.shortSha}`);
  console.log(`  Starter paths in diff: ${starterPaths.length}`);
  console.log("\nNext: fill FILL sections, commit logs, push create-modular-monolith, npm publish");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
