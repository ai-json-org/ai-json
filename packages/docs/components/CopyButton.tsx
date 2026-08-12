import { CheckIcon, CopyIcon } from "@kamod-ch/icons/shadcn";
import { Button } from "@kamod-ch/ui";
import { useState } from "preact/hooks";
import type { JSX } from "preact";

type CopyButtonProps = {
  value: string;
  class?: string;
  label?: string;
};

export function CopyButton({
  value,
  class: className,
  label = "Copy",
}: CopyButtonProps): JSX.Element {
  const [copied, setCopied] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        class={className}
        aria-label={copied ? "Copied to clipboard" : label}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? (
          <CheckIcon class="size-4" aria-hidden="true" />
        ) : (
          <CopyIcon class="size-4" aria-hidden="true" />
        )}
        <span class="ml-1.5">{copied ? "Copied" : label}</span>
      </Button>
      <span class="sr-only" aria-live="polite">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </>
  );
}
