// Generated from manifest.json by scripts/build-manifests.mjs. Do not edit.
export const calendarModes = ["single","range"] as const;
export type CalendarMode = (typeof calendarModes)[number];
export const calendarDirections = ["next","prev"] as const;
export type CalendarDirection = (typeof calendarDirections)[number];
export const calendarRanges = ["start","middle","end"] as const;
export type CalendarRange = (typeof calendarRanges)[number];
