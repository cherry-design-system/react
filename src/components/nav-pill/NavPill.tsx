"use client";
import {
  forwardRef,
  useLayoutEffect,
  useRef,
  type HTMLAttributes,
} from "react";
import { cx } from "../../utils/cx";

export interface NavPillProps extends HTMLAttributes<HTMLElement> {
  /** Names the navigation landmark. Defaults to "Main". */
  "aria-label"?: string;
}

const ACTIVE = '[aria-current="page"]';

/**
 * Top navigation pill: a `<nav>` holding NavItems. A highlight slides to the
 * item with aria-current="page" whenever it changes (route change, resize).
 * Without JS the current item paints its own static highlight.
 */
export const NavPill = forwardRef<HTMLElement, NavPillProps>(function NavPill(
  { className, children, "aria-label": ariaLabel = "Main", ...rest },
  ref,
) {
  const list = useRef<HTMLUListElement | null>(null);

  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    let frame = 0;
    const measure = () => {
      const active = el.querySelector<HTMLElement>(ACTIVE);
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

  return (
    <nav
      ref={ref}
      aria-label={ariaLabel}
      className={cx("cherry-nav-pill", className)}
      {...rest}
    >
      <ul ref={list} className="cherry-nav-pill__list">
        <li className="cherry-nav-pill__indicator" aria-hidden="true" />
        {children}
      </ul>
    </nav>
  );
});
