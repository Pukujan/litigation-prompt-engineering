import { readFile, access } from "fs/promises";
import { join } from "path";
import { AppError } from "../../../shared/http/errors.js";

export function createOnboardingService({ repoRoot }) {
  const guidePath = join(repoRoot, "docs/onboarding/pipeline-guide.md");

  async function readGuide() {
    try {
      await access(guidePath);
    } catch {
      throw new AppError("Onboarding guide not found", 404);
    }
    return readFile(guidePath, "utf8");
  }

  function guideToJson(markdown) {
    const sections = [];
    const lines = markdown.split("\n");
    let current = null;

    for (const line of lines) {
      if (line.startsWith("## ")) {
        if (current) sections.push(current);
        current = {
          id: line
            .slice(3)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-"),
          title: line.slice(3).trim(),
          bodyMd: ""
        };
      } else if (current) {
        current.bodyMd += `${line}\n`;
      }
    }
    if (current) sections.push(current);

    return {
      title: "Case Filing Pipeline Guide",
      sections
    };
  }

  async function getGuide(format = "json") {
    const markdown = await readGuide();
    if (format === "md") {
      return { type: "md", body: markdown };
    }
    return { type: "json", body: guideToJson(markdown) };
  }

  return { getGuide, guidePath };
}
