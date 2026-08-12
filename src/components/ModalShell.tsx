import { X } from "lucide-react";
import { classNames } from "../lib/ui";

interface ModalShellProps {
  title: string;
  description?: string;
  /** Unique id tying the heading to the dialog for screen readers. */
  labelledById: string;
  widthClass?: string;
  onClose: () => void;
  onSubmit?: (e: React.FormEvent) => void;
  footer: React.ReactNode;
  children: React.ReactNode;
}

/** Shared dialog chrome: overlay, header with close button, body, footer. */
export function ModalShell({
  title,
  description,
  labelledById,
  widthClass = "max-w-md",
  onClose,
  onSubmit,
  footer,
  children,
}: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form
        role="dialog"
        aria-labelledby={labelledById}
        onSubmit={onSubmit ?? ((e) => e.preventDefault())}
        className={classNames(
          "flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl",
          widthClass
        )}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id={labelledById} className="text-base font-bold text-slate-900">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-sm text-slate-500">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
          {footer}
        </div>
      </form>
    </div>
  );
}

export function ModalCancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
    >
      Cancel
    </button>
  );
}

export function ModalSubmitButton({
  label,
  disabled,
  danger,
}: {
  label: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={classNames(
        "rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        danger
          ? "bg-rose-600 hover:bg-rose-700"
          : "bg-brand-600 hover:bg-brand-700"
      )}
    >
      {label}
    </button>
  );
}

/** Label + control wrapper used by the event form dialogs. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {hint && (
          <span className="ml-1 font-normal normal-case text-slate-400">
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100";
