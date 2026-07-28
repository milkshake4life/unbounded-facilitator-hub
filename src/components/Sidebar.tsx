import { useEffect, useRef, useState } from "react";
import { Users, ChevronDown, LogOut, UserPlus } from "lucide-react";
import type { User } from "firebase/auth";
import { classNames } from "../lib/ui";
import { Avatar } from "./Avatar";

export type DirectoryView = "all" | "archived";

interface SidebarProps {
  activeView: DirectoryView;
  onViewChange: (view: DirectoryView) => void;
  counts: { all: number; archived: number };
  user?: User | null;
  onSignOut?: () => void;
  onManageAccess?: () => void;
}

export function Sidebar({
  activeView,
  onViewChange,
  counts,
  user = null,
  onSignOut,
  onManageAccess,
}: SidebarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.displayName?.trim() || "Demo mode";
  const displayEmail = user?.email?.trim() || "Local sample data";
  const hasAccountMenu = Boolean(user && (onSignOut || onManageAccess));

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-6 py-5">
        <img
          src="/unbounded-icon.png"
          alt="UnboundEd"
          className="h-9 w-9 rounded-full object-cover shadow-sm"
        />
        <div className="leading-tight">
          <p className="text-[15px] font-bold text-slate-900">UnboundEd</p>
          <p className="text-xs text-slate-500">Facilitator Hub</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="mb-2 flex items-center gap-3 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">
          <Users className="h-4.5 w-4.5 text-brand-600" />
          Directory
        </div>
        <div className="ml-4 space-y-1 border-l border-slate-200 pl-3">
          <button
            onClick={() => onViewChange("all")}
            className={classNames(
              "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors",
              activeView === "all"
                ? "font-semibold text-brand-700"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <span>All Facilitators</span>
            <span className="text-xs text-slate-400">{counts.all}</span>
          </button>
          <button
            onClick={() => onViewChange("archived")}
            className={classNames(
              "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors",
              activeView === "archived"
                ? "font-semibold text-brand-700"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <span>Archived</span>
            <span className="text-xs text-slate-400">{counts.archived}</span>
          </button>
        </div>
      </nav>

      {/* User */}
      <div ref={menuRef} className="relative border-t border-slate-200">
        {menuOpen && hasAccountMenu && (
          <div className="absolute bottom-full left-2 right-2 mb-1 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {onManageAccess && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onManageAccess();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <UserPlus className="h-4 w-4 text-slate-400" />
                Manage access
              </button>
            )}
            {onSignOut && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onSignOut();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4 text-slate-400" />
                Sign out
              </button>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => hasAccountMenu && setMenuOpen((v) => !v)}
          disabled={!hasAccountMenu}
          className={classNames(
            "flex w-full items-center gap-3 px-4 py-3 text-left",
            hasAccountMenu
              ? "transition-colors hover:bg-slate-50"
              : "cursor-default"
          )}
        >
          <Avatar
            src={user?.photoURL ?? undefined}
            alt={displayName}
            boxClassName="h-9 w-9 shrink-0 rounded-full"
            iconClassName="h-4.5 w-4.5"
          />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-slate-800">
              {displayName}
            </p>
            <p className="truncate text-xs text-slate-500">{displayEmail}</p>
          </div>
          {hasAccountMenu && (
            <ChevronDown
              className={classNames(
                "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                menuOpen && "rotate-180"
              )}
            />
          )}
        </button>
      </div>
    </aside>
  );
}
