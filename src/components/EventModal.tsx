import { useState } from "react";
import { Check, X } from "lucide-react";
import type { BookingEvent, EventMode, EventType } from "../types";
import { EVENT_MODES, EVENT_TYPES } from "../types";
import { classNames } from "../lib/ui";
import { eventTypeStyles, eventModeStyles } from "../lib/eventStyles";
import { isMultiDayEvent } from "../lib/eventModel";

interface EventModalProps {
  /** Null when creating a new event. */
  initial: BookingEvent | null;
  onClose: () => void;
  onSave: (event: BookingEvent) => void;
}

/**
 * Create or edit an event shell — school, type, mode, schedule, optional notes.
 * Facilitator placements are managed after opening the event.
 */
export function EventModal({ initial, onClose, onSave }: EventModalProps) {
  const isEdit = Boolean(initial);
  const [accountSchool, setAccountSchool] = useState(
    initial?.accountSchool ?? ""
  );
  const [eventType, setEventType] = useState<EventType>(
    initial?.eventType ?? "Standards Institute"
  );
  const [eventMode, setEventMode] = useState<EventMode>(
    initial?.eventMode ?? "In-Person"
  );
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const multiDay = isMultiDayEvent({ startDate, endDate });
  const datesOutOfOrder = Boolean(endDate && startDate && endDate < startDate);
  const timesOutOfOrder =
    !multiDay && Boolean(startTime && endTime && endTime <= startTime);
  const scheduleIncomplete = !startDate
    ? true
    : multiDay
      ? false
      : !startTime || !endTime;

  const canSubmit =
    Boolean(accountSchool.trim()) &&
    !datesOutOfOrder &&
    !timesOutOfOrder &&
    !scheduleIncomplete;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = accountSchool.trim();
    if (!trimmed || !canSubmit) return;
    const now = Date.now();
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      accountSchool: trimmed,
      eventType,
      eventMode,
      startDate,
      endDate: multiDay ? endDate : "",
      startTime: multiDay ? "" : startTime,
      endTime: multiDay ? "" : endTime,
      stage: initial?.stage ?? "prospective",
      notes: notes.trim(),
      pathways: initial?.pathways ?? [],
      sections: initial?.sections ?? [],
      placements: initial?.placements ?? [],
      status: initial?.status ?? "active",
      createdByUid: initial?.createdByUid ?? "",
      createdByEmail: initial?.createdByEmail ?? "",
      updatedByUid: initial?.updatedByUid ?? "",
      updatedByEmail: initial?.updatedByEmail ?? "",
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form
        role="dialog"
        aria-labelledby="event-modal-title"
        onSubmit={handleSubmit}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2
              id="event-modal-title"
              className="text-base font-bold text-slate-900"
            >
              {isEdit ? "Edit event" : "New event"}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {isEdit
                ? "Update school, type, mode, or schedule for this event."
                : "Set the school, schedule, and event details. Add facilitators after."}
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

        <div className="flex max-h-[min(70vh,560px)] flex-col gap-4 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Account | School
            </span>
            <input
              value={accountSchool}
              onChange={(e) => setAccountSchool(e.target.value)}
              placeholder="e.g. Guilford County Schools"
              autoFocus
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <fieldset>
            <legend className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Event type
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPES.map((t) => {
                const selected = eventType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEventType(t)}
                    aria-pressed={selected}
                    className={classNames(
                      "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all",
                      eventTypeStyles[t],
                      selected
                        ? "ring-2 ring-brand-600 ring-offset-2 shadow-sm"
                        : "opacity-45 ring-1 ring-inset hover:opacity-90"
                    )}
                  >
                    {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
                    {t}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Event mode
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_MODES.map((m) => {
                const selected = eventMode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setEventMode(m)}
                    aria-pressed={selected}
                    className={classNames(
                      "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all",
                      eventModeStyles[m],
                      selected
                        ? "ring-2 ring-brand-600 ring-offset-2 shadow-sm"
                        : "opacity-45 ring-1 ring-inset hover:opacity-90"
                    )}
                  >
                    {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
                    {m}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Schedule
            </p>
            <p className="mb-2 text-xs text-slate-500">
              Required for Google Calendar holds and confirms. One-day events
              need times; multi-day events become all-day blocks.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">
                  Start date
                </span>
                <input
                  type="date"
                  value={startDate}
                  required
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">
                  End date{" "}
                  <span className="font-normal text-slate-400">
                    (multi-day)
                  </span>
                </span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </label>
            </div>
            {datesOutOfOrder && (
              <p className="mt-1.5 text-xs font-medium text-rose-600">
                The end date can't be before the start date.
              </p>
            )}
            {!multiDay && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-600">
                    Start time
                  </span>
                  <input
                    type="time"
                    value={startTime}
                    required
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-600">
                    End time
                  </span>
                  <input
                    type="time"
                    value={endTime}
                    required
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </label>
              </div>
            )}
            {multiDay && (
              <p className="mt-2 text-xs text-slate-500">
                Multi-day schedule — calendar invites will be all-day from start
                through end date.
              </p>
            )}
            {timesOutOfOrder && (
              <p className="mt-1.5 text-xs font-medium text-rose-600">
                End time must be after start time.
              </p>
            )}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Notes{" "}
              <span className="font-normal normal-case text-slate-400">
                (optional)
              </span>
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 2 facilitators per section | 50 ppl in each section"
              rows={3}
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
            disabled={!canSubmit}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isEdit ? "Save" : "Create event"}
          </button>
        </div>
      </form>
    </div>
  );
}
