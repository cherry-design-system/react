"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type UIEvent,
} from "react";
import { Sparkles, X } from "lucide-react";
import { cx } from "../../utils/cx";
import { IconButton } from "../icon-button";
import type { ChatPanelSide, ChatPanelVariant } from "./variants.gen";

export interface ChatPanelProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "title"
> {
  /**
   * drawer: slides in from the side (modal below 992px, beside the page
   * above it); fullscreen: covers the viewport, modal; inline: a plain
   * panel in the page flow. Defaults to "drawer".
   */
  variant?: ChatPanelVariant;
  /** Drawer edge. Defaults to "right". */
  side?: ChatPanelSide;
  /** Overlay variants: shown or not. Inline panels ignore it. */
  open?: boolean;
  /** Called with false when Escape or the close button asks to close. */
  onOpenChange?: (open: boolean) => void;
  /** Force modal (true) or non-modal (false) instead of the variant default. */
  modal?: boolean;
  /** Header title. Defaults to "AI assistant"; null hides the header text. */
  title?: ReactNode;
  /** Header icon. Defaults to sparkles; null hides it. */
  icon?: ReactNode;
  /** Extra header controls (reset...), before the close button. */
  actions?: ReactNode;
  /** Hide the close button of an overlay panel. */
  hideClose?: boolean;
  closeLabel?: string;
}

const BELOW_LG = "(max-width: 991.98px)";

/**
 * The assistant's window (Figma "ChatPanel"). Overlay variants are a
 * native <dialog>: Escape, the top layer, inert background and the
 * backdrop come from the platform; CSS animates the slide or fade both
 * ways (@starting-style + allow-discrete). On open, focus goes to the
 * composer.
 */
export const ChatPanel = forwardRef<HTMLElement, ChatPanelProps>(
  function ChatPanel(
    {
      variant = "drawer",
      side = "right",
      open = false,
      onOpenChange,
      modal,
      title = "AI assistant",
      icon,
      actions,
      hideClose,
      closeLabel = "Close chat",
      className,
      children,
      "aria-label": ariaLabel,
      ...rest
    },
    ref,
  ) {
    const overlay = variant !== "inline";
    const dialogRef = useRef<HTMLDialogElement>(null);
    const sectionRef = useRef<HTMLElement>(null);
    useImperativeHandle(
      ref,
      () => (overlay ? dialogRef.current : sectionRef.current) as HTMLElement,
    );

    useEffect(() => {
      const dialog = dialogRef.current;
      if (!overlay || !dialog) return;
      if (open && !dialog.open) {
        const isModal =
          modal ??
          (variant === "fullscreen" ||
            (typeof window.matchMedia === "function" &&
              window.matchMedia(BELOW_LG).matches));
        try {
          if (isModal) dialog.showModal();
          else dialog.show();
        } catch {
          dialog.setAttribute("open", "");
        }
        dialog
          .querySelector<HTMLTextAreaElement>(".cherry-chat-input__textarea")
          ?.focus();
      } else if (!open && dialog.open) {
        dialog.close();
      }
    }, [open, overlay, modal, variant]);

    const header =
      title !== null || actions || (overlay && !hideClose) ? (
        <div className="cherry-chat-panel__header">
          <span className="cherry-chat-panel__title">
            {icon !== null ? (
              <span className="cherry-chat-panel__icon" aria-hidden="true">
                {icon ?? <Sparkles />}
              </span>
            ) : null}
            {title !== null ? <h2>{title}</h2> : null}
          </span>
          <span className="cherry-chat-panel__actions">
            {actions}
            {overlay && !hideClose ? (
              <IconButton
                aria-label={closeLabel}
                icon={<X />}
                size="sm"
                onClick={() => onOpenChange?.(false)}
              />
            ) : null}
          </span>
        </div>
      ) : null;

    const label = ariaLabel ?? (typeof title === "string" ? title : undefined);

    if (!overlay) {
      return (
        <section
          ref={sectionRef}
          className={cx("cherry-chat-panel", className)}
          data-variant={variant}
          aria-label={label}
          {...rest}
        >
          {header}
          {children}
        </section>
      );
    }

    return (
      <dialog
        ref={dialogRef}
        className={cx("cherry-chat-panel", className)}
        data-variant={variant}
        data-side={side}
        aria-label={label}
        onCancel={(event) => {
          // Escape on a modal dialog: let the owner decide (stay controlled).
          event.preventDefault();
          onOpenChange?.(false);
        }}
        onKeyDown={(event: KeyboardEvent<HTMLDialogElement>) => {
          // A non-modal dialog gets no cancel event from Escape.
          if (event.key === "Escape" && !event.defaultPrevented) {
            event.preventDefault();
            onOpenChange?.(false);
          }
        }}
        {...rest}
      >
        {header}
        {children}
      </dialog>
    );
  },
);

