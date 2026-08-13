import { useRef, useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  MapPin,
  Archive,
  ArchiveRestore,
  FolderPlus,
  UserMinus,
} from "lucide-react";
import type { Facilitator } from "../types";
import {
  displayName,
  displayNameWithPronouns,
} from "../lib/facilitatorName";
import { classNames, pathwayShortLabels, pathwayStyles } from "../lib/ui";
import { useHeadshotSrc } from "../lib/useHeadshot";
import { useOutsideDismiss } from "../lib/useOutsideDismiss";
import { Avatar } from "./Avatar";

interface FacilitatorCardProps {
  facilitator: Facilitator;
  onView: (f: Facilitator) => void;
  onEdit: (f: Facilitator) => void;
  /** Directory menu: archive / restore facilitator. */
  onArchive?: (f: Facilitator) => void;
  /** Directory menu: delete facilitator. */
  onDelete?: (f: Facilitator) => void;
  /** Directory menu: add to a personal group. */
  onAddToGroup?: (f: Facilitator) => void;
  /**
   * When set, the card is shown inside a group — menu is only Edit +
   * Remove from group.
   */
  onRemoveFromGroup?: (f: Facilitator) => void;
}

export function FacilitatorCard({
  facilitator,
  onView,
  onEdit,
  onArchive,
  onDelete,
  onAddToGroup,
  onRemoveFromGroup,
}: FacilitatorCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isArchived = facilitator.status === "archived";
  const inGroup = Boolean(onRemoveFromGroup);

  useOutsideDismiss(menuOpen, () => setMenuOpen(false), menuRef);

  const name = displayName(facilitator);
  const nameWithPronouns = displayNameWithPronouns(facilitator);
  const pronouns = facilitator.pronouns?.trim();
  const headshotSrc = useHeadshotSrc(
    facilitator.id,
    facilitator.hasStoredHeadshot,
    facilitator.headshot
  );
  const employer = facilitator.currentEmployer?.trim();
  const location = [facilitator.city, facilitator.state]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(", ");

  return (
    <div
      onClick={() => onView(facilitator)}
      className="group relative flex cursor-pointer flex-col items-center rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
    >
      {/* Kebab menu */}
      <div ref={menuRef} className="absolute right-3 top-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Card actions"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-9 z-20 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <MenuButton
              icon={<Pencil className="h-4 w-4" />}
              label="Edit"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onEdit(facilitator);
              }}
            />
            {inGroup && onRemoveFromGroup && (
              <MenuButton
                icon={<UserMinus className="h-4 w-4" />}
                label="Remove from group"
                danger
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onRemoveFromGroup(facilitator);
                }}
              />
            )}
            {!inGroup && onAddToGroup && (
              <MenuButton
                icon={<FolderPlus className="h-4 w-4" />}
                label="Add to group"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onAddToGroup(facilitator);
                }}
              />
            )}
            {!inGroup && onArchive && (
              <MenuButton
                icon={
                  isArchived ? (
                    <ArchiveRestore className="h-4 w-4" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )
                }
                label={isArchived ? "Restore" : "Archive"}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onArchive(facilitator);
                }}
              />
            )}
            {!inGroup && onDelete && (
              <MenuButton
                icon={<Trash2 className="h-4 w-4" />}
                label="Delete"
                danger
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete(facilitator);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Headshot */}
      <div className="relative mb-3">
        <Avatar
          src={headshotSrc}
          alt={nameWithPronouns}
          boxClassName="h-24 w-24 rounded-full ring-4 ring-slate-50"
          iconClassName="h-12 w-12"
        />
      </div>

      {/* Name + pronouns + employer */}
      <h3 className="text-[15px] font-semibold text-slate-900">{name}</h3>
      {pronouns && (
        <p className="mt-0.5 text-xs text-slate-500">({pronouns})</p>
      )}
      <p
        className={classNames(
          "mt-0.5 text-sm",
          employer ? "text-slate-500" : "text-slate-400"
        )}
      >
        {employer || "Employer not provided"}
      </p>

      {/* Pathway chips */}
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {facilitator.pathways.slice(0, 2).map((p) => (
          <span
            key={p}
            className={classNames(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
              pathwayStyles[p]
            )}
          >
            {pathwayShortLabels[p]}
          </span>
        ))}
        {facilitator.pathways.length > 2 && (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            +{facilitator.pathways.length - 2}
          </span>
        )}
      </div>

      {/* Location */}
      <p
        className={classNames(
          "mt-2 flex items-center gap-1 text-xs",
          location ? "text-slate-400" : "text-slate-300"
        )}
      >
        <MapPin className="h-3 w-3" />
        {location || "Location not provided"}
      </p>
    </div>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors",
        danger
          ? "text-rose-600 hover:bg-rose-50"
          : "text-slate-600 hover:bg-slate-50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
