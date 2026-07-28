import type { ComfortLevel, Pathway } from "../types";

/** Tailwind classes for the small pathway chip shown on cards / profiles. */
export const pathwayStyles: Record<Pathway, string> = {
  "English Language Arts": "bg-purple-50 text-purple-700 ring-purple-600/20",
  Mathematics: "bg-blue-50 text-blue-700 ring-blue-600/20",
  Leadership: "bg-rose-50 text-rose-700 ring-rose-600/20",
  "UnboundEd Planning Process":
    "bg-amber-50 text-amber-700 ring-amber-600/20",
};

/** Short labels for pathway chips where space is tight. */
export const pathwayShortLabels: Record<Pathway, string> = {
  "English Language Arts": "ELA",
  Mathematics: "Math",
  Leadership: "Leadership",
  "UnboundEd Planning Process": "Planning Process",
};

/** Visual treatment for the grade-band comfort levels. */
export const comfortStyles: Record<
  ComfortLevel,
  { dot: string; chip: string }
> = {
  nerd_out: {
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  fine: {
    dot: "bg-sky-500",
    chip: "bg-sky-50 text-sky-700 ring-sky-600/20",
  },
  avoid: {
    dot: "bg-slate-400",
    chip: "bg-slate-100 text-slate-500 ring-slate-500/20",
  },
};

export function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
