# Contributing to cherry

Thanks for helping. This guide covers setting up the repo, what a change needs before review, and how releases work.

Found a security issue? Don't open an issue or a pull request: report it privately as described in [`SECURITY.md`](./SECURITY.md).

## Setup

You need Node.js 20 or newer and pnpm.

```bash
pnpm install
pnpm dev        # playground on http://127.0.0.1:5180
```

The playground renders every component from source, in light and dark, so you can see a change as you make it.

## Before you open a pull request

Run what CI runs:

```bash
pnpm check                 # generate, typecheck, unit tests, CSS contract
pnpm exec prettier --check .
pnpm build
pnpm test:a11y             # first run: pnpm exec playwright install chromium
```

CI also fails when generated files are out of date, so commit whatever `pnpm generate` changes (`src/index.ts`, `src/style-api.json`, the token files, `variants.gen.ts` and the skill references in `skills/cherry-react/references`). Never edit those by hand.

Keep a pull request to one change. Describe what it changes and why, and add a before and after screenshot for anything visual, in light and dark.

## Changing or adding a component

Read [`docs/CONVENTIONS.md`](./docs/CONVENTIONS.md) first. In short:

- **CSS only**, inside `@layer cherry`, with no `!important`. Colors, spacing, radius, shadows, type and motion come from `--cherry-*` tokens; never hardcode them.
- **Stable hooks.** Classes are `cherry-<name>` and `cherry-<name>__<part>`, variants and states are `data-*` attributes. List them in the component's `manifest.json`: the contract check fails when the CSS and the manifest disagree.
- **Plain props** (`variant`, `size`, `invalid`), extending the native element's attributes, with the ref forwarded.
- **Server Components first.** Add `"use client"` only when the component needs state, effects or its own event handlers.
- **Tests** next to the component (`<name>.test.tsx`, Vitest and Testing Library) for behavior, keyboard support and ARIA.
- **Motion** uses the duration and easing tokens from the table in the conventions.

Renaming or removing a prop, class, `data-*` value or token is a breaking change for everyone who styles cherry from outside. Say so in the pull request.

## Accessibility

Every component meets WCAG 2.2 AA, and a change has to keep it that way:

- a visible `:focus-visible` ring (`outline: 2px solid transparent; box-shadow: var(--cherry-ring)`), never just `outline: none`;
- a name for every control, with built-in strings passed in through props so apps can translate them;
- the keyboard pattern the component's role expects (arrows, Home/End, Escape);
- text at 4.5:1 contrast or better (`--cherry-fg-muted` or stronger; `--cherry-fg-subtle` is only for disabled and decorative use);
- nothing that scrolls sideways at 320px, and state that stays visible in Windows High Contrast.

`pnpm test:a11y` checks most of this. [`skills/cherry-react/references/accessibility.md`](./skills/cherry-react/references/accessibility.md) explains what cherry guarantees and how to test the rest by hand.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), scoped to the component where there is one:

```
feat(calendar): add a fullWidth prop
fix(select): keep options 32px like Combobox
docs(skill): describe the tokens entry as token names
```

## Releases

Maintainers release. A release is one change that bumps `version` in `package.json` and adds its section to [`CHANGELOG.md`](./CHANGELOG.md); the Release workflow publishes it from CI once it is approved. Contributors don't need to touch either file.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE).
