import libraryExample from "../../../examples/library.json" with { type: "json" };
import minimalExample from "../../../examples/minimal.json" with { type: "json" };
import monorepoExample from "../../../examples/monorepo.json" with { type: "json" };
import webAppExample from "../../../examples/web-app.json" with { type: "json" };
import type { AiJson } from "@ai-json-spec/core";

export type ExampleMeta = {
  id: string;
  title: string;
  description: string;
  repoPath: string;
  document: AiJson;
  status: "available" | "roadmap";
};

/** Canonical hero example — identical to examples/web-app.json. */
export const heroExample = webAppExample as AiJson;

export const heroExampleJson = `${JSON.stringify(heroExample, null, 2)}\n`;

export const availableExamples: ExampleMeta[] = [
  {
    id: "web-app",
    title: "Web app",
    description:
      "Commands, context paths, permissions, and quality gates for a typical web application.",
    repoPath: "examples/web-app.json",
    document: webAppExample as AiJson,
    status: "available",
  },
  {
    id: "library",
    title: "Library",
    description: "A compact library contract with build, test, lint, and typecheck commands.",
    repoPath: "examples/library.json",
    document: libraryExample as AiJson,
    status: "available",
  },
  {
    id: "monorepo",
    title: "TypeScript monorepo",
    description: "Workspace-oriented example with format checks and package-rooted source paths.",
    repoPath: "examples/monorepo.json",
    document: monorepoExample as AiJson,
    status: "available",
  },
  {
    id: "minimal",
    title: "Minimal",
    description: "The smallest valid contract: version, project, and an empty commands object.",
    repoPath: "examples/minimal.json",
    document: minimalExample as AiJson,
    status: "available",
  },
];

export const roadmapExamples: ExampleMeta[] = [
  {
    id: "python-service",
    title: "Python service",
    description: "Planned example for a language-agnostic service repository.",
    repoPath: "",
    document: minimalExample as AiJson,
    status: "roadmap",
  },
  {
    id: "rust-cli",
    title: "Rust CLI",
    description: "Planned example for a compiled CLI tool repository.",
    repoPath: "",
    document: minimalExample as AiJson,
    status: "roadmap",
  },
];

export const allDisplayedExampleDocuments = availableExamples.map((item) => item.document);
