# ai.json

`ai.json` is an open proposal for a machine-readable contract between repositories and AI coding agents.

`package.json` tells tools how a JavaScript project works. `ai.json` tells AI agents how a software project works.

## The problem

AI coding agents are increasingly used across many kinds of repositories, but every agent currently has to rediscover the same project facts:

- build commands
- test commands
- repository structure
- documentation locations
- permissions and intended boundaries
- quality requirements before work is considered complete

Some of this information is written for humans. Some is implicit in scripts, CI files, docs, or conventions. Some is not written down at all.

That makes agents slower, less predictable, and more likely to run the wrong command or miss an important check.

## The idea

`ai.json` separates human-readable guidance from machine-readable project metadata.

- `AGENTS.md` = instructions for humans and LLMs
- `ai.json` = structured contract for tools and agents

The goal is not to replace existing documentation or package metadata. The goal is to provide a small, boring file that answers basic operational questions in a consistent format.

## Example

```json
{
  "$schema": "https://ai-json.org/schema/v1.json",
  "version": 1,
  "project": {
    "name": "example-app",
    "type": "web-app"
  },
  "commands": {
    "build": "pnpm build",
    "test": "pnpm test",
    "lint": "pnpm lint",
    "typecheck": "pnpm typecheck"
  },
  "context": {
    "agents": "AGENTS.md",
    "docs": "docs/",
    "source": "src/",
    "tests": "tests/"
  },
  "permissions": {
    "filesystem": "workspace",
    "network": false
  },
  "quality": {
    "required": ["lint", "typecheck", "test", "build"]
  }
}
```

## Quick Start

```sh
npx ai-json init
npx ai-json validate
npx ai-json doctor
```

`init` creates a conservative manifest from the current repository.

`validate` checks that `ai.json` is valid.

`doctor` reports how ready the repository is for AI coding agents.

## Design Principles

- **Open**: developed as a public proposal, not tied to one vendor.
- **Vendor-neutral**: no Cursor-, Claude Code-, Codex-, or Copilot-specific fields.
- **Framework-neutral**: works across languages and repository types.
- **Deterministic**: structured data with predictable validation.
- **Small**: only basic project facts belong in the file.
- **Secure by default**: commands are not automatically trusted; permissions describe intent, not sandbox enforcement.
- **Complementary to existing standards**: works alongside `package.json`, CI config, `README.md`, and `AGENTS.md`.

## Specification

The current draft is v0.1:

- [Specification v0.1](./specification/v1.md)
- [JSON Schema](./schema/v1.json)

## Ecosystem

Potential integrations include:

- coding agents that need to discover project commands and context
- IDEs that want structured repository metadata
- CI workflows that validate AI-readiness
- frameworks that generate starter projects
- documentation systems that expose project structure
- repository scanners that analyze consistency across many repos

These integrations should not require vendor-specific fields in `ai.json`.

## Status

`ai.json` v0.1 is experimental.

The format is intentionally small while the proposal is tested against real repositories and agent workflows. Feedback may change future versions.

Do not treat this as an established standard yet.

## Contributing

Feedback is especially welcome from:

- coding-agent developers
- framework maintainers
- IDE and tool developers
- CI vendors
- maintainers of large or unusual repositories

Please open issues or pull requests with concrete examples, failure cases, or proposed simplifications.
