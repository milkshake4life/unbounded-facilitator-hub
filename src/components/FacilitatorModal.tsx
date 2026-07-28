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
} from "lucide-react";
import type { Facilitator, GradeBand } from "../types";
import { COMFORT_LABELS, STANDARDS_INSTITUTE_LABELS } from "../types";
import { classNames, comfortStyles, pathwayStyles } from "../lib/ui";
import { useHeadshotSrc } from "../lib/useHeadshot";
import { Avatar } from "./Avatar";

interface FacilitatorModalProps {
  facilitator: Facilitator;
  onClose: () => void;
  onEdit: (f: Facilitator) => void;
}

type TabId = "experience" | "availability" | "professional" | "contact";

const TABS: { id: TabId; label: string }[] = [
  { id: "experience", label: "UnboundEd Experience" },
  { id: "availability", label: "Availability" },
  { id: "professional", label: "Professional" },
  { id: "contact", label: "Contact & Gear" },
];

export function FacilitatorModal({
  facilitator,
  onClose,
  onEdit,
}: FacilitatorModalProps) {
  const [tab, setTab] = useState<TabId>("experience");
  const fullName = `${facilitator.firstName} ${facilitator.lastName}`;
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
              alt={fullName}
              boxClassName="h-20 w-20 shrink-0 rounded-full ring-4 ring-slate-50"
              iconClassName="h-10 w-10"
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-xl font-bold text-slate-900">
                  {fullName}
                </h2>
                {facilitator.status === "archived" && (
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-white">
                    Archived
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-sm text-slate-500">
                {facilitator.jobTitle} · {facilitator.currentEmployer}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="h-3.5 w-3.5" />
                {facilitator.city}, {facilitator.state}
              </p>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {facilitator.pathways.map((p) => (
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

          {facilitator.bio && (
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {facilitator.bio}
            </p>
          )}
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
          {tab === "availability" && <AvailabilityTab f={facilitator} />}
          {tab === "professional" && <ProfessionalTab f={facilitator} />}
          {tab === "contact" && <ContactTab f={facilitator} />}
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
      </Section>

      <Section
        icon={<GraduationCap className="h-4 w-4" />}
        title="Grade bands & comfort level"
      >
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

function AvailabilityTab({ f }: { f: Facilitator }) {
  return (
    <div className="space-y-6">
      <Section
        icon={<CalendarClock className="h-4 w-4" />}
        title="Typical availability"
      >
        <p className="text-sm text-slate-700">
          {f.availability === "Other" && f.availabilityOther
            ? f.availabilityOther
            : f.availability}
        </p>
      </Section>

      <Section icon={<Zap className="h-4 w-4" />} title="Available on short notice">
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
        <p className="mt-2 text-xs italic text-slate-400">
          Sometimes events get booked with a short lead time, or changes require
          another facilitator.
        </p>
      </Section>
    </div>
  );
}

function ProfessionalTab({ f }: { f: Facilitator }) {
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
        value={f.roleDescription || "—"}
      />
      <DetailRow
        icon={<Building2 className="h-4 w-4" />}
        label="School / district relationships"
        value={f.districtRelationships || "—"}
      />
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-slate-400">
          <FileText className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Resume
          </p>
          {f.resumeFileName ? (
            <button className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-slate-50">
              <Download className="h-4 w-4" />
              {f.resumeFileName}
            </button>
          ) : (
            <p className="text-sm text-slate-400">Not provided</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactTab({ f }: { f: Facilitator }) {
  return (
    <div className="space-y-5">
      <DetailRow
        icon={<Mail className="h-4 w-4" />}
        label="UnboundEd email"
        value={
          <a
            href={`mailto:${f.unboundedEmail}`}
            className="text-brand-700 hover:underline"
          >
            {f.unboundedEmail}
          </a>
        }
      />
      <DetailRow
        icon={<Mail className="h-4 w-4" />}
        label="Personal email"
        value={
          <a
            href={`mailto:${f.personalEmail}`}
            className="text-brand-700 hover:underline"
          >
            {f.personalEmail}
          </a>
        }
      />
      <DetailRow
        icon={<Phone className="h-4 w-4" />}
        label="Cell phone"
        value={f.cellPhone}
      />
      <DetailRow
        icon={<Home className="h-4 w-4" />}
        label="Address"
        value={`${f.streetAddress}, ${f.city}, ${f.state} ${f.zipCode}`}
      />
      <DetailRow
        icon={<ShieldAlert className="h-4 w-4" />}
        label="Emergency contact"
        value={`${f.emergencyContactName} · ${f.emergencyContactNumber}`}
      />
      <DetailRow
        icon={<Shirt className="h-4 w-4" />}
        label="UnboundEd gear"
        value={
          <>
            {f.hasPolo ? "Has polo" : "Needs polo"} · {f.poloStyle} · Size{" "}
            {f.shirtSize}
          </>
        }
      />
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
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="text-sm text-slate-700">{value}</p>
      </div>
    </div>
  );
}
