import { Check, FolderOpen, X } from "lucide-react";
import type { Facilitator, FacilitatorGroup } from "../types";
import { classNames } from "../lib/ui";

interface AddToGroupModalProps {
  facilitator: Facilitator;
  groups: FacilitatorGroup[];
  onClose: () => void;
  onToggle: (group: FacilitatorGroup, add: boolean) => void;
}

/** Pick which personal groups a facilitator belongs to. */
export function AddToGroupModal({
  facilitator,
  groups,
  onClose,
  onToggle,
}: AddToGroupModalProps) {
  const fullName = `${facilitator.firstName} ${facilitator.lastName}`;
  const activeGroups = groups
    .filter((g) => g.status !== "archived")
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-labelledby="add-to-group-title"
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2
              id="add-to-group-title"
              className="text-base font-bold text-slate-900"
            >
              Add to group
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Choose groups for {fullName}.
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
          {activeGroups.length === 0 ? (
            <div className="py-8 text-center">
              <FolderOpen className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-700">
                No groups yet
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Create a group from the Groups tab first.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
              {activeGroups.map((group) => {
                const inGroup = group.facilitatorIds.includes(facilitator.id);
                return (
                  <li key={group.id}>
                    <button
                      type="button"
                      onClick={() => onToggle(group, !inGroup)}
                      className={classNames(
                        "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors",
                        inGroup ? "bg-brand-50" : "hover:bg-slate-50"
                      )}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <FolderOpen className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {group.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {group.facilitatorIds.length}{" "}
                          {group.facilitatorIds.length === 1
                            ? "facilitator"
                            : "facilitators"}
                        </p>
                      </div>
                      <span
                        className={classNames(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                          inGroup
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-slate-300 bg-white"
                        )}
                      >
                        {inGroup && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-end border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
