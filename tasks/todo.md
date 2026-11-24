# cherry 2.0: @cherry-design-system/react

Source of truth for the design: Figma "Cherry-Design-System" (2.0 kit). Architecture: cherry-design-system/styled-components#13.

## Decisions
- One package `@cherry-design-system/react`, ESM only, subpath exports: `.` (components), `./styles.css` (bundle), `./css/*.css` (per component), `./tokens` (JSON + TS), `./theme-init` (server-safe script).
- Static CSS only, all rules in `@layer cherry`. Stable classes `cherry-<name>`, variants as `data-*`, tokens as `--cherry-*`. JS never imports CSS.
- Modes: space-toggle switches (`--cherry-light` / `--cherry-dark`) + paired slots (`--cherry-l-*` / `--cherry-d-*`); no `light-dark()`. Resolved tokens are redeclared on every scope so nested light/dark/brand scopes recompute.
- Theme runtime ported from 1.x: color-mode store (light | dark | system), no-flash init script, `.theme-switching` guard, `useColorMode`, ThemeToggle (System / Light / Dark).
- Brand theming: `createBrand()` -> validated CSS for a `[data-cherry-brand]` scope (accent ramp via color-mix).
- Behavior: platform first (native dialog, popover, details); no Motion; small in-house helpers.
- Inputs have no success state (error only). Brand name is lowercase "cherry".

## Milestones
- [ ] M1 Scaffold: Vite lib build (preserveModules), tsc declarations, Vitest + Testing Library, Prettier, CI (typecheck, test, build, contract), release workflow (manual, npm trusted publishing)
- [ ] M2 Tokens: DTCG JSON -> tokens.css (paired slots + scopes) + TS types; contract check
- [ ] M3 Theme runtime: color-mode store, theme-init, useColorMode, ThemeToggle, createBrand (+ validator), print stylesheet, reduced motion
- [ ] M4 Components wave 1 (reference): Button, IconButton, Input, Field, Toggle, Badge, Spinner
- [ ] M5 Components waves 2-n: remaining Figma kit
- [ ] M6 Playground (all components, light/dark/brand) + README + migration notes

## Motion requirement (user, 2026-11-24)
- Port the 1.x Toast motion faithfully (deck stacking/expand on hover, tile in + bump on settle, glyph pop, stroke draw, swipe-to-dismiss) using motion tokens.
- Every element that changes state animates consistently: Modal/Sheet enter+exit, Popover/Menu/Tooltip/Combobox/Date/Time popovers, Accordion, Toggle thumb, Tabs indicator, Skeleton pulse, Spinner, ChatTyping dots, Progress fill.
- All motion uses --cherry-duration-* / --cherry-easing-* and honours prefers-reduced-motion.
