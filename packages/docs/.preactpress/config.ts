import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@kamod-ch/preactpress/config";
import { getThemeInitScript } from "@kamod-ch/themes";
import tailwindcss from "@tailwindcss/vite";
import { CANONICAL_SCHEMA_PATH, REPO_ROOT } from "../data/paths.ts";
import { GITHUB_URL, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "../data/site.ts";

const configDir = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(configDir, "..");

export default defineConfig({
  theme: "./theme/Layout.tsx",
  pageReady: false,
  /** Static asset published by buildEnd; not a markdown route. */
  ignoreDeadLinks: ["/schema/v1.json"],
  srcExclude: [
    "README.md",
    "dist/**",
    "components/**",
    "data/**",
    "styles/**",
    "public/**",
    "scripts/**",
    "test/**",
    "node_modules/**",
  ],
  site: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    base: "/",
    lang: "en",
  },
  build: {
    sitemap: true,
    robots: true,
    feed: false,
  },
  markdown: {
    html: false,
    linkify: true,
    typographer: true,
    emoji: false,
    math: false,
  },
  head: [
    ["link", { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap",
      },
    ],
    ["script", { type: "text/javascript" }, getThemeInitScript({ defaultScheme: "system" })],
    ["meta", { name: "theme-color", content: "#f59e0b" }],
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      dedupe: ["preact", "preact/hooks", "@preact/signals"],
    },
    server: {
      fs: {
        allow: [docsRoot, REPO_ROOT],
      },
    },
    ssr: {
      noExternal: [
        "@kamod-ch/ui",
        "@kamod-ch/icons",
        "@kamod-ch/themes",
        "@preact/signals",
        "preact",
        "preact/hooks",
        "@ai-json-spec/core",
      ],
    },
  },
  buildEnd({ site }) {
    if (!existsSync(CANONICAL_SCHEMA_PATH)) {
      throw new Error(
        `Canonical schema missing at ${CANONICAL_SCHEMA_PATH}. Refusing to publish docs without schema/v1.json.`,
      );
    }
    const destination = resolve(site.outDir, "schema/v1.json");
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(CANONICAL_SCHEMA_PATH, destination);
  },
  themeConfig: {
    outline: true,
    search: true,
    lastUpdated: true,
    footer: "ai.json is an experimental, framework-neutral open specification.",
    editLink: {
      text: "Edit this page",
      pattern: "https://github.com/ai-json-org/ai-json/edit/main/packages/docs/:path",
    },
    socialLinks: [
      {
        icon: "github",
        link: GITHUB_URL,
        ariaLabel: "ai.json on GitHub",
      },
    ],
    nav: [
      { text: "Why", link: "/why" },
      { text: "Specification", link: "/specification" },
      { text: "Examples", link: "/examples" },
      { text: "CLI", link: "/cli" },
      { text: "Security", link: "/security" },
      { text: "Roadmap", link: "/roadmap" },
    ],
    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "Home", link: "/" },
          { text: "Why ai.json", link: "/why" },
          { text: "Roadmap", link: "/roadmap" },
        ],
      },
      {
        text: "Specification",
        items: [
          { text: "Specification v1", link: "/specification" },
          { text: "Schema", link: "/schema/v1.json" },
          { text: "Examples", link: "/examples" },
        ],
      },
      {
        text: "Tooling",
        items: [
          { text: "CLI", link: "/cli" },
          { text: "Security", link: "/security" },
        ],
      },
    ],
  },
});
