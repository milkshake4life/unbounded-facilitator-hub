import { useState } from "react";
import { Users, LogIn, Loader2 } from "lucide-react";

interface SignInScreenProps {
  onSignIn: () => Promise<void>;
}

export function SignInScreen({ onSignIn }: SignInScreenProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle() {
    setError(null);
    setBusy(true);
    try {
      await onSignIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Users className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-lg font-bold text-slate-900">
          UnboundEd Facilitator Hub
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in with your UnboundEd Google account to access the directory.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <button
          onClick={handle}
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          {busy ? "Signing in…" : "Sign in with Google"}
        </button>
      </div>
    </div>
  );
}
