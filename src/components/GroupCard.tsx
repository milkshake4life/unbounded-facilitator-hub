import { useEffect, useRef, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Facilitator, FacilitatorGroup } from "../types";
import { classNames } from "../lib/ui";
import { useHeadshotSrc } from "../lib/useHeadshot";
import { Avatar } from "./Avatar";

function memberPreview(
  group: FacilitatorGroup,
  facilitators: Facilitator[]
): Facilitator[] {
  const byId = new Map(facilitators.map((f) => [f.id, f]));
  return group.facilitatorIds
    .map((id) => byId.get(id))
    .filter((f): f is Facilitator => Boolean(f))
    .slice(0, 3);
}

interface GroupCardProps {
  group: FacilitatorGroup;
  facilitators: Facilitator[];
  onOpen: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function GroupCard({
  group,
  facilitators,
  onOpen,
  onEdit,
  onArchive,
  onDelete,
}: GroupCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isArchived = group.status === "archived";
  const preview = memberPreview(group, facilitators);
  const count = group.facilitatorIds.length;
  const extra = Math.max(0, count - preview.length);

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

  return (
    <div
      onClick={onOpen}
      className="group relative flex cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
    >
      <div ref={menuRef} className="absolute right-3 top-3 z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Group actions"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <MenuButton
              icon={<Pencil className="h-4 w-4" />}
              label="Edit"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onEdit();
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
                onArchive();
              }}
            />
            <MenuButton
              icon={<Trash2 className="h-4 w-4" />}
              label="Delete"
              danger
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onDelete();
              }}
            />
          </div>
        )}
      </div>

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <FolderOpen className="h-5 w-5" />
      </div>
      <h3 className="mt-3 pr-8 text-base font-semibold text-slate-900">
        {group.name}
      </h3>
      {group.description?.trim() ? (
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
          {group.description}
        </p>
      ) : null}

      {/* Avatars + count on one row */}
      <div className="mt-4 flex min-h-8 items-center gap-2.5">
        {preview.length > 0 ? (
          <>
            <div className="flex shrink-0 -space-x-2">
              {preview.map((f) => (
                <MemberAvatar key={f.id} facilitator={f} />
              ))}
              {extra > 0 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-semibold text-slate-500">
                  +{extra}
                </div>
              )}
            </div>
            <p className="min-w-0 truncate text-sm text-slate-500">
              {count} {count === 1 ? "facilitator" : "facilitators"}
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-400">No facilitators yet</p>
        )}
        {isArchived && (
          <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            Archived
          </span>
        )}
      </div>
    </div>
  );
}

function MemberAvatar({ facilitator }: { facilitator: Facilitator }) {
  const src = useHeadshotSrc(
    facilitator.id,
    facilitator.hasStoredHeadshot,
    facilitator.headshot
  );
  return (
    <Avatar
      src={src || undefined}
      alt={`${facilitator.firstName} ${facilitator.lastName}`}
      boxClassName="h-8 w-8 rounded-full border-2 border-white bg-slate-100"
      iconClassName="h-3.5 w-3.5"
    />
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
