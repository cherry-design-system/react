# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-11-27

### Added

- `useColorModeShortcut(keys?, { enabled? })`: an opt-in keyboard shortcut that toggles light and dark, `mod+shift+l` by default (⌘⇧L on Apple, Ctrl+Shift+L elsewhere). It ignores keys typed in inputs, textareas, selects and editors, key repeat, IME composition and events another handler already took, toggles once however many components call it with the same keys, and returns `ariaKeyShortcuts` and a display `label` for the toggle's `aria-keyshortcuts` and tooltip. A shortcut without `mod`, `ctrl`, `meta` or `alt` throws, so it can never fire while someone types (WCAG 2.1.4)

## [2.0.2] - 2026-11-26

### Added

- `Flex` and `Stack` `alignContent` (`align-content`): how wrapped lines share the cross axis, with `normal` (default), `stretch`, `flex-start`, `center`, `flex-end`, `start`, `end`, `space-between`, `space-around` and `space-evenly`. Responsive like every other layout prop
- `Flex` and `Stack` `rowGap` and `columnGap`: a spacing step for one axis only, falling back to `gap`, so `gap={4} rowGap={1}` tightens just the space between lines
- `start` and `end` for `Flex` `justify` and `align`, which follow the writing direction (unlike `flex-start` and `flex-end`, which follow the flex direction). The new `FlexAlignContent` type is exported

### Changed

- `SearchDialog` results scroll from right under the search header, so rows slide up to its edge instead of being cut on a line mid-dialog, and the bottom of the list fades out while there are more results below (no fade when the list fits or is scrolled to the end)
- The ConfirmButton playground demo shows its files as a list card in FileItem's style (icon tile, name, size line) with the ConfirmButton as each row's action, matching the new example in the Figma kit

### Fixed

- iOS Safari no longer zooms the page when a field gets focus. On touch screens, text-entry controls (Input, Textarea, Select, Combobox, NumberField, OTPInput, ChatInput, SearchDialog) render their typed text at 16px or more, at the same box size, so they still line up with buttons. The floor is `--cherry-control-text-min`; set it to `0px` to opt out

## [2.0.1] - 2026-11-25

### Added

- `NavPill` `position`: `"static"` (default), `"sticky"` or `"fixed"`. A fixed pill floats over the page on a translucent, blurred surface and slides in from its edge
- `NavPill` `placement`: `"top"`, `"bottom"`, `"top-start"`, `"top-end"`, `"bottom-start"` or `"bottom-end"` for a sticky or fixed pill (sticky uses only the top or bottom). `start` and `end` follow the writing direction, the distance to the edge is `--cherry-nav-pill-offset` (16px), and the safe-area insets keep it clear of notches and home bars
- `NavPill` `trackRoute`: marks the link for the current URL path as the current page (`aria-current="page"`, the deepest match wins, so `/docs/button` beats `/docs`) and follows client-side route changes in Next.js and other routers. A link's own `active` prop always wins
- `NavPill` `trackSections`: highlights in-page links (`#section`, or `/path#section` on that path) as their section scrolls into view, with `aria-current="location"`. While a section is active it takes the highlight; the current-page link keeps its meaning
- `NavItem` `asChild`: renders your router's link (Next.js `<Link>`, React Router, TanStack) as the item, so clicks navigate client-side instead of reloading the page. The link keeps the item's class, state, icon and tracking
- `useActiveSection(ids)` and `getActiveSection(ids)`: the same section tracking for a table of contents or a docs sidebar
- A sticky or fixed pill offsets anchor jumps so headings never land under it, and a fixed bottom pill reserves room under the page's last content

### Changed

- The README shows npm and license badges, a light and dark component showcase, and release and security sections
- The agent skill documents navigation with a router: `asChild` with Next.js `<Link>`, `active` from `usePathname()` versus `trackRoute`, section tracking and positions (`references/setup.md`), plus a rule that router links go through `asChild`
- `ChatInput`'s `footnote` examples no longer suggest an "AI can make mistakes" line; the prop itself is unchanged

## [2.0.0] - 2026-11-25

The first release of `@cherry-design-system/react`, cherry's second generation and the successor to `cherry-styled-components`. Components ship static CSS in `@layer cherry` and are styled through `--cherry-*` tokens: no CSS-in-JS, no theme provider, Server Components ready.

### Added

- More than 60 components: form controls (Button, IconButton, ConfirmButton, Input, Textarea, Password, Select, Combobox, Checkbox, RadioGroup, Toggle, Range, NumberField, OTPInput, Dropzone), date and time pickers (Calendar, DatePicker, TimePicker, DateTimePicker), navigation (Tabs, Sidebar, NavPill, Breadcrumb, Pagination, Stepper, Menu), overlays (Modal, Sheet, Popover, Tooltip, SearchDialog, Toast), content and data (Card, Table, StatCard, Avatar, Badge, Tag, Callout, Banner, EmptyState, Progress, Skeleton, Prose, CodeBlock, Snippet), layout primitives (Container, Grid, Flex, Stack) and an AI chat kit
- Light and dark mode switched by a class on `<html>`, set before the first paint by `themeInitScript`, with a light, dark or system preference (`useColorMode`, `ThemeToggle`) and per-section modes through `data-cherry-mode`
- Brands from one accent color with `createBrand()`, which derives hover, tint, text and ring shades for both modes as validated plain CSS
- WCAG 2.2 AA: checked in CI with axe in light and dark at 1280px and 320px with every popup open, plus focus visibility, focus traps, Windows High Contrast and reflow
- Per-component CSS (`css/<name>.css`), token names in TypeScript (`/tokens`) and `style-api.json`, which lists every class, `data-*` attribute and allowed value
- An agent skill in `skills/cherry-react`, generated from the component source, that documents every component, its props and its accessibility
