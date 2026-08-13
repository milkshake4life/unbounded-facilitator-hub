import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type {
  Availability,
  ComfortLevel,
  Facilitator,
  GradeBand,
  Pathway,
  ShirtSize,
  ShirtStyle,
  ShortNotice,
  StandardsInstituteExperience,
} from "../types";
import {
  AVAILABILITY_OPTIONS,
  COMFORT_LABELS,
  GRADE_BANDS,
  PATHWAYS,
  SHIRT_SIZES,
  STANDARDS_INSTITUTE_LABELS,
} from "../types";
import { classNames } from "../lib/ui";
import { inputClass } from "./ModalShell";

interface FacilitatorFormModalProps {
  /** When provided, the form is in edit mode. */
  initial?: Facilitator | null;
  /** Programs already in use across the directory, offered as quick picks. */
  programOptions?: string[];
  onClose: () => void;
  onSave: (f: Facilitator) => void;
}

/** Mirrors the tabs on the read-only profile, plus Personal for identity fields. */
type TabId = "personal" | "experience" | "professional" | "bio" | "contact";

const TABS: { id: TabId; label: string }[] = [
  { id: "personal", label: "Personal" },
  { id: "experience", label: "UnboundEd Experience" },
  { id: "professional", label: "Professional" },
  { id: "bio", label: "Biography" },
  { id: "contact", label: "Contact & Availability" },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A validation failure, plus the tab the offending field lives on. */
interface FormError {
  tab: TabId;
  message: string;
}

export function FacilitatorFormModal({
  initial,
  programOptions = [],
  onClose,
  onSave,
}: FacilitatorFormModalProps) {
  // New records start on Personal; edits open on Experience like the profile.
  const [tab, setTab] = useState<TabId>(initial ? "experience" : "personal");
  // Errors stay hidden until the first save attempt, then clear themselves as
  // soon as the offending field is corrected.
  const [showErrors, setShowErrors] = useState(false);

  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [preferredName, setPreferredName] = useState(
    initial?.preferredName ?? ""
  );
  const [pronouns, setPronouns] = useState(initial?.pronouns ?? "");
  const [birthday, setBirthday] = useState(initial?.birthday ?? "");
  const [unboundedEmail, setUnboundedEmail] = useState(
    initial?.unboundedEmail ?? ""
  );
  const [personalEmail, setPersonalEmail] = useState(
    initial?.personalEmail ?? ""
  );
  const [cellPhone, setCellPhone] = useState(initial?.cellPhone ?? "");
  const [streetAddress, setStreetAddress] = useState(
    initial?.streetAddress ?? ""
  );
  const [city, setCity] = useState(initial?.city ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [zipCode, setZipCode] = useState(initial?.zipCode ?? "");
  const [emergencyContactName, setEmergencyContactName] = useState(
    initial?.emergencyContactName ?? ""
  );
  const [emergencyContactNumber, setEmergencyContactNumber] = useState(
    initial?.emergencyContactNumber ?? ""
  );
  const [currentEmployer, setCurrentEmployer] = useState(
    initial?.currentEmployer ?? ""
  );
  const [jobTitle, setJobTitle] = useState(initial?.jobTitle ?? "Facilitator");
  const [roleDescription, setRoleDescription] = useState(
    initial?.roleDescription ?? ""
  );
  const [districtRelationships, setDistrictRelationships] = useState(
    initial?.districtRelationships ?? ""
  );
  const [headshot, setHeadshot] = useState(initial?.headshot ?? "");
  const [pathways, setPathways] = useState<Pathway[]>(initial?.pathways ?? []);
  const [gradeBands, setGradeBands] = useState<GradeBand[]>(
    initial?.gradeBands ?? []
  );
  const [comfortByGradeBand, setComfortByGradeBand] = useState<
    Partial<Record<GradeBand, ComfortLevel>>
  >(initial?.comfortByGradeBand ?? {});
  // Facilitation history is self-reported at intake, so it goes stale as people
  // pick up new work — every answer stays editable here.
  const [standardsInstitute, setStandardsInstitute] =
    useState<StandardsInstituteExperience>(initial?.standardsInstitute ?? "no");
  const [facilitatedSummit, setFacilitatedSummit] = useState(
    initial?.facilitatedSummit ?? false
  );
  const [facilitatedInService, setFacilitatedInService] = useState(
    initial?.facilitatedInService ?? false
  );
  const [otherPrograms, setOtherPrograms] = useState<string[]>(
    initial?.otherPrograms ?? []
  );
  const [programDraft, setProgramDraft] = useState("");
  // "" means unanswered — never guess a default the facilitator didn't pick.
  const [availability, setAvailability] = useState<Availability | "">(
    initial?.availability ?? ""
  );
  const [availabilityOther, setAvailabilityOther] = useState(
    initial?.availabilityOther ?? ""
  );
  const [availableShortNotice, setAvailableShortNotice] = useState<
    ShortNotice | ""
  >(initial?.availableShortNotice ?? "");
  const [hasPolo, setHasPolo] = useState<"" | "yes" | "no">(
    initial?.hasPolo === undefined ? "" : initial.hasPolo ? "yes" : "no"
  );
  const [poloStyle, setPoloStyle] = useState<ShirtStyle | "">(
    initial?.poloStyle ?? ""
  );
  const [shirtSize, setShirtSize] = useState<ShirtSize | "">(
    initial?.shirtSize ?? ""
  );
  const [bio, setBio] = useState(initial?.bio ?? "");

  const programChoices = useMemo(
    () =>
      Array.from(new Set([...programOptions, ...otherPrograms]))
        .map((p) => p.trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [programOptions, otherPrograms]
  );

  function togglePathway(p: Pathway) {
    setPathways((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function toggleGradeBand(g: GradeBand) {
    setGradeBands((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  function toggleProgram(p: string) {
    setOtherPrograms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function addProgram() {
    const name = programDraft.trim();
    if (!name) return;
    setOtherPrograms((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setProgramDraft("");
  }

  /**
   * Checked by hand rather than by the browser: fields on an inactive tab are
   * unmounted, and native validation silently refuses to submit when it cannot
   * focus the field it wants to complain about.
   */
  function validate(): FormError | null {
    if (!firstName.trim() || !lastName.trim()) {
      return { tab: "personal", message: "First and last name are required." };
    }
    if (unboundedEmail.trim() && !EMAIL_PATTERN.test(unboundedEmail.trim())) {
      return { tab: "contact", message: "UnboundEd email is not a valid email address." };
    }
    if (personalEmail.trim() && !EMAIL_PATTERN.test(personalEmail.trim())) {
      return { tab: "contact", message: "Personal email is not a valid email address." };
    }
    return null;
  }

  const problem = validate();
  const error = showErrors ? problem : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (problem) {
      setShowErrors(true);
      setTab(problem.tab);
      return;
    }

    // Only keep comfort for bands still selected, and omit unanswered ones
    // entirely — Firestore rejects nested undefined values.
    const comfort: Partial<Record<GradeBand, ComfortLevel>> = {};
    for (const g of gradeBands) {
      const level = comfortByGradeBand[g];
      if (level) comfort[g] = level;
    }

    const saved: Facilitator = {
      id: initial?.id ?? `f-${Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      preferredName: preferredName.trim() || undefined,
      pronouns: pronouns.trim() || undefined,
      birthday: birthday.trim() || undefined,
      unboundedEmail: unboundedEmail.trim(),
      personalEmail: personalEmail.trim(),
      streetAddress: streetAddress.trim(),
      city: city.trim(),
      state: state.trim().toUpperCase(),
      zipCode: zipCode.trim(),
      cellPhone: cellPhone.trim(),
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactNumber: emergencyContactNumber.trim(),
      hasPolo: hasPolo === "" ? undefined : hasPolo === "yes",
      poloStyle: poloStyle || undefined,
      shirtSize: shirtSize || undefined,
      pathways,
      gradeBands,
      comfortByGradeBand: comfort,
      standardsInstitute,
      facilitatedSummit,
      facilitatedInService,
      otherPrograms,
      availability: availability || undefined,
      availabilityOther:
        availability === "Other" ? availabilityOther.trim() || undefined : undefined,
      availableShortNotice: availableShortNotice || undefined,
      currentEmployer: currentEmployer.trim() || "Independent Consultant",
      jobTitle: jobTitle.trim() || "Facilitator",
      roleDescription: roleDescription.trim(),
      districtRelationships: districtRelationships.trim(),
      resumeFileName: initial?.resumeFileName,
      resumeDriveFileId: initial?.resumeDriveFileId,
      hasStoredResume: initial?.hasStoredResume,
      bio: bio.trim(),
      bioGeneratedByAi:
        bio.trim() !== "" &&
        bio.trim() === (initial?.bio ?? "").trim() &&
        Boolean(initial?.bioGeneratedByAi),
      headshot: headshot.trim(),
      hasStoredHeadshot: initial?.hasStoredHeadshot,
      status: initial?.status ?? "active",
      joinedDate: initial?.joinedDate ?? new Date().toISOString().slice(0, 10),
    };
    onSave(saved);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        noValidate
        onSubmit={handleSubmit}
        className="flex h-[640px] max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">
              {initial ? "Edit Facilitator" : "Add Facilitator"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-100 px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={classNames(
                "relative shrink-0 px-3 py-3 text-sm font-medium transition-colors",
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
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {tab === "personal" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="First name" required>
                  <input
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Last name" required>
                  <input
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Preferred name">
                  <input
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    placeholder="What they go by day-to-day"
                    className={inputClass}
                  />
                </Field>
                <Field label="Pronouns">
                  <input
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                    placeholder="e.g. she/her, he/him, they/them"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Birthday">
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </>
          )}

          {tab === "experience" && (
            <>
              <Field label="Pathways">
                <div className="flex flex-wrap gap-2 pt-1">
                  {PATHWAYS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePathway(p)}
                      className={chipClass(pathways.includes(p))}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Grade bands">
                <div className="flex flex-wrap gap-2 pt-1">
                  {GRADE_BANDS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGradeBand(g)}
                      className={chipClass(gradeBands.includes(g))}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </Field>

              {gradeBands.length > 0 && (
                <Field label="Comfort level by grade band">
                  <div className="space-y-2 pt-1">
                    {gradeBands.map((g) => (
                      <div key={g} className="flex items-center gap-3">
                        <span className="w-14 shrink-0 text-sm font-medium text-slate-700">
                          {g}
                        </span>
                        <select
                          value={comfortByGradeBand[g] ?? ""}
                          onChange={(e) =>
                            setComfortByGradeBand((prev) => ({
                              ...prev,
                              [g]: (e.target.value || undefined) as
                                | ComfortLevel
                                | undefined,
                            }))
                          }
                          className={inputClass}
                        >
                          <option value="">Not provided</option>
                          {(Object.keys(COMFORT_LABELS) as ComfortLevel[]).map(
                            (level) => (
                              <option key={level} value={level}>
                                {COMFORT_LABELS[level]}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    ))}
                  </div>
                </Field>
              )}

              <Field label="Standards Institute">
                <select
                  value={standardsInstitute}
                  onChange={(e) =>
                    setStandardsInstitute(
                      e.target.value as StandardsInstituteExperience
                    )
                  }
                  className={inputClass}
                >
                  {(
                    Object.keys(
                      STANDARDS_INSTITUTE_LABELS
                    ) as StandardsInstituteExperience[]
                  ).map((option) => (
                    <option key={option} value={option}>
                      {STANDARDS_INSTITUTE_LABELS[option]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Facilitation history">
                <div className="space-y-2 pt-1">
                  <CheckboxRow
                    label="Has facilitated a Summit"
                    checked={facilitatedSummit}
                    onChange={setFacilitatedSummit}
                  />
                  <CheckboxRow
                    label="Has facilitated an In-Service Learning Module"
                    checked={facilitatedInService}
                    onChange={setFacilitatedInService}
                  />
                </div>
              </Field>

              <Field label="Other UnboundEd / CORE programs">
                <div className="flex flex-wrap gap-2 pb-2 pt-1">
                  {programChoices.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleProgram(p)}
                      className={chipClass(otherPrograms.includes(p))}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={programDraft}
                    onChange={(e) => setProgramDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addProgram();
                      }
                    }}
                    placeholder="Add another program…"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={addProgram}
                    disabled={!programDraft.trim()}
                    className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              </Field>
            </>
          )}

          {tab === "professional" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Current employer">
                  <input
                    value={currentEmployer}
                    onChange={(e) => setCurrentEmployer(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Job title">
                  <input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Role & responsibilities">
                <textarea
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  rows={4}
                  className={inputClass}
                />
              </Field>

              <Field label="School / district relationships">
                <input
                  value={districtRelationships}
                  onChange={(e) => setDistrictRelationships(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </>
          )}

          {tab === "bio" && (
            <Field label="Biography">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={14}
                placeholder="Optional — leave blank to generate with AI from the profile"
                className={inputClass}
              />
            </Field>
          )}

          {tab === "contact" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field label="UnboundEd email">
                  <input
                    type="email"
                    value={unboundedEmail}
                    onChange={(e) => setUnboundedEmail(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Personal email">
                  <input
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Cell phone">
                  <input
                    value={cellPhone}
                    onChange={(e) => setCellPhone(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Headshot URL">
                  <input
                    value={headshot}
                    onChange={(e) => setHeadshot(e.target.value)}
                    placeholder="https://…"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Street address">
                <input
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-3 gap-4">
                <Field label="City">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="State">
                  <input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    maxLength={2}
                    placeholder="CA"
                    className={inputClass}
                  />
                </Field>
                <Field label="Zip">
                  <input
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Emergency contact name">
                  <input
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Emergency contact number">
                  <input
                    value={emergencyContactNumber}
                    onChange={(e) => setEmergencyContactNumber(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <SectionHeading>Availability</SectionHeading>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Typical availability">
                  <select
                    value={availability}
                    onChange={(e) =>
                      setAvailability(e.target.value as Availability | "")
                    }
                    className={inputClass}
                  >
                    <option value="">Not provided</option>
                    {AVAILABILITY_OPTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Available on short notice?">
                  <select
                    value={availableShortNotice}
                    onChange={(e) =>
                      setAvailableShortNotice(e.target.value as ShortNotice | "")
                    }
                    className={inputClass}
                  >
                    <option value="">Not provided</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Maybe">Maybe</option>
                  </select>
                </Field>
              </div>

              {availability === "Other" && (
                <Field label="Describe their availability">
                  <input
                    value={availabilityOther}
                    onChange={(e) => setAvailabilityOther(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              )}

              <SectionHeading>UnboundEd gear</SectionHeading>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Has polo">
                  <select
                    value={hasPolo}
                    onChange={(e) =>
                      setHasPolo(e.target.value as "" | "yes" | "no")
                    }
                    className={inputClass}
                  >
                    <option value="">Not provided</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </Field>
                <Field label="Polo style">
                  <select
                    value={poloStyle}
                    onChange={(e) =>
                      setPoloStyle(e.target.value as ShirtStyle | "")
                    }
                    className={inputClass}
                  >
                    <option value="">Not provided</option>
                    <option value="Unisex Cut">Unisex Cut</option>
                    <option value="Women's Cut">Women&apos;s Cut</option>
                  </select>
                </Field>
                <Field label="Shirt size">
                  <select
                    value={shirtSize}
                    onChange={(e) =>
                      setShirtSize(e.target.value as ShirtSize | "")
                    }
                    className={inputClass}
                  >
                    <option value="">Not provided</option>
                    {SHIRT_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-100 bg-white px-6 py-4">
          <p className="min-w-0 text-sm text-rose-600">{error?.message ?? ""}</p>
          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              {initial ? "Save changes" : "Add facilitator"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-t border-slate-100 pt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </h3>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

function chipClass(active: boolean) {
  return (
    "rounded-full border px-3 py-1 text-sm transition-colors " +
    (active
      ? "border-brand-600 bg-brand-50 text-brand-700"
      : "border-slate-200 text-slate-500 hover:bg-slate-50")
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
