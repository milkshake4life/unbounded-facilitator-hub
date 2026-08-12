import type {
  EventMode,
  EventStage,
  EventType,
  PlacementStage,
} from "../types";

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

/** Pipeline stage chips — warmth increases as the booking firms up. */
export const eventStageStyles: Record<EventStage, string> = {
  prospective: "bg-slate-100 text-slate-600 ring-slate-500/20",
  likely: "bg-amber-50 text-amber-800 ring-amber-600/20",
  contracted: "bg-brand-50 text-brand-700 ring-brand-600/20",
  delivered: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
};

/** Per-facilitator status chips, matching the hold → confirm → contract flow. */
export const placementStageStyles: Record<PlacementStage, string> = {
  proposed: "bg-slate-100 text-slate-600 ring-slate-500/20",
  availability: "bg-sky-50 text-sky-700 ring-sky-600/20",
  hold: "bg-amber-50 text-amber-800 ring-amber-600/20",
  confirmed: "bg-brand-50 text-brand-700 ring-brand-600/20",
  contracted: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
};
