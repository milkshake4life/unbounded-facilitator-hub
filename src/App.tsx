import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Upload,
  ArrowUpDown,
  SlidersHorizontal,
  Plus,
  Users,
  ChevronRight,
  Check,
  Pencil,
  FolderOpen,
} from "lucide-react";
import { Sidebar, type DirectoryView } from "./components/Sidebar";
import { FacilitatorCard } from "./components/FacilitatorCard";
import { FacilitatorModal } from "./components/FacilitatorModal";
import { FacilitatorFormModal } from "./components/FacilitatorFormModal";
import { ImportWizardModal } from "./components/ImportWizardModal";
import { SignInScreen } from "./components/SignInScreen";
import { AccessDeniedScreen } from "./components/AccessDeniedScreen";
import { ManageAccessModal } from "./components/ManageAccessModal";
import { GroupModal } from "./components/GroupModal";
import { ManageGroupMembersModal } from "./components/ManageGroupMembersModal";
import { AddToGroupModal } from "./components/AddToGroupModal";
import { GroupsPage } from "./components/GroupsPage";
import { GroupCard } from "./components/GroupCard";
import { FacilitatorFilterPanel } from "./components/FacilitatorFilterPanel";
import { facilitators as seedData } from "./data/facilitators";
import type { Facilitator, FacilitatorGroup } from "./types";
import { classNames } from "./lib/ui";
import { useOutsideDismiss } from "./lib/useOutsideDismiss";
import {
  EMPTY_FACILITATOR_FILTERS,
  collectProgramOptions,
  countActiveFilters,
  hasActiveFilters,
  matchesFacilitatorFilters,
  type FacilitatorFilters,
} from "./lib/facilitatorFilters";
import { useAuth } from "./lib/useAuth";
import { useAccess } from "./lib/useAccess";
import {
  subscribeFacilitators,
  saveFacilitator,
  deleteFacilitator,
} from "./lib/facilitatorsService";
import {
  subscribeUserGroups,
  saveGroup,
  deleteGroup,
} from "./lib/groupsService";

type SortKey = "name" | "name_desc" | "recent";

const PAGE_SIZE = 12;

const sortLabels: Record<SortKey, string> = {
  name: "Name (A–Z)",
  name_desc: "Name (Z–A)",
  recent: "Recently added",
};

