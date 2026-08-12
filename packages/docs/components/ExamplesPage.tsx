import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@kamod-ch/ui";
import type { JSX } from "preact";
import { availableExamples, roadmapExamples } from "../data/examples";
import { GITHUB_URL } from "../data/site";
import { CodeBlock } from "./CodeBlock";

export function ExamplesPage(): JSX.Element {
  return (
    <div class="space-y-12">
      <p class="max-w-3xl text-muted-foreground">
        These examples are the canonical files from the repository. The website does not maintain a
        separate copy of their contents for display — each sample is imported from{" "}
        <code class="font-mono">examples/</code> and validated against{" "}
        <code class="font-mono">schema/v1.json</code>.
      </p>

      <div class="space-y-10">
        {availableExamples.map((example) => {
          const code = `${JSON.stringify(example.document, null, 2)}\n`;
          return (
            <section key={example.id} id={example.id} class="scroll-mt-24 space-y-4">
              <div class="space-y-2">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-xl font-semibold tracking-tight text-foreground">
                    {example.title}
                  </h2>
                  <Badge variant="outline" class="font-mono text-[0.7rem]">
                    {example.repoPath}
                  </Badge>
                </div>
                <p class="text-sm text-muted-foreground">{example.description}</p>
                <a
                  class="inline-flex min-h-11 items-center text-sm font-medium text-[color:var(--brand-hover)] underline-offset-4 hover:underline"
                  href={`${GITHUB_URL}/blob/main/${example.repoPath}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on GitHub
                </a>
              </div>
              <CodeBlock
                code={code}
                filename="ai.json"
                language="json"
                label={`${example.title} ai.json example`}
              />
            </section>
          );
        })}
      </div>

      <section aria-labelledby="roadmap-examples-heading" class="space-y-4">
        <h2 id="roadmap-examples-heading" class="text-xl font-semibold tracking-tight">
          Roadmap examples
        </h2>
        <p class="text-sm text-muted-foreground">
          Planned reference manifests. They are not implemented in the repository yet.
        </p>
        <div class="grid gap-3 sm:grid-cols-2">
          {roadmapExamples.map((example) => (
            <Card key={example.id} class="border-dashed border-border shadow-none">
              <CardHeader>
                <Badge variant="secondary" class="w-fit">
                  Coming later
                </Badge>
                <CardTitle class="text-base">{example.title}</CardTitle>
                <CardDescription>{example.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p class="text-sm text-muted-foreground">Not available yet.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
