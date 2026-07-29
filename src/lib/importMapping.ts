import type {
  Availability,
  ComfortLevel,
  Facilitator,
  GradeBand,
  Pathway,
  ShirtSize,
  ShortNotice,
  StandardsInstituteExperience,
} from "../types";
import {
  AVAILABILITY_OPTIONS,
  COMFORT_LABELS,
  GRADE_BANDS,
  PATHWAYS,
  SHIRT_SIZES,
} from "../types";

/** Facilitator fields that can be populated from a spreadsheet column. */
export type ImportFieldKey =
  | "firstName"
  | "lastName"
  | "unboundedEmail"
  | "personalEmail"
  | "cellPhone"
  | "streetAddress"
  | "city"
  | "state"
  | "zipCode"
  | "currentEmployer"
  | "jobTitle"
  | "roleDescription"
  | "districtRelationships"
  | "bio"
  | "headshot"
  | "pathways"
  | "gradeBands"
  | "comfortK5"
  | "comfort68"
  | "comfort912"
  | "comfort612"
  | "standardsInstitute"
  | "otherPrograms"
  | "emergencyContactName"
  | "emergencyContactNumber"
  | "availability"
  | "availableShortNotice"
  | "shirtSize"
  | "hasPolo"
  | "facilitatedSummit"
  | "facilitatedInService";

type FieldKind =
  | "text"
  | "pathways"
  | "gradeBands"
  | "comfort"
  | "standardsInstitute"
  | "otherPrograms"
  | "availability"
  | "shortNotice"
  | "shirtSize"
  | "boolean";

export interface ImportFieldDef {
  key: ImportFieldKey;
  label: string;
  kind: FieldKind;
  required?: boolean;
  /** Lower-cased header fragments used to auto-detect the matching column. */
  aliases: string[];
  /**
   * If the squashed header contains any of these, refuse the match — used to
   * keep the grade-bands list column from stealing comfort-grid columns.
   */
  rejectIfIncludes?: string[];
}

/** Import field key → the Facilitator property it populates (for merge overlays). */
const FIELD_TO_FACILITATOR: Partial<Record<ImportFieldKey, keyof Facilitator>> = {
  firstName: "firstName",
  lastName: "lastName",
  unboundedEmail: "unboundedEmail",
  personalEmail: "personalEmail",
  cellPhone: "cellPhone",
  streetAddress: "streetAddress",
  city: "city",
  state: "state",
  zipCode: "zipCode",
  currentEmployer: "currentEmployer",
  jobTitle: "jobTitle",
  roleDescription: "roleDescription",
  districtRelationships: "districtRelationships",
  bio: "bio",
  headshot: "headshot",
  pathways: "pathways",
  gradeBands: "gradeBands",
  comfortK5: "comfortByGradeBand",
  comfort68: "comfortByGradeBand",
  comfort912: "comfortByGradeBand",
  comfort612: "comfortByGradeBand",
  standardsInstitute: "standardsInstitute",
  otherPrograms: "otherPrograms",
  emergencyContactName: "emergencyContactName",
  emergencyContactNumber: "emergencyContactNumber",
  availability: "availability",
  availableShortNotice: "availableShortNotice",
  shirtSize: "shirtSize",
  hasPolo: "hasPolo",
  facilitatedSummit: "facilitatedSummit",
  facilitatedInService: "facilitatedInService",
};

const COMFORT_FIELD_BY_BAND: Record<GradeBand, ImportFieldKey> = {
  "K-5": "comfortK5",
  "6-8": "comfort68",
  "9-12": "comfort912",
  "6-12": "comfort612",
};

