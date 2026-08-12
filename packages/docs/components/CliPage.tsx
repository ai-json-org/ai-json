import { Badge } from "@kamod-ch/ui";
import type { JSX } from "preact";
import { CLI_BIN, CLI_PACKAGE, NPM_PUBLISHED } from "../data/site";
import { CodeBlock } from "./CodeBlock";

export function CliPage(): JSX.Element {
  return (
    <div class="docs-prose space-y-8">
      <section>
        <h2 id="status">Status</h2>
        <p>
          The package name is <code>{CLI_PACKAGE}</code> and the binary is <code>{CLI_BIN}</code>.
        </p>
        {!NPM_PUBLISHED ? (
          <p>
            <Badge variant="warning" class="mr-2 align-middle">
              Not published yet
            </Badge>
            The CLI is implemented in this repository under <code>packages/cli</code>, but it is not
            available on npm until the first draft publish. Do not rely on{" "}
            <code>npx {CLI_PACKAGE}</code> until publication is complete.
          </p>
        ) : (
          <p>
            Install the published package with <code>npx {CLI_PACKAGE}</code> or add it as a
            dependency.
          </p>
        )}
      </section>

      <section>
        <h2 id="local-workspace-usage">Local workspace usage</h2>
        <p>After installing and building the monorepo:</p>
        <CodeBlock
          filename="workspace"
          language="sh"
          label="Local workspace CLI usage"
          code={[
            "pnpm install",
            "pnpm build",
            `pnpm --filter ${CLI_PACKAGE} exec ${CLI_BIN} init`,
            `pnpm --filter ${CLI_PACKAGE} exec ${CLI_BIN} validate`,
            `pnpm --filter ${CLI_PACKAGE} exec ${CLI_BIN} doctor`,
            `pnpm --filter ${CLI_PACKAGE} exec ${CLI_BIN} check --dry-run`,
          ].join("\n")}
        />
      </section>

      <section>
        <h2 id="commands">Commands</h2>

        <h3 id="init">init</h3>
        <p>
          Creates a conservative <code>ai.json</code> from the current repository.
        </p>
        <CodeBlock
          filename="shell"
          language="sh"
          code={[`${CLI_BIN} init`, `${CLI_BIN} init --dry-run`, `${CLI_BIN} init --force`].join(
            "\n",
          )}
        />

        <h3 id="validate">validate</h3>
        <p>Parses and validates a contract. Never executes project commands.</p>
        <CodeBlock
          filename="shell"
          language="sh"
          code={[
            `${CLI_BIN} validate`,
            `${CLI_BIN} validate path/to/ai.json`,
            `${CLI_BIN} validate --json`,
          ].join("\n")}
        />

        <h3 id="doctor">
          doctor{" "}
          <Badge variant="secondary" class="align-middle text-[0.65rem]">
            Experimental
          </Badge>
        </h3>
        <p>
          Readiness report for feedback while the draft evolves. Doctor scoring is{" "}
          <strong>not normative</strong> for the specification. Doctor never changes files and never
          executes commands.
        </p>
        <CodeBlock
          filename="shell"
          language="sh"
          code={[`${CLI_BIN} doctor`, `${CLI_BIN} doctor --json`].join("\n")}
        />

        <h3 id="check">
          check{" "}
          <Badge variant="secondary" class="align-middle text-[0.65rem]">
            Experimental
          </Badge>
        </h3>
        <p>
          Executes only commands listed in <code>quality.required</code>. Review manifests from
          untrusted repositories before running checks. See <a href="/security">Security</a>.
        </p>
        <CodeBlock
          filename="shell"
          language="sh"
          code={[
            `${CLI_BIN} check`,
            `${CLI_BIN} check --continue`,
            `${CLI_BIN} check --dry-run`,
            `${CLI_BIN} check --json`,
          ].join("\n")}
        />
      </section>

      <section>
        <h2 id="after-npm-publish">After npm publish</h2>
        <p>
          Once <code>{CLI_PACKAGE}</code> is published, the intended public usage becomes:
        </p>
        <CodeBlock
          filename="future"
          language="sh"
          label="Intended published usage after npm release"
          code={[
            `npx ${CLI_PACKAGE} init`,
            `npx ${CLI_PACKAGE} validate`,
            `npx ${CLI_PACKAGE} doctor`,
            `npx ${CLI_PACKAGE} check`,
          ].join("\n")}
        />
        {!NPM_PUBLISHED ? <p>Until publication, prefer the workspace commands above.</p> : null}
      </section>
    </div>
  );
}
