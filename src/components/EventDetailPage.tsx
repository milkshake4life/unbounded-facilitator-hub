import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  StickyNote,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import type {
  BookingEvent,
  EventPlacement,
  Facilitator,
} from "../types";
import { classNames } from "../lib/ui";
import {
  eventModeStyles,
  eventTypeStyles,
} from "../lib/eventStyles";
import { useHeadshotSrc } from "../lib/useHeadshot";
import { Avatar } from "./Avatar";

type StatusKey = keyof Pick<
  EventPlacement,
  | "facilitatorConfirmed"
  | "facilitatorDropped"
  | "calHoldSent"
  | "contractRequested"
>;

const STATUS_TOGGLES: {
  key: StatusKey;
  label: string;
  activeClass: string;
  danger?: boolean;
}[] = [
  {
    key: "facilitatorConfirmed",
    label: "Facilitator confirmed",
    activeClass: "bg-brand-600 text-white border-brand-600",
  },
  {
    key: "facilitatorDropped",
    label: "Dropped",
    activeClass: "bg-rose-600 text-white border-rose-600",
    danger: true,
  },
  {
    key: "calHoldSent",
    label: "Cal hold sent",
    activeClass: "bg-slate-800 text-white border-slate-800",
  },
  {
    key: "contractRequested",
    label: "Contract requested",
    activeClass: "bg-slate-800 text-white border-slate-800",
  },
];

interface EventDetailPageProps {
  event: BookingEvent;
  facilitators: Facilitator[];
  onUpdateEvent: (event: BookingEvent) => void;
  onAddPlacement: () => void;
}

export function EventDetailPage({
  event,
  facilitators,
  onUpdateEvent,
  onAddPlacement,
}: EventDetailPageProps) {
  const [dropPrompt, setDropPrompt] = useState<{
    placementId: string;
    facilitatorName: string;
    existingNotes: string;
  } | null>(null);

  const byId = useMemo(
    () => new Map(facilitators.map((f) => [f.id, f])),
    [facilitators]
  );

  const sorted = useMemo(() => {
    return [...event.placements].sort((a, b) => {
      const fa = byId.get(a.facilitatorId);
      const fb = byId.get(b.facilitatorId);
      const nameA = fa
        ? `${fa.lastName} ${fa.firstName}`
        : a.facilitatorId;
      const nameB = fb
        ? `${fb.lastName} ${fb.firstName}`
        : b.facilitatorId;
      const pathwayCmp = a.pathway.localeCompare(b.pathway);
      if (pathwayCmp !== 0) return pathwayCmp;
      const sectionCmp = a.section.localeCompare(b.section);
      if (sectionCmp !== 0) return sectionCmp;
      return nameA.localeCompare(nameB);
    });
  }, [event.placements, byId]);

  const confirmedCount = event.placements.filter(
    (p) => p.facilitatorConfirmed && !p.facilitatorDropped
  ).length;

  function patchPlacement(
    placementId: string,
    patch: Partial<EventPlacement>
  ) {
    onUpdateEvent({
      ...event,
      placements: event.placements.map((p) =>
        p.id === placementId ? { ...p, ...patch } : p
      ),
      updatedAt: Date.now(),
    });
  }

  function removePlacement(placementId: string) {
    if (!window.confirm("Remove this placement from the event?")) return;
    onUpdateEvent({
      ...event,
      placements: event.placements.filter((p) => p.id !== placementId),
      updatedAt: Date.now(),
    });
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={classNames(
                  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                  eventTypeStyles[event.eventType]
                )}
              >
                {event.eventType}
              </span>
              <span
                className={classNames(
                  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                  eventModeStyles[event.eventMode]
                )}
              >
                {event.eventMode}
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdateEvent({
                    ...event,
                    eventConfirmed: !event.eventConfirmed,
                    updatedAt: Date.now(),
                  })
                }
                className={classNames(
                  "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors",
                  event.eventConfirmed
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                {event.eventConfirmed && <Check className="h-3 w-3" />}
                Event confirmed
              </button>
            </div>
            {event.notes.trim() ? (
              <p className="mt-3 max-w-2xl text-sm text-slate-600">
                {event.notes}
              </p>
            ) : null}
          </div>
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">
              {event.placements.length}
            </span>{" "}
            {event.placements.length === 1 ? "placement" : "placements"}
            {event.placements.length > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-slate-700">
                  {confirmedCount}
                </span>{" "}
                facilitators confirmed
              </>
            )}
          </p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <CalendarDays className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-700">
            No facilitators placed yet
          </p>
          <p className="max-w-sm text-sm text-slate-400">
            Add facilitators from the directory and track confirmation, calendar
            holds, and contracts for each placement.
          </p>
          <button
            onClick={onAddPlacement}
            className="mt-4 flex items-center gap-2 rounded-lg border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
          >
            <UserPlus className="h-4 w-4" />
            Add facilitator
          </button>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {sorted.map((placement) => {
            const facilitator = byId.get(placement.facilitatorId) ?? null;
            const facilitatorName = facilitator
              ? `${facilitator.firstName} ${facilitator.lastName}`
              : "this facilitator";
            return (
              <PlacementRow
                key={placement.id}
                placement={placement}
                facilitator={facilitator}
                onToggle={(key) => {
                  if (key === "facilitatorDropped") {
                    if (placement.facilitatorDropped) {
                      patchPlacement(placement.id, {
                        facilitatorDropped: false,
                      });
                      return;
                    }
                    setDropPrompt({
                      placementId: placement.id,
                      facilitatorName,
                      existingNotes: placement.notes,
                    });
                    return;
                  }
                  patchPlacement(placement.id, { [key]: !placement[key] });
                }}
                onNotesChange={(notes) =>
                  patchPlacement(placement.id, { notes })
                }
                onRemove={() => removePlacement(placement.id)}
              />
            );
          })}
        </ul>
      )}

      {dropPrompt && (
        <DropReasonModal
          facilitatorName={dropPrompt.facilitatorName}
          initialNotes={dropPrompt.existingNotes}
          onClose={() => setDropPrompt(null)}
          onConfirm={(notes) => {
            patchPlacement(dropPrompt.placementId, {
              facilitatorDropped: true,
              notes,
            });
            setDropPrompt(null);
          }}
        />
      )}
    </div>
  );
}

