#!/usr/bin/env node
import { access, readFile, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Ajv2020, type ErrorObject } from "ajv/dist/2020.js";
import { runQualityCheck, type CheckOptions, type CheckResult } from "./check.js";
import {
  AI_JSON_SCHEMA_URL,
  AI_JSON_VERSION,
  analyzeAiJsonReadiness,
  findAiJson,
  parseAiJson,
  validateAiJson,
  type AiJson,
  type AiJsonReadinessResult,
  type ReadinessCheck,
  type ValidationIssue,
} from "@ai-json/core";

interface InitOptions {
  dryRun: boolean;
  force: boolean;
}

interface ValidateOptions {
  json: boolean;
  path?: string;
}

interface PackageJson {
  name?: unknown;
  packageManager?: unknown;
  scripts?: unknown;
}

interface Detection {
  packageManager: string;
  projectName: string;
  commands: Record<string, string>;
  context: Record<string, string>;
}

interface CliDiagnostic {
  path: string;
  code: string;
  message: string;
  expected?: string;
  received?: unknown;
}

interface ValidateJsonOutput {
  valid: boolean;
  path: string | null;
  version?: number;
  commands?: number;
  qualityGates?: number;
  issues: CliDiagnostic[];
}

const scriptKeys = ["dev", "build", "test", "lint", "typecheck", "format"] as const;
const requiredQualityOrder = ["lint", "typecheck", "test", "build"] as const;

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const [command, ...args] = argv;

  switch (command) {
    case "init":
      return init(args);
    case "validate":
      return validate(args);
    case "doctor":
      return doctor(args);
    case "check":
      return check(args);
    case "--help":
    case "-h":
    case undefined:
      printHelp();
      return command === undefined ? 1 : 0;
    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      return 1;
  }
}

async function init(args: string[]): Promise<number> {
  const options = parseInitOptions(args);
  if (options === undefined) {
    return 1;
  }

  const file = "ai.json";
  if ((await exists(file)) && !options.force) {
    console.error(`${file} already exists. Use --force to overwrite.`);
    return 1;
  }

  const detection = await detectRepository(process.cwd());
  const contract = buildContract(detection);
  const serialized = `${JSON.stringify(contract, null, 2)}\n`;

  printDetection(detection);

  if (options.dryRun) {
    console.log("\nDry run: ./ai.json was not written.");
    console.log(serialized.trimEnd());
    return 0;
  }

  await writeFile(file, serialized, "utf8");
  console.log("\nCreated ./ai.json");
  return 0;
}

async function validate(args: string[]): Promise<number> {
  const options = parseValidateOptions(args);
  if (options === undefined) {
    return 2;
  }

  const located = await locateValidateTarget(options);
  if (!located.ok) {
    const output: ValidateJsonOutput = {
      valid: false,
      path: null,
      issues: [{ path: "", code: "file_error", message: located.message }],
    };
    printValidateResult(output, options.json, 2);
    return 2;
  }

  const result = await validateFile(located.path);
  printValidateResult(result, options.json, result.valid ? 0 : 1);
  return result.valid ? 0 : 1;
}

async function check(args: string[]): Promise<number> {
  const options = parseCheckOptions(args);
  if (options === undefined) {
    return 2;
  }

  if (!options.json && !options.dryRun) {
    options.onCommandStart = (name, command) => {
      console.log(`→ ${name}: ${command}`);
    };
  }

  const { exitCode, result } = await runQualityCheck(options);
  printCheckResult(result, options.json, exitCode);
  return exitCode;
}

async function doctor(args: string[]): Promise<number> {
  const json = parseDoctorOptions(args);
  if (json === undefined) {
    return 2;
  }

  const result = await analyzeAiJsonReadiness({ root: process.cwd() });
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return 0;
  }

  printDoctorResult(result);
  return 0;
}

function parseCheckOptions(args: string[]): CheckOptions | undefined {
  const options: CheckOptions = { continueOnFailure: false, dryRun: false, json: false };
  for (const arg of args) {
    switch (arg) {
      case "--continue":
        options.continueOnFailure = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--json":
        options.json = true;
        break;
      default:
        console.error(`Unknown check option: ${arg}`);
        return undefined;
    }
  }
  return options;
}

