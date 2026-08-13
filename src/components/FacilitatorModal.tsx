import { useState } from "react";
import {
  X,
  MapPin,
  Mail,
  Phone,
  Home,
  ShieldAlert,
  Shirt,
  GraduationCap,
  CalendarClock,
  Zap,
  Briefcase,
  Building2,
  FileText,
  Award,
  Check,
  Minus,
  Pencil,
  Download,
  Sparkles,
  Loader2,
  Wand2,
  Cake,
} from "lucide-react";
import type { Facilitator, GradeBand } from "../types";
import { COMFORT_LABELS, STANDARDS_INSTITUTE_LABELS } from "../types";
import {
  displayNameWithPronouns,
  hasDistinctPreferredName,
  legalName,
} from "../lib/facilitatorName";
import { formatBirthdayShort } from "../lib/birthdays";
import { classNames, comfortStyles, pathwayStyles } from "../lib/ui";
import { useHeadshotSrc } from "../lib/useHeadshot";
import { openAndDownloadResume } from "../lib/facilitatorsService";
import { generateFacilitatorBio, isBioAiConfigured } from "../lib/generateBio";
import { Avatar } from "./Avatar";

interface FacilitatorModalProps {
  facilitator: Facilitator;
  onClose: () => void;
  onEdit: (f: Facilitator) => void;
  /** Persist an updated facilitator without closing the profile modal. */
  onUpdate: (f: Facilitator) => void;
}

type TabId = "experience" | "professional" | "bio" | "contact";

const TABS: { id: TabId; label: string }[] = [
  { id: "experience", label: "UnboundEd Experience" },
  { id: "professional", label: "Professional" },
  { id: "bio", label: "Biography" },
  { id: "contact", label: "Contact & Availability" },
];

