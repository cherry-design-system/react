"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type DragEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { ImagePlus, X } from "lucide-react";
import { cx } from "../../utils/cx";
import { useFieldControl } from "../field/field-context";
import {
  assignFiles,
  sortFiles,
  type DropzoneRejection,
} from "../dropzone/accept";
import type { AvatarDropzoneSize } from "./variants.gen";

export interface AvatarDropzoneProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "children" | "multiple" | "size" | "defaultValue"
> {
  /** 64 / 96 / 128 px. Defaults to "md". */
  size?: AvatarDropzoneSize;
  /** Picture shown before anything is picked (an existing avatar URL). */
  defaultSrc?: string;
  /** Icon shown while empty. Defaults to an image-plus glyph. */
  icon?: ReactNode;
  /** Maximum file size, in bytes. */
  maxBytes?: number;
  invalid?: boolean;
  /** Accessible name of the picker. Defaults to "Upload profile picture". */
  label?: string;
  /** Accessible name of the remove button. Defaults to "Remove profile picture". */
  removeLabel?: string;
  /** The picked picture, or null once it is removed. */
  onFileChange?: (file: File | null) => void;
  /** A file refused for its type or size. */
  onFileRejected?: (rejection: DropzoneRejection) => void;
}

/** How long the picture takes to fade out on remove (--cherry-duration-base). */
const EXIT_MS = 300;

/**
 * Round profile-picture picker: click, keyboard or drop. The preview scales
 * in, the remove badge pops, and removing fades the picture out before the
 * empty state returns.
 */
export const AvatarDropzone = forwardRef<HTMLInputElement, AvatarDropzoneProps>(
  function AvatarDropzone(
    {
      size = "md",
      defaultSrc,
      icon,
      maxBytes,
      invalid,
      label = "Upload profile picture",
      removeLabel = "Remove profile picture",
      onFileChange,
      onFileRejected,
      onChange,
      accept = "image/*",
      className,
      style,
      ...props
    },
    ref,
  ) {
    const control = useFieldControl(props);
    const disabled = Boolean(control.disabled);
    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);
    const [src, setSrc] = useState<string | null>(defaultSrc ?? null);
    const [filled, setFilled] = useState(Boolean(defaultSrc));
    const [dragOver, setDragOver] = useState(false);
    const objectUrl = useRef<string | null>(null);
    const exitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
      undefined,
    );

    const release = () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    };
    useEffect(
      () => () => {
        clearTimeout(exitTimer.current);
        release();
      },
      [],
    );

    const take = (list: FileList | null): File | null => {
      const file = list?.[0];
      if (!file || disabled) return null;
      const { accepted, rejected } = sortFiles([file], { accept, maxBytes });
      if (rejected[0]) {
        onFileRejected?.(rejected[0]);
        return null;
      }
      const picked = accepted[0] ?? null;
      if (!picked) return null;
      clearTimeout(exitTimer.current);
      release();
      objectUrl.current = URL.createObjectURL(picked);
      setSrc(objectUrl.current);
      setFilled(true);
      onFileChange?.(picked);
      return picked;
    };

    const remove = () => {
      setFilled(false);
      onFileChange?.(null);
      if (inputRef.current) inputRef.current.value = "";
      inputRef.current?.focus();
      // Keep the picture mounted while it fades out, then let it go.
      clearTimeout(exitTimer.current);
      exitTimer.current = setTimeout(() => {
        release();
        setSrc(null);
      }, EXIT_MS);
    };

    return (
      <span
        className={cx("cherry-avatar-dropzone", className)}
        style={style}
        data-size={size}
        data-filled={filled || undefined}
        data-drag-over={dragOver || undefined}
        data-disabled={disabled || undefined}
        data-invalid={invalid || undefined}
      >
        <label
          className="cherry-avatar-dropzone__target"
          onDragEnter={(event: DragEvent) => {
            event.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragOver={(event: DragEvent) => event.preventDefault()}
          onDragLeave={(event: DragEvent) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node))
              setDragOver(false);
          }}
          onDrop={(event: DragEvent) => {
            event.preventDefault();
            setDragOver(false);
            const file = take(event.dataTransfer?.files ?? null);
            if (file) assignFiles(inputRef.current, [file]);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            className="cherry-avatar-dropzone__input"
            accept={accept}
            aria-label={label}
            {...control}
            aria-invalid={invalid || control["aria-invalid"] || undefined}
            onChange={(event) => {
              onChange?.(event);
              take(event.target.files);
            }}
          />
          <span className="cherry-avatar-dropzone__icon" aria-hidden="true">
            {icon ?? <ImagePlus />}
          </span>
          {src ? (
            <img className="cherry-avatar-dropzone__image" src={src} alt="" />
          ) : null}
        </label>
        {src ? (
          <button
            type="button"
            className="cherry-avatar-dropzone__remove"
            aria-label={removeLabel}
            disabled={disabled}
            inert={!filled}
            onClick={remove}
          >
            <X aria-hidden="true" />
          </button>
        ) : null}
      </span>
    );
  },
);
