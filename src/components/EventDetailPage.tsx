import { Fragment, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Layers,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import type {
  BookingEvent,
  EventPathway,
  EventPlacement,
  EventSection,
  EventStage,
  Facilitator,
  PlacementStage,
} from "../types";
import {
  EVENT_STAGES,
  EVENT_STAGE_META,
  PLACEMENT_STAGE_META,
} from "../types";
import { classNames } from "../lib/ui";
import { displayName } from "../lib/facilitatorName";
import {
  eventModeStyles,
  eventTypeStyles,
  placementStageStyles,
} from "../lib/eventStyles";
import {
  createPlacement,
  createSection,
  eventNextStep,
  eventStaffing,
  formatEventSchedule,
  patchPlacements,
  pathwayStaffing,
  placementsForSection,
  sectionStaffing,
  sectionsForPathway,
  setPlacementStages,
  stageAtLeast,
  unassignedPlacements,
} from "../lib/eventModel";
import {
  cancelCalendarInvite,
  type CalendarInviteKind,
} from "../lib/googleCalendar";
import { useOutsideDismiss } from "../lib/useOutsideDismiss";
import { EventSectionCard, type PlacementActions } from "./EventSectionCard";
import { PathwayModal, type SectionPlan } from "./PathwayModal";
import { SectionModal } from "./SectionModal";
import { AssignFacilitatorModal } from "./AssignFacilitatorModal";
import { DropFacilitatorModal } from "./DropFacilitatorModal";
import { StageChangeModal } from "./StageChangeModal";
import { CalendarInviteModal } from "./CalendarInviteModal";

interface EventDetailPageProps {
  event: BookingEvent;
  facilitators: Facilitator[];
  onUpdateEvent: (event: BookingEvent) => void;
  onEditEvent: () => void;
}

type PathwayModalState = EventPathway | "new" | null;
type SectionModalState = { pathwayId: string; section: EventSection | null } | null;
type AssignTarget = { pathwayId: string; sectionId: string } | null;

export function EventDetailPage({
  event,
  facilitators,
  onUpdateEvent,
  onEditEvent,
}: EventDetailPageProps) {
  const [pathwayModal, setPathwayModal] = useState<PathwayModalState>(null);
  const [sectionModal, setSectionModal] = useState<SectionModalState>(null);
  const [assignTarget, setAssignTarget] = useState<AssignTarget>(null);
  const [dropTarget, setDropTarget] = useState<EventPlacement | null>(null);
  const [stageChange, setStageChange] = useState<EventStage | null>(null);
  const [calendarInvite, setCalendarInvite] = useState<{
    kind: CalendarInviteKind;
    placements: EventPlacement[];
  } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const facilitatorsById = useMemo(
    () => new Map(facilitators.map((f) => [f.id, f])),
    [facilitators]
  );
  const sectionsById = useMemo(
    () => new Map(event.sections.map((s) => [s.id, s])),
    [event.sections]
  );
  const pathwaysById = useMemo(
    () => new Map(event.pathways.map((p) => [p.id, p])),
    [event.pathways]
  );

  const staffing = eventStaffing(event);
  const nextStep = eventNextStep(event);
  const orphans = unassignedPlacements(event);
  const dateLabel = formatEventSchedule(event);

  function update(patch: Partial<BookingEvent>) {
    onUpdateEvent({ ...event, ...patch, updatedAt: Date.now() });
  }

  /* ---- Pathways ---- */

  function savePathway(pathway: EventPathway, plan: SectionPlan | null) {
    const exists = event.pathways.some((p) => p.id === pathway.id);
    const pathways = exists
      ? event.pathways.map((p) => (p.id === pathway.id ? pathway : p))
      : [...event.pathways, pathway];
    const newSections =
      plan && plan.count > 0
        ? Array.from({ length: plan.count }, (_, i) =>
            createSection(pathway.id, `Section ${i + 1}`, plan.seatsPerSection)
          )
        : [];
    update({ pathways, sections: [...event.sections, ...newSections] });
    setPathwayModal(null);
  }

  function deletePathway(pathway: EventPathway) {
    const sections = sectionsForPathway(event, pathway.id);
    const sectionIds = new Set(sections.map((s) => s.id));
    const affected = event.placements.filter((p) => sectionIds.has(p.sectionId));
    const warning = affected.length
      ? ` This removes ${sections.length} ${sections.length === 1 ? "section" : "sections"} and ${affected.length} facilitator ${affected.length === 1 ? "placement" : "placements"}.`
      : "";
    if (!window.confirm(`Delete the “${pathway.name}” pathway?${warning}`)) return;
    update({
      pathways: event.pathways.filter((p) => p.id !== pathway.id),
      sections: event.sections.filter((s) => !sectionIds.has(s.id)),
      placements: event.placements.filter((p) => !sectionIds.has(p.sectionId)),
    });
  }

  /* ---- Sections ---- */

  function saveSection(section: EventSection) {
    const exists = event.sections.some((s) => s.id === section.id);
    update({
      sections: exists
        ? event.sections.map((s) => (s.id === section.id ? section : s))
        : [...event.sections, section],
    });
    setSectionModal(null);
  }

  function deleteSection(section: EventSection) {
    const affected = placementsForSection(event, section.id);
    const warning = affected.length
      ? ` ${affected.length} facilitator ${affected.length === 1 ? "placement" : "placements"} will be removed with it.`
      : "";
    if (!window.confirm(`Delete “${section.name}”?${warning}`)) return;
    update({
      sections: event.sections.filter((s) => s.id !== section.id),
      placements: event.placements.filter((p) => p.sectionId !== section.id),
    });
  }

  /* ---- Placements ---- */

  function assignFacilitators(target: NonNullable<AssignTarget>, ids: string[]) {
    update({
      placements: [
        ...event.placements,
        ...ids.map((id) =>
          createPlacement(id, target.pathwayId, target.sectionId)
        ),
      ],
    });
    setAssignTarget(null);
  }

  function patchPlacement(id: string, patch: Partial<EventPlacement>) {
    update({
      placements: event.placements.map((p) =>
        p.id === id ? { ...p, ...patch } : p
      ),
    });
  }

  const placementActions: PlacementActions = {
    setStage: (placement, stage) => {
      if (stage === "hold" || stage === "confirmed") {
        setCalendarInvite({
          kind: stage === "hold" ? "hold" : "confirm",
          placements: [placement],
        });
        return;
      }
      patchPlacement(placement.id, { stage });
    },
    requestDrop: (placement) => setDropTarget(placement),
    restore: (placement) =>
      patchPlacement(placement.id, { dropped: false, dropReason: "" }),
    remove: (placement) => {
      const facilitator = facilitatorsById.get(placement.facilitatorId);
      const name = facilitator
        ? displayName(facilitator)
        : "this facilitator";
      if (!window.confirm(`Remove ${name} from this section?`)) return;
      if (placement.calendarEventId) {
        cancelCalendarInvite(placement.calendarEventId).catch(() => {
          /* best-effort — placement still removed locally */
        });
      }
      update({
        placements: event.placements.filter((p) => p.id !== placement.id),
      });
    },
    setNotes: (placement, notes) => patchPlacement(placement.id, { notes }),
    move: (placement, toSectionId) => {
      const section = sectionsById.get(toSectionId);
      if (!section) return;
      patchPlacement(placement.id, {
        sectionId: toSectionId,
        pathwayId: section.pathwayId,
      });
    },
    cancelCalendarInvite: (placement) => {
      if (!placement.calendarEventId) return;
      const facilitator = facilitatorsById.get(placement.facilitatorId);
      const name = facilitator
        ? displayName(facilitator)
        : "this facilitator";
      if (
        !window.confirm(
          `Remove the Google Calendar invite for ${name}? They will get a cancellation notice.`
        )
      ) {
        return;
      }
      const eventId = placement.calendarEventId;
      patchPlacement(placement.id, { calendarEventId: "" });
      cancelCalendarInvite(eventId).catch((err) => {
        window.alert(
          `Could not cancel the calendar invite: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      });
    },
  };

  /* ---- Guided next step ---- */

  function runNextStep() {
    switch (nextStep.kind) {
      case "add_pathway":
        setPathwayModal("new");
        return;
      case "add_section": {
        const pathway = event.pathways[0];
        if (pathway) setSectionModal({ pathwayId: pathway.id, section: null });
        return;
      }
      case "assign": {
        const section = event.sections.find(
          (s) => sectionStaffing(event, s).openSeats > 0
        );
        if (section) {
          setAssignTarget({
            pathwayId: section.pathwayId,
            sectionId: section.id,
          });
        }
        return;
      }
      case "mark_likely":
        setStageChange("likely");
        return;
      case "mark_contracted":
        setStageChange("contracted");
        return;
      case "mark_delivered":
        setStageChange("delivered");
        return;
      case "send_holds":
        onUpdateEvent(setPlacementStages(event, nextStep.placementIds, "hold"));
        return;
      case "confirm_holds":
        onUpdateEvent(
          setPlacementStages(event, nextStep.placementIds, "confirmed")
        );
        return;
      case "request_contracts":
        onUpdateEvent(
          setPlacementStages(event, nextStep.placementIds, "contracted")
        );
        return;
      default:
    }
  }

  function applyStageChange(to: EventStage) {
    update({ stage: to });
    setStageChange(null);
  }

  /* ---- Assign modal context ---- */

  const assignContext = useMemo(() => {
    if (!assignTarget) return null;
    const section = sectionsById.get(assignTarget.sectionId);
    const pathway = pathwaysById.get(assignTarget.pathwayId);
    if (!section || !pathway) return null;

    const placedElsewhere = new Map<string, string[]>();
    for (const placement of event.placements) {
      if (placement.dropped || placement.sectionId === section.id) continue;
      const other = sectionsById.get(placement.sectionId);
      if (!other) continue;
      const otherPathway = pathwaysById.get(other.pathwayId);
      const label = otherPathway
        ? `${otherPathway.name} · ${other.name}`
        : other.name;
      const existing = placedElsewhere.get(placement.facilitatorId) ?? [];
      placedElsewhere.set(placement.facilitatorId, [...existing, label]);
    }

    return {
      section,
      pathway,
      placedElsewhere,
      alreadyInSection: new Set(
        placementsForSection(event, section.id)
          .filter((p) => !p.dropped)
          .map((p) => p.facilitatorId)
      ),
      openSeats: sectionStaffing(event, section).openSeats,
    };
  }, [assignTarget, event, sectionsById, pathwaysById]);

  const dropFacilitator = dropTarget
    ? facilitatorsById.get(dropTarget.facilitatorId)
    : null;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      {/* Summary + pipeline */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-start gap-2">
              <h1 className="min-w-0 truncate text-xl font-bold text-slate-900">
                {event.accountSchool}
              </h1>
              <button
                type="button"
                onClick={onEditEvent}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            </div>
            {dateLabel ? (
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                {dateLabel}
              </p>
            ) : (
              <button
                type="button"
                onClick={onEditEvent}
                className="mt-1 flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:underline"
              >
                <CalendarDays className="h-4 w-4" />
                Add schedule to enable calendar invites
              </button>
            )}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <Chip className={eventTypeStyles[event.eventType]}>
                {event.eventType}
              </Chip>
              <Chip className={eventModeStyles[event.eventMode]}>
                {event.eventMode}
              </Chip>
            </div>
            {event.notes.trim() && (
              <p className="mt-3 max-w-2xl text-sm text-slate-600">
                {event.notes}
              </p>
            )}
          </div>
          <StaffingSummary staffing={staffing} />
        </div>

        <StageRail stage={event.stage} onSelect={setStageChange} />

        <NextStepBanner nextStep={nextStep} onRun={runNextStep} />
      </section>

      {/* Staffing board */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Layers className="h-4 w-4 text-slate-400" />
          Staffing plan
        </h2>
        <button
          type="button"
          onClick={() => setPathwayModal("new")}
          className="flex items-center gap-1.5 rounded-lg border border-brand-600 bg-white px-3 py-1.5 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
        >
          <Plus className="h-4 w-4" />
          Add pathway
        </button>
      </div>

      {event.pathways.length === 0 ? (
        <EmptyBoard onAddPathway={() => setPathwayModal("new")} />
      ) : (
        <div className="mt-4 flex flex-col gap-6">
          {event.pathways.map((pathway) => (
            <PathwayRow
              key={pathway.id}
              event={event}
              pathway={pathway}
              facilitatorsById={facilitatorsById}
              actions={placementActions}
              draggingId={draggingId}
              onDragStateChange={setDraggingId}
              onEditPathway={() => setPathwayModal(pathway)}
              onDeletePathway={() => deletePathway(pathway)}
              onAddSection={() =>
                setSectionModal({ pathwayId: pathway.id, section: null })
              }
              onEditSection={(section) =>
                setSectionModal({ pathwayId: pathway.id, section })
              }
              onDeleteSection={deleteSection}
              onAssign={(sectionId) =>
                setAssignTarget({ pathwayId: pathway.id, sectionId })
              }
            />
          ))}
        </div>
      )}

      {orphans.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">
            {orphans.length} placement{orphans.length === 1 ? "" : "s"} without a
            section
          </p>
          <p className="mt-0.5 text-sm text-amber-800">
            Their section was deleted. Remove them or recreate the section to put
            them back on the board.
          </p>
          <button
            type="button"
            onClick={() =>
              update({
                placements: event.placements.filter(
                  (p) => !orphans.some((o) => o.id === p.id)
                ),
              })
            }
            className="mt-2 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100"
          >
            Clear them
          </button>
        </div>
      )}

      {/* Modals */}
      {pathwayModal && (
        <PathwayModal
          initial={pathwayModal === "new" ? null : pathwayModal}
          existingNames={event.pathways
            .filter((p) => pathwayModal === "new" || p.id !== pathwayModal.id)
            .map((p) => p.name)}
          onClose={() => setPathwayModal(null)}
          onSave={savePathway}
        />
      )}

      {sectionModal && pathwaysById.get(sectionModal.pathwayId) && (
        <SectionModal
          pathwayId={sectionModal.pathwayId}
          pathwayName={pathwaysById.get(sectionModal.pathwayId)!.name}
          initial={sectionModal.section}
          existingNames={sectionsForPathway(event, sectionModal.pathwayId)
            .filter((s) => s.id !== sectionModal.section?.id)
            .map((s) => s.name)}
          onClose={() => setSectionModal(null)}
          onSave={saveSection}
        />
      )}

      {assignTarget && assignContext && (
        <AssignFacilitatorModal
          pathwayName={assignContext.pathway.name}
          sectionName={assignContext.section.name}
          openSeats={assignContext.openSeats}
          facilitators={facilitators}
          placedElsewhere={assignContext.placedElsewhere}
          alreadyInSection={assignContext.alreadyInSection}
          onClose={() => setAssignTarget(null)}
          onAssign={(ids) => assignFacilitators(assignTarget, ids)}
        />
      )}

      {stageChange && (
        <StageChangeModal
          eventName={event.accountSchool}
          from={event.stage}
          to={stageChange}
          placedCount={staffing.assigned}
          awaitingHoldCount={
            event.placements.filter(
              (p) => !p.dropped && !stageAtLeast(p.stage, "hold")
            ).length
          }
          awaitingConfirmCount={
            event.placements.filter(
              (p) => !p.dropped && !stageAtLeast(p.stage, "confirmed")
            ).length
          }
          onClose={() => setStageChange(null)}
          onConfirm={() => applyStageChange(stageChange)}
        />
      )}

      {dropTarget && (
        <DropFacilitatorModal
          facilitatorName={
            dropFacilitator
              ? displayName(dropFacilitator)
              : "This facilitator"
          }
          sectionName={sectionsById.get(dropTarget.sectionId)?.name ?? "section"}
          initialReason={dropTarget.dropReason}
          onClose={() => setDropTarget(null)}
          onConfirm={(reason) => {
            if (dropTarget.calendarEventId) {
              cancelCalendarInvite(dropTarget.calendarEventId).catch(() => {
                /* best-effort */
              });
            }
            patchPlacement(dropTarget.id, {
              dropped: true,
              dropReason: reason,
              calendarEventId: "",
            });
            setDropTarget(null);
          }}
        />
      )}

      {calendarInvite && (
        <CalendarInviteModal
          event={event}
          kind={calendarInvite.kind}
          placements={calendarInvite.placements}
          facilitatorsById={facilitatorsById}
          onClose={() => setCalendarInvite(null)}
          onEditSchedule={() => {
            setCalendarInvite(null);
            onEditEvent();
          }}
          onStatusOnly={(ids) => {
            onUpdateEvent(
              setPlacementStages(
                event,
                ids,
                calendarInvite.kind === "hold" ? "hold" : "confirmed"
              )
            );
          }}
          onInvitesSent={(patches) => {
            onUpdateEvent(patchPlacements(event, patches));
          }}
        />
      )}
    </div>
  );
}

/* ---- Pieces ---- */

function Chip({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        className
      )}
    >
      {children}
    </span>
  );
}

function StaffingSummary({
  staffing,
}: {
  staffing: ReturnType<typeof eventStaffing>;
}) {
  const pct =
    staffing.seatsNeeded > 0
      ? Math.min(100, (staffing.assigned / staffing.seatsNeeded) * 100)
      : 0;

  const stageChips: Array<{
    stage: PlacementStage;
    count: number;
  }> = [
    { stage: "proposed", count: staffing.proposed },
    { stage: "availability", count: staffing.availability },
    { stage: "hold", count: staffing.held },
    { stage: "confirmed", count: staffing.confirmedExact },
    { stage: "contracted", count: staffing.contracted },
  ];

  return (
    <div className="w-64 shrink-0">
      <p className="text-sm text-slate-500">
        {staffing.seatsNeeded > 0 ? (
          <>
            <span className="font-semibold text-slate-800">
              {staffing.assigned} of {staffing.seatsNeeded}
            </span>{" "}
            seats filled
          </>
        ) : (
          <>
            <span className="font-semibold text-slate-800">
              {staffing.assigned}
            </span>{" "}
            facilitators placed
          </>
        )}
      </p>
      {staffing.seatsNeeded > 0 && (
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={classNames(
              "h-full rounded-full transition-all",
              staffing.openSeats === 0 ? "bg-emerald-500" : "bg-amber-400"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {stageChips.map(
          ({ stage, count }) =>
            count > 0 && (
              <Chip key={stage} className={placementStageStyles[stage]}>
                {count} {PLACEMENT_STAGE_META[stage].short}
              </Chip>
            )
        )}
        {staffing.dropped > 0 && (
          <Chip className="bg-rose-50 text-rose-700 ring-rose-600/20">
            {staffing.dropped} dropped
          </Chip>
        )}
      </div>
    </div>
  );
}

function StageRail({
  stage,
  onSelect,
}: {
  stage: EventStage;
  onSelect: (stage: EventStage) => void;
}) {
  const currentIndex = EVENT_STAGES.indexOf(stage);

  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {EVENT_STAGES.map((s, i) => {
          const isCurrent = i === currentIndex;
          const isDone = i < currentIndex;
          return (
            <Fragment key={s}>
              {i > 0 && (
                <span
                  className={classNames(
                    "h-px w-4",
                    i <= currentIndex ? "bg-brand-300" : "bg-slate-200"
                  )}
                />
              )}
              <button
                type="button"
                onClick={() => {
                  if (!isCurrent) onSelect(s);
                }}
                aria-current={isCurrent ? "step" : undefined}
                title={EVENT_STAGE_META[s].description}
                className={classNames(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                  isCurrent
                    ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                    : isDone
                      ? "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                )}
              >
                {EVENT_STAGE_META[s].short}
              </button>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function NextStepBanner({
  nextStep,
  onRun,
}: {
  nextStep: ReturnType<typeof eventNextStep>;
  onRun: () => void;
}) {
  const actionable = Boolean(nextStep.actionLabel);
  return (
    <div
      className={classNames(
        "mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3",
        actionable
          ? "border-brand-200 bg-brand-50/60"
          : "border-slate-200 bg-slate-50"
      )}
    >
      <div className="min-w-0">
        <p
          className={classNames(
            "text-sm font-semibold",
            actionable ? "text-brand-800" : "text-slate-700"
          )}
        >
          {nextStep.title}
        </p>
        <p className="mt-0.5 max-w-2xl text-sm text-slate-600">
          {nextStep.detail}
        </p>
      </div>
      {nextStep.actionLabel && (
        <button
          type="button"
          onClick={onRun}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          {nextStep.actionLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function PathwayRow({
  event,
  pathway,
  facilitatorsById,
  actions,
  draggingId,
  onDragStateChange,
  onEditPathway,
  onDeletePathway,
  onAddSection,
  onEditSection,
  onDeleteSection,
  onAssign,
}: {
  event: BookingEvent;
  pathway: EventPathway;
  facilitatorsById: Map<string, Facilitator>;
  actions: PlacementActions;
  draggingId: string | null;
  onDragStateChange: (id: string | null) => void;
  onEditPathway: () => void;
  onDeletePathway: () => void;
  onAddSection: () => void;
  onEditSection: (section: EventSection) => void;
  onDeleteSection: (section: EventSection) => void;
  onAssign: (sectionId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useOutsideDismiss(menuOpen, () => setMenuOpen(false), menuRef);

  const sections = sectionsForPathway(event, pathway.id);
  const staffing = pathwayStaffing(event, pathway.id);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900">
            {pathway.name}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {sections.length} {sections.length === 1 ? "section" : "sections"}
            {" · "}
            {staffing.seatsNeeded > 0
              ? `${staffing.assigned} of ${staffing.seatsNeeded} seats filled`
              : `${staffing.assigned} placed`}
            {pathway.notes.trim() && (
              <>
                <span className="text-slate-300"> · </span>
                {pathway.notes}
              </>
            )}
          </p>
        </div>
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            className={classNames(
              "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
              menuOpen
                ? "bg-slate-100 text-slate-800"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            )}
          >
            Manage
            <ChevronDown
              className={classNames(
                "h-4 w-4 transition-transform",
                menuOpen && "rotate-180"
              )}
            />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 z-20 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onAddSection();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
                Add section
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEditPathway();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                Edit pathway
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDeletePathway();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete pathway
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <EventSectionCard
            key={section.id}
            event={event}
            section={section}
            facilitatorsById={facilitatorsById}
            actions={actions}
            draggingId={draggingId}
            onDragStateChange={onDragStateChange}
            onEdit={() => onEditSection(section)}
            onDelete={() => onDeleteSection(section)}
            onAssign={() => onAssign(section.id)}
          />
        ))}
        <button
          type="button"
          onClick={onAddSection}
          className="flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-slate-300 bg-white/50 px-4 py-6 text-sm font-medium text-slate-400 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-700"
        >
          <Plus className="h-5 w-5" />
          Add section
        </button>
      </div>
    </section>
  );
}

function EmptyBoard({ onAddPathway }: { onAddPathway: () => void }) {
  return (
    <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Layers className="h-6 w-6" />
      </div>
      <p className="mt-3 text-sm font-medium text-slate-700">
        No pathways yet
      </p>
      <p className="mt-1 max-w-md text-sm text-slate-400">
        Start by adding the pathways this event runs — like Math K-5 or
        Leadership. Each pathway breaks into sections, and facilitators are
        assigned to the sections they'll lead.
      </p>
      <button
        type="button"
        onClick={onAddPathway}
        className="mt-4 flex items-center gap-2 rounded-lg border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
      >
        <Plus className="h-4 w-4" />
        Add your first pathway
      </button>
    </div>
  );
}
