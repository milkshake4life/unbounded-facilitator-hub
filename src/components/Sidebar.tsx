import {
  Home,
  Sparkles,
  Users,
  ChevronDown,
  Bell,
  BarChart3,
} from "lucide-react";
import { classNames } from "../lib/ui";

export type DirectoryView = "all" | "groups" | "archived";

interface SidebarProps {
  activeView: DirectoryView;
  onViewChange: (view: DirectoryView) => void;
  counts: { all: number; archived: number };
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-brand-50 text-brand-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <span className={active ? "text-brand-600" : "text-slate-400"}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="mt-6 mb-2 flex items-center justify-between px-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
    </div>
  );
}

export function Sidebar({ activeView, onViewChange, counts }: SidebarProps) {
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
        <div className="space-y-1">
          <NavItem icon={<Home className="h-4.5 w-4.5" />} label="Home" />
          <NavItem
            icon={<Sparkles className="h-4.5 w-4.5" />}
            label="Highlights"
          />
        </div>

        <SectionLabel label="Features" />
        <div className="space-y-1">
          <NavItem
            icon={<Users className="h-4.5 w-4.5" />}
            label="Directory"
            active
          />
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
              onClick={() => onViewChange("groups")}
              className={classNames(
                "flex w-full items-center rounded-md px-3 py-1.5 text-sm transition-colors",
                activeView === "groups"
                  ? "font-semibold text-brand-700"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Groups
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
          <NavItem icon={<Bell className="h-4.5 w-4.5" />} label="My Updates" />
          <NavItem
            icon={<BarChart3 className="h-4.5 w-4.5" />}
            label="Analytics"
          />
        </div>

      </nav>

      {/* User */}
      <div className="flex items-center gap-3 border-t border-slate-200 px-4 py-3">
        <img
          src="https://randomuser.me/api/portraits/men/54.jpg"
          alt="Alexander"
          className="h-9 w-9 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold text-slate-800">
            Alexander
          </p>
          <p className="truncate text-xs text-slate-500">demo@unbounded.org</p>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </div>
    </aside>
  );
}
