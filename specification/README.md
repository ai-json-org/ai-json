# ai.json Specification

Current draft version: `0.1.0`.

An `ai.json` file is a small JSON document at a repository root. It exposes stable, machine-readable metadata for AI coding agents while leaving narrative guidance in `AGENTS.md`.

Required fields:

- `schemaVersion`: currently `0.1.0`
- `project.name`: non-empty project name

Optional fields describe repository tooling, commands, important paths, and the companion agent instruction file.
