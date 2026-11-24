"use client";
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Check, FileText, TriangleAlert, X } from "lucide-react";
import { cx } from "../../utils/cx";
import type { FileItemStatus } from "./variants.gen";

export interface FileItemProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** File name. */
  name: string;
  /** File size in bytes (formatted as "2.4 MB"). */
  bytes?: number;
  /** Defaults to "complete". */
  status?: FileItemStatus;
  /** Upload progress, 0-100, shown while uploading. */
  progress?: number;
  /** Error message shown in the error state. Defaults to "Upload failed". */
  error?: ReactNode;
  /** Icon in the tile. Defaults to a document glyph (a warning on error). */
  icon?: ReactNode;
  /** Text after the size when complete. Defaults to "Uploaded". */
  completeLabel?: ReactNode;
  /** Accessible name of the remove button. Defaults to "Remove {name}". */
  removeLabel?: string;
  /** Shows the remove button. Runs after the row has animated out. */
  onRemove?: () => void;
}

const units = ["B", "KB", "MB", "GB", "TB"];

/** 2_400_000 -> "2.4 MB" (1000-based, like file managers). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit += 1;
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  return `${value.toFixed(digits).replace(/\.0$/, "")} ${units[unit]}`;
}

/** Exit length (--cherry-duration-fast). */
const EXIT_MS = 200;

/**
 * One uploaded (or uploading) file: icon tile, name, size, progress or
 * status, and a remove button. Rows slide in, the progress fill eases, the
 * glyph pops on each status change, an error shakes once, and a removed row
 * collapses out before `onRemove` runs.
 */
export const FileItem = forwardRef<HTMLDivElement, FileItemProps>(
  function FileItem(
    {
      name,
      bytes,
      status = "complete",
      progress = 0,
      error = "Upload failed",
      icon,
      completeLabel = "Uploaded",
      removeLabel,
      onRemove,
      className,
      style,
      ...rest
    },
    ref,
  ) {
    const [removing, setRemoving] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => clearTimeout(timer.current), []);

    const remove = () => {
      if (!onRemove || removing) return;
      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (reduce) {
        onRemove();
        return;
      }
      setRemoving(true);
      timer.current = setTimeout(onRemove, EXIT_MS);
    };

    const pct = Math.min(100, Math.max(0, progress));
    const size = bytes !== undefined ? formatBytes(bytes) : "";
    const meta =
      status === "error" ? (
        error
      ) : status === "uploading" ? (
        [size, `${Math.round(pct)}%`].filter(Boolean).join(" · ")
      ) : (
        <>
          <Check className="cherry-file-item__check" aria-hidden="true" />
          {size ? `${size} · ` : null}
          {completeLabel}
        </>
      );

    return (
      <div
        ref={ref}
        className={cx("cherry-file-item", className)}
        data-status={status}
        data-removing={removing || undefined}
        style={{ "--_progress": pct / 100, ...style } as CSSProperties}
        {...rest}
      >
        <span className="cherry-file-item__tile" aria-hidden="true">
          <span key={status} className="cherry-file-item__glyph">
            {status === "error" ? <TriangleAlert /> : (icon ?? <FileText />)}
          </span>
        </span>
        <span className="cherry-file-item__body">
          <span className="cherry-file-item__name" title={name}>
            {name}
          </span>
          <span
            className="cherry-file-item__meta"
            role={status === "error" ? "alert" : undefined}
          >
            {meta}
          </span>
          {status === "uploading" ? (
            <span
              className="cherry-file-item__progress"
              role="progressbar"
              aria-label={name}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pct)}
            >
              <span className="cherry-file-item__bar" />
            </span>
          ) : null}
        </span>
        {onRemove ? (
          <button
            type="button"
            className="cherry-file-item__remove"
            aria-label={removeLabel ?? `Remove ${name}`}
            onClick={remove}
          >
            <X aria-hidden="true" />
          </button>
        ) : null}
      </div>
    );
  },
);
