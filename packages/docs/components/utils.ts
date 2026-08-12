export function withBase(base: string, link: string): string {
  if (/^https?:\/\//.test(link)) return link;
  const b = base === "/" ? "" : base.replace(/\/$/, "");
  const l = link.startsWith("/") ? link : `/${link}`;
  return `${b}${l}`;
}

export function normalizeLink(link: string): string {
  const clean = link.split(/[?#]/, 1)[0] || "/";
  const prefixed = clean.startsWith("/") ? clean : `/${clean}`;
  return prefixed.replace(/\/$/, "") || "/";
}

export function isActive(routePath: string, link: string): boolean {
  const route = normalizeLink(routePath);
  const target = normalizeLink(link);
  return route === target || (target !== "/" && route.startsWith(`${target}/`));
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Lightweight JSON highlighter for SSR-safe code samples. */
export function highlightJson(source: string): string {
  const escaped = escapeHtml(source);
  return escaped.replace(
    /("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (match, key, stringLiteral, literal) => {
      if (key) {
        return `<span class="json-token-key">${key}</span>:`;
      }
      if (stringLiteral) {
        return `<span class="json-token-string">${stringLiteral}</span>`;
      }
      if (literal) {
        return `<span class="json-token-literal">${literal}</span>`;
      }
      return `<span class="json-token-number">${match}</span>`;
    },
  );
}
