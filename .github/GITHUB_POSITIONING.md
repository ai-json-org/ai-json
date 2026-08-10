# GitHub positioning draft

## Summary
Tightened the organization/profile copy to sound more technical and specific, and drafted repo-level positioning guidance for the main OSS projects.

## Affected repositories
- `kamod-ch/.github` (org profile README)
- `kamod-ch/kamod-ui`
- `kamod-ch/kamod-hooks`
- `kamod-ch/kamod-signals` (not present in this workspace; included as a draft target)
- `kamod-ch/preactpress`

## Current problems
- The existing hero copy is generic agency language.
- The org page does not clearly say who the open-source projects are for.
- Repo positioning is not yet differentiated by use case.
- `kamod-signals` is referenced in the task but not present here, so it needs a separate pass when the repo is available.

## Concrete recommendations

### Org/profile hero
Use a short, concrete value statement:
- `Practical software engineering for teams that need shipped work, not slideware.`
- `We build custom web applications, cloud infrastructure, and security-minded systems for modern businesses.`

### Repo descriptions
Use the pattern:
`<project type> for <specific use case> built with <stack>`

Examples:
- `Lightweight Preact UI components for product teams`
- `Typed hooks for Preact applications`
- `Signal-based state primitives for Preact apps`
- `Static site generator for docs, blogs, and marketing sites`

### Suggested GitHub topics
- `typescript`
- `preact`
- `vite`
- `hono`
- `nextjs`
- `django`
- `postgresql`
- `redis`
- `docker`
- `cloud-infrastructure`
- `cybersecurity`
- `internal-tools`
- `static-site-generator`

### README hero guidance
- Lead with the user problem, not the company.
- Mention the stack only after the benefit.
- Link demos, npm packages, or docs early.
- Avoid claims that imply production maturity unless the repo proves it.

## Proposed repo-specific copy

### kamod-ui
- Description: `Lightweight Preact + Tailwind UI components for product teams`
- Hero: `Reusable UI primitives and patterns for Preact apps`

### kamod-hooks
- Description: `Typed Preact hooks for shared app logic`
- Hero: `Small hooks for data, UI state, and browser integration`

### kamod-signals
- Description: `Signal-based state primitives for Preact apps`
- Hero: `Minimal state building blocks for reactive UIs`

### preactpress
- Description: `Static site generator for docs, blogs, and marketing sites`
- Hero: `Build content sites with Preact, Vite, and Markdown`

## Risks
- Overly polished wording can sound like marketing instead of documentation.
- If repo descriptions promise more than the code delivers, trust drops quickly.
- Topics should match the actual codebase to avoid misleading discoverability.

## How to test or verify
- Read each README hero aloud as a new visitor would.
- Check whether the first sentence answers: what is it, who is it for, why use it?
- Compare descriptions against the current README/demo/npm/docs links.
- Confirm each repo topic is backed by code and examples.

## Next suggested tasks
1. Apply repo descriptions in GitHub settings.
2. Update the four repo README hero sections.
3. Create 10 beginner-friendly issues across the repos.
4. Draft a Show HN post and a daily.dev post from the same positioning language.
