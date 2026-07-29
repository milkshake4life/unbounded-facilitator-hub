import { useEffect, useRef, useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  MapPin,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import type { Facilitator } from "../types";
import { classNames, pathwayShortLabels, pathwayStyles } from "../lib/ui";
import { useHeadshotSrc } from "../lib/useHeadshot";
import { Avatar } from "./Avatar";

interface FacilitatorCardProps {
  facilitator: Facilitator;
  onView: (f: Facilitator) => void;
  onEdit: (f: Facilitator) => void;
  onArchive: (f: Facilitator) => void;
  onDelete: (f: Facilitator) => void;
}

export function FacilitatorCard({
  facilitator,
  onView,
  onEdit,
  onArchive,
  onDelete,
}: FacilitatorCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isArchived = facilitator.status === "archived";

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  const fullName = `${facilitator.firstName} ${facilitator.lastName}`;
  const headshotSrc = useHeadshotSrc(
    facilitator.id,
    facilitator.hasStoredHeadshot,
    facilitator.headshot
  );

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
          <div className="absolute right-0 top-9 z-20 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <MenuButton
              icon={<Pencil className="h-4 w-4" />}
              label="Edit"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onEdit(facilitator);
              }}
            />
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
          </div>
        )}
      </div>

      {/* Headshot */}
      <div className="relative mb-3">
        <Avatar
          src={headshotSrc}
          alt={fullName}
          boxClassName="h-24 w-24 rounded-full ring-4 ring-slate-50"
          iconClassName="h-12 w-12"
        />
      </div>

      {/* Name + employer */}
      <h3 className="text-[15px] font-semibold text-slate-900">{fullName}</h3>
      <p className="mt-0.5 text-sm text-slate-500">
        {facilitator.currentEmployer}
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
      <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
        <MapPin className="h-3 w-3" />
        {facilitator.city}, {facilitator.state}
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
