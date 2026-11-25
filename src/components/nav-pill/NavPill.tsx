"use client";
import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type HTMLAttributes,
} from "react";
import { cx } from "../../utils/cx";
import { mergeRefs } from "../../utils/merge-refs";
import { useActiveSection } from "./use-active-section";
import type { NavPillPlacement, NavPillPosition } from "./variants.gen";

export interface NavPillProps extends HTMLAttributes<HTMLElement> {
  /** Names the navigation landmark. Defaults to "Main". */
  "aria-label"?: string;
  /**
   * How the pill attaches to the page. `sticky` stays in the flow and sticks
   * to the top or bottom while scrolling; `fixed` floats over the page.
   * Defaults to `static`.
   */
  position?: NavPillPosition;
  /**
   * Where a sticky or fixed pill sits. `start`/`end` follow the writing
   * direction (left/right in English). Sticky uses only the top or bottom.
   * Defaults to `top`.
   */
  placement?: NavPillPlacement;
  /**
   * Marks the link matching the current URL path as the current page, and
   * follows client-side route changes (Next.js and other routers). A link's
   * own `active` prop always wins. The server cannot know the URL, so for a
   * correct first paint pass `active` from your router instead.
   */
  trackRoute?: boolean;
  /**
   * Highlights in-page links (`#section`, or `/path#section` on that path) as
   * their section scrolls into view, with aria-current="location". While a
   * section is active it takes the highlight from the current-page link.
   */
  trackSections?: boolean;
}

const LINK = "a.cherry-nav-item__link[href]";
// aria-current values NavPill set itself, so it never clears an `active` prop.
const TRACKED = "data-cherry-tracked";

function subscribeToLocation(notify: () => void) {
  const nav = (
    window as Window & {
      navigation?: EventTarget;
    }
  ).navigation;
  window.addEventListener("popstate", notify);
  window.addEventListener("hashchange", notify);
  // history.pushState (client-side routing) fires no event; the Navigation
  // API reports it. Without that API, check the URL twice a second.
  nav?.addEventListener("currententrychange", notify);
  const poll = nav ? 0 : window.setInterval(notify, 500);
  return () => {
    window.removeEventListener("popstate", notify);
    window.removeEventListener("hashchange", notify);
    nav?.removeEventListener("currententrychange", notify);
    window.clearInterval(poll);
  };
}
const noSubscription = () => () => {};

function usePathname(enabled: boolean): string | null {
  return useSyncExternalStore(
    enabled ? subscribeToLocation : noSubscription,
    () => (enabled ? window.location.pathname : null),
    () => null,
  );
}

function linkUrl(a: HTMLAnchorElement): URL | null {
  try {
    const url = new URL(a.getAttribute("href")!, window.location.href);
    return url.origin === window.location.origin ? url : null;
  } catch {
    return null;
  }
}

const trimSlash = (path: string) =>
  path.length > 1 ? path.replace(/\/+$/, "") : path;

function setTracked(a: HTMLAnchorElement, value: "page" | "location" | null) {
  const mine = a.hasAttribute(TRACKED);
  if (value) {
    if (a.hasAttribute("aria-current") && !mine) return; // explicit `active`
    if (a.getAttribute("aria-current") !== value)
      a.setAttribute("aria-current", value);
    a.setAttribute(TRACKED, "");
  } else if (mine) {
    a.removeAttribute("aria-current");
    a.removeAttribute(TRACKED);
  }
}

/**
 * Top navigation pill: a `<nav>` holding NavItems. A highlight slides to the
 * current item whenever it changes (route change, scroll, resize). Without JS
 * the current item paints its own static highlight.
 */
