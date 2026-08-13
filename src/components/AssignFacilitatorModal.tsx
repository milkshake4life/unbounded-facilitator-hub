import { useMemo, useState } from "react";
import { Check, Search, Sparkles, TriangleAlert } from "lucide-react";
import type { Facilitator } from "../types";
import { classNames } from "../lib/ui";
import { displayName } from "../lib/facilitatorName";
import { matchFacilitator } from "../lib/eventModel";
import { useHeadshotSrc } from "../lib/useHeadshot";
import { Avatar } from "./Avatar";
import { ModalCancelButton, ModalShell, ModalSubmitButton } from "./ModalShell";

interface AssignFacilitatorModalProps {
  pathwayName: string;
  sectionName: string;
  openSeats: number;
  facilitators: Facilitator[];
  /** Facilitator id → the other sections they already cover at this event. */
  placedElsewhere: Map<string, string[]>;
  /** Facilitator ids already in this exact section. */
  alreadyInSection: Set<string>;
  onClose: () => void;
  onAssign: (facilitatorIds: string[]) => void;
}

interface Candidate {
  facilitator: Facilitator;
  score: number;
  reasons: string[];
  avoids: boolean;
}

/**
 * Fill seats in one section. Facilitators whose directory pathway and grade
 * band match the section's pathway are surfaced first, so staffing starts from
 * who is actually qualified rather than an alphabetical list.
 */
export function AssignFacilitatorModal({
  pathwayName,
  sectionName,
  openSeats,
  facilitators,
  placedElsewhere,
  alreadyInSection,
  onClose,
  onAssign,
}: AssignFacilitatorModalProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [suggestedOnly, setSuggestedOnly] = useState(true);

  const ranked = useMemo<Candidate[]>(() => {
    return facilitators
      .filter((f) => f.status === "active" && !alreadyInSection.has(f.id))
      .map((f) => ({ facilitator: f, ...matchFacilitator(f, pathwayName) }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return displayName(a.facilitator).localeCompare(displayName(b.facilitator));
      });
  }, [facilitators, alreadyInSection, pathwayName]);

  const suggestedCount = ranked.filter((c) => c.score > 0).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = ranked;
    if (suggestedOnly && suggestedCount > 0 && !q) {
      list = list.filter((c) => c.score > 0);
    }
    if (q) {
      list = list.filter((c) => {
        const f = c.facilitator;
        return [
          f.firstName,
          f.lastName,
          f.preferredName ?? "",
          f.currentEmployer,
          f.jobTitle,
          ...f.pathways,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      });
    }
    return list;
  }, [ranked, query, suggestedOnly, suggestedCount]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0) return;
    onAssign(selected);
  }

  const overfilled = openSeats > 0 && selected.length > openSeats;

  return (
    <ModalShell
      labelledById="assign-facilitator-title"
      title={`Assign to ${sectionName}`}
      description={`${pathwayName} · ${
        openSeats > 0
          ? `${openSeats} ${openSeats === 1 ? "seat" : "seats"} open`
          : "all seats filled"
      }`}
      widthClass="max-w-2xl"
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          {overfilled && (
            <p className="mr-auto flex items-center gap-1.5 text-xs font-medium text-amber-700">
              <TriangleAlert className="h-3.5 w-3.5" />
              That's {selected.length - openSeats} more than this section needs.
            </p>
          )}
          <ModalCancelButton onClick={onClose} />
          <ModalSubmitButton
            label={
              selected.length > 1
                ? `Assign ${selected.length} facilitators`
                : "Assign facilitator"
            }
            disabled={selected.length === 0}
          />
        </>
      }
    >
      <div className="border-b border-slate-100 px-5 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all facilitators…"
            autoFocus
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        {suggestedCount > 0 && !query.trim() && (
          <button
            type="button"
            onClick={() => setSuggestedOnly((v) => !v)}
            className={classNames(
              "mt-2.5 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors",
              suggestedOnly
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {suggestedCount} matched to {pathwayName}
          </button>
        )}
      </div>

      <div className="px-2 py-2">
        {visible.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-slate-400">
            No facilitators match your search.
          </p>
        ) : (
          visible.map((candidate) => (
            <CandidateRow
              key={candidate.facilitator.id}
              candidate={candidate}
              selected={selected.includes(candidate.facilitator.id)}
              otherSections={placedElsewhere.get(candidate.facilitator.id) ?? []}
              onToggle={() => toggle(candidate.facilitator.id)}
            />
          ))
        )}
      </div>
    </ModalShell>
  );
}

function CandidateRow({
  candidate,
  selected,
  otherSections,
  onToggle,
}: {
  candidate: Candidate;
  selected: boolean;
  otherSections: string[];
  onToggle: () => void;
}) {
  const { facilitator, reasons, avoids } = candidate;
  const src = useHeadshotSrc(
    facilitator.id,
    facilitator.hasStoredHeadshot,
    facilitator.headshot
  );

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={classNames(
        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
        selected ? "bg-brand-50" : "hover:bg-slate-50"
      )}
    >
      <Avatar
        src={src || undefined}
        alt={displayName(facilitator)}
        boxClassName="h-9 w-9 shrink-0 rounded-full bg-slate-100"
        iconClassName="h-4 w-4"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">
          {displayName(facilitator)}
        </p>
        <p className="truncate text-xs text-slate-500">
          {facilitator.currentEmployer || facilitator.jobTitle || "—"}
        </p>
        {(reasons.length > 0 || avoids || otherSections.length > 0) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {reasons.map((reason) => (
              <span
                key={reason}
                className="inline-flex items-center rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-700 ring-1 ring-inset ring-brand-600/20"
              >
                {reason}
              </span>
            ))}
            {avoids && (
              <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[11px] font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20">
                <TriangleAlert className="h-3 w-3" />
                Prefers not to facilitate this band
              </span>
            )}
            {otherSections.length > 0 && (
              <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                Already on {otherSections.join(", ")}
              </span>
            )}
          </div>
        )}
      </div>
      <span
        className={classNames(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
          selected
            ? "border-brand-600 bg-brand-600 text-white"
            : "border-slate-300 bg-white"
        )}
      >
        {selected && <Check className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
