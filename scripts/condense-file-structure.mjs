#!/usr/bin/env node
/**
 * Walk the repository and write consolidated-file-structure.json
 * (excludes node_modules, .git, dist, build — same as tree -I).
 *
 * Usage: node scripts/condense-file-structure.mjs
 */
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { writeConsolidatedArtifact } from "./consolidated-output.mjs";
import { buildRepoTree, TREE_IGNORE_DIRS, TREE_IGNORE_FILES } from "./lib/repo-tree.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const { rootName, tree, treeText, stats, flatPaths } = await buildRepoTree(repoRoot);

  const doc = {
    meta: {
      generatedAt: new Date().toISOString(),
      repositoryRoot: repoRoot,
      condensedBy: "condense-file-structure",
      description:
        "Repository file tree for legal-prmpt-eng (excludes node_modules, .git, dist, build).",
      excludeDirs: TREE_IGNORE_DIRS,
      excludeFiles: TREE_IGNORE_FILES,
      treeIgnoreFlag: 'tree -I "node_modules|.git|dist|build"'
    },
    stats,
    tree,
    treeText,
    flatPaths
  };

  const { exportPath, modelsPath } = await writeConsolidatedArtifact("fileStructure", doc);
  console.log(
    `Consolidated ${stats.fileCount} files, ${stats.directoryCount} dirs → ${exportPath} (+ ${modelsPath})`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
