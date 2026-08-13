import type { Facilitator } from "../types";

/** First name shown in the UI — preferred name when set, otherwise legal first. */
export function displayFirstName(f: Pick<Facilitator, "firstName" | "preferredName">): string {
  const preferred = f.preferredName?.trim();
  return preferred || f.firstName;
}

/** Preferred-or-legal first + last name, without pronouns. */
export function displayName(
  f: Pick<Facilitator, "firstName" | "lastName" | "preferredName">
): string {
  return `${displayFirstName(f)} ${f.lastName}`.trim();
}

/** Legal first + last (intake / form name), ignoring preferred name. */
export function legalName(f: Pick<Facilitator, "firstName" | "lastName">): string {
  return `${f.firstName} ${f.lastName}`.trim();
}

/** True when preferred name is set and differs from legal first name. */
export function hasDistinctPreferredName(
  f: Pick<Facilitator, "firstName" | "preferredName">
): boolean {
  const preferred = f.preferredName?.trim();
  if (!preferred) return false;
  return preferred.toLowerCase() !== f.firstName.trim().toLowerCase();
}

/**
 * Profile-style label: "Bri Smith (she/her)" or "Brian Dean (he/him/his)".
 * Pronouns are omitted when blank.
 */
export function displayNameWithPronouns(
  f: Pick<Facilitator, "firstName" | "lastName" | "preferredName" | "pronouns">
): string {
  const name = displayName(f);
  const pronouns = f.pronouns?.trim();
  return pronouns ? `${name} (${pronouns})` : name;
}