export const IMPORT_FIELDS: ImportFieldDef[] = [
  { key: "firstName", label: "First name", kind: "text", required: true, aliases: ["first name", "firstname", "first"] },
  { key: "lastName", label: "Last name", kind: "text", required: true, aliases: ["last name", "lastname", "last", "surname"] },
  { key: "unboundedEmail", label: "UnboundEd email", kind: "text", aliases: ["unbounded email", "unboundedemail", "work email", "org email"] },
  { key: "personalEmail", label: "Personal email", kind: "text", aliases: ["personal email", "email address", "email", "e-mail"] },
  { key: "cellPhone", label: "Cell phone", kind: "text", aliases: ["cell", "phone", "mobile", "cell phone", "telephone"] },
  { key: "streetAddress", label: "Street address", kind: "text", aliases: ["street", "address", "mailing address"] },
  { key: "city", label: "City", kind: "text", aliases: ["city", "town"] },
  { key: "state", label: "State", kind: "text", aliases: ["state", "province"] },
  { key: "zipCode", label: "Zip code", kind: "text", aliases: ["zip", "postal", "zip code", "postcode"] },
  {
    key: "emergencyContactName",
    label: "Emergency contact name",
    kind: "text",
    aliases: [
      "emergency contact name",
      "emergency contact",
      "emergency name",
      "emergencycontactname",
      "ice name",
      "in case of emergency name",
    ],
  },
  {
    key: "emergencyContactNumber",
    label: "Emergency contact phone",
    kind: "text",
    aliases: [
      "emergency contact number",
      "emergency contact phone",
      "emergency phone",
      "emergency number",
      "emergencycontactnumber",
      "ice phone",
      "ice number",
      "in case of emergency phone",
      "in case of emergency number",
    ],
  },
  { key: "currentEmployer", label: "Current employer", kind: "text", aliases: ["employer", "organization", "org", "company", "district", "school"] },
  { key: "jobTitle", label: "Job title", kind: "text", aliases: ["title", "job title", "role", "position"] },
  { key: "roleDescription", label: "Role & responsibilities", kind: "text", aliases: ["role description", "responsibilities", "job description"] },
  { key: "districtRelationships", label: "District relationships", kind: "text", aliases: ["district relationships", "relationships", "districts served", "partners"] },
  { key: "bio", label: "Biography", kind: "text", aliases: ["bio", "biography", "about", "current bio"] },
  { key: "headshot", label: "Headshot URL", kind: "text", aliases: ["headshot", "photo", "picture", "image", "avatar"] },
  { key: "pathways", label: "Pathways / content areas", kind: "pathways", aliases: ["pathway", "pathways", "content area", "content areas", "subject", "subjects"] },
  {
    key: "gradeBands",
    label: "Grade bands",
    kind: "gradeBands",
    aliases: ["grade band", "grade bands", "grade level", "grade levels", "grades"],
    // Comfort-grid columns often include these words — don't steal them for the list field.
    rejectIfIncludes: ["comfort", "nerd"],
  },
  {
    key: "comfortK5",
    label: "Comfort — K-5",
    kind: "comfort",
    // Soft words like "elementary" are handled in autoMap pass 1 only.
    aliases: ["k-5", "k 5", "[k-5]"],
  },
  {
    key: "comfort68",
    label: "Comfort — 6-8",
    kind: "comfort",
    aliases: ["6-8", "6 8", "[6-8]"],
  },
  {
    key: "comfort912",
    label: "Comfort — 9-12",
    kind: "comfort",
    aliases: ["9-12", "9 12", "[9-12]"],
  },
  {
    key: "comfort612",
    label: "Comfort — 6-12",
    kind: "comfort",
    aliases: ["6-12", "6 12", "[6-12]"],
  },
  {
    key: "standardsInstitute",
    label: "Standards Institute (National/Local)",
    kind: "standardsInstitute",
    aliases: [
      "standards institute",
      "unbounded standards institute",
      "facilitated an unbounded standards",
      "si experience",
    ],
  },
  {
    key: "otherPrograms",
    label: "Other UnboundEd / CORE programs",
    kind: "otherPrograms",
    aliases: [
      "other unbounded or core",
      "other unbounded",
      "core programs",
      "other programs",
      "other programs you have",
    ],
  },
  { key: "availability", label: "Availability", kind: "availability", aliases: ["availability", "available"] },
  { key: "availableShortNotice", label: "Available on short notice", kind: "shortNotice", aliases: ["short notice", "on short notice"] },
  { key: "shirtSize", label: "Shirt size", kind: "shirtSize", aliases: ["shirt size", "tshirt", "t-shirt", "shirt"] },
  { key: "hasPolo", label: "Has polo", kind: "boolean", aliases: ["has polo", "polo"] },
  { key: "facilitatedSummit", label: "Facilitated a Summit", kind: "boolean", aliases: ["summit"] },
  { key: "facilitatedInService", label: "Facilitated in-service", kind: "boolean", aliases: ["in-service", "in service", "inservice"] },
];

