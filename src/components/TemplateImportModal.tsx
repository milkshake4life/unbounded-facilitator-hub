import { useState } from "react";
import { AlertCircle, FileText, Loader2, X } from "lucide-react";
import {
  exportGoogleDocHtml,
  getAccessToken,
  isGoogleConfigured,
  pickGoogleDoc,
} from "../lib/googleSheets";
import {
  parseTemplatesFromDocHtml,
  type ParsedTemplateRow,
} from "../lib/templateImport";
import { isFirebaseConfigured } from "../lib/firebase";

interface TemplateImportModalProps {
  onClose: () => void;
  /** Persist the parsed drafts as new templates. */
  onImport: (drafts: ParsedTemplateRow[]) => Promise<void>;
}

type Step = "pick" | "preview" | "done";

/**
 * One-time / bulk seed of the shared template library from a Google Doc
 * whose tables use Communication | Purpose/Timeline | Text columns.
 */
export function TemplateImportModal({
  onClose,
  onImport,
}: TemplateImportModalProps) {
  const [step, setStep] = useState<Step>("pick");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docName, setDocName] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<ParsedTemplateRow[]>([]);
  const [importedCount, setImportedCount] = useState(0);

  const ready = isGoogleConfigured && isFirebaseConfigured;

  async function handlePickDoc() {
    setError(null);
    setBusy(true);
    try {
      const token = await getAccessToken();
      const picked = await pickGoogleDoc(token);
      if (!picked) {
        setBusy(false);
        return;
      }
      const html = await exportGoogleDocHtml(token, picked.id);
      const parsed = parseTemplatesFromDocHtml(html);
      if (parsed.length === 0) {
        throw new Error(
          "No templates found in that Doc. Expected tables with columns “Communication”, “Purpose/Timeline”, and “Text”."
        );
      }
      setDocName(picked.name);
      setDrafts(parsed);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleImport() {
    if (drafts.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      await onImport(drafts);
      setImportedCount(drafts.length);
      setStep("done");
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
        aria-labelledby="template-import-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2
              id="template-import-title"
              className="text-base font-bold text-slate-900"
            >
              Import templates from Doc
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Seed the library from your Facilitator Communication Templates
              Doc. New templates are added — existing ones are left alone.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {!ready && (
            <div className="mb-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Finish Firebase + Google Drive setup (see SETUP-GOOGLE-SHEETS.md)
                before importing.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {step === "pick" && (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <FileText className="h-7 w-7" />
              </div>
              <p className="mt-4 max-w-md text-sm text-slate-600">
                Pick the Google Doc with tables for{" "}
                <span className="font-semibold">Communication</span>,{" "}
                <span className="font-semibold">Purpose/Timeline</span>, and{" "}
                <span className="font-semibold">Text</span>. Subject lines
                inside Text cells are detected automatically.
              </p>
              <button
                type="button"
                disabled={!ready || busy}
                onClick={() => void handlePickDoc()}
                className="mt-6 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Choose Google Doc
              </button>
            </div>
          )}

          {step === "preview" && (
            <div>
              <p className="text-sm text-slate-600">
                Found{" "}
                <span className="font-semibold text-slate-800">
                  {drafts.length}
                </span>{" "}
                template{drafts.length === 1 ? "" : "s"}
                {docName ? (
                  <>
                    {" "}
                    in <span className="font-medium">{docName}</span>
                  </>
                ) : null}
                .
              </p>
              <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
                {drafts.map((d, i) => (
                  <li
                    key={`${d.name}-${i}`}
                    className="rounded-lg px-3 py-2 hover:bg-slate-50"
                  >
                    <p className="text-sm font-semibold text-slate-800">
                      {d.name}
                    </p>
                    {d.purpose && (
                      <p className="text-xs text-brand-700">{d.purpose}</p>
                    )}
                    {d.subject && (
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        Subject: {d.subject}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center py-10 text-center">
              <p className="text-base font-semibold text-slate-900">
                Imported {importedCount} template
                {importedCount === 1 ? "" : "s"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                They’re in the shared library. You can edit them anytime.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {step === "preview" && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
            <button
              type="button"
              onClick={() => {
                setStep("pick");
                setDocName(null);
                setDrafts([]);
                setError(null);
              }}
              disabled={busy}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              disabled={busy || drafts.length === 0}
              onClick={() => void handleImport()}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Import {drafts.length} template
              {drafts.length === 1 ? "" : "s"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
