import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import type { EventPlacement, Facilitator } from "../types";
import {
  PLACEMENT_PATHWAY_OPTIONS,
  PLACEMENT_SECTION_OPTIONS,
} from "../types";
import { classNames } from "../lib/ui";
import { useHeadshotSrc } from "../lib/useHeadshot";
import { Avatar } from "./Avatar";

interface AddPlacementModalProps {
  eventName: string;
  facilitators: Facilitator[];
  /** Facilitator ids already placed (still allow duplicates across sections). */
  existingFacilitatorIds: string[];
  onClose: () => void;
  onAdd: (placement: EventPlacement) => void;
}

/**
 * Pick a facilitator from the directory and set pathway / section for a
 * new placement inside an event.
 */
export function AddPlacementModal({
  eventName,
  facilitators,
  existingFacilitatorIds,
  onClose,
  onAdd,
}: AddPlacementModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pathway, setPathway] = useState("");
  const [customPathway, setCustomPathway] = useState("");
  const [section, setSection] = useState("");
  const [customSection, setCustomSection] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"pick" | "details">("pick");

  const alreadyPlaced = useMemo(
    () => new Set(existingFacilitatorIds),
    [existingFacilitatorIds]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = facilitators.filter((f) => f.status === "active");
    if (q) {
      list = list.filter((f) => {
        const haystack = [
          f.firstName,
          f.lastName,
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
      `${a.firstName} ${a.lastName}`.localeCompare(
        `${b.firstName} ${b.lastName}`
      )
    );
  }, [facilitators, query]);

  const selected = facilitators.find((f) => f.id === selectedId) ?? null;
  const resolvedPathway =
    pathway === "__custom__" ? customPathway.trim() : pathway.trim();
  const resolvedSection =
    section === "__custom__" ? customSection.trim() : section.trim();

  function handleContinue() {
    if (!selectedId) return;
    setStep("details");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !resolvedPathway || !resolvedSection) return;
    onAdd({
      id: crypto.randomUUID(),
      facilitatorId: selectedId,
      pathway: resolvedPathway,
      section: resolvedSection,
      facilitatorConfirmed: false,
      facilitatorDropped: false,
      calHoldSent: false,
      contractRequested: false,
      notes: notes.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form
        role="dialog"
        aria-labelledby="add-placement-title"
        onSubmit={step === "details" ? handleSubmit : (e) => e.preventDefault()}
        className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2
              id="add-placement-title"
              className="text-base font-bold text-slate-900"
            >
              {step === "pick" ? "Add facilitator" : "Placement details"}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {step === "pick"
                ? `Choose who to place at “${eventName}”.`
                : selected
                  ? `${selected.firstName} ${selected.lastName} — pathway & section`
                  : "Set pathway and section"}
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

        {step === "pick" ? (
          <>
            <div className="border-b border-slate-100 px-5 py-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search facilitators…"
                  autoFocus
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto px-2 py-2">
              {filtered.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-slate-400">
                  No facilitators match your search.
                </p>
              ) : (
                filtered.map((f) => {
                  const isSelected = selectedId === f.id;
                  const placed = alreadyPlaced.has(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedId(f.id)}
                      className={classNames(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                        isSelected
                          ? "bg-brand-50"
                          : "hover:bg-slate-50"
                      )}
                    >
                      <FacilitatorAvatar facilitator={f} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {f.firstName} {f.lastName}
                          {placed && (
                            <span className="ml-2 text-xs font-normal text-slate-400">
                              already placed
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {f.currentEmployer || f.jobTitle || "—"}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 shrink-0 text-brand-600" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedId}
                onClick={handleContinue}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-4 px-5 py-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Pathway
                </span>
                <select
                  value={pathway}
                  onChange={(e) => setPathway(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">Select pathway…</option>
                  {PLACEMENT_PATHWAY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                  <option value="__custom__">Other (custom)…</option>
                </select>
                {pathway === "__custom__" && (
                  <input
                    value={customPathway}
                    onChange={(e) => setCustomPathway(e.target.value)}
                    placeholder="Enter pathway"
                    required
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                )}
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Section
                </span>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">Select section…</option>
                  {PLACEMENT_SECTION_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="__custom__">Other (custom)…</option>
                </select>
                {section === "__custom__" && (
                  <input
                    value={customSection}
                    onChange={(e) => setCustomSection(e.target.value)}
                    placeholder="Enter section"
                    required
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                )}
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Placement notes{" "}
                  <span className="font-normal normal-case text-slate-400">
                    (optional)
                  </span>
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Notes for this placement…"
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </label>
            </div>
            <div className="flex justify-between gap-2 border-t border-slate-200 px-5 py-3">
              <button
                type="button"
                onClick={() => setStep("pick")}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                Back
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!resolvedPathway || !resolvedSection}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add placement
                </button>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

function FacilitatorAvatar({ facilitator }: { facilitator: Facilitator }) {
  const src = useHeadshotSrc(
    facilitator.id,
    facilitator.hasStoredHeadshot,
    facilitator.headshot
  );
  return (
    <Avatar
      src={src || undefined}
      alt={`${facilitator.firstName} ${facilitator.lastName}`}
      boxClassName="h-9 w-9 shrink-0 rounded-full bg-slate-100"
      iconClassName="h-4 w-4"
    />
  );
}
