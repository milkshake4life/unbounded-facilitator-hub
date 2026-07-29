import { useMemo, useRef, useState } from "react";
import {
  ArrowUpDown,
  Check,
  FolderOpen,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { Facilitator, FacilitatorGroup } from "../types";
import { classNames } from "../lib/ui";
import { useOutsideDismiss } from "../lib/useOutsideDismiss";
import { GroupCard } from "./GroupCard";

type GroupSortKey = "name" | "name_desc" | "recent";
type GroupStatusFilter = "active" | "archived" | "all";

const sortLabels: Record<GroupSortKey, string> = {
  name: "Name (A–Z)",
  name_desc: "Name (Z–A)",
  recent: "Recently created",
};

const filterLabels: Record<GroupStatusFilter, string> = {
  active: "Active",
  archived: "Archived",
  all: "All groups",
};

interface GroupsPageProps {
  groups: FacilitatorGroup[];
  facilitators: Facilitator[];
  onOpenGroup: (groupId: string) => void;
  onCreateGroup: () => void;
  onEditGroup: (group: FacilitatorGroup) => void;
  onArchiveGroup: (group: FacilitatorGroup) => void;
  onDeleteGroup: (group: FacilitatorGroup) => void;
}

export function GroupsPage({
  groups,
  facilitators,
  onOpenGroup,
  onCreateGroup,
  onEditGroup,
  onArchiveGroup,
  onDeleteGroup,
}: GroupsPageProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<GroupSortKey>("name");
  const [statusFilter, setStatusFilter] = useState<GroupStatusFilter>("active");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  useOutsideDismiss(sortOpen, () => setSortOpen(false), sortMenuRef);
  useOutsideDismiss(filterOpen, () => setFilterOpen(false), filterMenuRef);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = groups.filter((g) => {
      if (statusFilter === "active") return g.status !== "archived";
      if (statusFilter === "archived") return g.status === "archived";
      return true;
    });

    if (q) {
      list = list.filter((g) => {
        const haystack = `${g.name} ${g.description ?? ""}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    return [...list].sort((a, b) => {
      switch (sortKey) {
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "recent":
          return b.createdAt - a.createdAt;
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [groups, query, sortKey, statusFilter]);

  const hasAnyGroups = groups.length > 0;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search groups…"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-800 shadow-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "group" : "groups"}
          {statusFilter !== "active" && <> · {filterLabels[statusFilter]}</>}
        </p>

        <div className="flex items-center gap-2">
          <div ref={sortMenuRef} className="relative">
            <button
              onClick={() => {
                setSortOpen((v) => !v);
                setFilterOpen(false);
              }}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              <ArrowUpDown className="h-4 w-4" />
              Sort by
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-11 z-20 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {(Object.keys(sortLabels) as GroupSortKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      setSortKey(k);
                      setSortOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    {sortLabels[k]}
                    {sortKey === k && (
                      <Check className="h-4 w-4 text-brand-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={filterMenuRef} className="relative">
            <button
              onClick={() => {
                setFilterOpen((v) => !v);
                setSortOpen(false);
              }}
              className={classNames(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                statusFilter !== "active"
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-11 z-20 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Status
                </p>
                {(Object.keys(filterLabels) as GroupStatusFilter[]).map(
                  (k) => (
                    <button
                      key={k}
                      onClick={() => {
                        setStatusFilter(k);
                        setFilterOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      {filterLabels[k]}
                      {statusFilter === k && (
                        <Check className="h-4 w-4 text-brand-600" />
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {!hasAnyGroups ? (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <FolderOpen className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-700">
            No groups yet
          </p>
          <p className="max-w-sm text-sm text-slate-400">
            Create a group to organize facilitators for an institute, grade band,
            or any cohort you manage.
          </p>
          <button
            onClick={onCreateGroup}
            className="mt-4 rounded-lg border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
          >
            Create your first group
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Search className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-700">
            No groups found
          </p>
          <p className="text-sm text-slate-400">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              facilitators={facilitators}
              onOpen={() => onOpenGroup(group.id)}
              onEdit={() => onEditGroup(group)}
              onArchive={() => onArchiveGroup(group)}
              onDelete={() => onDeleteGroup(group)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
