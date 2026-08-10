import { AiJsonParseError, AiJsonValidationError } from "./errors.js";
import type { AiJson } from "./types.js";
import { validateAiJson } from "./validate.js";

export function parseAiJson(input: string | unknown): AiJson {
  const value = parseUnknown(input);
  const result = validateAiJson(value);

  if (!result.valid) {
    throw new AiJsonValidationError(result.issues);
  }

  return value as AiJson;
}

function parseUnknown(input: string | unknown): unknown {
  if (typeof input !== "string") {
    return input;
  }

  try {
    return JSON.parse(input) as unknown;
  } catch (error) {
    throw new AiJsonParseError(input, error);
  }
}
