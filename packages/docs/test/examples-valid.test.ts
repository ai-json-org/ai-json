import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import { validateAiJson } from "@ai-json-spec/core";
import {
  allDisplayedExampleDocuments,
  availableExamples,
  heroExample,
  heroExampleJson,
} from "../data/examples";
import { CANONICAL_SCHEMA_PATH, EXAMPLES_DIR } from "../data/paths";

const schema = JSON.parse(readFileSync(CANONICAL_SCHEMA_PATH, "utf8")) as object;
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateSchema = ajv.compile(schema);

describe("website ai.json examples", () => {
  it("uses the canonical web-app example as the hero sample", () => {
    const onDisk = JSON.parse(readFileSync(join(EXAMPLES_DIR, "web-app.json"), "utf8"));
    expect(heroExample).toEqual(onDisk);
    expect(JSON.parse(heroExampleJson)).toEqual(onDisk);
  });

  it("validates every displayed full example against the canonical schema", () => {
    for (const document of allDisplayedExampleDocuments) {
      expect(validateSchema(document), JSON.stringify(validateSchema.errors)).toBe(true);
      const semantic = validateAiJson(document);
      expect(semantic.valid, JSON.stringify(semantic.issues)).toBe(true);
    }
  });

  it("covers every example file that exists in examples/", () => {
    const files = readdirSync(EXAMPLES_DIR)
      .filter((name) => name.endsWith(".json"))
      .toSorted();
    const covered = availableExamples
      .map((item) => item.repoPath.replace("examples/", ""))
      .toSorted();
    expect(covered).toEqual(files);
  });

  it("keeps example metadata paths aligned with repository files", () => {
    for (const example of availableExamples) {
      const absolute = join(EXAMPLES_DIR, example.repoPath.replace("examples/", ""));
      const onDisk = JSON.parse(readFileSync(absolute, "utf8"));
      expect(example.document).toEqual(onDisk);
    }
  });
});
