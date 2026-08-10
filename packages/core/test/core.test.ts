import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  AiJsonNotFoundError,
  AiJsonParseError,
  AiJsonValidationError,
  findAiJson,
  loadAiJson,
  normalizeAiJson,
  parseAiJson,
  validateAiJson,
} from "../src/index.js";

const validContract = {
  $schema: "https://ai-json.org/schema/v1.json",
  version: 1,
  project: { name: "example" },
  commands: { test: "pnpm test", build: "pnpm build" },
  quality: { required: ["test"] },
};

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir !== undefined) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe("@ai-json/core", () => {
  it("parses a valid JSON string", () => {
    expect(parseAiJson(JSON.stringify(validContract))).toEqual(validContract);
  });

  it("parses a valid object without mutating it", () => {
    const input = structuredClone(validContract);
    expect(parseAiJson(input)).toEqual(validContract);
    expect(input).toEqual(validContract);
  });

  it("throws a typed parse error for malformed JSON", () => {
    expect(() => parseAiJson("{")).toThrow(AiJsonParseError);
  });

  it("throws a typed validation error for invalid input", () => {
    expect(() => parseAiJson({ version: 2, project: {}, commands: {} })).toThrow(
      AiJsonValidationError,
    );
  });

  it("returns deterministic validation issues", () => {
    const result = validateAiJson({
      zzz: true,
      permissions: { filesystem: "read-only" },
      version: 2,
      project: { extra: true },
      commands: { test: "" },
      quality: { required: ["test", "test", "missing"] },
    });

    expect(result).toEqual({
      valid: false,
      issues: [
        { path: "zzz", code: "unknown_property", message: "Unknown top-level property." },
        { path: "version", code: "invalid_value", message: "Expected version 1." },
        { path: "project.extra", code: "unknown_property", message: "Unknown project property." },
        {
          path: "commands.test",
          code: "invalid_value",
          message: "Expected non-empty command string.",
        },
        {
          path: "permissions.filesystem",
          code: "invalid_value",
          message: "Expected one of: none, read, workspace.",
        },
        {
          path: "quality.required.1",
          code: "duplicate_value",
          message: "Duplicate quality command.",
        },
        {
          path: "quality.required.2",
          code: "invalid_value",
          message: "Must reference a command key.",
        },
      ],
    });
  });

  it("reports malformed JSON through validateAiJson", () => {
    expect(validateAiJson("{")).toEqual({
      valid: false,
      issues: [{ path: "", code: "invalid_json", message: "Input is not valid JSON." }],
    });
  });

  it("normalizes optional fields and sorts deterministic collections", () => {
    expect(normalizeAiJson(validContract)).toEqual({
      $schema: "https://ai-json.org/schema/v1.json",
      version: 1,
      project: { name: "example", type: "" },
      commands: { build: "pnpm build", test: "pnpm test" },
      context: { agents: "", architecture: "", docs: "", source: "", tests: "" },
      permissions: { filesystem: "none", network: false },
      quality: { required: ["test"] },
    });
  });

  it("loads ai.json from disk", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ai-json-core-"));
    const path = join(tempDir, "ai.json");
    await writeFile(path, `${JSON.stringify(validContract)}\n`, "utf8");

    await expect(loadAiJson(path)).resolves.toEqual(validContract);
  });

  it("finds ai.json by walking upward", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ai-json-core-"));
    const nested = join(tempDir, "a", "b", "c");
    await mkdir(nested, { recursive: true });
    const expected = join(tempDir, "ai.json");
    await writeFile(expected, `${JSON.stringify(validContract)}\n`, "utf8");

    await expect(findAiJson(nested)).resolves.toBe(expected);
  });

  it("throws when ai.json cannot be found", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ai-json-core-"));

    await expect(findAiJson(tempDir)).rejects.toBeInstanceOf(AiJsonNotFoundError);
  });

  it("does not execute commands while parsing", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ai-json-core-"));
    const marker = join(tempDir, "marker");
    const input = {
      version: 1,
      project: {},
      commands: { test: `touch ${marker}` },
    };

    expect(parseAiJson(input).commands.test).toBe(`touch ${marker}`);
    await expect(readFile(marker, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });
});
