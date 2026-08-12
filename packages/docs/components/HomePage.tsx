import {
  AlertTriangleIcon,
  ArrowRightIcon,
  BookOpenIcon,
  FileJsonIcon,
  GithubIcon,
  LockIcon,
  TerminalIcon,
} from "@kamod-ch/icons/shadcn";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kamod-ch/ui";
import type { JSX } from "preact";
import { availableExamples, heroExampleJson, roadmapExamples } from "../data/examples";
import {
  CLI_BIN,
  CLI_PACKAGE,
  DRAFT_LABEL,
  GITHUB_FEEDBACK_URL,
  GITHUB_URL,
  NPM_PUBLISHED,
  STATUS_LINE,
} from "../data/site";
import { CodeBlock } from "./CodeBlock";
import { withBase } from "./utils";

type HomePageProps = {
  base?: string;
};

const benefits = [
  {
    title: "Commands",
    description: "Standard commands such as development, tests, builds, and linting.",
    icon: TerminalIcon,
  },
  {
    title: "Context",
    description: "Structured information about project type, framework, language, and workspace.",
    icon: FileJsonIcon,
  },
  {
    title: "Boundaries",
    description: "Declared execution requirements without overriding consumer or sandbox policy.",
    icon: LockIcon,
  },
] as const;

const comparison = [
  {
    file: "ai.json",
    role: "Maschinenlesbare Projektbeschreibung",
  },
  {
    file: "AGENTS.md",
    role: "Freie Anweisungen und Konventionen",
  },
  {
    file: "README.md",
    role: "Dokumentation für Menschen",
  },
  {
    file: "CI configuration",
    role: "Tatsächlich ausgeführte automatisierte Prüfungen",
  },
] as const;

