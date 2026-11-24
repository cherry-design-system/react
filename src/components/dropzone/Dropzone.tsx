"use client";
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type DragEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Upload } from "lucide-react";
import { cx } from "../../utils/cx";
import { useFieldControl } from "../field/field-context";
import { assignFiles, sortFiles, type DropzoneRejection } from "./accept";

export interface DropzoneProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "children" | "size"
> {
  /** Bold first words of the prompt. Defaults to "Click to upload". */
  prompt?: ReactNode;
  /** Rest of the prompt line. Defaults to "or drag and drop". */
  browse?: ReactNode;
  /** Small line under the prompt (accepted types, limits). */
  hint?: ReactNode;
  /** Icon in the tile. Defaults to an upload glyph. */
  icon?: ReactNode;
  /** Compact horizontal layout that sits in a form row. */
  inline?: boolean;
  /** Maximum size per file, in bytes. */
  maxBytes?: number;
  /** Maximum files accepted from one pick or drop. With `multiple` unset, 1. */
  maxFiles?: number;
  invalid?: boolean;
  /** Accepted files from a pick or a drop. */
  onFilesAdded?: (files: File[]) => void;
  /** Files refused for their type, size or count. */
  onFilesRejected?: (rejections: DropzoneRejection[]) => void;
}

/**
 * Drag-and-drop file area around a real file input: the input is visually
 * hidden but focusable, so Tab + Enter/Space open the native picker, forms
 * submit the files (dropped ones included) and it works inside <Field>.
 * Pair it with <FileItem> to list what was added.
 */
export const Dropzone = forwardRef<HTMLInputElement, DropzoneProps>(
  function Dropzone(
    {
      prompt = "Click to upload",
      browse = "or drag and drop",
      hint,
      icon,
      inline,
      maxBytes,
      maxFiles,
      invalid,
      onFilesAdded,
      onFilesRejected,
      onChange,
      accept,
      multiple,
      className,
      style,
      ...props
    },
    ref,
  ) {
    const control = useFieldControl(props);
    const disabled = Boolean(control.disabled);
    const isInvalid =
      invalid ||
      control["aria-invalid"] === true ||
      control["aria-invalid"] === "true";
    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
    const [dragOver, setDragOver] = useState(false);
    const [drops, setDrops] = useState(0);
    const depth = useRef(0);

    const take = (list: FileList | null): File[] => {
      if (!list || disabled) return [];
      const { accepted, rejected } = sortFiles(Array.from(list), {
        accept,
        maxBytes,
        maxFiles: multiple ? maxFiles : 1,
      });
      if (rejected.length) onFilesRejected?.(rejected);
      if (accepted.length) {
        onFilesAdded?.(accepted);
        setDrops((n) => n + 1);
      }
      return accepted;
    };

    const leave = () => {
      depth.current = 0;
      setDragOver(false);
    };

    const dragProps = {
      onDragEnter: (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        if (disabled) return;
        depth.current += 1;
        setDragOver(true);
      },
      onDragOver: (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        if (event.dataTransfer)
          event.dataTransfer.dropEffect = disabled ? "none" : "copy";
      },
      onDragLeave: () => {
        depth.current -= 1;
        if (depth.current <= 0) leave();
      },
      onDrop: (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        leave();
        const accepted = take(event.dataTransfer?.files ?? null);
        if (accepted.length) assignFiles(inputRef.current, accepted);
      },
    };

    return (
      <label
        className={cx("cherry-dropzone", className)}
        style={style}
        data-inline={inline || undefined}
        data-drag-over={dragOver || undefined}
        data-disabled={disabled || undefined}
        data-invalid={isInvalid || undefined}
        {...dragProps}
      >
        <input
          ref={inputRef}
          type="file"
          className="cherry-dropzone__input"
          accept={accept}
          multiple={multiple}
          {...control}
          aria-invalid={isInvalid || undefined}
          onChange={(event) => {
            onChange?.(event);
            take(event.target.files);
          }}
        />
        <span
          key={drops}
          className="cherry-dropzone__tile"
          data-dropped={drops > 0 || undefined}
          aria-hidden="true"
        >
          {icon ?? <Upload />}
        </span>
        <span className="cherry-dropzone__text">
          <span className="cherry-dropzone__prompt">
            <strong>{prompt}</strong> {browse}
          </span>
          {hint ? <span className="cherry-dropzone__hint">{hint}</span> : null}
        </span>
      </label>
    );
  },
);
