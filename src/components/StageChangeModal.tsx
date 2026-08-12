import { ArrowRight, TriangleAlert } from "lucide-react";
import type { EventStage } from "../types";
import { EVENT_STAGES, EVENT_STAGE_META } from "../types";
import { classNames } from "../lib/ui";
import { eventStageStyles } from "../lib/eventStyles";
import { ModalCancelButton, ModalShell, ModalSubmitButton } from "./ModalShell";

interface StageChangeModalProps {
  eventName: string;
  from: EventStage;
  to: EventStage;
  /** Facilitators currently placed and not dropped. */
  placedCount: number;
  /** Placements that have not reached a calendar hold yet. */
  awaitingHoldCount: number;
  /** Placements holding but not yet reconfirmed. */
  awaitingConfirmCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Moving an event forward kicks off real outreach, so every stage change is
 * confirmed and spells out what it commits the team to.
 */
export function StageChangeModal({
  eventName,
  from,
  to,
  placedCount,
  awaitingHoldCount,
  awaitingConfirmCount,
  onClose,
  onConfirm,
}: StageChangeModalProps) {
  const goingBack = EVENT_STAGES.indexOf(to) < EVENT_STAGES.indexOf(from);
  const effects = describeEffects({
    to,
    placedCount,
    awaitingHoldCount,
    awaitingConfirmCount,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onConfirm();
  }

  return (
    <ModalShell
      labelledById="stage-change-title"
      title={
        goingBack
          ? `Move back to ${EVENT_STAGE_META[to].label}?`
          : `Ready to move to ${EVENT_STAGE_META[to].label}?`
      }
      description={eventName}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <ModalCancelButton onClick={onClose} />
          <ModalSubmitButton
            label={goingBack ? "Move back" : "Yes, move forward"}
            danger={goingBack}
          />
        </>
      }
    >
      <div className="flex flex-col gap-4 px-5 py-4">
        <div className="flex items-center gap-2">
          <StageChip stage={from} muted />
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
          <StageChip stage={to} />
        </div>

        <p className="text-sm text-slate-600">{EVENT_STAGE_META[to].description}</p>

        {goingBack && (
          <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-900">
              Holds and confirms already sent stay exactly as they are. If
              outreach needs to be walked back, update each facilitator by hand.
            </p>
          </div>
        )}

        {effects.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              What this means
            </p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {effects.map((effect) => (
                <li
                  key={effect}
                  className="flex gap-2 text-sm leading-snug text-slate-600"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                  {effect}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function StageChip({ stage, muted }: { stage: EventStage; muted?: boolean }) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        muted
          ? "bg-slate-100 text-slate-500 ring-slate-500/20"
          : eventStageStyles[stage]
      )}
    >
      {EVENT_STAGE_META[stage].label}
    </span>
  );
}

function describeEffects({
  to,
  placedCount,
  awaitingHoldCount,
  awaitingConfirmCount,
}: {
  to: EventStage;
  placedCount: number;
  awaitingHoldCount: number;
  awaitingConfirmCount: number;
}): string[] {
  const people = (n: number) => `${n} ${n === 1 ? "facilitator" : "facilitators"}`;

  switch (to) {
    case "likely":
      return [
        placedCount === 0
          ? "Fill every open seat, then send those facilitators a calendar HOLD."
          : `Send a calendar HOLD to ${people(awaitingHoldCount || placedCount)}.`,
        "Nothing is committed yet — holds only protect the date.",
      ];
    case "contracted":
      return [
        placedCount === 0
          ? "Staff the event, then confirm each facilitator and request their contract."
          : `Ask ${people(awaitingConfirmCount || placedCount)} to reconfirm they're still available, then turn each HOLD into a CONFIRM.`,
        "After that, request a facilitator contract for everyone confirmed.",
      ];
    case "delivered":
      return [
        "The event is treated as run and complete.",
        "Staffing stays on record as who facilitated.",
      ];
    default:
      return [
        "Facilitator outreach should pause until the booking firms up again.",
      ];
  }
}
