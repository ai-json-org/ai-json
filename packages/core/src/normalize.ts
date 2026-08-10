import { parseAiJson } from "./parse.js";
import { AI_JSON_SCHEMA_URL, type AiJson, type NormalizedAiJson } from "./types.js";

export function normalizeAiJson(input: string | unknown): NormalizedAiJson {
  const contract = parseAiJson(input);

  return {
    $schema: contract.$schema ?? AI_JSON_SCHEMA_URL,
    version: contract.version,
    project: {
      name: contract.project.name ?? "",
      type: contract.project.type ?? "",
    },
    commands: sortRecord(contract.commands),
    context: {
      agents: contract.context?.agents ?? "",
      architecture: contract.context?.architecture ?? "",
      docs: contract.context?.docs ?? "",
      source: contract.context?.source ?? "",
      tests: contract.context?.tests ?? "",
    },
    permissions: {
      filesystem: contract.permissions?.filesystem ?? "none",
      network: contract.permissions?.network ?? false,
    },
    quality: {
      required: (contract.quality?.required ?? []).toSorted(),
    },
  };
}

export function normalizeAiJsonContract(contract: AiJson): NormalizedAiJson {
  return normalizeAiJson(contract);
}

function sortRecord(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record).toSorted(([left], [right]) => left.localeCompare(right)),
  );
}
