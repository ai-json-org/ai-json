/* eslint-disable no-await-in-loop */
import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, join, parse, resolve } from "node:path";
import { AiJsonNotFoundError } from "./errors.js";
import { parseAiJson } from "./parse.js";
import type { AiJson } from "./types.js";

export async function loadAiJson(path = "ai.json"): Promise<AiJson> {
  return parseAiJson(await readFile(path, "utf8"));
}

export async function findAiJson(startDirectory = process.cwd()): Promise<string> {
  let current = resolve(startDirectory);

  for (;;) {
    const candidate = join(current, "ai.json");
    try {
      await readFile(candidate, "utf8");
      return candidate;
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }
    }

    const parent = dirname(current);
    if (parent === current || current === parse(current).root) {
      throw new AiJsonNotFoundError(
        isAbsolute(startDirectory) ? startDirectory : resolve(startDirectory),
      );
    }
    current = parent;
  }
}

function isNotFoundError(error: unknown): boolean {
  return isNodeError(error) && error.code === "ENOENT";
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}
