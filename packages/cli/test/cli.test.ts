/* eslint-disable no-await-in-loop */
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateAiJson } from "@ai-json-spec/core";
import { main } from "../src/index.js";

let cwd: string | undefined;
const originalCwd = process.cwd();
let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(async () => {
  process.chdir(originalCwd);
  vi.restoreAllMocks();
  if (cwd !== undefined) {
    await rm(cwd, { recursive: true, force: true });
    cwd = undefined;
  }
});

describe("@ai-json-spec/cli validate", () => {
  it("locates ai.json upward and reports success", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    const nested = join(cwd, "a", "b");
    await mkdir(nested, { recursive: true });
    await writeFile(
      join(cwd, "ai.json"),
      JSON.stringify({
        $schema: "https://ai-json.org/schema/v1.json",
        version: 1,
        project: { name: "ok" },
        commands: { lint: "pnpm lint", test: "pnpm test" },
        quality: { required: ["lint", "test"] },
      }),
      "utf8",
    );
    process.chdir(nested);

    await expect(main(["validate"])).resolves.toBe(0);

    expect(logOutput()).toContain("✓ ai.json valid");
    expect(logOutput()).toContain("Version: 1");
    expect(logOutput()).toContain("Commands: 2");
    expect(logOutput()).toContain("Quality gates: 2");
  });

  it("validates an explicit path", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    const file = join(cwd, "custom.ai.json");
    await writeFile(file, JSON.stringify({ version: 1, project: {}, commands: {} }), "utf8");

    await expect(main(["validate", file])).resolves.toBe(0);
  });

  it("returns 1 for schema and semantic validation failures", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    process.chdir(cwd);
    await writeFile(
      join(cwd, "ai.json"),
      JSON.stringify({
        version: 1,
        project: {},
        commands: { test: "pnpm test" },
        permissions: { filesystem: "root" },
        quality: { required: ["test", "security"] },
      }),
      "utf8",
    );

    await expect(main(["validate"])).resolves.toBe(1);

    expect(logOutput()).toContain("✗ ai.json invalid");
    expect(logOutput()).toContain("permissions.filesystem");
    expect(logOutput()).toContain("Expected: none | read | workspace");
    expect(logOutput()).toContain("Received: root");
    expect(logOutput()).toContain("quality.required[1]");
    expect(logOutput()).toContain('Command "security" is not defined in commands.');
  });

  it("returns 1 for malformed JSON", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    process.chdir(cwd);
    await writeFile(join(cwd, "ai.json"), "{", "utf8");

    await expect(main(["validate"])).resolves.toBe(1);

    expect(logOutput()).toContain("✗ ai.json invalid");
    expect(logOutput()).toContain("invalid_json");
  });

  it("returns 2 when no ai.json can be found", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    process.chdir(cwd);

    await expect(main(["validate"])).resolves.toBe(2);

    expect(errorOutput()).toContain("✗ ai.json error");
  });

  it("returns 2 for invalid validate arguments", async () => {
    await expect(main(["validate", "--unknown"])).resolves.toBe(2);
  });

  it("emits stable JSON output for CI", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    process.chdir(cwd);
    await writeFile(
      join(cwd, "ai.json"),
      JSON.stringify({ version: 1, project: {}, commands: { test: "pnpm test" } }),
      "utf8",
    );

    await expect(main(["validate", "--json"])).resolves.toBe(0);

    const output = JSON.parse(logOutput());
    expect(output).toMatchObject({
      valid: true,
      version: 1,
      commands: 1,
      qualityGates: 0,
      issues: [],
    });
    expect(Object.keys(output)).toEqual([
      "valid",
      "path",
      "version",
      "commands",
      "qualityGates",
      "issues",
    ]);
  });

  it("emits JSON errors without decorative output", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    process.chdir(cwd);
    await writeFile(join(cwd, "ai.json"), JSON.stringify({ project: {}, commands: {} }), "utf8");

    await expect(main(["validate", "--json"])).resolves.toBe(1);

    const output = JSON.parse(logOutput());
    expect(output.valid).toBe(false);
    expect(output.issues[0]).toEqual({
      path: "version",
      code: "missing_required",
      message: "version is required.",
    });
    expect(logOutput()).not.toContain("✗");
  });

  it("matches core validation validity for representative documents", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    const documents = [
      { version: 1, project: {}, commands: {} },
      { version: 1, project: {}, commands: { "format:check": "pnpm format:check" } },
      { version: 1, project: {}, commands: { "format check": "pnpm format:check" } },
      { version: 1, project: {}, commands: {}, prompt: "not allowed" },
      {
        version: 1,
        project: {},
        commands: { test: "pnpm test" },
        quality: { required: ["missing"] },
      },
    ];

    for (const [index, document] of documents.entries()) {
      logSpy.mockClear();
      errorSpy.mockClear();
      const file = join(cwd, `case-${index}.json`);
      await writeFile(file, JSON.stringify(document), "utf8");

      const exitCode = await main(["validate", file, "--json"]);
      expect(exitCode === 0, `CLI case ${index}`).toBe(validateAiJson(document).valid);
    }
  });
});

