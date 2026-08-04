import { useMemo, useRef, useState } from "react";
import {
  FileText,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import type { EmailTemplate } from "../types";
import { classNames } from "../lib/ui";
import { useOutsideDismiss } from "../lib/useOutsideDismiss";

interface TemplatesPageProps {
  templates: EmailTemplate[];
  onCreate: () => void;
  onEdit: (template: EmailTemplate) => void;
  onDelete: (template: EmailTemplate) => void;
}

export function TemplatesPage({
  templates,
  onCreate,
  onEdit,
  onDelete,
}: TemplatesPageProps) {
  const [query, setQuery] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useOutsideDismiss(Boolean(menuId), () => setMenuId(null), menuRef);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...templates];
    if (q) {
      list = list.filter((t) => {
        const haystack = `${t.name} ${t.purpose} ${t.subject} ${t.body}`
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [templates, query]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates by name, purpose, or text…"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-800 shadow-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div className="mt-4">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">
              {filtered.length}
            </span>{" "}
            template{filtered.length === 1 ? "" : "s"}
            {query.trim() ? " matching your search" : " in the shared library"}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-800">
              {templates.length === 0
                ? "No templates yet"
                : "No matching templates"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {templates.length === 0
                ? "Create your first template to start the shared library."
                : "Try a different search."}
            </p>
            {templates.length === 0 && (
              <button
                type="button"
                onClick={onCreate}
                className="mt-5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                New template
              </button>
            )}
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filtered.map((t) => (
              <li key={t.id} className="flex">
                <article
                  className={classNames(
                    // Lift the open card so its menu is never covered by a neighbour.
                    "relative flex w-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md",
                    menuId === t.id ? "z-20" : "z-0"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onEdit(t)}
                    className="flex flex-1 flex-col p-4 pr-12 text-left"
                  >
                    <h3 className="line-clamp-2 text-sm font-bold text-slate-900">
                      {t.name}
                    </h3>
                    {t.purpose && (
                      <p className="mt-1 line-clamp-2 text-xs font-medium text-brand-700">
                        {t.purpose}
                      </p>
                    )}

                    <p className="mt-3 truncate border-t border-slate-100 pt-3 text-sm">
                      <span className="font-medium text-slate-400">
                        Subject:{" "}
                      </span>
                      {t.subject ? (
                        <span className="text-slate-600">{t.subject}</span>
                      ) : (
                        <span className="text-slate-400">Not set</span>
                      )}
                    </p>

                    {t.body && (
                      <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-slate-500">
                        {t.body}
                      </p>
                    )}
                  </button>

                  <div
                    ref={menuId === t.id ? menuRef : undefined}
                    className="absolute right-2 top-2"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setMenuId((id) => (id === t.id ? null : t.id))
                      }
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      aria-label="Template actions"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {menuId === t.id && (
                      <div className="absolute right-0 top-full mt-1 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                        <button
                          type="button"
                          onClick={() => {
                            setMenuId(null);
                            onEdit(t);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5 text-slate-400" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuId(null);
                            onDelete(t);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
