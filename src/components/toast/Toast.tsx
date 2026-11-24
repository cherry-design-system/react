"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { Button } from "../button";
import { Spinner } from "../spinner";
import type { ToastAlign, ToastColor, ToastPosition } from "./variants.gen";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  /** Status color and icon tile. `default` has no tile. Defaults to `info`. */
  color?: ToastColor;
  /** Milliseconds before the toast hides itself; `0` (default) is sticky. */
  autoHide?: number;
  /** Optional second line under the title. */
  description?: ReactNode;
  /** Optional button; runs `onClick`, then dismisses the toast. */
  action?: ToastAction;
  /** Close badge and swipe to dismiss. Defaults to `true`. */
  dismissible?: boolean;
  /** Reuse an existing toast's id to replace that toast in place. */
  id?: number;
}

export interface ToastUpdate extends Omit<ToastOptions, "id"> {
  title?: ReactNode;
}

export interface ToastPromiseMessages<T> {
  loading: ReactNode;
  success: ReactNode | ((data: T) => ReactNode);
  error: ReactNode | ((error: unknown) => ReactNode);
}

export interface ToastItem {
  id: number;
  title: ReactNode;
  color: ToastColor;
  autoHide: number;
  description?: ReactNode;
  action?: ToastAction;
  dismissible: boolean;
  exiting: boolean;
}

export interface ToastApi {
  toasts: ToastItem[];
  /** Shows a toast; returns its id. */
  show: (title: ReactNode, options?: ToastOptions) => number;
  update: (id: number, update: ToastUpdate) => void;
  /** Animated removal. */
  dismiss: (id: number) => void;
  /** Immediate removal, no exit animation. */
  remove: (id: number) => void;
  /** Loading toast that turns into success / error when the task settles. */
  promise: <T>(task: Promise<T> | (() => Promise<T>), messages: ToastPromiseMessages<T>, options?: ToastOptions) => Promise<T>;
}

// The exit fade runs on --cherry-duration-slow (400ms); the toast is dropped
// from state once it has finished.
const EXIT_MS = 400;
// Settled promise toasts hide after this unless the caller sets autoHide.
const PROMISE_AUTO_HIDE_MS = 4000;
// Deck geometry: gap between fanned-out toasts, how far each back toast
// peeks out from under the one in front, and how much smaller it gets.
const GAP = 10;
const PEEK = 14;
const SCALE_STEP = 0.05;
// Swipe distance (px) or speed (px/ms) past which a drag dismisses.
const SWIPE_DISTANCE = 45;
const SWIPE_VELOCITY = 0.11;

const resolve = <V,>(value: ReactNode | ((input: V) => ReactNode), input: V) =>
  typeof value === "function" ? value(input) : value;

const noop = () => undefined;
const ToastContext = createContext<ToastApi>({
  toasts: [],
  show: () => -1,
  update: noop,
  dismiss: noop,
  remove: noop,
  promise: (task) => (typeof task === "function" ? task() : task),
});

