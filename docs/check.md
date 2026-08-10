# Check

`ai-json check` is experimental.

It executes only commands explicitly listed in `quality.required`, in the order they are declared.

```sh
ai-json check
ai-json check --continue
ai-json check --dry-run
ai-json check --json
```

By default, execution stops on the first failing command. `--continue` runs the remaining required gates and returns the first non-zero exit code. `--dry-run` prints the commands without executing them.

Commands run with the current repository root as `cwd`, where the discovered `ai.json` file is located.

## Security

Repository commands are trusted-code execution. `ai-json check` never executes commands outside `quality.required`, but every listed command is still arbitrary project code. Review `ai.json` before running checks from an untrusted repository.

The CLI does not interpolate command strings or perform command substitution itself. Command strings are passed to the operating system shell for execution.
