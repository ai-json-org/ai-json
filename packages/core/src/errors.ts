import type { ValidationIssue } from "./types.js";

export class AiJsonError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AiJsonError";
  }
}

export class AiJsonParseError extends AiJsonError {
  readonly input: string;

  constructor(input: string, cause: unknown) {
    super("Invalid JSON input.", { cause });
    this.name = "AiJsonParseError";
    this.input = input;
  }
}

export class AiJsonValidationError extends AiJsonError {
  readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super(formatValidationMessage(issues));
    this.name = "AiJsonValidationError";
    this.issues = issues;
  }
}

export class AiJsonNotFoundError extends AiJsonError {
  readonly startDirectory: string;

  constructor(startDirectory: string) {
    super(`Could not find ai.json from ${startDirectory}.`);
    this.name = "AiJsonNotFoundError";
    this.startDirectory = startDirectory;
  }
}

function formatValidationMessage(issues: ValidationIssue[]): string {
  if (issues.length === 0) {
    return "Invalid ai.json.";
  }

  return `Invalid ai.json: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`;
}
