import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { BookingEvent, EventPlacement } from "../types";

const COLLECTION = "events";

function normalizePlacement(raw: Partial<EventPlacement>): EventPlacement {
  return {
    id: raw.id ?? crypto.randomUUID(),
    facilitatorId: raw.facilitatorId ?? "",
    pathway: raw.pathway ?? "",
    section: raw.section ?? "",
    facilitatorConfirmed: Boolean(raw.facilitatorConfirmed),
    facilitatorDropped: Boolean(raw.facilitatorDropped),
    calHoldSent: Boolean(raw.calHoldSent),
    contractRequested: Boolean(raw.contractRequested),
    notes: raw.notes ?? "",
  };
}

function normalizeEvent(
  data: BookingEvent & { eventConfirmed?: boolean },
  fallbackId: string
): BookingEvent {
  const rawPlacements = Array.isArray(data.placements)
    ? (data.placements as Array<Partial<EventPlacement> & { eventConfirmed?: boolean }>)
    : [];
  const placements = rawPlacements.map((p) => normalizePlacement(p));
  // Migrate older docs that stored confirmation on each placement.
  const legacyConfirmed =
    data.eventConfirmed === undefined &&
    rawPlacements.length > 0 &&
    rawPlacements.every((p) => p.eventConfirmed);

  return {
    ...data,
    id: data.id || fallbackId,
    accountSchool: data.accountSchool ?? "",
    eventType: data.eventType ?? "Custom",
    eventMode: data.eventMode ?? "In-Person",
    startDate: data.startDate ?? "",
    eventConfirmed: Boolean(data.eventConfirmed) || Boolean(legacyConfirmed),
    notes: data.notes ?? "",
    placements,
    status: data.status === "archived" ? "archived" : "active",
    createdByUid: data.createdByUid ?? "",
    createdByEmail: data.createdByEmail ?? "",
    updatedByUid: data.updatedByUid ?? "",
    updatedByEmail: data.updatedByEmail ?? "",
    createdAt: data.createdAt ?? 0,
    updatedAt: data.updatedAt ?? 0,
  };
}

/**
 * Subscribe to the shared events / placements collection.
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
      const list = snap.docs.map((d) =>
        normalizeEvent(d.data() as BookingEvent, d.id)
      );
      list.sort((a, b) => a.accountSchool.localeCompare(b.accountSchool));
      onData(list);
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
