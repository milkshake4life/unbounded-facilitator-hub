import type {
  Availability,
  ComfortLevel,
  Facilitator,
  GradeBand,
  Pathway,
  ShirtSize,
  ShortNotice,
} from "../types";
import {
  AVAILABILITY_OPTIONS,
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
}

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
  { key: "currentEmployer", label: "Current employer", kind: "text", aliases: ["employer", "organization", "org", "company", "district", "school"] },
  { key: "jobTitle", label: "Job title", kind: "text", aliases: ["title", "job title", "role", "position"] },
  { key: "roleDescription", label: "Role & responsibilities", kind: "text", aliases: ["role description", "responsibilities", "job description"] },
  { key: "districtRelationships", label: "District relationships", kind: "text", aliases: ["district relationships", "relationships", "districts served", "partners"] },
  { key: "bio", label: "Bio", kind: "text", aliases: ["bio", "biography", "about"] },
  { key: "headshot", label: "Headshot URL", kind: "text", aliases: ["headshot", "photo", "picture", "image", "avatar"] },
  { key: "pathways", label: "Pathways / content areas", kind: "pathways", aliases: ["pathway", "pathways", "content area", "content areas", "subject", "subjects"] },
  { key: "gradeBands", label: "Grade bands", kind: "gradeBands", aliases: ["grade band", "grade bands", "grade level", "grade levels", "grades"] },
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

/**
 * Best-effort automatic mapping of sheet headers to fields. Scores every
 * field/column pair, then assigns greedily from the strongest match down — so
 * an exact match ("E-mail" → Personal email) always wins over a weaker partial
 * one ("E-mail" ⊂ "UnboundEd email").
 */
export function autoMap(header: string[]): ColumnMapping {
  const squashed = header.map(squash);
  const mapping = {} as ColumnMapping;
  for (const field of IMPORT_FIELDS) mapping[field.key] = -1;

  const pairs: { key: ImportFieldKey; idx: number; score: number }[] = [];
  for (const field of IMPORT_FIELDS) {
    squashed.forEach((h, idx) => {
      const score = headerScore(h, field);
      if (score > 0) pairs.push({ key: field.key, idx, score });
    });
  }
  pairs.sort((a, b) => b.score - a.score);

  const usedCols = new Set<number>();
  const assignedFields = new Set<ImportFieldKey>();
  for (const p of pairs) {
    if (assignedFields.has(p.key) || usedCols.has(p.idx)) continue;
    mapping[p.key] = p.idx;
    assignedFields.add(p.key);
    usedCols.add(p.idx);
  }
  return mapping;
}

function splitMulti(value: string): string[] {
  return value
    .split(/[,;/\n|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
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

function toGradeBands(value: string): GradeBand[] {
  const out = new Set<GradeBand>();
  for (const tok of splitMulti(value)) {
    const matched = matchEnum(tok.replace(/\s/g, ""), GRADE_BANDS);
    if (matched) out.add(matched);
  }
  return [...out];
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

  rows.forEach((row, i) => {
    const rowNum = i + 2; // +1 for header, +1 for 1-based
    const firstName = cell(row, mapping.firstName);
    const lastName = cell(row, mapping.lastName);

    if (!firstName && !lastName) return; // silently skip fully-blank rows
    if (!firstName || !lastName) {
      skipped.push({ row: rowNum, reason: "Missing first or last name" });
      return;
    }

    const gradeBands = mapping.gradeBands >= 0 ? toGradeBands(cell(row, mapping.gradeBands)) : [];
    const comfortByGradeBand: Partial<Record<GradeBand, ComfortLevel>> = {};
    for (const g of gradeBands) comfortByGradeBand[g] = "fine";

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
      emergencyContactName: "",
      emergencyContactNumber: "",
      hasPolo: mapping.hasPolo >= 0 ? toBoolean(cell(row, mapping.hasPolo)) : false,
      poloStyle: "Unisex Cut",
      shirtSize,
      pathways: mapping.pathways >= 0 ? toPathways(cell(row, mapping.pathways)) : [],
      gradeBands,
      comfortByGradeBand,
      standardsInstitute: "no",
      facilitatedSummit: mapping.facilitatedSummit >= 0 ? toBoolean(cell(row, mapping.facilitatedSummit)) : false,
      facilitatedInService: mapping.facilitatedInService >= 0 ? toBoolean(cell(row, mapping.facilitatedInService)) : false,
      otherPrograms: [],
      availability,
      availableShortNotice:
        mapping.availableShortNotice >= 0 ? toShortNotice(cell(row, mapping.availableShortNotice)) : "Maybe",
      currentEmployer: cell(row, mapping.currentEmployer) || "Independent Consultant",
      jobTitle: cell(row, mapping.jobTitle) || "Facilitator",
      roleDescription: cell(row, mapping.roleDescription),
      districtRelationships: cell(row, mapping.districtRelationships),
      bio: cell(row, mapping.bio),
      headshot: cell(row, mapping.headshot),
      status: "active",
      joinedDate: new Date().toISOString().slice(0, 10),
    });
  });

  return { records, skipped };
}
