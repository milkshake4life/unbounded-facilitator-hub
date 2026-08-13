import { useMemo, useState } from "react";
import { CalendarDays, Loader2, X } from "lucide-react";
import type { BookingEvent, EventPlacement, Facilitator } from "../types";
import { displayName } from "../lib/facilitatorName";
import {
  formatEventSchedule,
  scheduleGapReason,
} from "../lib/eventModel";
import { resolveFacilitatorEmail } from "../lib/gmail";
import {
  calendarInviteTitle,
  isCalendarConfigured,
  upsertFacilitatorInvite,
  type CalendarInviteKind,
} from "../lib/googleCalendar";
import { classNames } from "../lib/ui";

interface CalendarInviteModalProps {
  event: BookingEvent;
  kind: CalendarInviteKind;
  placements: EventPlacement[];
  facilitatorsById: Map<string, Facilitator>;
  onClose: () => void;
  /** Status-only: set stage without touching Google Calendar. */
  onStatusOnly: (placementIds: string[]) => void;
  /** Called with successful placement patches (stage + calendarEventId). */
  onInvitesSent: (
    patches: Array<{
      id: string;
      patch: Partial<EventPlacement>;
    }>
  ) => void;
  onEditSchedule: () => void;
}

/**
 * Confirm sending (or skipping) a GCAL HOLD / CONFIRM when a placement stage
 * changes to hold or confirmed.
 */
export function CalendarInviteModal({
  event,
  kind,
  placements,
  facilitatorsById,
  onClose,
  onStatusOnly,
  onInvitesSent,
  onEditSchedule,
}: CalendarInviteModalProps) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null
  );
  const [remaining, setRemaining] = useState(placements);

  const scheduleLabel = formatEventSchedule(event);
  const scheduleGap = scheduleGapReason(event);
  const titlePrefix = calendarInviteTitle(kind, event.accountSchool);
  const single = remaining.length === 1;

  const rows = useMemo(() => {
    return remaining.map((placement) => {
      const facilitator = facilitatorsById.get(placement.facilitatorId) ?? null;
      const email = facilitator ? resolveFacilitatorEmail(facilitator) : null;
      return { placement, facilitator, email };
    });
  }, [remaining, facilitatorsById]);

  const withEmail = rows.filter((r) => r.email);
  const withoutEmail = rows.filter((r) => !r.email);

  const singleName = single
    ? rows[0]?.facilitator
      ? displayName(rows[0].facilitator)
      : "this facilitator"
    : null;

  const heading =
    kind === "hold"
      ? single
        ? `Send calendar HOLD to ${singleName}?`
        : `Send calendar HOLDs to ${remaining.length} facilitators?`
      : single
        ? `Convert ${singleName}'s invite to CONFIRM?`
        : `Convert ${remaining.length} holds to CONFIRMs?`;

  const detail =
    kind === "hold"
      ? "A Google Calendar invite titled GCAL HOLD will be sent for this event’s schedule. You can also update status without sending."
      : "The existing HOLD invite will be updated to GCAL CONFIRM (same calendar event). You can also update status without sending.";

  async function handleSend() {
    if (scheduleGap) {
      setError(scheduleGap);
      return;
    }
    if (!isCalendarConfigured) {
      setError(
        "Google is not configured. Set VITE_GOOGLE_CLIENT_ID and enable the Google Calendar API."
      );
      return;
    }
    if (withEmail.length === 0) {
      setError("No facilitators with an email address to invite.");
      return;
    }

    setSending(true);
    setError(null);
    setProgress({ done: 0, total: withEmail.length });

    const patches: Array<{ id: string; patch: Partial<EventPlacement> }> = [];
    const failures: string[] = [];
    const failedIds = new Set<string>();

    for (let i = 0; i < withEmail.length; i++) {
      const row = withEmail[i];
      const name = row.facilitator
        ? displayName(row.facilitator)
        : "Unknown facilitator";
      try {
        const calendarEventId = await upsertFacilitatorInvite({
          event,
          kind,
          facilitator: row.facilitator!,
          calendarEventId: row.placement.calendarEventId,
        });
        patches.push({
          id: row.placement.id,
          patch: {
            stage: kind === "hold" ? "hold" : "confirmed",
            calendarEventId,
          },
        });
      } catch (err) {
        failedIds.add(row.placement.id);
        failures.push(
          `${name}: ${err instanceof Error ? err.message : "Failed"}`
        );
      }
      setProgress({ done: i + 1, total: withEmail.length });
    }

    setSending(false);
    setProgress(null);

    if (patches.length > 0) onInvitesSent(patches);

    setRemaining((prev) => prev.filter((p) => failedIds.has(p.id)));

    if (failures.length > 0) {
      setError(
        `Sent ${patches.length} of ${withEmail.length}. Failed:\n${failures.join("\n")}`
      );
      return;
    }

    onClose();
  }

  function handleStatusOnly() {
    onStatusOnly(remaining.map((p) => p.id));
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-labelledby="calendar-invite-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2
              id="calendar-invite-title"
              className="text-base font-bold text-slate-900"
            >
              {heading}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">{detail}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Invite title
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">
              {titlePrefix}
            </p>
            <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-600">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              {scheduleLabel ?? "No schedule set yet"}
            </p>
            {scheduleGap && (
              <button
                type="button"
                onClick={onEditSchedule}
                className="mt-2 text-xs font-semibold text-amber-700 hover:underline"
              >
                {scheduleGap} — edit schedule
              </button>
            )}
          </div>

          {remaining.length > 1 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Recipients ({withEmail.length})
              </p>
              <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
                {withEmail.map(({ placement, facilitator, email }) => (
                  <li
                    key={placement.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"
                  >
                    <span className="truncate font-medium text-slate-800">
                      {facilitator ? displayName(facilitator) : "Unknown"}
                    </span>
                    <span className="shrink-0 truncate text-xs text-slate-500">
                      {email}
                    </span>
                  </li>
                ))}
              </ul>
              {withoutEmail.length > 0 && (
                <p className="mt-2 text-xs text-amber-700">
                  Skipping {withoutEmail.length} without an email:{" "}
                  {withoutEmail
                    .map((r) =>
                      r.facilitator ? displayName(r.facilitator) : "Unknown"
                    )
                    .join(", ")}
                </p>
              )}
            </div>
          )}

          {single && rows[0] && (
            <p className="text-sm text-slate-600">
              {rows[0].email ? (
                <>
                  Invite goes to{" "}
                  <span className="font-medium text-slate-800">
                    {rows[0].email}
                  </span>
                </>
              ) : (
                <span className="text-amber-700">
                  No email on file for this facilitator — you can still update
                  status only.
                </span>
              )}
            </p>
          )}

          {error && (
            <pre className="whitespace-pre-wrap rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {error}
            </pre>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStatusOnly}
            disabled={sending}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
          >
            Status only
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={
              sending ||
              withEmail.length === 0 ||
              !isCalendarConfigured ||
              Boolean(scheduleGap)
            }
            className={classNames(
              "inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            )}
          >
            {sending && <Loader2 className="h-4 w-4 animate-spin" />}
            {sending && progress
              ? `Sending ${progress.done}/${progress.total}…`
              : kind === "hold"
                ? single
                  ? "Send HOLD invite"
                  : "Send HOLD invites"
                : single
                  ? "Send CONFIRM update"
                  : "Send CONFIRM updates"}
          </button>
        </div>
      </div>
    </div>
  );
}
