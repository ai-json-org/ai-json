import type { LayoutProps } from "@kamod-ch/preactpress/client";
import { createMdxHeadingComponents } from "@kamod-ch/preactpress/client";
import { GithubIcon, MenuIcon, XIcon } from "@kamod-ch/icons/shadcn";
import { syncThemeFromStorage } from "@kamod-ch/themes";
import {
  Badge,
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  ThemeToggle,
} from "@kamod-ch/ui";
import { cn } from "@kamod-ch/ui/lib/utils";
import type { FunctionalComponent, JSX } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { HomePage } from "../../components/HomePage";
import { Wordmark } from "../../components/Wordmark";
import { isActive, normalizeLink, withBase } from "../../components/utils";
import { DRAFT_LABEL, FOOTER_LINKS, GITHUB_URL } from "../../data/site";
import "../../styles/index.css";

if (typeof window !== "undefined") {
  syncThemeFromStorage();
}

type NavItem = { text: string; link: string };
type SidebarGroup = { text?: string; items: NavItem[] };

function SidebarNav({
  groups,
  routePath,
  base,
  onNavigate,
}: {
  groups: SidebarGroup[];
  routePath: string;
  base: string;
  onNavigate?: () => void;
}): JSX.Element {
  return (
    <nav aria-label="Documentation" class="space-y-6">
      {groups.map((group) => (
        <div key={group.text ?? "group"} class="space-y-2">
          {group.text ? (
            <p class="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {group.text}
            </p>
          ) : null}
          <ul class="space-y-1">
            {group.items.map((item) => {
              const active = !item.link.endsWith(".json") && isActive(routePath, item.link);
              return (
                <li key={item.link}>
                  <a
                    href={withBase(base, item.link)}
                    class={cn(
                      "flex min-h-11 items-center rounded-md border-l-2 px-3 text-sm transition-colors",
                      active
                        ? "border-[color:var(--brand)] bg-[color:color-mix(in_oklab,var(--brand)_12%,transparent)] font-medium text-foreground"
                        : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                  >
                    {item.text}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

const Layout: FunctionalComponent<LayoutProps> = ({ site, themeConfig, routePath, page }) => {
  const title = page?.title ? `${page.title} | ${site.title}` : site.title;
  const nav = (themeConfig.nav ?? []) as NavItem[];
  const sidebar = (themeConfig.sidebar ?? []) as SidebarGroup[];
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string | undefined>();

  const isHome = normalizeLink(routePath) === "/";
  const showDocsChrome = !isHome && page?.meta?.sidebar !== false;
  const showOutline =
    showDocsChrome && themeConfig.outline !== false && Boolean(page?.headings?.length);

  const MdxComponent = page?.kind === "mdx" ? page.Component : undefined;
  const mdxComponents = useMemo(
    () =>
      createMdxHeadingComponents({
        headingClass: "scroll-mt-24",
        anchorClass: "docs-heading-anchor",
        anchorLabel: "Link to section",
      }),
    [routePath],
  );

  useEffect(() => {
    setMenuOpen(false);
  }, [routePath]);

  useEffect(() => {
    if (!menuOpen || typeof window === "undefined") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!page?.headings?.length || typeof window === "undefined") {
      setActiveHeading(undefined);
      return;
    }
    const update = () => {
      const visible = page.headings
        .map((heading) => document.getElementById(heading.id))
        .filter((el): el is HTMLElement => Boolean(el))
        .filter((el) => el.getBoundingClientRect().top <= 96);
      setActiveHeading(visible.at(-1)?.id ?? page.headings[0]?.id);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [page?.headings]);

  const content = (() => {
    if (isHome) return <HomePage base={site.base} />;
    if (MdxComponent) {
      return (
        <div class="docs-prose">
          <MdxComponent components={mdxComponents} />
        </div>
      );
    }
    return (
      <main
        class="docs-prose"
        dangerouslySetInnerHTML={{ __html: page?.kind === "markdown" ? page.html : "" }}
      />
    );
  })();

  return (
    <div class="min-h-screen bg-background text-foreground">
      <title>{title}</title>
      <a class="docs-skip-link" href="#content">
        Skip to content
      </a>

      <header class="sticky top-0 z-40 border-b border-border bg-background">
        <div class="mx-auto flex h-[var(--docs-header-height)] max-w-[var(--docs-page-max)] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <a
            href={withBase(site.base, "/")}
            class="inline-flex min-h-11 items-center gap-2"
            aria-label={`${site.title} home`}
          >
            <Wordmark class="text-base sm:text-lg" />
          </a>
          <Badge variant="outline" class="hidden font-mono text-[0.7rem] sm:inline-flex">
            {DRAFT_LABEL}
          </Badge>

          <nav class="ml-2 hidden items-center gap-1 lg:flex" aria-label="Primary">
            {nav.map((item) => {
              const active = isActive(routePath, item.link);
              return (
                <a
                  key={item.link}
                  href={withBase(site.base, item.link)}
                  class={cn(
                    "inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors",
                    active
                      ? "text-[color:var(--brand-hover)]"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.text}
                </a>
              );
            })}
          </nav>

          <div class="ml-auto flex items-center gap-2">
            <Badge variant="outline" class="font-mono text-[0.65rem] sm:hidden">
              {DRAFT_LABEL}
            </Badge>
            <Button variant="outline" size="icon" class="hit-target" asChild>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub repository">
                <GithubIcon class="size-4" aria-hidden="true" />
              </a>
            </Button>
            <ThemeToggle class="hit-target" />
            <Sheet open={menuOpen} onOpenChange={setMenuOpen} lockBodyScroll={false}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  class="hit-target lg:hidden"
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                  aria-controls="mobile-navigation"
                >
                  {menuOpen ? (
                    <XIcon class="size-4" aria-hidden="true" />
                  ) : (
                    <MenuIcon class="size-4" aria-hidden="true" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                id="mobile-navigation"
                side="right"
                class="w-[min(100%,20rem)] overflow-y-auto"
              >
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <div class="mt-4 space-y-6">
                  <nav class="space-y-1" aria-label="Primary mobile">
                    {nav.map((item) => {
                      const active = isActive(routePath, item.link);
                      return (
                        <a
                          key={item.link}
                          href={withBase(site.base, item.link)}
                          class={cn(
                            "flex min-h-11 items-center rounded-md px-3 text-sm font-medium",
                            active ? "bg-muted text-foreground" : "hover:bg-muted",
                          )}
                          aria-current={active ? "page" : undefined}
                          onClick={() => setMenuOpen(false)}
                        >
                          {item.text}
                        </a>
                      );
                    })}
                    <a
                      href={GITHUB_URL}
                      target="_blank"
                      rel="noreferrer"
                      class="flex min-h-11 items-center rounded-md px-3 text-sm font-medium hover:bg-muted"
                      onClick={() => setMenuOpen(false)}
                    >
                      GitHub
                    </a>
                  </nav>
                  {showDocsChrome ? (
                    <SidebarNav
                      groups={sidebar}
                      routePath={routePath}
                      base={site.base}
                      onNavigate={() => setMenuOpen(false)}
                    />
                  ) : null}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div
        class={cn(
          "mx-auto max-w-[var(--docs-page-max)]",
          showDocsChrome
            ? "lg:grid lg:grid-cols-[var(--docs-sidebar-width)_minmax(0,1fr)] xl:grid-cols-[var(--docs-sidebar-width)_minmax(0,1fr)_var(--docs-outline-width)]"
            : "",
        )}
      >
        {showDocsChrome ? (
          <aside class="sticky top-[var(--docs-header-height)] hidden h-[calc(100vh-var(--docs-header-height))] overflow-y-auto border-r border-border p-4 lg:block">
            <SidebarNav groups={sidebar} routePath={routePath} base={site.base} />
          </aside>
        ) : null}

        <div id="content" class="min-w-0" tabIndex={-1}>
          {isHome ? (
            content
          ) : (
            <div class="px-4 py-8 sm:px-6 lg:px-8">
              {page?.title ? (
                <header class="mb-8 space-y-2">
                  <h1 class="text-3xl font-semibold tracking-tight text-foreground">
                    {page.title}
                  </h1>
                  {page.description ? (
                    <p class="max-w-3xl text-base text-muted-foreground">{page.description}</p>
                  ) : null}
                </header>
              ) : null}
              {content}
            </div>
          )}
        </div>

        {showOutline ? (
          <aside class="sticky top-[var(--docs-header-height)] hidden h-[calc(100vh-var(--docs-header-height))] overflow-y-auto p-4 xl:block">
            <p class="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              On this page
            </p>
            <ul class="space-y-1">
              {page?.headings?.map((heading) => (
                <li key={heading.id}>
                  <a
                    href={`#${heading.id}`}
                    class={cn(
                      "block border-l-2 py-1.5 pl-3 text-sm",
                      activeHeading === heading.id
                        ? "border-[color:var(--brand)] text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                      heading.level > 2 ? "pl-5" : "",
                    )}
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>

      <footer class="border-t border-border">
        <div class="mx-auto flex max-w-[var(--docs-page-max)] flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
          <nav aria-label="Footer">
            <ul class="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {FOOTER_LINKS.map((item) => (
                <li key={item.text}>
                  <a
                    href={
                      "external" in item && item.external
                        ? item.link
                        : withBase(site.base, item.link)
                    }
                    class="inline-flex min-h-11 items-center text-muted-foreground hover:text-foreground"
                    {...("external" in item && item.external
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <p class="text-sm text-muted-foreground">
            {themeConfig.footer ??
              "ai.json is an experimental, framework-neutral open specification."}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
