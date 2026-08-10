# Contributing

Thanks for helping build `ai.json`.

## Development

```sh
pnpm install
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

## Guidelines

- Keep the standard small and framework-independent.
- Add schema, fixture, and package tests for contract changes.
- Use TypeScript ESM with strict type checking.
- Use oxlint and oxfmt only; do not add ESLint or Prettier.
- Avoid runtime dependencies unless they are clearly necessary.
