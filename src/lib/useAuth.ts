import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./firebase";

export interface AuthState {
  /** The signed-in Firebase user, or null when signed out. */
  user: User | null;
  /** True until the initial auth state has been resolved. */
  loading: boolean;
  /** False when Firebase env vars are missing (app runs in demo mode). */
  configured: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const provider = new GoogleAuthProvider();

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signIn() {
    if (!auth) return;
    await signInWithPopup(auth, provider);
  }

  async function signOut() {
    if (!auth) return;
    await fbSignOut(auth);
  }

  return {
    user,
    loading,
    configured: isFirebaseConfigured,
    signIn,
    signOut,
  };
}