export interface ChatMessageListProps extends HTMLAttributes<HTMLDivElement> {
  /** A reply is streaming: following jumps instead of smooth-scrolling, and turning it on re-arms following. */
  streaming?: boolean;
}

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Scrolling transcript (role="log"). It follows new messages while the
 * reader is near the bottom (smoothly, or instantly while streaming or with
 * reduced motion) and stops following once they scroll up.
 */
export const ChatMessageList = forwardRef<HTMLDivElement, ChatMessageListProps>(
  function ChatMessageList(
    { streaming, className, children, onScroll, ...rest },
    ref,
  ) {
    const listRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => listRef.current as HTMLDivElement);
    // Following the end of the transcript; released when the reader scrolls
    // up, re-armed when they come back near the bottom.
    const follow = useRef(true);
    // Our own smooth scroll is running: its scroll events say nothing about
    // the reader's intent.
    const auto = useRef(false);
    const frame = useRef<number | null>(null);
    const streamingRef = useRef(streaming);
    streamingRef.current = streaming;

    const schedule = useRef(() => {});
    schedule.current = () => {
      if (!follow.current || frame.current !== null) return;
      if (typeof requestAnimationFrame !== "function") return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        const list = listRef.current;
        if (!list || !follow.current || typeof list.scrollTo !== "function")
          return;
        const distance = list.scrollHeight - list.scrollTop - list.clientHeight;
        if (distance <= 1) return;
        const reduce =
          typeof window.matchMedia === "function" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const smooth = !reduce && !streamingRef.current;
        auto.current = smooth;
        list.scrollTo({
          top: list.scrollHeight,
          behavior: smooth ? "smooth" : "auto",
        });
      });
    };

    // A reply starting (streaming turns on) means a question just went out:
    // follow again even if the reader had scrolled up, as in cherry 1.x.
    const wasStreaming = useRef(streaming);
    useIsoLayoutEffect(() => {
      if (streaming && !wasStreaming.current) follow.current = true;
      wasStreaming.current = streaming;
    }, [streaming]);

    // New children: follow them.
    useIsoLayoutEffect(() => schedule.current(), [children, streaming]);

    // Content that grows after rendering (a reply streaming in, the typing
    // row unfolding, images loading) is followed too.
    useEffect(() => {
      const list = listRef.current;
      if (!list || typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(() => schedule.current());
      for (const child of Array.from(list.children)) observer.observe(child);
      return () => observer.disconnect();
    }, [children]);

    useEffect(
      () => () => {
        // Reset too: StrictMode remounts, and a stale id would block every
        // later scroll.
        if (frame.current !== null) cancelAnimationFrame(frame.current);
        frame.current = null;
      },
      [],
    );

    const takeOver = () => {
      auto.current = false;
    };

    return (
      <div
        ref={listRef}
        role="log"
        className={cx("cherry-chat-panel__body", className)}
        onWheel={takeOver}
        onTouchStart={takeOver}
        onPointerDown={takeOver}
        onKeyDown={takeOver}
        onScroll={(event: UIEvent<HTMLDivElement>) => {
          const list = event.currentTarget;
          const distance =
            list.scrollHeight - list.scrollTop - list.clientHeight;
          if (distance <= 1) auto.current = false;
          if (!auto.current)
            follow.current = distance <= list.clientHeight * 0.15;
          onScroll?.(event);
        }}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

export interface ChatLauncherProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Animated AI gradient border with a soft halo. */
  glow?: boolean;
  /** Icon before the label. Defaults to sparkles. */
  icon?: ReactNode;
}

/** Compact "Ask AI" button that opens the panel (pass aria-expanded). */
export const ChatLauncher = forwardRef<HTMLButtonElement, ChatLauncherProps>(
  function ChatLauncher(
    { glow, icon, className, children = "Ask AI", type, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={cx("cherry-chat-launcher", className)}
        data-glow={glow || undefined}
        {...rest}
      >
        <span className="cherry-chat-launcher__icon" aria-hidden="true">
          {icon ?? <Sparkles />}
        </span>
        <span>{children}</span>
      </button>
    );
  },
);
