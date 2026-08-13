export type Pathway =
  | "English Language Arts"
  | "Mathematics"
  | "Leadership"
  | "UnboundEd Planning Process";

export type GradeBand = "K-5" | "6-8" | "9-12" | "6-12";

/** Comfort facilitating a given grade band (from the form's grid question). */
export type ComfortLevel = "nerd_out" | "fine" | "avoid";

export type ShirtStyle = "Unisex Cut" | "Women's Cut";

export type ShirtSize = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "XXXL";

export type StandardsInstituteExperience = "national" | "local" | "both" | "no";

export type Availability =
  | "Flexibility throughout the year"
  | "Summers Only"
  | "Could be available during the year if given enough notice"
  | "Other";

export type ShortNotice = "Yes" | "No" | "Maybe";

export type FacilitatorStatus = "active" | "archived";

/** Someone allowed to sign in and use the Facilitator Hub. */
export interface AllowedUser {
  email: string;
  displayName: string | null;
  /** Email of the person who granted access, or null for bootstrap admins. */
  grantedBy: string | null;
  grantedAt: number;
}

/**
 * A personal curated set of facilitators owned by one user.
 * Membership lives on the group doc — never on shared facilitator records.
 * Think of a group like a folder: name it first, then add facilitators inside.
 */
export interface FacilitatorGroup {
  id: string;
  name: string;
  /** Optional note about what this group is for. */
  description: string;
  ownerUid: string;
  ownerEmail: string;
  facilitatorIds: string[];
  status: FacilitatorStatus;
  createdAt: number;
  updatedAt: number;
}

/**
 * Shared team email template (Communication / Purpose / Text from the
 * facilitator communications sheet). Any allowlisted user can CRUD.
 */
export interface EmailTemplate {
  id: string;
  /** Communication title, e.g. "Facilitator Availability (Rolanda)". */
  name: string;
  /** Purpose/Timeline note, e.g. "Event >= 75% probability". */
  purpose: string;
  subject: string;
  body: string;
  createdByUid: string;
  createdByEmail: string;
  updatedByUid: string;
  updatedByEmail: string;
  createdAt: number;
  updatedAt: number;
}

export interface Facilitator {
  id: string;

  // Personal & contact
  firstName: string;
  lastName: string;
  /**
   * What they go by day-to-day (e.g. "Bri" when firstName is "Brianne").
   * When set, the directory and profile use this instead of firstName.
   */
  preferredName?: string;
  /** e.g. "he/him/his", "she/her", "they/them" — shown next to their name. */
  pronouns?: string;
  /**
   * Birthday as YYYY-MM-DD. Year is kept when known; upcoming-birthday alerts
   * match on month/day only so they recur every year.
   */
  birthday?: string;
  unboundedEmail: string;
  personalEmail: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  cellPhone: string;
  emergencyContactName: string;
  emergencyContactNumber: string;

  // UnboundEd gear — left undefined when the facilitator never answered.
  hasPolo?: boolean;
  poloStyle?: ShirtStyle;
  shirtSize?: ShirtSize;

  // UnboundEd experience
  pathways: Pathway[];
  gradeBands: GradeBand[];
  comfortByGradeBand: Partial<Record<GradeBand, ComfortLevel>>;
  standardsInstitute: StandardsInstituteExperience;
  facilitatedSummit: boolean;
  facilitatedInService: boolean;
  otherPrograms: string[];

  // Availability — left undefined when the facilitator never answered.
  availability?: Availability;
  availabilityOther?: string;
  availableShortNotice?: ShortNotice;

  // Professional experience
  currentEmployer: string;
  jobTitle: string;
  roleDescription: string;
  districtRelationships: string;
  resumeFileName?: string;
  /** Google Drive file id for the imported resume (opens/downloads via Drive). */
  resumeDriveFileId?: string;
  /** True when a Drive resume file id has been saved on this facilitator. */
  hasStoredResume?: boolean;

  // Bio & media
  bio: string;
  /** True when `bio` was produced by the in-app AI generator (not user-written). */
  bioGeneratedByAi?: boolean;
  headshot: string;
  /** True when a photo has been uploaded to the `headshots` Firestore collection. */
  hasStoredHeadshot?: boolean;

  // Meta
  status: FacilitatorStatus;
  joinedDate: string;
}

/* ---- Option lists (mirror the Google Form) ---- */

export const PATHWAYS: Pathway[] = [
  "English Language Arts",
  "Mathematics",
  "Leadership",
  "UnboundEd Planning Process",
];

export const GRADE_BANDS: GradeBand[] = ["K-5", "6-8", "9-12", "6-12"];

export const SHIRT_SIZES: ShirtSize[] = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
];

export const AVAILABILITY_OPTIONS: Availability[] = [
  "Flexibility throughout the year",
  "Summers Only",
  "Could be available during the year if given enough notice",
  "Other",
];

export const COMFORT_LABELS: Record<ComfortLevel, string> = {
  nerd_out: "I nerd out for this!",
  fine: "This is fine.",
  avoid: "I do not want to facilitate this.",
};

export const STANDARDS_INSTITUTE_LABELS: Record<
  StandardsInstituteExperience,
  string
> = {
  national: "Yes — national only",
  local: "Yes — local only",
  both: "Yes — national & local",
  no: "No",
};

/* ---- Events / staffing board ---- */

export type EventType =
  | "Executive Coaching"
  | "GLEAM Learning Walk"
  | "In Service Workshop"
  | "Standards Institute"
  | "Summit"
  | "Custom";

export type EventMode = "In-Person" | "Virtual";

