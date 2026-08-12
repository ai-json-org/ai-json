export const SITE_URL = "https://ai-json.org";
export const SITE_TITLE = "ai.json";
export const SITE_DESCRIPTION =
  "An experimental, framework-neutral open specification for machine-readable project contracts between repositories and AI coding agents.";
export const GITHUB_URL = "https://github.com/ai-json-org/ai-json";
export const GITHUB_FEEDBACK_URL = "https://github.com/ai-json-org/ai-json/issues";
export const SCHEMA_URL = "https://ai-json.org/schema/v1.json";
export const DRAFT_LABEL = "Draft v0.1";
export const STATUS_LINE = "Experimental draft · Breaking changes are possible before v1";

/** npm packages are prepared in this repository but not published yet. */
export const NPM_PUBLISHED = false;
export const CLI_PACKAGE = "@ai-json-spec/cli";
export const CORE_PACKAGE = "@ai-json-spec/core";
export const CLI_BIN = "ai-json";

export const PRIMARY_NAV = [
  { text: "Why", link: "/why" },
  { text: "Specification", link: "/specification" },
  { text: "Examples", link: "/examples" },
  { text: "CLI", link: "/cli" },
  { text: "Security", link: "/security" },
  { text: "GitHub", link: GITHUB_URL, external: true },
] as const;

export const FOOTER_LINKS = [
  { text: "Specification", link: "/specification" },
  { text: "Schema", link: "/schema/v1.json" },
  { text: "Examples", link: "/examples" },
  { text: "Security", link: "/security" },
  { text: "Roadmap", link: "/roadmap" },
  { text: "GitHub", link: GITHUB_URL, external: true },
  { text: "License", link: `${GITHUB_URL}/blob/main/LICENSE`, external: true },
] as const;
