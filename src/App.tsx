import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Upload,
  ArrowUpDown,
  SlidersHorizontal,
  Plus,
  Users,
  ChevronRight,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import { Sidebar, type DirectoryView } from "./components/Sidebar";
import { FacilitatorCard } from "./components/FacilitatorCard";
import { FacilitatorModal } from "./components/FacilitatorModal";
import { FacilitatorFormModal } from "./components/FacilitatorFormModal";
import { ImportWizardModal } from "./components/ImportWizardModal";
import { HeadshotImportModal } from "./components/HeadshotImportModal";
import { SignInScreen } from "./components/SignInScreen";
import { AccessDeniedScreen } from "./components/AccessDeniedScreen";
import { ManageAccessModal } from "./components/ManageAccessModal";
import { facilitators as seedData } from "./data/facilitators";
import type { Facilitator, Pathway } from "./types";
import { PATHWAYS } from "./types";
import { classNames } from "./lib/ui";
import { useAuth } from "./lib/useAuth";
import { useAccess } from "./lib/useAccess";
import {
  subscribeFacilitators,
  saveFacilitator,
  deleteFacilitator,
} from "./lib/facilitatorsService";

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
  const [view, setView] = useState<DirectoryView>("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [pathwayFilter, setPathwayFilter] = useState<Pathway | "all">("all");
  const [page, setPage] = useState(1);

  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const [viewing, setViewing] = useState<Facilitator | null>(null);
  const [editing, setEditing] = useState<Facilitator | null>(null);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importingHeadshots, setImportingHeadshots] = useState(false);
  const [managingAccess, setManagingAccess] = useState(false);

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

  const counts = useMemo(
    () => ({
      all: data.filter((f) => f.status === "active").length,
      archived: data.filter((f) => f.status === "archived").length,
    }),
    [data]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = data.filter((f) =>
      view === "archived" ? f.status === "archived" : f.status === "active"
    );

    if (pathwayFilter !== "all") {
      list = list.filter((f) => f.pathways.includes(pathwayFilter));
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
          ...f.pathways,
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
  }, [data, view, query, pathwayFilter, sortKey]);

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
            <span className="font-semibold text-slate-800">
              {view === "archived" ? "Archived" : "All Facilitators"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-2 rounded-lg border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
            >
              <Plus className="h-4 w-4" />
              Add Facilitator
            </button>
          </div>
        </header>

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
              <span className="font-semibold text-slate-700">
                {filtered.length}
              </span>{" "}
              {filtered.length === 1 ? "facilitator" : "facilitators"}
              {pathwayFilter !== "all" && <> · {pathwayFilter}</>}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setImporting(true)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-slate-50"
              >
                <Upload className="h-4 w-4" />
                Import from Google Sheets
              </button>

              <button
                onClick={() => setImportingHeadshots(true)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-slate-50"
              >
                <ImageIcon className="h-4 w-4" />
                Import Headshots
              </button>

              {/* Sort */}
              <div className="relative">
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
              <div className="relative">
                <button
                  onClick={() => {
                    setFilterOpen((v) => !v);
                    setSortOpen(false);
                  }}
                  className={classNames(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    pathwayFilter !== "all"
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filter
                </button>
                {filterOpen && (
                  <div className="absolute right-0 top-11 z-20 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                    <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Pathway
                    </p>
                    <button
                      onClick={() => {
                        setPathwayFilter("all");
                        setFilterOpen(false);
                        resetPage();
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      All pathways
                      {pathwayFilter === "all" && (
                        <Check className="h-4 w-4 text-brand-600" />
                      )}
                    </button>
                    {PATHWAYS.map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setPathwayFilter(p);
                          setFilterOpen(false);
                          resetPage();
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        {p}
                        {pathwayFilter === p && (
                          <Check className="h-4 w-4 text-brand-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grid */}
          {pageItems.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pageItems.map((f) => (
                <FacilitatorCard
                  key={f.id}
                  facilitator={f}
                  onView={setViewing}
                  onEdit={setEditing}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="mt-16 flex flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Search className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-700">
                No facilitators found
              </p>
              <p className="text-sm text-slate-400">
                Try adjusting your search or filters.
              </p>
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
                Page <span className="font-semibold text-slate-700">{currentPage}</span> of{" "}
                <span className="font-semibold text-slate-700">{totalPages}</span>
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
      {importingHeadshots && (
        <HeadshotImportModal
          facilitators={data}
          onClose={() => setImportingHeadshots(false)}
        />
      )}
      {managingAccess && user?.email && (
        <ManageAccessModal
          currentUserEmail={user.email}
          onClose={() => setManagingAccess(false)}
        />
      )}
    </div>
  );
}
