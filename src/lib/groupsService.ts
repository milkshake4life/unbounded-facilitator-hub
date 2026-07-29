import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { FacilitatorGroup } from "../types";

const COLLECTION = "groups";

/**
 * Subscribe to groups owned by the signed-in user.
 * No-ops (empty list) when Firestore isn't configured.
 */
export function subscribeUserGroups(
  ownerUid: string,
  onData: (list: FacilitatorGroup[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) {
    onData([]);
    return () => {};
  }
  const q = query(
    collection(db, COLLECTION),
    where("ownerUid", "==", ownerUid)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data() as FacilitatorGroup;
        return {
          ...data,
          description: data.description ?? "",
          facilitatorIds: data.facilitatorIds ?? [],
          status: data.status === "archived" ? "archived" : "active",
        };
      });
      list.sort((a, b) => a.name.localeCompare(b.name));
      onData(list);
    },
    (err) => onError?.(err)
  );
}

/** Create or fully replace a group document. */
export async function saveGroup(group: FacilitatorGroup): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");
  await setDoc(doc(db, COLLECTION, group.id), group);
}

export async function deleteGroup(id: string): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");
  await deleteDoc(doc(db, COLLECTION, id));
}
