import { useEffect, useRef, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  CalendarDays,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type { BookingEvent, Facilitator } from "../types";
import { classNames } from "../lib/ui";
import {
  eventModeStyles,
  eventTypeShortLabels,
  eventTypeStyles,
} from "../lib/eventStyles";
import { useHeadshotSrc } from "../lib/useHeadshot";
import { Avatar } from "./Avatar";

function placementPreview(
  event: BookingEvent,
  facilitators: Facilitator[]
): Facilitator[] {
  const byId = new Map(facilitators.map((f) => [f.id, f]));
  const seen = new Set<string>();
  const out: Facilitator[] = [];
  for (const p of event.placements) {
    if (seen.has(p.facilitatorId)) continue;
    const f = byId.get(p.facilitatorId);
    if (!f) continue;
    seen.add(p.facilitatorId);
    out.push(f);
    if (out.length >= 3) break;
  }
  return out;
}

function staffingSummary(event: BookingEvent): string {
  const total = event.placements.length;
  if (total === 0) return "No facilitators yet";
  const confirmed = event.placements.filter(
    (p) => p.facilitatorConfirmed && !p.facilitatorDropped
  ).length;
  const dropped = event.placements.filter((p) => p.facilitatorDropped).length;
  const parts = [
    `${total} ${total === 1 ? "placement" : "placements"}`,
    `${confirmed} confirmed`,
  ];
  if (dropped > 0) parts.push(`${dropped} dropped`);
  return parts.join(" · ");
}

interface EventCardProps {
  event: BookingEvent;
  facilitators: Facilitator[];
  onOpen: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function EventCard({
  event,
  facilitators,
  onOpen,
  onEdit,
  onArchive,
  onDelete,
}: EventCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isArchived = event.status === "archived";
  const preview = placementPreview(event, facilitators);
  const count = event.placements.length;
  const extra = Math.max(0, count - preview.length);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  return (
    <div
      onClick={onOpen}
      className="group relative flex cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
    >
      <div ref={menuRef} className="absolute right-3 top-3 z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Event actions"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <MenuButton
              icon={<Pencil className="h-4 w-4" />}
              label="Edit"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onEdit();
              }}
            />
            <MenuButton
              icon={
                isArchived ? (
                  <ArchiveRestore className="h-4 w-4" />
                ) : (
                  <Archive className="h-4 w-4" />
                )
              }
              label={isArchived ? "Restore" : "Archive"}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onArchive();
              }}
            />
            <MenuButton
              icon={<Trash2 className="h-4 w-4" />}
              label="Delete"
              danger
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onDelete();
              }}
            />
          </div>
        )}
      </div>

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <CalendarDays className="h-5 w-5" />
      </div>
      <h3 className="mt-3 pr-8 text-base font-semibold text-slate-900">
        {event.accountSchool}
      </h3>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <span
          className={classNames(
            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
            eventTypeStyles[event.eventType]
          )}
        >
          {eventTypeShortLabels[event.eventType]}
        </span>
        <span
          className={classNames(
            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
            eventModeStyles[event.eventMode]
          )}
        >
          {event.eventMode}
        </span>
        {event.eventConfirmed && (
          <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-600/20">
            Confirmed
          </span>
        )}
      </div>

      <div className="mt-4 flex min-h-8 items-center gap-2.5">
        {preview.length > 0 ? (
          <>
            <div className="flex shrink-0 -space-x-2">
              {preview.map((f) => (
                <MemberAvatar key={f.id} facilitator={f} />
              ))}
              {extra > 0 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-semibold text-slate-500">
                  +{extra}
                </div>
              )}
            </div>
            <p className="min-w-0 truncate text-sm text-slate-500">
              {staffingSummary(event)}
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-400">No facilitators yet</p>
        )}
        {isArchived && (
          <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            Archived
          </span>
        )}
      </div>
    </div>
  );
}

function MemberAvatar({ facilitator }: { facilitator: Facilitator }) {
  const src = useHeadshotSrc(
    facilitator.id,
    facilitator.hasStoredHeadshot,
    facilitator.headshot
  );
  return (
    <Avatar
      src={src || undefined}
      alt={`${facilitator.firstName} ${facilitator.lastName}`}
      boxClassName="h-8 w-8 rounded-full border-2 border-white bg-slate-100"
      iconClassName="h-3.5 w-3.5"
    />
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  danger?: boolean;
}) {
  return (
    <button
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
