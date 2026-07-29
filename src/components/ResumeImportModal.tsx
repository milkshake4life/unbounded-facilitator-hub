import { useMemo, useRef, useState } from "react";
import {
  X,
  FolderOpen,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  FileText,
} from "lucide-react";
import {
  getAccessToken,
  pickFolder,
  listResumesInFolder,
  isGoogleConfigured,
  type PickedFolder,
} from "../lib/googleSheets";
import { buildMatches, type FileMatch } from "../lib/headshotMatch";
import { saveResume } from "../lib/facilitatorsService";
import { isFirebaseConfigured } from "../lib/firebase";
import type { Facilitator } from "../types";

type Step = "pick" | "review" | "uploading" | "done";

interface ResumeImportModalProps {
  facilitators: Facilitator[];
  onClose: () => void;
}

export function ResumeImportModal({
  facilitators,
  onClose,
}: ResumeImportModalProps) {
  const [step, setStep] = useState<Step>("pick");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [folder, setFolder] = useState<PickedFolder | null>(null);
  const [matches, setMatches] = useState<FileMatch[]>([]);
  const tokenRef = useRef<string | null>(null);

  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{
    uploaded: number;
    skipped: number;
    failed: number;
  } | null>(null);

  const ready = isGoogleConfigured && isFirebaseConfigured;

  const facById = useMemo(() => {
    const m = new Map<string, Facilitator>();
    facilitators.forEach((f) => m.set(f.id, f));
    return m;
  }, [facilitators]);

  const sortedFacilitators = useMemo(
    () =>
      [...facilitators].sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        )
      ),
    [facilitators]
  );

  const assignedCount = matches.filter((m) => m.facilitatorId).length;

  const duplicateIds = useMemo(() => {
    const counts = new Map<string, number>();
    matches.forEach((m) => {
      if (m.facilitatorId)
        counts.set(m.facilitatorId, (counts.get(m.facilitatorId) ?? 0) + 1);
    });
    return new Set(
      [...counts.entries()].filter(([, c]) => c > 1).map(([id]) => id)
    );
  }, [matches]);

  async function ensureToken(): Promise<string> {
    if (tokenRef.current) return tokenRef.current;
    const t = await getAccessToken();
    tokenRef.current = t;
    return t;
  }

  async function handlePick() {
    setError(null);
    setBusy(true);
    try {
      const token = await ensureToken();
      const picked = await pickFolder(
        token,
        "Select the folder of resume files"
      );
      if (!picked) {
        setBusy(false);
        return;
      }
      const files = await listResumesInFolder(token, picked.id);
      if (files.length === 0) {
        throw new Error(
          "No PDF or Word resume files were found in that folder."
        );
      }
      setFolder(picked);
      setMatches(buildMatches(files, facilitators));
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function setAssignment(fileId: string, facilitatorId: string | null) {
    setMatches((prev) =>
      prev.map((m) =>
        m.fileId === fileId ? { ...m, facilitatorId, ambiguous: false } : m
      )
    );
  }

  async function handleUpload() {
    const toUpload = matches.filter((m) => m.facilitatorId);
    if (toUpload.length === 0) return;
    setError(null);
    setStep("uploading");
    setProgress({ done: 0, total: toUpload.length });

    let uploaded = 0;
    let failed = 0;
    for (const m of toUpload) {
      try {
        await saveResume(m.facilitatorId!, m.fileId, m.fileName);
        uploaded += 1;
      } catch (err) {
        console.error(`Failed to attach ${m.fileName}:`, err);
        failed += 1;
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setResult({
      uploaded,
      skipped: matches.length - toUpload.length,
      failed,
    });
    setStep("done");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Import resumes from Drive
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!ready && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p className="font-semibold">Finish setup first</p>
              <p className="mt-1 text-amber-700">
                This needs Firestore configured and your Google keys set. See{" "}
                <code>SETUP-GOOGLE-SHEETS.md</code>.
              </p>
            </div>
          )}

          {ready && step === "pick" && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <FolderOpen className="h-7 w-7" />
              </div>
              <p className="mt-4 max-w-sm text-sm text-slate-600">
                Pick the Google Drive folder that holds the resume files (PDF
                or Word). We'll match each file to a facilitator by filename —
                you can review and fix matches before anything is saved to
                Firestore.
              </p>
              <button
                onClick={handlePick}
                disabled={busy}
                className="mt-5 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FolderOpen className="h-4 w-4" />
                )}
                {busy ? "Opening Google…" : "Choose Drive folder"}
              </button>
            </div>
          )}

          {ready && step === "review" && (
            <div>
              <div className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <span className="font-medium text-slate-800">
                  {folder?.name}
                </span>{" "}
                · {matches.length} file(s) ·{" "}
                <span className="font-medium text-slate-800">
                  {assignedCount}
                </span>{" "}
                matched to a facilitator
              </div>

              <p className="mb-3 text-xs text-slate-500">
                Confirm each resume's facilitator. Unmatched files are set to
                “Skip” — assign them if you can. Set a file to “Skip” to leave
                it out.
              </p>

              <div className="space-y-2">
                {matches.map((m) => {
                  const assigned = m.facilitatorId
                    ? facById.get(m.facilitatorId)
                    : undefined;
                  const duplicate =
                    !!m.facilitatorId && duplicateIds.has(m.facilitatorId);
                  return (
                    <div
                      key={m.fileId}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 p-2"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                        <FileText className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-xs text-slate-500"
                          title={m.fileName}
                        >
                          {m.fileName}
                        </p>
                        {m.facilitatorId ? (
                          <p className="text-xs font-medium text-emerald-600">
                            Matched
                            {assigned
                              ? `: ${assigned.firstName} ${assigned.lastName}`
                              : ""}
                            {duplicate && (
                              <span className="ml-1 text-amber-600">
                                (duplicate)
                              </span>
                            )}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400">Not matched</p>
                        )}
                      </div>

                      <select
                        value={m.facilitatorId ?? ""}
                        onChange={(e) =>
                          setAssignment(m.fileId, e.target.value || null)
                        }
                        className="max-w-[45%] rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-brand-500"
                      >
                        <option value="">— Skip —</option>
                        {sortedFacilitators.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.firstName} {f.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === "uploading" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
              <p className="mt-3 text-sm text-slate-600">
                Saving resume links… {progress.done} / {progress.total}
              </p>
              <div className="mt-3 h-2 w-64 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-brand-600 transition-all"
                  style={{
                    width: `${
                      progress.total
                        ? (progress.done / progress.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          {step === "done" && result && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="mt-3 text-sm font-medium text-slate-800">
                Resumes imported
              </p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {result.uploaded} linked
                {result.skipped > 0 && `, ${result.skipped} skipped`}
                {result.failed > 0 && `, ${result.failed} failed`}.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <div className="text-xs text-slate-400">
            {step === "review" && duplicateIds.size > 0 && (
              <span className="text-amber-600">
                Some facilitators are assigned more than one resume — the last
                one wins.
              </span>
            )}
          </div>
          <div className="flex gap-3">
            {step === "done" ? (
              <button
                onClick={onClose}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              >
                Done
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                {step === "review" && (
                  <button
                    onClick={handleUpload}
                    disabled={assignedCount === 0}
                    className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Upload {assignedCount} resume
                    {assignedCount === 1 ? "" : "s"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
