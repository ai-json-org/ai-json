import { spawnSync } from "node:child_process";
import { join } from "node:path";

const actionPath = process.env.AI_JSON_ACTION_PATH ?? process.cwd();
const cliPath = join(actionPath, "packages", "cli", "dist", "index.js");

export function parseBooleanInput(value, name) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "off", ""].includes(normalized)) {
    return false;
  }
  throw new Error(`${name} must be true or false.`);
}

export function parseMinimumScore(value) {
  const score = Number.parseInt(String(value ?? "0"), 10);
  if (!Number.isInteger(score) || score < 0 || score > 100) {
    throw new Error("minimum-score must be an integer from 0 to 100.");
  }
  return score;
}

export function annotationForIssue(issue, file = "ai.json") {
  const title = issue.code ?? "ai.json validation failure";
  const path = issue.path ? `${issue.path}: ` : "";
  return `::error file=${escapeAnnotation(file)},line=1,title=${escapeAnnotation(title)}::${escapeAnnotation(`${path}${issue.message}`)}`;
}

function main() {
  let doctor;
  let check;
  let minimumScore;

  try {
    doctor = parseBooleanInput(process.env.INPUT_DOCTOR ?? "true", "doctor");
    check = parseBooleanInput(process.env.INPUT_CHECK ?? "false", "check");
    minimumScore = parseMinimumScore(process.env.INPUT_MINIMUM_SCORE ?? "0");
  } catch (error) {
    annotateError(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
    return;
  }

  const validation = runCli(["validate", "--json"]);
  const validationJson = parseJsonOutput(validation.stdout || validation.stderr);
  if (validation.status !== 0) {
    annotateValidation(validationJson);
    process.exitCode = validation.status ?? 1;
    return;
  }

  if (doctor) {
    const doctorResult = runCli(["doctor", "--json"]);
    if (doctorResult.status !== 0) {
      annotateError("ai-json doctor failed.");
      process.exitCode = doctorResult.status ?? 1;
      return;
    }

    const doctorJson = parseJsonOutput(doctorResult.stdout);
    const score = typeof doctorJson.score === "number" ? doctorJson.score : 0;
    console.log(`AI Readiness: ${score}/100`);
    if (score < minimumScore) {
      annotateError(
        `AI readiness score ${score}/100 is below required minimum ${minimumScore}/100.`,
      );
      process.exitCode = 1;
      return;
    }
  }

  if (check) {
    const checkResult = runCli(["check", "--json"]);
    const checkJson = parseJsonOutput(checkResult.stdout || checkResult.stderr);
    if (checkResult.status !== 0) {
      annotateCheckFailure(checkJson);
      process.exitCode = checkResult.status ?? 1;
      return;
    }
  }

  console.log("ai.json action completed successfully.");
}

function runCli(args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
  });
}

function parseJsonOutput(output) {
  try {
    return JSON.parse(output);
  } catch {
    return {
      valid: false,
      issues: [{ code: "invalid_output", message: output.trim() || "No JSON output." }],
    };
  }
}

function annotateValidation(output) {
  const issues = Array.isArray(output.issues) ? output.issues : [];
  if (issues.length === 0) {
    annotateError("ai.json validation failed.");
    return;
  }

  for (const issue of issues) {
    console.error(annotationForIssue(issue));
  }
}

function annotateCheckFailure(output) {
  const failed = Array.isArray(output.results)
    ? output.results.find((result) => result.exitCode !== 0 && result.exitCode !== null)
    : undefined;
  if (failed === undefined) {
    annotateError("ai-json check failed.");
    return;
  }
  annotateError(`Quality gate "${failed.name}" failed with exit code ${failed.exitCode}.`);
}

function annotateError(message) {
  console.error(`::error::${escapeAnnotation(message)}`);
}

function escapeAnnotation(value) {
  return String(value)
    .replaceAll("%", "%25")
    .replaceAll("\r", "%0D")
    .replaceAll("\n", "%0A")
    .replaceAll(":", "%3A")
    .replaceAll(",", "%2C");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
