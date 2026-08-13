// Google Calendar invite plumbing: OAuth token (calendar.events) + create/update.
// Kept separate from Sheets/Drive/Gmail so those flows don't request calendar permission.

import type { BookingEvent, Facilitator } from "../types";
import {
  eventScheduleReady,
  formatEventSchedule,
  isMultiDayEvent,
  scheduleGapReason,
} from "./eventModel";
import { resolveFacilitatorEmail } from "./gmail";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

/** Calendar only needs the OAuth client ID (no API key). */
export const isCalendarConfigured = Boolean(CLIENT_ID);

const scriptCache = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  const cached = scriptCache.get(src);
  if (cached) return cached;
  const p = new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(el);
  });
  scriptCache.set(src, p);
  return p;
}

async function ensureGis(): Promise<void> {
  await loadScript("https://accounts.google.com/gsi/client");
}

let cachedToken: string | null = null;

/**
 * Request an OAuth access token with the calendar.events scope.
 * Pass `forceConsent` to re-prompt (e.g. after a 401).
 */
async function getCalendarAccessToken(forceConsent = false): Promise<string> {
  if (!isCalendarConfigured) {
    throw new Error(
      "Google is not configured. Set VITE_GOOGLE_CLIENT_ID to send calendar invites."
    );
  }
  if (cachedToken && !forceConsent) return cachedToken;
  await ensureGis();

  return new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: CALENDAR_SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(
            new Error(
              resp.error_description || resp.error || "Authorization failed"
            )
          );
          return;
        }
        cachedToken = resp.access_token;
        resolve(resp.access_token);
      },
    });
    client.requestAccessToken({ prompt: forceConsent ? "consent" : "" });
  });
}

export type CalendarInviteKind = "hold" | "confirm";

export function calendarInviteTitle(
  kind: CalendarInviteKind,
  eventName: string
): string {
  const prefix = kind === "hold" ? "GCAL HOLD" : "GCAL CONFIRM";
  return `${prefix} · ${eventName}`;
}

function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

