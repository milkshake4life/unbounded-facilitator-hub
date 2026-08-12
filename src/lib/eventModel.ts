import type {
  BookingEvent,
  EventPlacement,
  EventSection,
  Facilitator,
  GradeBand,
  Pathway,
  PlacementStage,
} from "../types";

/* ---- Stage ordering ---- */

const STAGE_ORDER: Record<PlacementStage, number> = {
  proposed: 0,
  availability: 1,
  hold: 2,
  confirmed: 3,
  contracted: 4,
};

export function stageRank(stage: PlacementStage): number {
  return STAGE_ORDER[stage] ?? 0;
}

/** True when a placement has reached `min` or moved past it. */
export function stageAtLeast(
  stage: PlacementStage,
  min: PlacementStage
): boolean {
  return stageRank(stage) >= stageRank(min);
}

/* ---- Factories ---- */

export function createSection(
  pathwayId: string,
  name: string,
  seatsNeeded = 0,
  date = "",
  notes = ""
): EventSection {
  return { id: crypto.randomUUID(), pathwayId, name, seatsNeeded, date, notes };
}

export function createPlacement(
  facilitatorId: string,
  pathwayId: string,
  sectionId: string,
  stage: PlacementStage = "proposed",
  notes = ""
): EventPlacement {
  return {
    id: crypto.randomUUID(),
    facilitatorId,
    pathwayId,
    sectionId,
    stage,
    dropped: false,
    dropReason: "",
    notes,
  };
}

/* ---- Lookups ---- */

export function sectionsForPathway(
  event: BookingEvent,
  pathwayId: string
): EventSection[] {
  return event.sections.filter((s) => s.pathwayId === pathwayId);
}

export function placementsForSection(
  event: BookingEvent,
  sectionId: string
): EventPlacement[] {
  return event.placements.filter((p) => p.sectionId === sectionId);
}

/** Placements whose section was deleted — surfaced so nobody silently vanishes. */
export function unassignedPlacements(event: BookingEvent): EventPlacement[] {
  const known = new Set(event.sections.map((s) => s.id));
  return event.placements.filter((p) => !known.has(p.sectionId));
}

/* ---- Staffing math ---- */

export interface StaffingCounts {
  seatsNeeded: number;
  /** Placements that still count toward the seat, i.e. not dropped. */
  assigned: number;
  openSeats: number;
  held: number;
  confirmed: number;
  dropped: number;
}

function tally(placements: EventPlacement[], seatsNeeded: number): StaffingCounts {
  const live = placements.filter((p) => !p.dropped);
  return {
    seatsNeeded,
    assigned: live.length,
    openSeats: Math.max(0, seatsNeeded - live.length),
    held: live.filter((p) => p.stage === "hold").length,
    confirmed: live.filter((p) => stageAtLeast(p.stage, "confirmed")).length,
    dropped: placements.filter((p) => p.dropped).length,
  };
}

export function sectionStaffing(
  event: BookingEvent,
  section: EventSection
): StaffingCounts {
  return tally(placementsForSection(event, section.id), section.seatsNeeded);
}

export function pathwayStaffing(
  event: BookingEvent,
  pathwayId: string
): StaffingCounts {
  const sections = sectionsForPathway(event, pathwayId);
  const ids = new Set(sections.map((s) => s.id));
  const seats = sections.reduce((sum, s) => sum + s.seatsNeeded, 0);
  return tally(
    event.placements.filter((p) => ids.has(p.sectionId)),
    seats
  );
}

export function eventStaffing(event: BookingEvent): StaffingCounts {
  const seats = event.sections.reduce((sum, s) => sum + s.seatsNeeded, 0);
  return tally(event.placements, seats);
}

/* ---- Bulk stage moves ---- */

/** Set `stage` on the given placements, leaving dropped ones untouched. */
export function setPlacementStages(
  event: BookingEvent,
  placementIds: string[],
  stage: PlacementStage
): BookingEvent {
  const targets = new Set(placementIds);
  return {
    ...event,
    placements: event.placements.map((p) =>
      targets.has(p.id) && !p.dropped ? { ...p, stage } : p
    ),
    updatedAt: Date.now(),
  };
}

