import type { EventMode, EventType } from "../types";

/** Chip styles for event type (mirrors booking-sheet colors). */
export const eventTypeStyles: Record<EventType, string> = {
  "Executive Coaching": "bg-rose-50 text-rose-800 ring-rose-600/20",
  "GLEAM Learning Walk": "bg-orange-50 text-orange-800 ring-orange-600/20",
  "In Service Workshop": "bg-amber-50 text-amber-800 ring-amber-600/20",
  "Standards Institute": "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  Summit: "bg-sky-50 text-sky-800 ring-sky-600/20",
  Custom: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

export const eventModeStyles: Record<EventMode, string> = {
  "In-Person": "bg-green-50 text-green-800 ring-green-600/20",
  Virtual: "bg-violet-50 text-violet-800 ring-violet-600/20",
};

/** Short label when space is tight. */
export const eventTypeShortLabels: Record<EventType, string> = {
  "Executive Coaching": "Exec Coaching",
  "GLEAM Learning Walk": "GLEAM Walk",
  "In Service Workshop": "In Service",
  "Standards Institute": "SI",
  Summit: "Summit",
  Custom: "Custom",
};