/** Google all-day end dates are exclusive — day after the last inclusive day. */
function nextDayIso(yyyyMmDd: string): string {
  const d = new Date(`${yyyyMmDd}T00:00:00`);
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildStartEnd(event: BookingEvent): {
  start: Record<string, string>;
  end: Record<string, string>;
} {
  const gap = scheduleGapReason(event);
  if (gap) throw new Error(gap);

  if (isMultiDayEvent(event)) {
    return {
      start: { date: event.startDate },
      end: { date: nextDayIso(event.endDate) },
    };
  }

  const tz = localTimeZone();
  return {
    start: {
      dateTime: `${event.startDate}T${event.startTime}:00`,
      timeZone: tz,
    },
    end: {
      dateTime: `${event.startDate}T${event.endTime}:00`,
      timeZone: tz,
    },
  };
}

function inviteDescription(
  kind: CalendarInviteKind,
  event: BookingEvent
): string {
  const schedule = formatEventSchedule(event) ?? "";
  const mode = event.eventMode;
  const type = event.eventType;
  if (kind === "hold") {
    return [
      `Calendar HOLD for ${event.accountSchool}.`,
      `This is not a firm booking yet — please protect this time while the client contract is finalized.`,
      "",
      `Event type: ${type}`,
      `Mode: ${mode}`,
      schedule ? `When: ${schedule}` : "",
      event.notes.trim() ? `Notes: ${event.notes.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    `Calendar CONFIRM for ${event.accountSchool}.`,
    `The client contract is signed — this assignment is confirmed.`,
    "",
    `Event type: ${type}`,
    `Mode: ${mode}`,
    schedule ? `When: ${schedule}` : "",
    event.notes.trim() ? `Notes: ${event.notes.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

interface CalendarEventBody {
  summary: string;
  description: string;
  start: Record<string, string>;
  end: Record<string, string>;
  attendees: Array<{ email: string }>;
}

async function calendarError(res: Response, action: string): Promise<Error> {
  let detail = "";
  try {
    const body = await res.json();
    detail = body?.error?.message ?? "";
  } catch {
    // ignore non-JSON bodies
  }
  if (
    res.status === 403 &&
    /has not been used|is disabled|accessNotConfigured/i.test(detail)
  ) {
    return new Error(
      `${action}: the Google Calendar API isn't enabled for this project yet. Enable it in the Google Cloud console, then try again.${detail ? ` (${detail})` : ""}`
    );
  }
  if (res.status === 401 || res.status === 403) {
    cachedToken = null;
    return new Error(
      `${action}: permission denied (${res.status}). Grant Calendar access when prompted, and make sure the Calendar API is enabled.${detail ? ` — ${detail}` : ""}`
    );
  }
  return new Error(
    `${action} (${res.status}).${detail ? ` — ${detail}` : ""}`
  );
}

async function calendarFetch(
  url: string,
  init: RequestInit,
  action: string
): Promise<Response> {
  let token = await getCalendarAccessToken();
  let res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401 || res.status === 403) {
    token = await getCalendarAccessToken(true);
    res = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  }

  if (!res.ok) throw await calendarError(res, action);
  return res;
}

/**
 * Create a new calendar invite on the signed-in user's primary calendar.
 * Returns the Google Calendar event id.
 */
export async function createCalendarInvite(input: {
  event: BookingEvent;
  kind: CalendarInviteKind;
  attendeeEmail: string;
}): Promise<string> {
  if (!eventScheduleReady(input.event)) {
    throw new Error(scheduleGapReason(input.event) ?? "Event schedule incomplete.");
  }
  const { start, end } = buildStartEnd(input.event);
  const body: CalendarEventBody = {
    summary: calendarInviteTitle(input.kind, input.event.accountSchool),
    description: inviteDescription(input.kind, input.event),
    start,
    end,
    attendees: [{ email: input.attendeeEmail }],
  };

  const res = await calendarFetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
    { method: "POST", body: JSON.stringify(body) },
    "Could not create calendar invite"
  );
  const data = (await res.json()) as { id?: string };
  if (!data.id) throw new Error("Could not create calendar invite: missing event id.");
  return data.id;
}

/**
 * Update an existing invite (HOLD → CONFIRM, or refresh times/title).
 * Returns the same Google Calendar event id.
 */
export async function updateCalendarInvite(input: {
  event: BookingEvent;
  kind: CalendarInviteKind;
  calendarEventId: string;
  attendeeEmail: string;
}): Promise<string> {
  if (!eventScheduleReady(input.event)) {
    throw new Error(scheduleGapReason(input.event) ?? "Event schedule incomplete.");
  }
  const { start, end } = buildStartEnd(input.event);
  const body: CalendarEventBody = {
    summary: calendarInviteTitle(input.kind, input.event.accountSchool),
    description: inviteDescription(input.kind, input.event),
    start,
    end,
    attendees: [{ email: input.attendeeEmail }],
  };

  const id = encodeURIComponent(input.calendarEventId);
  await calendarFetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${id}?sendUpdates=all`,
    { method: "PATCH", body: JSON.stringify(body) },
    "Could not update calendar invite"
  );
  return input.calendarEventId;
}

/**
 * Send or refresh a HOLD/CONFIRM for one facilitator.
 * Creates when there is no stored calendar event id; otherwise patches it.
 */
export async function upsertFacilitatorInvite(input: {
  event: BookingEvent;
  kind: CalendarInviteKind;
  facilitator: Facilitator;
  calendarEventId: string;
}): Promise<string> {
  const email = resolveFacilitatorEmail(input.facilitator);
  if (!email) {
    throw new Error(
      `${input.facilitator.firstName} ${input.facilitator.lastName} has no email on file.`
    );
  }

  if (input.calendarEventId) {
    try {
      return await updateCalendarInvite({
        event: input.event,
        kind: input.kind,
        calendarEventId: input.calendarEventId,
        attendeeEmail: email,
      });
    } catch (err) {
      // Stale / deleted event id — fall through and create a fresh invite.
      const message = err instanceof Error ? err.message : "";
      if (!/\(404\)|Not Found/i.test(message)) throw err;
    }
  }

  return createCalendarInvite({
    event: input.event,
    kind: input.kind,
    attendeeEmail: email,
  });
}

/** Cancel an invite when a facilitator is dropped (best-effort). */
export async function cancelCalendarInvite(
  calendarEventId: string
): Promise<void> {
  if (!calendarEventId) return;
  const id = encodeURIComponent(calendarEventId);
  await calendarFetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${id}?sendUpdates=all`,
    { method: "DELETE" },
    "Could not cancel calendar invite"
  );
}
