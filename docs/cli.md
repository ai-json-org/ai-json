# CLI

`@ai-json-spec/cli` provides a minimal command-line interface. The installed binary is `ai-json`.

- `ai-json init [--dry-run] [--force]`: create an initial `ai.json` contract.
- `ai-json validate [file] [--json]`: parse and validate a contract.
- `ai-json doctor [--json]`: validate the contract and report AI-readiness.
- `ai-json check [--continue] [--dry-run] [--json]`: execute commands listed in `quality.required`.

Published package usage:

```sh
npx @ai-json-spec/cli validate
npx @ai-json-spec/cli doctor
npx @ai-json-spec/cli check
```
