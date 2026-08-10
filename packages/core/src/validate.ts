import {
  AI_JSON_SCHEMA_URL,
  AI_JSON_VERSION,
  type ValidationIssue,
  type ValidationIssueCode,
  type ValidationResult,
} from "./types.js";

const topLevelKeys = new Set([
  "$schema",
  "version",
  "project",
  "commands",
  "context",
  "permissions",
  "quality",
]);
const projectKeys = new Set(["name", "type"]);
const contextKeys = new Set(["agents", "architecture", "docs", "source", "tests"]);
const permissionKeys = new Set(["filesystem", "network"]);
const qualityKeys = new Set(["required"]);
const filesystemPermissions = new Set(["none", "read", "workspace"]);
const pathPattern = /^(?!\/)(?![A-Za-z][A-Za-z0-9+.-]*:)(?!.*(?:^|\/)\.\.(?:\/|$)).+$/;

export function validateAiJson(input: string | unknown): ValidationResult {
  const parsed = parseInputForValidation(input);
  if (!parsed.ok) {
    return {
      valid: false,
      issues: [createIssue("", "invalid_json", "Input is not valid JSON.")],
    };
  }

  const issues: ValidationIssue[] = [];
  const value = parsed.value;

  if (!isRecord(value)) {
    return {
      valid: false,
      issues: [createIssue("", "invalid_type", "ai.json must be a JSON object.")],
    };
  }

  for (const key of Object.keys(value).toSorted()) {
    if (!topLevelKeys.has(key)) {
      issues.push(createIssue(key, "unknown_property", "Unknown top-level property."));
    }
  }

  if (value.$schema !== undefined && value.$schema !== AI_JSON_SCHEMA_URL) {
    issues.push(createIssue("$schema", "invalid_value", `Expected ${AI_JSON_SCHEMA_URL}.`));
  }

  if (value.version === undefined) {
    issues.push(createIssue("version", "missing_required", "version is required."));
  } else if (!Number.isInteger(value.version)) {
    issues.push(createIssue("version", "invalid_type", "version must be an integer."));
  } else if (value.version !== AI_JSON_VERSION) {
    issues.push(createIssue("version", "invalid_value", `Expected version ${AI_JSON_VERSION}.`));
  }

  validateProject(value.project, issues);
  validateCommands(value.commands, issues);
  validateContext(value.context, issues);
  validatePermissions(value.permissions, issues);
  validateQuality(value.quality, value.commands, issues);

  return { valid: issues.length === 0, issues };
}

function validateProject(value: unknown, issues: ValidationIssue[]): void {
  if (value === undefined) {
    issues.push(createIssue("project", "missing_required", "project is required."));
    return;
  }
  if (!isRecord(value)) {
    issues.push(createIssue("project", "invalid_type", "project must be an object."));
    return;
  }

  for (const [key, entry] of sortedEntries(value)) {
    if (!projectKeys.has(key)) {
      issues.push(createIssue(`project.${key}`, "unknown_property", "Unknown project property."));
      continue;
    }
    if (entry !== undefined && typeof entry !== "string") {
      issues.push(createIssue(`project.${key}`, "invalid_type", "Expected string."));
    }
  }
}

function validateCommands(value: unknown, issues: ValidationIssue[]): void {
  if (value === undefined) {
    issues.push(createIssue("commands", "missing_required", "commands is required."));
    return;
  }
  if (!isRecord(value)) {
    issues.push(createIssue("commands", "invalid_type", "commands must be an object."));
    return;
  }

  for (const [key, command] of sortedEntries(value)) {
    if (key.length === 0) {
      issues.push(createIssue("commands", "invalid_value", "Command key must be non-empty."));
    }
    if (typeof command !== "string") {
      issues.push(createIssue(`commands.${key}`, "invalid_type", "Expected command string."));
    } else if (command.length === 0) {
      issues.push(
        createIssue(`commands.${key}`, "invalid_value", "Expected non-empty command string."),
      );
    }
  }
}

function validateContext(value: unknown, issues: ValidationIssue[]): void {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    issues.push(createIssue("context", "invalid_type", "context must be an object."));
    return;
  }

  for (const [key, entry] of sortedEntries(value)) {
    if (!contextKeys.has(key)) {
      issues.push(createIssue(`context.${key}`, "unknown_property", "Unknown context property."));
      continue;
    }
    if (typeof entry !== "string") {
      issues.push(createIssue(`context.${key}`, "invalid_type", "Expected path string."));
    } else if (!pathPattern.test(entry)) {
      issues.push(createIssue(`context.${key}`, "invalid_path", "Expected relative project path."));
    }
  }
}

function validatePermissions(value: unknown, issues: ValidationIssue[]): void {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    issues.push(createIssue("permissions", "invalid_type", "permissions must be an object."));
    return;
  }

  for (const key of Object.keys(value).toSorted()) {
    if (!permissionKeys.has(key)) {
      issues.push(
        createIssue(`permissions.${key}`, "unknown_property", "Unknown permissions property."),
      );
    }
  }

  if (value.filesystem !== undefined) {
    if (typeof value.filesystem !== "string") {
      issues.push(createIssue("permissions.filesystem", "invalid_type", "Expected string."));
    } else if (!filesystemPermissions.has(value.filesystem)) {
      issues.push(
        createIssue(
          "permissions.filesystem",
          "invalid_value",
          "Expected one of: none, read, workspace.",
        ),
      );
    }
  }

  if (value.network !== undefined && typeof value.network !== "boolean") {
    issues.push(createIssue("permissions.network", "invalid_type", "Expected boolean."));
  }
}

function validateQuality(value: unknown, commands: unknown, issues: ValidationIssue[]): void {
  if (value === undefined) {
    return;
  }
  if (!isRecord(value)) {
    issues.push(createIssue("quality", "invalid_type", "quality must be an object."));
    return;
  }

  for (const key of Object.keys(value).toSorted()) {
    if (!qualityKeys.has(key)) {
      issues.push(createIssue(`quality.${key}`, "unknown_property", "Unknown quality property."));
    }
  }

  if (value.required === undefined) {
    return;
  }
  if (!Array.isArray(value.required)) {
    issues.push(createIssue("quality.required", "invalid_type", "Expected array."));
    return;
  }

  const seen = new Set<string>();
  const commandKeys = isRecord(commands) ? new Set(Object.keys(commands)) : new Set<string>();
  for (const [index, entry] of value.required.entries()) {
    const path = `quality.required.${index}`;
    if (typeof entry !== "string") {
      issues.push(createIssue(path, "invalid_type", "Expected string."));
      continue;
    }
    if (entry.length === 0) {
      issues.push(createIssue(path, "invalid_value", "Expected non-empty string."));
      continue;
    }
    if (seen.has(entry)) {
      issues.push(createIssue(path, "duplicate_value", "Duplicate quality command."));
    }
    if (!commandKeys.has(entry)) {
      issues.push(createIssue(path, "invalid_value", "Must reference a command key."));
    }
    seen.add(entry);
  }
}

function parseInputForValidation(
  input: string | unknown,
): { ok: true; value: unknown } | { ok: false } {
  if (typeof input !== "string") {
    return { ok: true, value: input };
  }

  try {
    return { ok: true, value: JSON.parse(input) as unknown };
  } catch {
    return { ok: false };
  }
}

function createIssue(path: string, code: ValidationIssueCode, message: string): ValidationIssue {
  return { path, code, message };
}

function sortedEntries(value: Record<string, unknown>): [string, unknown][] {
  return Object.entries(value).toSorted(([left], [right]) => left.localeCompare(right));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
