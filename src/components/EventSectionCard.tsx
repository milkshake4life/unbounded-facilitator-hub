import { useEffect, useRef, useState } from "react";
import {
  ArrowRightLeft,
  CalendarDays,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  StickyNote,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import type {
  BookingEvent,
  EventPlacement,
  EventSection,
  Facilitator,
  PlacementStage,
} from "../types";
import { PLACEMENT_STAGES, PLACEMENT_STAGE_META } from "../types";
import { classNames } from "../lib/ui";
import { placementStageStyles } from "../lib/eventStyles";
import {
  placementsForSection,
  sectionStaffing,
  stageRank,
} from "../lib/eventModel";
import { useOutsideDismiss } from "../lib/useOutsideDismiss";
import { useHeadshotSrc } from "../lib/useHeadshot";
import { Avatar } from "./Avatar";

interface MoveTarget {
  id: string;
  label: string;
}

export interface PlacementActions {
  setStage: (placement: EventPlacement, stage: PlacementStage) => void;
  requestDrop: (placement: EventPlacement) => void;
  restore: (placement: EventPlacement) => void;
  remove: (placement: EventPlacement) => void;
  setNotes: (placement: EventPlacement, notes: string) => void;
  move: (placement: EventPlacement, toSectionId: string) => void;
}

interface EventSectionCardProps {
  event: BookingEvent;
  section: EventSection;
  facilitatorsById: Map<string, Facilitator>;
  actions: PlacementActions;
  onEdit: () => void;
  onDelete: () => void;
  onAssign: () => void;
  draggingId: string | null;
  onDragStateChange: (placementId: string | null) => void;
}

function formatSectionDate(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function EventSectionCard({
  event,
  section,
  facilitatorsById,
  actions,
  onEdit,
  onDelete,
  onAssign,
  draggingId,
  onDragStateChange,
}: EventSectionCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useOutsideDismiss(menuOpen, () => setMenuOpen(false), menuRef);

  const placements = placementsForSection(event, section.id);
  const live = placements.filter((p) => !p.dropped);
  const dropped = placements.filter((p) => p.dropped);
  const staffing = sectionStaffing(event, section);
  const dateLabel = formatSectionDate(section.date);

  const draggingPlacement = draggingId
    ? event.placements.find((p) => p.id === draggingId) ?? null
    : null;
  const canAcceptDrop =
    Boolean(draggingPlacement) && draggingPlacement?.sectionId !== section.id;

  const moveTargets: MoveTarget[] = event.sections
    .filter((s) => s.id !== section.id)
    .map((s) => ({
      id: s.id,
      label: `${
        event.pathways.find((p) => p.id === s.pathwayId)?.name ?? "Pathway"
      } · ${s.name}`,
    }));

  const fillRatio =
    section.seatsNeeded > 0
      ? Math.min(1, staffing.assigned / section.seatsNeeded)
      : 0;

  return (
    <div
      onDragOver={(e) => {
        if (!canAcceptDrop) return;
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={(e) => {
        // Ignore the leave events fired while moving between child elements.
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setIsOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        if (draggingPlacement && canAcceptDrop) {
          actions.move(draggingPlacement, section.id);
        }
        onDragStateChange(null);
      }}
      className={classNames(
        "flex flex-col rounded-2xl border bg-white shadow-sm transition-colors",
        isOver && canAcceptDrop
          ? "border-brand-500 ring-2 ring-brand-100"
          : "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-slate-900">
            {section.name}
          </h4>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
            {dateLabel && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {dateLabel}
              </span>
            )}
            {dateLabel && <span className="text-slate-300">·</span>}
            <span>
              {section.seatsNeeded > 0 ? (
                <>
                  <span
                    className={classNames(
                      "font-semibold",
                      staffing.openSeats === 0
                        ? "text-emerald-700"
                        : "text-amber-700"
                    )}
                  >
                    {staffing.assigned} of {section.seatsNeeded}
                  </span>{" "}
                  seats filled
                </>
              ) : (
                <>
                  <span className="font-semibold text-slate-700">
                    {staffing.assigned}
                  </span>{" "}
                  assigned · no seat target
                </>
              )}
            </span>
          </p>
        </div>
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={`${section.name} actions`}
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <MenuItem
                icon={<Pencil className="h-4 w-4" />}
                label="Edit section"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
              />
              <MenuItem
                icon={<Trash2 className="h-4 w-4" />}
                label="Delete section"
                danger
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
              />
            </div>
          )}
        </div>
      </div>

      {section.seatsNeeded > 0 && (
        <div className="h-1 w-full bg-slate-100">
          <div
            className={classNames(
              "h-full transition-all",
              staffing.openSeats === 0 ? "bg-emerald-500" : "bg-amber-400"
            )}
            style={{ width: `${fillRatio * 100}%` }}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 p-3">
        {live.map((placement) => (
          <PlacementRow
            key={placement.id}
            placement={placement}
            facilitator={facilitatorsById.get(placement.facilitatorId) ?? null}
            actions={actions}
            moveTargets={moveTargets}
            isDragging={draggingId === placement.id}
            onDragStateChange={onDragStateChange}
          />
        ))}

        <button
          type="button"
          onClick={onAssign}
          className={classNames(
            "flex items-center justify-center gap-1.5 rounded-xl border border-dashed px-3 py-2.5 text-xs font-semibold transition-colors",
            staffing.openSeats > 0
              ? "border-brand-300 text-brand-700 hover:border-brand-500 hover:bg-brand-50"
              : "border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50"
          )}
        >
          <UserPlus className="h-3.5 w-3.5" />
          {staffing.openSeats > 0
            ? `Fill ${staffing.openSeats} open ${staffing.openSeats === 1 ? "seat" : "seats"}`
            : "Add another facilitator"}
        </button>

        {dropped.length > 0 && (
          <div className="mt-1 border-t border-dashed border-slate-200 pt-2">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Dropped
            </p>
            <div className="flex flex-col gap-2">
              {dropped.map((placement) => (
                <PlacementRow
                  key={placement.id}
                  placement={placement}
                  facilitator={
                    facilitatorsById.get(placement.facilitatorId) ?? null
                  }
                  actions={actions}
                  moveTargets={moveTargets}
                  isDragging={false}
                  onDragStateChange={onDragStateChange}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlacementRow({
  placement,
  facilitator,
  actions,
  moveTargets,
  isDragging,
  onDragStateChange,
}: {
  placement: EventPlacement;
  facilitator: Facilitator | null;
  actions: PlacementActions;
  moveTargets: MoveTarget[];
  isDragging: boolean;
  onDragStateChange: (placementId: string | null) => void;
}) {
  const [stageOpen, setStageOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState(placement.notes);
  const stageRef = useRef<HTMLDivElement>(null);
  useOutsideDismiss(stageOpen, () => setStageOpen(false), stageRef);

  const src = useHeadshotSrc(
    facilitator?.id ?? "",
    facilitator?.hasStoredHeadshot,
    facilitator?.headshot ?? ""
  );
  const name = facilitator
    ? `${facilitator.firstName} ${facilitator.lastName}`
    : "Unknown facilitator";
  const dropped = placement.dropped;

  useEffect(() => {
    setNotesDraft(placement.notes);
  }, [placement.notes]);

  return (
    <div
      draggable={!dropped}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", placement.id);
        onDragStateChange(placement.id);
      }}
      onDragEnd={() => onDragStateChange(null)}
      className={classNames(
        "rounded-xl border px-2.5 py-2 transition-all",
        dropped
          ? "border-rose-200 bg-rose-50/50"
          : "border-slate-200 bg-white hover:border-slate-300",
        !dropped && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      <div className="flex items-center gap-2">
        <Avatar
          src={src || undefined}
          alt={name}
          boxClassName="h-8 w-8 shrink-0 rounded-full bg-slate-100"
          iconClassName="h-3.5 w-3.5"
        />
        <div className="min-w-0 flex-1">
          <p
            className={classNames(
              "truncate text-sm font-medium",
              dropped ? "text-slate-500 line-through" : "text-slate-800"
            )}
          >
            {name}
          </p>
          {dropped ? (
            <p className="truncate text-[11px] text-rose-600">
              {placement.dropReason || "Dropped"}
            </p>
          ) : (
            <div ref={stageRef} className="relative mt-0.5">
              <button
                type="button"
                onClick={() => setStageOpen((v) => !v)}
                className={classNames(
                  "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset transition-opacity hover:opacity-80",
                  placementStageStyles[placement.stage]
                )}
              >
                {PLACEMENT_STAGE_META[placement.stage].short}
                <ChevronDown className="h-3 w-3" />
              </button>
              {stageOpen && (
                <div className="absolute left-0 top-7 z-30 max-h-96 w-64 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  {PLACEMENT_STAGES.map((stage) => {
                    const meta = PLACEMENT_STAGE_META[stage];
                    const current = stage === placement.stage;
                    return (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => {
                          setStageOpen(false);
                          if (!current) actions.setStage(placement, stage);
                        }}
                        className={classNames(
                          "flex w-full flex-col items-start px-3 py-1.5 text-left transition-colors hover:bg-slate-50",
                          current && "bg-brand-50"
                        )}
                      >
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                          <span
                            className={classNames(
                              "h-1.5 w-1.5 rounded-full",
                              stageRank(stage) <= stageRank(placement.stage)
                                ? "bg-brand-600"
                                : "bg-slate-300"
                            )}
                          />
                          {meta.label}
                        </span>
                        <span className="mt-0.5 text-[11px] leading-snug text-slate-500">
                          {meta.description}
                        </span>
                      </button>
                    );
                  })}
                  {moveTargets.length > 0 && (
                    <div className="mt-1 border-t border-slate-100 pt-1">
                      <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Move to
                      </p>
                      {moveTargets.map((target) => (
                        <button
                          key={target.id}
                          type="button"
                          onClick={() => {
                            setStageOpen(false);
                            actions.move(placement, target.id);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-slate-600 transition-colors hover:bg-slate-50"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{target.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-1 border-t border-slate-100 pt-1">
                    <MenuItem
                      icon={<UserMinus className="h-4 w-4" />}
                      label="Mark as dropped"
                      danger
                      onClick={() => {
                        setStageOpen(false);
                        actions.requestDrop(placement);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center">
          {dropped ? (
            <button
              type="button"
              onClick={() => actions.restore(placement)}
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
              aria-label={`Restore ${name}`}
              title="Undo drop"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setNotesOpen((v) => !v)}
              className={classNames(
                "rounded-md p-1 transition-colors",
                placement.notes || notesOpen
                  ? "text-brand-600 hover:bg-brand-50"
                  : "text-slate-300 hover:bg-slate-100 hover:text-slate-500"
              )}
              aria-label={`Notes for ${name}`}
              title="Placement notes"
            >
              <StickyNote className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => actions.remove(placement)}
            className="rounded-md p-1 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
            aria-label={`Remove ${name}`}
            title="Remove from section"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {notesOpen && !dropped && (
        <textarea
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={() => {
            if (notesDraft !== placement.notes) {
              actions.setNotes(placement, notesDraft);
            }
          }}
          rows={2}
          placeholder="Placement notes…"
          className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors",
        danger
          ? "text-rose-600 hover:bg-rose-50"
          : "text-slate-600 hover:bg-slate-50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
