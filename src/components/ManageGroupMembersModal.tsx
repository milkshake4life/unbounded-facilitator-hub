import { useMemo, useRef, useState } from "react";
import {
  Check,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { Facilitator, FacilitatorGroup, Pathway } from "../types";
import { PATHWAYS } from "../types";
import {
  classNames,
  pathwayShortLabels,
  pathwayStyles,
} from "../lib/ui";
import { displayName } from "../lib/facilitatorName";
import { useOutsideDismiss } from "../lib/useOutsideDismiss";
import { useHeadshotSrc } from "../lib/useHeadshot";
import { Avatar } from "./Avatar";

interface ManageGroupMembersModalProps {
  group: FacilitatorGroup;
  facilitators: Facilitator[];
  onClose: () => void;
  onSave: (group: FacilitatorGroup) => void;
}

/** Add or remove facilitators inside an existing group. */
export function ManageGroupMembersModal({
  group,
  facilitators,
  onClose,
  onSave,
}: ManageGroupMembersModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(group.facilitatorIds)
  );
  const [query, setQuery] = useState("");
  const [pathwayFilter, setPathwayFilter] = useState<Pathway | "all">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  useOutsideDismiss(filterOpen, () => setFilterOpen(false), filterMenuRef);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...facilitators];

    if (pathwayFilter !== "all") {
      list = list.filter((f) => f.pathways.includes(pathwayFilter));
    }

    if (q) {
      list = list.filter((f) => {
        const haystack = [
          f.firstName,
          f.lastName,
          f.preferredName ?? "",
          f.currentEmployer,
          f.jobTitle,
          ...f.pathways,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    return list.sort((a, b) =>
      displayName(a).localeCompare(displayName(b))
    );
  }, [facilitators, query, pathwayFilter]);

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...group,
      facilitatorIds: Array.from(selectedIds),
      updatedAt: Date.now(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form
        role="dialog"
        aria-labelledby="manage-members-title"
        onSubmit={handleSubmit}
        className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2
              id="manage-members-title"
              className="text-base font-bold text-slate-900"
            >
              Add facilitators
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Choose who belongs in “{group.name}”.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name…"
                autoFocus
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div ref={filterMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setFilterOpen((v) => !v)}
                className={classNames(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  pathwayFilter !== "all"
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filter
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-11 z-20 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Pathway
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPathwayFilter("all");
                      setFilterOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    All pathways
                    {pathwayFilter === "all" && (
                      <Check className="h-4 w-4 text-brand-600" />
                    )}
                  </button>
                  {PATHWAYS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPathwayFilter(p);
                        setFilterOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      {p}
                      {pathwayFilter === p && (
                        <Check className="h-4 w-4 text-brand-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              <span className="font-semibold text-slate-700">
                {filtered.length}
              </span>{" "}
              shown
              {pathwayFilter !== "all" && (
                <> · {pathwayShortLabels[pathwayFilter]}</>
              )}
            </span>
            <span>
              <span className="font-semibold text-brand-700">
                {selectedIds.size}
              </span>{" "}
              selected
            </span>
          </div>

          <div className="h-80 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/60 p-2">
            {filtered.length === 0 ? (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-400">
                No facilitators match your search or filter.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {filtered.map((f) => (
                  <MemberTile
                    key={f.id}
                    facilitator={f}
                    selected={selectedIds.has(f.id)}
                    onToggle={() => toggle(f.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

function MemberTile({
  facilitator,
  selected,
  onToggle,
}: {
  facilitator: Facilitator;
  selected: boolean;
  onToggle: () => void;
}) {
  const fullName = displayName(facilitator);
  const headshotSrc = useHeadshotSrc(
    facilitator.id,
    facilitator.hasStoredHeadshot,
    facilitator.headshot
  );
  const pathways = facilitator.pathways;
  const shownPathways = pathways.slice(0, 2);
  const extraPathways = pathways.length - shownPathways.length;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={classNames(
        "relative flex flex-col items-center rounded-xl border bg-white px-2 py-3 text-center transition-all",
        selected
          ? "border-brand-500 ring-2 ring-brand-100"
          : "border-slate-200 hover:border-brand-200 hover:shadow-sm"
      )}
    >
      <span
        className={classNames(
          "absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border",
          selected
            ? "border-brand-600 bg-brand-600 text-white"
            : "border-slate-200 bg-white text-transparent"
        )}
      >
        <Check className="h-3 w-3" />
      </span>
      <Avatar
        src={headshotSrc || undefined}
        alt={fullName}
        boxClassName="h-14 w-14 rounded-full ring-2 ring-slate-100"
        iconClassName="h-7 w-7"
      />
      <p className="mt-2 w-full truncate text-sm font-semibold text-slate-900">
        {fullName}
      </p>
      <p className="mt-0.5 w-full truncate text-xs text-slate-500">
        {facilitator.currentEmployer || facilitator.jobTitle || "—"}
      </p>
      {shownPathways.length > 0 && (
        <div className="mt-2 flex max-w-full flex-wrap justify-center gap-1">
          {shownPathways.map((p) => (
            <span
              key={p}
              className={classNames(
                "inline-flex truncate rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                pathwayStyles[p]
              )}
            >
              {pathwayShortLabels[p]}
            </span>
          ))}
          {extraPathways > 0 && (
            <span className="inline-flex rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
              +{extraPathways}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
