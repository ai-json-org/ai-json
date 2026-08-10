import { readFile } from "node:fs/promises";
import { AI_JSON_VERSION } from "./types.js";

export type JsonSchema = Record<string, unknown>;

export const embeddedAiJsonSchema: JsonSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://ai-json.org/schema/v1.json",
  title: "ai.json v1",
  type: "object",
  additionalProperties: false,
  required: ["version", "project", "commands"],
  properties: {
    $schema: { type: "string", const: "https://ai-json.org/schema/v1.json" },
    version: { type: "integer", const: AI_JSON_VERSION },
    project: {
      type: "object",
      additionalProperties: false,
      properties: { name: { type: "string" }, type: { type: "string" } },
    },
    commands: {
      type: "object",
      propertyNames: { type: "string", minLength: 1 },
      additionalProperties: { type: "string", minLength: 1 },
    },
    context: {
      type: "object",
      additionalProperties: false,
      properties: {
        agents: { $ref: "#/$defs/relativeProjectPath" },
        architecture: { $ref: "#/$defs/relativeProjectPath" },
        docs: { $ref: "#/$defs/relativeProjectPath" },
        source: { $ref: "#/$defs/relativeProjectPath" },
        tests: { $ref: "#/$defs/relativeProjectPath" },
      },
    },
    permissions: {
      type: "object",
      additionalProperties: false,
      properties: {
        filesystem: { type: "string", enum: ["none", "read", "workspace"] },
        network: { type: "boolean" },
      },
    },
    quality: {
      type: "object",
      additionalProperties: false,
      properties: {
        required: { type: "array", items: { type: "string", minLength: 1 }, uniqueItems: true },
      },
    },
  },
  $defs: {
    relativeProjectPath: {
      type: "string",
      minLength: 1,
      pattern: "^(?!/)(?![A-Za-z][A-Za-z0-9+.-]*:)(?!.*(?:^|/)\\.\\.(?:/|$)).+$",
    },
  },
};

export async function loadAiJsonSchema(schemaPath?: string): Promise<JsonSchema> {
  if (schemaPath === undefined) {
    return embeddedAiJsonSchema;
  }

  const raw = await readFile(schemaPath, "utf8");
  const parsed: unknown = JSON.parse(raw);
  if (!isObject(parsed)) {
    throw new Error(`Schema at ${schemaPath} must be a JSON object.`);
  }
  return parsed;
}

function isObject(value: unknown): value is JsonSchema {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