/* ---- Suggested next step ---- */

export type EventActionKind =
  | "add_pathway"
  | "add_section"
  | "assign"
  | "mark_likely"
  | "send_holds"
  | "mark_contracted"
  | "confirm_holds"
  | "request_contracts"
  | "mark_delivered"
  | "none";

export interface EventNextStep {
  title: string;
  detail: string;
  actionLabel: string | null;
  kind: EventActionKind;
  /** Placements a bulk stage move would touch. */
  placementIds: string[];
}

const NO_PLACEMENTS: string[] = [];

/**
 * The single most useful thing to do next, derived from the event stage and
 * how far along each facilitator is. Drives the banner on the event page.
 */
export function eventNextStep(event: BookingEvent): EventNextStep {
  const staffing = eventStaffing(event);
  const live = event.placements.filter((p) => !p.dropped);

  if (event.pathways.length === 0) {
    return {
      title: "Start with a pathway",
      detail:
        "Add the pathways this event will run, then break each one into sections before placing facilitators.",
      actionLabel: "Add pathway",
      kind: "add_pathway",
      placementIds: NO_PLACEMENTS,
    };
  }

  if (event.sections.length === 0) {
    return {
      title: "Add sections to your pathways",
      detail:
        "Sections are the seats you staff. Give each one the number of facilitators it needs.",
      actionLabel: "Add section",
      kind: "add_section",
      placementIds: NO_PLACEMENTS,
    };
  }

  switch (event.stage) {
    case "prospective":
      return {
        title: "Planning stage",
        detail:
          "Keep shaping pathways and sections. Once this booking is likely enough to staff, start securing facilitators and sending calendar holds.",
        actionLabel: "Start securing facilitators",
        kind: "mark_likely",
        placementIds: NO_PLACEMENTS,
      };

    case "likely": {
      if (staffing.openSeats > 0) {
        return {
          title: `${staffing.openSeats} ${staffing.openSeats === 1 ? "seat is" : "seats are"} still open`,
          detail:
            "Secure a facilitator for every seat, then send each of them a calendar hold.",
          actionLabel: "Assign facilitators",
          kind: "assign",
          placementIds: NO_PLACEMENTS,
        };
      }
      const needHold = live.filter((p) => !stageAtLeast(p.stage, "hold"));
      if (needHold.length > 0) {
        return {
          title: `Send calendar holds to ${needHold.length} ${needHold.length === 1 ? "facilitator" : "facilitators"}`,
          detail:
            "Every seat is filled. Send each facilitator a calendar HOLD so the date is protected while the contract is negotiated.",
          actionLabel: "Mark holds sent",
          kind: "send_holds",
          placementIds: needHold.map((p) => p.id),
        };
      }
      return {
        title: "Everyone is holding the date",
        detail:
          "Nothing to chase until the client contract is signed. That's when holds become confirms.",
        actionLabel: "Contract signed",
        kind: "mark_contracted",
        placementIds: NO_PLACEMENTS,
      };
    }

    case "contracted": {
      const needConfirm = live.filter(
        (p) => !stageAtLeast(p.stage, "confirmed")
      );
      if (needConfirm.length > 0) {
        return {
          title: `Turn ${needConfirm.length} ${needConfirm.length === 1 ? "hold" : "holds"} into confirms`,
          detail:
            "The contract is signed. Ask each facilitator to reconfirm they're still available, then convert their calendar HOLD to a CONFIRM.",
          actionLabel: "Mark confirmed",
          kind: "confirm_holds",
          placementIds: needConfirm.map((p) => p.id),
        };
      }
      const needContract = live.filter((p) => p.stage !== "contracted");
      if (needContract.length > 0) {
        return {
          title: `Request ${needContract.length} facilitator ${needContract.length === 1 ? "contract" : "contracts"}`,
          detail:
            "Everyone has confirmed. Request a contract for each facilitator to close out staffing.",
          actionLabel: "Mark contracts requested",
          kind: "request_contracts",
          placementIds: needContract.map((p) => p.id),
        };
      }
      if (staffing.openSeats > 0) {
        return {
          title: `${staffing.openSeats} ${staffing.openSeats === 1 ? "seat needs" : "seats need"} backfilling`,
          detail:
            "Staffing is confirmed for everyone placed, but some seats are still empty.",
          actionLabel: "Assign facilitators",
          kind: "assign",
          placementIds: NO_PLACEMENTS,
        };
      }
      return {
        title: "Fully staffed and contracted",
        detail: "Nothing outstanding. Mark the event delivered once it runs.",
        actionLabel: "Mark delivered",
        kind: "mark_delivered",
        placementIds: NO_PLACEMENTS,
      };
    }

    default:
      return {
        title: "Delivered",
        detail: "This event has run. Staffing is kept here as history.",
        actionLabel: null,
        kind: "none",
        placementIds: NO_PLACEMENTS,
      };
  }
}

