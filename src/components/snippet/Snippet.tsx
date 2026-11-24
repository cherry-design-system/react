"use client";
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { Check, Copy } from "lucide-react";
import { cx } from "../../utils/cx";
import { IconButton } from "../icon-button/IconButton";

export interface SnippetProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "onCopy"
> {
  /** The command, shown on one line. */
  children: string;
  /** Text copied instead of the shown command. */
  copyText?: string;
  /** Prefix such as "$" or ">". `null` hides it. Never copied. */
  prompt?: ReactNode;
  /** Runs after a successful copy. */
  onCopy?: (text: string) => void;
  /** Copy button name. Defaults to "Copy". */
  copyLabel?: string;
  /** Name and announcement once copied. Defaults to "Copied". */
  copiedLabel?: string;
  /** Milliseconds before the check turns back into the copy icon. */
  resetAfter?: number;
}

/**
 * One-line command with a copy button. The copy icon swaps to a check with a
 * pop, then back. Without clipboard access (insecure context, denied
 * permission) the command text is selected instead, ready for Ctrl/Cmd+C.
 */
export const Snippet = forwardRef<HTMLDivElement, SnippetProps>(
  function Snippet(
    {
      children,
      copyText,
      prompt = "$",
      onCopy,
      copyLabel = "Copy",
      copiedLabel = "Copied",
      resetAfter = 2000,
      className,
      ...rest
    },
    ref,
  ) {
    const [copied, setCopied] = useState(false);
    const [overflows, setOverflows] = useState(false);
    const codeRef = useRef<HTMLElement>(null);

    // A command wider than the pill scrolls sideways; only then is it a tab
    // stop, so keyboard users can reach the hidden part.
    useEffect(() => {
      const node = codeRef.current;
      if (!node) return;
      const measure = () =>
        setOverflows(node.scrollWidth > node.clientWidth + 1);
      measure();
      if (typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      return () => observer.disconnect();
    }, [children]);

    useEffect(() => {
      if (!copied) return;
      const timer = window.setTimeout(() => setCopied(false), resetAfter);
      return () => window.clearTimeout(timer);
    }, [copied, resetAfter]);

    const selectText = () => {
      const node = codeRef.current;
      const selection = window.getSelection?.();
      if (!node || !selection) return;
      const range = document.createRange();
      range.selectNodeContents(node);
      selection.removeAllRanges();
      selection.addRange(range);
    };

    const copy = async () => {
      const text = copyText ?? children;
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        onCopy?.(text);
      } catch {
        selectText();
      }
    };

    return (
      <div
        ref={ref}
        className={cx("cherry-snippet", className)}
        data-copied={copied || undefined}
        {...rest}
      >
        {prompt !== null ? (
          <span className="cherry-snippet__prompt" aria-hidden="true">
            {prompt}
          </span>
        ) : null}
        <code
          ref={codeRef}
          className="cherry-snippet__code"
          tabIndex={overflows ? 0 : undefined}
        >
          {children}
        </code>
        <IconButton
          className="cherry-snippet__copy"
          size="sm"
          aria-label={copied ? copiedLabel : copyLabel}
          title={copied ? copiedLabel : copyLabel}
          onClick={copy}
          icon={
            <span className="cherry-snippet__icons" aria-hidden="true">
              <Copy className="cherry-snippet__icon" data-icon="copy" />
              <Check className="cherry-snippet__icon" data-icon="check" />
            </span>
          }
        />
        <span className="cherry-sr-only" role="status">
          {copied ? copiedLabel : ""}
        </span>
      </div>
    );
  },
);