/** Column index chosen for each field (`-1` = not mapped). */
export type ColumnMapping = Record<ImportFieldKey, number>;

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Collapse to letters/numbers only, so "E-mail" and "Email" both become "email". */
function squash(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function headerScore(headerSquashed: string, field: ImportFieldDef): number {
  if (!headerSquashed) return 0;
  if (field.rejectIfIncludes?.some((r) => headerSquashed.includes(squash(r)))) {
    return 0;
  }
  let best = 0;
  for (const alias of field.aliases) {
    const a = squash(alias);
    if (!a) continue;
    let score = 0;
    if (headerSquashed === a) score = 3;
    else if (headerSquashed.includes(a) || a.includes(headerSquashed)) score = 2;
    if (score > best) best = score;
  }
  return best;
}

/** All grade-band tokens present in a squashed header (for multi-band detection). */
function allBandsInHeader(headerSquashed: string): GradeBand[] {
  const found: GradeBand[] = [];
  if (/(?:^|[^0-9])612(?:[^0-9]|$)/.test(headerSquashed) || headerSquashed.includes("6to12"))
    found.push("6-12");
  if (/(?:^|[^0-9])912(?:[^0-9]|$)/.test(headerSquashed) || headerSquashed.includes("9to12") || headerSquashed.includes("highschool"))
    found.push("9-12");
  if (/(?:^|[^0-9])68(?:[^0-9]|$)/.test(headerSquashed) || headerSquashed.includes("6to8") || headerSquashed.includes("middleschool"))
    found.push("6-8");
  if (headerSquashed.includes("k5") || headerSquashed.includes("kto5") || headerSquashed.includes("elementary"))
    found.push("K-5");
  return found;
}

/** Google Forms grid exports use "Question [K-5]" — prefer the bracket label. */
function bandFromBrackets(header: string): GradeBand | null {
  const m = header.match(/\[([^\]]+)\]/);
  if (!m) return null;
  return toGradeBandToken(m[1]);
}

/**
 * Best-effort automatic mapping of sheet headers to fields. Scores every
 * field/column pair, then assigns greedily from the strongest match down — so
 * an exact match ("E-mail" → Personal email) always wins over a weaker partial
 * one ("E-mail" ⊂ "UnboundEd email").
 *
 * Comfort-grid columns (Google Forms export: "Question [K-5]") are detected
 * by grade-band tokens in the header and assigned to the matching comfort field.
 */
