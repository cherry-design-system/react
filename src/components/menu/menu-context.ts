"use client";
import { createContext, useContext } from "react";

export interface MenuContextValue {
  /** Hides the menu; focus goes back to the trigger. */
  close: () => void;
}

export const MenuContext = createContext<MenuContextValue | null>(null);

export function useMenu(): MenuContextValue | null {
  return useContext(MenuContext);
}
