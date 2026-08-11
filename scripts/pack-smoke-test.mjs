import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const packDir = mkdtempSync(join(tmpdir(), "ai-json-pack-"));
const projectDir = mkdtempSync(join(tmpdir(), "ai-json-install-"));

try {
  run("pnpm", ["clean"], root);
  run("pnpm", ["--filter", "@ai-json-spec/core", "build"], root);
  run("pnpm", ["--filter", "@ai-json-spec/cli", "build"], root);

  const coreTarball = packPackage(join(root, "packages", "core"));
  const cliTarball = packPackage(join(root, "packages", "cli"));

  assertTarballContains(coreTarball, [
    "package/package.json",
    "package/README.md",
    "package/LICENSE",
    "package/dist/index.js",
    "package/dist/index.d.ts",
    "package/dist/schema/v1.json",
  ]);
  assertTarballContains(cliTarball, [
    "package/package.json",
    "package/README.md",
    "package/LICENSE",
    "package/dist/index.js",
    "package/dist/index.d.ts",
  ]);

  writeFileSync(
    join(projectDir, "package.json"),
    `${JSON.stringify({ name: "ai-json-pack-smoke", private: true, type: "module" }, null, 2)}\n`,
    "utf8",
  );

  run("npm", ["install", coreTarball, cliTarball], projectDir);
  writeFileSync(
    join(projectDir, "ai.json"),
    `${JSON.stringify(
      {
        $schema: "https://ai-json.org/schema/v1.json",
        version: 1,
        project: { name: "ai-json-pack-smoke" },
        commands: { test: 'node -e "process.exit(0)"' },
        quality: { required: ["test"] },
        permissions: { network: false },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  run(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      `import { aiJsonSchema, validateAiJson } from "@ai-json-spec/core";
import schema from "@ai-json-spec/core/schema/v1.json" with { type: "json" };
if (aiJsonSchema.$id !== "https://ai-json.org/schema/v1.json") throw new Error("bad schema export");
if (schema.$id !== aiJsonSchema.$id) throw new Error("bad schema file export");
if (!validateAiJson({ version: 1, project: {}, commands: {} }).valid) throw new Error("bad validation");`,
    ],
    projectDir,
  );
  run("npx", ["--no-install", "ai-json", "validate"], projectDir);
  run("npx", ["--no-install", "ai-json", "doctor", "--json"], projectDir);
  run("npx", ["--no-install", "ai-json", "check", "--json"], projectDir);

  console.log("Package smoke test passed.");
} finally {
  rmSync(packDir, { recursive: true, force: true });
  rmSync(projectDir, { recursive: true, force: true });
}

function packPackage(cwd) {
  const output = run("pnpm", ["pack", "--pack-destination", packDir], cwd);
  const tarball = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.endsWith(".tgz"));
  if (tarball === undefined) {
    throw new Error(`Could not determine tarball from pnpm pack output:\n${output}`);
  }
  return resolve(packDir, tarball);
}

function assertTarballContains(tarball, expectedEntries) {
  const entries = run("tar", ["-tf", tarball], root).split(/\r?\n/);
  for (const entry of expectedEntries) {
    if (!entries.includes(entry)) {
      throw new Error(`${tarball} does not contain ${entry}`);
    }
  }
}

function run(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, npm_config_yes: "true" },
  });
}