export function autoMap(header: string[]): ColumnMapping {
  const squashed = header.map(squash);
  const mapping = {} as ColumnMapping;
  for (const field of IMPORT_FIELDS) mapping[field.key] = -1;

  const usedCols = new Set<number>();
  const assignedFields = new Set<ImportFieldKey>();

  // Pass 1: pin comfort-grid columns. Prefer "[K-5]" bracket labels from Google
  // Forms; otherwise require exactly one band token so a "K-5 / 6-8 / 9-12"
  // list header is not treated as a single comfort column.
  header.forEach((raw, idx) => {
    const h = squashed[idx] ?? "";
    const fromBracket = bandFromBrackets(raw);
    const bands = fromBracket ? [fromBracket] : allBandsInHeader(h);
    if (bands.length !== 1) return;

    const looksLikeComfort =
      Boolean(fromBracket) ||
      h.includes("comfort") ||
      h.includes("nerd") ||
      h.includes("facilitate") ||
      GRADE_BANDS.some((g) => squash(g) === h);
    if (!looksLikeComfort) return;

    const key = COMFORT_FIELD_BY_BAND[bands[0]];
    if (assignedFields.has(key) || usedCols.has(idx)) return;
    mapping[key] = idx;
    assignedFields.add(key);
    usedCols.add(idx);
  });

  const pairs: { key: ImportFieldKey; idx: number; score: number }[] = [];
  for (const field of IMPORT_FIELDS) {
    if (assignedFields.has(field.key)) continue;
    squashed.forEach((h, idx) => {
      if (usedCols.has(idx)) return;
      const score = headerScore(h, field);
      if (score > 0) pairs.push({ key: field.key, idx, score });
    });
  }
  pairs.sort((a, b) => b.score - a.score);

  for (const p of pairs) {
    if (assignedFields.has(p.key) || usedCols.has(p.idx)) continue;
    mapping[p.key] = p.idx;
    assignedFields.add(p.key);
    usedCols.add(p.idx);
  }
  return mapping;
}

/** Facilitator keys that were sourced from at least one mapped sheet column. */
export function mappedFacilitatorKeys(mapping: ColumnMapping): (keyof Facilitator)[] {
  const keys = new Set<keyof Facilitator>();
  for (const field of IMPORT_FIELDS) {
    if (mapping[field.key] < 0) continue;
    const fk = FIELD_TO_FACILITATOR[field.key];
    if (fk) keys.add(fk);
  }
  // Comfort columns also imply gradeBands when derived from the grid.
  if (
    mapping.comfortK5 >= 0 ||
    mapping.comfort68 >= 0 ||
    mapping.comfort912 >= 0 ||
    mapping.comfort612 >= 0
  ) {
    keys.add("gradeBands");
    keys.add("comfortByGradeBand");
  }
  return [...keys];
}

