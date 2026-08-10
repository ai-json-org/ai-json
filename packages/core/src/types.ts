export const AI_JSON_SCHEMA_URL = "https://ai-json.org/schema/v1.json" as const;
export const AI_JSON_VERSION = 1 as const;

export interface AiJsonProject {
  name?: string;
  type?: string;
}

export interface AiJsonCommands {
  [command: string]: string;
}

export interface AiJsonContext {
  agents?: string;
  architecture?: string;
  docs?: string;
  source?: string;
  tests?: string;
}

export interface AiJsonPermissions {
  filesystem?: "none" | "read" | "workspace";
  network?: boolean;
}

export interface AiJsonQuality {
  required?: string[];
}

export interface AiJson {
  $schema?: typeof AI_JSON_SCHEMA_URL;
  version: typeof AI_JSON_VERSION;
  project: AiJsonProject;
  commands: AiJsonCommands;
  context?: AiJsonContext;
  permissions?: AiJsonPermissions;
  quality?: AiJsonQuality;
}

export interface NormalizedAiJson {
  $schema: typeof AI_JSON_SCHEMA_URL;
  version: typeof AI_JSON_VERSION;
  project: Required<AiJsonProject>;
  commands: AiJsonCommands;
  context: Required<AiJsonContext>;
  permissions: Required<AiJsonPermissions>;
  quality: Required<AiJsonQuality>;
}

export type ValidationIssueCode =
  | "duplicate_value"
  | "invalid_json"
  | "invalid_path"
  | "invalid_type"
  | "invalid_value"
  | "missing_required"
  | "unknown_property";

export interface ValidationIssue {
  path: string;
  code: ValidationIssueCode;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
