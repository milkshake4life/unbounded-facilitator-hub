import { useEffect, useState } from "react";
import { Loader2, Trash2, UserPlus, X } from "lucide-react";
import type { AllowedUser } from "../types";
import {
  grantAccess,
  listAllowedUsers,
  normalizeEmail,
  revokeAccess,
} from "../lib/accessService";

interface ManageAccessModalProps {
  currentUserEmail: string;
  onClose: () => void;
}

function formatGrantedAt(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function ManageAccessModal({
  currentUserEmail,
  onClose,
}: ManageAccessModalProps) {
  const me = normalizeEmail(currentUserEmail);
  const [users, setUsers] = useState<AllowedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const list = await listAllowedUsers();
    setUsers(list);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listAllowedUsers()
      .then((list) => {
        if (!cancelled) setUsers(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await grantAccess(email, me);
      setEmail("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(target: AllowedUser) {
    if (
      !window.confirm(
        `Remove access for ${target.email}? They will no longer be able to open this app.`
      )
    ) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await revokeAccess(target.email, me);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-labelledby="manage-access-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2
              id="manage-access-title"
              className="text-base font-bold text-slate-900"
            >
              Manage access
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Only people on this list can sign in to the Facilitator Hub.
              Anyone here can invite others.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <form onSubmit={handleGrant} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@unbounded.org"
              required
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="submit"
              disabled={busy || !email.trim()}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Invite
            </button>
          </form>

          {error && (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Allowed emails ({users.length})
            </p>
            {loading ? (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : users.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No one on the allowlist yet.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
                {users.map((u) => {
                  const isMe = normalizeEmail(u.email) === me;
                  return (
                    <li
                      key={u.email}
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1 leading-tight">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {u.email}
                          {isMe && (
                            <span className="ml-1.5 text-xs font-normal text-slate-400">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {u.grantedBy
                            ? `Invited by ${u.grantedBy}`
                            : "Bootstrap admin"}
                          {u.grantedAt
                            ? ` · ${formatGrantedAt(u.grantedAt)}`
                            : ""}
                        </p>
                      </div>
                      {!isMe && (
                        <button
                          onClick={() => void handleRevoke(u)}
                          disabled={busy}
                          title="Remove access"
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
