#!/usr/bin/env node
import { readFile, readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const agentDir = join(repoRoot, "work-log/architecture-push-logs/agent");

const files = (await readdir(agentDir)).filter((f) => f.endsWith(".json")).sort();
if (!files.length) {
  console.error("No architecture push agent logs found.");
  process.exit(1);
}

const latest = files[files.length - 1];
const agentPath = join(agentDir, latest);
const humanName = latest.replace("_arch-push-agent_", "_arch-push_").replace(/\.json$/, ".md");
const humanPath = join(repoRoot, "work-log/architecture-push-logs/human", humanName);

const agent = JSON.parse(await readFile(agentPath, "utf8"));
const human = await readFile(humanPath, "utf8");

const required = [
  "meta",
  "summary",
  "architecturePush",
  "git",
  "exportLint",
  "starterChanges",
  "changes",
  "decisions",
  "followUps"
];
const missing = required.filter((k) => !(k in agent));

console.log("Latest architecture push pair:");
console.log("  agent:", agentPath.replace(repoRoot + "/", ""));
console.log("  human:", humanPath.replace(repoRoot + "/", ""));

let failed = 0;
function assert(name, ok) {
  console.log(ok ? "  PASS" : "  FAIL", name);
  if (!ok) failed += 1;
}

assert("agent JSON has required keys", missing.length === 0);
assert("meta.logKind architecture-push", agent.meta?.logKind === "architecture-push");
assert("humanReadableUtc in meta", Boolean(agent.meta?.humanReadableUtc));
assert("target create-modular-monolith", /create-modular-monolith/.test(agent.architecturePush?.targetRepo || ""));
assert("human: long-form UTC header", human.includes("When (UTC)"));
assert("human: export summary", human.includes("I. Export summary"));
assert("human: mermaid export flow", human.includes("```mermaid"));
assert("human: fill narrative", human.includes("IV. Narrative"));

console.log(failed === 0 ? "\nAll checks passed." : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
