import { useState } from "react";
import { X } from "lucide-react";
import type { FacilitatorGroup } from "../types";

interface GroupModalProps {
  /** Null when creating a new group (like “New Folder”). */
  initial: FacilitatorGroup | null;
  onClose: () => void;
  onSave: (group: FacilitatorGroup) => void;
}

/**
 * Create or rename a group — name + optional description only.
 * Membership is managed separately once you're inside the group.
 */
export function GroupModal({ initial, onClose, onSave }: GroupModalProps) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const now = Date.now();
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: trimmed,
      description: description.trim(),
      ownerUid: initial?.ownerUid ?? "",
      ownerEmail: initial?.ownerEmail ?? "",
      facilitatorIds: initial?.facilitatorIds ?? [],
      status: initial?.status ?? "active",
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form
        role="dialog"
        aria-labelledby="group-modal-title"
        onSubmit={handleSubmit}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2
              id="group-modal-title"
              className="text-base font-bold text-slate-900"
            >
              {isEdit ? "Edit group" : "New group"}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {isEdit
                ? "Update the name or description for this group."
                : "Give this group a name. You can add facilitators after."}
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

        <div className="flex flex-col gap-4 px-5 py-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Milwaukee 2026 SI"
              autoFocus
              maxLength={120}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Description{" "}
              <span className="font-normal normal-case tracking-normal text-slate-400">
                (optional)
              </span>
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group for?"
              maxLength={500}
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isEdit ? "Save" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
