import { useMemo, useState } from "react";
import {
  X,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Replace,
  GitMerge,
} from "lucide-react";
import {
  getAccessToken,
  pickSpreadsheet,
  readSheet,
  isGoogleConfigured,
  type SheetData,
} from "../lib/googleSheets";
import {
  IMPORT_FIELDS,
  autoMap,
  buildFacilitators,
  type ColumnMapping,
  type ImportFieldKey,
} from "../lib/importMapping";
import {
  replaceAllFacilitators,
  mergeFacilitatorsByEmail,
} from "../lib/facilitatorsService";
import { isFirebaseConfigured } from "../lib/firebase";
import { classNames } from "../lib/ui";

type Step = "pick" | "map" | "importing" | "done";
type ImportMode = "merge" | "replace";

interface ImportWizardModalProps {
  onClose: () => void;
}

export function ImportWizardModal({ onClose }: ImportWizardModalProps) {
  const [step, setStep] = useState<Step>("pick");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sheet, setSheet] = useState<SheetData | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [mode, setMode] = useState<ImportMode>("merge");
  const [result, setResult] = useState<string | null>(null);

  const ready = isGoogleConfigured && isFirebaseConfigured;

  const build = useMemo(() => {
    if (!sheet || !mapping) return null;
    return buildFacilitators(sheet.rows, mapping);
  }, [sheet, mapping]);

  const requiredMissing = useMemo(() => {
    if (!mapping) return [];
    return IMPORT_FIELDS.filter((f) => f.required && mapping[f.key] < 0).map(
      (f) => f.label
    );
  }, [mapping]);

  async function handlePick() {
    setError(null);
    setBusy(true);
    try {
      const token = await getAccessToken();
      const picked = await pickSpreadsheet(token);
      if (!picked) {
        setBusy(false);
        return; // user cancelled
      }
      const data = await readSheet(token, picked);
      if (data.rows.length === 0) {
        throw new Error("That sheet has a header row but no data rows.");
      }
      setSheet(data);
      setMapping(autoMap(data.header));
      setStep("map");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function setFieldColumn(key: ImportFieldKey, colIdx: number) {
    setMapping((prev) => (prev ? { ...prev, [key]: colIdx } : prev));
  }

  async function handleImport() {
    if (!build) return;
    setError(null);
    setStep("importing");
    try {
      if (mode === "replace") {
        const r = await replaceAllFacilitators(build.records);
        setResult(
          `Replaced the directory: ${r.added} imported, ${r.deleted} previous record(s) removed.`
        );
      } else {
        const r = await mergeFacilitatorsByEmail(build.records, build.overlayKeys);
        setResult(
          `Merge complete: ${r.updated} updated, ${r.added} added (matched by email).`
        );
      }
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep("map");
    }
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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Import from Google Sheets
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

          {!ready && <SetupNotice />}

          {/* STEP: pick */}
          {ready && step === "pick" && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <FileSpreadsheet className="h-7 w-7" />
              </div>
              <p className="mt-4 max-w-sm text-sm text-slate-600">
                Choose the Google Sheet that holds your facilitator data. You'll
                sign in with Google and pick the file, then map the columns
                before anything is saved.
              </p>
              <button
                onClick={handlePick}
                disabled={busy}
                className="mt-5 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                {busy ? "Opening Google…" : "Choose Google Sheet"}
              </button>
            </div>
          )}

          {/* STEP: map */}
          {ready && step === "map" && sheet && mapping && (
            <div>
              <div className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <span className="font-medium text-slate-800">
                  {sheet.spreadsheetName}
                </span>{" "}
                · tab “{sheet.sheetTitle}” · {sheet.rows.length} data row(s),{" "}
                {sheet.header.length} column(s)
              </div>

              <p className="mb-2 text-sm font-semibold text-slate-800">
                Match your columns
              </p>
              <p className="mb-3 text-xs text-slate-500">
                We guessed these from your headers — adjust anything that looks
                off. Fields marked <span className="text-rose-500">*</span> are
                required.
              </p>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {IMPORT_FIELDS.map((field) => (
                  <div
                    key={field.key}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <span className="text-xs font-medium text-slate-600">
                      {field.label}
                      {field.required && (
                        <span className="text-rose-500"> *</span>
                      )}
                    </span>
                    <select
                      value={mapping[field.key]}
                      onChange={(e) =>
                        setFieldColumn(field.key, Number(e.target.value))
                      }
                      className={classNames(
                        "max-w-[55%] rounded-md border px-2 py-1 text-xs outline-none",
                        field.required && mapping[field.key] < 0
                          ? "border-rose-300 bg-rose-50 text-rose-700"
                          : "border-slate-200 text-slate-700"
                      )}
                    >
                      <option value={-1}>— Not mapped —</option>
                      {sheet.header.map((h, idx) => (
                        <option key={idx} value={idx}>
                          {h || `Column ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preview */}
              {build && (
                <div className="mt-5">
                  <p className="mb-2 text-sm font-semibold text-slate-800">
                    Preview
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      {build.records.length} record(s) ready
                      {build.skipped.length > 0 &&
                        ` · ${build.skipped.length} row(s) skipped`}
                    </span>
                  </p>
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-3 py-2 font-medium">Name</th>
                          <th className="px-3 py-2 font-medium">Email</th>
                          <th className="px-3 py-2 font-medium">Employer</th>
                          <th className="px-3 py-2 font-medium">Pathways</th>
                        </tr>
                      </thead>
                      <tbody>
                        {build.records.slice(0, 5).map((r) => (
                          <tr key={r.id} className="border-t border-slate-100">
                            <td className="px-3 py-2 text-slate-800">
                              {r.firstName} {r.lastName}
                            </td>
                            <td className="px-3 py-2 text-slate-600">
                              {r.unboundedEmail || r.personalEmail || "—"}
                            </td>
                            <td className="px-3 py-2 text-slate-600">
                              {r.currentEmployer}
                            </td>
                            <td className="px-3 py-2 text-slate-600">
                              {r.pathways.join(", ") || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {build.skipped.length > 0 && (
                    <p className="mt-2 text-xs text-amber-600">
                      Skipped rows: {build.skipped.slice(0, 5).map((s) => `#${s.row} (${s.reason})`).join(", ")}
                      {build.skipped.length > 5 && "…"}
                    </p>
                  )}
                </div>
              )}

              {/* Mode */}
              <div className="mt-5">
                <p className="mb-2 text-sm font-semibold text-slate-800">
                  How should we apply this import?
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <ModeCard
                    active={mode === "merge"}
                    onClick={() => setMode("merge")}
                    icon={<GitMerge className="h-4 w-4" />}
                    title="Merge / update"
                    desc="Match by email — update existing facilitators and add new ones."
                  />
                  <ModeCard
                    active={mode === "replace"}
                    onClick={() => setMode("replace")}
                    icon={<Replace className="h-4 w-4" />}
                    title="Replace everything"
                    desc="Delete the current directory and load the sheet as the source of truth."
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP: importing */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
              <p className="mt-3 text-sm text-slate-600">
                {mode === "replace"
                  ? "Replacing the directory…"
                  : "Merging records…"}
              </p>
            </div>
          )}

          {/* STEP: done */}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="mt-3 text-sm font-medium text-slate-800">
                Import complete
              </p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">{result}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <div className="text-xs text-slate-400">
            {step === "map" && requiredMissing.length > 0 && (
              <span className="text-rose-500">
                Map required field(s): {requiredMissing.join(", ")}
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
                {step === "map" && (
                  <button
                    onClick={handleImport}
                    disabled={
                      !build ||
                      build.records.length === 0 ||
                      requiredMissing.length > 0
                    }
                    className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {mode === "replace" ? "Replace directory" : "Merge import"}
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

function ModeCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
        active
          ? "border-brand-600 bg-brand-50"
          : "border-slate-200 hover:bg-slate-50"
      )}
    >
      <span
        className={classNames(
          "flex items-center gap-2 text-sm font-semibold",
          active ? "text-brand-700" : "text-slate-700"
        )}
      >
        {icon}
        {title}
      </span>
      <span className="text-xs text-slate-500">{desc}</span>
    </button>
  );
}

function SetupNotice() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <p className="font-semibold">Finish the Google & Firebase setup first</p>
      <p className="mt-1 text-amber-700">
        Add your Firebase and Google Cloud keys to <code>.env.local</code> and
        restart the dev server. See <code>SETUP-GOOGLE-SHEETS.md</code> for
        step-by-step instructions.
      </p>
      <ul className="mt-2 list-inside list-disc text-xs text-amber-700">
        {!isFirebaseConfigured && <li>Missing: Firebase config</li>}
        {!isGoogleConfigured && <li>Missing: Google Client ID / API key</li>}
      </ul>
    </div>
  );
}
