"use client";
import {
  cloneElement,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cx } from "../../utils/cx";
import type { TooltipPlacement } from "./variants.gen";

export interface TooltipProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "content" | "children" | "popover"
> {
  /** The hint. Keep it short and non-interactive. */
  content: ReactNode;
  /** The trigger: one focusable element (it gets aria-describedby). */
  children: ReactElement<{ "aria-describedby"?: string }>;
  /** Side of the trigger. Defaults to "top". */
  placement?: TooltipPlacement;
  /** Hover delay before showing, ms. Defaults to 400. */
  openDelay?: number;
  /** Delay before hiding once the pointer leaves, ms. Defaults to 100. */
  closeDelay?: number;
  /** Never show (the trigger keeps working). */
  disabled?: boolean;
}

// Once a tooltip has just closed, the next one opens without the delay, so
// sweeping across a toolbar reads label after label.
const SKIP_DELAY_MS = 300;
let lastClosedAt = 0;
// Only one tooltip shows at a time: the open one's hide, called (at once)
// when another opens.
let openTooltip: (() => void) | null = null;

// Browsers without CSS anchor positioning get the tooltip placed from the
// trigger's box instead (and again on scroll or resize while it shows).
function supportsAnchor() {
  return (
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("position-area: top")
  );
}

const EDGE = 4;

function place(
  tip: HTMLElement,
  trigger: HTMLElement,
  placement: TooltipPlacement,
) {
  const t = trigger.getBoundingClientRect();
  const r = tip.getBoundingClientRect();
  const gap =
    parseFloat(getComputedStyle(tip).getPropertyValue("--_offset")) || 8;
  let top: number;
  let left: number;
  if (placement === "left" || placement === "right") {
    top = t.top + t.height / 2 - r.height / 2;
    left = placement === "left" ? t.left - r.width - gap : t.right + gap;
  } else {
    top = placement === "top" ? t.top - r.height - gap : t.bottom + gap;
    left = t.left + t.width / 2 - r.width / 2;
    left = Math.min(Math.max(left, EDGE), window.innerWidth - r.width - EDGE);
  }
  tip.style.top = `${top}px`;
  tip.style.left = `${left}px`;
}

function isFocusVisible(target: Element) {
  try {
    return target.matches(":focus-visible");
  } catch {
    return true;
  }
}

/**
 * A short hint on hover and keyboard focus (role="tooltip", wired with
 * aria-describedby). A manual `popover` in the top layer, anchored to the
 * trigger with CSS anchor positioning (or, where that is missing, placed
 * from the trigger's box in JS); it fades in with a small offset and
 * out again. Escape hides it; the pointer can move onto it without it
 * closing.
 */
export const Tooltip = forwardRef<HTMLSpanElement, TooltipProps>(
  function Tooltip(
    {
      content,
      children,
      placement = "top",
      openDelay = 400,
      closeDelay = 100,
      disabled,
      className,
      style,
      onPointerEnter,
      onPointerLeave,
      ...rest
    },
    ref,
  ) {
    const id = useId();
    const tooltipId = `cherry-tooltip-${id}`;
    const anchor = `--cherry-tooltip-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const tipRef = useRef<HTMLSpanElement | null>(null);
    const triggerRef = useRef<HTMLSpanElement>(null);
    const timer = useRef<number | undefined>(undefined);
    const shown = useRef(false);
    const [open, setOpen] = useState(false);

    const setTip = useCallback(
      (node: HTMLSpanElement | null) => {
        tipRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    const clear = () => window.clearTimeout(timer.current);

    const conceal = useCallback(function conceal() {
      const tip = tipRef.current;
      window.clearTimeout(timer.current);
      if (!shown.current) return;
      shown.current = false;
      if (openTooltip === conceal) openTooltip = null;
      try {
        tip?.hidePopover();
      } catch {
        // Already gone.
      }
      lastClosedAt = Date.now();
      setOpen(false);
    }, []);

    const reveal = useCallback(() => {
      const tip = tipRef.current;
      if (!tip || shown.current) return;
      try {
        tip.showPopover();
      } catch {
        // Detached or unsupported: nothing to show.
        return;
      }
      if (!supportsAnchor() && triggerRef.current)
        place(tip, triggerRef.current, placement);
      shown.current = true;
      if (openTooltip && openTooltip !== conceal) openTooltip();
      openTooltip = conceal;
      setOpen(true);
    }, [conceal, placement]);

    const show = (delay: number) => {
      if (disabled) return;
      clear();
      if (
        delay <= 0 ||
        openTooltip !== null ||
        Date.now() - lastClosedAt < SKIP_DELAY_MS
      )
        reveal();
      else timer.current = window.setTimeout(reveal, delay);
    };
    const hide = (delay: number) => {
      clear();
      if (delay <= 0) conceal();
      else timer.current = window.setTimeout(conceal, delay);
    };

    useEffect(() => {
      if (!open) return;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") conceal();
      };
      document.addEventListener("keydown", onKeyDown);
      // Without anchor positioning, follow the trigger while open.
      const follow = supportsAnchor()
        ? null
        : () => {
            if (tipRef.current && triggerRef.current)
              place(tipRef.current, triggerRef.current, placement);
          };
      if (follow) {
        window.addEventListener("scroll", follow, true);
        window.addEventListener("resize", follow);
      }
      return () => {
        document.removeEventListener("keydown", onKeyDown);
        if (follow) {
          window.removeEventListener("scroll", follow, true);
          window.removeEventListener("resize", follow);
        }
      };
    }, [open, conceal, placement]);

    useEffect(
      () => () => {
        window.clearTimeout(timer.current);
        if (openTooltip === conceal) openTooltip = null;
      },
      [conceal],
    );

    useEffect(() => {
      if (disabled && open) conceal();
    }, [disabled, open, conceal]);

    const anchorStyle = { "--_anchor": anchor } as CSSProperties;
    const describedBy = isValidElement(children)
      ? children.props["aria-describedby"]
      : undefined;

    return (
      <>
        <span
          ref={triggerRef}
          className="cherry-tooltip__trigger"
          style={anchorStyle}
          onPointerEnter={(event) => {
            if (event.pointerType !== "touch") show(openDelay);
          }}
          onPointerLeave={() => hide(closeDelay)}
          onPointerDown={() => hide(0)}
          onFocus={(event: FocusEvent<HTMLSpanElement>) => {
            if (isFocusVisible(event.target)) show(0);
          }}
          onBlur={() => hide(0)}
        >
          {cloneElement(children, {
            "aria-describedby": disabled
              ? describedBy
              : cx(describedBy, tooltipId),
          })}
        </span>
        <span
          ref={setTip}
          id={tooltipId}
          role="tooltip"
          popover="manual"
          className={cx("cherry-tooltip", className)}
          data-placement={placement}
          style={{ ...anchorStyle, ...style }}
          onPointerEnter={(event) => {
            clear();
            onPointerEnter?.(event);
          }}
          onPointerLeave={(event) => {
            hide(closeDelay);
            onPointerLeave?.(event);
          }}
          {...rest}
        >
          {content}
        </span>
      </>
    );
  },
);
