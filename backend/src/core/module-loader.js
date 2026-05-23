import { readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getEventBus } from "../shared/events/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadModules(app) {
  const modulesDir = join(__dirname, "../modules");
  if (!existsSync(modulesDir)) return;

  const moduleContext = { eventBus: getEventBus() };
  const names = readdirSync(modulesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .filter((d) => !d.name.startsWith("_"))
    .filter((d) => !d.name.startsWith("."))
    .map((d) => d.name);

  for (const name of names) {
    const moduleEntry = join(modulesDir, name, "index.js");
    if (!existsSync(moduleEntry)) continue;

    try {
      const mod = await import(`../modules/${name}/index.js`);
      if (typeof mod.register === "function") {
        mod.register(app, moduleContext);
        console.log(`✓ Module loaded: ${name}`);
      } else {
        console.warn(`! Module ignored (missing register): ${name}`);
      }
    } catch (error) {
      console.error(`✗ Module failed: ${name} —`, error.message);
    }
  }
}
