import { ShieldOff, LogOut } from "lucide-react";
import type { User } from "firebase/auth";
import { Avatar } from "./Avatar";

interface AccessDeniedScreenProps {
  user: User;
  onSignOut: () => Promise<void>;
  error?: string | null;
}

export function AccessDeniedScreen({
  user,
  onSignOut,
  error,
}: AccessDeniedScreenProps) {
  const isPermissions =
    Boolean(error) && /permission|insufficient/i.test(error ?? "");

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <ShieldOff className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-lg font-bold text-slate-900">
          Access not granted
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isPermissions
            ? "Firestore rejected the allowlist check. Publish the latest firestore.rules in the Firebase console, then try again."
            : "Your account is signed in, but it isn’t on the allowlist for this app. Ask someone who already has access to invite you."}
        </p>

        {error && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-left text-xs text-rose-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left">
          <Avatar
            src={user.photoURL ?? undefined}
            alt={user.displayName ?? user.email ?? "Account"}
            boxClassName="h-10 w-10 shrink-0 rounded-full"
            iconClassName="h-5 w-5"
          />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-slate-800">
              {user.displayName ?? "Signed in"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {user.email ?? ""}
            </p>
          </div>
        </div>

        <button
          onClick={() => void onSignOut()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
