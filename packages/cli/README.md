# @ai-json-spec/cli

Command-line interface for `ai.json` manifests.

The package provides the `ai-json` binary.

```sh
npx @ai-json-spec/cli validate
npx @ai-json-spec/cli doctor
npx @ai-json-spec/cli check
```

Common local usage after installation:

```sh
ai-json validate
ai-json doctor
ai-json check
```

`check` executes only commands listed in `quality.required`; review manifests before running checks from untrusted repositories.