describe("@ai-json-spec/cli check", () => {
  it("runs required quality gates in declared order", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    process.chdir(cwd);
    await writeCheckManifest(cwd, {
      commands: {
        lint: appendCommand(cwd, "lint"),
        test: appendCommand(cwd, "test"),
        build: appendCommand(cwd, "build"),
        unused: appendCommand(cwd, "unused"),
      },
      required: ["lint", "test", "build"],
    });

    await expect(main(["check"])).resolves.toBe(0);

    await expect(readFile(join(cwd, "order.txt"), "utf8")).resolves.toBe("lint\ntest\nbuild\n");
    expect(logOutput()).toContain("AI Quality Gate");
    expect(logOutput()).toContain("Quality gate passed.");
  });

  it("stops on first failure by default and returns that exit code", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    process.chdir(cwd);
    await writeCheckManifest(cwd, {
      commands: {
        lint: appendCommand(cwd, "lint"),
        test: 'node -e "process.exit(3)"',
        build: appendCommand(cwd, "build"),
      },
      required: ["lint", "test", "build"],
    });

    await expect(main(["check"])).resolves.toBe(3);

    await expect(readFile(join(cwd, "order.txt"), "utf8")).resolves.toBe("lint\n");
    expect(logOutput()).toContain("Quality gate failed.");
  });

  it("continues after failures with --continue", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    process.chdir(cwd);
    await writeCheckManifest(cwd, {
      commands: {
        lint: 'node -e "process.exit(4)"',
        test: appendCommand(cwd, "test"),
      },
      required: ["lint", "test"],
    });

    await expect(main(["check", "--continue"])).resolves.toBe(4);

    await expect(readFile(join(cwd, "order.txt"), "utf8")).resolves.toBe("test\n");
  });

  it("supports --dry-run without executing commands", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    process.chdir(cwd);
    await writeCheckManifest(cwd, {
      commands: { lint: appendCommand(cwd, "lint") },
      required: ["lint"],
    });

    await expect(main(["check", "--dry-run"])).resolves.toBe(0);

    await expect(readFile(join(cwd, "order.txt"), "utf8")).rejects.toMatchObject({
      code: "ENOENT",
    });
    expect(logOutput()).toContain("Dry run: no commands executed.");
  });

  it("supports JSON output", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    process.chdir(cwd);
    await writeCheckManifest(cwd, {
      commands: { lint: appendCommand(cwd, "lint") },
      required: ["lint"],
    });

    await expect(main(["check", "--json"])).resolves.toBe(0);

    const output = JSON.parse(logOutput());
    expect(output).toMatchObject({ ok: true, dryRun: false, issues: [] });
    expect(output.results).toHaveLength(1);
    expect(output.results[0]).toMatchObject({ name: "lint", skipped: false, exitCode: 0 });
  });

  it("returns 2 for missing or invalid quality configuration", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    process.chdir(cwd);
    await writeFile(
      join(cwd, "ai.json"),
      JSON.stringify({ version: 1, project: {}, commands: {} }),
      "utf8",
    );

    await expect(main(["check"])).resolves.toBe(2);

    expect(errorOutput()).toContain("configuration error");
  });
});

describe("@ai-json-spec/cli doctor", () => {
  it("prints repository readiness without changing files", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    process.chdir(cwd);
    await writeFile(
      join(cwd, "ai.json"),
      JSON.stringify({
        version: 1,
        project: { name: "doctor" },
        commands: { build: "pnpm build", test: "pnpm test", lint: "pnpm lint" },
        context: { docs: "docs/", source: "src/" },
        permissions: { filesystem: "workspace" },
        quality: { required: ["lint", "test", "build"] },
      }),
      "utf8",
    );
    await mkdir(join(cwd, "docs"));
    await mkdir(join(cwd, "src"));
    const before = await readFile(join(cwd, "ai.json"), "utf8");

    await expect(main(["doctor"])).resolves.toBe(0);

    expect(await readFile(join(cwd, "ai.json"), "utf8")).toBe(before);
    expect(logOutput()).toContain("AI Readiness:");
    expect(logOutput()).toContain("Manifest");
    expect(logOutput()).toContain("✓ ai.json valid");
    expect(logOutput()).toContain("! typecheck");
    expect(logOutput()).toContain("Recommendations:");
  });

  it("supports machine-readable doctor output", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    process.chdir(cwd);
    await writeFile(
      join(cwd, "ai.json"),
      JSON.stringify({ version: 1, project: {}, commands: {}, permissions: { network: false } }),
      "utf8",
    );

    await expect(main(["doctor", "--json"])).resolves.toBe(0);

    const output = JSON.parse(logOutput());
    expect(output).toMatchObject({ maxScore: 100 });
    expect(Array.isArray(output.checks)).toBe(true);
    expect(logOutput()).not.toContain("AI Readiness");
  });
});

