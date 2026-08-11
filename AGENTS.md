# Agent Instructions

## Repository purpose

This repository is the reference implementation for the `ai.json` open standard: a small, boring, predictable, portable, machine-readable project contract for AI coding agents.

`ai.json` complements `AGENTS.md`; it does not replace it.

- `ai.json` is structured metadata for tools.
- `AGENTS.md` is human/LLM-readable project guidance.
- The specification must remain framework-independent and vendor-neutral.

Do not add MCP, model-provider integrations, telemetry, cloud services, or framework-specific behavior to the standard.

## Package boundaries

- `specification/` contains normative specification prose.
- `schema/` contains official JSON Schemas.
- `examples/` contains valid example manifests.
- `fixtures/valid/` and `fixtures/invalid/` contain validation fixtures.
- `packages/core/` implements the programmatic API: parsing, validation, loading, discovery, normalization, and readiness scoring.
- `packages/cli/` implements CLI presentation and command execution orchestration.
- `scripts/` contains integration helper scripts, including the GitHub Action runner.
- `docs/` contains user-facing documentation.

Keep parsing and validation logic in `@ai-json-spec/core`. Keep CLI output, process exit codes, and terminal formatting in `@ai-json-spec/cli`. Keep command execution isolated from parsing and validation code.

## Development workflow

Use pnpm workspaces, ESM, strict TypeScript, Vitest, oxlint, and oxfmt.

Common commands:

```sh
pnpm install
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

Use `pnpm format` only for files owned by this repository scaffold. Do not introduce ESLint or Prettier.

## Rules for modifying the specification

Specification changes must be made deliberately and narrowly.

- Update `specification/v1.md` for normative behavior changes.
- Update `schema/v1.json` when document validity changes.
- Update examples and fixtures with every schema or semantic validation change.
- Update `@ai-json-spec/core` types and validators to match the specification.
- Do not add prompts, hidden instructions, vendor-specific fields, or framework-specific fields to `ai.json`.
- Unknown-property behavior is part of compatibility and must not change casually.

When uncertain, prefer the simpler design.

## Backwards compatibility expectations

The machine-readable compatibility signal is `version`.

For v1 documents:

- Do not change existing field semantics incompatibly.
- Do not remove allowed fields or values without a new version.
- Do not loosen security-sensitive behavior silently.
- New incompatible behavior requires a new schema/specification version.

Clarifications that do not change validity or interpretation may be made in-place.

## Testing requirements

Before completing changes, run:

```sh
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

Add or update tests for:

- schema validation behavior
- parser and typed-error behavior
- CLI exit codes and output modes
- doctor scoring changes
- command execution behavior in `ai-json check`
- GitHub Action behavior where relevant

Doctor scoring changes require snapshot updates and documentation in `docs/doctor.md`.

## Security expectations

Treat every `ai.json` file as untrusted input.

- Never execute commands during parse, validate, normalize, load, or doctor operations.
- `ai-json check` may execute repository commands, but only those listed in `quality.required`; this is trusted-code execution.
- Do not send telemetry.
- Do not require external services for validation, doctor, or the GitHub Action.
- Do not place secrets, tokens, credentials, private paths, prompts, or large documents in `ai.json`.
- Validate paths conservatively and prevent workspace escape in consumers.
