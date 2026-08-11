# Roadmap

## 0.1.x draft line

- Publish the initial draft packages under the `@ai-json-spec` npm scope.
- Gather feedback from repository maintainers, coding-agent developers, and tool authors.
- Keep the manifest small, framework-neutral, agent-neutral, and provider-neutral.
- Preserve deterministic validation behavior across schema, core, CLI, examples, and fixtures.

## Before a stable v1 standard

Breaking changes are possible while the draft is tested against real repositories. Candidate areas for validation before stability:

- command naming and command execution expectations
- context path semantics and workspace escape handling
- unknown-property behavior
- doctor scoring usefulness
- package and GitHub Action ergonomics

## Non-goals

- model-provider integrations
- telemetry
- cloud-service requirements
- framework-specific fields
- prompts, hidden instructions, or agent-specific policy blobs in `ai.json`
