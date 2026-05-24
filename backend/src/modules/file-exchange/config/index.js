import { join } from "path";
import { fileURLToPath } from "url";

const defaultRepoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "../../../../..");

export function getModuleConfig() {
  return {
    name: "file-exchange",
    label: "File Exchange",
    repoRoot: process.env.FILE_EXCHANGE_REPO_ROOT || defaultRepoRoot
  };
}