export const NavPill = forwardRef<HTMLElement, NavPillProps>(function NavPill(
  {
    className,
    children,
    "aria-label": ariaLabel = "Main",
    position = "static",
    placement = "top",
    trackRoute = false,
    trackSections = false,
    ...rest
  },
  ref,
) {
  const nav = useRef<HTMLElement | null>(null);
  const list = useRef<HTMLUListElement | null>(null);
  const pathname = usePathname(trackRoute || trackSections);
  const [sectionIds, setSectionIds] = useState<string[]>([]);
  const activeSection = useActiveSection(trackSections ? sectionIds : []);

  // The highlight: the section link in view, else the current-page link.
  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    let frame = 0;
    const measure = () => {
      const active =
        el.querySelector<HTMLElement>('[aria-current="location"]') ??
        el.querySelector<HTMLElement>('[aria-current="page"]');
      if (!active) {
        el.removeAttribute("data-indicator");
        return;
      }
      el.style.setProperty("--_indicator-x", `${active.offsetLeft}px`);
      el.style.setProperty("--_indicator-w", `${active.offsetWidth}px`);
      if (el.getAttribute("data-indicator") !== "ready") {
        if (!el.hasAttribute("data-indicator"))
          el.setAttribute("data-indicator", "static");
        // Arm the slide only after the first placement has painted.
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          if (el.hasAttribute("data-indicator"))
            el.setAttribute("data-indicator", "ready");
        });
      }
    };
    measure();
    const resize =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    resize?.observe(el);
    const mutation =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(measure);
    mutation?.observe(el, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-current"],
    });
    return () => {
      cancelAnimationFrame(frame);
      resize?.disconnect();
      mutation?.disconnect();
    };
  }, []);

  // Which in-page sections the links point at, on the current path.
  useEffect(() => {
    const el = list.current;
    if (!el || !trackSections || pathname === null) {
      setSectionIds([]);
      return;
    }
    const collect = () => {
      const ids: string[] = [];
      for (const a of el.querySelectorAll<HTMLAnchorElement>(LINK)) {
        const url = linkUrl(a);
        if (url?.hash && trimSlash(url.pathname) === trimSlash(pathname))
          ids.push(decodeURIComponent(url.hash.slice(1)));
      }
      setSectionIds((prev) =>
        prev.join("\n") === ids.join("\n") ? prev : ids,
      );
    };
    collect();
    const mutation =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(collect);
    mutation?.observe(el, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["href"],
    });
    return () => mutation?.disconnect();
  }, [trackSections, pathname]);

  // Mark the current route and section on the links themselves.
  useEffect(() => {
    const el = list.current;
    if (!el || pathname === null) return;
    const current = trimSlash(pathname);
    let route: HTMLAnchorElement | null = null;
    let routeLength = -1;
    const links = [...el.querySelectorAll<HTMLAnchorElement>(LINK)];
    for (const a of links) {
      const url = linkUrl(a);
      if (!url) {
        setTracked(a, null);
        continue;
      }
      const path = trimSlash(url.pathname);
      if (url.hash) {
        const id = decodeURIComponent(url.hash.slice(1));
        setTracked(
          a,
          trackSections && path === current && id === activeSection
            ? "location"
            : null,
        );
        continue;
      }
      setTracked(a, null);
      const matches =
        path === current || (path !== "/" && current.startsWith(`${path}/`));
      // The deepest match wins: /docs/button over /docs.
      if (trackRoute && matches && path.length > routeLength) {
        route = a;
        routeLength = path.length;
      }
    }
    const explicit = links.some(
      (a) =>
        a.getAttribute("aria-current") === "page" && !a.hasAttribute(TRACKED),
    );
    if (route && !explicit) setTracked(route, "page");
    el.toggleAttribute(
      "data-location",
      !!el.querySelector('[aria-current="location"]'),
    );
  }, [trackRoute, trackSections, pathname, activeSection, sectionIds]);

  // A sticky or fixed pill publishes its height, so anchor jumps land clear
  // of it and a bottom pill reserves room under the page's last content.
  useLayoutEffect(() => {
    const el = nav.current;
    if (!el || position === "static" || typeof ResizeObserver === "undefined")
      return;
    const root = document.documentElement;
    const publish = () =>
      root.style.setProperty(
        "--cherry-nav-pill-height",
        `${el.getBoundingClientRect().height}px`,
      );
    publish();
    const resize = new ResizeObserver(publish);
    resize.observe(el);
    return () => {
      resize.disconnect();
      root.style.removeProperty("--cherry-nav-pill-height");
    };
  }, [position]);

  return (
    <nav
      ref={mergeRefs(ref, nav)}
      aria-label={ariaLabel}
      className={cx("cherry-nav-pill", className)}
      data-position={position}
      data-placement={position === "static" ? undefined : placement}
      {...rest}
    >
      <ul ref={list} className="cherry-nav-pill__list">
        <li className="cherry-nav-pill__indicator" aria-hidden="true" />
        {children}
      </ul>
    </nav>
  );
});
