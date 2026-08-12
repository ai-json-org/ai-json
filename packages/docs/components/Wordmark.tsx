import type { JSX } from "preact";
import { cn } from "@kamod-ch/ui/lib/utils";

type WordmarkProps = {
  class?: string;
};

export function Wordmark({ class: className }: WordmarkProps): JSX.Element {
  return (
    <span class={cn("inline-flex items-baseline gap-0.5 font-semibold tracking-tight", className)}>
      <span class="text-foreground">ai</span>
      <span class="text-[color:var(--brand)]">.</span>
      <span class="text-foreground">json</span>
    </span>
  );
}
