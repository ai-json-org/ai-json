/* eslint-disable no-await-in-loop */
import { spawn } from "node:child_process";
import { dirname } from "node:path";
import { findAiJson, parseAiJson, validateAiJson, type AiJson } from "@ai-json-spec/core";
import { readFile } from "node:fs/promises";

export interface CheckOptions {
  continueOnFailure: boolean;
  dryRun: boolean;
  json: boolean;
  onCommandStart?: (name: string, command: string) => void;
}

export interface CheckCommandResult {
  name: string;
  command: string;
  skipped: boolean;
  exitCode: number | null;
  durationMs: number;
}

export interface CheckResult {
  ok: boolean;
  path: string | null;
  cwd: string | null;
  dryRun: boolean;
  results: CheckCommandResult[];
  issues: string[];
}

interface QualityCommand {
  name: string;
  command: string;
}

export async function runQualityCheck(
  options: CheckOptions,
): Promise<{ exitCode: number; result: CheckResult }> {
  let manifestPath: string;
  try {
    manifestPath = await findAiJson(process.cwd());
  } catch (error) {
    return configError(error instanceof Error ? error.message : "Could not find ai.json.");
  }

  let manifest: AiJson;
  try {
    const raw = await readFile(manifestPath, "utf8");
    const validation = validateAiJson(raw);
    if (!validation.valid) {
      return {
        exitCode: 2,
        result: {
          ok: false,
          path: manifestPath,
          cwd: dirname(manifestPath),
          dryRun: options.dryRun,
          results: [],
          issues: validation.issues.map((issue) => `${issue.path}: ${issue.message}`),
        },
      };
    }
    manifest = parseAiJson(raw);
  } catch (error) {
    return configError(error instanceof Error ? error.message : String(error), manifestPath);
  }

  const commands = resolveQualityCommands(manifest);
  if (commands.length === 0) {
    return {
      exitCode: 2,
      result: {
        ok: false,
        path: manifestPath,
        cwd: dirname(manifestPath),
        dryRun: options.dryRun,
        results: [],
        issues: ["quality.required must list at least one command."],
      },
    };
  }

  const cwd = dirname(manifestPath);
  const results: CheckCommandResult[] = [];
  let firstFailure = 0;

  for (const item of commands) {
    if (options.dryRun) {
      results.push({
        name: item.name,
        command: item.command,
        skipped: true,
        exitCode: null,
        durationMs: 0,
      });
      continue;
    }

    options.onCommandStart?.(item.name, item.command);
    const result = await executeCommand(item, cwd);
    results.push(result);
    if ((result.exitCode ?? 1) !== 0) {
      firstFailure = firstFailure === 0 ? (result.exitCode ?? 1) : firstFailure;
      if (!options.continueOnFailure) {
        break;
      }
    }
  }

  return {
    exitCode: firstFailure === 0 ? 0 : firstFailure,
    result: {
      ok: firstFailure === 0,
      path: manifestPath,
      cwd,
      dryRun: options.dryRun,
      results,
      issues: [],
    },
  };
}

function resolveQualityCommands(manifest: AiJson): QualityCommand[] {
  return (manifest.quality?.required ?? []).flatMap((name) => {
    const command = manifest.commands[name];
    return command === undefined ? [] : [{ name, command }];
  });
}

async function executeCommand(item: QualityCommand, cwd: string): Promise<CheckCommandResult> {
  const start = performance.now();
  const exitCode = await new Promise<number | null>((resolve) => {
    const child = spawn(item.command, {
      cwd,
      shell: true,
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", () => resolve(1));
    child.on("exit", (code, signal) => resolve(signal === null ? code : 1));
  });

  return {
    name: item.name,
    command: item.command,
    skipped: false,
    exitCode,
    durationMs: Math.round(performance.now() - start),
  };
}

function configError(
  message: string,
  path: string | null = null,
): { exitCode: number; result: CheckResult } {
  return {
    exitCode: 2,
    result: {
      ok: false,
      path,
      cwd: path === null ? null : dirname(path),
      dryRun: false,
      results: [],
      issues: [message],
    },
  };
}
