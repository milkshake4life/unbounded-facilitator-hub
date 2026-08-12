import { useState } from "react";
import type { EventPathway } from "../types";
import { PLACEMENT_PATHWAY_OPTIONS } from "../types";
import {
  Field,
  ModalCancelButton,
  ModalShell,
  ModalSubmitButton,
  inputClass,
} from "./ModalShell";

export interface SectionPlan {
  count: number;
  seatsPerSection: number;
}

interface PathwayModalProps {
  /** Null when adding a new pathway. */
  initial: EventPathway | null;
  /** Other pathway names in this event, used to flag duplicates. */
  existingNames: string[];
  onClose: () => void;
  /** `plan` is null when editing — sections are only generated on create. */
  onSave: (pathway: EventPathway, plan: SectionPlan | null) => void;
}

/**
 * Add or rename a pathway. New pathways can generate their sections up front so
 * the board starts with real seats to fill instead of an empty column.
 */
export function PathwayModal({
  initial,
  existingNames,
  onClose,
  onSave,
}: PathwayModalProps) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [sectionCount, setSectionCount] = useState(2);
  const [seatsPerSection, setSeatsPerSection] = useState(2);

  const trimmed = name.trim();
  const duplicate = existingNames.some(
    (n) => n.trim().toLowerCase() === trimmed.toLowerCase()
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed || duplicate) return;
    onSave(
      {
        id: initial?.id ?? crypto.randomUUID(),
        name: trimmed,
        notes: notes.trim(),
      },
      isEdit ? null : { count: sectionCount, seatsPerSection }
    );
  }

  return (
    <ModalShell
      labelledById="pathway-modal-title"
      title={isEdit ? "Edit pathway" : "Add pathway"}
      description={
        isEdit
          ? "Rename this pathway or update its notes."
          : "Pathways are the content strands this event runs. Each one is staffed section by section."
      }
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <ModalCancelButton onClick={onClose} />
          <ModalSubmitButton
            label={isEdit ? "Save pathway" : "Add pathway"}
            disabled={!trimmed || duplicate}
          />
        </>
      }
    >
      <div className="flex flex-col gap-4 px-5 py-4">
        <Field label="Pathway">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            list="pathway-name-options"
            placeholder="e.g. Math K-5"
            autoFocus
            required
            className={inputClass}
          />
          <datalist id="pathway-name-options">
            {PLACEMENT_PATHWAY_OPTIONS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          {duplicate && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">
              This event already has a pathway with that name.
            </p>
          )}
        </Field>

        {!isEdit && (
          <fieldset className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Starting sections
            </legend>
            <p className="text-sm text-slate-500">
              We'll create {sectionCount === 0 ? "no sections" : null}
              {sectionCount > 0 && (
                <>
                  <span className="font-semibold text-slate-700">
                    {sectionCount === 1
                      ? "Section 1"
                      : `Section 1–${sectionCount}`}
                  </span>{" "}
                  with{" "}
                  <span className="font-semibold text-slate-700">
                    {seatsPerSection}
                  </span>{" "}
                  {seatsPerSection === 1 ? "seat" : "seats"} each
                </>
              )}
              . You can rename, add, or remove them later.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Sections">
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={sectionCount}
                  onChange={(e) =>
                    setSectionCount(clamp(Number(e.target.value), 0, 20))
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Seats each">
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={seatsPerSection}
                  onChange={(e) =>
                    setSeatsPerSection(clamp(Number(e.target.value), 0, 20))
                  }
                  className={inputClass}
                />
              </Field>
            </div>
          </fieldset>
        )}

        <Field label="Notes" hint="(optional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. Uses the updated K-5 materials"
            className={`${inputClass} resize-none`}
          />
        </Field>
      </div>
    </ModalShell>
  );
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}
