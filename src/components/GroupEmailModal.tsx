import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  FileText,
  Mail,
  Search,
  X,
} from "lucide-react";
import type { EmailTemplate, Facilitator } from "../types";
import { classNames } from "../lib/ui";
import {
  isGmailConfigured,
  partitionGroupRecipients,
  sendGroupEmail,
} from "../lib/gmail";
import { useHeadshotSrc } from "../lib/useHeadshot";
import { useOutsideDismiss } from "../lib/useOutsideDismiss";
import { Avatar } from "./Avatar";

interface GroupEmailModalProps {
  /** Display name for the audience (group name, school/event, etc.). */
  audienceName: string;
  /** Modal heading — defaults to "Email group". */
  title?: string;
  members: Facilitator[];
  templates: EmailTemplate[];
  /** Signed-in user's email — used as From / To (copy). */
  senderEmail: string;
  onClose: () => void;
}

type SendState = "idle" | "sending" | "sent";

/**
 * Compose and send a plain-text email to facilitators via the user's Gmail.
 * Recipients are BCC'd so addresses stay private; the sender gets a To copy.
 */
export function GroupEmailModal({
  audienceName,
  title = "Email group",
  members,
  templates,
  senderEmail,
  onClose,
}: GroupEmailModalProps) {
  const { withEmail, withoutEmail } = useMemo(
    () => partitionGroupRecipients(members),
    [members]
  );

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(withEmail.map((r) => r.facilitator.id))
  );
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [showSkipped, setShowSkipped] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateQuery, setTemplateQuery] = useState("");
  const templateMenuRef = useRef<HTMLDivElement>(null);

  useOutsideDismiss(templateOpen, () => setTemplateOpen(false), templateMenuRef);

  const filteredTemplates = useMemo(() => {
    const q = templateQuery.trim().toLowerCase();
    let list = [...templates];
    if (q) {
      list = list.filter((t) =>
        `${t.name} ${t.purpose} ${t.subject}`.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [templates, templateQuery]);

  function applyTemplate(t: EmailTemplate) {
    const hasDraft = subject.trim().length > 0 || body.trim().length > 0;
    if (
      hasDraft &&
      !window.confirm(
        `Replace the current subject and message with “${t.name}”?`
      )
    ) {
      return;
    }
    setSubject(t.subject);
    setBody(t.body);
    setTemplateOpen(false);
    setTemplateQuery("");
  }

  const selectedRecipients = withEmail.filter((r) =>
    selected.has(r.facilitator.id)
  );
  const canSend =
    isGmailConfigured &&
    selectedRecipients.length > 0 &&
    subject.trim().length > 0 &&
    sendState === "idle";

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(withEmail.map((r) => r.facilitator.id)));
  }

  function selectNone() {
    setSelected(new Set());
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    setError(null);
    setSendState("sending");
    try {
      await sendGroupEmail({
        from: senderEmail,
        bcc: selectedRecipients.map((r) => r.email),
        subject: subject.trim(),
        body,
      });
      setSendState("sent");
    } catch (err) {
      setSendState("idle");
      setError(err instanceof Error ? err.message : "Failed to send email.");
    }
  }

  if (sendState === "sent") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
        <div
          role="dialog"
          aria-labelledby="group-email-sent-title"
          className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check className="h-6 w-6" />
            </div>
            <h2
              id="group-email-sent-title"
              className="text-base font-bold text-slate-900"
            >
              Email sent
            </h2>
            <p className="text-sm text-slate-500">
              Sent to {selectedRecipients.length} facilitator
              {selectedRecipients.length === 1 ? "" : "s"} in “{audienceName}”.
              A copy is in your Gmail inbox.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form
        role="dialog"
        aria-labelledby="group-email-title"
        onSubmit={(e) => void handleSend(e)}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2
              id="group-email-title"
              className="text-base font-bold text-slate-900"
            >
              {title}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Message “{audienceName}” from {senderEmail}. Recipients are BCC’d.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          {!isGmailConfigured && (
            <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Google isn’t configured yet. Set{" "}
                <code className="rounded bg-amber-100 px-1 text-xs">
                  VITE_GOOGLE_CLIENT_ID
                </code>{" "}
                and enable the Gmail API (see SETUP-GOOGLE-SHEETS.md).
              </p>
            </div>
          )}

          {withEmail.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              None of the facilitators in this group have an email address on
              file. Add an UnboundEd or personal email to their profiles first.
            </div>
          ) : (
            <>
              {templates.length > 0 && (
                <div ref={templateMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setTemplateOpen((v) => !v)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-100"
                  >
                    <span className="flex items-center gap-2 text-slate-700">
                      <FileText className="h-4 w-4 text-brand-600" />
                      <span className="font-medium">Use template</span>
                      <span className="text-slate-400">
                        — fill subject & message from the library
                      </span>
                    </span>
                    <ChevronDown
                      className={classNames(
                        "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                        templateOpen && "rotate-180"
                      )}
                    />
                  </button>
                  {templateOpen && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                      <div className="relative border-b border-slate-100 p-2">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          value={templateQuery}
                          onChange={(e) => setTemplateQuery(e.target.value)}
                          placeholder="Search templates…"
                          autoFocus
                          className="w-full rounded-md border border-slate-200 py-1.5 pl-8 pr-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-100"
                        />
                      </div>
                      <ul className="max-h-52 overflow-y-auto py-1">
                        {filteredTemplates.length === 0 ? (
                          <li className="px-3 py-3 text-center text-xs text-slate-400">
                            No matching templates
                          </li>
                        ) : (
                          filteredTemplates.map((t) => (
                            <li key={t.id}>
                              <button
                                type="button"
                                onClick={() => applyTemplate(t)}
                                className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-brand-50"
                              >
                                <span className="text-sm font-medium text-slate-800">
                                  {t.name}
                                </span>
                                {t.purpose && (
                                  <span className="truncate text-xs text-brand-700">
                                    {t.purpose}
                                  </span>
                                )}
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Recipients ({selectedRecipients.length} of{" "}
                    {withEmail.length})
                  </span>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      Select all
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={selectNone}
                      className="font-medium text-slate-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <ul className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                  {withEmail.map(({ facilitator: f, email }) => (
                    <RecipientRow
                      key={f.id}
                      facilitator={f}
                      email={email}
                      checked={selected.has(f.id)}
                      onToggle={() => toggle(f.id)}
                    />
                  ))}
                </ul>
              </div>

              {withoutEmail.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => setShowSkipped((v) => !v)}
                    className="flex w-full items-start gap-2 text-left"
                    aria-expanded={showSkipped}
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-amber-900">
                        {withoutEmail.length} facilitator
                        {withoutEmail.length === 1 ? "" : "s"} won’t get this
                        email
                      </span>
                      <span className="mt-0.5 block text-xs text-amber-800/80">
                        No UnboundEd or personal email on their profile
                        {showSkipped ? "" : " — click to see who"}.
                      </span>
                    </span>
                    <ChevronDown
                      className={classNames(
                        "mt-0.5 h-4 w-4 shrink-0 text-amber-600 transition-transform",
                        showSkipped && "rotate-180"
                      )}
                    />
                  </button>
                  {showSkipped && (
                    <ul className="mt-2 space-y-1.5 border-t border-amber-200/80 pt-2">
                      {withoutEmail.map((f) => (
                        <SkippedRow key={f.id} facilitator={f} />
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Subject
                </span>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Milwaukee SI logistics"
                  autoFocus
                  maxLength={200}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Message
                </span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message…"
                  rows={8}
                  className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </label>
            </>
          )}

          {error && (
            <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSend}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Mail className="h-4 w-4" />
            {sendState === "sending"
              ? "Sending…"
              : `Send to ${selectedRecipients.length || "…"}`}
          </button>
        </div>
      </form>
    </div>
  );
}

function RecipientRow({
  facilitator,
  email,
  checked,
  onToggle,
}: {
  facilitator: Facilitator;
  email: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const fullName = `${facilitator.firstName} ${facilitator.lastName}`;
  const headshotSrc = useHeadshotSrc(
    facilitator.id,
    facilitator.hasStoredHeadshot,
    facilitator.headshot
  );

  return (
    <li>
      <label
        className={classNames(
          "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition-colors",
          checked ? "bg-brand-50" : "hover:bg-slate-50"
        )}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        <Avatar
          src={headshotSrc || undefined}
          alt={fullName}
          boxClassName="h-8 w-8 shrink-0 rounded-full ring-1 ring-slate-200"
          iconClassName="h-4 w-4"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-slate-800">
            {fullName}
          </span>
          <span className="block truncate text-xs text-slate-500">{email}</span>
        </span>
      </label>
    </li>
  );
}

function SkippedRow({ facilitator }: { facilitator: Facilitator }) {
  const fullName = `${facilitator.firstName} ${facilitator.lastName}`;
  const headshotSrc = useHeadshotSrc(
    facilitator.id,
    facilitator.hasStoredHeadshot,
    facilitator.headshot
  );

  return (
    <li className="flex items-center gap-2.5 pl-6">
      <Avatar
        src={headshotSrc || undefined}
        alt={fullName}
        boxClassName="h-7 w-7 shrink-0 rounded-full ring-1 ring-amber-200"
        iconClassName="h-3.5 w-3.5"
      />
      <span className="truncate text-sm font-medium text-amber-950">
        {fullName}
      </span>
    </li>
  );
}
