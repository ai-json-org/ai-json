# Doctor scoring

`ai-json doctor` reports an AI-readiness score from 0 to 100. The score is deterministic and additive.

## Scoring table

| Category    | Check                                                  | Points |
| ----------- | ------------------------------------------------------ | -----: |
| Manifest    | `ai.json` exists                                       |     10 |
| Manifest    | `ai.json` validates                                    |     10 |
| Commands    | `build` command defined                                |      5 |
| Commands    | `test` command defined                                 |      5 |
| Commands    | `lint` command defined                                 |      5 |
| Commands    | `typecheck` command defined                            |      5 |
| Context     | `context.agents` referenced and exists                 |      5 |
| Context     | `context.architecture` referenced and exists           |      5 |
| Context     | `context.docs` referenced and exists                   |      5 |
| Context     | `context.source` referenced and exists                 |      5 |
| Context     | `context.tests` referenced and exists                  |      5 |
| Permissions | `permissions.filesystem` explicitly configured         |      8 |
| Permissions | `permissions.network` explicitly configured as `false` |      7 |
| Quality     | at least one required quality gate exists              |     10 |
| Quality     | every required quality gate maps to a command          |     10 |

Total: 100 points.

Doctor never changes files and never executes commands.
