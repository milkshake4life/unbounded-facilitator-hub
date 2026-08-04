import { useState } from "react";
import { X } from "lucide-react";
import type {
  Availability,
  ComfortLevel,
  Facilitator,
  GradeBand,
  Pathway,
  ShortNotice,
} from "../types";
import {
  AVAILABILITY_OPTIONS,
  GRADE_BANDS,
  PATHWAYS,
} from "../types";

interface FacilitatorFormModalProps {
  /** When provided, the form is in edit mode. */
  initial?: Facilitator | null;
  onClose: () => void;
  onSave: (f: Facilitator) => void;
}

export function FacilitatorFormModal({
  initial,
  onClose,
  onSave,
}: FacilitatorFormModalProps) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
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
  // "" means unanswered — never guess a default the facilitator didn't pick.
  const [availability, setAvailability] = useState<Availability | "">(
    initial?.availability ?? ""
  );
  const [availableShortNotice, setAvailableShortNotice] = useState<
    ShortNotice | ""
  >(initial?.availableShortNotice ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Preserve existing comfort levels; default any newly-added band to "fine".
    const comfortByGradeBand: Partial<Record<GradeBand, ComfortLevel>> = {};
    for (const g of gradeBands) {
      comfortByGradeBand[g] = initial?.comfortByGradeBand?.[g] ?? "fine";
    }

    const saved: Facilitator = {
      id: initial?.id ?? `f-${Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      unboundedEmail: unboundedEmail.trim(),
      personalEmail: personalEmail.trim(),
      streetAddress: streetAddress.trim(),
      city: city.trim(),
      state: state.trim().toUpperCase(),
      zipCode: zipCode.trim(),
      cellPhone: cellPhone.trim(),
      emergencyContactName: initial?.emergencyContactName ?? "",
      emergencyContactNumber: initial?.emergencyContactNumber ?? "",
      hasPolo: initial?.hasPolo,
      poloStyle: initial?.poloStyle,
      shirtSize: initial?.shirtSize,
      pathways,
      gradeBands,
      comfortByGradeBand,
      standardsInstitute: initial?.standardsInstitute ?? "no",
      facilitatedSummit: initial?.facilitatedSummit ?? false,
      facilitatedInService: initial?.facilitatedInService ?? false,
      otherPrograms: initial?.otherPrograms ?? [],
      availability: availability || undefined,
      availabilityOther: initial?.availabilityOther,
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
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
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

        <div className="space-y-4 px-6 py-5">
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

          <Field label="Role & responsibilities">
            <textarea
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              rows={2}
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

          <Field label="Biography">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Optional — leave blank to generate with AI from the profile"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
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
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

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
