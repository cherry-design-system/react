"use client";
import { useSyncExternalStore } from "react";
import {
  getColorModeState,
  getServerColorModeState,
  setColorModePreference,
  subscribeColorMode,
  toggleColorMode,
  type ColorModeState,
} from "./color-mode";

export interface UseColorMode extends ColorModeState {
  setPreference: typeof setColorModePreference;
  toggle: typeof toggleColorMode;
}

/**
 * The current mode and preference, re-rendering on a switch (including OS
 * changes while the preference is "system"). During SSR and hydration it
 * reports light / system; the init script has already set the real mode on
 * <html>, so nothing visual depends on this value at first paint.
 */
export function useColorMode(): UseColorMode {
  const state = useSyncExternalStore(subscribeColorMode, getColorModeState, getServerColorModeState);
  return { ...state, setPreference: setColorModePreference, toggle: toggleColorMode };
}