function printCheckResult(result: CheckResult, json: boolean, exitCode: number): void {
  if (json) {
    const stream = exitCode === 2 ? console.error : console.log;
    stream(JSON.stringify(result, null, 2));
    return;
  }

  if (exitCode === 2) {
    console.error("AI Quality Gate configuration error\n");
    for (const issue of result.issues) {
      console.error(issue);
    }
    return;
  }

  console.log("AI Quality Gate\n");
  for (const item of result.results) {
    if (result.dryRun) {
      console.log(`• ${item.name}  ${item.command}`);
      continue;
    }
    const ok = item.exitCode === 0;
    console.log(`${ok ? "✓" : "✗"} ${item.name.padEnd(10)} ${formatDuration(item.durationMs)}`);
  }

  if (result.dryRun) {
    console.log("\nDry run: no commands executed.");
  } else if (!result.ok) {
    console.log("\nQuality gate failed.");
  } else {
    console.log("\nQuality gate passed.");
  }
}

function formatDuration(durationMs: number): string {
  return `${(durationMs / 1000).toFixed(1)}s`;
}

function parseDoctorOptions(args: string[]): boolean | undefined {
  let json = false;
  for (const arg of args) {
    if (arg === "--json") {
      json = true;
      continue;
    }
    console.error(`Unknown doctor option: ${arg}`);
    return undefined;
  }
  return json;
}

function printDoctorResult(result: AiJsonReadinessResult): void {
  console.log(`AI Readiness: ${result.score}/100\n`);
  printDoctorCategory("Manifest", result.checks);
  printDoctorCategory("Commands", result.checks);
  printDoctorCategory("Context", result.checks);
  printDoctorCategory("Permissions", result.checks);
  printDoctorCategory("Quality", result.checks);

  if (result.recommendations.length > 0) {
    console.log("Recommendations:\n");
    for (const [index, recommendation] of result.recommendations.entries()) {
      console.log(`${index + 1}. ${recommendation}`);
    }
  }
}

function printDoctorCategory(title: string, checks: ReadinessCheck[]): void {
  const category = title.toLowerCase() as ReadinessCheck["category"];
  const relevant = checks.filter((item) => item.category === category);
  if (relevant.length === 0) {
    return;
  }

  console.log(title);
  for (const item of relevant) {
    console.log(`${doctorSymbol(item.status)} ${item.label}`);
  }
  console.log("");
}

function doctorSymbol(status: ReadinessCheck["status"]): string {
  return status === "pass" ? "✓" : "!";
}

function parseValidateOptions(args: string[]): ValidateOptions | undefined {
  const options: ValidateOptions = { json: false };

  for (const arg of args) {
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg.startsWith("--")) {
      console.error(`Unknown validate option: ${arg}`);
      return undefined;
    }
    if (options.path !== undefined) {
      console.error("validate accepts at most one ai.json path.");
      return undefined;
    }
    options.path = arg;
  }

  return options;
}

async function locateValidateTarget(
  options: ValidateOptions,
): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
  if (options.path !== undefined) {
    const path = resolve(options.path);
    if (!(await isFile(path))) {
      return { ok: false, message: `ai.json not found at ${options.path}.` };
    }
    return { ok: true, path };
  }

  try {
    return { ok: true, path: await findAiJson(process.cwd()) };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not find ai.json.",
    };
  }
}

