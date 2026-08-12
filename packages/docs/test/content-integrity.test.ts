import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { availableExamples } from "../data/examples";
import { DOCS_ROOT, EXAMPLES_DIR, SPECIFICATION_PATH } from "../data/paths";
import { CLI_PACKAGE, CORE_PACKAGE, NPM_PUBLISHED, SCHEMA_URL, SITE_URL } from "../data/site";

function collectSourceFiles(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      files.push(...collectSourceFiles(absolute));
      continue;
    }
    if (/\.(tsx?|mdx?|css|json)$/.test(entry.name)) {
      files.push(absolute);
    }
  }
  return files;
}

describe("docs content integrity", () => {
  it("keeps canonical specification and example paths available to the website", () => {
    expect(existsSync(SPECIFICATION_PATH)).toBe(true);
    for (const example of availableExamples) {
      expect(existsSync(join(EXAMPLES_DIR, example.repoPath.replace("examples/", "")))).toBe(true);
    }
  });

  it("documents the canonical schema URL", () => {
    expect(SCHEMA_URL).toBe("https://ai-json.org/schema/v1.json");
    expect(SITE_URL).toBe("https://ai-json.org");
  });

  it("uses the current package names", () => {
    expect(CLI_PACKAGE).toBe("@ai-json-spec/cli");
    expect(CORE_PACKAGE).toBe("@ai-json-spec/core");
  });

  it("does not claim npm packages are installable while unpublished", () => {
    expect(NPM_PUBLISHED).toBe(false);

    const sources = collectSourceFiles(DOCS_ROOT)
      .filter((file) => !file.includes(`${DOCS_ROOT}/test/`))
      .map((file) => ({ file, content: readFileSync(file, "utf8") }));

    for (const { file, content } of sources) {
      if (!content.includes(`npx ${CLI_PACKAGE}`)) continue;
      const hasGuard =
        content.includes("Not published yet") ||
        content.includes("Once") ||
        content.includes("After npm publish") ||
        content.includes("intended public usage") ||
        content.includes("NPM_PUBLISHED");
      expect(hasGuard, `Unpublished npx usage without guard in ${file}`).toBe(true);
    }
  });

  it("defines the required documentation routes", () => {
    const required = [
      "index.mdx",
      "why.mdx",
      "specification.md",
      "examples.mdx",
      "cli.mdx",
      "security.mdx",
      "roadmap.mdx",
      "404.mdx",
    ];
    for (const file of required) {
      expect(existsSync(join(DOCS_ROOT, file)), file).toBe(true);
    }
  });

  it("keeps internal page links pointed at existing routes", () => {
    const routes = new Set([
      "/",
      "/why",
      "/specification",
      "/examples",
      "/cli",
      "/security",
      "/roadmap",
      "/schema/v1.json",
    ]);

    const linkPattern = /href=\{?(?:href\()?["'](\/[^"'#?]*)/g;
    const sources = collectSourceFiles(join(DOCS_ROOT, "components")).concat(
      collectSourceFiles(join(DOCS_ROOT, "data")),
      join(DOCS_ROOT, ".preactpress/theme/Layout.tsx"),
    );

    for (const file of sources) {
      if (!existsSync(file)) continue;
      const content = readFileSync(file, "utf8");
      for (const match of content.matchAll(linkPattern)) {
        const route = match[1] ?? "";
        if (!route.startsWith("/")) continue;
        if (route.startsWith("/examples#")) continue;
        expect(routes.has(route) || route.startsWith("/examples"), `${file} -> ${route}`).toBe(
          true,
        );
      }
    }
  });
});
