# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-11-25

The first release of `@cherry-design-system/react`, cherry's second generation and the successor to `cherry-styled-components`. Components ship static CSS in `@layer cherry` and are styled through `--cherry-*` tokens: no CSS-in-JS, no theme provider, Server Components ready.

### Added

- More than 60 components: form controls (Button, IconButton, ConfirmButton, Input, Textarea, Password, Select, Combobox, Checkbox, RadioGroup, Toggle, Range, NumberField, OTPInput, Dropzone), date and time pickers (Calendar, DatePicker, TimePicker, DateTimePicker), navigation (Tabs, Sidebar, NavPill, Breadcrumb, Pagination, Stepper, Menu), overlays (Modal, Sheet, Popover, Tooltip, SearchDialog, Toast), content and data (Card, Table, StatCard, Avatar, Badge, Tag, Callout, Banner, EmptyState, Progress, Skeleton, Prose, CodeBlock, Snippet), layout primitives (Container, Grid, Flex, Stack) and an AI chat kit
- Light and dark mode switched by a class on `<html>`, set before the first paint by `themeInitScript`, with a light, dark or system preference (`useColorMode`, `ThemeToggle`) and per-section modes through `data-cherry-mode`
- Brands from one accent color with `createBrand()`, which derives hover, tint, text and ring shades for both modes as validated plain CSS
- WCAG 2.2 AA: checked in CI with axe in light and dark at 1280px and 320px with every popup open, plus focus visibility, focus traps, Windows High Contrast and reflow
- Per-component CSS (`css/<name>.css`), token names in TypeScript (`/tokens`) and `style-api.json`, which lists every class, `data-*` attribute and allowed value
- An agent skill in `skills/cherry-react`, generated from the component source, that documents every component, its props and its accessibility