describe("@ai-json-spec/cli init", () => {
  it("creates a conservative ai.json by inspecting an existing pnpm repository", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    process.chdir(cwd);
    await writeFixtureRepository(cwd);

    await expect(main(["init"])).resolves.toBe(0);

    const created = JSON.parse(await readFile(join(cwd, "ai.json"), "utf8"));
    expect(created).toEqual({
      $schema: "https://ai-json.org/schema/v1.json",
      version: 1,
      project: { name: "example-app" },
      commands: {
        dev: "pnpm dev",
        build: "pnpm build",
        test: "pnpm test",
        lint: "pnpm lint",
        typecheck: "pnpm typecheck",
        format: "pnpm format",
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
    });
    expect(logOutput()).toContain("Package manager: pnpm");
    expect(logOutput()).toContain("Created ./ai.json");
  });

  it("does not overwrite an existing ai.json without --force", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    process.chdir(cwd);
    await writeFile(join(cwd, "ai.json"), '{"existing":true}\n', "utf8");

    await expect(main(["init"])).resolves.toBe(1);

    await expect(readFile(join(cwd, "ai.json"), "utf8")).resolves.toBe('{"existing":true}\n');
    expect(errorOutput()).toContain("Use --force to overwrite");
  });

  it("overwrites an existing ai.json with --force", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    process.chdir(cwd);
    await writeFixtureRepository(cwd);
    await writeFile(join(cwd, "ai.json"), '{"existing":true}\n', "utf8");

    await expect(main(["init", "--force"])).resolves.toBe(0);

    const created = JSON.parse(await readFile(join(cwd, "ai.json"), "utf8"));
    expect(created.version).toBe(1);
    expect(created.project.name).toBe("example-app");
  });

  it("supports --dry-run without writing ai.json", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    process.chdir(cwd);
    await writeFixtureRepository(cwd);

    await expect(main(["init", "--dry-run"])).resolves.toBe(0);

    await expect(readFile(join(cwd, "ai.json"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    expect(logOutput()).toContain("Dry run: ./ai.json was not written.");
    expect(logOutput()).toContain('"name": "example-app"');
  });

  it("detects npm scripts conservatively", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    process.chdir(cwd);
    await writeFile(join(cwd, "package-lock.json"), "{}\n", "utf8");
    await writeFile(
      join(cwd, "package.json"),
      JSON.stringify({ name: "npm-app", scripts: { build: "vite build", test: "vitest" } }),
      "utf8",
    );

    await expect(main(["init"])).resolves.toBe(0);

    const created = JSON.parse(await readFile(join(cwd, "ai.json"), "utf8"));
    expect(created.commands).toEqual({ build: "npm run build", test: "npm test" });
  });

  it("never executes detected scripts", async () => {
    cwd = await mkdtemp(join(tmpdir(), "ai-json-"));
    process.chdir(cwd);
    const marker = join(cwd, "marker");
    await writeFile(
      join(cwd, "package.json"),
      JSON.stringify({ name: "safe", scripts: { test: `touch ${marker}` } }),
      "utf8",
    );

    await expect(main(["init"])).resolves.toBe(0);

    await expect(readFile(marker, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });
});

async function writeFixtureRepository(root: string): Promise<void> {
  await writeFile(join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n", "utf8");
  await writeFile(
    join(root, "package.json"),
    JSON.stringify({
      name: "example-app",
      scripts: {
        dev: "vite dev",
        build: "vite build",
        test: "vitest run",
        lint: "oxlint .",
        typecheck: "tsc --noEmit",
        format: "oxfmt . --write",
        ignored: "node ignored.js",
      },
    }),
    "utf8",
  );
  await mkdir(join(root, "src"));
  await mkdir(join(root, "tests"));
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "AGENTS.md"), "# Agents\n", "utf8");
  await writeFile(join(root, "ARCHITECTURE.md"), "# Architecture\n", "utf8");
}

async function writeCheckManifest(
  root: string,
  input: { commands: Record<string, string>; required: string[] },
): Promise<void> {
  await writeFile(
    join(root, "ai.json"),
    JSON.stringify({
      version: 1,
      project: { name: "check" },
      commands: input.commands,
      quality: { required: input.required },
    }),
    "utf8",
  );
}

function appendCommand(_root: string, label: string): string {
  return `node -e "require('fs').appendFileSync('order.txt', '${label}\\n')"`;
}

function logOutput(): string {
  return logSpy.mock.calls.map((call) => call.join(" ")).join("\n");
}

function errorOutput(): string {
  return errorSpy.mock.calls.map((call) => call.join(" ")).join("\n");
}
