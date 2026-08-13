import type { Facilitator } from "../types";
import { displayFirstName, displayName } from "./facilitatorName";

/** Days ahead (inclusive of today) for the birthday alerts window. */
export const BIRTHDAY_ALERT_WINDOW_DAYS = 14;

export interface UpcomingBirthday {
  facilitator: Facilitator;
  /** Next occurrence of their birthday (local midnight). */
  nextDate: Date;
  /** 0 = today, 1 = tomorrow, … */
  daysUntil: number;
}

/**
 * Parse a stored birthday. Accepts YYYY-MM-DD or MM-DD (year defaults to 2000
 * as a placeholder — alerts ignore year).
 */
export function parseBirthday(value: string | undefined): {
  month: number;
  day: number;
  year: number | null;
} | null {
  const raw = value?.trim();
  if (!raw) return null;

  const full = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (full) {
    const year = Number(full[1]);
    const month = Number(full[2]);
    const day = Number(full[3]);
    if (!isValidMonthDay(month, day)) return null;
    return { month, day, year };
  }

  const md = raw.match(/^(\d{1,2})-(\d{1,2})$/);
  if (md) {
    const month = Number(md[1]);
    const day = Number(md[2]);
    if (!isValidMonthDay(month, day)) return null;
    return { month, day, year: null };
  }

  return null;
}

function isValidMonthDay(month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  // Use a leap year so Feb 29 is accepted when present.
  const probe = new Date(2000, month - 1, day);
  return probe.getMonth() === month - 1 && probe.getDate() === day;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Next calendar occurrence of month/day on or after `from` (local). */
export function nextBirthdayDate(
  month: number,
  day: number,
  from: Date = new Date()
): Date {
  const today = startOfLocalDay(from);
  const thisYear = new Date(today.getFullYear(), month - 1, day);
  if (thisYear >= today) return thisYear;
  return new Date(today.getFullYear() + 1, month - 1, day);
}

function daysBetween(from: Date, to: Date): number {
  const ms = startOfLocalDay(to).getTime() - startOfLocalDay(from).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

/**
 * Active facilitators whose birthday falls within the next `windowDays` days
 * (including today), soonest first.
 */
export function upcomingBirthdays(
  facilitators: Facilitator[],
  windowDays: number = BIRTHDAY_ALERT_WINDOW_DAYS,
  from: Date = new Date()
): UpcomingBirthday[] {
  const today = startOfLocalDay(from);
  const out: UpcomingBirthday[] = [];

  for (const f of facilitators) {
    if (f.status === "archived") continue;
    const parsed = parseBirthday(f.birthday);
    if (!parsed) continue;
    const nextDate = nextBirthdayDate(parsed.month, parsed.day, today);
    const daysUntil = daysBetween(today, nextDate);
    if (daysUntil < 0 || daysUntil > windowDays) continue;
    out.push({ facilitator: f, nextDate, daysUntil });
  }

  out.sort((a, b) => {
    if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
    return displayName(a.facilitator).localeCompare(displayName(b.facilitator));
  });
  return out;
}

/** e.g. "Mar 14" — month/day only for recurring birthdays. */
export function formatBirthdayShort(value: string | undefined): string {
  const parsed = parseBirthday(value);
  if (!parsed) return "";
  const d = new Date(2000, parsed.month - 1, parsed.day);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Relative label for the alerts list. */
export function birthdayRelativeLabel(daysUntil: number): string {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  return `In ${daysUntil} days`;
}

/** Editable starting point for a birthday email compose. */
export function birthdayEmailDraft(
  f: Facilitator,
  daysUntil: number
): { subject: string; body: string } {
  const first = displayFirstName(f);
  const when =
    daysUntil === 0
      ? "today"
      : daysUntil === 1
        ? "tomorrow"
        : `on ${formatBirthdayShort(f.birthday) || "your birthday"}`;

  return {
    subject: `Happy birthday, ${first}!`,
    body: `Hi ${first},

Happy birthday${daysUntil === 0 ? "" : ` ${when}`}! The UnboundEd team is thinking of you and grateful for the energy you bring to our facilitators community.

Wishing you a wonderful day.

Warmly,
The UnboundEd team`,
  };
}
