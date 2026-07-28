import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { ensureAccess } from "./accessService";

export type AccessStatus = "loading" | "allowed" | "denied";

export interface AccessState {
  status: AccessStatus;
  /** Set when the allowlist check fails for a non-allowlist reason (e.g. rules). */
  error: string | null;
}

/**
 * After Firebase Auth resolves a user, check the allowlist. In demo mode
 * (Firebase not configured) everyone is treated as allowed.
 */
export function useAccess(user: User | null, configured: boolean): AccessState {
  const [state, setState] = useState<AccessState>({
    status: configured ? "loading" : "allowed",
    error: null,
  });

  useEffect(() => {
    if (!configured) {
      setState({ status: "allowed", error: null });
      return;
    }
    if (!user) {
      setState({ status: "loading", error: null });
      return;
    }

    let cancelled = false;
    setState({ status: "loading", error: null });
    ensureAccess(user.email)
      .then((ok) => {
        if (!cancelled) {
          setState({
            status: ok ? "allowed" : "denied",
            error: ok ? null : "Your email is not on the allowlist yet.",
          });
        }
      })
      .catch((err) => {
        console.error("Access check failed:", err);
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          setState({ status: "denied", error: message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, configured]);

  return state;
}