/** Show, update and dismiss toasts from anywhere under <ToastProvider>. */
export function useToast(): ToastApi {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const exitTimers = useRef(new Map<number, number>());

  const clearExitTimer = useCallback((id: number) => {
    const timer = exitTimers.current.get(id);
    if (timer === undefined) return;
    window.clearTimeout(timer);
    exitTimers.current.delete(id);
  }, []);

  useEffect(() => {
    const timers = exitTimers.current;
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const show = useCallback(
    (title: ReactNode, options: ToastOptions = {}) => {
      const id = options.id ?? nextId.current++;
      if (id >= nextId.current) nextId.current = id + 1;
      const color = options.color ?? "info";
      const toast: ToastItem = {
        id,
        title,
        color,
        // A spinner never hides itself; it waits for an update or dismissal.
        autoHide: color === "loading" ? 0 : (options.autoHide ?? 0),
        description: options.description,
        action: options.action,
        dismissible: options.dismissible ?? true,
        exiting: false,
      };
      clearExitTimer(id);
      setToasts((prev) => {
        const index = prev.findIndex((item) => item.id === id);
        if (index === -1) return [...prev, toast];
        const next = prev.slice();
        next[index] = toast;
        return next;
      });
      return id;
    },
    [clearExitTimer],
  );

  const update = useCallback((id: number, { title, ...rest }: ToastUpdate) => {
    setToasts((prev) =>
      prev.map((item) => {
        if (item.id !== id || item.exiting) return item;
        const next = { ...item, ...rest, title: title === undefined ? item.title : title };
        if (next.color === "loading") next.autoHide = 0;
        return next;
      }),
    );
  }, []);

  const remove = useCallback(
    (id: number) => {
      clearExitTimer(id);
      setToasts((prev) => prev.filter((item) => item.id !== id));
    },
    [clearExitTimer],
  );

  // Flag the toast as exiting so it fades out in place, then drop it once the
  // exit transition has finished.
  const dismiss = useCallback((id: number) => {
    if (exitTimers.current.has(id)) return;
    setToasts((prev) => prev.map((item) => (item.id === id ? { ...item, exiting: true } : item)));
    exitTimers.current.set(
      id,
      window.setTimeout(() => {
        exitTimers.current.delete(id);
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, EXIT_MS),
    );
  }, []);

  const promise = useCallback(
    <T,>(task: Promise<T> | (() => Promise<T>), messages: ToastPromiseMessages<T>, options: ToastOptions = {}) => {
      const id = show(messages.loading, { ...options, color: "loading" });
      const autoHide = options.autoHide ?? PROMISE_AUTO_HIDE_MS;
      const pending = typeof task === "function" ? task() : task;
      // Swap the same toast in place. One dismissed while loading stays gone:
      // update() skips ids that are exiting or removed.
      pending
        .then((data) => update(id, { title: resolve(messages.success, data), color: "success", autoHide }))
        // After .then, so a throwing success message still clears the spinner.
        .catch((error: unknown) => update(id, { title: resolve(messages.error, error), color: "error", autoHide }));
      return pending;
    },
    [show, update],
  );

  const value = useMemo(() => ({ toasts, show, update, dismiss, remove, promise }), [toasts, show, update, dismiss, remove, promise]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

function ToastGlyph({ color }: { color: ToastColor }) {
  if (color === "loading") return <Spinner size="md" label={null} />;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {color === "success" && <path className="cherry-toast__stroke" pathLength={1} d="M5.5 12.5 10 17l8.5-9.5" />}
      {color === "error" && (
        <>
          <path className="cherry-toast__stroke" pathLength={1} d="M7 7l10 10" />
          <path className="cherry-toast__stroke" pathLength={1} d="M17 7 7 17" />
        </>
      )}
      {color === "warning" && (
        <>
          <path className="cherry-toast__stroke" pathLength={1} d="M12 5.5v8" />
          <circle cx="12" cy="18.25" r="1.6" fill="currentColor" stroke="none" />
        </>
      )}
      {color === "info" && (
        <>
          <circle cx="12" cy="5.75" r="1.6" fill="currentColor" stroke="none" />
          <path className="cherry-toast__stroke" pathLength={1} d="M12 10.5v8" />
        </>
      )}
    </svg>
  );
}

function ToastTile({ color }: { color: Exclude<ToastColor, "default"> }) {
  // Only the first color arrives with the card; a later swap (a settled
  // promise) re-runs the glyph right away and bumps the tile instead.
  const [initialColor] = useState(color);
  const settled = color !== initialColor;
  return (
    // key: a swap restarts the bump and glyph keyframes.
    <span key={settled ? color : "initial"} className="cherry-toast__tile" data-settled={settled || undefined} aria-hidden="true">
      <span className="cherry-toast__glyph">
        <ToastGlyph color={color} />
      </span>
    </span>
  );
}

export interface ToasterProps {
  /** Horizontal placement. Defaults to "center". */
  align?: ToastAlign;
  /** Anchored edge. Defaults to "top". */
  position?: ToastPosition;
  /** Keep every toast fanned out instead of collapsing them into a deck. */
  expand?: boolean;
  /** How many toasts show at once; older ones wait behind. Defaults to 3. */
  visibleToasts?: number;
  /** Accessible name of the region. Defaults to "Notifications". */
  label?: string;
  /** Accessible name of each close badge. Defaults to "Dismiss notification". */
  dismissLabel?: string;
}

type Placement = { index: number; offset: number };

/** Renders the toasts of the nearest <ToastProvider>. Place it once. */
export function Toaster({ align = "center", position = "top", expand = false, visibleToasts = 3, label = "Notifications", dismissLabel = "Dismiss notification" }: ToasterProps) {
  const { toasts, dismiss } = useToast();
  const listRef = useRef<HTMLOListElement>(null);
  const [heights, setHeights] = useState<Record<number, number>>({});
  const [pointerInside, setPointerInside] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const [touchOpen, setTouchOpen] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  // Where each toast last sat, so an exiting toast fades out in place while
  // the rest close the gap.
  const lastPlacement = useRef(new Map<number, Placement>());

  const interacting = pointerInside || focusInside || touchOpen;
  const expanded = expand || interacting;
  const paused = interacting || pageHidden;
  const bottom = position === "bottom";

  const setHeight = useCallback((id: number, height: number) => {
    setHeights((prev) => (prev[id] === height ? prev : { ...prev, [id]: height }));
  }, []);

  useEffect(() => {
    const onVisibility = () => setPageHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // A tap opens the deck on touch screens; a tap anywhere else closes it.
  useEffect(() => {
    if (!touchOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!listRef.current?.contains(event.target as Node)) setTouchOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [touchOpen]);

  // Prune measurements of removed toasts, and drop interaction state when
  // focus left with a removed toast (no blur fires) or the deck emptied.
  useEffect(() => {
    const ids = new Set(toasts.map((item) => item.id));
    setHeights((prev) => {
      const stale = Object.keys(prev).filter((id) => !ids.has(Number(id)));
      if (stale.length === 0) return prev;
      const next = { ...prev };
      stale.forEach((id) => delete next[Number(id)]);
      return next;
    });
    lastPlacement.current.forEach((_, id) => {
      if (!ids.has(id)) lastPlacement.current.delete(id);
    });
    if (!listRef.current?.contains(document.activeElement)) setFocusInside(false);
    if (toasts.length === 0) {
      setPointerInside(false);
      setTouchOpen(false);
    }
  }, [toasts]);

  // Newest first. Exiting toasts drop out of the layout so the others move.
  const live = toasts.filter((item) => !item.exiting).reverse();
  const placements = new Map<number, Placement>();
  let offset = 0;
  live.forEach((item, index) => {
    placements.set(item.id, { index, offset });
    offset += (heights[item.id] ?? 0) + GAP;
  });
  placements.forEach((placement, id) => lastPlacement.current.set(id, placement));

  const front = live[0];
  const frontHeight = front ? (heights[front.id] ?? 0) : 0;
  const shown = live.slice(0, visibleToasts);
  const stackHeight =
    shown.length === 0
      ? 0
      : expanded
        ? shown.reduce((sum, item) => sum + (heights[item.id] ?? 0), 0) + GAP * (shown.length - 1)
        : frontHeight + PEEK * (shown.length - 1);

  return (
    <ol
      ref={listRef}
      className="cherry-toaster"
      data-align={align}
      data-position={position}
      data-expanded={expanded || undefined}
      style={{ "--_stack-h": `${stackHeight}px` } as CSSProperties}
      aria-live="polite"
      aria-label={label}
      onMouseEnter={() => setPointerInside(true)}
      onMouseLeave={() => setPointerInside(false)}
      onPointerDown={(event) => {
        if (event.pointerType !== "mouse") setTouchOpen(true);
      }}
      onFocus={() => setFocusInside(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusInside(false);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        const item = (event.target as HTMLElement).closest<HTMLElement>("[data-toast-id]");
        if (item) dismiss(Number(item.dataset.toastId));
      }}
    >
      {toasts.map((toast) => (
        <ToastRow
          key={toast.id}
          toast={toast}
          placement={placements.get(toast.id) ?? lastPlacement.current.get(toast.id) ?? { index: 0, offset: 0 }}
          frontHeight={frontHeight}
          height={heights[toast.id]}
          expanded={expanded}
          paused={paused}
          visibleToasts={visibleToasts}
          bottom={bottom}
          dismissLabel={dismissLabel}
          onHeight={setHeight}
        />
      ))}
    </ol>
  );
}

interface ToastRowProps {
  toast: ToastItem;
  placement: Placement;
  frontHeight: number;
  height: number | undefined;
  expanded: boolean;
  paused: boolean;
  visibleToasts: number;
  bottom: boolean;
  dismissLabel: string;
  onHeight: (id: number, height: number) => void;
}

function ToastRow({ toast, placement, frontHeight, height, expanded, paused, visibleToasts, bottom, dismissLabel, onHeight }: ToastRowProps) {
  const { dismiss: dismissById } = useToast();
  const { id, title, color, autoHide, description, action, dismissible, exiting } = toast;
  const contentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [swipe, setSwipe] = useState({ x: 0, y: 0, dragging: false });
  const drag = useRef<{ x: number; y: number; time: number; axis: "x" | "y" | null } | null>(null);
  const remaining = useRef(autoHide);
  const remainingFor = useRef(autoHide);

  const dismiss = useCallback(() => dismissById(id), [dismissById, id]);

  // Mount off-screen, then flip to placed after the first frame has painted
  // (hence the double rAF) so the enter transition actually plays.
  useEffect(() => {
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setMounted(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  // Report the natural height (border included) for the deck layout.
  // offsetHeight, not getBoundingClientRect: the deck scales back toasts.
  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    const measure = () => onHeight(id, element.offsetHeight + 2);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [id, onHeight]);

  // Auto-hide that pauses while the deck is in use or the tab is hidden, and
  // starts over when autoHide changes (a settled promise).
  useEffect(() => {
    if (remainingFor.current !== autoHide) {
      remainingFor.current = autoHide;
      remaining.current = autoHide;
    }
    if (!autoHide || exiting || paused) return;
    const start = Date.now();
    const timer = window.setTimeout(dismiss, Math.max(remaining.current, 0));
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - start;
    };
  }, [autoHide, exiting, paused, dismiss]);

  const onPointerDown = (event: ReactPointerEvent<HTMLLIElement>) => {
    if (!dismissible || exiting || event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button, a, input")) return;
    drag.current = { x: event.clientX, y: event.clientY, time: Date.now(), axis: null };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLLIElement>) => {
    const start = drag.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.axis) {
      if (Math.hypot(dx, dy) < 4) return;
      start.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (start.axis === "x") {
      setSwipe({ x: dx, y: 0, dragging: true });
    } else {
      // Vertical swipes only dismiss toward the anchored edge; dragging the
      // other way gives a little, then resists.
      const towardEdge = bottom ? dy > 0 : dy < 0;
      setSwipe({ x: 0, y: towardEdge ? dy : dy * 0.15, dragging: true });
    }
  };

  const onPointerUp = () => {
    const start = drag.current;
    drag.current = null;
    if (!start) return;
    const distance = start.axis === "x" ? Math.abs(swipe.x) : bottom ? Math.max(swipe.y, 0) : Math.max(-swipe.y, 0);
    const velocity = distance / Math.max(Date.now() - start.time, 1);
    if (start.axis && (distance > SWIPE_DISTANCE || velocity > SWIPE_VELOCITY)) {
      // Carry on in the swipe direction while it fades out.
      setSwipe((prev) => ({ x: prev.x * 2, y: prev.y * 2, dragging: false }));
      dismiss();
    } else {
      setSwipe({ x: 0, y: 0, dragging: false });
    }
  };

  const { index, offset } = placement;
  const direction = bottom ? -1 : 1;
  const hiddenInDeck = index >= visibleToasts;
  const concealed = !expanded && index > 0;
  const restY = direction * (expanded ? offset : index * PEEK);
  const restScale = expanded ? 1 : Math.max(1 - index * SCALE_STEP, 0);

  let y = restY + swipe.y;
  let scale = restScale;
  if (exiting) {
    // A dismissed toast lifts away from the edge; a swiped one keeps going.
    const swiped = swipe.x !== 0 || swipe.y !== 0;
    if (!swiped) y -= direction * 12;
    scale = restScale * 0.95;
  }
  const ownHeight = concealed && frontHeight ? frontHeight : height;

  const style = {
    "--_x": `${swipe.x}px`,
    "--_y": `${y}px`,
    "--_scale": scale,
    "--_z": 1000 - index,
    ...(ownHeight ? { "--_h": `${ownHeight}px` } : null),
  } as CSSProperties;

  return (
    <li
      className="cherry-toast"
      data-toast-id={id}
      data-color={color}
      data-mounted={mounted || undefined}
      data-exiting={exiting || undefined}
      data-dragging={swipe.dragging || undefined}
      data-concealed={concealed || undefined}
      data-hidden-in-deck={hiddenInDeck || undefined}
      aria-hidden={concealed || hiddenInDeck || undefined}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        drag.current = null;
        setSwipe({ x: 0, y: 0, dragging: false });
      }}
    >
      <div className="cherry-toast__card">
        <div className="cherry-toast__content" ref={contentRef}>
          {color !== "default" && <ToastTile color={color} />}
          <div className="cherry-toast__text">
            <p className="cherry-toast__title">{title}</p>
            {description ? <p className="cherry-toast__description">{description}</p> : null}
          </div>
          {action ? (
            <Button
              className="cherry-toast__action"
              size="sm"
              tabIndex={concealed ? -1 : undefined}
              onClick={() => {
                action.onClick();
                dismiss();
              }}
            >
              {action.label}
            </Button>
          ) : null}
        </div>
      </div>
      {dismissible ? (
        <button type="button" className="cherry-toast__close" aria-label={dismissLabel} tabIndex={concealed || hiddenInDeck ? -1 : undefined} onClick={dismiss}>
          <X aria-hidden="true" />
        </button>
      ) : null}
    </li>
  );
}
