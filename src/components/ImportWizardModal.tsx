import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Replace,
  GitMerge,
  FolderOpen,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import {
  getAccessToken,
  pickSpreadsheet,
  pickFolder,
  readSheet,
  listImagesInFolder,
  listResumesInFolder,
  downloadDriveFile,
  isGoogleConfigured,
  type SheetData,
  type PickedFolder,
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
  saveHeadshot,
  saveResume,
} from "../lib/facilitatorsService";
import { buildMatches, type FileMatch } from "../lib/headshotMatch";
import { compressImageToDataUrl } from "../lib/image";
import { primeHeadshotCache } from "../lib/useHeadshot";
import { isFirebaseConfigured } from "../lib/firebase";
import { classNames } from "../lib/ui";
import { displayName } from "../lib/facilitatorName";
import type { Facilitator } from "../types";

type Step =
  | "pick"
  | "map"
  | "importing"
  | "reviewHeadshots"
  | "reviewResumes"
  | "uploading"
  | "done";

type ImportMode = "merge" | "replace";

interface DriveFiles {
  folder: PickedFolder;
  files: { id: string; name: string }[];
}

interface ImportWizardModalProps {
  onClose: () => void;
}

interface CacheEntry {
  blob: Blob;
  url: string;
}

function duplicateIds(matches: FileMatch[]): Set<string> {
  const counts = new Map<string, number>();
  matches.forEach((m) => {
    if (m.facilitatorId)
      counts.set(m.facilitatorId, (counts.get(m.facilitatorId) ?? 0) + 1);
  });
  return new Set(
    [...counts.entries()].filter(([, c]) => c > 1).map(([id]) => id)
  );
}

