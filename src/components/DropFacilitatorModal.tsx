import { useState } from "react";
import {
  Field,
  ModalCancelButton,
  ModalShell,
  ModalSubmitButton,
  inputClass,
} from "./ModalShell";

interface DropFacilitatorModalProps {
  facilitatorName: string;
  sectionName: string;
  initialReason: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

/** Dropping always needs a reason — it's the record of why a seat reopened. */
export function DropFacilitatorModal({
  facilitatorName,
  sectionName,
  initialReason,
  onClose,
  onConfirm,
}: DropFacilitatorModalProps) {
  const [reason, setReason] = useState(initialReason);
  const trimmed = reason.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed) return;
    onConfirm(trimmed);
  }

  return (
    <ModalShell
      labelledById="drop-facilitator-title"
      title="Mark as dropped"
      description={`${facilitatorName} will be released from ${sectionName} and the seat reopens.`}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <ModalCancelButton onClick={onClose} />
          <ModalSubmitButton
            label="Drop facilitator"
            disabled={!trimmed}
            danger
          />
        </>
      }
    >
      <div className="px-5 py-4">
        <Field label="Drop reason *">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
            required
            rows={4}
            placeholder="e.g. Low enrollment — section cancelled; facilitator withdrew for medical reasons…"
            className={`${inputClass} resize-none`}
          />
        </Field>
      </div>
    </ModalShell>
  );
}
