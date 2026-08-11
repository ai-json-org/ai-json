import { execFile } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import { aiJsonSchema, loadAiJsonSchema, validateAiJson } from "../src/index.js";

const root = new URL("../../..", import.meta.url).pathname;
const schemaPath = join(root, "schema", "v1.json");
const execFileAsync = promisify(execFile);

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function jsonFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  return entries.filter((entry) => entry.endsWith(".json")).map((entry) => join(dir, entry));
}

describe("schema/v1.json", () => {
  it("is the schema exported and loaded by core", async () => {
    const canonical = await readJson(schemaPath);

    expect(aiJsonSchema).toEqual(canonical);
    await expect(loadAiJsonSchema()).resolves.toEqual(canonical);
  });

  it("includes the schema in the built core package", async () => {
    await execFileAsync("pnpm", ["--filter", "@ai-json-spec/core", "build"], { cwd: root });

    await expect(
      readJson(join(root, "packages", "core", "dist", "schema", "v1.json")),
    ).resolves.toEqual(await readJson(schemaPath));

    const packageJson = (await readJson(join(root, "packages", "core", "package.json"))) as {
      exports?: Record<string, unknown>;
      files?: string[];
    };
    expect(packageJson.files).toContain("dist");
    expect(packageJson.exports?.["./schema/v1.json"]).toBe("./dist/schema/v1.json");
  });

  it("keeps the documented command name rule consistent with schema and runtime", async () => {
    const spec = await readFile(join(root, "specification", "v1.md"), "utf8");
    const schema = (await readJson(schemaPath)) as {
      properties?: { commands?: { propertyNames?: { pattern?: string } } };
    };

    expect(spec).toContain("contain only ASCII letters, digits, `_`, `-`, `.`, and `:`");
    expect(schema.properties?.commands?.propertyNames?.pattern).toBe("^[A-Za-z0-9_.:-]+$");
    expect(
      validateAiJson({ version: 1, project: {}, commands: { "format:check": "ok" } }).valid,
    ).toBe(true);
    expect(
      validateAiJson({ version: 1, project: {}, commands: { "format/check": "ok" } }).valid,
    ).toBe(false);
  });

  it("validates valid fixtures", async () => {
    const validate = new Ajv2020({ allErrors: true }).compile(await readJson(schemaPath));
    const fixtures = await jsonFiles(join(root, "fixtures", "valid"));
    const documents = await Promise.all(fixtures.map((fixture) => readJson(fixture)));

    for (const [index, document] of documents.entries()) {
      expect(validate(document), fixtures[index]).toBe(true);
    }
  });

  it("rejects invalid fixtures", async () => {
    const validate = new Ajv2020({ allErrors: true }).compile(await readJson(schemaPath));
    const fixtures = await jsonFiles(join(root, "fixtures", "invalid"));
    const documents = await Promise.all(fixtures.map((fixture) => readJson(fixture)));

    for (const [index, document] of documents.entries()) {
      expect(validate(document), fixtures[index]).toBe(false);
    }
  });

  it("validates all examples", async () => {
    const validate = new Ajv2020({ allErrors: true }).compile(await readJson(schemaPath));
    const examples = await jsonFiles(join(root, "examples"));
    const documents = await Promise.all(examples.map((example) => readJson(example)));

    for (const [index, document] of documents.entries()) {
      expect(validate(document), examples[index]).toBe(true);
    }
  });

  it("keeps schema and runtime validator command name rules aligned", async () => {
    const validate = new Ajv2020({ allErrors: true }).compile(await readJson(schemaPath));
    const commandNames = [
      ["abc", true],
      ["ABC", true],
      ["test_1", true],
      ["format-check", true],
      ["format.check", true],
      ["format:check", true],
      ["format check", false],
      ["format/check", false],
      ["format@check", false],
      ["ümlaut", false],
      ["", false],
    ] as const;

    for (const [commandName, expected] of commandNames) {
      const document = { version: 1, project: {}, commands: { [commandName]: "echo ok" } };
      expect(validate(document), `schema ${commandName}`).toBe(expected);
      expect(validateAiJson(document).valid, `runtime ${commandName}`).toBe(expected);
    }
  });
});