export function ImportWizardModal({ onClose }: ImportWizardModalProps) {
  const [step, setStep] = useState<Step>("pick");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sheet, setSheet] = useState<SheetData | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [mode, setMode] = useState<ImportMode>("merge");
  const [result, setResult] = useState<string | null>(null);

  const [headshots, setHeadshots] = useState<DriveFiles | null>(null);
  const [resumes, setResumes] = useState<DriveFiles | null>(null);
  const [pickingFolder, setPickingFolder] = useState<"headshots" | "resumes" | null>(
    null
  );

  const [importedFacilitators, setImportedFacilitators] = useState<
    Facilitator[]
  >([]);
  const [headshotMatches, setHeadshotMatches] = useState<FileMatch[]>([]);
  const [resumeMatches, setResumeMatches] = useState<FileMatch[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0, label: "" });

  const tokenRef = useRef<string | null>(null);
  const imageCacheRef = useRef<Map<string, CacheEntry>>(new Map());

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

  const facById = useMemo(() => {
    const m = new Map<string, Facilitator>();
    importedFacilitators.forEach((f) => m.set(f.id, f));
    return m;
  }, [importedFacilitators]);

  const sortedFacilitators = useMemo(
    () =>
      [...importedFacilitators].sort((a, b) =>
        displayName(a).localeCompare(displayName(b))
      ),
    [importedFacilitators]
  );

  const headshotDupes = useMemo(
    () => duplicateIds(headshotMatches),
    [headshotMatches]
  );
  const resumeDupes = useMemo(
    () => duplicateIds(resumeMatches),
    [resumeMatches]
  );
  const headshotAssigned = headshotMatches.filter((m) => m.facilitatorId).length;
  const resumeAssigned = resumeMatches.filter((m) => m.facilitatorId).length;

  useEffect(() => {
    const cache = imageCacheRef.current;
    return () => {
      cache.forEach((e) => URL.revokeObjectURL(e.url));
    };
  }, []);

  async function ensureToken(): Promise<string> {
    if (tokenRef.current) return tokenRef.current;
    const t = await getAccessToken();
    tokenRef.current = t;
    return t;
  }

  async function handlePickSheet() {
    setError(null);
    setBusy(true);
    try {
      const token = await ensureToken();
      const picked = await pickSpreadsheet(token);
      if (!picked) {
        setBusy(false);
        return;
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

  async function handlePickFolder(kind: "headshots" | "resumes") {
    setError(null);
    setPickingFolder(kind);
    try {
      const token = await ensureToken();
      const picked = await pickFolder(
        token,
        kind === "headshots"
          ? "Select the folder of headshot photos"
          : "Select the folder of resume files"
      );
      if (!picked) return;

      if (kind === "headshots") {
        const files = await listImagesInFolder(token, picked.id);
        if (files.length === 0) {
          throw new Error("No image files were found in that folder.");
        }
        setHeadshots({ folder: picked, files });
      } else {
        const files = await listResumesInFolder(token, picked.id);
        if (files.length === 0) {
          throw new Error(
            "No PDF or Word resume files were found in that folder."
          );
        }
        setResumes({ folder: picked, files });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPickingFolder(null);
    }
  }

  function setMatchAssignment(
    kind: "headshots" | "resumes",
    fileId: string,
    facilitatorId: string | null
  ) {
    const updater = (prev: FileMatch[]) =>
      prev.map((m) =>
        m.fileId === fileId ? { ...m, facilitatorId, ambiguous: false } : m
      );
    if (kind === "headshots") setHeadshotMatches(updater);
    else setResumeMatches(updater);
  }

  async function loadImage(fileId: string): Promise<CacheEntry> {
    const cached = imageCacheRef.current.get(fileId);
    if (cached) return cached;
    const token = await ensureToken();
    const blob = await downloadDriveFile(token, fileId);
    const entry = { blob, url: URL.createObjectURL(blob) };
    imageCacheRef.current.set(fileId, entry);
    return entry;
  }

  function advanceAfterSheet(
    facilitators: Facilitator[],
    sheetSummary: string
  ) {
    setImportedFacilitators(facilitators);
    setResult(sheetSummary);

    if (headshots) {
      setHeadshotMatches(buildMatches(headshots.files, facilitators));
      setStep("reviewHeadshots");
      return;
    }
    if (resumes) {
      setResumeMatches(buildMatches(resumes.files, facilitators));
      setStep("reviewResumes");
      return;
    }
    setStep("done");
  }

  async function handleImportSheet() {
    if (!build) return;
    setError(null);
    setStep("importing");
    try {
      let sheetSummary: string;
      let facilitators: Facilitator[];

      if (mode === "replace") {
        const r = await replaceAllFacilitators(build.records);
        sheetSummary = `Replaced the directory: ${r.added} imported, ${r.deleted} previous record(s) removed.`;
        facilitators = r.facilitators;
      } else {
        const r = await mergeFacilitatorsByEmail(
          build.records,
          build.overlayKeys
        );
        sheetSummary = `Merge complete: ${r.updated} updated, ${r.added} added (matched by email).`;
        facilitators = r.facilitators;
      }

      advanceAfterSheet(facilitators, sheetSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep("map");
    }
  }

  async function handleUploadHeadshots() {
    const toUpload = headshotMatches.filter((m) => m.facilitatorId);
    setError(null);
    setStep("uploading");
    setProgress({
      done: 0,
      total: toUpload.length,
      label: "Uploading headshots",
    });

    let uploaded = 0;
    let failed = 0;
    for (const m of toUpload) {
      try {
        const entry = await loadImage(m.fileId);
        const dataUrl = await compressImageToDataUrl(entry.blob);
        await saveHeadshot(m.facilitatorId!, dataUrl);
        primeHeadshotCache(m.facilitatorId!, dataUrl);
        uploaded += 1;
      } catch (err) {
        console.error(`Failed to upload ${m.fileName}:`, err);
        failed += 1;
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    const skipped = headshotMatches.length - toUpload.length;
    const parts = [
      `${uploaded} headshot${uploaded === 1 ? "" : "s"} uploaded`,
    ];
    if (skipped > 0) parts.push(`${skipped} skipped`);
    if (failed > 0) parts.push(`${failed} failed`);
    setResult((prev) => `${prev ?? ""}\n${parts.join(", ")}.`.trim());

    if (resumes) {
      setResumeMatches(buildMatches(resumes.files, importedFacilitators));
      setStep("reviewResumes");
    } else {
      setStep("done");
    }
  }

  async function handleUploadResumes() {
    const toUpload = resumeMatches.filter((m) => m.facilitatorId);
    setError(null);
    setStep("uploading");
    setProgress({
      done: 0,
      total: toUpload.length,
      label: "Linking resumes",
    });

    let uploaded = 0;
    let failed = 0;
    for (const m of toUpload) {
      try {
        await saveResume(m.facilitatorId!, m.fileId, m.fileName);
        uploaded += 1;
      } catch (err) {
        console.error(`Failed to link ${m.fileName}:`, err);
        failed += 1;
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    const skipped = resumeMatches.length - toUpload.length;
    const parts = [`${uploaded} resume${uploaded === 1 ? "" : "s"} linked`];
    if (skipped > 0) parts.push(`${skipped} skipped`);
    if (failed > 0) parts.push(`${failed} failed`);
    setResult((prev) => `${prev ?? ""}\n${parts.join(", ")}.`.trim());
    setStep("done");
  }

  function skipHeadshotReview() {
    setResult((prev) => `${prev ?? ""}\nHeadshots skipped.`.trim());
    if (resumes) {
      setResumeMatches(buildMatches(resumes.files, importedFacilitators));
      setStep("reviewResumes");
    } else {
      setStep("done");
    }
  }

  function skipResumeReview() {
    setResult((prev) => `${prev ?? ""}\nResumes skipped.`.trim());
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

          {ready && step === "pick" && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <FileSpreadsheet className="h-7 w-7" />
              </div>
              <p className="mt-4 max-w-sm text-sm text-slate-600">
                Choose the Google Sheet with facilitator data. On the next step
                you can optionally attach Drive folders for headshots and
                resumes before anything is saved.
              </p>
              <button
                onClick={handlePickSheet}
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
                {IMPORT_FIELDS.map((field) => {
                  const unmapped = mapping[field.key] < 0;
                  return (
                    <div
                      key={field.key}
                      className={classNames(
                        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2",
                        unmapped
                          ? field.required
                            ? "border-rose-400 bg-rose-50 ring-1 ring-rose-200"
                            : "border-amber-400 bg-amber-50 ring-1 ring-amber-200"
                          : "border-slate-200"
                      )}
                    >
                      <span
                        className={classNames(
                          "text-xs font-medium",
                          unmapped
                            ? field.required
                              ? "text-rose-800"
                              : "text-amber-900"
                            : "text-slate-600"
                        )}
                      >
                        {field.label}
                        {field.required && (
                          <span className="text-rose-500"> *</span>
                        )}
                        {unmapped && (
                          <span
                            className={classNames(
                              "ml-1.5 font-normal",
                              field.required ? "text-rose-600" : "text-amber-700"
                            )}
                          >
                            · not matched
                          </span>
                        )}
                      </span>
                      <select
                        value={mapping[field.key]}
                        onChange={(e) =>
                          setFieldColumn(field.key, Number(e.target.value))
                        }
                        className={classNames(
                          "max-w-[55%] rounded-md border px-2 py-1 text-xs outline-none",
                          unmapped
                            ? field.required
                              ? "border-rose-400 bg-white text-rose-800"
                              : "border-amber-400 bg-white text-amber-900"
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
                  );
                })}
              </div>

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
                              {displayName(r)}
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
                      Skipped rows:{" "}
                      {build.skipped
                        .slice(0, 5)
                        .map((s) => `#${s.row} (${s.reason})`)
                        .join(", ")}
                      {build.skipped.length > 5 && "…"}
                    </p>
                  )}
                </div>
              )}

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

              <div className="mt-5">
                <p className="mb-1 text-sm font-semibold text-slate-800">
                  Attach Drive folders{" "}
                  <span className="font-normal text-slate-400">(optional)</span>
                </p>
                <p className="mb-3 text-xs text-slate-500">
                  After the sheet is imported, we'll match files by filename and
                  let you review before attaching them.
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <FolderAttachCard
                    icon={<ImageIcon className="h-4 w-4" />}
                    title="Headshots"
                    folder={headshots}
                    busy={pickingFolder === "headshots"}
                    onPick={() => handlePickFolder("headshots")}
                    onClear={() => setHeadshots(null)}
                  />
                  <FolderAttachCard
                    icon={<FileText className="h-4 w-4" />}
                    title="Resumes"
                    folder={resumes}
                    busy={pickingFolder === "resumes"}
                    onPick={() => handlePickFolder("resumes")}
                    onClear={() => setResumes(null)}
                  />
                </div>
              </div>
            </div>
          )}

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

          {step === "reviewHeadshots" && (
            <FileReviewStep
              kind="headshots"
              folderName={headshots?.folder.name ?? "Headshots"}
              matches={headshotMatches}
              facilitators={sortedFacilitators}
              facById={facById}
              duplicates={headshotDupes}
              loadImage={loadImage}
              onAssign={(fileId, id) =>
                setMatchAssignment("headshots", fileId, id)
              }
            />
          )}

          {step === "reviewResumes" && (
            <FileReviewStep
              kind="resumes"
              folderName={resumes?.folder.name ?? "Resumes"}
              matches={resumeMatches}
              facilitators={sortedFacilitators}
              facById={facById}
              duplicates={resumeDupes}
              onAssign={(fileId, id) =>
                setMatchAssignment("resumes", fileId, id)
              }
            />
          )}

          {step === "uploading" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
              <p className="mt-3 text-sm text-slate-600">
                {progress.label}… {progress.done} / {progress.total}
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

          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="mt-3 text-sm font-medium text-slate-800">
                Import complete
              </p>
              <p className="mt-1 max-w-sm whitespace-pre-line text-sm text-slate-500">
                {result}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <div className="text-xs text-slate-400">
            {step === "map" && requiredMissing.length > 0 && (
              <span className="text-rose-500">
                Map required field(s): {requiredMissing.join(", ")}
              </span>
            )}
            {step === "reviewHeadshots" && headshotDupes.size > 0 && (
              <span className="text-amber-600">
                Some facilitators are assigned more than one photo — the last
                one wins.
              </span>
            )}
            {step === "reviewResumes" && resumeDupes.size > 0 && (
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
                {step === "map" && (
                  <button
                    onClick={handleImportSheet}
                    disabled={
                      !build ||
                      build.records.length === 0 ||
                      requiredMissing.length > 0 ||
                      pickingFolder !== null
                    }
                    className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {mode === "replace" ? "Replace directory" : "Merge import"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
                {step === "reviewHeadshots" && (
                  <>
                    <button
                      onClick={skipHeadshotReview}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Skip headshots
                    </button>
                    <button
                      onClick={handleUploadHeadshots}
                      disabled={headshotAssigned === 0}
                      className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Upload {headshotAssigned} headshot
                      {headshotAssigned === 1 ? "" : "s"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </>
                )}
                {step === "reviewResumes" && (
                  <>
                    <button
                      onClick={skipResumeReview}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Skip resumes
                    </button>
                    <button
                      onClick={handleUploadResumes}
                      disabled={resumeAssigned === 0}
                      className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Link {resumeAssigned} resume
                      {resumeAssigned === 1 ? "" : "s"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FolderAttachCard({
  icon,
  title,
  folder,
  busy,
  onPick,
  onClear,
}: {
  icon: React.ReactNode;
  title: string;
  folder: DriveFiles | null;
  busy: boolean;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        {icon}
        {title}
      </div>
      {folder ? (
        <div className="mt-2">
          <p className="truncate text-xs text-slate-600" title={folder.folder.name}>
            <span className="font-medium text-slate-800">
              {folder.folder.name}
            </span>{" "}
            · {folder.files.length} file
            {folder.files.length === 1 ? "" : "s"}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onPick}
              disabled={busy}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              {busy ? "Opening…" : "Change"}
            </button>
            <button
              type="button"
              onClick={onClear}
              disabled={busy}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-60"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onPick}
          disabled={busy}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-brand-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FolderOpen className="h-3.5 w-3.5" />
          )}
          {busy ? "Opening Google…" : "Choose Drive folder"}
        </button>
      )}
    </div>
  );
}

function FileReviewStep({
  kind,
  folderName,
  matches,
  facilitators,
  facById,
  duplicates,
  loadImage,
  onAssign,
}: {
  kind: "headshots" | "resumes";
  folderName: string;
  matches: FileMatch[];
  facilitators: Facilitator[];
  facById: Map<string, Facilitator>;
  duplicates: Set<string>;
  loadImage?: (fileId: string) => Promise<{ url: string }>;
  onAssign: (fileId: string, facilitatorId: string | null) => void;
}) {
  const assigned = matches.filter((m) => m.facilitatorId).length;
  const sortedMatches = useMemo(() => {
    // Unmatched / skipped first so they need attention immediately.
    return [...matches].sort((a, b) => {
      const aOk = a.facilitatorId ? 1 : 0;
      const bOk = b.facilitatorId ? 1 : 0;
      if (aOk !== bOk) return aOk - bOk;
      // Ambiguous (had competing matches) before clean unmatched.
      if (!a.facilitatorId && !b.facilitatorId) {
        return Number(b.ambiguous) - Number(a.ambiguous);
      }
      return a.fileName.localeCompare(b.fileName);
    });
  }, [matches]);

  return (
    <div>
      <div className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
        <span className="font-medium text-slate-800">{folderName}</span> ·{" "}
        {matches.length} {kind === "headshots" ? "image" : "file"}
        {matches.length === 1 ? "" : "s"} ·{" "}
        <span className="font-medium text-slate-800">{assigned}</span> matched
        {matches.length - assigned > 0 && (
          <>
            {" "}
            ·{" "}
            <span className="font-medium text-amber-700">
              {matches.length - assigned} unmatched
            </span>
          </>
        )}
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Unmatched files are listed first. Confirm each file&apos;s facilitator,
        or leave as “Skip”.
      </p>
      <div className="space-y-2">
        {sortedMatches.map((m) => (
          <ReviewRow
            key={m.fileId}
            kind={kind}
            match={m}
            facilitators={facilitators}
            facById={facById}
            duplicate={!!m.facilitatorId && duplicates.has(m.facilitatorId)}
            loadImage={loadImage}
            onAssign={onAssign}
          />
        ))}
      </div>
    </div>
  );
}

function ReviewRow({
  kind,
  match,
  facilitators,
  facById,
  duplicate,
  loadImage,
  onAssign,
}: {
  kind: "headshots" | "resumes";
  match: FileMatch;
  facilitators: Facilitator[];
  facById: Map<string, Facilitator>;
  duplicate: boolean;
  loadImage?: (fileId: string) => Promise<{ url: string }>;
  onAssign: (fileId: string, facilitatorId: string | null) => void;
}) {
  const [thumb, setThumb] = useState<string | null>(null);
  const [thumbError, setThumbError] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (kind !== "headshots" || !loadImage) return;
    const el = rowRef.current;
    if (!el) return;
    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          loadImage(match.fileId)
            .then((e) => !cancelled && setThumb(e.url))
            .catch(() => !cancelled && setThumbError(true));
        }
      },
      { rootMargin: "100px" }
    );
    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [kind, match.fileId, loadImage]);

  const assigned = match.facilitatorId
    ? facById.get(match.facilitatorId)
    : undefined;

  return (
    <div
      ref={rowRef}
      className={classNames(
        "flex items-center gap-3 rounded-lg border p-2",
        match.facilitatorId
          ? "border-slate-200"
          : "border-amber-400 bg-amber-50 ring-1 ring-amber-200"
      )}
    >
      <div
        className={classNames(
          "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden bg-slate-100 text-slate-300",
          kind === "headshots" ? "rounded-full" : "rounded-lg"
        )}
      >
        {kind === "headshots" && thumb && !thumbError ? (
          <img
            src={thumb}
            alt={match.fileName}
            className="h-full w-full object-cover"
          />
        ) : kind === "headshots" ? (
          thumbError ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )
        ) : (
          <FileText className="h-5 w-5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-slate-500" title={match.fileName}>
          {match.fileName}
        </p>
        {match.facilitatorId ? (
          <p className="text-xs font-medium text-emerald-600">
            Matched
            {assigned ? `: ${displayName(assigned)}` : ""}
            {duplicate && (
              <span className="ml-1 text-amber-600">(duplicate)</span>
            )}
          </p>
        ) : (
          <p className="text-xs font-medium text-amber-700">
            {match.ambiguous ? "Ambiguous — needs a pick" : "Not matched"}
          </p>
        )}
      </div>

      <select
        value={match.facilitatorId ?? ""}
        onChange={(e) => onAssign(match.fileId, e.target.value || null)}
        className="max-w-[45%] rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-brand-500"
      >
        <option value="">— Skip —</option>
        {facilitators.map((f) => (
          <option key={f.id} value={f.id}>
            {displayName(f)}
          </option>
        ))}
      </select>
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
