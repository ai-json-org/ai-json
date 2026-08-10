import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { analyzeAiJsonReadiness } from "../src/index.js";

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir !== undefined) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe("analyzeAiJsonReadiness", () => {
  it("scores a complete repository at 100", async () => {
    tempDir = await createRepo({ complete: true });

    const result = await analyzeAiJsonReadiness({ root: tempDir });

    expect(result.score).toBe(100);
    expect(result.recommendations).toEqual([]);
    expect(result.checks).toMatchSnapshot();
  });

  it("scores partial readiness deterministically", async () => {
    tempDir = await createRepo({ complete: false });

    const result = await analyzeAiJsonReadiness({ root: tempDir });

    expect(result.score).toBe(68);
    expect(result.recommendations).toMatchInlineSnapshot(`
      [
        "Add a typecheck command.",
        "Reference an AGENTS.md file and ensure it exists.",
        "Add architecture documentation.",
        "Add or reference a docs path.",
        "Reference the primary tests path.",
        "Explicitly define network permissions.",
      ]
    `);
    expect(result.checks).toMatchSnapshot();
  });

  it("scores a missing manifest without throwing", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ai-json-doctor-"));

    const result = await analyzeAiJsonReadiness({ root: tempDir });

    expect(result.score).toBe(0);
    expect(result.issues).toEqual([]);
    expect(result.checks).toMatchSnapshot();
  });
});

async function createRepo({ complete }: { complete: boolean }): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "ai-json-doctor-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "AGENTS.md"), "# Agents\n", "utf8");

  const manifest = complete
    ? {
        version: 1,
        project: { name: "complete" },
        commands: {
          build: "pnpm build",
          test: "pnpm test",
          lint: "pnpm lint",
          typecheck: "pnpm typecheck",
        },
        context: {
          agents: "AGENTS.md",
          architecture: "ARCHITECTURE.md",
          docs: "docs/",
          source: "src/",
          tests: "tests/",
        },
        permissions: { filesystem: "workspace", network: false },
        quality: { required: ["lint", "typecheck", "test", "build"] },
      }
    : {
        version: 1,
        project: { name: "partial" },
        commands: { build: "pnpm build", test: "pnpm test", lint: "pnpm lint" },
        context: { source: "src/" },
        permissions: { filesystem: "workspace" },
        quality: { required: ["lint", "test"] },
      };

  if (complete) {
    await mkdir(join(root, "docs"));
    await mkdir(join(root, "tests"));
    await writeFile(join(root, "ARCHITECTURE.md"), "# Architecture\n", "utf8");
  }

  await writeFile(join(root, "ai.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return root;
}
