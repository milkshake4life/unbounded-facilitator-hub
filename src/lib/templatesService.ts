import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type { EmailTemplate } from "../types";

const COLLECTION = "emailTemplates";
const BATCH_LIMIT = 400;

/**
 * Subscribe to the shared email template library.
 * No-ops (empty list) when Firestore isn't configured.
 */
export function subscribeTemplates(
  onData: (list: EmailTemplate[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) {
    onData([]);
    return () => {};
  }
  return onSnapshot(
    collection(db, COLLECTION),
    (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data() as EmailTemplate;
        return {
          ...data,
          id: data.id || d.id,
          name: data.name ?? "",
          purpose: data.purpose ?? "",
          subject: data.subject ?? "",
          body: data.body ?? "",
          createdByUid: data.createdByUid ?? "",
          createdByEmail: data.createdByEmail ?? "",
          updatedByUid: data.updatedByUid ?? "",
          updatedByEmail: data.updatedByEmail ?? "",
          createdAt: data.createdAt ?? 0,
          updatedAt: data.updatedAt ?? 0,
        };
      });
      list.sort((a, b) => a.name.localeCompare(b.name));
      onData(list);
    },
    (err) => onError?.(err)
  );
}

/** Create or fully replace a template document. */
export async function saveTemplate(template: EmailTemplate): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");
  await setDoc(doc(db, COLLECTION, template.id), template);
}

/** Bulk-write templates (e.g. sheet import). Chunked to stay under batch limits. */
export async function saveTemplates(templates: EmailTemplate[]): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");
  for (let i = 0; i < templates.length; i += BATCH_LIMIT) {
    const chunk = templates.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(db);
    for (const t of chunk) {
      batch.set(doc(db, COLLECTION, t.id), t);
    }
    await batch.commit();
  }
}

export async function deleteTemplate(id: string): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");
  await deleteDoc(doc(db, COLLECTION, id));
}
