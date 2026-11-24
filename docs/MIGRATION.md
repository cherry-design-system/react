# Migrating from cherry-styled-components 1.x

cherry 2.0 ships as `@cherry-design-system/react`. It keeps the 1.x theme behaviour (light, dark, system; the same storage keys and cookie) and drops styled-components.

## Setup

| 1.x                                                                        | 2.0                                                                                                                       |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `CherryThemeProvider` / `ClientThemeProvider` with `theme` and `themeDark` | Import `@cherry-design-system/react/styles.css` once. No provider.                                                        |
| `StyledComponentsRegistry` (`cherry-styled-components/next`)               | Not needed: the CSS is static.                                                                                            |
| `themeInitScript` / `createThemeInitScript({ themeColor })`                | Same names, from `@cherry-design-system/react/theme-init`. `themeColor` is now `{ light, dark }` or `false`.              |
| `resolveTheme(cookie, theme, themeDark)`                                   | `modeFromCookie(cookie)` returns `"light" \| "dark"`.                                                                     |
| `ThemeContext` `{ toggleTheme, setPreference }`, `useColorMode()`          | `useColorMode()` returns `{ mode, preference, setPreference, toggle }`.                                                   |
| `useResolvedTheme()` (JS theme values)                                     | Read `--cherry-*` CSS variables instead.                                                                                  |
| Custom theme objects                                                       | `createBrand(name, { accent, primary })` for a scoped brand, or override `--cherry-l-*` / `--cherry-d-*` in your own CSS. |

The stored preference (`themePreference`, and the legacy `theme` key) and the `theme` cookie are read as before, so visitors keep their mode across the upgrade.

## Props

- The `$` prefix is gone: `$variant` becomes `variant`, `$size` becomes `size`, `$fullWidth` becomes `fullWidth`.
- Sizes are `sm | md | lg` (32 / 36 / 44 px) instead of `small | default | big`.
- `$error` becomes `invalid`, or wrap the control in `<Field error="...">`. There is no success state; drop `$success`.
- `$label` on inputs moves to `<Field label="...">`.
- Icon props take a rendered element: `leadingIcon={<Plus />}`.

## Renamed or changed components

| 1.x                                                                         | 2.0                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ToastNotificationsProvider`, `ToastNotifications`, `useToastNotifications` | `ToastProvider`, `Toaster`, `useToast` (`addNotification` becomes `show`, `promiseNotification` becomes `promise`; `$align`, `$bottom`, `$expand`, `$visibleToasts` become `align`, `position`, `expand`, `visibleToasts`) |
| `Box`                                                                       | `Card`                                                                                                                                                                                                                     |
| `Col` / `Grid` / `Flex` / `Container`                                       | Same names; responsive props take one value or `{ xs, md, lg, ... }`                                                                                                                                                       |
| `MaxWidth`, `Space`                                                         | Removed: use `Container` and `gap`                                                                                                                                                                                         |
| `Icon` / `DynamicIcon`                                                      | Import lucide icons directly                                                                                                                                                                                               |
| `ChatProvider`                                                              | Removed: chat parts are controlled through props                                                                                                                                                                           |
| `modes()`, `modeValue()`, `alpha`/`shade`/`tint`, `mq()`                    | Not needed: write CSS against `--cherry-*` tokens and `@media`                                                                                                                                                             |

## Styling your own components

Target the stable hooks instead of styled-components interpolations: `.cherry-button[data-variant="outline"]`, tokens such as `var(--cherry-fg-muted)`. Every cherry rule is in `@layer cherry`, so your unlayered CSS wins without `!important`. `style-api.json` lists every class, data attribute and value.
