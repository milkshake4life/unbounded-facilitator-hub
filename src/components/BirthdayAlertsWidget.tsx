import { Cake, Mail } from "lucide-react";
import type { Facilitator } from "../types";
import {
  BIRTHDAY_ALERT_WINDOW_DAYS,
  birthdayRelativeLabel,
  formatBirthdayShort,
  upcomingBirthdays,
} from "../lib/birthdays";
import { displayNameWithPronouns } from "../lib/facilitatorName";
import { resolveFacilitatorEmail } from "../lib/gmail";
import { classNames } from "../lib/ui";
import { useHeadshotSrc } from "../lib/useHeadshot";
import { Avatar } from "./Avatar";

interface BirthdayAlertsWidgetProps {
  facilitators: Facilitator[];
  /** False when the user isn't signed in / Gmail can't send yet. */
  emailEnabled?: boolean;
  /** Open compose for a birthday note via Gmail. */
  onEmail: (f: Facilitator, daysUntil: number) => void;
}

/** Two-week window of upcoming facilitator birthdays for outreach. */
export function BirthdayAlertsWidget({
  facilitators,
  emailEnabled = true,
  onEmail,
}: BirthdayAlertsWidgetProps) {
  const upcoming = upcomingBirthdays(facilitators, BIRTHDAY_ALERT_WINDOW_DAYS);
  if (upcoming.length === 0) return null;

  return (
    <section
      className="mt-4 mb-0 overflow-hidden rounded-xl border border-amber-200/80 bg-amber-50/70"
      aria-label="Upcoming birthdays"
    >
      <div className="flex items-start gap-3 border-b border-amber-200/70 px-4 py-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Cake className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">
            Birthdays in the next {BIRTHDAY_ALERT_WINDOW_DAYS} days
          </h2>
          <p className="mt-0.5 text-xs text-slate-600">
            {upcoming.length === 1
              ? "1 facilitator"
              : `${upcoming.length} facilitators`}{" "}
            — send a note before the day sneaks up.
          </p>
        </div>
      </div>

      <ul className="divide-y divide-amber-100/80">
        {upcoming.map(({ facilitator, daysUntil }) => (
          <BirthdayRow
            key={facilitator.id}
            facilitator={facilitator}
            daysUntil={daysUntil}
            emailEnabled={emailEnabled}
            onEmail={onEmail}
          />
        ))}
      </ul>
    </section>
  );
}

function BirthdayRow({
  facilitator,
  daysUntil,
  emailEnabled,
  onEmail,
}: {
  facilitator: Facilitator;
  daysUntil: number;
  emailEnabled: boolean;
  onEmail: (f: Facilitator, daysUntil: number) => void;
}) {
  const headshotSrc = useHeadshotSrc(
    facilitator.id,
    facilitator.hasStoredHeadshot,
    facilitator.headshot
  );
  const name = displayNameWithPronouns(facilitator);
  const dateLabel = formatBirthdayShort(facilitator.birthday);
  const relative = birthdayRelativeLabel(daysUntil);
  const isToday = daysUntil === 0;
  const hasRecipientEmail = Boolean(resolveFacilitatorEmail(facilitator));
  const canEmail = emailEnabled && hasRecipientEmail;
  const disabledReason = !emailEnabled
    ? "Sign in to send birthday emails"
    : !hasRecipientEmail
      ? "No email on file for this facilitator"
      : undefined;

  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <Avatar
        src={headshotSrc}
        alt={name}
        boxClassName="h-9 w-9 shrink-0 rounded-full"
        iconClassName="h-4 w-4"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{name}</p>
        <p className="truncate text-xs text-slate-500">
          {dateLabel}
          <span className="text-slate-300"> · </span>
          <span
            className={classNames(
              "font-medium",
              isToday ? "text-amber-800" : "text-slate-500"
            )}
          >
            {relative}
          </span>
        </p>
      </div>
      <button
        type="button"
        disabled={!canEmail}
        onClick={() => onEmail(facilitator, daysUntil)}
        title={
          canEmail ? `Email a birthday message to ${name}` : disabledReason
        }
        className={classNames(
          "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
          canEmail
            ? "bg-amber-200/80 text-amber-950 ring-1 ring-inset ring-amber-700/15 hover:bg-amber-300/80"
            : "cursor-not-allowed bg-amber-100/60 text-amber-800/40 ring-1 ring-inset ring-amber-700/10"
        )}
      >
        <Mail className="h-3.5 w-3.5" />
        Send birthday email
      </button>
    </li>
  );
}
