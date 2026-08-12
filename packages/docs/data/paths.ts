import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/** Repository root (ai.json monorepo). */
export const REPO_ROOT = resolve(here, "../../..");

/** Canonical schema source — never maintain a second copy by hand. */
export const CANONICAL_SCHEMA_PATH = resolve(REPO_ROOT, "schema/v1.json");

/** Docs package root. */
export const DOCS_ROOT = resolve(here, "..");

/** PreactPress build output. */
export const DOCS_DIST = resolve(DOCS_ROOT, "dist");

/** Published schema path inside the docs build output. */
export const DIST_SCHEMA_PATH = resolve(DOCS_DIST, "schema/v1.json");

export const EXAMPLES_DIR = resolve(REPO_ROOT, "examples");
export const SPECIFICATION_PATH = resolve(REPO_ROOT, "specification/v1.md");