async function validateFile(path: string): Promise<ValidateJsonOutput> {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    return {
      valid: false,
      path,
      issues: [
        {
          path: "",
          code: "file_error",
          message: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (error) {
    return {
      valid: false,
      path,
      issues: [
        {
          path: "",
          code: "invalid_json",
          message: error instanceof Error ? error.message : "Invalid JSON.",
        },
      ],
    };
  }

  const schemaIssues = validateAgainstOfficialSchema(parsed);
  const semanticIssues = validateAiJson(parsed)
    .issues.filter((issue) => isSemanticOnlyIssue(issue))
    .map((issue) => toCliDiagnostic(issue, parsed));
  const issues = [...schemaIssues, ...semanticIssues];

  if (issues.length > 0) {
    return { valid: false, path, issues };
  }

  const contract = parseAiJson(parsed);
  return {
    valid: true,
    path,
    version: contract.version,
    commands: Object.keys(contract.commands).length,
    qualityGates: contract.quality?.required?.length ?? 0,
    issues: [],
  };
}

function validateAgainstOfficialSchema(input: unknown): CliDiagnostic[] {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validateSchema = ajv.compile(officialSchema);
  if (validateSchema(input)) {
    return [];
  }

  return (validateSchema.errors ?? []).map((error) => schemaErrorToDiagnostic(error, input));
}

function schemaErrorToDiagnostic(error: ErrorObject, input: unknown): CliDiagnostic {
  const path = schemaPath(error);
  if (path === "permissions.filesystem" && error.keyword === "enum") {
    return {
      path,
      code: "invalid_value",
      message: "Expected: none | read | workspace",
      expected: "none | read | workspace",
      received: valueAtPath(input, path),
    };
  }

  if (error.keyword === "required") {
    const missing = String(error.params.missingProperty);
    return {
      path: path.length === 0 ? missing : `${path}.${missing}`,
      code: "missing_required",
      message: `${missing} is required.`,
    };
  }

  if (error.keyword === "additionalProperties") {
    const property = String(error.params.additionalProperty);
    return {
      path: path.length === 0 ? property : `${path}.${property}`,
      code: "unknown_property",
      message: "Unknown property.",
    };
  }

  if (error.keyword === "uniqueItems") {
    return {
      path,
      code: "duplicate_value",
      message: "Array values must be unique.",
    };
  }

  return {
    path,
    code: error.keyword,
    message: error.message ?? "Schema validation failed.",
  };
}

function isSemanticOnlyIssue(issue: ValidationIssue): boolean {
  return (
    issue.path.startsWith("quality.required.") && issue.message === "Must reference a command key."
  );
}

function toCliDiagnostic(issue: ValidationIssue, input: unknown): CliDiagnostic {
  const path = displayPath(issue.path);
  const command = valueAtCorePath(input, issue.path);
  if (issue.message === "Must reference a command key." && typeof command === "string") {
    return {
      path,
      code: issue.code,
      message: `Command "${command}" is not defined in commands.`,
    };
  }
  return { path, code: issue.code, message: issue.message };
}

function printValidateResult(result: ValidateJsonOutput, json: boolean, exitCode: number): void {
  if (json) {
    const stream = exitCode === 2 ? console.error : console.log;
    stream(JSON.stringify(result, null, 2));
    return;
  }

  if (exitCode === 2) {
    console.error("✗ ai.json error\n");
    for (const issue of result.issues) {
      console.error(issue.message);
    }
    return;
  }

  if (result.valid) {
    console.log("✓ ai.json valid");
    console.log(`  Version: ${result.version}`);
    console.log(`  Commands: ${result.commands}`);
    console.log(`  Quality gates: ${result.qualityGates}`);
    return;
  }

  console.log("✗ ai.json invalid\n");
  for (const issue of result.issues) {
    console.log(issue.path.length > 0 ? issue.path : issue.code);
    if (issue.expected !== undefined) {
      console.log(`  Expected: ${issue.expected}`);
    }
    if (issue.received !== undefined) {
      console.log(`  Received: ${String(issue.received)}`);
    }
    if (issue.expected === undefined && issue.received === undefined) {
      console.log(`  ${issue.message}`);
    }
    console.log("");
  }
}

function schemaPath(error: ErrorObject): string {
  const base = pointerToDisplayPath(error.instancePath);
  if (error.keyword === "additionalProperties") {
    const property = String(error.params.additionalProperty);
    return base.length === 0 ? property : `${base}.${property}`;
  }
  return base;
}

function pointerToDisplayPath(pointer: string): string {
  if (pointer.length === 0) {
    return "";
  }

  const parts = pointer
    .slice(1)
    .split("/")
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"));

  return parts
    .map((part, index) => (/^\d+$/.test(part) ? `[${part}]` : index === 0 ? part : `.${part}`))
    .join("")
    .replaceAll(".[", "[");
}

function displayPath(path: string): string {
  return path.replace(/\.(\d+)/g, "[$1]");
}

function valueAtPath(input: unknown, path: string): unknown {
  if (path.length === 0) {
    return input;
  }
  return valueAtCorePath(input, path.replace(/\[(\d+)\]/g, ".$1"));
}

function valueAtCorePath(input: unknown, path: string): unknown {
  let current = input;
  for (const part of path.split(".")) {
    if (part.length === 0) {
      continue;
    }
    if (typeof current !== "object" || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function parseInitOptions(args: string[]): InitOptions | undefined {
  const options: InitOptions = { dryRun: false, force: false };

  for (const arg of args) {
    switch (arg) {
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--force":
        options.force = true;
        break;
      default:
        console.error(`Unknown init option: ${arg}`);
        console.error("Usage: ai-json init [--dry-run] [--force]");
        return undefined;
    }
  }

  return options;
}

async function detectRepository(root: string): Promise<Detection> {
  const packageJson = await readPackageJson(join(root, "package.json"));
  const packageManager = await detectPackageManager(root, packageJson);
  const scripts = isRecord(packageJson?.scripts) ? packageJson.scripts : {};
  const commands = mapScripts(packageManager, scripts);
  const context = await detectContext(root);

  return {
    packageManager,
    projectName:
      typeof packageJson?.name === "string" && packageJson.name.length > 0
        ? packageJson.name
        : basename(root),
    commands,
    context,
  };
}

function buildContract(detection: Detection): AiJson {
  const required = requiredQualityOrder.filter((key) => key in detection.commands);
  const contract: AiJson = {
    $schema: AI_JSON_SCHEMA_URL,
    version: AI_JSON_VERSION,
    project: { name: detection.projectName },
    commands: detection.commands,
    permissions: { filesystem: "workspace", network: false },
  };

  if (Object.keys(detection.context).length > 0) {
    contract.context = detection.context;
  }

  if (required.length > 0) {
    contract.quality = { required };
  }

  return contract;
}

async function readPackageJson(path: string): Promise<PackageJson | undefined> {
  try {
    const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

async function detectPackageManager(
  root: string,
  packageJson: PackageJson | undefined,
): Promise<string> {
  if (await exists(join(root, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (await exists(join(root, "yarn.lock"))) {
    return "yarn";
  }
  if ((await exists(join(root, "bun.lockb"))) || (await exists(join(root, "bun.lock")))) {
    return "bun";
  }
  if (await exists(join(root, "package-lock.json"))) {
    return "npm";
  }

  if (typeof packageJson?.packageManager === "string") {
    return packageJson.packageManager.split("@")[0] ?? "npm";
  }

  return packageJson === undefined ? "unknown" : "npm";
}

function mapScripts(
  packageManager: string,
  scripts: Record<string, unknown>,
): Record<string, string> {
  const commands: Record<string, string> = {};

  for (const key of scriptKeys) {
    if (typeof scripts[key] === "string" && scripts[key].length > 0) {
      commands[key] = commandForScript(packageManager, key);
    }
  }

  return commands;
}

function commandForScript(packageManager: string, script: string): string {
  switch (packageManager) {
    case "pnpm":
      return `pnpm ${script}`;
    case "yarn":
      return `yarn ${script}`;
    case "bun":
      return `bun run ${script}`;
    case "npm":
      return script === "test" ? "npm test" : `npm run ${script}`;
    default:
      return `npm run ${script}`;
  }
}

async function detectContext(root: string): Promise<Record<string, string>> {
  const context: Record<string, string> = {};

  if (await isFile(join(root, "AGENTS.md"))) {
    context.agents = "AGENTS.md";
  }
  if (await isFile(join(root, "ARCHITECTURE.md"))) {
    context.architecture = "ARCHITECTURE.md";
  }
  if (await isDirectory(join(root, "docs"))) {
    context.docs = "docs/";
  }
  if (await isDirectory(join(root, "src"))) {
    context.source = "src/";
  }
  if (await isDirectory(join(root, "tests"))) {
    context.tests = "tests/";
  }

  return context;
}

function printDetection(detection: Detection): void {
  console.log("Detected:\n");
  console.log(`Package manager: ${detection.packageManager}`);
  printCommand("Build", detection.commands.build);
  printCommand("Tests", detection.commands.test);
  printCommand("Lint", detection.commands.lint);
  printCommand("Typecheck", detection.commands.typecheck);
  printCommand("Format", detection.commands.format);
  printContext("Source", detection.context.source);
  printContext("Docs", detection.context.docs);
  printContext("Agent instructions", detection.context.agents);
  printContext("Architecture", detection.context.architecture);
}

function printCommand(label: string, value: string | undefined): void {
  if (value !== undefined) {
    console.log(`${label}: ${value}`);
  }
}

function printContext(label: string, value: string | undefined): void {
  if (value !== undefined) {
    console.log(`${label}: ${value}`);
  }
}

function printHelp(): void {
  console.log(
    `ai-json\n\nCommands:\n  ai-json init [--dry-run] [--force]\n  ai-json validate [file] [--json]\n  ai-json doctor [--json]\n  ai-json check [--continue] [--dry-run] [--json]`,
  );
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

function basename(path: string): string {
  return path.match(/[^/]+$/)?.[0] ?? "project";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const officialSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: AI_JSON_SCHEMA_URL,
  type: "object",
  additionalProperties: false,
  required: ["version", "project", "commands"],
  properties: {
    $schema: { type: "string", const: AI_JSON_SCHEMA_URL },
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

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = await main();
}