/**
 * Where an event sits in the booking pipeline. Two gates drive facilitator
 * outreach: holds go out once the booking is likely enough to secure people,
 * and every hold turns into a confirm (plus a facilitator contract) once the
 * client contract signs.
 */
export type EventStage =
  | "prospective"
  | "likely"
  | "contracted"
  | "delivered";

export const EVENT_STAGES: EventStage[] = [
  "prospective",
  "likely",
  "contracted",
  "delivered",
];

export const EVENT_STAGE_META: Record<
  EventStage,
  { label: string; short: string; description: string }
> = {
  prospective: {
    label: "Prospective",
    short: "Prospective",
    description:
      "Still being shaped. Plan pathways and sections, but hold off on facilitator outreach.",
  },
  likely: {
    label: "Securing facilitators",
    short: "Securing",
    description:
      "Likely enough to staff. Fill every open seat and send each facilitator a calendar HOLD.",
  },
  contracted: {
    label: "Contract signed",
    short: "Contracted",
    description:
      "Ask held facilitators to reconfirm availability, turn each HOLD into a CONFIRM, and request their contracts.",
  },
  delivered: {
    label: "Delivered",
    short: "Delivered",
    description: "The event has run. Staffing is kept as history.",
  },
};

/**
 * How far along one facilitator is for the seat they hold. This mirrors the
 * outreach sequence: ask availability, send a calendar HOLD, convert that hold
 * to a CONFIRM once the client contract signs, then request their contract.
 */
export type PlacementStage =
  | "proposed"
  | "availability"
  | "hold"
  | "confirmed"
  | "contracted";

export const PLACEMENT_STAGES: PlacementStage[] = [
  "proposed",
  "availability",
  "hold",
  "confirmed",
  "contracted",
];

export const PLACEMENT_STAGE_META: Record<
  PlacementStage,
  { label: string; short: string; description: string }
> = {
  proposed: {
    label: "Proposed",
    short: "Proposed",
    description: "Penciled into this seat. Nothing has been sent yet.",
  },
  availability: {
    label: "Availability asked",
    short: "Asked",
    description: "Availability email sent — waiting on their reply.",
  },
  hold: {
    label: "Calendar HOLD",
    short: "HOLD",
    description: "Calendar hold sent so the date is protected.",
  },
  confirmed: {
    label: "Confirmed",
    short: "CONFIRM",
    description:
      "Reconfirmed after the contract signed — their hold is now a confirm.",
  },
  contracted: {
    label: "Contract requested",
    short: "Contract",
    description: "Their facilitator contract has been requested.",
  },
};

/** A strand of content inside an event, e.g. "Math K-5". */
export interface EventPathway {
  id: string;
  name: string;
  notes: string;
}

/** One deliverable slot inside a pathway, e.g. "Section 1" or "AM Section". */
export interface EventSection {
  id: string;
  pathwayId: string;
  name: string;
  /** Facilitators this section needs. 0 means not decided yet. */
  seatsNeeded: number;
  /** Optional day this section runs (YYYY-MM-DD). */
  date: string;
  notes: string;
}

/** One facilitator filling one seat in one section. */
export interface EventPlacement {
  id: string;
  facilitatorId: string;
  pathwayId: string;
  sectionId: string;
  stage: PlacementStage;
  dropped: boolean;
  /** Required explanation, captured whenever `dropped` is set. */
  dropReason: string;
  notes: string;
  /**
   * Google Calendar event id for the HOLD/CONFIRM invite on the sender's
   * primary calendar. Empty until a hold (or confirm) invite is sent.
   */
  calendarEventId: string;
}

/**
 * A bookable event keyed by Account | School (choice A title).
 * Shared across the team — any allowlisted user can read/write.
 */
export interface BookingEvent {
  id: string;
  /** Account | School — primary display name. */
  accountSchool: string;
  eventType: EventType;
  eventMode: EventMode;
  /**
   * Event start date (YYYY-MM-DD). Required before Google Calendar invites
   * can be sent.
   */
  startDate: string;
  /**
   * End date (YYYY-MM-DD) for multi-day events. Empty or equal to startDate
   * means a single-day event (which also needs startTime/endTime).
   */
  endDate: string;
  /**
   * Local start time (HH:mm) for single-day events. Unused for multi-day
   * (those become all-day calendar blocks).
   */
  startTime: string;
  /**
   * Local end time (HH:mm) for single-day events. Must be after startTime.
   */
  endTime: string;
  stage: EventStage;
  /** Shared event-level notes (e.g. capacity). */
  notes: string;
  pathways: EventPathway[];
  sections: EventSection[];
  placements: EventPlacement[];
  status: FacilitatorStatus;
  createdByUid: string;
  createdByEmail: string;
  updatedByUid: string;
  updatedByEmail: string;
  createdAt: number;
  updatedAt: number;
}

export const EVENT_TYPES: EventType[] = [
  "Executive Coaching",
  "GLEAM Learning Walk",
  "In Service Workshop",
  "Standards Institute",
  "Summit",
  "Custom",
];

export const EVENT_MODES: EventMode[] = ["In-Person", "Virtual"];

/** Suggested pathways from the booking sheet (free text also allowed). */
export const PLACEMENT_PATHWAY_OPTIONS: string[] = [
  "ELA K-5",
  "ELA 6-12",
  "Math K-5",
  "Math 6-12",
  "Leadership",
  "UPP K-12 (M1: Price of Partnership)",
  "UPP K-12 (M2: Scaffolding)",
];

export const PLACEMENT_SECTION_OPTIONS: string[] = [
  "Section 1",
  "Section 2",
  "Section 3",
  "Section 4",
  "Section 5",
  "Section 6",
  "AM Section",
  "PM Section",
];
