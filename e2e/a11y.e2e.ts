import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Accessibility regression checks on the playground, which renders every
// component and its states. Each block guards a class of bug found in the
// 2026-11 accessibility audit.

const WCAG = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
  "best-practice",
];
const POPUP_TRIGGERS =
  '[aria-haspopup]:not(:disabled), [aria-expanded="false"]:not(:disabled)';
const OPEN_POPUPS =
  ':popover-open:not(.cherry-toaster):not(.cherry-tooltip), dialog[open], [role="dialog"], [role="menu"], [role="listbox"]';

async function open(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
}

function describe(
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"],
) {
  return violations
    .map(
      (v) =>
        `${v.id} (${v.impact}) x${v.nodes.length}: ${v.help}\n` +
        v.nodes
          .slice(0, 3)
          .map((n) => `    ${n.target.join(" ")}`)
          .join("\n"),
    )
    .join("\n");
}

/** Tab through the page once; returns one element id per kind of stop. */
async function tabStops(page: Page) {
  const seen = new Map<string, string>();
  for (let i = 0; i < 500; i++) {
    await page.keyboard.press("Tab");
    const stop = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      if (!el.id) el.id = `a11y-${Math.random().toString(36).slice(2, 9)}`;
      const kind = (el.getAttribute("class") || el.tagName).split(" ")[0] ?? "";
      return { id: el.id, kind };
    });
    if (!stop) break;
    if (!seen.has(stop.kind)) seen.set(stop.kind, stop.id);
  }
  return seen;
}

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme });

    for (const width of [1280, 320]) {
      test(`axe finds nothing at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await open(page);
        const { violations } = await new AxeBuilder({ page })
          .withTags(WCAG)
          .analyze();
        expect(violations, describe(violations)).toEqual([]);
      });
    }

    test("axe finds nothing in any open popup", async ({ page }) => {
      test.setTimeout(120_000);
      await open(page);
      const triggers = page.locator(POPUP_TRIGGERS);
      const count = await triggers.count();
      const problems: string[] = [];
      for (let i = 0; i < count; i++) {
        const trigger = triggers.nth(i);
        try {
          await trigger.scrollIntoViewIfNeeded({ timeout: 1_000 });
          await trigger.click({ timeout: 1_000 });
        } catch {
          continue; // hidden or covered (e.g. inside a closed panel)
        }
        await page.keyboard.press("ArrowDown"); // highlight a row
        const opened = await page.evaluate((selector) => {
          const popups = [...document.querySelectorAll(selector)].filter(
            (el) => el.getClientRects().length,
          );
          popups.forEach((el) => el.setAttribute("data-a11y-open", ""));
          return popups.length;
        }, OPEN_POPUPS);
        if (opened) {
          const { violations } = await new AxeBuilder({ page })
            .include("[data-a11y-open]")
            .withTags(WCAG)
            .disableRules(["region"])
            .analyze();
          if (violations.length)
            problems.push(`popup ${i}:\n${describe(violations)}`);
        }
        await page.evaluate(() =>
          document
            .querySelectorAll("[data-a11y-open]")
            .forEach((el) => el.removeAttribute("data-a11y-open")),
        );
        await page.keyboard.press("Escape");
        await page.keyboard.press("Escape");
      }
      expect(problems, problems.join("\n")).toEqual([]);
    });

    test("placeholders meet 4.5:1 (axe skips ::placeholder)", async ({
      page,
    }) => {
      await open(page);
      const failing = await page.evaluate(() => {
        const rgb = (value: string) => {
          const ctx = document.createElement("canvas").getContext("2d")!;
          ctx.fillStyle = value;
          ctx.fillRect(0, 0, 1, 1);
          const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
          return { r: r!, g: g!, b: b!, a: a! / 255 };
        };
        const lum = ({ r, g, b }: { r: number; g: number; b: number }) => {
          const f = (c: number) => {
            const v = c / 255;
            return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const background = (el: Element | null) => {
          for (let n = el; n; n = n.parentElement) {
            const c = rgb(getComputedStyle(n).backgroundColor);
            if (c.a > 0.5) return c;
          }
          return rgb(getComputedStyle(document.body).backgroundColor);
        };
        const out: string[] = [];
        for (const el of document.querySelectorAll<HTMLInputElement>(
          "input[placeholder]:not(:disabled), textarea[placeholder]:not(:disabled)",
        )) {
          if (!el.getClientRects().length || el.closest("[inert]")) continue;
          const fg = rgb(getComputedStyle(el, "::placeholder").color);
          const bg = background(el);
          const [hi, lo] = [lum(fg), lum(bg)].sort((x, y) => y - x);
          const ratio = (hi! + 0.05) / (lo! + 0.05);
          if (ratio < 4.5)
            out.push(
              `${el.className.split(" ")[0]} "${el.placeholder}" ${ratio.toFixed(2)}:1`,
            );
        }
        return out;
      });
      expect(failing, failing.join("\n")).toEqual([]);
    });

    test("every kind of tab stop shows focus", async ({ page }) => {
      test.setTimeout(120_000);
      await open(page);
      const stops = await tabStops(page);
      expect(stops.size).toBeGreaterThan(30);
      const invisible: string[] = [];
      for (const [kind, id] of stops) {
        const el = page.locator(`#${id}`);
        // Measure around the control's wrapper when it draws the ring.
        const box = await el.evaluate((node) => {
          const wrap =
            node.closest(
              ".cherry-snippet, .cherry-textarea, .cherry-dropzone, .cherry-avatar-dropzone, .cherry-chat-input, .cherry-input, .cherry-select, .cherry-combobox, .cherry-number-field",
            ) ?? node;
          wrap.scrollIntoView({ block: "center" });
          const r = wrap.getBoundingClientRect();
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        });
        if (box.width < 2) continue; // visually hidden file inputs
        const clip = {
          x: Math.max(0, box.x - 6),
          y: Math.max(0, box.y - 6),
          width: box.width + 12,
          height: box.height + 12,
        };
        await el.evaluate((node) => (node as HTMLElement).blur());
        await page.mouse.move(0, 0);
        const blurred = await page.screenshot({ clip });
        await page.keyboard.press("Shift"); // keyboard modality for :focus-visible
        await el.focus();
        const focused = await page.screenshot({ clip });
        if (blurred.equals(focused)) invisible.push(kind);
      }
      expect(invisible, `no visible focus on: ${invisible.join(", ")}`).toEqual(
        [],
      );
    });
  });
}