function DropReasonModal({
  facilitatorName,
  initialNotes,
  onClose,
  onConfirm,
}: {
  facilitatorName: string;
  initialNotes: string;
  onClose: () => void;
  onConfirm: (notes: string) => void;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const trimmed = notes.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed) return;
    onConfirm(trimmed);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form
        role="dialog"
        aria-labelledby="drop-reason-title"
        onSubmit={handleSubmit}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2
              id="drop-reason-title"
              className="text-base font-bold text-slate-900"
            >
              Mark as dropped
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Add a note explaining why {facilitatorName} is being dropped.
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

        <div className="px-5 py-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Drop reason <span className="text-rose-500">*</span>
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              autoFocus
              required
              rows={4}
              placeholder="e.g. Low enrollment — section cancelled; facilitator withdrew for medical reasons…"
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>
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
            type="submit"
            disabled={!trimmed}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Drop facilitator
          </button>
        </div>
      </form>
    </div>
  );
}

function PlacementRow({
  placement,
  facilitator,
  onToggle,
  onNotesChange,
  onRemove,
}: {
  placement: EventPlacement;
  facilitator: Facilitator | null;
  onToggle: (key: StatusKey) => void;
  onNotesChange: (notes: string) => void;
  onRemove: () => void;
}) {
  const [notesOpen, setNotesOpen] = useState(Boolean(placement.notes));
  const [notesDraft, setNotesDraft] = useState(placement.notes);
  const src = useHeadshotSrc(
    facilitator?.id ?? "",
    facilitator?.hasStoredHeadshot,
    facilitator?.headshot ?? ""
  );
  const dropped = placement.facilitatorDropped;
  const name = facilitator
    ? `${facilitator.firstName} ${facilitator.lastName}`
    : "Unknown facilitator";

  useEffect(() => {
    setNotesDraft(placement.notes);
  }, [placement.notes]);

  useEffect(() => {
    if (dropped && placement.notes.trim()) setNotesOpen(true);
  }, [dropped, placement.notes]);

  return (
    <li
      className={classNames(
        "rounded-2xl border bg-white p-4 shadow-sm transition-colors",
        dropped
          ? "border-rose-200 bg-rose-50/40"
          : "border-slate-200"
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar
          src={src || undefined}
          alt={name}
          boxClassName="h-10 w-10 shrink-0 rounded-full bg-slate-100"
          iconClassName="h-4.5 w-4.5"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                className={classNames(
                  "truncate text-sm font-semibold",
                  dropped ? "text-slate-500 line-through" : "text-slate-900"
                )}
              >
                {name}
              </p>
              <p className="mt-0.5 text-sm text-slate-500">
                <span className="font-medium text-slate-700">
                  {placement.pathway || "—"}
                </span>
                <span className="text-slate-300"> · </span>
                {placement.section || "—"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setNotesOpen((v) => !v)}
                className={classNames(
                  "rounded-lg p-1.5 transition-colors",
                  notesDraft || notesOpen
                    ? "text-brand-600 hover:bg-brand-50"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                )}
                aria-label="Placement notes"
                title="Placement notes"
              >
                <StickyNote className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                aria-label="Remove placement"
                title="Remove placement"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {STATUS_TOGGLES.map((t) => {
              const on = placement[t.key];
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => onToggle(t.key)}
                  className={classNames(
                    "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                    on
                      ? t.activeClass
                      : t.danger
                        ? "border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {on && <Check className="h-3 w-3" />}
                  {t.label}
                </button>
              );
            })}
          </div>

          {notesOpen && (
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={() => {
                if (notesDraft !== placement.notes) onNotesChange(notesDraft);
              }}
              placeholder="Placement notes / drop reason…"
              rows={2}
              className="mt-3 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          )}
        </div>
      </div>
    </li>
  );
}
