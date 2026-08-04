import { useMemo, useRef, useState } from "react";
import {
  ArrowUpDown,
  CalendarDays,
  Check,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { BookingEvent, Facilitator } from "../types";
import { classNames } from "../lib/ui";
import { useOutsideDismiss } from "../lib/useOutsideDismiss";
import { EventCard } from "./EventCard";

type EventSortKey = "name" | "name_desc" | "recent";
type EventStatusFilter = "active" | "archived" | "all";

const sortLabels: Record<EventSortKey, string> = {
  name: "School (A–Z)",
  name_desc: "School (Z–A)",
  recent: "Recently created",
};

const filterLabels: Record<EventStatusFilter, string> = {
  active: "Active",
  archived: "Archived",
  all: "All events",
};

interface EventsPageProps {
  events: BookingEvent[];
  facilitators: Facilitator[];
  onOpenEvent: (eventId: string) => void;
  onCreateEvent: () => void;
  onEditEvent: (event: BookingEvent) => void;
  onArchiveEvent: (event: BookingEvent) => void;
  onDeleteEvent: (event: BookingEvent) => void;
}

export function EventsPage({
  events,
  facilitators,
  onOpenEvent,
  onCreateEvent,
  onEditEvent,
  onArchiveEvent,
  onDeleteEvent,
}: EventsPageProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<EventSortKey>("name");
  const [statusFilter, setStatusFilter] = useState<EventStatusFilter>("active");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  useOutsideDismiss(sortOpen, () => setSortOpen(false), sortMenuRef);
  useOutsideDismiss(filterOpen, () => setFilterOpen(false), filterMenuRef);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = events.filter((ev) => {
      if (statusFilter === "active") return ev.status !== "archived";
      if (statusFilter === "archived") return ev.status === "archived";
      return true;
    });

    if (q) {
      list = list.filter((ev) => {
        const haystack = [
          ev.accountSchool,
          ev.eventType,
          ev.eventMode,
          ev.notes,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    return [...list].sort((a, b) => {
      switch (sortKey) {
        case "name_desc":
          return b.accountSchool.localeCompare(a.accountSchool);
        case "recent":
          return b.createdAt - a.createdAt;
        default:
          return a.accountSchool.localeCompare(b.accountSchool);
      }
    });
  }, [events, query, sortKey, statusFilter]);

  const hasAnyEvents = events.length > 0;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search events by school, type…"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-800 shadow-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "event" : "events"}
          {statusFilter !== "active" && <> · {filterLabels[statusFilter]}</>}
        </p>

        <div className="flex items-center gap-2">
          <div ref={sortMenuRef} className="relative">
            <button
              onClick={() => {
                setSortOpen((v) => !v);
                setFilterOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              <ArrowUpDown className="h-4 w-4" />
              Sort by
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-11 z-20 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {(Object.keys(sortLabels) as EventSortKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      setSortKey(k);
                      setSortOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    {sortLabels[k]}
                    {sortKey === k && (
                      <Check className="h-4 w-4 text-brand-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={filterMenuRef} className="relative">
            <button
              onClick={() => {
                setFilterOpen((v) => !v);
                setSortOpen(false);
              }}
              className={classNames(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                statusFilter !== "active"
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-11 z-20 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Status
                </p>
                {(Object.keys(filterLabels) as EventStatusFilter[]).map(
                  (k) => (
                    <button
                      key={k}
                      onClick={() => {
                        setStatusFilter(k);
                        setFilterOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      {filterLabels[k]}
                      {statusFilter === k && (
                        <Check className="h-4 w-4 text-brand-600" />
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {!hasAnyEvents ? (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <CalendarDays className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-700">
            No events yet
          </p>
          <p className="max-w-sm text-sm text-slate-400">
            Create an event for a school or account, then add facilitators and
            track confirmation, holds, and contracts.
          </p>
          <button
            onClick={onCreateEvent}
            className="mt-4 rounded-lg border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
          >
            Create your first event
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Search className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-700">
            No events found
          </p>
          <p className="text-sm text-slate-400">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              facilitators={facilitators}
              onOpen={() => onOpenEvent(event.id)}
              onEdit={() => onEditEvent(event)}
              onArchive={() => onArchiveEvent(event)}
              onDelete={() => onDeleteEvent(event)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
