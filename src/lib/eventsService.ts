import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  BookingEvent,
  EventPathway,
  EventPlacement,
  EventSection,
  EventStage,
  PlacementStage,
} from "../types";
import { EVENT_STAGES, PLACEMENT_STAGES } from "../types";

const COLLECTION = "events";

/**
 * Docs written before the staffing board stored a flat placement list with a
 * free-text pathway/section and four independent booleans.
 */
interface LegacyFields {
  eventConfirmed?: boolean;
  pathway?: string;
  section?: string;
  facilitatorConfirmed?: boolean;
  facilitatorDropped?: boolean;
  calHoldSent?: boolean;
  contractRequested?: boolean;
}

type RawPlacement = Partial<EventPlacement> & LegacyFields;
type RawEvent = Partial<BookingEvent> & LegacyFields;

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function list<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/** Stable id for a record recovered from a legacy label. */
function slugId(prefix: string, label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${prefix}-${slug || "untitled"}`;
}

function legacyStage(raw: RawPlacement): PlacementStage {
  if (raw.contractRequested) return "contracted";
  if (raw.facilitatorConfirmed) return "confirmed";
  if (raw.calHoldSent) return "hold";
  return "proposed";
}

function normalizePathway(raw: Partial<EventPathway>, index: number): EventPathway {
  return {
    id: str(raw.id) || slugId("pathway", `${index}`),
    name: str(raw.name),
    notes: str(raw.notes),
  };
}

function normalizeSection(raw: Partial<EventSection>, index: number): EventSection {
  const seats = Number(raw.seatsNeeded);
  return {
    id: str(raw.id) || slugId("section", `${index}`),
    pathwayId: str(raw.pathwayId),
    name: str(raw.name),
    seatsNeeded: Number.isFinite(seats) && seats > 0 ? Math.floor(seats) : 0,
    date: str(raw.date),
    notes: str(raw.notes),
  };
}

function normalizeStage(value: unknown): PlacementStage | null {
  return PLACEMENT_STAGES.includes(value as PlacementStage)
    ? (value as PlacementStage)
    : null;
}

/**
 * Rebuild pathway and section records from the old free-text labels so legacy
 * events land on the board instead of disappearing. Ids are derived from the
 * label, which keeps them stable across snapshots until the doc is next saved.
 */
function migratePlacements(
  rawPlacements: RawPlacement[],
  pathways: EventPathway[],
  sections: EventSection[]
): EventPlacement[] {
  const pathwayByName = new Map(
    pathways.map((p) => [p.name.trim().toLowerCase(), p.id])
  );
  const knownSectionIds = new Set(sections.map((s) => s.id));
  const sectionByKey = new Map(
    sections.map((s) => [`${s.pathwayId}::${s.name.trim().toLowerCase()}`, s.id])
  );
  const seatCounts = new Map<string, number>();

  const placements = rawPlacements.map((raw) => {
    const dropped = Boolean(raw.dropped ?? raw.facilitatorDropped);
    const base = {
      id: str(raw.id) || crypto.randomUUID(),
      facilitatorId: str(raw.facilitatorId),
      stage: normalizeStage(raw.stage) ?? legacyStage(raw),
      dropped,
      dropReason: str(raw.dropReason) || (dropped ? str(raw.notes) : ""),
      notes: str(raw.notes),
      calendarEventId: str(raw.calendarEventId),
    };

    const sectionId = str(raw.sectionId);
    if (sectionId && knownSectionIds.has(sectionId)) {
      return { ...base, pathwayId: str(raw.pathwayId), sectionId };
    }

    const pathwayName = str(raw.pathway).trim() || "Unassigned";
    const pathwayKey = pathwayName.toLowerCase();
    let pathwayId = pathwayByName.get(pathwayKey);
    if (!pathwayId) {
      pathwayId = slugId("pathway", pathwayName);
      pathwayByName.set(pathwayKey, pathwayId);
      pathways.push({ id: pathwayId, name: pathwayName, notes: "" });
    }

    const sectionName = str(raw.section).trim() || "Section 1";
    const sectionKey = `${pathwayId}::${sectionName.toLowerCase()}`;
    let resolvedSectionId = sectionByKey.get(sectionKey);
    if (!resolvedSectionId) {
      resolvedSectionId = slugId("section", `${pathwayId}-${sectionName}`);
      sectionByKey.set(sectionKey, resolvedSectionId);
      sections.push({
        id: resolvedSectionId,
        pathwayId,
        name: sectionName,
        seatsNeeded: 0,
        date: "",
        notes: "",
      });
    }

    if (!dropped) {
      seatCounts.set(
        resolvedSectionId,
        (seatCounts.get(resolvedSectionId) ?? 0) + 1
      );
    }

    return { ...base, pathwayId, sectionId: resolvedSectionId };
  });

  // A migrated section is assumed to need exactly the people already in it.
  for (const section of sections) {
    const migrated = seatCounts.get(section.id);
    if (section.seatsNeeded === 0 && migrated) section.seatsNeeded = migrated;
  }

  return placements;
}

function normalizeEvent(raw: RawEvent, fallbackId: string): BookingEvent {
  const pathways = list<Partial<EventPathway>>(raw.pathways).map(normalizePathway);
  const sections = list<Partial<EventSection>>(raw.sections).map(normalizeSection);
  const placements = migratePlacements(
    list<RawPlacement>(raw.placements),
    pathways,
    sections
  );

  const stage: EventStage = EVENT_STAGES.includes(raw.stage as EventStage)
    ? (raw.stage as EventStage)
    : raw.eventConfirmed
      ? "contracted"
      : "prospective";

  return {
    id: str(raw.id) || fallbackId,
    accountSchool: str(raw.accountSchool),
    eventType: raw.eventType ?? "Custom",
    eventMode: raw.eventMode ?? "In-Person",
    startDate: str(raw.startDate),
    endDate: str(raw.endDate),
    startTime: str(raw.startTime),
    endTime: str(raw.endTime),
    stage,
    notes: str(raw.notes),
    pathways,
    sections,
    placements,
    status: raw.status === "archived" ? "archived" : "active",
    createdByUid: str(raw.createdByUid),
    createdByEmail: str(raw.createdByEmail),
    updatedByUid: str(raw.updatedByUid),
    updatedByEmail: str(raw.updatedByEmail),
    createdAt: raw.createdAt ?? 0,
    updatedAt: raw.updatedAt ?? 0,
  };
}

/**
 * Subscribe to the shared events collection.
 * No-ops (empty list) when Firestore isn't configured.
 */
export function subscribeEvents(
  onData: (list: BookingEvent[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) {
    onData([]);
    return () => {};
  }
  return onSnapshot(
    collection(db, COLLECTION),
    (snap) => {
      const events = snap.docs.map((d) =>
        normalizeEvent(d.data() as RawEvent, d.id)
      );
      events.sort((a, b) => a.accountSchool.localeCompare(b.accountSchool));
      onData(events);
    },
    (err) => onError?.(err)
  );
}

/** Create or fully replace an event document. */
export async function saveEvent(event: BookingEvent): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");
  await setDoc(doc(db, COLLECTION, event.id), event);
}

export async function deleteEvent(id: string): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");
  await deleteDoc(doc(db, COLLECTION, id));
}
