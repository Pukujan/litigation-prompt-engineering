import { readdirSync, readFileSync, existsSync } from "fs";
import { join, relative } from "path";

const apps = [
  { name: "backend", root: new URL("../", import.meta.url).pathname, modulesSubpath: "src/modules" },
  {
    name: "frontend",
    root: new URL("../../frontend/", import.meta.url).pathname,
    modulesSubpath: "src/modules"
  }
];

const forbidden = [];

for (const app of apps) {
  const modulesDir = join(app.root, app.modulesSubpath);
  if (!existsSync(modulesDir)) continue;

  const moduleNames = readdirSync(modulesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .filter((d) => !d.name.startsWith("."))
    .map((d) => d.name);

  for (const moduleName of moduleNames) {
    // model-condenser embeds repo path strings in schema inventory metadata only (no imports).
    if (moduleName === "model-condenser") continue;

    const moduleRoot = join(modulesDir, moduleName);
    const files = walk(moduleRoot).filter((f) =>
      [".js", ".mjs", ".jsx"].some((ext) => f.endsWith(ext))
    );

    for (const file of files) {
      const source = readFileSync(file, "utf8");

      for (const other of moduleNames) {
        if (other === moduleName) continue;
        const needle = `/modules/${other}/`;
        if (source.includes(needle)) {
          forbidden.push({
            app: app.name,
            file: relative(app.root, file),
            moduleName,
            other,
            needle
          });
        }
      }
    }
  }
}

if (forbidden.length) {
  console.error("Module boundary violations found:\n");
  for (const hit of forbidden) {
    console.error(`- [${hit.app}] ${hit.file} references cross-module path (${hit.needle})`);
  }
  process.exit(1);
}

console.log("Module boundaries OK.");

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}
