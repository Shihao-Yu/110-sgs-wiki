"use client";

import { useCallback, useMemo, useRef } from "react";
import type { ReplayData, ReplayAction } from "@/lib/replay";

/* ------------------------------------------------------------------ */
/*  Event classification for color coding                              */
/* ------------------------------------------------------------------ */

type EventKind = "damage" | "heal" | "skill" | "card" | "death";

function classifyAction(action: ReplayAction): EventKind {
  switch (action.type) {
    case "damage":
      return "damage";
    case "death":
      return "damage";
    case "useSkill":
      return "skill";
    case "playCard":
      if (action.card === "peach") return "heal";
      return "card";
    case "response":
      return "card";
    case "drawCards":
      return "card";
    case "discard":
      return "card";
    default:
      return "card";
  }
}

/** Whether this action is "important" enough to show as a prominent marker. */
function isKeyEvent(action: ReplayAction): boolean {
  switch (action.type) {
    case "damage":
    case "death":
    case "useSkill":
      return true;
    case "playCard":
      // Heal cards and multi-target cards are key events
      if (action.card === "peach") return true;
      if (action.targets.length > 1) return true;
      return false;
    default:
      return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Color palette per event kind                                       */
/* ------------------------------------------------------------------ */

const KIND_COLORS: Record<EventKind, { bg: string; ring: string; dot: string }> = {
  damage: {
    bg: "bg-red-500",
    ring: "ring-red-400/40",
    dot: "bg-red-400",
  },
  heal: {
    bg: "bg-emerald-500",
    ring: "ring-emerald-400/40",
    dot: "bg-emerald-400",
  },
  skill: {
    bg: "bg-blue-500",
    ring: "ring-blue-400/40",
    dot: "bg-blue-400",
  },
  card: {
    bg: "bg-slate-400 dark:bg-slate-500",
    ring: "ring-slate-300/40 dark:ring-slate-500/40",
    dot: "bg-slate-400 dark:bg-slate-500",
  },
  death: {
    bg: "bg-red-600",
    ring: "ring-red-500/50",
    dot: "bg-red-500",
  },
};

const KIND_LABELS: Record<EventKind, string> = {
  damage: "Damage",
  heal: "Heal",
  skill: "Skill",
  card: "Card",
  death: "Death",
};

/* ------------------------------------------------------------------ */
/*  Build marker data from replay                                      */
/* ------------------------------------------------------------------ */

interface TimelineMarker {
  /** Step index into the global snapshot timeline. */
  stepIndex: number;
  /** Fractional position along the bar (0..1). */
  position: number;
  kind: EventKind;
  isKey: boolean;
  label: string;
  turnNumber: number;
}

interface TurnBoundary {
  /** Fractional position along the bar (0..1). */
  position: number;
  turnNumber: number;
}

function buildMarkers(replay: ReplayData, totalSteps: number): {
  markers: TimelineMarker[];
  turnBoundaries: TurnBoundary[];
} {
  const markers: TimelineMarker[] = [];
  const turnBoundaries: TurnBoundary[] = [];

  if (totalSteps <= 1) return { markers, turnBoundaries };

  // Step 0 is the initial snapshot. Then each action adds a step.
  // Step count = 1 (initial) + sum(turn actions) + 1 (game over).
  let stepIndex = 1; // start after the initial snapshot

  for (const turn of replay.turns) {
    // Record turn boundary at the first action of each turn
    turnBoundaries.push({
      position: stepIndex / (totalSteps - 1),
      turnNumber: turn.turnNumber,
    });

    for (const action of turn.actions) {
      const kind = classifyAction(action);
      const key = isKeyEvent(action);

      markers.push({
        stepIndex,
        position: stepIndex / (totalSteps - 1),
        kind,
        isKey: key,
        label: actionLabel(action),
        turnNumber: turn.turnNumber,
      });

      stepIndex++;
    }
  }

  return { markers, turnBoundaries };
}

function actionLabel(action: ReplayAction): string {
  switch (action.type) {
    case "damage":
      return `${action.amount} damage`;
    case "death":
      return "Eliminated";
    case "useSkill":
      return `Skill: ${action.skill}`;
    case "playCard":
      return `Play: ${action.card}`;
    case "response":
      return `Response: ${action.card}`;
    case "drawCards":
      return `Draw ${action.count}`;
    case "discard":
      return `Discard ${action.cards.length}`;
    default:
      return "Action";
  }
}

/* ------------------------------------------------------------------ */
/*  Timeline component                                                 */
/* ------------------------------------------------------------------ */

interface TimelineProps {
  replay: ReplayData;
  currentStep: number;
  totalSteps: number;
  onSeek: (step: number) => void;
}

export default function Timeline({
  replay,
  currentStep,
  totalSteps,
  onSeek,
}: TimelineProps) {
  const barRef = useRef<HTMLDivElement>(null);

  const { markers, turnBoundaries } = useMemo(
    () => buildMarkers(replay, totalSteps),
    [replay, totalSteps],
  );

  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  // Click on the bar background to seek
  const handleBarClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = barRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const step = Math.round(fraction * (totalSteps - 1));
      onSeek(step);
    },
    [totalSteps, onSeek],
  );

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/90">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
          Timeline
        </span>
        <div className="mx-1 h-3 w-px bg-slate-200 dark:bg-slate-700" />
        {(["damage", "heal", "skill", "card"] as const).map((kind) => (
          <span key={kind} className="inline-flex items-center gap-1">
            <span
              className={`inline-block h-2 w-2 rounded-full ${KIND_COLORS[kind].dot}`}
            />
            {KIND_LABELS[kind]}
          </span>
        ))}
        <div className="mx-1 h-3 w-px bg-slate-200 dark:bg-slate-700" />
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-px bg-slate-300 dark:bg-slate-600" />
          Turn
        </span>
      </div>

      {/* Timeline bar */}
      <div
        ref={barRef}
        className="group relative h-10 cursor-pointer select-none"
        onClick={handleBarClick}
        role="slider"
        aria-valuenow={currentStep}
        aria-valuemin={0}
        aria-valuemax={totalSteps - 1}
        aria-label="Replay timeline"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            onSeek(Math.min(currentStep + 1, totalSteps - 1));
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            onSeek(Math.max(currentStep - 1, 0));
          }
        }}
      >
        {/* Track background */}
        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-200 dark:bg-slate-700" />

        {/* Progress fill */}
        <div
          className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand/60 transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />

        {/* Turn boundary lines */}
        {turnBoundaries.map((tb) => (
          <div
            key={`turn-${tb.turnNumber}`}
            className="absolute top-0 bottom-0 w-px bg-slate-300/60 dark:bg-slate-600/60"
            style={{ left: `${tb.position * 100}%` }}
          >
            {/* Turn number label (visible on hover) */}
            <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 -translate-y-full rounded bg-slate-700 px-1 py-0.5 text-[9px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-slate-200 dark:text-slate-900">
              T{tb.turnNumber}
            </span>
          </div>
        ))}

        {/* Event markers */}
        {markers.map((marker) => {
          const colors = KIND_COLORS[marker.kind];
          const isActive = marker.stepIndex === currentStep;
          const size = marker.isKey ? "h-3 w-3" : "h-1.5 w-1.5";
          const activeSize = marker.isKey ? "h-4 w-4" : "h-2.5 w-2.5";

          return (
            <button
              key={marker.stepIndex}
              type="button"
              className={[
                "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all",
                isActive
                  ? `${activeSize} ${colors.bg} ring-2 ${colors.ring} z-10`
                  : `${size} ${colors.bg} opacity-70 hover:opacity-100 hover:ring-2 hover:${colors.ring}`,
                marker.isKey ? "z-[5]" : "z-[1]",
              ].join(" ")}
              style={{ left: `${marker.position * 100}%` }}
              onClick={(e) => {
                e.stopPropagation();
                onSeek(marker.stepIndex);
              }}
              title={`Turn ${marker.turnNumber}: ${marker.label}`}
              aria-label={`Jump to turn ${marker.turnNumber}: ${marker.label}`}
            />
          );
        })}

        {/* Current position indicator (playhead) */}
        <div
          className="pointer-events-none absolute top-1/2 z-20 h-5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-slate-900 shadow-sm transition-[left] duration-100 dark:bg-white"
          style={{ left: `${progress}%` }}
        />
      </div>

      {/* Step counter below the bar */}
      <div className="flex items-center justify-between text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
        <span>Start</span>
        <span>
          Step {currentStep + 1} / {totalSteps}
        </span>
        <span>End</span>
      </div>
    </div>
  );
}