export function HomePage({ base = "/" }: HomePageProps): JSX.Element {
  const href = (link: string) => withBase(base, link);

  return (
    <main>
      <section class="border-b border-border">
        <div class="mx-auto grid max-w-[var(--docs-page-max)] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-start lg:gap-14 lg:px-8 lg:py-16">
          <div class="space-y-6">
            <div class="flex flex-wrap items-center gap-2">
              <Badge variant="outline" class="font-mono">
                {DRAFT_LABEL}
              </Badge>
              <Badge variant="warning" class="font-medium">
                Experimental
              </Badge>
            </div>
            <h1 class="max-w-xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.6rem] lg:leading-[1.15]">
              A small contract between repositories and AI agents.
            </h1>
            <p class="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              ai.json gives coding agents a predictable, machine-readable description of a project’s
              commands, context, and execution boundaries.
            </p>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild class="hit-target w-full sm:w-auto">
                <a href={href("/specification")}>Read the specification</a>
              </Button>
              <Button asChild variant="outline" class="hit-target w-full sm:w-auto">
                <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                  <GithubIcon class="size-4" aria-hidden="true" />
                  View on GitHub
                </a>
              </Button>
            </div>
            <p class="text-sm text-muted-foreground">{STATUS_LINE}</p>
          </div>
          <CodeBlock
            code={heroExampleJson}
            filename="ai.json"
            language="json"
            label="Valid ai.json example from the repository"
            class="lg:sticky lg:top-[calc(var(--docs-header-height)+1rem)]"
          />
        </div>
      </section>

      <section class="border-b border-border" aria-labelledby="benefits-heading">
        <div class="mx-auto max-w-[var(--docs-page-max)] px-4 py-14 sm:px-6 lg:px-8">
          <div class="max-w-2xl">
            <h2 id="benefits-heading" class="text-2xl font-semibold tracking-tight">
              What the contract covers
            </h2>
            <p class="mt-3 text-muted-foreground">
              Three small surfaces. Enough for agents to orient themselves, not enough to become a
              second README.
            </p>
          </div>
          <div class="mt-8 grid gap-4 md:grid-cols-3">
            {benefits.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} class="border-border shadow-none">
                  <CardHeader>
                    <div class="mb-2 inline-flex size-10 items-center justify-center rounded-md border border-border bg-muted">
                      <Icon class="size-5 text-foreground" aria-hidden="true" />
                    </div>
                    <CardTitle class="text-lg">{item.title}</CardTitle>
                    <CardDescription class="text-sm leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section class="border-b border-border" aria-labelledby="how-heading">
        <div class="mx-auto max-w-[var(--docs-page-max)] px-4 py-14 sm:px-6 lg:px-8">
          <h2 id="how-heading" class="text-2xl font-semibold tracking-tight">
            How it works
          </h2>
          <ol class="mt-8 flex flex-col gap-3 font-mono text-sm sm:flex-row sm:items-center sm:gap-2">
            <li class="rounded-md border border-border bg-muted px-4 py-3 text-foreground">
              Repository
            </li>
            <li class="hidden text-muted-foreground sm:inline" aria-hidden="true">
              →
            </li>
            <li class="rounded-md border border-[color:var(--brand)] bg-[color:color-mix(in_oklab,var(--brand)_12%,transparent)] px-4 py-3 text-foreground">
              ai.json
            </li>
            <li class="hidden text-muted-foreground sm:inline" aria-hidden="true">
              →
            </li>
            <li class="rounded-md border border-border bg-muted px-4 py-3 text-foreground">
              Coding Agent
            </li>
          </ol>
          <ol class="mt-8 max-w-3xl list-decimal space-y-3 pl-5 text-muted-foreground">
            <li>The repository publishes structured metadata in a small JSON file.</li>
            <li>A consumer validates the file against the open schema.</li>
            <li>
              The agent uses the information within its own security, sandbox, and organizational
              policies.
            </li>
          </ol>
        </div>
      </section>

      <section class="border-b border-border" aria-labelledby="compare-heading">
        <div class="mx-auto max-w-[var(--docs-page-max)] px-4 py-14 sm:px-6 lg:px-8">
          <h2 id="compare-heading" class="text-2xl font-semibold tracking-tight">
            Complementary, not competing
          </h2>
          <p class="mt-3 max-w-2xl text-muted-foreground">
            ai.json sits beside human documentation and CI. It does not replace them.
          </p>

          <div
            class="mt-8 hidden overflow-x-auto md:block"
            role="region"
            aria-label="File comparison"
          >
            <table class="w-full min-w-[36rem] border-collapse text-left text-sm">
              <caption class="sr-only">Comparison of project documentation files</caption>
              <thead>
                <tr class="border-b border-border">
                  <th scope="col" class="px-3 py-3 font-semibold text-foreground">
                    File
                  </th>
                  <th scope="col" class="px-3 py-3 font-semibold text-foreground">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.file} class="border-b border-border">
                    <th scope="row" class="px-3 py-3 font-mono font-medium text-foreground">
                      {row.file}
                    </th>
                    <td class="px-3 py-3 text-muted-foreground">{row.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul class="mt-8 grid gap-3 md:hidden">
            {comparison.map((row) => (
              <li key={row.file} class="rounded-lg border border-border p-4">
                <p class="font-mono text-sm font-medium text-foreground">{row.file}</p>
                <p class="mt-2 text-sm text-muted-foreground">{row.role}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section class="border-b border-border" aria-labelledby="security-heading">
        <div class="mx-auto max-w-[var(--docs-page-max)] space-y-4 px-4 py-14 sm:px-6 lg:px-8">
          <h2 id="security-heading" class="text-2xl font-semibold tracking-tight">
            Security model
          </h2>
          <Alert
            variant="warning"
            class="border-[color:color-mix(in_oklab,var(--brand)_45%,var(--border))]"
          >
            <AlertTriangleIcon class="size-5" aria-hidden="true" />
            <AlertTitle class="text-base font-semibold">Untrusted input by design</AlertTitle>
            <AlertDescription class="mt-3 space-y-2 text-sm leading-relaxed">
              <ul class="list-disc space-y-2 pl-5">
                <li>
                  <code class="font-mono">ai.json</code> grants no permissions.
                </li>
                <li>Commands in a repository are untrusted input.</li>
                <li>Consumer, sandbox, and organizational policies always win.</li>
                <li>Validation does not automatically execute commands.</li>
              </ul>
              <p class="pt-2">
                <a
                  class="inline-flex min-h-11 items-center font-medium underline-offset-4 hover:underline"
                  href={href("/security")}
                >
                  Read the security documentation
                  <ArrowRightIcon class="ml-1 size-4" aria-hidden="true" />
                </a>
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </section>

      <section class="border-b border-border" aria-labelledby="quickstart-heading">
        <div class="mx-auto max-w-[var(--docs-page-max)] px-4 py-14 sm:px-6 lg:px-8">
          <div class="max-w-2xl">
            <h2 id="quickstart-heading" class="text-2xl font-semibold tracking-tight">
              Quick start
            </h2>
            {!NPM_PUBLISHED ? (
              <p class="mt-3 text-muted-foreground">
                <Badge variant="outline" class="mr-2 align-middle">
                  Not published yet
                </Badge>
                The <code class="font-mono">{CLI_PACKAGE}</code> package is prepared in this
                repository but is not available on npm yet. Use the local workspace CLI until the
                first draft publish.
              </p>
            ) : (
              <p class="mt-3 text-muted-foreground">
                Install and run the published <code class="font-mono">{CLI_PACKAGE}</code> package.
              </p>
            )}
          </div>

          <div class="mt-8 grid gap-4 lg:grid-cols-2">
            <CodeBlock
              filename="workspace"
              language="sh"
              label="Local workspace CLI commands"
              code={[
                "# From the repository root after pnpm install && pnpm build",
                `pnpm --filter ${CLI_PACKAGE} exec ${CLI_BIN} init`,
                `pnpm --filter ${CLI_PACKAGE} exec ${CLI_BIN} validate`,
                `pnpm --filter ${CLI_PACKAGE} exec ${CLI_BIN} doctor`,
                `pnpm --filter ${CLI_PACKAGE} exec ${CLI_BIN} check --dry-run`,
              ].join("\n")}
            />
            <div class="space-y-4 rounded-lg border border-border p-5">
              <div>
                <h3 class="font-semibold text-foreground">init</h3>
                <p class="mt-1 text-sm text-muted-foreground">
                  Creates a conservative <code class="font-mono">ai.json</code> from the current
                  repository.
                </p>
              </div>
              <div>
                <h3 class="font-semibold text-foreground">validate</h3>
                <p class="mt-1 text-sm text-muted-foreground">
                  Parses and validates a contract without executing commands.
                </p>
              </div>
              <div>
                <h3 class="font-semibold text-foreground">
                  doctor{" "}
                  <Badge variant="secondary" class="ml-1 align-middle text-[0.65rem]">
                    Experimental
                  </Badge>
                </h3>
                <p class="mt-1 text-sm text-muted-foreground">
                  Reports AI-readiness scoring. Useful for feedback, not normative for the
                  specification.
                </p>
              </div>
              <div>
                <h3 class="font-semibold text-foreground">
                  check{" "}
                  <Badge variant="secondary" class="ml-1 align-middle text-[0.65rem]">
                    Experimental
                  </Badge>
                </h3>
                <p class="mt-1 text-sm text-muted-foreground">
                  Executes only commands listed in <code class="font-mono">quality.required</code>.
                  Review manifests from untrusted repositories first.
                </p>
              </div>
              <Button asChild variant="outline" class="hit-target">
                <a href={href("/cli")}>
                  <BookOpenIcon class="size-4" aria-hidden="true" />
                  CLI documentation
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section class="border-b border-border" aria-labelledby="examples-heading">
        <div class="mx-auto max-w-[var(--docs-page-max)] px-4 py-14 sm:px-6 lg:px-8">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div class="max-w-2xl">
              <h2 id="examples-heading" class="text-2xl font-semibold tracking-tight">
                Reference examples
              </h2>
              <p class="mt-3 text-muted-foreground">
                Real manifests from the repository. Every available example is validated against the
                canonical schema in CI.
              </p>
            </div>
            <Button asChild variant="outline" class="hit-target">
              <a href={href("/examples")}>Browse examples</a>
            </Button>
          </div>
          <div class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {availableExamples.map((example) => (
              <Card key={example.id} class="border-border shadow-none">
                <CardHeader>
                  <Badge variant="outline" class="w-fit font-mono text-[0.7rem]">
                    {example.repoPath}
                  </Badge>
                  <CardTitle class="text-base">{example.title}</CardTitle>
                  <CardDescription>{example.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    class="inline-flex min-h-11 items-center text-sm font-medium text-[color:var(--brand-hover)] underline-offset-4 hover:underline"
                    href={href(`/examples#${example.id}`)}
                  >
                    View example
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
          <div class="mt-10">
            <h3 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Roadmap examples
            </h3>
            <ul class="mt-3 grid gap-3 sm:grid-cols-2">
              {roadmapExamples.map((example) => (
                <li
                  key={example.id}
                  class="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground"
                >
                  <span class="font-medium text-foreground">{example.title}</span>
                  <span class="mx-2 text-border">·</span>
                  Planned, not implemented yet
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="cta-heading">
        <div class="mx-auto max-w-[var(--docs-page-max)] px-4 py-16 sm:px-6 lg:px-8">
          <div class="rounded-xl border border-border bg-muted/30 px-6 py-10 sm:px-10">
            <h2 id="cta-heading" class="max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
              Make your repository understandable to AI tools.
            </h2>
            <p class="mt-3 max-w-2xl text-muted-foreground">
              Feedback is welcome while the format remains an experimental draft. Breaking changes
              are possible before v1.
            </p>
            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild class="hit-target w-full sm:w-auto">
                <a href={href("/cli")}>Add ai.json</a>
              </Button>
              <Button asChild variant="outline" class="hit-target w-full sm:w-auto">
                <a href={href("/specification")}>Read the draft</a>
              </Button>
              <Button asChild variant="ghost" class="hit-target w-full sm:w-auto">
                <a href={GITHUB_FEEDBACK_URL} target="_blank" rel="noreferrer">
                  Give feedback on GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