/* ---- Matching directory facilitators to a pathway ---- */

const PATHWAY_PATTERNS: [RegExp, Pathway][] = [
  [/\b(ela|english|literacy|reading|writing)\b/i, "English Language Arts"],
  [/\bmath(ematics)?\b/i, "Mathematics"],
  [/\blead(er|ership)?\b/i, "Leadership"],
  [
    /\b(upp|unbounded planning process|planning process)\b/i,
    "UnboundEd Planning Process",
  ],
];

const BAND_PATTERNS: [RegExp, GradeBand[]][] = [
  [/k\s*[-–]\s*12/i, ["K-5", "6-8", "9-12", "6-12"]],
  [/6\s*[-–]\s*12/, ["6-12", "6-8", "9-12"]],
  [/k\s*[-–]\s*5/i, ["K-5"]],
  [/6\s*[-–]\s*8/, ["6-8"]],
  [/9\s*[-–]\s*12/, ["9-12"]],
];

/** Read "Math K-5" as the directory pathway plus the grade bands it covers. */
export function parsePathwayLabel(name: string): {
  pathway: Pathway | null;
  bands: GradeBand[];
} {
  const pathway =
    PATHWAY_PATTERNS.find(([test]) => test.test(name))?.[1] ?? null;
  const bands = new Set<GradeBand>();
  for (const [test, matched] of BAND_PATTERNS) {
    if (test.test(name)) matched.forEach((b) => bands.add(b));
  }
  return { pathway, bands: [...bands] };
}

export interface FacilitatorMatch {
  score: number;
  /** Short chips explaining the match, e.g. "Mathematics", "K-5". */
  reasons: string[];
  /** They told us they do not want to facilitate this grade band. */
  avoids: boolean;
}

/**
 * Rank a directory facilitator against a pathway label so the assign modal can
 * lead with people who actually teach that content and grade band.
 */
export function matchFacilitator(
  facilitator: Facilitator,
  pathwayName: string
): FacilitatorMatch {
  const { pathway, bands } = parsePathwayLabel(pathwayName);
  const reasons: string[] = [];
  let score = 0;
  let avoids = false;

  if (pathway && facilitator.pathways.includes(pathway)) {
    score += 3;
    reasons.push(pathway);
  }

  const overlap = bands.filter((b) => facilitator.gradeBands.includes(b));
  if (overlap.length > 0) {
    score += 2;
    reasons.push(overlap[0]);
  }

  const comforts = overlap
    .map((b) => facilitator.comfortByGradeBand[b])
    .filter(Boolean);
  if (comforts.includes("nerd_out")) {
    score += 2;
    reasons.push("Nerds out for this");
  }
  if (comforts.length > 0 && comforts.every((c) => c === "avoid")) {
    score -= 5;
    avoids = true;
  }

  return { score, reasons, avoids };
}
