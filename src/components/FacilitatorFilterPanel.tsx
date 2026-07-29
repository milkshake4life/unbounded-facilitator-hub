import { Check, X } from "lucide-react";
import type { Pathway } from "../types";
import { classNames, pathwayShortLabels } from "../lib/ui";
import {
  EVENT_FILTER_OPTIONS,
  PATHWAYS,
  type EventFilter,
  type FacilitatorFilters,
  countActiveFilters,
} from "../lib/facilitatorFilters";

interface FacilitatorFilterPanelProps {
  filters: FacilitatorFilters;
  programOptions: string[];
  onChange: (next: FacilitatorFilters) => void;
  onClose: () => void;
}

/**
 * Multi-section filter panel for the directory.
 * Search stays free-text; this panel is for structured facets only.
 */
export function FacilitatorFilterPanel({
  filters,
  programOptions,
  onChange,
  onClose,
}: FacilitatorFilterPanelProps) {
  const active = countActiveFilters(filters);

  function togglePathway(p: Pathway) {
    const has = filters.pathways.includes(p);
    onChange({
      ...filters,
      pathways: has
        ? filters.pathways.filter((x) => x !== p)
        : [...filters.pathways, p],
    });
  }

  function toggleEvent(e: EventFilter) {
    const has = filters.events.includes(e);
    onChange({
      ...filters,
      events: has
        ? filters.events.filter((x) => x !== e)
        : [...filters.events, e],
    });
  }

  function toggleProgram(p: string) {
    const has = filters.programs.includes(p);
    onChange({
      ...filters,
      programs: has
        ? filters.programs.filter((x) => x !== p)
        : [...filters.programs, p],
    });
  }

  function clearAll() {
    onChange({ pathways: [], events: [], programs: [] });
  }

  return (
    <div className="absolute right-0 top-11 z-30 flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Filters</p>
          <p className="text-xs text-slate-400">
            {active === 0
              ? "Narrow by pathway, events, or programs"
              : `${active} active`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close filters"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[min(28rem,60vh)] overflow-y-auto px-4 py-3">
        <Section title="Pathway">
          <div className="flex flex-wrap gap-1.5">
            {PATHWAYS.map((p) => (
              <Chip
                key={p}
                label={pathwayShortLabels[p]}
                selected={filters.pathways.includes(p)}
                onClick={() => togglePathway(p)}
              />
            ))}
          </div>
        </Section>

        <Section title="Past events">
          <div className="space-y-1">
            {EVENT_FILTER_OPTIONS.map((opt) => {
              const selected = filters.events.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleEvent(opt.id)}
                  className={classNames(
                    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                    selected ? "bg-brand-50" : "hover:bg-slate-50"
                  )}
                >
                  <span
                    className={classNames(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      selected
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-slate-300 bg-white"
                    )}
                  >
                    {selected && <Check className="h-3 w-3" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-800">
                      {opt.label}
                    </span>
                    <span className="block text-xs text-slate-400">
                      {opt.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Programs & curricula" last>
          {programOptions.length === 0 ? (
            <p className="text-xs text-slate-400">No programs in the directory yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {programOptions.map((p) => (
                <Chip
                  key={p}
                  label={p}
                  selected={filters.programs.includes(p)}
                  onClick={() => toggleProgram(p)}
                />
              ))}
            </div>
          )}
        </Section>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
        <button
          type="button"
          onClick={clearAll}
          disabled={active === 0}
          className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear all
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={classNames(!last && "mb-4 border-b border-slate-100 pb-4")}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      {children}
    </div>
  );
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "inline-flex max-w-full items-center gap-1 truncate rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
        selected
          ? "bg-brand-50 text-brand-700 ring-brand-600/30"
          : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
      )}
    >
      {selected && <Check className="h-3 w-3 shrink-0" />}
      <span className="truncate">{label}</span>
    </button>
  );
}
