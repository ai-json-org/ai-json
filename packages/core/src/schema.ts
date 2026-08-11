import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export type JsonSchema = Record<string, unknown>;

const packagedSchemaUrl = new URL("./schema/v1.json", import.meta.url);
const workspaceSchemaUrl = new URL("../../../schema/v1.json", import.meta.url);

export const aiJsonSchema = readSchemaSync();

export async function loadAiJsonSchema(schemaPath?: string): Promise<JsonSchema> {
  if (schemaPath === undefined) {
    return structuredClone(aiJsonSchema);
  }

  const raw = await readFile(schemaPath, "utf8");
  return parseSchema(raw, schemaPath);
}

function readSchemaSync(): JsonSchema {
  const candidates = [packagedSchemaUrl, workspaceSchemaUrl];
  for (const candidate of candidates) {
    try {
      return parseSchema(readFileSync(candidate, "utf8"), fileURLToPath(candidate));
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }
    }
  }
  throw new Error("Could not find schema/v1.json.");
}

function parseSchema(raw: string, path: string): JsonSchema {
  const parsed: unknown = JSON.parse(raw);
  if (!isObject(parsed)) {
    throw new Error(`Schema at ${path} must be a JSON object.`);
  }
  return parsed;
}

function isObject(value: unknown): value is JsonSchema {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNotFoundError(error: unknown): boolean {
  return isNodeError(error) && error.code === "ENOENT";
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}
