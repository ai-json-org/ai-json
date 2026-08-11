# ai.json Specification

Current specification version: `1`.

Status: draft specification (`0.1.0` package line). Breaking changes are possible before a future stable v1 standard.

An `ai.json` file is a small JSON document at a repository root. It exposes stable, machine-readable metadata for AI coding agents while leaving narrative guidance in `AGENTS.md`. The specification is framework-neutral, agent-neutral, and provider-neutral.

A v1 document uses:

```json
{
  "$schema": "https://ai-json.org/schema/v1.json",
  "version": 1,
  "project": {},
  "commands": {}
}
```

Required fields:

- `version`: currently `1`
- `project`: project metadata object
- `commands`: object mapping command names to command strings

Optional fields describe context paths, intended permissions, and required quality gates. See [v1.md](./v1.md) for the normative specification.

## Maintaining the schema

Edit `schema/v1.json` when v1 document validity changes. It is the only manually maintained JSON Schema source. The core package exports that schema for programmatic consumers, and the CLI obtains it through core rather than carrying a copy.