export function FacilitatorModal({
  facilitator,
  onClose,
  onEdit,
  onUpdate,
}: FacilitatorModalProps) {
  const [tab, setTab] = useState<TabId>("experience");
  const nameWithPronouns = displayNameWithPronouns(facilitator);
  const showLegalName = hasDistinctPreferredName(facilitator);
  const birthdayLabel = formatBirthdayShort(facilitator.birthday);
  const role = joinParts([facilitator.jobTitle, facilitator.currentEmployer]);
  const location = joinParts([facilitator.city, facilitator.state], ", ");
  const headshotSrc = useHeadshotSrc(
    facilitator.id,
    facilitator.hasStoredHeadshot,
    facilitator.headshot
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-[640px] max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-5">
          <div className="flex items-start gap-4">
            <Avatar
              src={headshotSrc}
              alt={nameWithPronouns}
              boxClassName="h-20 w-20 shrink-0 rounded-full ring-4 ring-slate-50"
              iconClassName="h-10 w-10"
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-xl font-bold text-slate-900">
                  {nameWithPronouns}
                </h2>
                {facilitator.status === "archived" && (
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-white">
                    Archived
                  </span>
                )}
              </div>
              {showLegalName && (
                <p className="mt-0.5 truncate text-xs text-slate-400">
                  Legal name: {legalName(facilitator)}
                </p>
              )}
              {birthdayLabel && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                  <Cake className="h-3.5 w-3.5" />
                  Birthday {birthdayLabel}
                </p>
              )}
              <p
                className={classNames(
                  "mt-0.5 truncate text-sm",
                  role ? "text-slate-500" : "text-slate-400"
                )}
              >
                {role || "Role not provided"}
              </p>
              <p
                className={classNames(
                  "mt-1 flex items-center gap-1 text-xs",
                  location ? "text-slate-400" : "text-slate-300"
                )}
              >
                <MapPin className="h-3.5 w-3.5" />
                {location || "Location not provided"}
              </p>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {facilitator.pathways.length > 0 ? (
                  facilitator.pathways.map((p) => (
                    <span
                      key={p}
                      className={classNames(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                        pathwayStyles[p]
                      )}
                    >
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-400 ring-1 ring-inset ring-slate-200">
                    No pathways indicated
                  </span>
                )}
              </div>
            </div>

            {/* Actions: same row / hierarchy as the headshot */}
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => onEdit(facilitator)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 gap-1 border-b border-slate-100 px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={classNames(
                "relative px-3 py-3 text-sm font-medium transition-colors",
                tab === t.id
                  ? "text-brand-700"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-600" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "experience" && <ExperienceTab f={facilitator} />}
          {tab === "professional" && <ProfessionalTab f={facilitator} />}
          {tab === "bio" && (
            <BioTab f={facilitator} onUpdate={onUpdate} />
          )}
          {tab === "contact" && <ContactAvailabilityTab f={facilitator} />}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Tabs ------------------------------ */

function ExperienceTab({ f }: { f: Facilitator }) {
  return (
    <div className="space-y-6">
      <Section icon={<Award className="h-4 w-4" />} title="Pathways">
        {f.pathways.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {f.pathways.map((p) => (
              <span
                key={p}
                className={classNames(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                  pathwayStyles[p]
                )}
              >
                {p}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">None indicated</p>
        )}
      </Section>

      <Section
        icon={<GraduationCap className="h-4 w-4" />}
        title="Grade bands & comfort level"
      >
        {f.gradeBands.length === 0 && (
          <p className="text-sm text-slate-400">None indicated</p>
        )}
        <div className="space-y-1.5">
          {f.gradeBands.map((g) => {
            const comfort = f.comfortByGradeBand[g as GradeBand];
            return (
              <div
                key={g}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
              >
                <span className="text-sm font-medium text-slate-700">{g}</span>
                {comfort ? (
                  <span
                    className={classNames(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                      comfortStyles[comfort].chip
                    )}
                  >
                    <span
                      className={classNames(
                        "h-1.5 w-1.5 rounded-full",
                        comfortStyles[comfort].dot
                      )}
                    />
                    {COMFORT_LABELS[comfort]}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        icon={<Award className="h-4 w-4" />}
        title="UnboundEd facilitation history"
      >
        <div className="space-y-1.5">
          <HistoryRow
            label="Standards Institute"
            value={STANDARDS_INSTITUTE_LABELS[f.standardsInstitute]}
            positive={f.standardsInstitute !== "no"}
          />
          <HistoryRow
            label="Summit"
            value={f.facilitatedSummit ? "Yes" : "No"}
            positive={f.facilitatedSummit}
          />
          <HistoryRow
            label="In-Service Learning Module"
            value={f.facilitatedInService ? "Yes" : "No"}
            positive={f.facilitatedInService}
          />
        </div>
      </Section>

      <Section
        icon={<Award className="h-4 w-4" />}
        title="Other UnboundEd / CORE programs"
      >
        {f.otherPrograms.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {f.otherPrograms.map((p) => (
              <span
                key={p}
                className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
              >
                {p}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">None indicated</p>
        )}
      </Section>
    </div>
  );
}

function BioTab({
  f,
  onUpdate,
}: {
  f: Facilitator;
  onUpdate: (f: Facilitator) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasBio = Boolean(f.bio?.trim());

  async function handleGenerate() {
    setError(null);
    setBusy(true);
    try {
      const bio = await generateFacilitatorBio(f);
      onUpdate({ ...f, bio, bioGeneratedByAi: isBioAiConfigured() });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {f.bioGeneratedByAi && hasBio && (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-600/15">
          <Sparkles className="h-3.5 w-3.5" />
          Auto-generated with AI
        </div>
      )}

      {hasBio ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
          {f.bio}
        </p>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
          <p className="text-sm font-medium text-slate-700">
            No biography yet
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Bios are optional on the intake form — if left blank, we can create
            one with AI for district submissions.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          {busy
            ? "Generating…"
            : hasBio
              ? "Regenerate with AI"
              : "Generate with AI"}
        </button>
        {hasBio && !f.bioGeneratedByAi && (
          <p className="text-xs text-slate-400">
            Provided by the facilitator
          </p>
        )}
        {!isBioAiConfigured() && (
          <p className="w-full text-xs text-amber-700">
            Add <code className="rounded bg-amber-50 px-1">VITE_GEMINI_API_KEY</code> to{" "}
            <code className="rounded bg-amber-50 px-1">.env.local</code> and restart
            the dev server for real AI bios (see SETUP Step 5b).
          </p>
        )}
      </div>
    </div>
  );
}

function ProfessionalTab({ f }: { f: Facilitator }) {
  const [resumeBusy, setResumeBusy] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const canOpenResume = Boolean(f.resumeDriveFileId);

  async function handleResumeClick() {
    if (!f.resumeDriveFileId || resumeBusy) return;
    setResumeError(null);
    setResumeBusy(true);
    try {
      await openAndDownloadResume(
        f.resumeDriveFileId,
        f.resumeFileName || "resume.pdf"
      );
    } catch (err) {
      setResumeError(
        err instanceof Error ? err.message : "Could not open resume."
      );
    } finally {
      setResumeBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <DetailRow
        icon={<Building2 className="h-4 w-4" />}
        label="Current employer"
        value={f.currentEmployer}
      />
      <DetailRow
        icon={<Briefcase className="h-4 w-4" />}
        label="Job title"
        value={f.jobTitle}
      />
      <DetailRow
        icon={<FileText className="h-4 w-4" />}
        label="Role & responsibilities"
        value={f.roleDescription}
      />
      <DetailRow
        icon={<Building2 className="h-4 w-4" />}
        label="School / district relationships"
        value={f.districtRelationships}
      />
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-slate-400">
          <FileText className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Resume
          </p>
          {canOpenResume ? (
            <>
              <button
                type="button"
                onClick={handleResumeClick}
                disabled={resumeBusy}
                className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
              >
                {resumeBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {f.resumeFileName || "Download resume"}
              </button>
              {resumeError && (
                <p className="mt-1 text-xs text-rose-600">{resumeError}</p>
              )}
            </>
          ) : f.resumeFileName ? (
            <p className="mt-1 text-sm text-slate-500">
              {f.resumeFileName}
              <span className="block text-xs text-slate-400">
                Import resumes from Drive to attach a downloadable link.
              </span>
            </p>
          ) : (
            <p className="text-sm text-slate-400">Not provided</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactAvailabilityTab({ f }: { f: Facilitator }) {
  const cityStateZip = joinParts(
    [joinParts([f.city, f.state], ", "), f.zipCode],
    " "
  );
  const address = joinParts([f.streetAddress, cityStateZip], ", ");
  const emergencyContact = joinParts([
    f.emergencyContactName,
    f.emergencyContactNumber,
  ]);
  const gear = joinParts([
    f.hasPolo === undefined ? "" : f.hasPolo ? "Has polo" : "Needs polo",
    f.poloStyle,
    f.shirtSize && `Size ${f.shirtSize}`,
  ]);
  const availability =
    f.availability === "Other" && f.availabilityOther
      ? f.availabilityOther
      : f.availability;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <DetailRow
          icon={<Mail className="h-4 w-4" />}
          label="UnboundEd email"
          value={<MailLink address={f.unboundedEmail} />}
        />
        <DetailRow
          icon={<Mail className="h-4 w-4" />}
          label="Personal email"
          value={<MailLink address={f.personalEmail} />}
        />
        <DetailRow
          icon={<Phone className="h-4 w-4" />}
          label="Cell phone"
          value={f.cellPhone}
        />
        <DetailRow
          icon={<Home className="h-4 w-4" />}
          label="Address"
          value={address}
        />
        <DetailRow
          icon={<ShieldAlert className="h-4 w-4" />}
          label="Emergency contact"
          value={emergencyContact}
        />
      </div>

      <div className="space-y-6 border-t border-slate-100 pt-5">
        <Section
          icon={<CalendarClock className="h-4 w-4" />}
          title="Typical availability"
        >
          {availability ? (
            <p className="text-sm text-slate-700">{availability}</p>
          ) : (
            <p className="text-sm text-slate-400">Not provided</p>
          )}
        </Section>

        <Section icon={<Zap className="h-4 w-4" />} title="Available on short notice">
          {f.availableShortNotice ? (
            <span
              className={classNames(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ring-1 ring-inset",
                f.availableShortNotice === "Yes"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                  : f.availableShortNotice === "Maybe"
                    ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                    : "bg-slate-100 text-slate-500 ring-slate-500/20"
              )}
            >
              {f.availableShortNotice}
            </span>
          ) : (
            <p className="text-sm text-slate-400">Not provided</p>
          )}
          <p className="mt-2 text-xs italic text-slate-400">
            Sometimes events get booked with a short lead time, or changes require
            another facilitator.
          </p>
        </Section>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <DetailRow
          icon={<Shirt className="h-4 w-4" />}
          label="UnboundEd gear"
          value={gear}
          placeholder="No gear preferences on file"
        />
      </div>
    </div>
  );
}

/* --------------------------- Primitives --------------------------- */

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-slate-400">{icon}</span>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function HistoryRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
      <span className="text-sm text-slate-700">{label}</span>
      <span
        className={classNames(
          "inline-flex items-center gap-1.5 text-sm font-medium",
          positive ? "text-emerald-700" : "text-slate-400"
        )}
      >
        <span
          className={classNames(
            "flex h-4 w-4 items-center justify-center rounded-full",
            positive ? "bg-emerald-100" : "bg-slate-200"
          )}
        >
          {positive ? (
            <Check className="h-3 w-3 text-emerald-600" />
          ) : (
            <Minus className="h-3 w-3 text-slate-400" />
          )}
        </span>
        {value}
      </span>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  placeholder = "Not provided",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  /** Shown greyed out when `value` is blank, so gaps read as "we don't know". */
  placeholder?: string;
}) {
  const isBlank =
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "");

  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p
          className={classNames(
            "text-sm",
            isBlank ? "text-slate-400" : "text-slate-700"
          )}
        >
          {isBlank ? placeholder : value}
        </p>
      </div>
    </div>
  );
}

function MailLink({ address }: { address?: string }) {
  const email = address?.trim();
  if (!email) return <span className="text-slate-400">Not provided</span>;
  return (
    <a href={`mailto:${email}`} className="text-brand-700 hover:underline">
      {email}
    </a>
  );
}

/** Join only the pieces we actually have, so partial data never reads as complete. */
function joinParts(
  parts: (string | undefined | false)[],
  separator = " · "
): string {
  return parts
    .map((p) => (p ? p.trim() : ""))
    .filter(Boolean)
    .join(separator);
}
