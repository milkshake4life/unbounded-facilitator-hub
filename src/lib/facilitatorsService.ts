import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { getAccessToken, downloadDriveFile } from "./googleSheets";
import type { Facilitator } from "../types";

const COLLECTION = "facilitators";
const HEADSHOTS = "headshots";

/** Chunk helper — Firestore batches are capped at 500 writes. */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function emailKey(f: Facilitator): string {
  return (f.unboundedEmail || f.personalEmail || "").trim().toLowerCase();
}

/**
 * Subscribe to the live facilitator list. Returns an unsubscribe function.
 * No-ops (and calls back with an empty list) when Firestore isn't configured.
 */
export function subscribeFacilitators(
  onData: (list: Facilitator[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) {
    onData([]);
    return () => {};
  }
  return onSnapshot(
    collection(db, COLLECTION),
    (snap) => {
      onData(snap.docs.map((d) => d.data() as Facilitator));
    },
    (err) => onError?.(err)
  );
}

/** Create or update a single facilitator (used by the Add/Edit form). */
export async function saveFacilitator(f: Facilitator): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");
  await setDoc(doc(db, COLLECTION, f.id), f);
}

export async function deleteFacilitator(id: string): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");
  await deleteDoc(doc(db, COLLECTION, id));
}

/**
 * Store a compressed headshot (as a data URL) in the `headshots` collection,
 * kept separate from the main facilitator record so the directory list stays
 * lightweight. Flags the facilitator so the UI knows to load the stored photo.
 */
export async function saveHeadshot(
  facilitatorId: string,
  dataUrl: string
): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");
  await setDoc(doc(db, HEADSHOTS, facilitatorId), {
    dataUrl,
    updatedAt: Date.now(),
  });
  await updateDoc(doc(db, COLLECTION, facilitatorId), {
    hasStoredHeadshot: true,
  });
}

/** Fetch a stored headshot data URL, or null if none exists. */
export async function fetchStoredHeadshot(
  facilitatorId: string
): Promise<string | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, HEADSHOTS, facilitatorId));
  if (!snap.exists()) return null;
  return (snap.data().dataUrl as string) ?? null;
}

/**
 * Attach a Google Drive resume file to a facilitator by saving its Drive file
 * id + filename on the Firestore facilitator document.
 */
export async function saveResume(
  facilitatorId: string,
  driveFileId: string,
  fileName: string
): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");
  await updateDoc(doc(db, COLLECTION, facilitatorId), {
    resumeDriveFileId: driveFileId,
    resumeFileName: fileName,
    hasStoredResume: true,
  });
}

/**
 * Download the resume from Drive, open it in a new tab, and trigger a file
 * download. Requires the signed-in user to have Drive access to that file.
 */
export async function openAndDownloadResume(
  driveFileId: string,
  fileName: string
): Promise<void> {
  const token = await getAccessToken();
  const blob = await downloadDriveFile(token, driveFileId);
  const objectUrl = URL.createObjectURL(blob);

  window.open(objectUrl, "_blank", "noopener,noreferrer");

  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName || "resume.pdf";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();

  // Keep the blob alive long enough for the new tab to load it.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

/**
 * REPLACE strategy: the sheet is the source of truth. Deletes every existing
 * record, then writes the imported set.
 */
export async function replaceAllFacilitators(
  incoming: Facilitator[]
): Promise<{ added: number; deleted: number }> {
  if (!db) throw new Error("Firestore is not configured.");
  const existing = await getDocs(collection(db, COLLECTION));

  const deletions = existing.docs.map((d) => d.ref);
  for (const group of chunk(deletions, 450)) {
    const batch = writeBatch(db);
    group.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  for (const group of chunk(incoming, 450)) {
    const batch = writeBatch(db);
    group.forEach((f) => batch.set(doc(db!, COLLECTION, f.id), f));
    await batch.commit();
  }

  return { added: incoming.length, deleted: existing.size };
}

/**
 * MERGE strategy: match incoming rows to existing records by email. Existing
 * matches are updated in place (keeping their id). When `overlayKeys` is
 * provided, only those Facilitator fields are overwritten — so unmapped import
 * columns (emergency contact, comfort, etc.) do not wipe stored values with
 * empty defaults. Unmatched rows are added as new records.
 */
export async function mergeFacilitatorsByEmail(
  incoming: Facilitator[],
  overlayKeys?: (keyof Facilitator)[]
): Promise<{ added: number; updated: number }> {
  if (!db) throw new Error("Firestore is not configured.");
  const existingSnap = await getDocs(collection(db, COLLECTION));
  const byEmail = new Map<string, Facilitator>();
  existingSnap.docs.forEach((d) => {
    const f = d.data() as Facilitator;
    const key = emailKey(f);
    if (key) byEmail.set(key, f);
  });

  let added = 0;
  let updated = 0;
  const writes: Facilitator[] = [];
  const keys = overlayKeys?.length ? overlayKeys : null;

  for (const inc of incoming) {
    const key = emailKey(inc);
    const match = key ? byEmail.get(key) : undefined;
    if (match) {
      if (keys) {
        const next: Facilitator = { ...match, id: match.id };
        for (const k of keys) {
          Object.assign(next, { [k]: inc[k] });
        }
        writes.push(next);
      } else {
        writes.push({ ...match, ...inc, id: match.id });
      }
      updated += 1;
    } else {
      writes.push(inc);
      added += 1;
    }
  }

  for (const group of chunk(writes, 450)) {
    const batch = writeBatch(db);
    group.forEach((f) => batch.set(doc(db!, COLLECTION, f.id), f));
    await batch.commit();
  }

  return { added, updated };
}
