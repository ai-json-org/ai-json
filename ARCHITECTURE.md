# Architecture

This repository is organized as a reference implementation of the ai.json standard.

```text
schema
  ↓
@ai-json-spec/core
  ↓
@ai-json-spec/cli
  ↓
integrations
```

## schema

The schema layer contains the official JSON Schema for ai.json documents.

- `schema/v1.json` is the public schema for version `1` manifests.
- `specification/v1.md` is the normative prose specification.
- `examples/` and `fixtures/` exercise the schema and document expected behavior.

The schema defines document shape. It does not execute commands, enforce sandboxes, or encode vendor-specific behavior.

## @ai-json-spec/core

`packages/core/` is the programmatic reference implementation.

Responsibilities:

- TypeScript types for ai.json documents
- JSON parsing with typed errors
- structural and semantic validation
- loading `ai.json` from disk
- finding `ai.json` by walking upward from a directory
- normalizing manifests into deterministic representations
- doctor/readiness scoring logic

Core must not print to the console, call `process.exit`, or execute repository commands.

## @ai-json-spec/cli

`packages/cli/` is the command-line interface.

Responsibilities:

- `ai-json init`
- `ai-json validate`
- `ai-json doctor`
- experimental `ai-json check`
- human-readable output
- JSON output for CI
- process exit codes

The CLI delegates parsing, validation, discovery, normalization, and scoring to `@ai-json-spec/core`.

Command execution for `ai-json check` is isolated in `packages/cli/src/check.ts` and only runs commands explicitly listed in `quality.required`.

## integrations

Integrations sit above the CLI and core APIs.

Current integration:

- GitHub Action via `action.yml` and `scripts/github-action.mjs`

Integrations must not change the ai.json specification to add vendor-specific fields. Provider-specific behavior belongs in integration code or documentation, not in `ai.json`.

## Design constraints

The project optimizes for boring, predictable, portable behavior:

- JSON only
- no prompts in manifests
- no telemetry
- no external services required
- no framework-specific standard fields
- no provider-specific standard fields
- minimal dependencies
