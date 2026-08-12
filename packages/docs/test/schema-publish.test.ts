import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CANONICAL_SCHEMA_PATH, DIST_SCHEMA_PATH, DOCS_DIST } from "../data/paths";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("schema publication", () => {
  it("has a canonical schema source", () => {
    expect(existsSync(CANONICAL_SCHEMA_PATH)).toBe(true);
    const schema = JSON.parse(readFileSync(CANONICAL_SCHEMA_PATH, "utf8")) as {
      $id?: string;
    };
    expect(schema.$id).toBe("https://ai-json.org/schema/v1.json");
  });

  it("copies the canonical schema byte-for-byte into a publish directory", () => {
    const outDir = mkdtempSync(join(tmpdir(), "ai-json-docs-schema-"));
    tempDirs.push(outDir);
    const destination = join(outDir, "schema/v1.json");
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(CANONICAL_SCHEMA_PATH, destination);

    const source = readFileSync(CANONICAL_SCHEMA_PATH);
    const published = readFileSync(destination);
    expect(Buffer.compare(source, published)).toBe(0);
  });

  it("keeps the docs build output identical to the canonical schema when present", () => {
    if (!existsSync(DOCS_DIST)) {
      return;
    }
    expect(existsSync(DIST_SCHEMA_PATH)).toBe(true);
    const source = readFileSync(CANONICAL_SCHEMA_PATH);
    const published = readFileSync(DIST_SCHEMA_PATH);
    expect(Buffer.compare(source, published)).toBe(0);
  });
});
