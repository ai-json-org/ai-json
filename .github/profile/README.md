# ai.json

A small, boring, predictable project contract for AI coding agents.

`ai.json` complements human-readable guidance such as `AGENTS.md` with structured metadata that tools can parse consistently across repositories.

## What it describes

- project identity and type
- build, test, lint, and typecheck commands
- documentation and source locations
- intended filesystem and network permissions
- quality gates required before work is complete

## Design goals

- vendor-neutral
- framework-neutral
- deterministic
- secure by default
- easy to validate
- small enough to maintain by hand

## Get started

```sh
npx ai-json init
npx ai-json validate
npx ai-json doctor
```

Learn more in the repository README and specification.
