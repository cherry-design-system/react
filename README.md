# @cherry-design-system/react

cherry 2.0: a themeable React design system in plain CSS. Zero styling runtime, Server Components ready, light and dark built in.

> Status: alpha, private. The design source of truth is the cherry 2.0 Figma kit.

## Install

```bash
pnpm add @cherry-design-system/react lucide-react
```

## Use

```tsx
// app/layout.tsx
import "@cherry-design-system/react/styles.css";
import { themeInitScript } from "@cherry-design-system/react/theme-init";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="cherry-root">{children}</body>
    </html>
  );
}
```

```tsx
import { Button, ThemeToggle } from "@cherry-design-system/react";

<Button variant="outline">Learn more</Button>
<ThemeToggle />
```

## How it works

- **Static CSS.** Every rule lives in `@layer cherry`, so any unlayered rule of yours wins without `!important`. Import `styles.css` once, or only the files you use from `css/*`.
- **Stable hooks.** Classes are `cherry-<name>`, variants are `data-*` attributes, tokens are `--cherry-*` custom properties. `style-api.json` lists them all.
- **Modes.** The `dark` class on `<html>` switches every token (no re-render). Scope a section with `data-cherry-mode="dark"` or `"light"`. `useColorMode()` reads and sets the preference (system, light or dark).
- **Brands.** `createBrand("acme", { accent: "#5b5bd6" })` returns validated CSS for a `[data-cherry-brand="acme"]` scope.
- **Motion.** Durations and easings are tokens (`--cherry-duration-*`, `--cherry-easing-*`), and every animation honours `prefers-reduced-motion`.

## Develop

```bash
pnpm install
pnpm dev        # playground
pnpm check      # generate, typecheck, test, contract
pnpm build
```

Tokens are DTCG JSON in `tokens/`; `pnpm generate` writes `src/styles/tokens.css` and the TypeScript types. Each component has a `manifest.json` (its classes and data attributes); the contract check fails CI when the CSS and the manifest disagree.
