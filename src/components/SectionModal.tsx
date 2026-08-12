import { useState } from "react";
import type { EventSection } from "../types";
import { PLACEMENT_SECTION_OPTIONS } from "../types";
import {
  Field,
  ModalCancelButton,
  ModalShell,
  ModalSubmitButton,
  inputClass,
} from "./ModalShell";

interface SectionModalProps {
  pathwayName: string;
  pathwayId: string;
  /** Null when adding a new section. */
  initial: EventSection | null;
  /** Other section names in this pathway, used to flag duplicates. */
  existingNames: string[];
  onClose: () => void;
  onSave: (section: EventSection) => void;
}

/** Add or edit one section — the unit that actually carries facilitator seats. */
export function SectionModal({
  pathwayName,
  pathwayId,
  initial,
  existingNames,
  onClose,
  onSave,
}: SectionModalProps) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [seatsNeeded, setSeatsNeeded] = useState(initial?.seatsNeeded ?? 2);
  const [date, setDate] = useState(initial?.date ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const trimmed = name.trim();
  const duplicate = existingNames.some(
    (n) => n.trim().toLowerCase() === trimmed.toLowerCase()
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed || duplicate) return;
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      pathwayId,
      name: trimmed,
      seatsNeeded,
      date,
      notes: notes.trim(),
    });
  }

  return (
    <ModalShell
      labelledById="section-modal-title"
      title={isEdit ? "Edit section" : "Add section"}
      description={`${isEdit ? "Update" : "Add"} a section inside ${pathwayName}.`}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <ModalCancelButton onClick={onClose} />
          <ModalSubmitButton
            label={isEdit ? "Save section" : "Add section"}
            disabled={!trimmed || duplicate}
          />
        </>
      }
    >
      <div className="flex flex-col gap-4 px-5 py-4">
        <Field label="Section name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            list="section-name-options"
            placeholder="e.g. Section 1"
            autoFocus
            required
            className={inputClass}
          />
          <datalist id="section-name-options">
            {PLACEMENT_SECTION_OPTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          {duplicate && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">
              {pathwayName} already has a section with that name.
            </p>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Facilitators needed">
            <input
              type="number"
              min={0}
              max={20}
              value={seatsNeeded}
              onChange={(e) => {
                const next = Number(e.target.value);
                setSeatsNeeded(
                  Number.isFinite(next)
                    ? Math.min(20, Math.max(0, Math.floor(next)))
                    : 0
                );
              }}
              className={inputClass}
            />
          </Field>
          <Field label="Date" hint="(optional)">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Notes" hint="(optional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. 50 participants, room 204"
            className={`${inputClass} resize-none`}
          />
        </Field>
      </div>
    </ModalShell>
  );
}
