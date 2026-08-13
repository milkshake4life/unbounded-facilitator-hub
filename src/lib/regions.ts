/**
 * US regions the team commonly filters facilitators by.
 *
 * Every state, DC, and Puerto Rico belongs to exactly one region so nobody is
 * invisible when a region filter is on. States sit in the bucket the team uses,
 * which does not always match the Census divisions.
 */
export type Region =
  | "Northeast"
  | "Southeast"
  | "South Central"
  | "Midwest"
  | "Southwest"
  | "Pacific NW";

export const REGIONS: Region[] = [
  "Southeast",
  "Midwest",
  "South Central",
  "Northeast",
  "Southwest",
  "Pacific NW",
];

/** Postal codes per region. Edit here to re-map a state. */
export const REGION_STATES: Record<Region, string[]> = {
  Northeast: ["CT", "MA", "ME", "NH", "NJ", "NY", "PA", "RI", "VT"],
  Southeast: [
    "AL",
    "DC",
    "DE",
    "FL",
    "GA",
    "KY",
    "MD",
    "MS",
    "NC",
    "PR",
    "SC",
    "TN",
    "VA",
    "WV",
  ],
  "South Central": ["AR", "LA", "OK", "TX"],
  Midwest: [
    "IA",
    "IL",
    "IN",
    "KS",
    "MI",
    "MN",
    "MO",
    "ND",
    "NE",
    "OH",
    "SD",
    "WI",
  ],
  Southwest: ["AZ", "CA", "CO", "HI", "NM", "NV", "UT"],
  "Pacific NW": ["AK", "ID", "MT", "OR", "WA", "WY"],
};

/** Full state names, so imported rows spelling out "Colorado" still match. */
const STATE_NAME_TO_CODE: Record<string, string> = {
  ALABAMA: "AL",
  ALASKA: "AK",
  ARIZONA: "AZ",
  ARKANSAS: "AR",
  CALIFORNIA: "CA",
  COLORADO: "CO",
  CONNECTICUT: "CT",
  DELAWARE: "DE",
  "DISTRICT OF COLUMBIA": "DC",
  FLORIDA: "FL",
  GEORGIA: "GA",
  HAWAII: "HI",
  IDAHO: "ID",
  ILLINOIS: "IL",
  INDIANA: "IN",
  IOWA: "IA",
  KANSAS: "KS",
  KENTUCKY: "KY",
  LOUISIANA: "LA",
  MAINE: "ME",
  MARYLAND: "MD",
  MASSACHUSETTS: "MA",
  MICHIGAN: "MI",
  MINNESOTA: "MN",
  MISSISSIPPI: "MS",
  MISSOURI: "MO",
  MONTANA: "MT",
  NEBRASKA: "NE",
  NEVADA: "NV",
  "NEW HAMPSHIRE": "NH",
  "NEW JERSEY": "NJ",
  "NEW MEXICO": "NM",
  "NEW YORK": "NY",
  "NORTH CAROLINA": "NC",
  "NORTH DAKOTA": "ND",
  OHIO: "OH",
  OKLAHOMA: "OK",
  OREGON: "OR",
  PENNSYLVANIA: "PA",
  "PUERTO RICO": "PR",
  "RHODE ISLAND": "RI",
  "SOUTH CAROLINA": "SC",
  "SOUTH DAKOTA": "SD",
  TENNESSEE: "TN",
  TEXAS: "TX",
  UTAH: "UT",
  VERMONT: "VT",
  VIRGINIA: "VA",
  WASHINGTON: "WA",
  "WEST VIRGINIA": "WV",
  WISCONSIN: "WI",
  WYOMING: "WY",
};

const REGION_BY_STATE_CODE: Record<string, Region> = Object.fromEntries(
  REGIONS.flatMap((region) =>
    REGION_STATES[region].map((code) => [code, region] as const)
  )
);

const STATE_CODE_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAME_TO_CODE).map(([name, code]) => [code, name])
);

/** Normalize whatever is stored on the record into a postal code. */
function toStateCode(state: string | undefined): string | null {
  const raw = state?.trim().toUpperCase();
  if (!raw) return null;
  if (REGION_BY_STATE_CODE[raw]) return raw;
  return STATE_NAME_TO_CODE[raw] ?? null;
}

/**
 * Terms to include in search so "NY" and "New York" both match, regardless of
 * whether the record stores a postal code or a full state name.
 */
export function stateSearchTerms(state: string | undefined): string {
  const raw = state?.trim() ?? "";
  const code = toStateCode(raw);
  if (!code) return raw;
  const name = STATE_CODE_TO_NAME[code] ?? "";
  return [raw, code, name].filter(Boolean).join(" ");
}

/** The region a facilitator's state falls in, or null when unknown/blank. */
export function regionForState(state: string | undefined): Region | null {
  const code = toStateCode(state);
  return code ? (REGION_BY_STATE_CODE[code] ?? null) : null;
}

/** e.g. "TX, OK, LA, AR" — shown under each region so the grouping is obvious. */
export function regionStateSummary(region: Region): string {
  return REGION_STATES[region].join(", ");
}
