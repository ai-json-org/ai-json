# ai.json

`ai.json` is an open proposal for a small, machine-readable project contract for AI coding agents.

It helps repositories publish predictable operational metadata such as build commands, test commands, documentation locations, permissions, and required quality gates.

## Repository

This repository contains the reference implementation for the `ai.json` standard:

- `specification/` — normative specification prose
- `schema/` — official JSON Schemas
- `examples/` — valid example manifests
- `fixtures/` — validation fixtures
- `packages/core/` — parsing, validation, discovery, normalization, and doctor scoring
- `packages/cli/` — CLI commands and terminal output
- `docs/` — user-facing documentation

## Quick start

```sh
npx @ai-json-spec/cli init
npx @ai-json-spec/cli validate
npx @ai-json-spec/cli doctor
```

## Links

- Specification: [`specification/v1.md`](../specification/v1.md)
- Schema: [`schema/v1.json`](../schema/v1.json)
- CLI docs: [`docs/cli.md`](../docs/cli.md)
- Contributing: [`CONTRIBUTING.md`](../CONTRIBUTING.md)
