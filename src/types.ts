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

export interface Facilitator {
  id: string;

  // Personal & contact
  firstName: string;
  lastName: string;
  unboundedEmail: string;
  personalEmail: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  cellPhone: string;
  emergencyContactName: string;
  emergencyContactNumber: string;

  // UnboundEd gear
  hasPolo: boolean;
  poloStyle: ShirtStyle;
  shirtSize: ShirtSize;

  // UnboundEd experience
  pathways: Pathway[];
  gradeBands: GradeBand[];
  comfortByGradeBand: Partial<Record<GradeBand, ComfortLevel>>;
  standardsInstitute: StandardsInstituteExperience;
  facilitatedSummit: boolean;
  facilitatedInService: boolean;
  otherPrograms: string[];

  // Availability
  availability: Availability;
  availabilityOther?: string;
  availableShortNotice: ShortNotice;

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