function splitMulti(value: string): string[] {
  return value
    .split(/[,;/\n|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Split free-text "other programs" without breaking names that contain `/`. */
function splitPrograms(value: string): string[] {
  const parts = value
    .split(/[,;\n|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts;
}

function matchEnum<T extends string>(token: string, options: readonly T[]): T | null {
  const t = norm(token);
  for (const opt of options) if (norm(opt) === t) return opt;
  for (const opt of options) {
    const o = norm(opt);
    if (o.includes(t) || t.includes(o)) return opt;
  }
  return null;
}

function toPathways(value: string): Pathway[] {
  const out = new Set<Pathway>();
  for (const tok of splitMulti(value)) {
    const t = norm(tok);
    let matched = matchEnum(tok, PATHWAYS);
    if (!matched) {
      if (t.includes("ela") || t.includes("english") || t.includes("literacy") || t.includes("reading"))
        matched = "English Language Arts";
      else if (t.includes("math")) matched = "Mathematics";
      else if (t.includes("lead")) matched = "Leadership";
      else if (t.includes("plan")) matched = "UnboundEd Planning Process";
    }
    if (matched) out.add(matched);
  }
  return [...out];
}

function toGradeBandToken(token: string): GradeBand | null {
  const compact = squash(token);
  if (!compact) return null;

  const direct = matchEnum(token.replace(/\s/g, ""), GRADE_BANDS);
  if (direct) return direct;

  if (compact.includes("612") || compact.includes("6to12") || compact.includes("6through12"))
    return "6-12";
  if (
    compact.includes("912") ||
    compact.includes("9to12") ||
    compact.includes("9through12") ||
    compact.includes("highschool") ||
    /\bhs\b/.test(norm(token))
  )
    return "9-12";
  if (
    compact.includes("68") ||
    compact.includes("6to8") ||
    compact.includes("6through8") ||
    compact.includes("middleschool") ||
    compact.includes("middle")
  )
    return "6-8";
  if (
    compact.includes("k5") ||
    compact.includes("kto5") ||
    compact.includes("elementary") ||
    compact.includes("primary")
  )
    return "K-5";

  return null;
}

function toGradeBands(value: string): GradeBand[] {
  const out = new Set<GradeBand>();
  for (const tok of splitMulti(value)) {
    const matched = toGradeBandToken(tok);
    if (matched) out.add(matched);
  }
  // Also try the whole cell once in case it's "K-5 and 6-8" without commas.
  if (out.size === 0) {
    const whole = toGradeBandToken(value);
    if (whole) out.add(whole);
    for (const g of GRADE_BANDS) {
      if (squash(value).includes(squash(g))) out.add(g);
    }
  }
  return [...out];
}

function toComfort(value: string): ComfortLevel | null {
  const t = norm(value);
  if (!t) return null;

  // Exact / near-exact labels from the Google Form.
  for (const [level, label] of Object.entries(COMFORT_LABELS) as [ComfortLevel, string][]) {
    if (norm(label) === t || squash(label) === squash(value)) return level;
  }

  if (t.includes("nerd")) return "nerd_out";
  if (
    t.includes("do not want") ||
    t.includes("dont want") ||
    t.includes("don't want") ||
    t.includes("avoid") ||
    t.includes("not want to facilitate")
  )
    return "avoid";
  if (t.includes("fine") || t === "ok" || t === "okay") return "fine";

  if (t === "nerd out" || t === "nerd_out") return "nerd_out";
  return null;
}

function toStandardsInstitute(value: string): StandardsInstituteExperience {
  const t = norm(value);
  if (!t) return "no";

  const hasNational = t.includes("national");
  const hasLocal = t.includes("local");
  if (hasNational && hasLocal) return "both";
  if (hasNational) return "national";
  if (hasLocal) return "local";
  if (t.includes("both")) return "both";

  if (
    t === "no" ||
    t === "n" ||
    t === "none" ||
    t === "neither" ||
    t.startsWith("no ") ||
    t === "false"
  )
    return "no";

  // Bare "yes" without national/local — treat as both (unknown which).
  if (t === "yes" || t === "y" || t === "true") return "both";

  return "no";
}

function toBoolean(value: string): boolean {
  const t = norm(value);
  return ["yes", "y", "true", "1", "x", "checked"].includes(t);
}

function toShortNotice(value: string): ShortNotice {
  const t = norm(value);
  if (t.startsWith("y")) return "Yes";
  if (t.startsWith("n")) return "No";
  return "Maybe";
}

export interface BuildResult {
  records: Facilitator[];
  /** Row numbers (1-based, excluding header) that were skipped, with reasons. */
  skipped: { row: number; reason: string }[];
  /** Facilitator keys populated from mapped columns (for merge overlays). */
  overlayKeys: (keyof Facilitator)[];
}

function cell(row: string[], idx: number): string {
  return idx >= 0 ? (row[idx] ?? "").trim() : "";
}

/** Turn mapped rows into fully-defaulted Facilitator records. */
export function buildFacilitators(
  rows: string[][],
  mapping: ColumnMapping
): BuildResult {
  const records: Facilitator[] = [];
  const skipped: { row: number; reason: string }[] = [];
  const overlayKeys = mappedFacilitatorKeys(mapping);

  rows.forEach((row, i) => {
    const rowNum = i + 2; // +1 for header, +1 for 1-based
    const firstName = cell(row, mapping.firstName);
    const lastName = cell(row, mapping.lastName);

    if (!firstName && !lastName) return; // silently skip fully-blank rows
    if (!firstName || !lastName) {
      skipped.push({ row: rowNum, reason: "Missing first or last name" });
      return;
    }

    const comfortByGradeBand: Partial<Record<GradeBand, ComfortLevel>> = {};
    for (const band of GRADE_BANDS) {
      const fieldKey = COMFORT_FIELD_BY_BAND[band];
      const idx = mapping[fieldKey];
      if (idx < 0) continue;
      const comfort = toComfort(cell(row, idx));
      if (comfort) comfortByGradeBand[band] = comfort;
    }

    const listedBands =
      mapping.gradeBands >= 0 ? toGradeBands(cell(row, mapping.gradeBands)) : [];

    // Prefer comfort-grid answers for which bands apply; fall back to the list
    // column. Bands listed without a comfort answer default to "fine".
    const gradeBandSet = new Set<GradeBand>([
      ...Object.keys(comfortByGradeBand) as GradeBand[],
      ...listedBands,
    ]);
    // If they marked "avoid", still keep the band so the preference is visible.
    const gradeBands = GRADE_BANDS.filter((g) => gradeBandSet.has(g));

    for (const g of gradeBands) {
      if (!comfortByGradeBand[g]) comfortByGradeBand[g] = "fine";
    }

    const availabilityRaw = cell(row, mapping.availability);
    const availability: Availability =
      (mapping.availability >= 0 && matchEnum(availabilityRaw, AVAILABILITY_OPTIONS)) ||
      "Flexibility throughout the year";

    const shirtRaw = cell(row, mapping.shirtSize);
    const shirtSize: ShirtSize =
      (mapping.shirtSize >= 0 && matchEnum(shirtRaw.toUpperCase(), SHIRT_SIZES)) || "M";

    const slug = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z0-9.]/g, "");
    const id = `imp-${slug || "row"}-${Math.random().toString(36).slice(2, 8)}`;

    records.push({
      id,
      firstName,
      lastName,
      unboundedEmail: cell(row, mapping.unboundedEmail),
      personalEmail: cell(row, mapping.personalEmail),
      streetAddress: cell(row, mapping.streetAddress),
      city: cell(row, mapping.city),
      state: cell(row, mapping.state).toUpperCase(),
      zipCode: cell(row, mapping.zipCode),
      cellPhone: cell(row, mapping.cellPhone),
      emergencyContactName: cell(row, mapping.emergencyContactName),
      emergencyContactNumber: cell(row, mapping.emergencyContactNumber),
      hasPolo: mapping.hasPolo >= 0 ? toBoolean(cell(row, mapping.hasPolo)) : false,
      poloStyle: "Unisex Cut",
      shirtSize,
      pathways: mapping.pathways >= 0 ? toPathways(cell(row, mapping.pathways)) : [],
      gradeBands,
      comfortByGradeBand,
      standardsInstitute:
        mapping.standardsInstitute >= 0
          ? toStandardsInstitute(cell(row, mapping.standardsInstitute))
          : "no",
      facilitatedSummit: mapping.facilitatedSummit >= 0 ? toBoolean(cell(row, mapping.facilitatedSummit)) : false,
      facilitatedInService: mapping.facilitatedInService >= 0 ? toBoolean(cell(row, mapping.facilitatedInService)) : false,
      otherPrograms:
        mapping.otherPrograms >= 0 ? splitPrograms(cell(row, mapping.otherPrograms)) : [],
      availability,
      availableShortNotice:
        mapping.availableShortNotice >= 0 ? toShortNotice(cell(row, mapping.availableShortNotice)) : "Maybe",
      currentEmployer: cell(row, mapping.currentEmployer) || "Independent Consultant",
      jobTitle: cell(row, mapping.jobTitle) || "Facilitator",
      roleDescription: cell(row, mapping.roleDescription),
      districtRelationships: cell(row, mapping.districtRelationships),
      bio: cell(row, mapping.bio),
      bioGeneratedByAi: false,
      headshot: cell(row, mapping.headshot),
      status: "active",
      joinedDate: new Date().toISOString().slice(0, 10),
    });
  });

  return { records, skipped, overlayKeys };
}
