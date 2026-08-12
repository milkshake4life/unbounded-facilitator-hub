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
 * Curated CORE / UnboundEd programs. Live data may include others — those are
 * merged in at filter time from facilitator records.
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
    !filters.programs.some((p) => f.otherPrograms.includes(p))
  ) {
    return false;
  }
  if (filters.regions.length > 0) {
    const region = regionForState(f.state);
    if (!region || !filters.regions.includes(region)) return false;
  }
  return true;
}

/** Known programs plus any extras present in the current directory. */
export function collectProgramOptions(list: Facilitator[]): string[] {
  const set = new Set<string>(KNOWN_PROGRAMS);
  for (const f of list) {
    for (const p of f.otherPrograms) {
      const trimmed = p.trim();
      if (trimmed) set.add(trimmed);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
