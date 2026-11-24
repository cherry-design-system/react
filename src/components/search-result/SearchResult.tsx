"use client";
import {
  forwardRef,
  useEffect,
  useId,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { ArrowUpRight } from "lucide-react";
import { cx } from "../../utils/cx";
import { useSearchContext } from "../search-dialog/search-context";

export interface SearchResultProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onSelect"
> {
  /** Icon before the label. */
  icon?: ReactNode;
  /** Second line under the label. */
  description?: ReactNode;
  /** Runs on click, or on Enter while it is the highlighted result. */
  onSelect?: () => void;
  /** Runs when it becomes the highlighted result (keyboard or pointer). */
  onHighlight?: () => void;
  /** Shown but never highlighted or selected. */
  disabled?: boolean;
}

/**
 * One result in a <SearchDialog> (role="option"). The dialog's input keeps
 * focus; arrow keys move the highlight here through aria-activedescendant,
 * and the pointer moves it on hover.
 */
export const SearchResult = forwardRef<HTMLDivElement, SearchResultProps>(
  function SearchResult(
    {
      icon,
      description,
      onSelect,
      onHighlight,
      disabled,
      className,
      children,
      id: idProp,
      onClick,
      onPointerMove,
      ...rest
    },
    ref,
  ) {
    const autoId = useId();
    const id = idProp ?? `cherry-search-result-${autoId}`;
    const search = useSearchContext();
    const active = !disabled && search?.activeId === id;
    useEffect(() => {
      if (active) onHighlight?.();
      // Only on becoming active; a new callback identity is not a change.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);
    return (
      <div
        ref={ref}
        id={id}
        role="option"
        aria-selected={active}
        aria-disabled={disabled || undefined}
        className={cx("cherry-search-result", className)}
        data-active={active || undefined}
        onClick={(event) => {
          onClick?.(event);
          if (!disabled && !event.defaultPrevented) onSelect?.();
        }}
        onPointerMove={(event) => {
          onPointerMove?.(event);
          if (!disabled && !active) search?.setActiveId(id);
        }}
        // Keep focus in the search input when a result is pressed.
        onMouseDown={(event) => event.preventDefault()}
        {...rest}
      >
        {icon ? (
          <span className="cherry-search-result__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className="cherry-search-result__text">
          <span className="cherry-search-result__label">{children}</span>
          {description ? (
            <span className="cherry-search-result__description">
              {description}
            </span>
          ) : null}
        </span>
        <ArrowUpRight
          className="cherry-search-result__arrow"
          aria-hidden="true"
        />
      </div>
    );
  },
);
