"use client";
import {
  Children,
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DialogHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ArrowDown, ArrowUp, CornerDownLeft, Search } from "lucide-react";
import { cx } from "../../utils/cx";
import { Kbd } from "../kbd";
import { useDialog, useMergedRef } from "../modal/use-dialog";
import { SearchContext } from "./search-context";

export interface SearchDialogProps extends Omit<
  DialogHTMLAttributes<HTMLDialogElement>,
  "open" | "onClose" | "children"
> {
  /** Controlled open state. */
  open: boolean;
  /** Asked on Escape or a backdrop click. */
  onClose: () => void;
  /** The search text (controlled). Filter the results from it. */
  query: string;
  onQueryChange: (query: string) => void;
  /** <SearchGroup>s and <SearchResult>s matching the query. */
  children?: ReactNode;
  /** Shown instead of the results when `children` is empty. */
  empty?: ReactNode;
  /** Side panel (e.g. a preview of the highlighted result). */
  preview?: ReactNode;
  /** End of the footer, announced politely (e.g. "31 of 31"). */
  status?: ReactNode;
  /** Input placeholder. Defaults to "Search". */
  placeholder?: string;
  /** Accessible name of the dialog and the input. Defaults to "Search". */
  label?: string;
  /** Footer hint labels (translate here). */
  navigateLabel?: string;
  selectLabel?: string;
  /** Show the keyboard hints footer. Defaults to true. */
  hints?: boolean;
}

const OPTION = '[role="option"]:not([aria-disabled="true"])';

/**
 * Command-palette search on a native <dialog>: an input (role="combobox")
 * over a listbox of results. Arrow keys move the highlight
 * (aria-activedescendant, focus stays in the input), Enter selects it,
 * Escape closes. Opens and closes like <Modal>: fade + scale over a fading
 * backdrop.
 */
export const SearchDialog = forwardRef<HTMLDialogElement, SearchDialogProps>(
  function SearchDialog(
    {
      open,
      onClose,
      query,
      onQueryChange,
      children,
      empty,
      preview,
      status,
      placeholder = "Search",
      label = "Search",
      navigateLabel = "navigate",
      selectLabel = "open",
      hints = true,
      className,
      onCancel,
      onPointerDown,
      onClick,
      ...rest
    },
    forwarded,
  ) {
    const id = useId();
    const listboxId = `${id}-listbox`;
    const statusId = `${id}-status`;
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const { ref, props } = useDialog(open, onClose, true, {
      onCancel,
      onPointerDown,
      onClick,
    });
    const setRef = useMergedRef(ref, forwarded);
    const hasResults = Children.toArray(children).length > 0;

    const options = () =>
      Array.from(listRef.current?.querySelectorAll<HTMLElement>(OPTION) ?? []);

    // Keep the highlight on a result that exists: the first one after the
    // results change, none when there are none.
    useEffect(() => {
      const list = options();
      if (list.some((option) => option.id === activeId)) return;
      const first = list[0]?.id ?? null;
      if (first !== activeId) setActiveId(first);
    });

    useEffect(() => {
      if (!activeId) return;
      const option = document.getElementById(activeId);
      option?.scrollIntoView?.({ block: "nearest" });
    }, [activeId]);

    useEffect(() => {
      if (open) inputRef.current?.focus();
    }, [open]);

    const move = (step: number) => {
      const list = options();
      if (list.length === 0) return;
      const current = list.findIndex((option) => option.id === activeId);
      const next =
        current === -1
          ? step > 0
            ? 0
            : list.length - 1
          : (current + step + list.length) % list.length;
      setActiveId(list[next]?.id ?? null);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.nativeEvent.isComposing) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        move(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        move(-1);
      } else if (event.key === "Enter") {
        if (!activeId) return;
        event.preventDefault();
        document.getElementById(activeId)?.click();
      }
    };

    const context = useMemo(() => ({ activeId, setActiveId }), [activeId]);

    return (
      <dialog
        ref={setRef}
        className={cx("cherry-search-dialog", className)}
        data-layout={preview ? "preview" : "list"}
        aria-label={label}
        {...rest}
        {...props}
      >
        <div className="cherry-search-dialog__header">
          <Search className="cherry-search-dialog__icon" aria-hidden="true" />
          <input
            ref={inputRef}
            className="cherry-search-dialog__input"
            type="text"
            role="combobox"
            aria-label={label}
            aria-expanded={hasResults}
            aria-controls={listboxId}
            aria-activedescendant={activeId ?? undefined}
            aria-autocomplete="list"
            aria-describedby={status ? statusId : undefined}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder={placeholder}
            value={query}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onQueryChange(event.target.value)
            }
            onKeyDown={onKeyDown}
          />
          <Kbd size="sm" aria-hidden="true">
            esc
          </Kbd>
        </div>
        <div className="cherry-search-dialog__content">
          <SearchContext.Provider value={context}>
            <div
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-label={label}
              className="cherry-search-dialog__results"
              hidden={!hasResults}
            >
              {children}
            </div>
          </SearchContext.Provider>
          {hasResults ? null : (
            <div className="cherry-search-dialog__empty">{empty}</div>
          )}
          {preview ? (
            <div className="cherry-search-dialog__preview">{preview}</div>
          ) : null}
        </div>
        {hints || status ? (
          <footer className="cherry-search-dialog__footer">
            {hints ? (
              <span className="cherry-search-dialog__hints" aria-hidden="true">
                <span className="cherry-search-dialog__hint">
                  <Kbd size="sm">
                    <ArrowUp />
                  </Kbd>
                  <Kbd size="sm">
                    <ArrowDown />
                  </Kbd>
                  {navigateLabel}
                </span>
                <span className="cherry-search-dialog__hint">
                  <Kbd size="sm">
                    <CornerDownLeft />
                  </Kbd>
                  {selectLabel}
                </span>
              </span>
            ) : null}
            <span
              className="cherry-search-dialog__status"
              id={statusId}
              aria-live="polite"
            >
              {status}
            </span>
          </footer>
        ) : null}
      </dialog>
    );
  },
);
