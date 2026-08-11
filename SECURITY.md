# Security Policy

## Supported versions

`ai.json` is currently a draft specification. The first planned npm package line is `0.1.x` for:

- `@ai-json-spec/core`
- `@ai-json-spec/cli`

Breaking changes may occur before a future stable v1 standard.

## Reporting a vulnerability

Please report security issues privately through GitHub Security Advisories for this repository when available. If advisories are unavailable, open a minimal issue requesting a private contact path and do not include exploit details publicly.

Do not include secrets, tokens, private repository contents, or credentials in reports.

## Security model

`ai.json` files are untrusted input.

- Core parsing, validation, loading, normalization, and doctor/readiness analysis must not execute project commands.
- `ai-json check` may execute commands listed in `quality.required`; this is trusted-code execution and should only be run for repositories you trust or inside an appropriate sandbox.
- The standard is framework-neutral, agent-neutral, and provider-neutral. It must not require external services, telemetry, or model-provider integrations.
