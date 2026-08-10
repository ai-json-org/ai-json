# GitHub Action

Use the official ai.json GitHub Action to validate `ai.json`, report AI readiness, and optionally run quality gates.

```yaml
name: AI Readiness

on:
  pull_request:
  push:
    branches: [main]

jobs:
  ai-json:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: ai-json-org/action@v1
        with:
          minimum-score: 80
```

## Inputs

| Input           | Default | Description                                                                  |
| --------------- | ------- | ---------------------------------------------------------------------------- |
| `doctor`        | `true`  | Run `ai-json doctor --json` and enforce `minimum-score`.                     |
| `check`         | `false` | Run `ai-json check --json`, executing commands listed in `quality.required`. |
| `minimum-score` | `0`     | Minimum doctor score from 0 to 100.                                          |

## Behavior

The action:

1. finds `ai.json`
2. validates it
3. runs doctor by default
4. optionally runs quality gates when `check: true`
5. emits GitHub error annotations for validation failures

The action does not require external services and sends no telemetry.

## Security

`check: true` runs repository commands listed in `quality.required`. This is trusted-code execution, equivalent to running project scripts in CI. Review `ai.json` before enabling checks for untrusted repositories.
