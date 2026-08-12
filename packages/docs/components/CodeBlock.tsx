import { Badge } from "@kamod-ch/ui";
import { cn } from "@kamod-ch/ui/lib/utils";
import type { JSX } from "preact";
import { CopyButton } from "./CopyButton";
import { escapeHtml, highlightJson } from "./utils";

type CodeBlockProps = {
  code: string;
  filename?: string;
  language?: string;
  class?: string;
  label?: string;
};

export function CodeBlock({
  code,
  filename = "ai.json",
  language = "json",
  class: className,
  label,
}: CodeBlockProps): JSX.Element {
  const highlighted = language === "json" ? highlightJson(code) : escapeHtml(code);
  const accessibleName = label ?? `${filename} example`;

  return (
    <figure
      class={cn(
        "overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-none",
        className,
      )}
      aria-label={accessibleName}
    >
      <figcaption class="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-3 py-2">
        <div class="flex min-w-0 items-center gap-2">
          <span class="truncate font-mono text-sm font-medium text-foreground">{filename}</span>
          <Badge variant="secondary" class="font-mono text-[0.7rem] uppercase">
            {language}
          </Badge>
        </div>
        <CopyButton value={code} class="hit-target shrink-0" />
      </figcaption>
      <pre class="m-0 overflow-x-auto p-4 font-mono text-[0.8125rem] leading-relaxed">
        <code class={`language-${language}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </figure>
  );
}