export default function App() {
  const { user, loading, configured, signIn, signOut } = useAuth();
  const { status: access, error: accessError } = useAccess(user, configured);

  // In "demo mode" (Firebase not configured) fall back to the in-memory sample
  // data so the app still runs before setup is finished. When configured, data
  // is streamed live from Firestore.
  const [data, setData] = useState<Facilitator[]>(configured ? [] : seedData);
  const [groups, setGroups] = useState<FacilitatorGroup[]>([]);
  const [view, setView] = useState<DirectoryView>("all");
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [filters, setFilters] = useState<FacilitatorFilters>(
    EMPTY_FACILITATOR_FILTERS
  );
  const [page, setPage] = useState(1);

  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  useOutsideDismiss(sortOpen, () => setSortOpen(false), sortMenuRef);
  useOutsideDismiss(filterOpen, () => setFilterOpen(false), filterMenuRef);

  const [viewing, setViewing] = useState<Facilitator | null>(null);
  const [editing, setEditing] = useState<Facilitator | null>(null);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [managingAccess, setManagingAccess] = useState(false);
  const [groupModal, setGroupModal] = useState<
    FacilitatorGroup | "new" | null
  >(null);
  const [membersModal, setMembersModal] = useState<FacilitatorGroup | null>(
    null
  );
  const [addToGroupFor, setAddToGroupFor] = useState<Facilitator | null>(null);

  // Persist to Firestore only when configured, signed in, and allowlisted.
  const persist = configured && !!user && access === "allowed";

  useEffect(() => {
    if (!persist) return;
    const unsub = subscribeFacilitators(
      (list) => setData(list),
      (err) => console.error("Facilitator subscription error:", err)
    );
    return unsub;
  }, [persist]);

  useEffect(() => {
    if (!persist || !user) {
      if (!configured) return;
      setGroups([]);
      return;
    }
    const unsub = subscribeUserGroups(
      user.uid,
      (list) => setGroups(list),
      (err) => console.error("Groups subscription error:", err)
    );
    return unsub;
  }, [persist, user, configured]);

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === activeGroupId) ?? null,
    [groups, activeGroupId]
  );

  // If the selected group was deleted elsewhere, clear the selection.
  useEffect(() => {
    if (activeGroupId && !activeGroup) setActiveGroupId(null);
  }, [activeGroupId, activeGroup]);

  const counts = useMemo(
    () => ({
      all: data.filter((f) => f.status === "active").length,
      groups: groups.filter((g) => g.status !== "archived").length,
      archived:
        data.filter((f) => f.status === "archived").length +
        groups.filter((g) => g.status === "archived").length,
    }),
    [data, groups]
  );

  const activeFacilitators = useMemo(
    () => data.filter((f) => f.status === "active"),
    [data]
  );

  const programOptions = useMemo(
    () => collectProgramOptions(data),
    [data]
  );

  const activeFilterCount = countActiveFilters(filters);

  const archivedGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = groups.filter((g) => g.status === "archived");
    if (q) {
      list = list.filter((g) => {
        const haystack = `${g.name} ${g.description ?? ""}`.toLowerCase();
        return haystack.includes(q);
      });
    }
    return list.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [groups, query]);

  /** Groups landing page (list) vs drilled into a single group. */
  const showingGroupsList = view === "groups" && !activeGroup;
  const showingGroupDetail = view === "groups" && Boolean(activeGroup);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list: Facilitator[];

    if (activeGroup && view === "groups") {
      const memberIds = new Set(activeGroup.facilitatorIds);
      list = data.filter(
        (f) => memberIds.has(f.id) && f.status === "active"
      );
    } else if (view === "archived") {
      list = data.filter((f) => f.status === "archived");
    } else {
      list = data.filter((f) => f.status === "active");
    }

    if (hasActiveFilters(filters)) {
      list = list.filter((f) => matchesFacilitatorFilters(f, filters));
    }

    if (q) {
      list = list.filter((f) => {
        const haystack = [
          f.firstName,
          f.lastName,
          f.currentEmployer,
          f.jobTitle,
          f.city,
          f.state,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case "name_desc":
          return `${b.firstName} ${b.lastName}`.localeCompare(
            `${a.firstName} ${a.lastName}`
          );
        case "recent":
          return b.joinedDate.localeCompare(a.joinedDate);
        default:
          return `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`
          );
      }
    });

    return list;
  }, [data, view, query, filters, sortKey, activeGroup]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function resetPage() {
    setPage(1);
  }

  function handleSave(f: Facilitator) {
    if (persist) {
      // Firestore subscription will refresh the list.
      saveFacilitator(f).catch((err) =>
        window.alert(`Could not save: ${err.message}`)
      );
    } else {
      setData((prev) => {
        const exists = prev.some((x) => x.id === f.id);
        return exists ? prev.map((x) => (x.id === f.id ? f : x)) : [f, ...prev];
      });
    }
    setEditing(null);
    setAdding(false);
    setViewing(null);
  }

  /** Update a facilitator (e.g. AI bio) while keeping the profile modal open. */
  function handleUpdate(f: Facilitator) {
    if (persist) {
      saveFacilitator(f).catch((err) =>
        window.alert(`Could not save: ${err.message}`)
      );
    } else {
      setData((prev) => prev.map((x) => (x.id === f.id ? f : x)));
    }
    setViewing(f);
  }

  function handleDelete(f: Facilitator) {
    if (
      !window.confirm(`Remove ${f.firstName} ${f.lastName} from the directory?`)
    ) {
      return;
    }
    if (persist) {
      deleteFacilitator(f.id).catch((err) =>
        window.alert(`Could not delete: ${err.message}`)
      );
    } else {
      setData((prev) => prev.filter((x) => x.id !== f.id));
    }
  }

  function handleArchive(f: Facilitator) {
    const nextStatus = f.status === "archived" ? "active" : "archived";
    const updated: Facilitator = { ...f, status: nextStatus };
    if (persist) {
      saveFacilitator(updated).catch((err) =>
        window.alert(`Could not update: ${err.message}`)
      );
    } else {
      setData((prev) => prev.map((x) => (x.id === f.id ? updated : x)));
    }
  }

  function persistGroup(group: FacilitatorGroup) {
    const owned: FacilitatorGroup = {
      ...group,
      description: group.description ?? "",
      status: group.status ?? "active",
      ownerUid: user?.uid || group.ownerUid || "demo",
      ownerEmail: (
        user?.email ||
        group.ownerEmail ||
        "demo@local"
      ).toLowerCase(),
    };
    if (persist) {
      saveGroup(owned).catch((err) =>
        window.alert(`Could not save group: ${err.message}`)
      );
    } else {
      setGroups((prev) => {
        const exists = prev.some((g) => g.id === owned.id);
        const next = exists
          ? prev.map((g) => (g.id === owned.id ? owned : g))
          : [...prev, owned];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });
    }
    return owned;
  }

  function handleSaveGroup(group: FacilitatorGroup) {
    persistGroup(group);
    setGroupModal(null);
    setMembersModal(null);
  }

  function handleArchiveGroup(group: FacilitatorGroup) {
    const nextStatus = group.status === "archived" ? "active" : "archived";
    persistGroup({
      ...group,
      status: nextStatus,
      updatedAt: Date.now(),
    });
    if (nextStatus === "archived" && activeGroupId === group.id) {
      setActiveGroupId(null);
    }
  }

  function handleDeleteGroup(group: FacilitatorGroup) {
    if (
      !window.confirm(
        `Delete “${group.name}”? Facilitators stay in the directory.`
      )
    ) {
      return;
    }
    if (persist) {
      deleteGroup(group.id).catch((err) =>
        window.alert(`Could not delete group: ${err.message}`)
      );
    } else {
      setGroups((prev) => prev.filter((g) => g.id !== group.id));
    }
    if (activeGroupId === group.id) setActiveGroupId(null);
    setGroupModal(null);
  }

  function handleToggleFacilitatorInGroup(
    group: FacilitatorGroup,
    facilitatorId: string,
    add: boolean
  ) {
    const latest = groups.find((g) => g.id === group.id) ?? group;
    const ids = new Set(latest.facilitatorIds);
    if (add) ids.add(facilitatorId);
    else ids.delete(facilitatorId);
    persistGroup({
      ...latest,
      facilitatorIds: Array.from(ids),
      updatedAt: Date.now(),
    });
  }

  function handleRemoveFromGroup(facilitator: Facilitator) {
    if (!activeGroup) return;
    handleToggleFacilitatorInGroup(activeGroup, facilitator.id, false);
  }

  function viewLabel(): string {
    if (view === "archived") return "Archived";
    if (view === "groups") return "Groups";
    return "All Facilitators";
  }

  // Auth + allowlist gates when Firebase is configured.
  if (configured && (loading || (user && access === "loading"))) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading…
      </div>
    );
  }
  if (configured && !user) {
    return <SignInScreen onSignIn={signIn} />;
  }
  if (configured && user && access === "denied") {
    return (
      <AccessDeniedScreen
        user={user}
        onSignOut={signOut}
        error={accessError}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        activeView={view}
        onViewChange={(v) => {
          setView(v);
          setActiveGroupId(null);
          resetPage();
        }}
        counts={counts}
        user={user}
        onSignOut={configured ? () => void signOut() : undefined}
        onManageAccess={
          configured && user ? () => setManagingAccess(true) : undefined
        }
      />

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Top header */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-slate-400" />
            <span className="text-slate-400">Directory</span>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            {showingGroupDetail && activeGroup ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveGroupId(null);
                    resetPage();
                  }}
                  className="text-slate-400 transition-colors hover:text-slate-700"
                >
                  Groups
                </button>
                <ChevronRight className="h-4 w-4 text-slate-300" />
                <span className="font-semibold text-slate-800">
                  {activeGroup.name}
                </span>
              </>
            ) : (
              <span className="font-semibold text-slate-800">{viewLabel()}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {showingGroupDetail && activeGroup && (
              <>
                <button
                  onClick={() => setGroupModal(activeGroup)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4" />
                  Edit group
                </button>
                <button
                  onClick={() => setMembersModal(activeGroup)}
                  className="flex items-center gap-2 rounded-lg border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
                >
                  <Plus className="h-4 w-4" />
                  Add facilitators
                </button>
              </>
            )}
            {showingGroupsList && (
              <button
                onClick={() => setGroupModal("new")}
                className="flex items-center gap-2 rounded-lg border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
              >
                <Plus className="h-4 w-4" />
                New Group
              </button>
            )}
            {!showingGroupsList && !showingGroupDetail && view !== "archived" && (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-2 rounded-lg border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
              >
                <Plus className="h-4 w-4" />
                Add Facilitator
              </button>
            )}
          </div>
        </header>

        {showingGroupsList ? (
          <GroupsPage
            groups={groups}
            facilitators={activeFacilitators}
            onOpenGroup={(id) => {
              setActiveGroupId(id);
              resetPage();
            }}
            onCreateGroup={() => setGroupModal("new")}
            onEditGroup={(g) => setGroupModal(g)}
            onArchiveGroup={handleArchiveGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  resetPage();
                }}
                placeholder="Search name, organization, content area, location…"
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-800 shadow-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            {/* Toolbar */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                {view === "archived" ? (
                  <>
                    {archivedGroups.length > 0 && (
                      <>
                        <span className="font-semibold text-slate-700">
                          {archivedGroups.length}
                        </span>{" "}
                        {archivedGroups.length === 1 ? "group" : "groups"}
                      </>
                    )}
                    {archivedGroups.length > 0 && filtered.length > 0 && (
                      <span className="text-slate-300"> · </span>
                    )}
                    {(filtered.length > 0 || archivedGroups.length === 0) && (
                      <>
                        <span className="font-semibold text-slate-700">
                          {filtered.length}
                        </span>{" "}
                        {filtered.length === 1 ? "facilitator" : "facilitators"}
                      </>
                    )}
                    {activeFilterCount > 0 && (
                      <> · {activeFilterCount} filtered</>
                    )}
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-slate-700">
                      {filtered.length}
                    </span>{" "}
                    {filtered.length === 1 ? "facilitator" : "facilitators"}
                    {activeFilterCount > 0 && (
                      <> · {activeFilterCount} filtered</>
                    )}
                  </>
                )}
              </p>

              <div className="flex items-center gap-2">
                {view === "all" && (
                  <button
                    onClick={() => setImporting(true)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-slate-50"
                  >
                    <Upload className="h-4 w-4" />
                    Import from Google Sheets
                  </button>
                )}

                {/* Sort */}
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
                      {(Object.keys(sortLabels) as SortKey[]).map((k) => (
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

                {/* Filter */}
                <div ref={filterMenuRef} className="relative">
                  <button
                    onClick={() => {
                      setFilterOpen((v) => !v);
                      setSortOpen(false);
                    }}
                    className={classNames(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      activeFilterCount > 0
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filter
                    {activeFilterCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                  {filterOpen && (
                    <FacilitatorFilterPanel
                      filters={filters}
                      programOptions={programOptions}
                      onChange={(next) => {
                        setFilters(next);
                        resetPage();
                      }}
                      onClose={() => setFilterOpen(false)}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Archived: groups section */}
            {view === "archived" && archivedGroups.length > 0 && (
              <section className="mt-6">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Groups
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {archivedGroups.map((g) => (
                    <GroupCard
                      key={g.id}
                      group={g}
                      facilitators={activeFacilitators}
                      onOpen={() => {
                        setView("groups");
                        setActiveGroupId(g.id);
                        resetPage();
                      }}
                      onEdit={() => setGroupModal(g)}
                      onArchive={() => handleArchiveGroup(g)}
                      onDelete={() => handleDeleteGroup(g)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Facilitators section label (archived only, when mixed with groups) */}
            {view === "archived" &&
              archivedGroups.length > 0 &&
              (pageItems.length > 0 || filtered.length === 0) && (
                <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Facilitators
                </h2>
              )}

            {/* Grid */}
            {pageItems.length > 0 ? (
              <div
                className={classNames(
                  "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
                  view === "archived" && archivedGroups.length > 0
                    ? "mt-0"
                    : "mt-5"
                )}
              >
                {pageItems.map((f) => (
                  <FacilitatorCard
                    key={f.id}
                    facilitator={f}
                    onView={setViewing}
                    onEdit={setEditing}
                    onArchive={
                      showingGroupDetail ? undefined : handleArchive
                    }
                    onDelete={showingGroupDetail ? undefined : handleDelete}
                    onAddToGroup={
                      showingGroupDetail ? undefined : setAddToGroupFor
                    }
                    onRemoveFromGroup={
                      showingGroupDetail ? handleRemoveFromGroup : undefined
                    }
                  />
                ))}
              </div>
            ) : (
              <div
                className={classNames(
                  "flex flex-col items-center justify-center text-center",
                  view === "archived" && archivedGroups.length > 0
                    ? "mt-8 py-8"
                    : "mt-16"
                )}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  {showingGroupDetail ? (
                    <FolderOpen className="h-6 w-6" />
                  ) : (
                    <Search className="h-6 w-6" />
                  )}
                </div>
                <p className="mt-3 text-sm font-medium text-slate-700">
                  {showingGroupDetail
                    ? "No facilitators in this group"
                    : view === "archived"
                      ? "No archived facilitators"
                      : "No facilitators found"}
                </p>
                <p className="text-sm text-slate-400">
                  {showingGroupDetail
                    ? "Add facilitators to this group to see them here."
                    : view === "archived"
                      ? archivedGroups.length > 0
                        ? "Archived groups are listed above."
                        : "Nothing in the archive yet."
                      : "Try adjusting your search or filters."}
                </p>
                {showingGroupDetail && activeGroup && (
                  <button
                    onClick={() => setMembersModal(activeGroup)}
                    className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                  >
                    Add facilitators
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-1 text-sm text-slate-500">
                  Page{" "}
                  <span className="font-semibold text-slate-700">
                    {currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {totalPages}
                  </span>
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {viewing && (
        <FacilitatorModal
          facilitator={viewing}
          onClose={() => setViewing(null)}
          onEdit={(f) => {
            setViewing(null);
            setEditing(f);
          }}
          onUpdate={handleUpdate}
        />
      )}
      {(editing || adding) && (
        <FacilitatorFormModal
          initial={editing}
          onClose={() => {
            setEditing(null);
            setAdding(false);
          }}
          onSave={handleSave}
        />
      )}
      {importing && <ImportWizardModal onClose={() => setImporting(false)} />}
      {managingAccess && user?.email && (
        <ManageAccessModal
          currentUserEmail={user.email}
          onClose={() => setManagingAccess(false)}
        />
      )}
      {groupModal && (
        <GroupModal
          initial={groupModal === "new" ? null : groupModal}
          onClose={() => setGroupModal(null)}
          onSave={handleSaveGroup}
        />
      )}
      {membersModal && (
        <ManageGroupMembersModal
          group={
            groups.find((g) => g.id === membersModal.id) ?? membersModal
          }
          facilitators={activeFacilitators}
          onClose={() => setMembersModal(null)}
          onSave={handleSaveGroup}
        />
      )}
      {addToGroupFor && (
        <AddToGroupModal
          facilitator={addToGroupFor}
          groups={groups}
          onClose={() => setAddToGroupFor(null)}
          onToggle={(group, add) =>
            handleToggleFacilitatorInGroup(group, addToGroupFor.id, add)
          }
        />
      )}
    </div>
  );
}
