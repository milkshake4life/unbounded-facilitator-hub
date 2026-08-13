import type { Facilitator, Pathway } from "../types";
import { regionForState, type Region } from "./regions";

/** Past UnboundEd events a facilitator may have led. */
export type EventFilter = "standards_institute" | "summit" | "in_service";

export const EVENT_FILTER_OPTIONS: {
  id: EventFilter;
  label: string;
  hint: string;
}[] = [
  {
    id: "standards_institute",
    label: "Standards Institute",
    hint: "National or local SI",
  },
  {
    id: "summit",
    label: "Summit",
    hint: "Facilitated a Summit",
  },
  {
    id: "in_service",
    label: "In-Service",
    hint: "In-service learning module",
  },
];

/**
 * Curated CORE / UnboundEd programs shown as filter/form chips.
 * Free-text intake answers stay on the record but are not listed as facets.
 */
export const KNOWN_PROGRAMS = [
  "OL&LA",
  "Cohorts",
  "Curriculum Adoption",
  "Curriculum Implementation",
  "GLEAM® Inventory / Learning Walks",
  "Math Leadership Collaborative (MLC)",
  "Math Identity Leadership Accelerator™ (MILA)",
] as const;

/** Collapse case / punctuation / spacing so near-duplicates compare equal. */
export function normalizeProgramKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[®™]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * True when a facilitator's program list includes `target`, including variants
 * like "GLEAM® Inventory/ Learning Walks" and prose that names the program.
 */
export function facilitatorHasProgram(
  programs: string[],
  target: string
): boolean {
  const needle = normalizeProgramKey(target);
  if (!needle) return false;
  return programs.some((p) => {
    const hay = normalizeProgramKey(p);
    if (!hay) return false;
    return hay === needle || hay.includes(needle);
  });
}

export interface FacilitatorFilters {
  /** Empty = any pathway. */
  pathways: Pathway[];
  /** Empty = any event history. Matched with OR within this list. */
  events: EventFilter[];
  /** Empty = any program. Matched with OR within this list. */
  programs: string[];
  /** Empty = anywhere. Matched with OR within this list. */
  regions: Region[];
}

export const EMPTY_FACILITATOR_FILTERS: FacilitatorFilters = {
  pathways: [],
  events: [],
  programs: [],
  regions: [],
};

export function countActiveFilters(f: FacilitatorFilters): number {
  return (
    f.pathways.length + f.events.length + f.programs.length + f.regions.length
  );
}

export function hasActiveFilters(f: FacilitatorFilters): boolean {
  return countActiveFilters(f) > 0;
}

export function matchesEvent(f: Facilitator, event: EventFilter): boolean {
  switch (event) {
    case "standards_institute":
      return f.standardsInstitute !== "no";
    case "summit":
      return f.facilitatedSummit;
    case "in_service":
      return f.facilitatedInService;
  }
}

export function matchesFacilitatorFilters(
  f: Facilitator,
  filters: FacilitatorFilters
): boolean {
  if (
    filters.pathways.length > 0 &&
    !filters.pathways.some((p) => f.pathways.includes(p))
  ) {
    return false;
  }
  if (
    filters.events.length > 0 &&
    !filters.events.some((e) => matchesEvent(f, e))
  ) {
    return false;
  }
  if (
    filters.programs.length > 0 &&
    !filters.programs.some((p) => facilitatorHasProgram(f.otherPrograms, p))
  ) {
    return false;
  }
  if (filters.regions.length > 0) {
    const region = regionForState(f.state);
    if (!region || !filters.regions.includes(region)) return false;
  }
  return true;
}

/**
 * Filter chips for programs. Only the curated list — unique survey sentences
 * and near-duplicates from intake are excluded.
 */
export function collectProgramOptions(_list?: Facilitator[]): string[] {
  return [...KNOWN_PROGRAMS].sort((a, b) => a.localeCompare(b));
}
