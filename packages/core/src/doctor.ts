import { access, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseAiJson } from "./parse.js";
import type { AiJson, ValidationIssue } from "./types.js";
import { validateAiJson } from "./validate.js";

export type ReadinessStatus = "pass" | "warn" | "fail";

export interface ReadinessCheck {
  id: string;
  category: "manifest" | "commands" | "context" | "permissions" | "quality";
  label: string;
  status: ReadinessStatus;
  points: number;
  maxPoints: number;
  recommendation?: string;
}

export interface AiJsonReadinessResult {
  score: number;
  maxScore: 100;
  manifestPath: string;
  valid: boolean;
  checks: ReadinessCheck[];
  recommendations: string[];
  issues: ValidationIssue[];
}

export interface AnalyzeAiJsonReadinessOptions {
  root?: string;
  manifestPath?: string;
}

const commandChecks = ["build", "test", "lint", "typecheck"] as const;
const contextChecks = [
  {
    key: "agents",
    label: "AGENTS.md",
    recommendation: "Reference an AGENTS.md file and ensure it exists.",
  },
  {
    key: "architecture",
    label: "architecture documentation",
    recommendation: "Add architecture documentation.",
  },
  { key: "docs", label: "docs/", recommendation: "Add or reference a docs path." },
  { key: "source", label: "source", recommendation: "Reference the primary source path." },
  { key: "tests", label: "tests", recommendation: "Reference the primary tests path." },
] as const;

export async function analyzeAiJsonReadiness(
  options: AnalyzeAiJsonReadinessOptions = {},
): Promise<AiJsonReadinessResult> {
  const root = resolve(options.root ?? process.cwd());
  const manifestPath = resolve(root, options.manifestPath ?? "ai.json");
  const checks: ReadinessCheck[] = [];
  const recommendations: string[] = [];
  let manifest: AiJson | undefined;
  let issues: ValidationIssue[] = [];

  const manifestExists = await exists(manifestPath);
  addCheck(checks, recommendations, {
    id: "manifest.exists",
    category: "manifest",
    label: "ai.json exists",
    status: manifestExists ? "pass" : "fail",
    points: manifestExists ? 10 : 0,
    maxPoints: 10,
    recommendation: "Create ai.json with `ai-json init`.",
  });

  if (manifestExists) {
    const raw = await readFile(manifestPath, "utf8");
    const validation = validateAiJson(raw);
    issues = validation.issues;
    if (validation.valid) {
      manifest = parseAiJson(raw);
    }
    addCheck(checks, recommendations, {
      id: "manifest.valid",
      category: "manifest",
      label: "ai.json valid",
      status: validation.valid ? "pass" : "fail",
      points: validation.valid ? 10 : 0,
      maxPoints: 10,
      recommendation: "Fix ai.json validation errors.",
    });
  } else {
    addCheck(checks, recommendations, {
      id: "manifest.valid",
      category: "manifest",
      label: "ai.json valid",
      status: "fail",
      points: 0,
      maxPoints: 10,
      recommendation: "Create a valid ai.json manifest.",
    });
  }

  addCommandChecks(checks, recommendations, manifest);
  await addContextChecks(checks, recommendations, root, manifest);
  addPermissionChecks(checks, recommendations, manifest);
  addQualityChecks(checks, recommendations, manifest);

  return {
    score: checks.reduce((sum, check) => sum + check.points, 0),
    maxScore: 100,
    manifestPath,
    valid: checks.every((check) => check.status === "pass"),
    checks,
    recommendations,
    issues,
  };
}

function addCommandChecks(
  checks: ReadinessCheck[],
  recommendations: string[],
  manifest: AiJson | undefined,
): void {
  for (const command of commandChecks) {
    const hasCommand = manifest?.commands[command] !== undefined;
    addCheck(checks, recommendations, {
      id: `commands.${command}`,
      category: "commands",
      label: command,
      status: hasCommand ? "pass" : "warn",
      points: hasCommand ? 5 : 0,
      maxPoints: 5,
      recommendation: `Add a ${command} command.`,
    });
  }
}

async function addContextChecks(
  checks: ReadinessCheck[],
  recommendations: string[],
  root: string,
  manifest: AiJson | undefined,
): Promise<void> {
  const resolved = await Promise.all(
    contextChecks.map(async (item) => {
      const value = manifest?.context?.[item.key];
      const ok = value !== undefined && (await exists(join(root, value)));
      return { item, value, ok };
    }),
  );

  for (const { item, value, ok } of resolved) {
    addCheck(checks, recommendations, {
      id: `context.${item.key}`,
      category: "context",
      label: value ?? item.label,
      status: ok ? "pass" : "warn",
      points: ok ? 5 : 0,
      maxPoints: 5,
      recommendation: item.recommendation,
    });
  }
}

function addPermissionChecks(
  checks: ReadinessCheck[],
  recommendations: string[],
  manifest: AiJson | undefined,
): void {
  const filesystem = manifest?.permissions?.filesystem;
  addCheck(checks, recommendations, {
    id: "permissions.filesystem",
    category: "permissions",
    label: filesystem === undefined ? "filesystem policy" : `filesystem: ${filesystem}`,
    status: filesystem === undefined ? "warn" : "pass",
    points: filesystem === undefined ? 0 : 8,
    maxPoints: 8,
    recommendation: "Explicitly define filesystem permissions.",
  });

  const network = manifest?.permissions?.network;
  addCheck(checks, recommendations, {
    id: "permissions.network",
    category: "permissions",
    label: network === undefined ? "network policy" : `network: ${String(network)}`,
    status: network === false ? "pass" : "warn",
    points: network === false ? 7 : 0,
    maxPoints: 7,
    recommendation: "Explicitly define network permissions.",
  });
}

function addQualityChecks(
  checks: ReadinessCheck[],
  recommendations: string[],
  manifest: AiJson | undefined,
): void {
  const required = manifest?.quality?.required;
  const hasRequired = required !== undefined && required.length > 0;
  addCheck(checks, recommendations, {
    id: "quality.required.exists",
    category: "quality",
    label: hasRequired ? `${required.length} required gates` : "required quality gates",
    status: hasRequired ? "pass" : "warn",
    points: hasRequired ? 10 : 0,
    maxPoints: 10,
    recommendation: "Define required quality gates.",
  });

  const allMapped = hasRequired && required.every((gate) => manifest?.commands[gate] !== undefined);
  addCheck(checks, recommendations, {
    id: "quality.required.mapped",
    category: "quality",
    label: "required gates map to commands",
    status: allMapped ? "pass" : "warn",
    points: allMapped ? 10 : 0,
    maxPoints: 10,
    recommendation: "Ensure every required quality gate maps to a command.",
  });
}

function addCheck(
  checks: ReadinessCheck[],
  recommendations: string[],
  check: ReadinessCheck,
): void {
  checks.push(check);
  if (check.status !== "pass" && check.recommendation !== undefined) {
    recommendations.push(check.recommendation);
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
