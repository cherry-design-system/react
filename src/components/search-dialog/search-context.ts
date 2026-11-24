"use client";
import { createContext, useContext } from "react";

export interface SearchContextValue {
  /** id of the highlighted result (aria-activedescendant). */
  activeId: string | null;
  setActiveId: (id: string) => void;
}

export const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearchContext(): SearchContextValue | null {
  return useContext(SearchContext);
}