test("modal surfaces trap focus and hand it back", async ({ page }) => {
  await open(page);
  const cases: [string, string][] = [
    ["modal", "Delete project"],
    ["modal", "Large with form"],
    ["sheet", "Right"],
    ["sheet", "Bottom"],
  ];
  for (const [section, name] of cases) {
    const trigger = page
      .locator(`#${section}`)
      .getByRole("button", { name, exact: true });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.locator("dialog:modal");
    await expect(dialog, `${name} opens a modal`).toHaveCount(1);
    await expect
      .poll(() =>
        page.evaluate(() => !!document.activeElement?.closest("dialog")),
      )
      .toBe(true);
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      // Past the last control focus may go to the browser UI (body), never
      // to the page behind.
      const escaped = await page.evaluate(() => {
        const el = document.activeElement;
        return !!el && el !== document.body && !el.closest("dialog");
      });
      expect(escaped, `${name}: focus left the dialog`).toBe(false);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger, `${name}: focus returns`).toBeFocused();
  }
});

test("popovers and menus close on Escape and hand focus back", async ({
  page,
}) => {
  await open(page);
  const cases: [string, string][] = [
    ["popover", "Share (bottom start)"],
    ["menu", "Project actions"],
    ["chat-drawer", "Ask AI"],
  ];
  for (const [section, name] of cases) {
    const trigger = page
      .locator(`#${section}`)
      .getByRole("button", { name, exact: true })
      .first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect
      .poll(() => page.evaluate(() => document.activeElement !== null))
      .toBe(true);
    await page.keyboard.press("Escape");
    await expect(trigger, `${name}: focus returns`).toBeFocused();
  }
});

test.describe("forced colors (Windows High Contrast)", () => {
  test.use({ forcedColors: "active", colorScheme: "dark" });

  test("every tab stop keeps a visible outline", async ({ page }) => {
    test.setTimeout(120_000);
    await open(page);
    // Box-shadow rings vanish here; focus styles must leave an outline the
    // browser can repaint in a system color.
    const missing: string[] = [];
    for (let i = 0; i < 500; i++) {
      await page.keyboard.press("Tab");
      const stop = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const style = getComputedStyle(el);
        return {
          kind: (el.getAttribute("class") || el.tagName).split(" ")[0] ?? "",
          outline:
            style.outlineStyle !== "none" && style.outlineWidth !== "0px",
        };
      });
      if (!stop) break;
      if (!stop.outline && !missing.includes(stop.kind))
        missing.push(stop.kind);
    }
    expect(
      missing,
      `no outline in forced colors: ${missing.join(", ")}`,
    ).toEqual([]);
  });
});

test("nothing scrolls sideways at 320px (400% zoom)", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await open(page);
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});

test.describe("calendar with motion on", () => {
  // The bug needs the leaving month to still be on screen.
  test.use({ reducedMotion: "no-preference" });

  test("keyboard focus survives fast month changes", async ({ page }) => {
    await open(page);
    const day = page.locator("#calendar .cherry-calendar__day[tabindex='0']");
    await day.first().focus();
    // December's six-week grid repeats January days while it slides out.
    for (const key of [
      "ArrowRight",
      "ArrowDown",
      "PageDown",
      "Home",
      "ArrowLeft",
      "ArrowUp",
    ]) {
      await page.keyboard.press(key);
      await page.waitForTimeout(40);
      const inLiveMonth = await page.evaluate(() => {
        const el = document.activeElement;
        return (
          !!el?.closest(".cherry-calendar__weeks") &&
          !el.closest("[data-leaving]")
        );
      });
      expect(inLiveMonth, `focus after ${key}`).toBe(true);
    }
  });
});
