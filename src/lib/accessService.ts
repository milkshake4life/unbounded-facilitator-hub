import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { AllowedUser } from "../types";

const COLLECTION = "allowedUsers";

/** Normalize an email for use as a Firestore document ID. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Comma-separated bootstrap emails from env. Used only when the signed-in
 * user is not yet on the allowlist — they (and sibling bootstrap emails)
 * are seeded so the first admins can get in and invite others.
 *
 * Firestore rules must also list these emails in `isBootstrapEmail()`.
 */
function bootstrapEmails(): string[] {
  const raw = import.meta.env.VITE_BOOTSTRAP_ALLOWLIST ?? "";
  return raw
    .split(",")
    .map((e) => normalizeEmail(e))
    .filter(Boolean);
}

/**
 * Ensure the signed-in user is on the allowlist. Returns true if they may
 * use the app. Bootstrap emails are auto-seeded on first successful sign-in.
 */
export async function ensureAccess(
  email: string | null | undefined
): Promise<boolean> {
  if (!db || !email) return false;
  const firestore = db;
  const key = normalizeEmail(email);
  const existing = await getDoc(doc(firestore, COLLECTION, key));
  if (existing.exists()) return true;

  const boot = bootstrapEmails();
  if (!boot.includes(key)) return false;

  const now = Date.now();
  await Promise.all(
    boot.map((e) =>
      setDoc(
        doc(firestore, COLLECTION, e),
        {
          email: e,
          displayName: null,
          grantedBy: null,
          grantedAt: now,
        } satisfies AllowedUser,
        { merge: true }
      )
    )
  );
  return true;
}

export async function listAllowedUsers(): Promise<AllowedUser[]> {
  if (!db) throw new Error("Firestore is not configured.");
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map((d) => d.data() as AllowedUser)
    .sort((a, b) => a.email.localeCompare(b.email));
}

/**
 * Grant app access to an email. Any currently allowlisted user may call this.
 */
export async function grantAccess(
  email: string,
  grantedBy: string,
  displayName?: string | null
): Promise<AllowedUser> {
  if (!db) throw new Error("Firestore is not configured.");
  const key = normalizeEmail(email);
  if (!isValidEmail(key)) {
    throw new Error("Enter a valid email address.");
  }
  const granter = normalizeEmail(grantedBy);
  const existing = await getDoc(doc(db, COLLECTION, key));
  if (existing.exists()) {
    throw new Error("That email already has access.");
  }
  const record: AllowedUser = {
    email: key,
    displayName: displayName?.trim() || null,
    grantedBy: granter,
    grantedAt: Date.now(),
  };
  await setDoc(doc(db, COLLECTION, key), record);
  return record;
}

/**
 * Revoke access for an email. Refuses to remove the caller's own account
 * or the last remaining user on the allowlist.
 */
export async function revokeAccess(
  email: string,
  currentUserEmail: string
): Promise<void> {
  if (!db) throw new Error("Firestore is not configured.");
  const key = normalizeEmail(email);
  const me = normalizeEmail(currentUserEmail);
  if (key === me) {
    throw new Error("You can't remove your own access.");
  }
  const users = await listAllowedUsers();
  if (users.length <= 1) {
    throw new Error("Can't remove the last person with access.");
  }
  await deleteDoc(doc(db, COLLECTION, key));
}
