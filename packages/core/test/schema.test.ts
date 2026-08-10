import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

const root = new URL("../../..", import.meta.url).pathname;
const schemaPath = join(root, "schema", "v1.json");

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function jsonFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  return entries.filter((entry) => entry.endsWith(".json")).map((entry) => join(dir, entry));
}

describe("schema/v1.json", () => {
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
});
