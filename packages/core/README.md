# @ai-json-spec/core

Programmatic API for `ai.json` manifests.

```ts
import { aiJsonSchema, validateAiJson } from "@ai-json-spec/core";

const result = validateAiJson({ version: 1, project: {}, commands: {} });
console.log(result.valid);
console.log(aiJsonSchema.$id);
```

The canonical schema is maintained in the repository at `schema/v1.json` and is included in the published package as `dist/schema/v1.json`.

You can also import the packaged schema file:

```ts
import schema from "@ai-json-spec/core/schema/v1.json" with { type: "json" };
```
